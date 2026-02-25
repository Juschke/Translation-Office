import { useState, useMemo, useEffect, useRef } from 'react';
import { openBlobInNewTab } from '../utils/download';
import { mapProjectResponse } from '../utils/projectDataMapper';
import { useProjectModals } from '../hooks/useProjectModals';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaCheckCircle, FaFlag, FaPaperPlane, FaTrashAlt, FaClock, FaFileInvoiceDollar, FaFilePdf, FaChevronDown, FaArchive, FaBolt, FaInfoCircle, FaComments, FaFileAlt, FaExclamationTriangle, FaEnvelope } from 'react-icons/fa';
import PartnerSelectionModal from '../components/modals/PartnerSelectionModal';
import PaymentModal from '../components/modals/PaymentModal';
import CustomerSelectionModal from '../components/modals/CustomerSelectionModal';
import NewProjectModal from '../components/modals/NewProjectModal';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import FileUploadModal from '../components/modals/FileUploadModal';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import InviteParticipantModal from '../components/modals/InviteParticipantModal';
import InterpreterConfirmationModal from '../components/modals/InterpreterConfirmationModal';
import InvoicePreviewModal from '../components/modals/InvoicePreviewModal';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, invoiceService, customerService, partnerService } from '../api/services';
import { getFlagUrl } from '../utils/flags';
import { getLanguageLabel } from '../utils/languages';
import { Button } from '../components/ui/button';


import TableSkeleton from '../components/common/TableSkeleton';
import FilePreviewModal from '../components/modals/FilePreviewModal';
import HistoryTab from '../components/projects/HistoryTab';
import MessagesTab from '../components/projects/MessagesTab';
import ProjectOverviewTab from '../components/projects/ProjectOverviewTab';
import ProjectFilesTab from '../components/projects/ProjectFilesTab';
import ProjectFinancesTab from '../components/projects/ProjectFinancesTab';


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
    customer: {
        id: string;
        name: string;
        contact: string;
        email: string;
        phone: string;
        initials: string;
        type: string;
        // Address fields
        address_street?: string;
        address_house_no?: string;
        address_zip?: string;
        address_city?: string;
        address_country?: string;
    };
    source: string;
    target: string;
    source_language?: any;
    target_language?: any;
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
    document_type_id?: number;
    additional_doc_types?: any[];
    translator: {
        id?: string;
        name: string;
        email: string;
        initials: string;
        phone: string;
        // Extended info
        address_street?: string;
        address_house_no?: string;
        address_zip?: string;
        address_city?: string;
        address_country?: string;
        rating?: number;
        languages?: string[];
        price_per_word?: number;
        price_per_line?: number;
        unit_rates?: any[];
        flat_rates?: any[];
    };
    documentsSent: boolean;
    pm: string;
    createdAt: string;
    updatedAt: string;
    creator?: { name: string };
    editor?: { name: string };
    positions: ProjectPosition[];
    access_token?: string | null;
    messages?: Array<{
        id: string;
        content: string;
        created_at: string;
        sender_name?: string;
        user?: { name: string; id: string };
        user_id?: string;
        is_read: boolean;
    }>;
    payments: any[];
    notes: string;
    files: ProjectFile[];
    invoices?: Array<{
        id: number;
        invoice_number: string;
        status: string;
        type: string;
        amount_gross: number;
        date: string;
        due_date: string;
        is_locked: boolean;
    }>;
    appointment_location?: string;
    customer_reference?: string;
    customer_date?: string | null;
    project_number?: string;
}



