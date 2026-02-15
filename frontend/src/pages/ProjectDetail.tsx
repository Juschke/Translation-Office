import { useState, useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCloudUploadAlt, FaPlus, FaEdit, FaCheckCircle, FaExclamationTriangle, FaFlag, FaPaperPlane, FaClock, FaFileInvoiceDollar, FaComments, FaExternalLinkAlt, FaTrashAlt, FaDownload, FaAt, FaHashtag, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive, FaEye, FaPaperclip, FaUserPlus, FaInfoCircle, FaCopy, FaArchive, FaBolt, FaCheck, FaCamera, FaFile, FaStar } from 'react-icons/fa';
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
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, invoiceService, customerService, partnerService } from '../api/services';
import { getFlagUrl } from '../utils/flags';
import { getLanguageLabel } from '../utils/languages';
import { getCountryName } from '../utils/countries';

import TableSkeleton from '../components/common/TableSkeleton';
import FilePreviewModal from '../components/modals/FilePreviewModal';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
};

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
    translator: {
        id?: string;
        name: string;
        email: string;
        initials: string;
        phone: string;
        // Extended info
        address_street?: string;
        address_city?: string;
        address_country?: string;
        rating?: number;
        languages?: string[];
        price_per_word?: number;
        price_per_line?: number;
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
}

// ==== ATTRIBUTE LABEL MAP ====
const ATTRIBUTE_LABELS: Record<string, string> = {
    project_name: 'Projektname',
    project_number: 'Projektnummer',
    customer_id: 'Kunde',
    partner_id: 'Partner',
    source_lang_id: 'Quellsprache',
    target_lang_id: 'Zielsprache',
    document_type_id: 'Dokumentenart',
    additional_doc_types: 'Weitere Dokumentenarten',
    status: 'Status',
    priority: 'Priorität',
    word_count: 'Wortanzahl',
    line_count: 'Zeilenanzahl',
    price_total: 'Gesamtpreis',
    partner_cost_net: 'Partner-Kosten (Netto)',
    down_payment: 'Anzahlung',
    down_payment_date: 'Anzahlungsdatum',
    down_payment_note: 'Anzahlungsnotiz',
    currency: 'Währung',
    deadline: 'Liefertermin',
    is_certified: 'Beglaubigung',
    has_apostille: 'Apostille',
    is_express: 'Express',
    classification: 'Klassifizierung',
    copies_count: 'Kopien-Anzahl',
    copy_price: 'Kopie-Preis',
    notes: 'Notizen',
    created_at: 'Erstellt am',
    updated_at: 'Aktualisiert am',
    tenant_id: 'Mandant',
};

const EVENT_LABELS: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    created: { label: 'Erstellt', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    updated: { label: 'Aktualisiert', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    deleted: { label: 'Gelöscht', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
};

const formatFieldValue = (key: string, value: any): string => {
    if (value === null || value === undefined || value === '') {
        if (key === 'phone' || key?.includes('phone')) return 'keine Telefonnummer';
        return 'keine Angabe';
    }
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
    if (key === 'is_certified' || key === 'has_apostille' || key === 'is_express' || key === 'classification') {
        return value === true || value === 1 || value === '1' ? 'Ja' : 'Nein';
    }
    if (key === 'deadline' || key === 'down_payment_date' || key === 'created_at' || key === 'updated_at') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
            const days = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
            const dayName = days[d.getDay()];
            const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            return `${dayName}, ${dateStr} ${timeStr} `;
        }
    }
    if (key === 'price_total' || key === 'partner_cost_net' || key === 'down_payment' || key === 'copy_price') {
        return parseFloat(value).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    }
    if (key === 'status') {
        const statusMap: Record<string, string> = { offer: 'Angebot', in_progress: 'Bearbeitung', delivered: 'Geliefert', invoiced: 'Rechnung', ready_pickup: 'Abholbereit', completed: 'Abgeschlossen' };
        return statusMap[value] || value;
    }
    if (key === 'priority') {
        const pMap: Record<string, string> = { low: 'Normal', medium: 'Normal', high: 'Dringend', express: 'Express' };
        return pMap[value] || value;
    }
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
};

