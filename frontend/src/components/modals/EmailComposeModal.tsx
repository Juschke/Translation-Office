import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { mailService, projectService, customerService } from '../../api/services';
import { formatCustomerLabel, formatPartnerLabel } from '../../utils/dropdownFormat';
import { useEmailCompose } from '../../hooks/useEmailCompose';
import { useEmailVariables } from '../../hooks/useEmailVariables';
import { substituteVariables, findUnreplacedPlaceholders } from '../../lib/templateUtils';
import Checkbox from '../common/Checkbox';
import {
    FaPaperPlane, FaTimes, FaPaperclip, FaFileAlt, FaEye,
    FaProjectDiagram, FaSearchPlus, FaCode, FaCheckCircle, FaLayerGroup,
    FaSignature, FaExclamationTriangle,
} from 'react-icons/fa';
import clsx from 'clsx';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import {
    Badge,
    ScrollArea,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
    Button
} from "../ui";

interface EmailComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: string | null;
    to?: string;
    subject?: string;
    body?: string;
}

const EmailComposeModal = ({
    isOpen,
    onClose,
    projectId: initialProjectId,
    to: initialTo,
    subject: initialSubject,
    body: initialBody,
}: EmailComposeModalProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const varPickerRef = useRef<HTMLDivElement>(null);

    const [isVarPickerOpen, setIsVarPickerOpen] = useState(false);
    const [isSignaturePickerOpen, setIsSignaturePickerOpen] = useState(false);
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const [varSearch, setVarSearch] = useState('');
    const [sigSearch, setSigSearch] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const signaturePickerRef = useRef<HTMLDivElement>(null);

    const {
        setIsComposeOpen,
        composeTo, setComposeTo,
        composeCc, setComposeCc,
        composeBcc, setComposeBcc,
        composeSubject, setComposeSubject,
        composeBody, setComposeBody,
        composeAttachments, setComposeAttachments,
        isComposePreview, setIsComposePreview,
        selectedProjectId, setSelectedProjectId,
        isProjectFilesModalOpen, setIsProjectFilesModalOpen,
        showToSuggestions, setShowToSuggestions,
        suggestionIndex, setSuggestionIndex,
        sendMutation,
        resetCompose,
        handleApplyTemplate,
        handleFileChange,
        removeAttachment,
    } = useEmailCompose();

    // Data Queries
    const { data: accounts = [] } = useQuery({
        queryKey: ['mail', 'accounts'],
        queryFn: mailService.getAccounts
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['mail', 'templates'],
        queryFn: mailService.getTemplates
    });

    const { data: projectDetails } = useQuery({
        queryKey: ['projects', selectedProjectId],
        queryFn: () => selectedProjectId ? projectService.getById(selectedProjectId) : null,
        enabled: !!selectedProjectId
    });

    const { data: signatures = [] } = useQuery({
        queryKey: ['mail', 'signatures'],
        queryFn: mailService.getSignatures
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getAll
    });

    const { data: partners = [] } = useQuery({
        queryKey: ['partners'],
        queryFn: () => queryClient.getQueryData(['partners']) || [] // Fallback to list if available
    });

    // Auto-fill when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsComposeOpen(true);
            if (initialProjectId) setSelectedProjectId(initialProjectId);
            if (initialTo) setComposeTo(initialTo);
            if (initialSubject) setComposeSubject(initialSubject);
            if (initialBody) setComposeBody(initialBody);
        } else {
            resetCompose();
        }
    }, [isOpen, initialProjectId, initialTo, initialSubject, initialBody]);

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts.find((a: any) => a.is_default) || accounts[0]);
        }
    }, [accounts, selectedAccount]);

    const { ALL_VARIABLES, VAR_GROUPS, getPreviewHtml } = useEmailVariables();

    /**
     * Build a context variable map from the currently linked project so we can
     * determine which {{placeholders}} remain unreplaced after template application.
     */
    const projectContextVars = useMemo<Record<string, string>>(() => {
        if (!projectDetails) return {} as Record<string, string>;
        const p = projectDetails as any;
        const custName = p.customer?.company_name || (p.customer?.first_name ? `${p.customer.first_name} ${p.customer.last_name}` : '');
        return {
            customer_name: custName,
            contact_person: p.customer?.contact_person || (p.customer?.first_name ? `${p.customer.first_name} ${p.customer.last_name}` : ''),
            customer_email: p.customer?.email || '',
            project_number: p.project_number || '',
            project_name: p.project_name || p.name || '',
            project_status: p.status || '',
            source_language: p.source_language?.name || '',
            target_language: p.target_language?.name || '',
            deadline: p.deadline ? new Date(p.deadline).toLocaleDateString('de-DE') : '',
            document_type: p.document_type?.name || '',
            priority: p.priority || '',
            price_net: p.price_total ? `${parseFloat(p.price_total).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` : '',
            partner_name: p.partner?.company_name || (p.partner?.first_name ? `${p.partner.first_name} ${p.partner.last_name}` : '') || p.translator?.name || '',
            partner_email: p.partner?.email || p.translator?.email || '',
        };
    }, [projectDetails]);

    /**
     * Count how many {{placeholders}} remain in the current body after substituting
     * available project context. Used to show the info banner.
     */
    const unreplacedPlaceholders = useMemo<string[]>(() => {
        if (!composeBody) return [];
        const substituted = substituteVariables(composeBody, projectContextVars);
        // Strip HTML tags before searching so we don't flag false positives in markup
        const text = substituted.replace(/<[^>]*>/g, '');
        return findUnreplacedPlaceholders(text);
    }, [composeBody, projectContextVars]);

    const contactSuggestions = useMemo(() => {
        const list: any[] = [];
        (Array.isArray(customers) ? customers : []).forEach((c: any) => {
            if (c.email) {
                list.push({
                    label: formatCustomerLabel(c),
                    value: c.email,
                    type: 'Kunde'
                });
            }
        });
        (Array.isArray(partners) ? partners : []).forEach((p: any) => {
            if (p.email) {
                list.push({
                    label: formatPartnerLabel(p),
                    value: p.email,
                    type: 'Partner'
                });
            }
        });
        return list;
    }, [customers, partners]);

    const filteredToSuggestions = useMemo(() => {
        if (!composeTo || !showToSuggestions) return [];
        const search = composeTo.toLowerCase();
        return contactSuggestions.filter(s =>
            s.label.toLowerCase().includes(search) ||
            s.value.toLowerCase().includes(search)
        ).slice(0, 10);
    }, [contactSuggestions, composeTo, showToSuggestions]);

    const handleAddProjectFiles = async (filesToAttach: any[]) => {
        const toastId = toast.loading(t('messages.preparing_project_files'));
        try {
            const newAttachments: File[] = [];
            for (const file of filesToAttach) {
                const response = await projectService.downloadFile(selectedProjectId!, file.id);
                const blob = response.data;
                const fileName = file.fileName || file.file_name || file.name || 'projekt_datei';
                const f = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
                newAttachments.push(f);
            }
            setComposeAttachments(prev => [...prev, ...newAttachments]);
            toast.success(`${filesToAttach.length} Datei(en) erfolgreich angehängt`, { id: toastId });
            setIsProjectFilesModalOpen(false);
        } catch (error) {
            toast.error('Fehler beim Abrufen der Projekt-Dateien', { id: toastId });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    const handleInternalClose = () => {
        resetCompose();
        onClose();
    };

    const handleSend = () => {
        sendMutation.mutate(selectedAccount?.id, {
            onSuccess: () => {
                handleInternalClose();
            }
        });
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleInternalClose()}>
                <DialogContent hideClose className="max-w-[1200px] w-[95vw] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden border-none shadow-2xl rounded-sm">
                    {/* Minimal Header */}
                    <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
                        <DialogTitle className="flex flex-col">
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FaPaperPlane className="text-slate-400 text-xs" />
                                NEUE NACHRICHT
                            </div>
                            <span className="text-sm text-slate-400 font-medium leading-none mt-1">
                                Gesendet via: <span className="font-bold text-slate-600">{selectedAccount?.email}</span>
                            </span>
                        </DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                                <FaTimes />
                            </Button>
                        </DialogClose>
                    </div>

                    <div className="flex-1 flex overflow-hidden bg-white">
                        {/* Main Editor Area */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <ScrollArea className="flex-1">
                                <div className="p-8 pb-32 space-y-1">
                                    {/* Sender Field */}
                                    <div className="flex items-center gap-4 py-2 border-b border-slate-100 group focus-within:border-brand-primary/30 transition-colors">
                                        <span className="text-xs font-bold text-slate-400 w-20 shrink-0 group-focus-within:text-brand-primary transition-colors">Absender</span>
                                        <select
                                            value={selectedAccount?.id}
                                            onChange={(e) => setSelectedAccount(accounts.find((a: any) => a.id === parseInt(e.target.value)))}
                                            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer appearance-none py-1 focus:outline-none"
                                        >
                                            {accounts.map((acc: any) => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.email})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Recipient Field */}
                                    <div className="flex items-start gap-4 py-2 border-b border-slate-100 group focus-within:border-brand-primary/30 transition-colors z-50">
                                        <span className="text-xs font-bold text-slate-400 w-20 shrink-0 group-focus-within:text-brand-primary transition-colors pt-1.5">Empfänger</span>
                                        <div className="flex-1 min-w-0">
                                            {projectDetails && (
                                                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                                                    {projectDetails.customer?.email && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setComposeTo(projectDetails.customer.email)}
                                                            className={clsx(
                                                                "px-2.5 py-1 rounded-[3px] text-sm font-semibold border transition-all flex items-center gap-1.5",
                                                                composeTo === projectDetails.customer.email
                                                                    ? "bg-gradient-to-b from-[#235e62] to-brand-primary text-white border-brand-primary/80 [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                                                    : "bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 border-[#ccc] hover:border-brand-primary hover:text-brand-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                                            )}
                                                        >
                                                            Kunde: {formatCustomerLabel(projectDetails.customer)}
                                                        </button>
                                                    )}
                                                    {(projectDetails.partner?.email || projectDetails.translator?.email) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setComposeTo(projectDetails.partner?.email || projectDetails.translator?.email)}
                                                            className={clsx(
                                                                "px-2.5 py-1 rounded-[3px] text-sm font-semibold border transition-all flex items-center gap-1.5",
                                                                composeTo === (projectDetails.partner?.email || projectDetails.translator?.email)
                                                                    ? "bg-gradient-to-b from-[#235e62] to-brand-primary text-white border-brand-primary/80 [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                                                    : "bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 border-[#ccc] hover:border-brand-primary hover:text-brand-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                                            )}
                                                        >
                                                            Partner: {formatPartnerLabel(projectDetails.partner || projectDetails.translator)}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            <div className="relative">
                                                <input
                                                    value={composeTo}
                                                    onChange={(e) => {
                                                        setComposeTo(e.target.value);
                                                        setShowToSuggestions(true);
                                                        setSuggestionIndex(0);
                                                    }}
                                                    onFocus={() => setShowToSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                                                    className="w-full bg-transparent border-none outline-none text-sm placeholder:text-slate-300 font-medium text-slate-800 py-1"
                                                    placeholder="empfaenger@beispiel.de"
                                                    autoComplete="off"
                                                />
                                                {showToSuggestions && filteredToSuggestions.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-sm overflow-hidden z-[101]">
                                                        {filteredToSuggestions.map((s, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    setComposeTo(s.value);
                                                                    setShowToSuggestions(false);
                                                                }}
                                                                className={clsx("w-full text-left px-4 py-3 border-b border-slate-50 last:border-0", idx === suggestionIndex ? "bg-slate-50" : "hover:bg-slate-50/50")}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-slate-800">{s.label}</span>
                                                                    <span className="text-sm font-medium text-slate-400 font-mono">{s.value}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CC Field */}
                                    <div className="flex items-center gap-4 py-2 border-b border-slate-100 group focus-within:border-brand-primary/30 transition-colors">
                                        <span className="text-xs font-bold text-slate-400 w-20 shrink-0 group-focus-within:text-brand-primary transition-colors">CC</span>
                                        <input
                                            value={composeCc}
                                            onChange={(e) => setComposeCc(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-300 font-medium text-slate-800 py-1"
                                            placeholder="cc@beispiel.de"
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* BCC Field */}
                                    <div className="flex items-center gap-4 py-2 border-b border-slate-100 group focus-within:border-brand-primary/30 transition-colors">
                                        <span className="text-xs font-bold text-slate-400 w-20 shrink-0 group-focus-within:text-brand-primary transition-colors">BCC</span>
                                        <input
                                            value={composeBcc}
                                            onChange={(e) => setComposeBcc(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-300 font-medium text-slate-800 py-1"
                                            placeholder="bcc@beispiel.de"
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Subject Field */}
                                    <div className="flex items-center gap-4 py-2 border-b border-slate-100 group focus-within:border-brand-primary/30 transition-colors">
                                        <span className="text-xs font-bold text-slate-400 w-20 shrink-0 group-focus-within:text-brand-primary transition-colors">Betreff</span>
                                        <input
                                            value={composeSubject}
                                            onChange={(e) => setComposeSubject(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-300 font-bold text-slate-800 py-1"
                                            placeholder="Betreff eingeben..."
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Link & variables Fields Section */}
                                    {selectedProjectId && (
                                        <div className="flex flex-col gap-4 py-6 border-b border-slate-50 bg-slate-50/10 px-6 -mx-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                                        <FaProjectDiagram /> Projekt-Verknüpfung
                                                    </label>
                                                </div>
                                                <div className="p-3 bg-white border border-slate-200 rounded-sm text-sm font-bold text-slate-800 flex items-center justify-between">
                                                    <span>{projectDetails?.project_number} — {projectDetails?.project_name || projectDetails?.name}</span>
                                                    <Badge variant="outline" className="text-sm">VERKNÜPFT</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Nachricht Label + Editor/Vorschau-Switch */}
                                    <div className="pt-4 flex items-center gap-4 border-b border-slate-100 pb-2">
                                        <span className="text-xs font-bold text-slate-400 w-20 shrink-0">Nachricht</span>
                                        <div className="flex bg-slate-100 p-0.5 rounded-sm">
                                            <button
                                                onClick={() => setIsComposePreview(false)}
                                                className={clsx("px-3 py-1 text-sm font-bold rounded-sm transition-all", !isComposePreview ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                                            >
                                                <div className="flex items-center gap-1.5"><FaCode size={10} /> EDITOR</div>
                                            </button>
                                            <button
                                                onClick={() => setIsComposePreview(true)}
                                                className={clsx("px-3 py-1 text-sm font-bold rounded-sm transition-all", isComposePreview ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                                            >
                                                <div className="flex items-center gap-1.5"><FaEye size={10} /> VORSCHAU</div>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2 flex-1 justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsHtmlMode(!isHtmlMode); }}
                                                    className={clsx(
                                                        "px-2.5 py-1 rounded-[3px] text-sm font-semibold border transition-all flex items-center gap-1.5",
                                                        isHtmlMode
                                                            ? "bg-slate-800 text-white border-slate-900"
                                                            : "bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 border-[#ccc] hover:border-brand-primary hover:text-brand-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                                    )}
                                                >
                                                    <FaCode size={8} /> {isHtmlMode ? 'Editor Modus' : 'HTML Code'}
                                                </button>

                                                <div ref={varPickerRef} className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsVarPickerOpen(v => !v); setVarSearch(''); setIsSignaturePickerOpen(false); }}
                                                        className={clsx(
                                                            "px-2.5 py-1 rounded-[3px] text-sm font-semibold border transition-all flex items-center gap-1.5",
                                                            isVarPickerOpen
                                                                ? "bg-gradient-to-b from-[#235e62] to-brand-primary text-white border-brand-primary/80 [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                                                : "bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 border-[#ccc] hover:border-brand-primary hover:text-brand-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                                        )}
                                                    >
                                                        <FaSearchPlus size={8} /> Variable wählen
                                                    </button>
                                                </div>

                                                <div ref={signaturePickerRef} className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsSignaturePickerOpen(v => !v); setSigSearch(''); setIsVarPickerOpen(false); }}
                                                        className={clsx(
                                                            "px-2.5 py-1 rounded-[3px] text-sm font-semibold border transition-all flex items-center gap-1.5",
                                                            isSignaturePickerOpen
                                                                ? "bg-gradient-to-b from-[#235e62] to-brand-primary text-white border-brand-primary/80 [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                                                : "bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 border-[#ccc] hover:border-brand-primary hover:text-brand-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                                        )}
                                                    >
                                                        <FaSignature size={8} /> Signatur wählen
                                                    </button>
                                                </div>

                                                {selectedProjectId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsProjectFilesModalOpen(true)}
                                                        className="px-2.5 py-1 rounded-[3px] text-sm font-semibold border bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 border-[#ccc] hover:border-brand-primary hover:text-brand-primary transition-all flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                                    >
                                                        <FaLayerGroup size={8} /> Projekt-Dateien
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-2.5 py-1 rounded-[3px] text-sm font-semibold border bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 border-[#ccc] hover:border-brand-primary hover:text-brand-primary transition-all flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                                >
                                                    <FaPaperclip size={8} /> Hochladen
                                                </button>
                                            </div>
                                        </div>

                                        {isVarPickerOpen && (
                                            <div className="absolute z-[60] left-8 right-8 border border-slate-200 rounded-sm bg-white shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                {/* Search */}
                                                <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-2 bg-white">
                                                    <FaSearchPlus size={10} className="text-slate-400 shrink-0" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={varSearch}
                                                        onChange={e => setVarSearch(e.target.value)}
                                                        placeholder="Variable suchen..."
                                                        className="flex-1 text-xs outline-none placeholder:text-slate-300 text-slate-700 font-medium bg-transparent"
                                                    />
                                                </div>

                                                {/* Results */}
                                                <div className="max-h-64 overflow-y-auto">
                                                    {(() => {
                                                        const q = varSearch.toLowerCase();
                                                        const filtered = ALL_VARIABLES.filter(v =>
                                                            !q ||
                                                            v.label.toLowerCase().includes(q) ||
                                                            v.key.toLowerCase().includes(q) ||
                                                            v.desc.toLowerCase().includes(q)
                                                        );
                                                        if (filtered.length === 0) return (
                                                            <p className="px-4 py-6 text-sm text-slate-400 text-center font-medium">Keine Variable gefunden</p>
                                                        );
                                                        const groups = varSearch ? [''] : VAR_GROUPS;
                                                        return groups.map(group => {
                                                            const items = varSearch
                                                                ? filtered
                                                                : filtered.filter(v => v.group === group);
                                                            if (items.length === 0) return null;
                                                            return (
                                                                <div key={group}>
                                                                    {!varSearch && (
                                                                        <div className="px-3 py-1.5 text-sm font-bold text-slate-400 bg-slate-50 border-b border-slate-100">
                                                                            {group}
                                                                        </div>
                                                                    )}
                                                                    {items.map(v => {
                                                                        const isSelected = composeBody.includes(`{{${v.key}}}`) || composeBody.includes(`{${v.key}}`);
                                                                        return (
                                                                            <button
                                                                                key={v.key}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (isSelected) {
                                                                                        const regex = new RegExp(`\\s?{{${v.key}}}|\\s?{${v.key}}`, 'g');
                                                                                        setComposeBody(prev => prev.replace(regex, ''));
                                                                                    } else {
                                                                                        setComposeBody(prev => prev + ` {{${v.key}}}`);
                                                                                    }
                                                                                }}
                                                                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 border-b border-slate-50 last:border-0 group"
                                                                            >
                                                                                <div className="flex items-center gap-3 min-w-0" >
                                                                                    <Checkbox checked={isSelected} onChange={() => { }} />
                                                                                    <div className="min-w-0">
                                                                                        <div className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{v.label}</div>
                                                                                        <div className="text-sm text-slate-400 font-medium truncate">{v.desc}</div>
                                                                                    </div>
                                                                                </div>
                                                                                <code className="text-sm font-mono text-slate-400 group-hover:text-slate-700 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">{`{{${v.key}}}`}</code>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        )}

                                        {isSignaturePickerOpen && (
                                            <div className="absolute z-[60] left-8 right-8 border border-slate-200 rounded-sm bg-white shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                {/* Search */}
                                                <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-2 bg-white">
                                                    <FaSignature size={10} className="text-slate-400 shrink-0" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={sigSearch}
                                                        onChange={e => setSigSearch(e.target.value)}
                                                        placeholder="Signatur suchen..."
                                                        className="flex-1 text-xs outline-none placeholder:text-slate-300 text-slate-700 font-medium bg-transparent"
                                                    />
                                                </div>

                                                {/* Results */}
                                                <div className="max-h-64 overflow-y-auto">
                                                    {(() => {
                                                        const q = sigSearch.toLowerCase();
                                                        const filtered = signatures.filter((s: any) =>
                                                            !q || s.name.toLowerCase().includes(q)
                                                        );
                                                        if (filtered.length === 0) return (
                                                            <p className="px-4 py-6 text-sm text-slate-400 text-center font-medium">Keine Signatur gefunden</p>
                                                        );
                                                        return filtered.map((s: any) => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setComposeBody(prev => prev + `<br><br>${s.content}`);
                                                                    setIsSignaturePickerOpen(false);
                                                                }}
                                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 border-b border-slate-50 last:border-0 group"
                                                            >
                                                                <div>
                                                                    <div className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{s.name}</div>
                                                                    <div className="text-sm text-slate-400 font-medium line-clamp-1">{s.content.replace(/<[^>]*>/g, '')}</div>
                                                                </div>
                                                                {s.is_default && <span className="text-sm font-bold bg-brand-primary/10 text-brand-primary px-1 rounded-sm">DEFAULT</span>}
                                                            </button>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Unreplaced placeholder banner */}
                                    {unreplacedPlaceholders.length > 0 && (
                                        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-sm bg-amber-50 border border-amber-200 text-[11px] text-amber-800 mt-1 mb-0">
                                            <FaExclamationTriangle size={12} className="shrink-0 mt-0.5 text-amber-500" />
                                            <span>
                                                <span className="font-bold">
                                                    Vorlage enthält {unreplacedPlaceholders.length}{' '}
                                                    {unreplacedPlaceholders.length === 1 ? 'nicht ersetzten Platzhalter' : 'nicht ersetzte Platzhalter'}:
                                                </span>{' '}
                                                {unreplacedPlaceholders.map((k, i) => (
                                                    <span key={k}>
                                                        <code className="font-mono bg-amber-100 px-1 rounded text-amber-900">{`{{${k}}}`}</code>
                                                        {i < unreplacedPlaceholders.length - 1 && ', '}
                                                    </span>
                                                ))}
                                                {selectedProjectId
                                                    ? ' — Werte aus verknüpftem Projekt wurden berücksichtigt.'
                                                    : ' — Projekt verknüpfen um mehr Platzhalter zu befüllen.'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Editor Content */}
                                    <div className="min-h-[300px] border border-slate-100 rounded-sm overflow-hidden mt-2 relative flex flex-col">
                                        {isComposePreview ? (
                                            <div className="p-8 h-[300px] bg-slate-50/30 overflow-y-auto">
                                                <div
                                                    className="prose prose-slate max-w-none text-sm text-slate-800 font-medium leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getPreviewHtml(composeBody)) }}
                                                />
                                            </div>
                                        ) : isHtmlMode ? (
                                            <textarea
                                                value={composeBody}
                                                onChange={e => setComposeBody(e.target.value)}
                                                className="w-full h-[300px] p-4 font-mono text-xs bg-slate-900 text-emerald-400 outline-none resize-none"
                                            />
                                        ) : (
                                            <ReactQuill
                                                theme="snow"
                                                value={composeBody}
                                                onChange={setComposeBody}
                                                modules={quillModules}
                                                className="quill-modern border-none flex-1"
                                                style={{ height: '250px' }}
                                            />
                                        )}
                                    </div>

                                    <div className="mt-8">
                                        <span className="text-sm font-bold text-slate-400 block mb-1.5">Anhänge</span>
                                        {/* Dropzone Area */}
                                        <div
                                            className="p-10 border-2 border-dashed border-slate-100 bg-slate-50/20 rounded-sm flex flex-col items-center justify-center gap-3 transition-all hover:bg-slate-50 hover:border-slate-300 group cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                                    setComposeAttachments([...composeAttachments, ...Array.from(e.dataTransfer.files)]);
                                                }
                                            }}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:scale-110 transition-all">
                                                <FaPaperclip size={16} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] font-bold text-slate-700">per Drag & Drop einfügen oder hier hinzufügen</p>
                                                <p className="text-sm text-slate-400 font-medium mt-1">Unterstützt alle Dateitypen</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attachments Section */}
                                    {composeAttachments.length > 0 && (
                                        <div className="pt-8 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-400 block">Anhänge</span>
                                                <Badge variant="secondary" className="text-sm font-bold px-1.5 py-0">{composeAttachments.length}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {composeAttachments.map((f, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-sm shadow-sm">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <FaPaperclip className="text-slate-400 text-sm" />
                                                            <div className="overflow-hidden">
                                                                <div className="text-[11px] font-bold text-slate-700 truncate">{f.name}</div>
                                                                <div className="text-sm text-slate-400 font-bold">{formatFileSize(f.size)}</div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => removeAttachment(i)} className="text-slate-300 hover:text-red-500 p-2">
                                                            <FaTimes size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Toolbar Footer */}
                            <div className="px-8 py-4 border-t border-slate-100 bg-white flex items-center gap-3 shrink-0">
                                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                                <Button
                                    onClick={handleSend}
                                    disabled={sendMutation.isPending || !composeTo || !composeSubject}
                                    className="bg-brand-primary text-white text-sm font-bold px-8"
                                >
                                    {sendMutation.isPending ? 'Sende...' : 'Nachricht senden'} <FaPaperPlane size={10} className="ml-2" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleInternalClose} className="text-sm font-bold text-slate-500">
                                    Abbrechen
                                </Button>
                            </div>
                        </div>

                        {/* Templates Sidebar */}
                        <div className="w-64 sm:w-72 lg:w-[300px] border-l border-slate-100 bg-slate-50/50 flex flex-col shrink-0 overflow-hidden">
                            <ScrollArea className="flex-1">
                                <div className="px-4 py-6 space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <FaFileAlt className="text-slate-400" /> VORLAGEN
                                        </h4>
                                        {templates.length > 0 && (
                                            <span className="text-sm font-bold bg-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200">
                                                {templates.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {templates.map((tpl: any) => (
                                            <button
                                                key={tpl.id}
                                                onClick={() => handleApplyTemplate(tpl)}
                                                className="w-full text-left p-2.5 bg-white border border-slate-100 hover:border-slate-900 transition-all rounded-sm shadow-sm group"
                                            >
                                                <div className="font-bold text-slate-800 text-sm mb-0.5 group-hover:text-brand-primary transition-colors">{tpl.name}</div>
                                                <div className="text-slate-400 text-sm truncate leading-tight">{tpl.subject}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Project Files Selector Modal */}
            <Dialog open={isProjectFilesModalOpen} onOpenChange={setIsProjectFilesModalOpen}>
                <DialogContent hideClose className="max-w-2xl bg-white p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-sm">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <FaProjectDiagram className="text-slate-400" /> Dateiauswahl aus Projekt
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={() => setIsProjectFilesModalOpen(false)} className="h-8 w-8 text-slate-400">
                            <FaTimes />
                        </Button>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-slate-400 mb-1">Verknüpftes Projekt</h4>
                            <p className="text-sm font-bold text-slate-800">{projectDetails?.project_number} — {projectDetails?.project_name || projectDetails?.name}</p>
                        </div>

                        <ScrollArea className="h-[400px]">
                            <div className="space-y-1.5">
                                {projectDetails?.files?.length > 0 ? (
                                    projectDetails.files.map((file: any) => {
                                        const actualFileName = file.file_name || file.fileName || file.name;
                                        const isAlreadyAttached = composeAttachments.some(a => a.name === actualFileName);

                                        return (
                                            <div
                                                key={file.id}
                                                onClick={() => {
                                                    if (!isAlreadyAttached) {
                                                        handleAddProjectFiles([file]);
                                                    } else {
                                                        const idx = composeAttachments.findIndex(a => a.name === actualFileName);
                                                        if (idx !== -1) removeAttachment(idx);
                                                    }
                                                }}
                                                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm hover:border-slate-900 transition-all group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <Checkbox checked={isAlreadyAttached} onChange={() => { }} />
                                                    <FaFileAlt className="text-slate-400" />
                                                    <div className="overflow-hidden">
                                                        <div className="text-[11px] font-bold text-slate-700 truncate">{actualFileName}</div>
                                                        <div className="text-sm text-slate-400">{formatFileSize(file.file_size || file.size)}</div>
                                                    </div>
                                                </div>
                                                {isAlreadyAttached && (
                                                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm flex items-center gap-1.5">
                                                        <FaCheckCircle size={10} /> ANGEHÄNGT
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-center text-slate-400 text-sm py-10">Keine Dateien im Projekt gefunden.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default EmailComposeModal;