const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
    const [fileFilterTab, setFileFilterTab] = useState<'all' | 'source' | 'target'>('all');
    const [historySearch, setHistorySearch] = useState('');
    const [historySortKey, setHistorySortKey] = useState<'date' | 'user' | 'action'>('date');
    const [historySortDir, setHistorySortDir] = useState<'asc' | 'desc'>('asc');

    const {
        isPartnerModalOpen, setIsPartnerModalOpen,
        isEditModalOpen, setIsEditModalOpen,
        isUploadModalOpen, setIsUploadModalOpen,
        isInvoiceModalOpen, setIsInvoiceModalOpen,
        isPaymentModalOpen, setIsPaymentModalOpen,
        isCustomerSearchOpen, setIsCustomerSearchOpen,
        isCustomerEditModalOpen, setIsCustomerEditModalOpen,
        isPartnerEditModalOpen, setIsPartnerEditModalOpen,
        isProjectDeleteConfirmOpen, setIsProjectDeleteConfirmOpen,
        isInviteModalOpen, setIsInviteModalOpen,
        isInterpreterModalOpen, setIsInterpreterModalOpen,
        previewFile, setPreviewFile,
        deleteFileConfirm, setDeleteFileConfirm,
    } = useProjectModals();

    const [previewInvoice, setPreviewInvoice] = useState<any>(null);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActionsOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
                setIsActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isActionsOpen]);

    // Comprehensive Project State
    const [projectData, setProjectData] = useState<ProjectData | null>(null);

    const { data: projectResponse, isLoading, error } = useQuery({
        queryKey: ['projects', id],
        queryFn: () => projectService.getById(id!),
        enabled: !!id
    });



    useEffect(() => {
        if (projectResponse) {
            const mapped = mapProjectResponse(projectResponse) as ProjectData;
            setProjectData(mapped);
        }
    }, [projectResponse]);




    const getDeadlineStatus = () => {
        if (!projectData?.due) return { label: 'Kein Datum', color: 'bg-slate-50 text-slate-400 border-slate-100', icon: <FaClock /> };
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

    // addWorkingDays kept for future use
    // const addWorkingDays = (days: number) => {
    // if (!projectData) return;
    // let date = new Date();
    // let added = 0;
    // while (added < days) {
    // date.setDate(date.getDate() + 1);
    // if (date.getDay() !== 0 && date.getDay() !== 6) added++;
    // }
    // updateProjectMutation.mutate({ deadline: date.toISOString().split('T')[0] });
    // };

    const getLanguageInfo = (code: string) => {
        if (!code) return { flagUrl: '', name: '-' };
        const cleanCode = code.split('-')[0].toLowerCase();

        return {
            flagUrl: getFlagUrl(code),
            name: getLanguageLabel(cleanCode)
        };
    };

    const updateProjectMutation = useMutation({
        mutationFn: (data: any) => projectService.update(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsEditModalOpen(false);
            toast.success('Projekt erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren des Projekts');
        }
    });

    const deleteProjectMutation = useMutation({
        mutationFn: (projectId: string) => projectService.delete(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success('Projekt erfolgreich gelöscht');
            navigate('/projects');
        },
        onError: () => {
            toast.error('Fehler beim Löschen des Projekts');
        },
        onSettled: () => {
            setIsProjectDeleteConfirmOpen(false);
        }
    });

    const handlePartnerSelect = (partner: any) => {
        if (!projectData) return;
        updateProjectMutation.mutate({ partner_id: partner.id });
        setIsPartnerModalOpen(false);
    };

    // Mutation für Kunden-Update
    const updateCustomerMutation = useMutation({
        mutationFn: (data: any) => {
            const customerId = projectData?.customer_id;
            if (!customerId) return Promise.reject('Keine Kunden-ID gefunden');
            return customerService.update(customerId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsCustomerEditModalOpen(false);
            toast.success('Kundendaten erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren der Kundendaten');
        }
    });

    // Mutation für Partner-Update
    const updatePartnerMutation = useMutation({
        mutationFn: (data: any) => {
            const partnerId = projectData?.translator?.id;
            if (!partnerId) return Promise.reject('Keine Partner-ID gefunden');
            return partnerService.update(Number(partnerId), data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            setIsPartnerEditModalOpen(false);
            toast.success('Partnerdaten erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren der Partnerdaten');
        }
    });

    const handleEditSubmit = (updatedData: any) => {
        updateProjectMutation.mutate(updatedData);
    };


    const getStatusBadge = (status: string) => {
        const labels: { [key: string]: string } = {
            'draft': 'Entwurf',
            'offer': 'Angebot',
            'pending': 'Angebot',
            'in_progress': 'Bearbeitung',
            'review': 'Bearbeitung',
            'ready_for_pickup': 'Abholbereit',
            'delivered': 'Geliefert',
            'invoiced': 'Rechnung',
            'completed': 'Abgeschlossen',
            'cancelled': 'Storniert',
            'archived': 'Archiviert',
            'deleted': 'Gelöscht'
        };
        const icons: { [key: string]: React.ReactNode } = {
            'draft': <FaEdit className="text-slate-400" />,
            'offer': <FaClock className="text-orange-500" />,
            'pending': <FaClock className="text-orange-500" />,
            'in_progress': <FaClock className="text-blue-500" />,
            'review': <FaClock className="text-blue-500" />,
            'ready_for_pickup': <FaPaperPlane className="text-indigo-500" />,
            'delivered': <FaCheckCircle className="text-emerald-500" />,
            'invoiced': <FaFileInvoiceDollar className="text-purple-500" />,
            'completed': <FaCheckCircle className="text-emerald-600" />,
            'cancelled': <FaExclamationTriangle className="text-slate-400" />,
            'archived': <FaArchive className="text-slate-400" />,
            'deleted': <FaTrashAlt className="text-red-400" />
        };
        const colors: { [key: string]: string } = {
            'draft': 'text-slate-600',
            'offer': 'text-orange-600',
            'pending': 'text-orange-600',
            'in_progress': 'text-blue-600',
            'review': 'text-blue-600',
            'ready_for_pickup': 'text-indigo-600',
            'delivered': 'text-emerald-600',
            'invoiced': 'text-purple-600',
            'completed': 'text-emerald-700',
            'cancelled': 'text-slate-500',
            'archived': 'text-slate-500',
            'deleted': 'text-red-600'
        };

        return (
            <div className={clsx("flex items-center gap-2 text-xs font-medium", colors[status] || 'text-slate-600')}>
                {icons[status] || <FaClock />}
                <span>{labels[status] || status}</span>
            </div>
        );
    }



    const uploadFileMutation = useMutation({
        mutationFn: async ({ files, onProgress }: { files: any[], onProgress: (id: string, p: number) => void }) => {
            for (const f of files) {
                const formData = new FormData();
                formData.append('file', f.file);
                formData.append('type', f.type);
                await projectService.uploadFile(id!, formData, (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(f.id, percentCompleted);
                    }
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            toast.success('Dateien erfolgreich hochgeladen');
        },
        onError: () => {
            toast.error('Fehler beim Hochladen der Dateien');
        }
    });

    const formatFileSize = (bytes: any) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownloadFile = async (file: any) => {
        try {
            // Robust filename fallback, ensuring extension
            let fileName = file.name || file.fileName || file.original_name || 'download_file';
            const fileExt = file.extension || fileName.split('.').pop();

            if (!fileName.includes('.') && fileExt) {
                fileName = `${fileName}.${fileExt} `;
            }

            // Assuming downloadFile returns a response with blob data
            const response = await projectService.downloadFile(id!, file.id);

            // Basic mime checking if extension is still missing
            if (!fileName.includes('.')) {
                const mime = response.headers['content-type'];
                if (mime === 'application/pdf') fileName += '.pdf';
                else if (mime === 'image/jpeg') fileName += '.jpg';
                else if (mime === 'image/png') fileName += '.png';
                else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileName += '.docx';
            }


            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Fehler beim Herunterladen der Datei.');
        }
    };

    const handlePreviewFile = async (file: any) => {
        try {
            const toastId = toast.loading('Lade Vorschau...');
            const response = await projectService.downloadFile(id!, file.id);

            // Guess mime type from header or fallback
            const mimeType = response.headers['content-type'];

            const blob = new Blob([response.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);

            let fileName = file.name || file.fileName || 'file';

            // Ensure extension exists for modal detection logic
            if (!fileName.includes('.')) {
                if (mimeType === 'application/pdf') fileName += '.pdf';
                else if (mimeType?.startsWith('image/jpeg')) fileName += '.jpg';
                else if (mimeType?.startsWith('image/png')) fileName += '.png';
                else if (mimeType?.startsWith('image/gif')) fileName += '.gif';
                else if (mimeType?.startsWith('image/webp')) fileName += '.webp';
                else if (mimeType?.startsWith('image/svg')) fileName += '.svg';
                else if (mimeType === 'application/msword') fileName += '.doc';
                else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileName += '.docx';
            }

            toast.dismiss(toastId);
            setPreviewFile({
                name: fileName,
                url: url,
                type: file.type,
                id: file.id
            });
        } catch (error) {
            toast.dismiss();
            console.error('Preview error:', error);
            toast.error('Vorschau konnte nicht geladen werden.');
        }
    };

    const toggleFileType = async (file: any) => {
        try {
            const newType = file.type === 'source' ? 'target' : 'source';
            await projectService.updateFile(id!, file.id, { type: newType });

            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            toast.success(`Dateityp zu "${newType === 'source' ? 'Quelle' : 'Ziel'}" geändert`);
        } catch (error) {
            console.error('File update failed:', error);
            toast.error('Dateityp konnte nicht geändert werden');
        }
    };

    const deleteFileMutation = useMutation({
        mutationFn: async (fileId: string) => {
            await projectService.deleteFile(id!, fileId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            toast.success('Datei erfolgreich gelöscht');
        },
        onError: () => {
            toast.error('Fehler beim Löschen der Datei.');
        }
    });

    const handleFileUpload = async (newFiles: any[], onProgress: (id: string, p: number) => void) => {
        await uploadFileMutation.mutateAsync({ files: newFiles, onProgress });
    };

    const invoiceMutation = useMutation({
        mutationFn: invoiceService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            setIsInvoiceModalOpen(false);
            toast.success('Rechnung erstellt – Projektstatus auf „Abholbereit" gesetzt.');
            navigate('/invoices');
        },
        onError: () => {
            toast.error('Fehler beim Erstellen der Rechnung');
        }
    });


    const financials = useMemo(() => {
        if (!projectData) return {
            netTotal: 0,
            taxTotal: 0,
            grossTotal: 0,
            partnerTotal: 0,
            margin: 0,
            marginPercent: 0,
            paid: 0,
            open: 0,
            extraTotal: 0
        };

        const positions = projectData.positions || [];
        const payments = projectData.payments || [];

        // Extras Calculation
        const extraNet = (projectData.isCertified ? 5 : 0) +
            (projectData.hasApostille ? 15 : 0) +
            (projectData.isExpress ? 15 : 0) +
            (projectData.classification === 'ja' ? 15 : 0) +
            ((projectData.copies || 0) * (Number(projectData.copyPrice) || 5));

        // Positions Sum (Assuming Net from NewProjectModal logic)
        const positionsNet = positions.reduce((sum: number, pos: any) => sum + (parseFloat(pos.customerTotal) || 0), 0);

        const netTotal = positionsNet + extraNet;
        const taxTotal = netTotal * 0.19;
        const grossTotal = netTotal + taxTotal;

        // Calculate Partner Costs
        const partnerTotal = positions.reduce((sum: number, pos: any) => {
            const amount = parseFloat(pos.amount) || 0;
            const rate = parseFloat(pos.partnerRate) || 0;
            // If unit is Pauschal, amount is usually 1, so rate * amount works.
            return sum + (amount * rate);
        }, 0);

        const margin = netTotal - partnerTotal;
        const marginPercent = netTotal > 0 ? (margin / netTotal) * 100 : 0;

        const paid = payments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
        const open = grossTotal - paid;

        return {
            netTotal,
            taxTotal,
            grossTotal,
            partnerTotal,
            margin,
            marginPercent,
            paid,
            open,
            extraTotal: extraNet
        };
    }, [projectData]);

    if (isLoading) return <TableSkeleton rows={10} columns={5} />;
    if (error || !projectData) return <div className="p-10 text-center text-red-500">Fehler beim Laden des Projekts.</div>;

    const sourceLang = getLanguageInfo(projectData.source);
    const targetLang = getLanguageInfo(projectData.target);
    const deadlineStatus = getDeadlineStatus();

    const handleDownloadConfirmation = async (type: 'order_confirmation' | 'pickup_confirmation') => {
        try {
            const toastId = toast.loading('Dokument wird erstellt...');
            const response = await projectService.downloadConfirmation(id!, type);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            openBlobInNewTab(blob);
            toast.dismiss(toastId);
            toast.success('Dokument geöffnet');
        } catch (error) {
            console.error('Download error:', error);
            toast.dismiss();
            toast.error('Dokument konnte nicht geladen werden.');
        }
    };

    return (
        <div className="flex flex-col fade-in min-h-screen bg-slate-50/30">
            {/* Project Header Container */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-[1600px] mx-auto">
                    <div className="px-3 sm:px-4 md:px-8 py-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate('/projects')}
                                    className="rounded-full text-slate-400 hover:text-slate-600 transition shrink-0"
                                >
                                    <FaArrowLeft />
                                </Button>

                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-sm bg-slate-50 text-slate-700 flex items-center justify-center text-xl font-semibold border border-slate-100 shadow-sm shrink-0">
                                        {projectData.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-lg md:text-xl font-semibold text-slate-800 tracking-tight break-words min-w-0" style={{ wordBreak: 'break-word' }}>{projectData.name}</h1>
                                            {projectData.priority !== 'low' && (
                                                <div className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0",
                                                    projectData.priority === 'express' ? "bg-red-50 text-red-600 border-red-100" : "bg-orange-50 text-orange-600 border-orange-100"
                                                )}>
                                                    {projectData.priority === 'express' ? <FaBolt /> : <FaFlag />}
                                                    <span>{projectData.priority === 'express' ? 'Express' : 'Dringend'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-4 text-sm text-slate-400 font-medium mt-1 flex-wrap">
                                            {getStatusBadge(projectData.status)}
                                            {projectData.project_number && (
                                                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                                    {projectData.project_number}
                                                </span>
                                            )}
                                            <span className="text-slate-200 hidden sm:inline">|</span>
                                            <span>System-ID: <span className="text-slate-600 font-medium">{projectData.id}</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:justify-end mt-4 md:mt-0">
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition flex-1 sm:flex-none justify-center"
                                >
                                    <FaEdit /> Bearbeiten
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={() => setIsProjectDeleteConfirmOpen(true)}
                                    className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition flex-1 sm:flex-none justify-center"
                                >
                                    <FaTrashAlt /> Löschen
                                </Button>

                                {/* Email senden */}
                                <Button
                                    variant="default"
                                    onClick={() => navigate('/inbox', { state: { openCompose: true, projectId: String(projectData.id) } })}
                                    className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition flex-1 sm:flex-none justify-center"
                                >
                                    <FaEnvelope /> E-Mail senden
                                </Button>

                                {/* Mehr Aktionen Dropdown */}
                                <div className="relative flex-1 sm:flex-none" ref={actionsRef}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsActionsOpen(v => !v)}
                                        className="w-full px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition justify-center"
                                    >
                                        Mehr Aktionen <FaChevronDown className={clsx('text-[10px] transition-transform', isActionsOpen && 'rotate-180')} />
                                    </Button>

                                    {isActionsOpen && (
                                        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-sm shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1">
                                            <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">PDF Dokumente</div>
                                            <button
                                                onClick={() => { handleDownloadConfirmation('order_confirmation'); setIsActionsOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-100 flex items-center gap-3 transition rounded-sm"
                                            >
                                                <FaFilePdf className="text-red-400 shrink-0" /> Auftragsbestätigung
                                            </button>
                                            <button
                                                onClick={() => { handleDownloadConfirmation('pickup_confirmation'); setIsActionsOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-100 flex items-center gap-3 transition rounded-sm"
                                            >
                                                <FaFilePdf className="text-red-400 shrink-0" /> Abholbestätigung
                                            </button>
                                            <button
                                                onClick={() => { setIsInterpreterModalOpen(true); setIsActionsOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-100 flex items-center gap-3 transition rounded-sm"
                                            >
                                                <FaFilePdf className="text-red-400 shrink-0" /> Dolmetscherbestätigung
                                            </button>

                                            <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-b border-slate-100 mt-1">Rechnung</div>
                                            {(() => {
                                                const activeInvoice = projectData.invoices?.find((inv: any) => !['cancelled'].includes(inv.status));
                                                return activeInvoice ? (
                                                    <button
                                                        onClick={() => { setPreviewInvoice(activeInvoice); setIsActionsOpen(false); }}
                                                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-emerald-700 hover:bg-gradient-to-b hover:from-emerald-50 hover:to-emerald-100 flex items-center gap-3 transition rounded-sm"
                                                    >
                                                        <FaFileInvoiceDollar className="text-emerald-500 shrink-0" /> {activeInvoice.invoice_number} öffnen
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => { setIsInvoiceModalOpen(true); setIsActionsOpen(false); }}
                                                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-100 flex items-center gap-3 transition rounded-sm"
                                                    >
                                                        <FaFileInvoiceDollar className="text-slate-400 shrink-0" /> Rechnung erstellen
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info Bar */}
                    <div className="px-3 sm:px-4 md:px-8 py-2 border-t border-slate-50 flex items-center gap-4 sm:gap-6 text-xs text-slate-400 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Erstellt am <span className="text-slate-600">{projectData.createdAt}</span> {projectData.creator && `von ${projectData.creator.name}`}</span>
                        </div>
                        <span className="text-slate-200">•</span>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            <span>Zuletzt geändert: <span className="text-slate-600">{projectData.updatedAt}</span></span>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="px-3 sm:px-4 md:px-8 border-b border-slate-200 flex items-center justify-between md:justify-start">
                        {/* Mobile Tab Menu Button */}
                        <div className="md:hidden flex-1 py-3">
                            <button
                                onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
                                className="flex items-center gap-3 text-slate-600 font-semibold text-sm hover:text-slate-700 transition-colors w-full"
                            >
                                <div className="w-4 h-3 flex flex-col justify-between">
                                    <span className={clsx("h-0.5 bg-current transition-all", isTabMenuOpen ? "rotate-45 translate-y-1" : "")}></span>
                                    <span className={clsx("h-0.5 bg-current transition-all", isTabMenuOpen ? "opacity-0" : "")}></span>
                                    <span className={clsx("h-0.5 bg-current transition-all", isTabMenuOpen ? "-rotate-45 -translate-y-1.5" : "")}></span>
                                </div>
                                <span>Menü: {
                                    activeTab === 'overview' ? 'Stammdaten' :
                                        activeTab === 'files' ? 'Dateien' :
                                            activeTab === 'finances' ? 'Kalkulation & Marge' :
                                                activeTab === 'history' ? 'Historie' : 'Kommunikation'
                                }</span>
                                <FaChevronDown className={clsx("ml-auto transition-transform", isTabMenuOpen && "rotate-180")} />
                            </button>
                        </div>

                        {/* Desktop Tabs */}
                        <div className="hidden md:flex gap-8">
                            {['overview', 'files', 'finances', 'messages', 'history'].map((tab) => {
                                let badgeCount = 0;
                                if (tab === 'files') badgeCount = projectData?.files?.length || 0;
                                if (tab === 'finances') badgeCount = (projectData?.positions?.length || 0) + (projectData?.payments?.length || 0);
                                if (tab === 'messages') badgeCount = projectData?.messages?.length || 0;

                                const isActive = activeTab === tab;

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => {
                                            setActiveTab(tab);
                                            setIsTabMenuOpen(false);
                                        }}
                                        className={clsx(
                                            "py-4 px-1 text-sm font-medium transition-all relative flex items-center gap-2.5 border-b-2 -mb-[1px]",
                                            isActive
                                                ? 'border-[#1B4D4F] text-[#1B4D4F] font-bold'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
                                        )}
                                    >
                                        {tab === 'overview' && <FaInfoCircle className={clsx("text-sm", isActive ? "text-[#1B4D4F]" : "text-slate-300")} />}
                                        {tab === 'files' && <FaFileAlt className={clsx("text-sm", isActive ? "text-[#1B4D4F]" : "text-slate-300")} />}
                                        {tab === 'finances' && <FaFileInvoiceDollar className={clsx("text-sm", isActive ? "text-[#1B4D4F]" : "text-slate-300")} />}
                                        {tab === 'messages' && <FaComments className={clsx("text-sm", isActive ? "text-[#1B4D4F]" : "text-slate-300")} />}
                                        {tab === 'history' && <FaClock className={clsx("text-sm", isActive ? "text-[#1B4D4F]" : "text-slate-300")} />}

                                        {tab === 'overview' ? 'Stammdaten' :
                                            tab === 'files' ? 'Dateien' :
                                                tab === 'finances' ? 'Kalkulation & Marge' :
                                                    tab === 'history' ? 'Historie' : 'Kommunikation'}

                                        {tab !== 'overview' && tab !== 'history' && (
                                            <span className={clsx(
                                                "px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors",
                                                isActive ? "bg-[#1B4D4F] text-white" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {badgeCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile Tab Menu Overlay */}
                    {isTabMenuOpen && (
                        <div className="md:hidden border-t border-slate-100 bg-white animate-slideUp">
                            <div className="flex flex-col">
                                {['overview', 'files', 'finances', 'messages', 'history'].map((tab) => {
                                    let badgeCount = 0;
                                    if (tab === 'files') badgeCount = projectData?.files?.length || 0;
                                    if (tab === 'finances') badgeCount = (projectData?.positions?.length || 0) + (projectData?.payments?.length || 0);
                                    if (tab === 'messages') badgeCount = projectData?.messages?.length || 0;

                                    const isActive = activeTab === tab;

                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => {
                                                setActiveTab(tab);
                                                setIsTabMenuOpen(false);
                                            }}
                                            className={clsx(
                                                "px-6 py-4 text-sm font-medium flex items-center gap-4 transition-all rounded-sm mx-2 my-1",
                                                isActive
                                                    ? 'bg-slate-50 text-[#1B4D4F] font-bold border-l-4 border-[#1B4D4F]'
                                                    : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-700'
                                            )}
                                        >
                                            {tab === 'overview' && <FaInfoCircle className="text-base" />}
                                            {tab === 'files' && <FaFileAlt className="text-base" />}
                                            {tab === 'finances' && <FaFileInvoiceDollar className="text-base" />}
                                            {tab === 'messages' && <FaComments className="text-base" />}
                                            {tab === 'history' && <FaClock className="text-base" />}

                                            <span className="flex-1 text-left">
                                                {tab === 'overview' ? 'Stammdaten' :
                                                    tab === 'files' ? 'Dateien' :
                                                        tab === 'finances' ? 'Kalkulation & Marge' :
                                                            tab === 'history' ? 'Historie' : 'Kommunikation'}
                                            </span>

                                            {tab !== 'overview' && tab !== 'history' && (
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                                    isActive ? "bg-slate-200 text-slate-900" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {badgeCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 max-w-[1600px] mx-auto w-full px-3 sm:px-4 md:px-8 py-4 sm:py-8 transition-all duration-300">
                {activeTab === 'overview' && (
                    <ProjectOverviewTab
                        projectData={projectData}
                        sourceLang={sourceLang}
                        targetLang={targetLang}
                        deadlineStatus={deadlineStatus}
                        getStatusBadge={getStatusBadge}
                        navigate={navigate}
                        locationPathname={location.pathname}
                        setIsCustomerSearchOpen={setIsCustomerSearchOpen}
                        setIsPartnerModalOpen={setIsPartnerModalOpen}
                        updateProjectMutation={updateProjectMutation}
                    />
                )}

                {activeTab === 'files' && (
                    <ProjectFilesTab
                        projectData={projectData}
                        fileFilterTab={fileFilterTab}
                        setFileFilterTab={setFileFilterTab}
                        setIsUploadModalOpen={setIsUploadModalOpen}
                        handlePreviewFile={handlePreviewFile}
                        handleDownloadFile={handleDownloadFile}
                        setDeleteFileConfirm={setDeleteFileConfirm}
                        toggleFileType={toggleFileType}
                        formatFileSize={formatFileSize}
                    />
                )}

                {activeTab === 'finances' && (
                    <ProjectFinancesTab
                        projectData={projectData}
                        onSavePositions={(positions) => updateProjectMutation.mutate({ positions })}
                        onRecordPayment={() => setIsPaymentModalOpen(true)}
                        onCreateInvoice={() => setIsInvoiceModalOpen(true)}
                        onGoToInvoice={() => {
                            const activeInvoice = projectData.invoices?.find(inv => !['cancelled'].includes(inv.status));
                            if (activeInvoice) setPreviewInvoice(activeInvoice);
                        }}
                        isPendingSave={updateProjectMutation.isPending}
                    />
                )}

                {
                    activeTab === 'messages' && (
                        <div className="mb-10 animate-fadeIn">
                            <MessagesTab projectData={projectData} projectId={id!} />
                        </div>
                    )
                }

                {
                    activeTab === 'history' && (
                        <HistoryTab
                            projectId={id!}
                            historySearch={historySearch}
                            setHistorySearch={setHistorySearch}
                            historySortKey={historySortKey}
                            setHistorySortKey={setHistorySortKey}
                            historySortDir={historySortDir}
                            setHistorySortDir={setHistorySortDir}
                        />
                    )
                }


            </div>

            <CustomerSelectionModal
                isOpen={isCustomerSearchOpen}
                onClose={() => setIsCustomerSearchOpen(false)}
                onSelect={(customer) => {
                    updateProjectMutation.mutate({ customer_id: customer.id });
                    // Optimistically update local state to reflect the change immediately
                    if (projectData) {
                        setProjectData({
                            ...projectData,
                            customer_id: customer.id,
                            customer: {
                                ...projectData.customer,
                                id: customer.id.toString(),
                                name: customer.company || customer.name,
                                contact: customer.contact || '-',
                                email: customer.email || '',
                                phone: customer.phone || '',
                                initials: customer.initials,
                                type: customer.type
                            },
                            client: customer.company || customer.name
                        });
                    }

                    setIsCustomerSearchOpen(false);
                }}
            />

            <PartnerSelectionModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onSelect={handlePartnerSelect} />
            <NewProjectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditSubmit}
                initialData={projectData}
                isLoading={updateProjectMutation.isPending}
            />
            <FileUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleFileUpload} />
            <NewInvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} onSubmit={(data) => invoiceMutation.mutate(data)} project={{ ...projectData, financials }} isLoading={invoiceMutation.isPending} />
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSave={(payment) => {
                    const newPayments = [...(projectData?.payments || []), payment];
                    if (projectData) {
                        setProjectData({ ...projectData, payments: newPayments });
                        updateProjectMutation.mutate({ payments: newPayments });
                    }
                }}
                totalAmount={financials.grossTotal}
            />

            {/* Kunden-Bearbeitungsmodal */}
            <NewCustomerModal
                isOpen={isCustomerEditModalOpen}
                onClose={() => setIsCustomerEditModalOpen(false)}
                onSubmit={(data) => updateCustomerMutation.mutate(data)}
                initialData={projectResponse?.customer}
                isLoading={updateCustomerMutation.isPending}
            />

            {/* Partner-Bearbeitungsmodal */}
            <NewPartnerModal
                isOpen={isPartnerEditModalOpen}
                onClose={() => setIsPartnerEditModalOpen(false)}
                onSubmit={(data) => updatePartnerMutation.mutate(data)}
                initialData={projectResponse?.partner}
                isLoading={updatePartnerMutation.isPending}
            />
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => {
                    if (previewFile?.url) window.URL.revokeObjectURL(previewFile.url);
                    setPreviewFile(null);
                }}
                file={previewFile}
                onDownload={() => previewFile?.id && handleDownloadFile({ name: previewFile.name, id: previewFile.id })}
            />
            <ConfirmModal
                isOpen={deleteFileConfirm.isOpen}
                onClose={() => setDeleteFileConfirm({ isOpen: false, fileId: null, fileName: '' })}
                onConfirm={() => {
                    if (deleteFileConfirm.fileId) {
                        deleteFileMutation.mutate(deleteFileConfirm.fileId);
                        setDeleteFileConfirm({ isOpen: false, fileId: null, fileName: '' });
                    }
                }}
                title="Datei löschen"
                message={`Möchten Sie die Datei "${deleteFileConfirm.fileName}" wirklich unwiderruflich löschen ? Diese Aktion kann nicht rückgängig gemacht werden.`}
                confirmText="Löschen"
                cancelText="Abbrechen"
                isLoading={deleteFileMutation.isPending}
            />
            <ConfirmModal
                isOpen={isProjectDeleteConfirmOpen}
                onClose={() => setIsProjectDeleteConfirmOpen(false)}
                onConfirm={() => deleteProjectMutation.mutate(id!)}
                title="Projekt löschen"
                message={`Möchten Sie das Projekt "${projectData.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
                confirmText="Löschen"
                cancelText="Abbrechen"
                type="danger"
                isLoading={deleteProjectMutation.isPending}
            />
            <InviteParticipantModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                projectId={id!}
            />

            <InterpreterConfirmationModal
                isOpen={isInterpreterModalOpen}
                onClose={() => setIsInterpreterModalOpen(false)}
                project={projectData}
            />

            <InvoicePreviewModal
                isOpen={!!previewInvoice}
                onClose={() => setPreviewInvoice(null)}
                invoice={previewInvoice}
            />
        </div >
    );
};

export default ProjectDetail;