const HistoryTab = ({ projectId, historySearch, setHistorySearch, historySortKey, setHistorySortKey, historySortDir, setHistorySortDir }: {
    projectId: string;
    historySearch: string;
    setHistorySearch: (s: string) => void;
    historySortKey: string;
    setHistorySortKey: (s: any) => void;
    historySortDir: string;
    setHistorySortDir: (s: any) => void;
}) => {
    const { data: activities = [], isLoading } = useQuery({
        queryKey: ['project-activities', projectId],
        queryFn: () => projectService.getActivities(projectId),
        enabled: !!projectId,
    });

    const filteredActivities = useMemo(() => {
        let filtered = activities;
        if (historySearch.trim()) {
            const search = historySearch.toLowerCase();
            filtered = activities.filter((a: any) =>
                (a.causer?.name || '').toLowerCase().includes(search) ||
                (a.event || '').toLowerCase().includes(search) ||
                (a.description || '').toLowerCase().includes(search) ||
                (a.subject_type || '').toLowerCase().includes(search) ||
                JSON.stringify(a.properties).toLowerCase().includes(search)
            );
        }

        return [...filtered].sort((a: any, b: any) => {
            let res = 0;
            if (historySortKey === 'date') {
                res = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            } else if (historySortKey === 'user') {
                res = (a.causer?.name || '').localeCompare(b.causer?.name || '');
            } else if (historySortKey === 'action') {
                res = (a.event || '').localeCompare(b.event || '');
            }
            return historySortDir === 'asc' ? res : -res;
        });
    }, [activities, historySearch, historySortKey, historySortDir]);

    if (isLoading) {
        return <TableSkeleton rows={5} columns={4} />;
    }

    const renderChanges = (activity: any) => {
        const oldAttributes = activity.properties?.old || {};
        const newAttributes = activity.properties?.attributes || {};
        const changedKeys = Object.keys(newAttributes).filter(k => k !== 'updated_at' && k !== 'created_at');

        if (activity.event === 'created') return <span className="text-emerald-600 font-medium">Erstellt</span>;
        if (activity.event === 'deleted') return <span className="text-red-600 font-medium">Gelöscht</span>;

        if (changedKeys.length === 0) return <span className="text-slate-400 italic">-</span>;

        return (
            <div className="flex flex-col gap-1">
                {changedKeys.map(key => {
                    const label = ATTRIBUTE_LABELS[key] || key;
                    const oldVal = formatFieldValue(key, oldAttributes[key]);
                    const newVal = formatFieldValue(key, newAttributes[key]);
                    return (
                        <div key={key} className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-slate-600">{label}:</span>
                            <span className="text-red-400 line-through text-[10px] decoration-slate-300 max-w-[100px] truncate">{oldVal}</span>
                            <FaArrowLeft className="rotate-180 text-[8px] text-slate-300" />
                            <span className="text-emerald-600 font-medium max-w-[150px] truncate">{newVal}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-10 h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <FaClock className="text-brand-500" /> Projekt-Historie
                    </h3>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">{filteredActivities.length}</span>
                </div>
                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Suche..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition shadow-sm"
                    />
                    <FaEye className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition" onClick={() => { setHistorySortKey('date'); setHistorySortDir(historySortDir === 'asc' ? 'desc' : 'asc'); }}>
                                <div className="flex items-center gap-1">Datum {historySortKey === 'date' && (historySortDir === 'asc' ? '↑' : '↓')}</div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition" onClick={() => { setHistorySortKey('user'); setHistorySortDir(historySortDir === 'asc' ? 'desc' : 'asc'); }}>
                                <div className="flex items-center gap-1">Benutzer {historySortKey === 'user' && (historySortDir === 'asc' ? '↑' : '↓')}</div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition" onClick={() => { setHistorySortKey('action'); setHistorySortDir(historySortDir === 'asc' ? 'desc' : 'asc'); }}>
                                <div className="flex items-center gap-1">Aktion {historySortKey === 'action' && (historySortDir === 'asc' ? '↑' : '↓')}</div>
                            </th>
                            <th className="px-6 py-3 w-1/2">Details / Änderungen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs bg-white">
                        {filteredActivities.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                    Keine Einträge gefunden.
                                </td>
                            </tr>
                        ) : (
                            filteredActivities.map((activity: any) => {
                                const validDate = !isNaN(new Date(activity.created_at).getTime());
                                return (
                                    <tr key={activity.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono">
                                            {validDate ? new Date(activity.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                            <span className="text-slate-400 ml-2">{validDate ? new Date(activity.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[10px] font-bold border border-brand-100">
                                                    {(activity.causer?.name || '?')[0]}
                                                </div>
                                                <span className="font-medium text-slate-700">{activity.causer?.name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                                                EVENT_LABELS[activity.event]?.color || 'text-slate-600',
                                                EVENT_LABELS[activity.event]?.bgColor || 'bg-slate-50',
                                                EVENT_LABELS[activity.event]?.borderColor || 'border-slate-200'
                                            )}>
                                                {EVENT_LABELS[activity.event]?.label || activity.event}
                                            </span>
                                            <div className="text-[10px] text-slate-400 mt-1">{activity.subject_type?.split('\\').pop() || 'Item'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {renderChanges(activity)}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MessagesTab = ({ projectData, projectId }: { projectData: any, projectId: string }) => {
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [projectData.messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        projectService.postMessage(projectId, newMessage).then(() => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('file', e.target.files[0]);
            const toastId = toast.loading('Lade Datei hoch...');
            projectService.uploadFile(projectId, formData).then(() => {
                toast.dismiss(toastId);
                toast.success('Datei gesendet');
                const content = `[Datei hochgeladen: ${e.target.files![0].name}]`;
                projectService.postMessage(projectId, content).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
                });
            }).catch(() => {
                toast.dismiss(toastId);
                toast.error('Upload Fehler');
            });
        }
    };

    const messages = [...(projectData.messages || [])].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] mb-10 animate-fadeIn">
            {/* Header */}
            <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <FaComments /> Kommunikation
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    {!projectData.access_token ? (
                        <button
                            onClick={() => {
                                projectService.generateToken(projectId).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
                                    toast.success('Gast-Link generiert');
                                });
                            }}
                            className="px-3 py-1.5 bg-brand-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-brand-700 transition shadow-sm"
                        >
                            Gast-Zugang aktivieren
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-slate-500 font-mono select-all truncate max-w-[150px]">
                                {window.location.origin}/guest/project/{projectData.access_token}
                            </span>
                            <div className="h-3 w-px bg-slate-200 mx-1"></div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin} /guest/project / ${projectData.access_token} `);
                                    toast.success('Link kopiert');
                                }}
                                className="text-slate-400 hover:text-brand-600 transition p-1"
                                title="Link kopieren"
                            >
                                <FaCopy />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <p className="text-sm italic">Haben Sie Fragen? Schreiben Sie uns!</p>
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = !!msg.user_id;
                        return (
                            <div key={msg.id} className={clsx("flex flex-col max-w-[85%]", isMe ? "self-end items-end" : "self-start items-start")}>
                                <div className={clsx("px-3 py-2 rounded-2xl text-xs shadow-sm", isMe ? "bg-brand-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none")}>
                                    {msg.content}
                                </div>
                                <div className="text-[9px] text-slate-300 mt-0.5 flex gap-2 uppercase tracking-wide font-bold px-1">
                                    <span>{msg.user ? msg.user.name : (msg.sender_name || 'Gast')}</span>
                                    <span>{new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-slate-100 bg-white">
                <div className="flex gap-2 items-center">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-400 hover:text-brand-600 transition shadow-sm"
                    >
                        <FaPaperclip />
                    </button>
                    <button
                        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-400 hover:text-brand-600 transition shadow-sm"
                        onClick={() => toast.success('Kamera-Funktion (Demo)')}
                    >
                        <FaCamera />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Nachricht..."
                            className="w-full h-9 pl-4 pr-10 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none shadow-sm text-xs transition-all"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendMessage();
                            }}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="absolute right-1 top-1 w-7 h-7 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            <FaPaperPlane className="text-[10px]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type?: string; id?: string } | null>(null);
    const [fileFilterTab, setFileFilterTab] = useState<'all' | 'source' | 'target'>('all');
    const [historySearch, setHistorySearch] = useState('');
    const [historySortKey, setHistorySortKey] = useState<'date' | 'user' | 'action'>('date');
    const [historySortDir, setHistorySortDir] = useState<'asc' | 'desc'>('asc');
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isCustomerEditModalOpen, setIsCustomerEditModalOpen] = useState(false);
    const [isPartnerEditModalOpen, setIsPartnerEditModalOpen] = useState(false);
    const [deleteFileConfirm, setDeleteFileConfirm] = useState<{ isOpen: boolean; fileId: string | null; fileName: string }>({ isOpen: false, fileId: null, fileName: '' });
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Inline Editing State
    const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
    const [projectMessages, setProjectMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');

    // Comprehensive Project State
    const [projectData, setProjectData] = useState<ProjectData | null>(null);

    const { data: projectResponse, isLoading, error } = useQuery({
        queryKey: ['projects', id],
        queryFn: () => projectService.getById(id!),
        enabled: !!id
    });

    const generateDocumentMutation = useMutation({
        mutationFn: (type: 'confirmation' | 'pickup' | 'reminder') => projectService.generateDocument(id!, type),
        onSuccess: (data: any) => {
            if (data.url) {
                window.open(data.url, '_blank');
                toast.success('Dokument erfolgreich generiert');
            } else {
                toast.success(data.message || 'Dokument erstellt!');
            }
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Fehler beim Erstellen des Dokuments.');
        }
    });

    useEffect(() => {
        if (projectResponse) {
            // Map backend data to frontend structure
            const mapped: ProjectData = {
                id: projectResponse.id.toString(),
                name: projectResponse.project_name || '',
                client: projectResponse.customer?.company_name || `${projectResponse.customer?.first_name} ${projectResponse.customer?.last_name} ` || 'Unbekannter Kunde',
                customer_id: projectResponse.customer_id,
                customer: projectResponse.customer ? {
                    id: projectResponse.customer.id.toString(),
                    name: projectResponse.customer.company_name || `${projectResponse.customer.first_name} ${projectResponse.customer.last_name} `,
                    contact: projectResponse.customer.company_name ? `${projectResponse.customer.first_name} ${projectResponse.customer.last_name} ` : 'Privatkunde',
                    email: projectResponse.customer.email || '',
                    phone: projectResponse.customer.phone || '',
                    initials: ((projectResponse.customer.first_name?.[0] || '') + (projectResponse.customer.last_name?.[0] || 'K')).toUpperCase(),
                    type: projectResponse.customer.type || 'client',
                    // Address fields from backend
                    address_street: projectResponse.customer.address_street || '',
                    address_house_no: projectResponse.customer.address_house_no || '',
                    address_zip: projectResponse.customer.address_zip || '',
                    address_city: projectResponse.customer.address_city || '',
                    address_country: projectResponse.customer.address_country || ''
                } : { id: '', name: 'Unbekannt', contact: '', email: '', phone: '', initials: '?', type: '' },
                source: projectResponse.source_language?.iso_code || projectResponse.source || 'de',
                target: projectResponse.target_language?.iso_code || projectResponse.target || 'en',
                source_language: projectResponse.source_language,
                target_language: projectResponse.target_language,
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
                docType: projectResponse.document_type ? [projectResponse.document_type.name] : (projectResponse.document_type_id ? [projectResponse.document_type_id.toString()] : []),
                document_type_id: projectResponse.document_type_id,
                additional_doc_types: projectResponse.additional_doc_types,
                translator: projectResponse.partner ? {
                    id: projectResponse.partner.id.toString(),
                    name: projectResponse.partner.company || `${projectResponse.partner.first_name} ${projectResponse.partner.last_name} `,
                    email: projectResponse.partner.email,
                    initials: ((projectResponse.partner.first_name?.[0] || '') + (projectResponse.partner.last_name?.[0] || 'P')).toUpperCase(),
                    phone: projectResponse.partner.phone || '',
                    address_street: projectResponse.partner.address_street,
                    address_city: projectResponse.partner.address_city,
                    address_country: projectResponse.partner.address_country,
                    rating: projectResponse.partner.rating,
                    languages: projectResponse.partner.languages,
                    price_per_word: projectResponse.partner.price_per_word,
                    price_per_line: projectResponse.partner.price_per_line
                } : {
                    name: '-',
                    email: '',
                    initials: '?',
                    phone: ''
                },
                documentsSent: !!projectResponse.documents_sent,
                pm: projectResponse.pm?.name || 'Admin',
                createdAt: new Date(projectResponse.created_at).toLocaleDateString('de-DE'),
                updatedAt: new Date(projectResponse.updated_at).toLocaleDateString('de-DE'),
                creator: projectResponse.creator,
                editor: projectResponse.editor,
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
                payments: projectResponse.payments || (projectResponse.down_payment ? [{
                    amount: projectResponse.down_payment,
                    payment_date: projectResponse.down_payment_date,
                    payment_method: projectResponse.down_payment_method,
                    note: projectResponse.down_payment_note
                }] : []),
                notes: projectResponse.notes || '',
                messages: projectResponse.messages || [],
                access_token: projectResponse.access_token,
                files: (projectResponse.files || []).map((f: any) => ({
                    id: f.id.toString(),
                    name: f.file_name || f.original_name,
                    fileName: f.file_name || f.original_name,
                    original_name: f.original_name,
                    ext: f.extension || (f.file_name || f.original_name || '').split('.').pop()?.toUpperCase() || '',
                    extension: f.extension,
                    type: f.type,
                    mime_type: f.mime_type,
                    version: f.version || '1.0',
                    size: f.file_size,
                    file_size: f.file_size,
                    words: f.word_count || 0,
                    chars: f.char_count || 0,
                    word_count: f.word_count || 0,
                    char_count: f.char_count || 0,
                    status: f.status || 'ready',
                    uploaded_by: f.uploader?.name || f.uploader?.email || 'System',
                    uploader: f.uploader,
                    created_at: f.created_at,
                    upload_date: f.created_at,
                    upload_time: f.created_at ? new Date(f.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
                }))
            };
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
    //     if (!projectData) return;
    //     let date = new Date();
    //     let added = 0;
    //     while (added < days) {
    //         date.setDate(date.getDate() + 1);
    //         if (date.getDay() !== 0 && date.getDay() !== 6) added++;
    //     }
    //     updateProjectMutation.mutate({ deadline: date.toISOString().split('T')[0] });
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
            <div className={clsx("flex items-center gap-2 text-xs font-bold uppercase tracking-tight", colors[status] || 'text-slate-600')}>
                {icons[status] || <FaClock />}
                <span>{labels[status] || status}</span>
            </div>
        );
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
            setIsInvoiceModalOpen(false);
            navigate('/invoices');
            toast.success('Rechnung erfolgreich erstellt');
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

    return (
        <div className="flex flex-col fade-in pb-10">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-6 mb-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={() => navigate('/projects')}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition shrink-0"
                        >
                            <FaArrowLeft />
                        </button>
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg md:text-xl font-bold border border-emerald-100 shadow-sm shrink-0">
                            {projectData.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h1 className="text-lg md:text-2xl font-bold text-slate-800 truncate">{projectData.name}</h1>
                                {projectData.priority !== 'low' && (
                                    <div className={clsx("flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border",
                                        projectData.priority === 'express' ? "bg-red-50 text-red-700 border-red-200" : "bg-orange-50 text-orange-700 border-orange-200"
                                    )}>
                                        <span>{projectData.priority === 'express' ? 'Express' : 'Dringend'}</span>
                                        {projectData.priority === 'express' ? <FaBolt className="text-[10px]" /> : <FaFlag className="text-[10px]" />}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap mt-2">
                                {getStatusBadge(projectData.status)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap ml-0 md:ml-auto self-start mt-1">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="bg-white border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-200 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm transition active:scale-95"
                            >
                                <FaEdit /> Bearbeiten
                            </button>
                            <button
                                onClick={() => setIsInvoiceModalOpen(true)}
                                className="bg-brand-600 border border-brand-600 text-white hover:bg-brand-700 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm transition active:scale-95"
                            >
                                <FaFileInvoiceDollar /> Rechnung
                            </button>
                        </div>
                    </div>
                </div>

                {/* Meta Information Row */}
                <div className="px-6 pb-4 flex items-center gap-6 flex-wrap text-[11px] text-slate-400">
                    <span>Projekt-ID: <span className="text-slate-600 font-medium">{projectData.id}</span></span>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span>Erstellt: <span className="text-slate-600">{projectData.createdAt} {projectData.creator ? `von ${projectData.creator.name}` : ''}</span></span>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span>Geändert: <span className="text-slate-600">{projectData.updatedAt} {projectData.editor ? `von ${projectData.editor.name}` : ''}</span></span>
                </div>


                {/* Tab Navigation */}
                <div className="px-6 border-t border-slate-100 flex gap-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {['overview', 'files', 'finances', 'messages', 'history'].map((tab) => {
                        let badgeCount = 0;
                        if (tab === 'files') badgeCount = projectData?.files?.length || 0;
                        if (tab === 'finances') badgeCount = (projectData?.positions?.length || 0) + (projectData?.payments?.length || 0);
                        if (tab === 'messages') badgeCount = projectData?.messages?.length || 0;

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={clsx(
                                    "py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition relative shrink-0 flex items-center gap-2",
                                    activeTab === tab
                                        ? 'border-brand-500 text-brand-700'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                )}
                            >
                                {tab === 'overview' ? 'Stammdaten' :
                                    tab === 'files' ? 'Dateien' :
                                        tab === 'finances' ? 'Kalkulation & Marge' :
                                            tab === 'history' ? 'Historie' : 'Kommunikation'}

                                {tab !== 'overview' && tab !== 'history' && (
                                    <span className={clsx(
                                        "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                                        activeTab === tab ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {badgeCount}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-10">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <FaFileInvoiceDollar className="text-brand-500" /> Projekt-Stammdaten
                            </h3>

                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-y-10 gap-x-12">
                            {/* Left Column: Core Info & Customer */}
                            <div className="flex flex-col gap-8 h-full">
                                {/* Section: Basisdaten */}
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2 mb-4">Basisdaten</h4>
                                    <div className="grid grid-cols-[110px_1fr] gap-y-3 gap-x-4 text-sm">
                                        <span className="text-slate-500 font-medium">Bezeichnung</span>
                                        <span className="text-slate-800">{projectData.name}</span>

                                        <span className="text-slate-500 font-medium">Sprachpaar</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-700 shadow-sm">
                                                <img src={sourceLang.flagUrl} alt="" className="w-3.5 h-2.5 rounded-[1px] object-cover" />
                                                <span className="font-medium">{sourceLang.name}</span>
                                            </div>
                                            <FaArrowLeft className="rotate-180 text-slate-300 text-xs" />
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-700 shadow-sm">
                                                <img src={targetLang.flagUrl} alt="" className="w-3.5 h-2.5 rounded-[1px] object-cover" />
                                                <span className="font-medium">{targetLang.name}</span>
                                            </div>
                                        </div>

                                        <span className="text-slate-500 font-medium">Projekt-ID</span>
                                        <span className="text-slate-600 font-mono text-xs px-1.5 py-0.5 rounded w-fit">{projectData.id}</span>

                                        <span className="text-slate-500 font-medium">Status</span>
                                        <div>{getStatusBadge(projectData.status)}</div>

                                        <span className="text-slate-500 font-medium">Lieferdatum</span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800">
                                                    {projectData.due ? (() => {
                                                        const d = new Date(projectData.due);
                                                        const days = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
                                                        return `${days[d.getDay()]}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} `;
                                                    })() : 'keine Angabe'}
                                                </span>
                                            </div>
                                            <div className={clsx("flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border shadow-sm", deadlineStatus.color)}>
                                                {deadlineStatus.label}
                                            </div>
                                        </div>

                                        <span className="text-slate-500 font-medium">Priorität</span>
                                        <div className="flex items-center gap-2">
                                            {projectData.priority === 'low' ? (
                                                <span className="text-slate-600 font-bold text-xs uppercase">Normal</span>
                                            ) : (
                                                <div className={clsx("flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight",
                                                    projectData.priority === 'express' ? "text-red-600" : "text-orange-600"
                                                )}>
                                                    <span>{projectData.priority === 'express' ? 'Express' : 'Dringend'}</span>
                                                    {projectData.priority === 'express' ? <FaBolt className="text-[10px]" /> : <FaFlag className="text-[10px]" />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Kunde */}
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Kunde / Auftraggeber</h4>
                                        <div className="flex gap-3">
                                            {projectData.customer_id && (
                                                <>
                                                    <button
                                                        onClick={() => setIsCustomerEditModalOpen(true)}
                                                        className="text-[10px] text-slate-400 font-bold hover:text-brand-600 flex items-center gap-1 transition-colors"
                                                    >
                                                        <FaEdit /> Bearbeiten
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/customers/${projectData.customer_id}`, { state: { from: location.pathname } })}
                                                        className="text-[10px] text-slate-400 font-bold hover:text-brand-600 flex items-center gap-1 transition-colors"
                                                    >
                                                        <FaExternalLinkAlt /> Akte
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => setIsCustomerSearchOpen(true)} className="text-[10px] text-brand-600 font-bold hover:underline">Ändern</button>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="grid grid-cols-[110px_1fr] gap-y-2 gap-x-4 text-sm mb-4">
                                            <span className="text-slate-500 font-medium">Firma/Name</span>
                                            <span className="text-slate-800">{projectData.customer.name}</span>

                                            <span className="text-slate-500 font-medium">Ansprechpartner</span>
                                            <span className="text-slate-800 font-bold">{projectData.customer.contact}</span>

                                            <span className="text-slate-500 font-medium">Straße</span>
                                            <span className="text-slate-800">{projectData.customer.address_street || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                            <span className="text-slate-500 font-medium">Hausnummer</span>
                                            <span className="text-slate-800">{projectData.customer.address_house_no || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                            <span className="text-slate-500 font-medium">PLZ</span>
                                            <span className="text-slate-800">{projectData.customer.address_zip || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                            <span className="text-slate-500 font-medium">Stadt</span>
                                            <span className="text-slate-800">{projectData.customer.address_city || <span className="text-slate-400 italic">Keine Angabe</span>}</span>

                                            <span className="text-slate-500 font-medium">Land</span>
                                            <span className="text-slate-800">
                                                {projectData.customer.address_country === 'DE' ? 'Deutschland' :
                                                    projectData.customer.address_country === 'AT' ? 'Österreich' :
                                                        projectData.customer.address_country === 'CH' ? 'Schweiz' :
                                                            projectData.customer.address_country || <span className="text-slate-400 italic">Keine Angabe</span>}
                                            </span>

                                            <span className="text-slate-500 font-medium">Email</span>
                                            <a href={`mailto:${projectData.customer.email} `} className="text-brand-600 hover:underline truncate block">{projectData.customer.email || 'keine Angabe'}</a>

                                            <span className="text-slate-500 font-medium">Telefon</span>
                                            <span className="text-slate-800">{projectData.customer.phone || 'keine Telefonnummer'}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-slate-200">
                                            <button
                                                onClick={() => generateDocumentMutation.mutate('reminder')}
                                                disabled={generateDocumentMutation.isPending}
                                                title="Zahlungserinnerung / Mahnung erstellen"
                                                className="px-2 py-1 bg-white text-slate-600 text-[9px] font-bold uppercase rounded border border-slate-200 hover:bg-slate-50 hover:text-brand-600 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50">
                                                <FaClock className="text-slate-400" /> Mahnung
                                            </button>
                                            <button
                                                onClick={() => generateDocumentMutation.mutate('pickup')}
                                                disabled={generateDocumentMutation.isPending}
                                                title="Abholbestätigung erstellen"
                                                className="px-2 py-1 bg-white text-slate-600 text-[9px] font-bold uppercase rounded border border-slate-200 hover:bg-slate-50 hover:text-brand-600 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50">
                                                <FaPaperPlane className="text-slate-400" /> Abhol-Best.
                                            </button>
                                            <button
                                                onClick={() => generateDocumentMutation.mutate('confirmation')}
                                                disabled={generateDocumentMutation.isPending}
                                                title="Auftragsbestätigung erstellen"
                                                className="px-2 py-1 bg-white text-slate-600 text-[9px] font-bold uppercase rounded border border-slate-200 hover:bg-slate-50 hover:text-brand-600 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50">
                                                <FaCheckCircle className="text-slate-400" /> Auftrags-Best.
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Order Details & Partner */}
                            <div className="flex flex-col gap-8 h-full">
                                {/* Section: Auftragsdetails */}
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2 mb-4">Auftragsdetails</h4>
                                    <div className="grid grid-cols-[110px_1fr] gap-y-3 gap-x-4 text-sm">
                                        <span className="text-slate-500 font-medium mt-1">Dokumentenart</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {projectData.docType.length > 0 ? projectData.docType.map((d: string) => (
                                                <span key={d} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase border border-slate-200 tracking-wide">{d}</span>
                                            )) : <span className="text-slate-400 text-xs italic">keine Angabe</span>}
                                        </div>

                                        <span className="text-slate-500 font-medium mt-1">Besonderheiten</span>
                                        <ul className="flex flex-col gap-1 text-sm text-slate-700">
                                            {!projectData.isCertified && !projectData.hasApostille && !projectData.isExpress && projectData.classification !== 'ja' && projectData.copies <= 0 && (
                                                <li className="text-slate-400 italic">Keine Besonderheiten</li>
                                            )}
                                            {projectData.isCertified && (
                                                <li className="flex items-center gap-2">
                                                    <FaCheck className="text-emerald-500 text-[10px]" /> Beglaubigung
                                                </li>
                                            )}
                                            {projectData.hasApostille && (
                                                <li className="flex items-center gap-2">
                                                    <FaCheck className="text-emerald-500 text-[10px]" /> Apostille
                                                </li>
                                            )}
                                            {projectData.isExpress && (
                                                <li className="flex items-center gap-2">
                                                    <FaBolt className="text-orange-500 text-[10px]" /> Express-Service
                                                </li>
                                            )}
                                            {projectData.classification === 'ja' && (
                                                <li className="flex items-center gap-2">
                                                    <FaCheck className="text-emerald-500 text-[10px]" /> Klassifizierung
                                                </li>
                                            )}
                                            {projectData.copies > 0 && (
                                                <li className="flex items-center gap-2">
                                                    <FaCopy className="text-slate-400 text-[10px]" />
                                                    <span>
                                                        {projectData.copies}x Kopie(n)
                                                        {projectData.copyPrice > 0 && (
                                                            <span className="text-slate-500 text-xs ml-1">
                                                                (+ {formatCurrency(projectData.copies * projectData.copyPrice)})
                                                            </span>
                                                        )}
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                {/* Section: Partner */}
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Ausführender Partner</h4>
                                        <div className="flex gap-3">
                                            {projectData.translator?.id && (
                                                <>
                                                    <button
                                                        onClick={() => setIsPartnerEditModalOpen(true)}
                                                        className="text-[10px] text-slate-400 font-bold hover:text-brand-600 flex items-center gap-1 transition-colors"
                                                    >
                                                        <FaEdit /> Bearbeiten
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/partners/${projectData.translator.id}`, { state: { from: location.pathname } })}
                                                        className="text-[10px] text-slate-400 font-bold hover:text-brand-600 flex items-center gap-1 transition-colors"
                                                    >
                                                        <FaExternalLinkAlt /> Akte
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => setIsPartnerModalOpen(true)} className="text-[10px] text-brand-600 font-bold hover:underline">Ändern</button>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="grid grid-cols-[110px_1fr] gap-y-2 gap-x-4 text-sm mb-4">
                                            {projectData.translator?.id ? (
                                                <>
                                                    <span className="text-slate-500 font-medium">Partner</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-800 font-bold">{projectData.translator.name}</span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                            <span className="font-semibold">ID:</span> {projectData.translator.id}
                                                        </span>
                                                    </div>

                                                    <span className="text-slate-500 font-medium">Bewertung</span>
                                                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <FaStar key={star} className={star <= (projectData.translator.rating || 0) ? "" : "text-slate-200"} />
                                                        ))}
                                                        <span className="text-slate-500 font-bold ml-1">({projectData.translator.rating || 0})</span>
                                                    </div>

                                                    <span className="text-slate-500 font-medium">Sprachen</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(Array.isArray(projectData.translator.languages) ? projectData.translator.languages : []).map((langCode: string, i: number) => (
                                                            <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-700 shadow-sm">
                                                                <img src={getFlagUrl(langCode)} alt={langCode} className="w-3.5 h-2.5 rounded-[1px] object-cover" />
                                                                <span className="font-medium">{getLanguageLabel(langCode)}</span>
                                                            </div>
                                                        ))}
                                                        {(!projectData.translator.languages || projectData.translator.languages.length === 0) && <span className="text-slate-400 italic">Keine</span>}
                                                    </div>

                                                    <span className="text-slate-500 font-medium">Adresse</span>
                                                    <div className="text-slate-800 text-sm">
                                                        {projectData.translator.address_city ? (
                                                            <span>
                                                                {projectData.translator.address_city}, {projectData.translator.address_country || 'DE'}
                                                            </span>
                                                        ) : <span className="text-slate-400 italic">Keine Adresse</span>}
                                                    </div>

                                                    <span className="text-slate-500 font-medium">Wortpreis</span>
                                                    <span className="text-slate-800 font-mono text-xs">{projectData.translator.price_per_word ? `${projectData.translator.price_per_word} €` : '-'}</span>

                                                    <span className="text-slate-500 font-medium">Zeilenpreis</span>
                                                    <span className="text-slate-800 font-mono text-xs">{projectData.translator.price_per_line ? `${projectData.translator.price_per_line} €` : '-'}</span>
                                                </>
                                            ) : (
                                                <span className="col-span-2 text-slate-400 italic py-4 text-center">Kein Partner zugewiesen</span>
                                            )}

                                            <span className="text-slate-500 font-medium">Status</span>
                                            <div className="flex items-center gap-2">
                                                <div className={clsx("w-2 h-2 rounded-full", projectData.documentsSent ? "bg-emerald-500" : "bg-slate-300")}></div>
                                                <span className={clsx("text-xs font-medium", projectData.documentsSent ? "text-emerald-700" : "text-slate-500")}>
                                                    {projectData.documentsSent ? 'Dokumente versendet' : 'Wartet auf Versand'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            {!projectData.documentsSent ? (
                                                <button
                                                    className="px-4 py-1.5 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-brand-700 transition shadow-sm flex items-center gap-2"
                                                    onClick={() => updateProjectMutation.mutate({ documents_sent: true })}
                                                >
                                                    <FaPaperPlane /> Dokumente senden
                                                </button>
                                            ) : (
                                                <div className="px-4 py-1.5 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase rounded flex items-center gap-2 border border-brand-100 w-fit">
                                                    <FaCheckCircle /> Versand bestätigt
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Width: Notes */}
                            <div className="lg:col-span-2 pt-4 border-t border-slate-100">
                                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2">Interne Notizen</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded border border-slate-100 min-h-[60px]">
                                    {projectData.notes || <span className="italic text-slate-400">Keine Notizen hinterlegt.</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                )
                }



                {activeTab === 'files' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-fadeIn px-6 mb-10">
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Projekt-Dateien</h3>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{projectData.files.length}</span>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                                    <button
                                        onClick={() => setFileFilterTab('all')}
                                        className={clsx("px-3 py-1 text-[10px] font-bold rounded-md transition", fileFilterTab === 'all' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                                    >
                                        Alle
                                    </button>
                                    <button
                                        onClick={() => setFileFilterTab('source')}
                                        className={clsx("px-3 py-1 text-[10px] font-bold rounded-md transition", fileFilterTab === 'source' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                                    >
                                        Quelle
                                    </button>
                                    <button
                                        onClick={() => setFileFilterTab('target')}
                                        className={clsx("px-3 py-1 text-[10px] font-bold rounded-md transition", fileFilterTab === 'target' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                                    >
                                        Ziel
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="px-4 py-2 bg-brand-600 text-white rounded text-[10px] font-black uppercase hover:bg-brand-700 transition shadow-sm flex items-center gap-2"
                            >
                                <FaCloudUploadAlt className="text-sm" /> Datei hochladen
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 text-slate-400 text-[9px] font-black uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Dateiname</th>
                                        <th className="px-6 py-4">Typ</th>
                                        <th className="px-6 py-4">Vers.</th>
                                        <th className="px-6 py-4">Größe</th>
                                        <th className="px-6 py-4">Hochgeladen von</th>
                                        <th className="px-6 py-4">Datum / Zeit</th>
                                        <th className="px-6 py-4 text-right">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {projectData.files
                                        .filter((f: any) => fileFilterTab === 'all' || f.type === fileFilterTab)
                                        .length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                                Keine Dateien für diesen Filter vorhanden.
                                            </td>
                                        </tr>
                                    ) : (
                                        projectData.files
                                            .filter((f: any) => fileFilterTab === 'all' || f.type === fileFilterTab)
                                            .map((file: any) => {
                                                const fileName = file.name || file.fileName || file.file_name || file.original_name || 'Unbenannte Datei';
                                                // fileType declaration removed as it was unused

                                                // Robust size calculation
                                                let displaySize = file.size || file.file_size || '0 B';
                                                if (typeof displaySize === 'number' || (typeof displaySize === 'string' && !isNaN(Number(displaySize)))) {
                                                    displaySize = formatFileSize(Number(displaySize));
                                                }

                                                // Robust date with full time
                                                const rawDate = file.upload_date || file.created_at;
                                                const dateObj = rawDate ? new Date(rawDate) : null;
                                                const isValidDate = dateObj && !isNaN(dateObj.getTime());
                                                const displayDate = isValidDate ? dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                                                const displayTime = isValidDate ? dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

                                                return (
                                                    <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td
                                                            className="px-6 py-4 font-bold text-slate-700 flex items-center gap-3 cursor-pointer hover:text-brand-600 transition"
                                                            onClick={() => handlePreviewFile(file)}
                                                        >
                                                            {fileName.endsWith('.pdf') ? <FaFilePdf className="text-red-500 text-lg" /> :
                                                                fileName.endsWith('.doc') || fileName.endsWith('.docx') ? <FaFileWord className="text-blue-500 text-lg" /> :
                                                                    fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ? <FaFileExcel className="text-emerald-500 text-lg" /> :
                                                                        fileName.endsWith('.jpg') || fileName.endsWith('.png') ? <FaFileImage className="text-purple-500 text-lg" /> :
                                                                            fileName.endsWith('.zip') || fileName.endsWith('.rar') ? <FaFileArchive className="text-orange-500 text-lg" /> :
                                                                                <FaFileAlt className="text-slate-400 text-lg" />}
                                                            <div className="flex flex-col">
                                                                <span>{fileName}</span>
                                                                <span className="text-[8px] text-slate-400 font-normal uppercase tracking-tighter">{file.original_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleFileType(file);
                                                                }}
                                                                title="Klicken zum Wechseln des Typs"
                                                                className={clsx(
                                                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border hover:opacity-80 transition cursor-pointer",
                                                                    file.type === 'source' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                        file.type === 'target' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                                            "bg-slate-50 text-slate-600 border-slate-100"
                                                                )}>
                                                                {file.type === 'source' ? 'Quelle' : file.type === 'target' ? 'Ziel' : file.type}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">V{file.version || '1.0'}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500">{displaySize}</td>
                                                        <td className="px-6 py-4 text-slate-600">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-[9px] font-bold text-brand-600">
                                                                    {(file.uploaded_by?.[0] || file.uploader?.name?.[0] || '?')}
                                                                </div>
                                                                <span className="font-medium">{file.uploaded_by || file.uploader?.name || 'System'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{displayDate}</span>
                                                                <span className="text-[10px] text-slate-400">{displayTime}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2 transition-opacity">
                                                                <button
                                                                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition"
                                                                    title="Ansehen"
                                                                    onClick={() => handlePreviewFile(file)}
                                                                >
                                                                    <FaEye className="text-[12px]" />
                                                                </button>
                                                                <button
                                                                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition"
                                                                    title="Herunterladen"
                                                                    onClick={() => handleDownloadFile(file)}
                                                                >
                                                                    <FaDownload className="text-[12px]" />
                                                                </button>
                                                                <button
                                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                                    title="Löschen"
                                                                    onClick={() => setDeleteFileConfirm({ isOpen: true, fileId: file.id, fileName: fileName })}
                                                                >
                                                                    <FaTrashAlt className="text-[12px]" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {
                    activeTab === 'finances' && (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10 animate-fadeIn">
                            {/* Left Column: Calculation Table */}
                            <div className="xl:col-span-8 space-y-6">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                                                <FaFileInvoiceDollar />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kalkulation</h3>
                                                <p className="text-[10px] text-slate-400 font-bold">Positionen & Preise</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={addPosition}
                                                className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase hover:bg-slate-100 hover:text-slate-800 transition shadow-sm flex items-center gap-1.5"
                                            >
                                                <FaPlus className="mb-0.5" /> Neu
                                            </button>
                                            <button
                                                onClick={handleSavePositions}
                                                disabled={updateProjectMutation.isPending}
                                                className="px-3 py-1.5 bg-brand-600 text-white rounded text-[10px] font-black uppercase hover:bg-brand-700 transition shadow-sm shadow-brand-500/20 disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                <FaCheckCircle /> Speichern
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead className="bg-slate-50/80 text-slate-500 text-[9px] font-black uppercase tracking-wider border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 w-10 text-center">#</th>
                                                    <th className="px-4 py-3">Beschreibung</th>
                                                    <th className="px-4 py-3 w-28 text-right">Menge</th>
                                                    <th className="px-4 py-3 w-24 text-right">Einh.</th>
                                                    <th className="px-4 py-3 w-28 text-right bg-red-50/30 text-red-400 border-l border-slate-100">EK (Stk)</th>
                                                    <th className="px-4 py-3 w-28 text-right bg-emerald-50/30 text-emerald-600 border-l border-slate-100">VK (Stk)</th>
                                                    <th className="px-4 py-3 w-28 text-right font-black text-slate-700 bg-emerald-50/30 border-l border-slate-100">Gesamt</th>
                                                    <th className="px-2 py-3 w-10 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs">
                                                {projectData.positions.map((pos: any, idx: number) => (
                                                    <tr key={pos.id} className="group hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                                        <td className="px-4 py-3">
                                                            {renderEditableCell(pos.id, 'description', pos.description, 'text', 'font-bold text-slate-700 w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-1 -mx-1')}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {renderEditableCell(pos.id, 'amount', pos.amount, 'number', 'text-right font-mono text-slate-600 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-1 -mx-1')}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <select
                                                                value={pos.unit}
                                                                onChange={(e) => handleCellUpdate(pos.id, 'unit', e.target.value)}
                                                                className="text-right text-[10px] font-bold uppercase text-slate-400 bg-transparent outline-none cursor-pointer hover:text-brand-600 transition-colors w-full appearance-none"
                                                            >
                                                                <option value="Wörter">Wörter</option>
                                                                <option value="Zeilen">Zeilen</option>
                                                                <option value="Seiten">Seiten</option>
                                                                <option value="Stunden">Stunden</option>
                                                                <option value="Pauschal">Pauschal</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-red-400 font-medium border-l border-slate-100 bg-red-50/5 group-hover:bg-red-50/20 transition-colors">
                                                            {renderEditableCell(pos.id, 'partnerRate', pos.partnerRate, 'number', 'text-right font-mono bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-red-100 rounded px-1 -mx-1')}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-emerald-600 font-medium border-l border-slate-100 bg-emerald-50/5 group-hover:bg-emerald-50/20 transition-colors">
                                                            {renderEditableCell(pos.id, 'customerRate', pos.customerRate, 'number', 'text-right font-mono bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded px-1 -mx-1')}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-slate-800 border-l border-slate-100 bg-emerald-50/10 group-hover:bg-emerald-50/30 transition-colors">
                                                            {parseFloat(pos.customerTotal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                        </td>
                                                        <td className="px-2 py-3 text-center">
                                                            <button
                                                                onClick={() => deletePosition(pos.id)}
                                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Position löschen"
                                                            >
                                                                <FaTrashAlt className="text-[10px]" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {projectData.positions.length === 0 && (
                                                    <tr>
                                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/30">
                                                            Keine Positionen vorhanden. Starten Sie mit "Neu".
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-slate-50 p-3 border-t border-slate-200 text-center">
                                        <p className="text-[10px] text-slate-400 italic">Alle Preise in Euro inkl. gesetzlicher MwSt. falls nicht anders angegeben.</p>
                                    </div>
                                </div>

                                {/* Payments Section Implementation */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                                                <FaFileInvoiceDollar />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Zahlungen</h3>
                                                <p className="text-[10px] text-slate-400 font-bold">Eingänge & Gutschriften</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase hover:bg-slate-50 hover:text-brand-600 transition shadow-sm flex items-center gap-1.5"
                                        >
                                            <FaPlus className="mb-0.5" /> Zahlung erfassen
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50/80 text-slate-500 text-[9px] font-black uppercase tracking-wider border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-3 w-32">Datum</th>
                                                    <th className="px-6 py-3">Beschreibung / Methode</th>
                                                    <th className="px-6 py-3 text-right">Betrag</th>
                                                    <th className="px-4 py-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs">
                                                {(projectData.payments || []).length > 0 ? (
                                                    projectData.payments.map((payment: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-6 py-3 font-mono text-slate-600">
                                                                {new Date(payment.created_at || payment.date || new Date()).toLocaleDateString('de-DE')}
                                                            </td>
                                                            <td className="px-6 py-3 font-medium text-slate-700">
                                                                {payment.note || 'Zahlungseingang'}
                                                                {payment.method && <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] uppercase tracking-wide">{payment.method}</span>}
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-bold text-emerald-600">
                                                                + {parseFloat(payment.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                                    <FaTrashAlt className="text-[10px]" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic bg-slate-50/30">
                                                            Noch keine Zahlungen verbucht.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Financial Summary Sidebar */}
                            <div className="xl:col-span-4 space-y-6">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                            <FaClock className="text-brand-500" /> Finanz-Status
                                        </h3>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Main Total Display */}
                                        <div className="text-center pb-6 border-b border-slate-100 border-dashed">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gesamtbetrag (Brutto)</p>
                                            <div className="text-4xl font-black text-slate-800 tracking-tight">
                                                {financials.grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl text-slate-400 font-bold">€</span>
                                            </div>
                                            <div className="mt-2 flex justify-center gap-2">
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                                                    financials.open <= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                )}>
                                                    {financials.open <= 0 ? 'Bezahlt' : 'Offen'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Breakdown */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-medium">Netto Umsatz</span>
                                                <span className="font-bold text-slate-700">{financials.netTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                                    MwSt. (19%)
                                                    <FaInfoCircle className="text-slate-300 text-[10px]" title="Standardsteuersatz Deutschland" />
                                                </span>
                                                <span className="font-bold text-slate-700">{financials.taxTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                            </div>

                                            <div className="flex justify-between items-center text-sm mb-2">
                                                <span className="font-bold text-slate-800">Gesamtbetrag (Brutto)</span>
                                                <span className="font-bold text-slate-800">{financials.grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                            </div>
                                            {/* Spacer */}
                                            <div className="h-px bg-slate-100 my-2"></div>

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-medium">Kosten (Partner)</span>
                                                <span className="font-bold text-red-400">- {financials.partnerTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                            </div>

                                            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 mt-4">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Marge / Gewinn</span>
                                                    <span className="text-lg font-black text-emerald-700">{financials.margin.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                                </div>

                                                {/* Progress Bar for Margin */}
                                                <div className="w-full bg-emerald-200/50 rounded-full h-1.5 mb-1">
                                                    <div
                                                        className={clsx("h-1.5 rounded-full transition-all duration-500",
                                                            financials.marginPercent > 30 ? "bg-emerald-500" :
                                                                financials.marginPercent > 10 ? "bg-amber-500" : "bg-red-500"
                                                        )}
                                                        style={{ width: `${Math.min(100, Math.max(0, financials.marginPercent))}% ` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-[9px] font-bold text-emerald-600/70">
                                                    <span>{financials.marginPercent.toFixed(1)}% Marge</span>
                                                    <span>Ziel: {'>'}30%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setIsInvoiceModalOpen(true)}
                                                className="col-span-2 py-2.5 bg-brand-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-brand-700 transition shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
                                            >
                                                <FaFileInvoiceDollar /> Rechnung erstellen
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }



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


            </div >

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
                            // Also update 'client' display field if used
                            client: customer.company || customer.name
                        });
                    }

                    setIsCustomerSearchOpen(false);
                }}
            />

            <PartnerSelectionModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onSelect={handlePartnerSelect} />
            <NewProjectModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditSubmit} initialData={projectData} />
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
                type="danger"
                isLoading={deleteFileMutation.isPending}
            />
            <InviteParticipantModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                projectId={id!}
            />

            {/* Spacer for bottom padding */}
            <div className="h-32" />
        </div >
    );
};

export default ProjectDetail;
