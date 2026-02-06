import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCloudUploadAlt, FaPlus, FaEdit, FaCheckCircle, FaExclamationTriangle, FaFlag, FaPaperPlane, FaPhone, FaEnvelope, FaClock, FaFileInvoiceDollar, FaComments, FaExternalLinkAlt, FaCalendarAlt, FaTrashAlt, FaDownload, FaTrash, FaTimes } from 'react-icons/fa';
import PartnerSelectionModal from '../components/modals/PartnerSelectionModal';
import NewProjectModal from '../components/modals/NewProjectModal';
import FileUploadModal from '../components/modals/FileUploadModal';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import Input from '../components/common/Input';
import Checkbox from '../components/common/Checkbox';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, invoiceService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';

interface ProjectPosition {
    id: string;
    description: string;
    amount: string;
    unit: string;
    quantity: string;
    partnerRate: string;
    partnerMode: string;
    partnerTotal: string;
    customerRate: string;
    customerTotal: string;
    customerMode: string;
    marginType: string;
    marginPercent: string;
}

interface ProjectFile {
    id: string;
    name: string;
    ext: string;
    type: string;
    version: string;
    size: string;
    words: number;
    chars: number;
    createdAt: string;
    status: string;
}

interface ProjectData {
    id: string;
    name: string;
    client: string;
    customer_id?: number;
    source: string;
    target: string;
    progress: number;
    status: string;
    priority: string;
    due: string;
    isCertified: boolean;
    hasApostille: boolean;
    isExpress: boolean;
    classification: string;
    copies: number;
    copyPrice: number;
    docType: string[];
    translator: {
        name: string;
        email: string;
        initials: string;
        phone: string;
    };
    documentsSent: boolean;
    pm: string;
    createdAt: string;
    positions: ProjectPosition[];
    downPayment: number;
    downPaymentNote?: string;
    downPaymentDate?: string;
    downPaymentMethod?: string;
    notes: string;
    files: ProjectFile[];
    [key: string]: any;
}

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

    // Inline Editing State
    const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
    const [projectMessages, setProjectMessages] = useState<any[]>([
        { id: '1', from: 'Admin', message: 'Projekt wurde erstellt und Partner zugewiesen.', timestamp: '01.02.2024 10:30' },
        { id: '2', from: 'Sabine Müller', message: 'Dokumente erhalten, beginne mit der Übersetzung.', timestamp: '02.02.2024 09:15' }
    ]);
    const [newMessage, setNewMessage] = useState('');

    // Comprehensive Project State
    const [projectData, setProjectData] = useState<ProjectData | null>(null);

    const { data: projectResponse, isLoading, error } = useQuery({
        queryKey: ['projects', id],
        queryFn: () => projectService.getById(id!),
        enabled: !!id
    });

    useEffect(() => {
        if (projectResponse) {
            // Map backend data to frontend structure
            const mapped: ProjectData = {
                id: projectResponse.id.toString(),
                name: projectResponse.project_name || '',
                client: projectResponse.customer?.company_name || `${projectResponse.customer?.first_name} ${projectResponse.customer?.last_name}` || 'Unbekannter Kunde',
                customer_id: projectResponse.customer_id,
                source: projectResponse.source_language?.iso_code?.split('-')[0] || projectResponse.source || 'de',
                target: projectResponse.target_language?.iso_code?.split('-')[0] || projectResponse.target || 'en',
                progress: projectResponse.progress || 0,
                status: projectResponse.status || 'draft',
                priority: projectResponse.priority || 'medium',
                due: projectResponse.deadline || projectResponse.due || '',
                isCertified: !!projectResponse.is_certified,
                hasApostille: !!projectResponse.has_apostille,
                isExpress: !!projectResponse.is_express,
                classification: projectResponse.classification ? 'ja' : 'nein',
                copies: projectResponse.copies_count || 0,
                copyPrice: parseFloat(projectResponse.copy_price) || 5,
                docType: projectResponse.document_type ? [projectResponse.document_type.name] : [],
                translator: projectResponse.partner ? {
                    name: projectResponse.partner.company || `${projectResponse.partner.first_name} ${projectResponse.partner.last_name}`,
                    email: projectResponse.partner.email,
                    initials: ((projectResponse.partner.first_name?.[0] || '') + (projectResponse.partner.last_name?.[0] || 'P')).toUpperCase(),
                    phone: projectResponse.partner.phone || ''
                } : {
                    name: '-',
                    email: '',
                    initials: '?',
                    phone: ''
                },
                documentsSent: !!projectResponse.documents_sent,
                pm: projectResponse.pm?.name || 'Admin',
                createdAt: new Date(projectResponse.created_at).toLocaleDateString('de-DE'),
                positions: (projectResponse.positions || []).map((p: any) => ({
                    id: p.id.toString(),
                    description: p.description,
                    amount: p.amount?.toString() || '0',
                    unit: p.unit,
                    quantity: p.quantity?.toString() || '1',
                    partnerRate: p.partner_rate?.toString() || '0',
                    partnerMode: p.partner_mode,
                    partnerTotal: p.partner_total?.toString() || '0',
                    customerRate: p.customer_rate?.toString() || '0',
                    customerTotal: p.customer_total?.toString() || '0',
                    customerMode: p.customer_mode,
                    marginType: p.margin_type,
                    marginPercent: p.margin_percent?.toString() || '0'
                })),
                downPayment: parseFloat(projectResponse.down_payment) || 0,
                downPaymentNote: projectResponse.down_payment_note || '',
                downPaymentDate: projectResponse.down_payment_date || '',
                downPaymentMethod: projectResponse.down_payment_method || 'Überweisung',
                notes: projectResponse.notes || '',
                files: (projectResponse.files || []).map((f: any) => ({
                    id: f.id.toString(),
                    name: f.file_name,
                    ext: (f.file_name || '').split('.').pop()?.toUpperCase() || '',
                    type: f.type,
                    version: f.version || '1.0',
                    size: f.file_size || '0 KB',
                    words: f.word_count || 0,
                    chars: f.char_count || 0,
                    createdAt: new Date(f.created_at).toLocaleString('de-DE'),
                    status: f.status
                }))
            };
            setProjectData(mapped);
        }
    }, [projectResponse]);

    // Derived Calculations
    const financials = useMemo(() => {
        if (!projectData) return {
            partnerTotal: 0,
            positionsTotal: 0,
            extraTotal: 0,
            netTotal: 0,
            tax: 0,
            grossTotal: 0,
            profit: 0,
            margin: 0
        };

        const posP = projectData.positions.reduce((sum: number, p: any) => sum + (parseFloat(p.partnerTotal) || 0), 0);
        const posC = projectData.positions.reduce((sum: number, p: any) => sum + (parseFloat(p.customerTotal) || 0), 0);

        const extra = (projectData.isCertified ? 5 : 0) +
            (projectData.hasApostille ? 15 : 0) +
            (projectData.isExpress ? 15 : 0) +
            (projectData.classification === 'ja' ? 15 : 0) +
            ((projectData.copies || 0) * (projectData.copyPrice || 0));

        const netC = posC + extra;
        const tax = netC * 0.19;
        const gross = netC + tax;
        const profit = netC - posP;
        const margin = netC > 0 ? (profit / netC) * 100 : 0;

        return {
            partnerTotal: posP,
            positionsTotal: posC,
            extraTotal: extra,
            netTotal: netC,
            tax: tax,
            grossTotal: gross,
            profit: profit,
            margin: margin
        };
    }, [projectData]);

    const getDeadlineStatus = () => {
        if (!projectData?.due) return { label: '-', color: 'bg-slate-100 text-slate-400', icon: <FaClock /> };
        const today = new Date();
        const due = new Date(projectData.due);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: `${Math.abs(diffDays)} Tage überfällig`, color: 'bg-red-100 text-red-600 border-red-200', icon: <FaExclamationTriangle /> };
        } else if (diffDays === 0) {
            return { label: 'Heute fällig', color: 'bg-orange-100 text-orange-600 border-orange-200', icon: <FaClock /> };
        } else {
            return { label: `in ${diffDays} Tagen`, color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: <FaClock /> };
        }
    };

    const addWorkingDays = (days: number) => {
        if (!projectData) return;
        let date = new Date();
        let added = 0;
        while (added < days) {
            date.setDate(date.getDate() + 1);
            if (date.getDay() !== 0 && date.getDay() !== 6) added++;
        }
        updateProjectMutation.mutate({ deadline: date.toISOString().split('T')[0] });
    };

    const getLanguageInfo = (code: string) => {
        const langs: any = {
            'de': { flag: '🇩🇪', name: 'Deutsch' },
            'en': { flag: '🇬🇧', name: 'Englisch' },
            'fr': { flag: '🇫🇷', name: 'Französisch' },
            'es': { flag: '🇪🇸', name: 'Spanisch' },
        };
        return langs[code] || { flag: '🌐', name: code.toUpperCase() };
    };

    const updateProjectMutation = useMutation({
        mutationFn: (data: any) => projectService.update(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            setIsEditModalOpen(false);
        }
    });

    const handlePartnerSelect = (partner: any) => {
        if (!projectData) return;
        updateProjectMutation.mutate({ partner_id: partner.id });
        setIsPartnerModalOpen(false);
    };

    const handleEditSubmit = (updatedData: any) => {
        updateProjectMutation.mutate(updatedData);
    };

    const handleSavePositions = () => {
        if (!projectData) return;
        updateProjectMutation.mutate({
            positions: projectData.positions.map(p => ({
                id: p.id,
                description: p.description,
                unit: p.unit,
                amount: parseFloat(p.amount) || 0,
                quantity: parseFloat(p.quantity) || 0,
                partner_rate: parseFloat(p.partnerRate) || 0,
                partner_mode: p.partnerMode,
                partner_total: parseFloat(p.partnerTotal) || 0,
                customer_rate: parseFloat(p.customerRate) || 0,
                customer_mode: p.customerMode,
                customer_total: parseFloat(p.customerTotal) || 0,
                margin_type: p.marginType,
                margin_percent: parseFloat(p.marginPercent) || 0
            }))
        });
    };

    const handleCellUpdate = (id: string, field: string, value: string) => {
        if (!projectData) return;
        const newPositions = projectData.positions.map((p: any) => {
            if (p.id === id) {
                const updated = { ...p, [field]: value };
                if (['amount', 'partnerRate', 'customerRate', 'quantity', 'partnerMode', 'customerMode'].includes(field)) {
                    const amount = parseFloat(updated.amount) || 0;
                    const qty = parseFloat(updated.quantity) || 1;
                    const pRate = parseFloat(updated.partnerRate) || 0;
                    const cRate = parseFloat(updated.customerRate) || 0;

                    updated.partnerTotal = updated.partnerMode === 'fixed'
                        ? (pRate * qty).toFixed(2)
                        : (amount * qty * pRate).toFixed(2);

                    updated.customerTotal = updated.customerMode === 'fixed'
                        ? (cRate * qty).toFixed(2)
                        : (amount * qty * cRate).toFixed(2);
                }
                return updated;
            }
            return p;
        });
        setProjectData({ ...projectData, positions: newPositions });
    };

    const addPosition = () => {
        if (!projectData) return;
        const newPos = {
            id: Date.now().toString(),
            description: 'Neue Position',
            amount: '1',
            unit: 'Wörter',
            quantity: '1',
            partnerRate: '0.00',
            partnerMode: 'unit',
            partnerTotal: '0.00',
            customerRate: '0.00',
            customerTotal: '0.00',
            customerMode: 'unit',
            marginType: 'markup',
            marginPercent: '0'
        };
        setProjectData((prev: any) => prev ? ({ ...prev, positions: [...prev.positions, newPos] }) : null);
    };

    const deletePosition = (id: string) => {
        if (!projectData) return;
        setProjectData((prev: any) => prev ? ({
            ...prev,
            positions: prev.positions.filter((p: any) => p.id !== id)
        }) : null);
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            'in_progress': 'bg-blue-50 text-blue-700 border-blue-200',
            'review': 'bg-purple-50 text-purple-700 border-purple-200',
            'draft': 'bg-slate-50 text-slate-600 border-slate-200',
            'pending': 'bg-orange-50 text-orange-700 border-orange-200',
            'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
        const labels: { [key: string]: string } = {
            'in_progress': 'Aktiv', 'review': 'QS/Lektorat', 'draft': 'Entwurf',
            'pending': 'Angebot', 'completed': 'Abgeschlossen'
        };
        return <span className={clsx("px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tight shadow-sm", styles[status] || styles['draft'])}>{labels[status] || status}</span>;
    }

    const renderEditableCell = (id: string, field: string, value: string, type: 'text' | 'number' = 'text', className: string = '') => {
        const isEditing = editingCell?.id === id && editingCell?.field === field;

        if (isEditing) {
            return (
                <input
                    autoFocus
                    type={type}
                    defaultValue={value}
                    className={clsx("w-full bg-white border-2 border-brand-500 rounded px-2 py-1 outline-none text-xs font-bold shadow-sm", className)}
                    onBlur={(e) => {
                        handleCellUpdate(id, field, e.target.value);
                        setEditingCell(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleCellUpdate(id, field, (e.target as HTMLInputElement).value);
                            setEditingCell(null);
                        }
                        if (e.key === 'Escape') setEditingCell(null);
                    }}
                />
            );
        }

        return (
            <div
                onClick={() => setEditingCell({ id, field })}
                className={clsx("cursor-pointer hover:bg-brand-50 hover:text-brand-700 px-2 py-1 rounded transition", className)}
                title="Klicken zum Bearbeiten"
            >
                {value || '-'}
            </div>
        );
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        const msg = {
            id: Date.now().toString(),
            from: 'Admin',
            message: newMessage,
            timestamp: new Date().toLocaleString('de-DE')
        };
        setProjectMessages([...projectMessages, msg]);
        setNewMessage('');
    };

    const uploadFileMutation = useMutation({
        mutationFn: async (files: any[]) => {
            for (const f of files) {
                const formData = new FormData();
                formData.append('file', f.file);
                formData.append('type', f.type);
                await projectService.uploadFile(id!, formData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
        }
    });

    const deleteFileMutation = useMutation({
        mutationFn: (fileId: string) => projectService.deleteFile(id!, fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
        }
    });

    const handleFileUpload = (newFiles: any[]) => {
        uploadFileMutation.mutate(newFiles);
    };

    const handleFileDelete = (fileId: string) => {
        if (window.confirm('Datei wirklich löschen?')) {
            deleteFileMutation.mutate(fileId);
            setSelectedFileIds(prev => prev.filter(id => id !== fileId));
        }
    };

    const handleBulkDelete = async () => {
        if (!projectData) return;
        if (!window.confirm(`${selectedFileIds.length} Dateien wirklich löschen?`)) return;

        for (const fileId of selectedFileIds) {
            await deleteFileMutation.mutateAsync(fileId);
        }
        setSelectedFileIds([]);
    };

    const handleFileDownload = async (fileId: string, fileName: string) => {
        try {
            const response = await projectService.downloadFile(id!, fileId);
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download fehlgeschlagen.');
        }
    };

    const toggleSelectFile = (fileId: string) => {
        setSelectedFileIds(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
    };

    const toggleSelectAllFiles = () => {
        if (!projectData) return;
        if (selectedFileIds.length === projectData.files.length) {
            setSelectedFileIds([]);
        } else {
            setSelectedFileIds(projectData.files.map((f: any) => f.id));
        }
    };

    const handleFileRename = (fileId: string, newBaseName: string) => {
        setProjectData((prev: any) => ({
            ...prev,
            files: prev.files.map((f: any) => {
                if (f.id === fileId) {
                    const parts = f.name.split('.');
                    const ext = parts.length > 1 ? parts.pop() : '';
                    return { ...f, name: `${newBaseName}.${ext}` };
                }
                return f;
            })
        }));
    };

    const renderEditableFileCell = (file: any) => {
        const isEditing = editingCell?.id === file.id && editingCell?.field === 'filename';
        const parts = (file.name || '').split('.');
        const ext = parts.length > 1 ? parts.pop() : '';
        const baseName = parts.join('.');
        if (isEditing) {
            return (
                <div className="flex items-center gap-1">
                    <input
                        autoFocus
                        defaultValue={baseName}
                        className="bg-white border-2 border-brand-500 rounded px-2 py-0.5 outline-none text-xs font-bold shadow-sm w-full max-w-[200px]"
                        onBlur={(e) => { handleFileRename(file.id, e.target.value); setEditingCell(null); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { handleFileRename(file.id, (e.target as HTMLInputElement).value); setEditingCell(null); }
                            if (e.key === 'Escape') setEditingCell(null);
                        }}
                    />
                    <span className="text-slate-400 font-bold text-xs">.{ext}</span>
                </div>
            );
        }
        return (
            <div onClick={() => setEditingCell({ id: file.id, field: 'filename' })} className="cursor-pointer hover:bg-brand-50 hover:text-brand-700 px-2 py-1 rounded transition max-w-fit">
                <span className="font-bold text-slate-800">{baseName}</span>
                <span className="text-slate-400 font-bold text-[11px]">.{ext}</span>
            </div>
        );
    };

    const renderEditableFileStatCell = (file: any, field: 'words' | 'chars') => {
        const isEditing = editingCell?.id === file.id && editingCell?.field === field;
        const value = file[field];
        if (isEditing) {
            return (
                <input
                    autoFocus
                    type="number"
                    defaultValue={value}
                    className="w-20 px-2 py-1 bg-white border-2 border-brand-500 rounded text-right text-xs font-bold outline-none shadow-sm"
                    onBlur={(e) => {
                        const newVal = parseInt(e.target.value) || 0;
                        setProjectData((prev: any) => ({ ...prev, files: prev.files.map((f: any) => f.id === file.id ? { ...f, [field]: newVal } : f) }));
                        setEditingCell(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const newVal = parseInt((e.target as HTMLInputElement).value) || 0;
                            setProjectData((prev: any) => ({ ...prev, files: prev.files.map((f: any) => f.id === file.id ? { ...f, [field]: newVal } : f) }));
                            setEditingCell(null);
                        }
                        if (e.key === 'Escape') setEditingCell(null);
                    }}
                />
            );
        }
        return (
            <div onClick={() => setEditingCell({ id: file.id, field })} className="cursor-pointer hover:bg-slate-50 hover:text-brand-600 px-2 py-1 rounded transition text-right">
                {value.toLocaleString()}
            </div>
        );
    };

    const invoiceMutation = useMutation({
        mutationFn: invoiceService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setIsInvoiceModalOpen(false);
            navigate('/invoices');
        }
    });

    if (isLoading) return <TableSkeleton rows={10} columns={5} />;
    if (error || !projectData) return <div className="p-10 text-center text-red-500">Fehler beim Laden des Projekts.</div>;

    const sourceLang = getLanguageInfo(projectData.source);
    const targetLang = getLanguageInfo(projectData.target);
    const deadlineStatus = getDeadlineStatus();

    return (
        <div className="flex flex-col h-full fade-in pb-10">
            {/* Project Header */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-6 flex-shrink-0">
                <div className="px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div
                            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 cursor-pointer hover:text-brand-600 transition group"
                            onClick={() => navigate('/projects')}
                        >
                            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Projekte
                        </div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">{projectData.name}</h1>
                            {getStatusBadge(projectData.status)}
                            {projectData.priority !== 'low' && (
                                <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tight flex items-center gap-1",
                                    projectData.priority === 'express' ? "bg-red-50 text-red-700 border-red-200" : "bg-orange-50 text-orange-700 border-orange-200"
                                )}>
                                    <FaFlag className="text-[9px]" /> {projectData.priority === 'express' ? 'Express' : 'Dringend'}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2 font-medium">
                            <span className="text-slate-800">{projectData.client}</span>
                            <span className="text-slate-300">•</span>
                            <span>ID: {projectData.id}</span>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 rounded-md px-2 py-1 border border-slate-200">
                                <span>{sourceLang.flag}</span>
                                <span className="text-slate-600">{sourceLang.name}</span>
                                <span className="text-slate-300 mx-1">→</span>
                                <span>{targetLang.flag}</span>
                                <span className="text-slate-600">{targetLang.name}</span>
                            </div>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="px-4 py-2 border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition shadow-sm uppercase tracking-wide"
                        >
                            <FaEdit className="text-[10px]" /> Bearbeiten
                        </button>
                        <button
                            onClick={() => setIsInvoiceModalOpen(true)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition shadow-sm active:scale-95 uppercase tracking-wide flex items-center gap-2"
                        >
                            <FaFileInvoiceDollar /> Rechnung erstellen
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 border-t border-slate-100 flex gap-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {['overview', 'files', 'finances', 'messages'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition relative shrink-0",
                                activeTab === tab
                                    ? 'border-brand-500 text-brand-700'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            )}
                        >
                            {tab === 'overview' ? 'Projekt-Cockpit' :
                                tab === 'files' ? `Dateien (${projectData.files.length})` :
                                    tab === 'finances' ? 'Kalkulation & Marge' : 'Kommunikation'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="flex flex-col lg:flex-row gap-8 items-start h-full pb-10">
                        {/* Main Content */}
                        <div className="flex-1 space-y-8 bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
                            {/* Section 1: Basisdaten */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">01</div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Projekt-Stammdaten</h4>
                                </div>
                                <div className="grid grid-cols-12 gap-6">
                                    <div className="col-span-12">
                                        <Input label="Projektbezeichnung" value={projectData.name} readOnly className="bg-slate-50/50" />
                                    </div>
                                    <div className="col-span-12 md:col-span-8">
                                        <Input
                                            label="Kunde"
                                            value={projectData.client}
                                            readOnly
                                            className="bg-slate-50/50"
                                            onEndIconClick={() => projectData.customer_id && navigate(`/customers/${projectData.customer_id}`)}
                                            endIcon={<FaExternalLinkAlt className="cursor-pointer hover:text-brand-600 text-[10px]" title="Kundenakte öffnen" />}
                                        />
                                    </div>
                                    <div className="col-span-12 md:col-span-4 relative">
                                        <div className="flex justify-between items-center mb-1.5 ml-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lieferdatum</label>
                                            <div className="flex gap-1">
                                                {[3, 5, 7].map(d => (
                                                    <button
                                                        key={d}
                                                        onClick={() => addWorkingDays(d)}
                                                        className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all active:scale-95 uppercase tracking-tighter"
                                                    >
                                                        {d}T
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="relative h-11">
                                            <input
                                                type="date"
                                                value={projectData.due}
                                                onChange={(e) => setProjectData({ ...projectData, due: e.target.value })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                            />
                                            <div className="w-full h-full px-3 flex items-center justify-between bg-slate-50/50 border border-slate-200 shadow-sm text-sm font-bold text-slate-700 rounded pointer-events-none">
                                                <div className="flex items-center gap-2">
                                                    <FaCalendarAlt className="text-slate-400 text-xs" />
                                                    <span>{projectData.due ? new Date(projectData.due).toLocaleDateString('de-DE') : '-'}</span>
                                                </div>
                                                <div className={clsx("flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border shadow-sm", deadlineStatus.color)}>
                                                    {deadlineStatus.label}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-6">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ausgangssprache</label>
                                        <div className="w-full h-11 px-3 flex items-center gap-2 bg-slate-50/50 border border-slate-200 shadow-sm text-sm font-bold text-slate-700 rounded">
                                            <span className="text-2xl">{sourceLang.flag}</span>
                                            <span>{sourceLang.name} ({projectData.source.toUpperCase()})</span>
                                        </div>
                                    </div>
                                    <div className="col-span-6">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Zielsprache</label>
                                        <div className="w-full h-11 px-3 flex items-center gap-2 bg-slate-50/50 border border-slate-200 shadow-sm text-sm font-bold text-slate-700 rounded">
                                            <span className="text-2xl">{targetLang.flag}</span>
                                            <span>{targetLang.name} ({projectData.target.toUpperCase()})</span>
                                        </div>
                                    </div>
                                    <div className="col-span-12 pt-6 mt-2 border-t border-slate-50">
                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                            <div className="w-full md:w-32">
                                                <Input
                                                    label="Anzahlung"
                                                    value={projectData.downPayment.toString()}
                                                    type="number"
                                                    onChange={(e) => updateProjectMutation.mutate({ down_payment: parseFloat(e.target.value) || 0 })}
                                                    endIcon={<span className="text-[10px] font-bold">€</span>}
                                                    className="bg-emerald-50/20 border-emerald-100 font-bold text-emerald-700"
                                                />
                                            </div>
                                            <div className="w-full md:w-40">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Zahlmittel</label>
                                                <select
                                                    value={projectData.downPaymentMethod}
                                                    onChange={(e) => updateProjectMutation.mutate({ down_payment_method: e.target.value })}
                                                    className="w-full h-11 px-3 text-sm font-bold border border-slate-200 rounded bg-white shadow-sm outline-none focus:border-brand-500 transition-colors"
                                                >
                                                    <option>Bar</option>
                                                    <option>Überweisung</option>
                                                    <option>PayPal</option>
                                                    <option>Kreditkarte</option>
                                                </select>
                                            </div>
                                            <div className="flex-1 w-full">
                                                <Input
                                                    label="Vermerk zur Anzahlung"
                                                    value={projectData.downPaymentNote}
                                                    onChange={(e) => updateProjectMutation.mutate({ down_payment_note: e.target.value })}
                                                    placeholder="z.B. Bar erhalten..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Team */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">02</div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Projekt-Team</h4>
                                </div>
                                <div className="grid grid-cols-12 gap-6">
                                    <div className="col-span-12 md:col-span-6">
                                        <Input
                                            label="Project Manager"
                                            value={projectData.pm}
                                            readOnly
                                            className="bg-slate-50/50"
                                            startIcon={<div className="w-4 h-4 rounded-full bg-slate-800 text-white text-[8px] flex items-center justify-center font-bold">PM</div>}
                                            helperText={`Erstellt am ${projectData.createdAt}`}
                                        />
                                    </div>
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="p-0 rounded-lg border-none bg-transparent">
                                            <div className="flex justify-between items-start mb-3">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ausführender Partner</label>
                                                <button onClick={() => setIsPartnerModalOpen(true)} className="text-[10px] text-brand-600 font-bold hover:underline">Ändern</button>
                                            </div>
                                            <div className="flex items-start gap-3 mb-4">
                                                <div className="w-10 h-10 rounded bg-white border border-slate-200 text-brand-700 flex items-center justify-center text-xs font-black uppercase shadow-sm shrink-0">
                                                    {projectData.translator?.initials}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-slate-800 text-sm mb-1">{projectData.translator?.name || '-'}</div>
                                                    <div className="text-xs text-slate-500 flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <FaEnvelope className="text-slate-300 text-[10px]" />
                                                            <span className="truncate">{projectData.translator?.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <FaPhone className="text-slate-300 text-[10px]" />
                                                            <span>{projectData.translator?.phone || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={clsx("w-2 h-2 rounded-full", projectData.documentsSent ? "bg-emerald-500" : "bg-slate-300")}></div>
                                                    <span className={clsx("text-[10px] font-bold uppercase tracking-wider", projectData.documentsSent ? "text-emerald-600" : "text-slate-400")}>
                                                        {projectData.documentsSent ? 'Versendet' : 'Ausstehend'}
                                                    </span>
                                                </div>
                                                {!projectData.documentsSent ? (
                                                    <button
                                                        className="px-3 py-1.5 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-brand-700 transition shadow-sm flex items-center gap-2"
                                                        onClick={() => updateProjectMutation.mutate({ documents_sent: true })}
                                                    >
                                                        <FaPaperPlane /> Senden
                                                    </button>
                                                ) : (
                                                    <button className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded cursor-default border border-slate-200 flex items-center gap-1">
                                                        <FaCheckCircle className="text-emerald-500" /> Erledigt
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Section 3: Notes */}
                            {projectData.notes && (
                                <div className="space-y-6 pt-4">
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                        <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold">03</div>
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Anmerkungen</h4>
                                    </div>
                                    <Input isTextArea value={projectData.notes} readOnly className="bg-amber-50/30 border-amber-100 text-slate-600 italic text-xs" />
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar */}
                        <div className="w-full lg:w-80 space-y-6 shrink-0">
                            {/* Financial Dashboard */}
                            {/* Project Summary */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-2">Rechnungsvorschau</h3>
                                <div className="flex justify-between text-xs text-slate-500"><span>Positionen Netto</span><span>{financials.positionsTotal.toFixed(2)} €</span></div>
                                <div className="flex justify-between text-xs text-slate-500"><span>Zusatzleistungen</span><span>{financials.extraTotal.toFixed(2)} €</span></div>
                                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-800"><span>Gesamt Netto</span><span>{financials.netTotal.toFixed(2)} €</span></div>
                                <div className="flex justify-between text-[10px] text-slate-400"><span>MwSt. 19%</span><span>{financials.tax.toFixed(2)} €</span></div>
                                <div className="pt-2 border-t-2 border-brand-100 flex justify-between text-xl font-black text-slate-900 transition-all"><span>Gesamt</span><span>{financials.grossTotal.toFixed(2)} €</span></div>

                                {projectData.downPayment > 0 && (
                                    <div className="pt-2 flex justify-between text-xs text-emerald-600 font-bold border-t border-slate-50">
                                        <span>Geleistete Zahlungen</span>
                                        <span>-{projectData.downPayment.toFixed(2)} €</span>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-slate-100 mt-2 flex justify-between items-center bg-slate-50 -mx-4 -mb-4 p-4 rounded-b">
                                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Restbetrag</span>
                                    <span className={clsx("text-lg font-black", (financials.grossTotal - projectData.downPayment) <= 0.01 ? "text-emerald-600" : "text-brand-700")}>
                                        {(financials.grossTotal - projectData.downPayment) <= 0.01 ? 'BEZAHLT' : `${(financials.grossTotal - projectData.downPayment).toFixed(2)} €`}
                                    </span>
                                </div>
                            </div>

                            {/* Profit Margin */}
                            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 hover:bg-slate-200/50 transition-colors">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-tighter">Voraussichtl. Gewinn</span>
                                    <span className={clsx("text-xs font-black", financials.profit >= 0 ? "text-slate-800" : "text-red-600")}>{financials.profit.toFixed(2)} €</span>
                                </div>
                                <div className="w-full bg-slate-300 rounded-full h-2 overflow-hidden shadow-inner">
                                    <div className={clsx("h-full transition-all duration-500", financials.margin > 40 ? "bg-emerald-500" : financials.margin > 20 ? "bg-brand-500" : "bg-amber-500")} style={{ width: `${Math.min(100, Math.max(0, financials.margin))}%` }}></div>
                                </div>
                                <div className="text-right mt-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{financials.margin.toFixed(1)}% Marge</div>
                            </div>

                            {/* Workflow Widget Removed */}

                            {/* Options */}
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Details & Optionen</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Dokumentenart</label>
                                        <div className="flex flex-wrap gap-1">
                                            {projectData.docType.map((d: string) => (
                                                <span key={d} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase border border-slate-200">{d}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2 tracking-widest">Zusatzoptionen</label>
                                        <div className="space-y-1.5">
                                            {[
                                                { key: 'isCertified', label: 'Beglaubigung', icon: <FaCheckCircle /> },
                                                { key: 'hasApostille', label: 'Apostille', icon: <FaCheckCircle /> },
                                                { key: 'isExpress', label: 'Express', icon: <FaCheckCircle />, danger: true }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.key}
                                                    onClick={() => updateProjectMutation.mutate({ [opt.key === 'isCertified' ? 'is_certified' : opt.key === 'hasApostille' ? 'has_apostille' : 'is_express']: !projectData[opt.key] })}
                                                    disabled={updateProjectMutation.isPending}
                                                    className={clsx(
                                                        "w-full flex items-center justify-between p-2.5 rounded border transition-all active:scale-[0.98]",
                                                        projectData[opt.key]
                                                            ? (opt.danger ? "bg-red-50 border-red-200 text-red-700 shadow-sm" : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm")
                                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
                                                    {projectData[opt.key] ? (
                                                        <div className={clsx("text-xs", opt.danger ? "text-red-500" : "text-emerald-500")}>{opt.icon}</div>
                                                    ) : (
                                                        <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-200"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="flex flex-col gap-3 animate-fadeIn pb-10 px-8">
                        {selectedFileIds.length > 0 && (
                            <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg flex justify-between items-center animate-fadeIn shadow-sm z-10 relative">
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-600 text-xs font-bold uppercase tracking-widest shrink-0">{selectedFileIds.length} ausgewählt</span>
                                    <div className="h-4 w-px bg-slate-300"></div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => window.alert('Bulk Download gestartet...')} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                            <FaDownload className="text-xs" /> Herunterladen
                                        </button>
                                        <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-2">
                                            <FaTrash className="text-xs" /> {deleteFileMutation.isPending ? 'Löscht...' : 'Löschen'}
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedFileIds([])} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-200 rounded"><FaTimes /></button>
                            </div>
                        )}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Projekt-Dateien</h3>
                                        <p className="text-[10px] text-slate-400 font-bold">Verwaltung von Quell- und Zieltexten</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsUploadModalOpen(true)} className="px-4 py-2 bg-brand-700 text-white rounded text-[10px] font-black uppercase tracking-wider hover:bg-brand-800 transition flex items-center gap-2 shadow-sm active:scale-95">
                                    <FaCloudUploadAlt className="text-sm" /> Dateimanager öffnen
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/80 text-slate-400 text-[9px] font-black uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 w-10"><Checkbox checked={projectData.files.length > 0 && selectedFileIds.length === projectData.files.length} onChange={toggleSelectAllFiles} /></th>
                                            <th className="px-2 py-4">Dateiname</th>
                                            <th className="px-6 py-4">Kategorie</th>
                                            <th className="px-6 py-4 text-right">Wörter</th>
                                            <th className="px-6 py-4 text-right">Zeichen</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-[13px]">
                                        {projectData.files.length === 0 ? (
                                            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Keine Dateien vorhanden.</td></tr>
                                        ) : projectData.files.map((file: any) => (
                                            <tr key={file.id} className={clsx("group hover:bg-slate-50 transition-colors", selectedFileIds.includes(file.id) && "bg-brand-50/30")}>
                                                <td className="px-6 py-4"><Checkbox checked={selectedFileIds.includes(file.id)} onChange={() => toggleSelectFile(file.id)} /></td>
                                                <td className="px-2 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">{file.ext}</div>
                                                        <div>{renderEditableFileCell(file)}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={clsx("px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tight border shadow-xs transition-colors cursor-pointer",
                                                        file.type === 'source' ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100" : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                                                    )} onClick={() => {
                                                        setProjectData((prev: any) => ({
                                                            ...prev,
                                                            files: prev.files.map((f: any) => f.id === file.id ? { ...f, type: f.type === 'source' ? 'target' : 'source' } : f)
                                                        }));
                                                    }}>{file.type === 'source' ? 'Quelle' : 'Ziel'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-700 tabular-nums">{renderEditableFileStatCell(file, 'words')}</td>
                                                <td className="px-6 py-4 text-right font-medium text-slate-400 tabular-nums text-xs">{renderEditableFileStatCell(file, 'chars')}</td>
                                                <td className="px-6 py-4"><span className="text-slate-500 font-medium text-xs">{file.status}</span></td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleFileDownload(file.id, file.name)}
                                                            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-200 rounded transition shadow-xs"
                                                            title="Herunterladen"
                                                        >
                                                            <FaDownload className="text-[10px]" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleFileDelete(file.id)}
                                                            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded transition shadow-xs"
                                                            title="Löschen"
                                                        >
                                                            <FaTrash className="text-[10px]" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'finances' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-fadeIn mx-8 mb-10">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Detaillierte Kalkulation</h3>
                                <button
                                    onClick={handleSavePositions}
                                    disabled={updateProjectMutation.isPending}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded text-[10px] font-black uppercase hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    <FaCheckCircle className="text-[10px]" /> {updateProjectMutation.isPending ? 'Wird gespeichert...' : 'Preise speichern'}
                                </button>
                            </div>
                            <button onClick={addPosition} className="px-4 py-2 bg-brand-50 text-brand-700 border border-brand-200 rounded text-[10px] font-black uppercase hover:bg-brand-100 transition shadow-sm">
                                <FaPlus className="inline mr-1 mb-0.5" /> Position hinzufügen
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead className="bg-slate-50/80 text-slate-400 text-[9px] font-black uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 w-10 text-center">#</th>
                                        <th className="px-4 py-3">Beschreibung</th>
                                        <th className="px-4 py-3 w-32">Menge / Einh.</th>
                                        <th className="px-4 py-3 w-32 text-right bg-red-50/30 text-red-500 border-l border-slate-100">EK Rate/Gesamt</th>
                                        <th className="px-4 py-3 w-32 text-right bg-emerald-50/30 text-emerald-700 border-l border-slate-100">VK Rate/Gesamt</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {projectData.positions.map((pos: any, idx: number) => (
                                        <tr key={pos.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4 text-center text-slate-400">{idx + 1}</td>
                                            <td className="px-4 py-4">{renderEditableCell(pos.id, 'description', pos.description, 'text', 'font-bold text-slate-800')}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {renderEditableCell(pos.id, 'amount', pos.amount, 'number', 'w-16')}
                                                    <select value={pos.unit} onChange={(e) => handleCellUpdate(pos.id, 'unit', e.target.value)} className="text-[9px] font-bold uppercase text-slate-400 bg-transparent outline-none cursor-pointer">
                                                        <option value="Wörter">Wörter</option> <option value="Stunden">Stunden</option> <option value="Seiten">Seiten</option> <option value="Zeilen">Zeilen</option> <option value="Pauschal">Pauschal</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right bg-red-50/10 border-l border-slate-100">
                                                <div className="font-bold text-slate-500">{renderEditableCell(pos.id, 'partnerRate', pos.partnerRate, 'number', 'text-right')}</div>
                                                <div className="text-[10px] text-red-400 font-black">{parseFloat(pos.partnerTotal).toFixed(2)} €</div>
                                            </td>
                                            <td className="px-4 py-4 text-right bg-emerald-50/10 border-l border-slate-100">
                                                <div className="font-bold text-slate-500">{renderEditableCell(pos.id, 'customerRate', pos.customerRate, 'number', 'text-right')}</div>
                                                <div className="text-[10px] text-emerald-600 font-black">{parseFloat(pos.customerTotal).toFixed(2)} €</div>
                                            </td>
                                            <td className="px-2 py-4 text-center">
                                                <button onClick={() => deletePosition(pos.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><FaTrashAlt className="text-[10px]" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-100 border-t-2 border-slate-200">
                                        <td colSpan={3} className="px-4 py-3 text-right font-black text-slate-600 uppercase tracking-widest text-[10px]">Netto Ergebnis</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-400">{financials.partnerTotal.toFixed(2)} € (EK)</td>
                                        <td className="px-4 py-3 text-right font-black text-lg text-slate-800">{financials.netTotal.toFixed(2)} € (VK)</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="bg-white rounded-none md:rounded-lg border-y md:border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)] md:h-[500px] md:mx-8 mb-0 md:mb-10">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                            <FaComments className="text-brand-600" />
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Projekt-Chat</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                            {projectMessages.map((msg) => (
                                <div key={msg.id} className={clsx("flex w-full", msg.from === 'Admin' ? "justify-end" : "justify-start")}>
                                    <div className={clsx("p-3 shadow-sm border rounded-2xl max-w-[85%] md:max-w-[70%]", msg.from === 'Admin' ? "bg-brand-50 border-brand-100" : "bg-white border-slate-200")}>
                                        <div className="flex justify-between items-center gap-4 mb-1">
                                            <span className="font-bold text-[10px] text-slate-800">{msg.from}</span>
                                            <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-snug break-words">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 md:p-4 border-t border-slate-200 bg-white sticky bottom-0">
                            <div className="flex gap-2">
                                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Nachricht..." className="flex-1 h-10 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500/20" />
                                <button onClick={handleSendMessage} className="px-4 bg-brand-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-800 transition shrink-0">Senden</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <PartnerSelectionModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onSelect={handlePartnerSelect} />
            <NewProjectModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditSubmit} initialData={projectData} />
            <FileUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleFileUpload} />
            <NewInvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} onSubmit={(data) => invoiceMutation.mutate(data)} project={{ ...projectData, financials }} isLoading={invoiceMutation.isPending} />
        </div >
    );
};

export default ProjectDetail;
