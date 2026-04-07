import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { mailService, projectService, customerService } from '../api/services';
import { useEmailCompose } from '../hooks/useEmailCompose';
import { useEmailVariables } from '../hooks/useEmailVariables';
import Checkbox from './common/Checkbox';
import {
    FaPaperPlane, FaTimes, FaPaperclip, FaFileAlt, FaEye,
    FaProjectDiagram, FaSearchPlus, FaCode, FaCheckCircle, FaLayerGroup,
    FaSignature, FaChevronRight, FaPlus, FaInfoCircle
} from 'react-icons/fa';
import clsx from 'clsx';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import NewEmailAccountModal from './modals/NewEmailAccountModal';
import {
    Badge,
    ScrollArea,
    Button,
    Dialog,
    DialogContent,
    DialogTitle
} from "./ui";

interface EmailComposeContentProps {
    onClose?: () => void;
    projectId?: string | null;
    to?: string;
    subject?: string;
    body?: string;
    isStandalone?: boolean;
}

const EmailComposeContent = ({
    onClose,
    projectId: initialProjectId,
    to: initialTo,
    subject: initialSubject,
    body: initialBody,
    isStandalone = false,
}: EmailComposeContentProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const [varSearch, setVarSearch] = useState('');
    const [sigSearch, setSigSearch] = useState('');
    const [sidebarTab, setSidebarTab] = useState<'templates' | 'variables' | 'signatures'>('templates');
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    const createAccountMutation = useMutation({
        mutationFn: (data: any) => mailService.createAccount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
            toast.success('Konto erfolgreich erstellt');
            setIsAccountModalOpen(false);
        },
        onError: () => toast.error('Fehler beim Erstellen des Kontos')
    });

    const {
        setIsComposeOpen,
        composeTo, setComposeTo,
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
        queryFn: () => queryClient.getQueryData(['partners']) || []
    });

    // Auto-fill when component mounts
    useEffect(() => {
        setIsComposeOpen(true);
        if (initialProjectId) setSelectedProjectId(initialProjectId);
        if (initialTo) setComposeTo(initialTo);
        if (initialSubject) setComposeSubject(initialSubject);
        if (initialBody) setComposeBody(initialBody);

        return () => {
            if (!isStandalone) resetCompose();
        };
    }, [initialProjectId, initialTo, initialSubject, initialBody, isStandalone]);

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts.find((a: any) => a.is_default) || accounts[0]);
        }
    }, [accounts, selectedAccount]);

    const { ALL_VARIABLES, VAR_GROUPS, getPreviewHtml } = useEmailVariables();

    const contactSuggestions = useMemo(() => {
        const list: any[] = [];
        customers.forEach((c: any) => {
            if (c.email) list.push({ label: `${c.company_name || (c.first_name + ' ' + c.last_name)}`, value: c.email, type: 'Kunde' });
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

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange({ target: { files: e.dataTransfer.files } } as any);
        }
    };

    const handleSend = () => {
        sendMutation.mutate(selectedAccount?.id, {
            onSuccess: () => {
                if (isStandalone) {
                    toast.success('E-Mail erfolgreich gesendet');
                    setTimeout(() => window.close(), 1500);
                } else if (onClose) {
                    onClose();
                }
            }
        });
    };

    return (
        <div
            className={clsx("flex-1 flex flex-col overflow-hidden bg-white font-inter", isStandalone && "h-screen")}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* 1. INFO BAR (Project Link) */}
            {selectedProjectId && projectDetails && (
                <div className="bg-brand-primary shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)] text-white px-4 py-2 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FaProjectDiagram className="opacity-70 shrink-0" size={14} />
                        <span className="text-[11px] font-bold tracking-tight uppercase whitespace-nowrap truncate">
                            {projectDetails.display_id || projectDetails.project_number} — {projectDetails.project_name || projectDetails.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] border-white/30 text-white font-bold h-5 uppercase tracking-widest px-1.5 leading-none">Verknüpft</Badge>
                    </div>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* 2. MAIN COMPOSER AREA */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* INPUT SECTION */}
                    <div className="px-6 pt-6 pb-2 space-y-3 shrink-0 bg-white z-10">
                        {/* VON (Sender) */}
                        <div className="flex items-center gap-4 group">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 shrink-0">VON</span>
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                                {accounts.length > 0 ? (
                                    <div className="relative flex-1 group/select">
                                        <select
                                            value={selectedAccount?.id}
                                            onChange={(e) => setSelectedAccount(accounts.find((a: any) => a.id === parseInt(e.target.value)))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer appearance-none focus:border-brand-primary outline-none transition-all pr-8"
                                        >
                                            {accounts.map((acc: any) => (
                                                <option key={acc.id} value={acc.id}>{acc.name} &lt;{acc.email}&gt;</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <FaChevronRight className="rotate-90" size={8} />
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsAccountModalOpen(true)}
                                        className="text-[10px] font-bold border-dashed border-slate-200 text-slate-400 hover:text-brand-primary hover:border-brand-primary h-8"
                                    >
                                        <FaPlus size={8} className="mr-2" /> E-MAIL KONTO HINZUFÜGEN
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsAccountModalOpen(true)}
                                    className="h-8 w-8 text-slate-400 hover:text-brand-primary shrink-0"
                                    title="Konten verwalten"
                                >
                                    <FaPlus size={10} />
                                </Button>
                            </div>
                        </div>

                        {/* AN (Recipient) */}
                        <div className="flex items-start gap-4 group">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 pt-2.5 shrink-0">AN</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="relative flex-1">
                                        <input
                                            value={composeTo}
                                            onChange={(e) => {
                                                setComposeTo(e.target.value);
                                                setShowToSuggestions(true);
                                                setSuggestionIndex(0);
                                            }}
                                            onFocus={() => setShowToSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                                            className="w-full bg-transparent border-b border-slate-100 focus:border-brand-primary outline-none text-sm placeholder:text-slate-300 font-semibold text-slate-800 py-1.5 transition-all"
                                            placeholder="empfaenger@beispiel.de"
                                            autoComplete="off"
                                        />
                                        {showToSuggestions && filteredToSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-2xl rounded-sm overflow-hidden z-[100] animate-in slide-in-from-top-2">
                                                {filteredToSuggestions.map((s, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            setComposeTo(s.value);
                                                            setShowToSuggestions(false);
                                                        }}
                                                        className={clsx(
                                                            "w-full text-left px-4 py-2.5 border-b border-slate-50 last:border-0",
                                                            idx === suggestionIndex ? "bg-slate-50" : "hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">{s.label}</span>
                                                            <span className="text-[10px] font-mono text-slate-400 tracking-tight">{s.value}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        {projectDetails?.customer?.email && (
                                            <button
                                                type="button"
                                                onClick={() => setComposeTo(projectDetails.customer.email)}
                                                className={clsx(
                                                    "px-2 py-1 rounded-sm text-[9px] font-bold border transition-all uppercase tracking-wider",
                                                    composeTo === projectDetails.customer.email
                                                        ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:border-brand-primary hover:text-brand-primary"
                                                )}
                                            >
                                                Kunde
                                            </button>
                                        )}
                                        {projectDetails?.translator?.email && (
                                            <button
                                                type="button"
                                                onClick={() => setComposeTo(projectDetails.translator.email)}
                                                className={clsx(
                                                    "px-2 py-1 rounded-sm text-[9px] font-bold border transition-all uppercase tracking-wider",
                                                    composeTo === projectDetails.translator.email
                                                        ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:border-brand-primary hover:text-brand-primary"
                                                )}
                                            >
                                                Partner
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BETREFF (Subject) */}
                        <div className="flex items-center gap-4 group">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 shrink-0">BETREFF</span>
                            <div className="flex-1 flex items-center gap-3">
                                <input
                                    value={composeSubject}
                                    onChange={(e) => setComposeSubject(e.target.value)}
                                    className="flex-1 bg-transparent border-b border-slate-100 focus:border-brand-primary outline-none text-sm placeholder:text-slate-300 font-bold text-slate-800 py-1.5 transition-all"
                                    placeholder="Betreff eingeben..."
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* ATTACHMENTS BAR (Compact Chips) */}
                        {composeAttachments.length > 0 && (
                            <div className="flex items-center gap-3 py-2 -mx-2 px-2 overflow-x-auto no-scrollbar border-t border-slate-50 mt-1">
                                <div className="flex gap-2">
                                    {composeAttachments.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-sm px-2 py-1 shrink-0 group hover:border-brand-primary transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                            <FaPaperclip className="text-slate-400 group-hover:text-brand-primary" size={8} />
                                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]">{f.name}</span>
                                            <span className="text-[9px] font-mono text-slate-300 uppercase">{formatFileSize(f.size)}</span>
                                            <button onClick={() => removeAttachment(i)} className="text-slate-300 hover:text-red-500 transition-colors ml-1">
                                                <FaTimes size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-7 text-[9px] font-bold text-slate-400 hover:text-brand-primary px-2 shrink-0"
                                >
                                    <FaPlus size={8} className="mr-1.5" /> WEITERE HINZUFÜGEN
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* EDITOR BODY */}
                    <div className="flex-1 flex flex-col overflow-hidden px-6 pb-6 mt-2">
                        <div className="flex-1 flex flex-col border border-slate-100 rounded-sm bg-white overflow-hidden shadow-sm shadow-slate-200/50">
                            {/* Editor Sub-Header / Tool buttons */}
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsHtmlMode(!isHtmlMode)}
                                        className={clsx(
                                            "h-7 px-3 rounded-sm text-[10px] font-bold uppercase tracking-tight flex items-center gap-1.5 transition-all border",
                                            isHtmlMode ? "bg-slate-900 text-emerald-400 border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                        )}
                                    >
                                        <FaCode size={10} /> {isHtmlMode ? 'Editor' : 'HTML'}
                                    </button>
                                    <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                    <button
                                        onClick={() => setIsComposePreview(!isComposePreview)}
                                        className={clsx(
                                            "h-7 px-3 rounded-sm text-[10px] font-bold uppercase tracking-tight flex items-center gap-1.5 transition-all border",
                                            isComposePreview ? "bg-brand-primary text-white border-brand-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                        )}
                                    >
                                        {isComposePreview ? <><FaCode size={10} /> Editar</> : <><FaEye size={10} /> Vorschau</>}
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsProjectFilesModalOpen(true)}
                                        className="h-7 px-2 text-[10px] font-bold text-slate-500 hover:text-brand-primary"
                                    >
                                        <FaLayerGroup size={10} className="mr-1.5" /> PROJEKT-DATEIEN
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-7 px-2 text-[10px] font-bold text-slate-500 hover:text-brand-primary"
                                    >
                                        <FaPaperclip size={10} className="mr-1.5" /> HOCHLADEN
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col">
                                {isComposePreview ? (
                                    <div className="p-8 h-full bg-slate-50/20 overflow-y-auto">
                                        <div
                                            className="prose prose-slate max-w-none text-sm text-slate-800 font-medium leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getPreviewHtml(composeBody)) }}
                                        />
                                    </div>
                                ) : isHtmlMode ? (
                                    <textarea
                                        value={composeBody}
                                        onChange={e => setComposeBody(e.target.value)}
                                        className="w-full h-full p-6 font-mono text-sm bg-slate-900 text-emerald-400 outline-none resize-none border-none selection:bg-emerald-500/20"
                                        spellCheck={false}
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <ReactQuill
                                            theme="snow"
                                            value={composeBody}
                                            onChange={setComposeBody}
                                            modules={quillModules}
                                            className="quill-modern border-none flex-1 flex flex-col overflow-hidden"
                                            placeholder="Schreiben Sie Ihre Nachricht hier..."
                                        />
                                    </div>
                                )}
                                {isDragOver && (
                                    <div className="absolute inset-0 bg-brand-primary/10 backdrop-blur-[2px] border-2 border-dashed border-brand-primary z-50 flex items-center justify-center animate-in fade-in duration-200">
                                        <div className="bg-white p-6 rounded-sm shadow-2xl flex flex-col items-center gap-4 border border-brand-primary/20">
                                            <div className="w-16 h-16 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                                                <FaPaperclip size={32} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Dateien hier ablegen</h3>
                                                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">Anhänge automatisch hinzufügen</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* EDITOR BODY CONTENT ENDS HERE */}
                </div>

                {/* 3. MULTI-TOOL SIDEBAR */}
                <div className="hidden lg:flex w-80 border-l border-slate-100 bg-slate-50/30 flex-col shrink-0 overflow-hidden shadow-[inset_1px_0_0_rgba(0,0,0,0.01)]">
                    {/* Tabs Header */}
                    <div className="flex p-2 bg-white border-b border-slate-100 shrink-0">
                        <button
                            onClick={() => setSidebarTab('templates')}
                            className={clsx(
                                "flex-1 pb-2 pt-2.5 px-2 text-center rounded-sm transition-all relative overflow-hidden",
                                sidebarTab === 'templates' ? "bg-slate-50 text-brand-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <FaFileAlt size={12} className="mx-auto mb-1.5" />
                            <span className="text-[9px] font-bold uppercase tracking-widest block">Vorlagen</span>
                            {sidebarTab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"></div>}
                        </button>
                        <button
                            onClick={() => setSidebarTab('variables')}
                            className={clsx(
                                "flex-1 pb-2 pt-2.5 px-2 text-center rounded-sm transition-all relative overflow-hidden",
                                sidebarTab === 'variables' ? "bg-slate-50 text-brand-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <FaSearchPlus size={12} className="mx-auto mb-1.5" />
                            <span className="text-[9px] font-bold uppercase tracking-widest block">Variable</span>
                            {sidebarTab === 'variables' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"></div>}
                        </button>
                        <button
                            onClick={() => setSidebarTab('signatures')}
                            className={clsx(
                                "flex-1 pb-2 pt-2.5 px-2 text-center rounded-sm transition-all relative overflow-hidden",
                                sidebarTab === 'signatures' ? "bg-slate-50 text-brand-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <FaSignature size={12} className="mx-auto mb-1.5" />
                            <span className="text-[9px] font-bold uppercase tracking-widest block">Signatur</span>
                            {sidebarTab === 'signatures' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"></div>}
                        </button>
                    </div>

                    <ScrollArea className="flex-1">
                        {/* SIDEBAR CONTENT SCROLLS HERE */}
                        <div className="p-4">
                            {sidebarTab === 'templates' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verfügbare Vorlagen</h4>
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm">{templates.length}</span>
                                    </div>
                                    {templates.map((tpl: any) => (
                                        <button
                                            key={tpl.id}
                                            onClick={() => handleApplyTemplate(tpl)}
                                            className="w-full text-left p-3 bg-white border border-slate-200 hover:border-brand-primary hover:shadow-md transition-all rounded-sm group relative overflow-hidden"
                                        >
                                            <div className="font-bold text-slate-800 text-[10px] mb-0.5 uppercase tracking-tight group-hover:text-brand-primary">{tpl.name}</div>
                                            <div className="text-slate-400 text-[9px] truncate leading-tight font-medium uppercase">{tpl.subject}</div>
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary">
                                                <FaChevronRight size={10} />
                                            </div>
                                        </button>
                                    ))}
                                    {templates.length === 0 && (
                                        <div className="text-center py-12 px-4 rounded-sm border border-dashed border-slate-200 bg-white">
                                            <FaFileAlt size={24} className="mx-auto text-slate-100 mb-3" />
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Keine Vorlagen gefunden</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {sidebarTab === 'variables' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <div className="relative mt-2">
                                        <input
                                            type="text"
                                            value={varSearch}
                                            onChange={e => setVarSearch(e.target.value)}
                                            placeholder="VARIABLE SUCHEN..."
                                            className="w-full bg-white border border-slate-200 rounded-sm px-3 py-2 text-[10px] font-bold uppercase tracking-widest placeholder:text-slate-300 focus:border-brand-primary outline-none transition-all"
                                        />
                                        <FaSearchPlus size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>

                                    <div className="space-y-3">
                                        {(() => {
                                            const q = varSearch.toLowerCase();
                                            const filtered = ALL_VARIABLES.filter(v =>
                                                !q || v.label.toLowerCase().includes(q) || v.key.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q)
                                            );
                                            if (filtered.length === 0) return <p className="px-4 py-12 text-[10px] text-slate-300 text-center font-bold uppercase tracking-widest italic border border-dashed border-slate-200 bg-white">Keine Variable gefunden</p>;
                                            const groups = varSearch ? [''] : VAR_GROUPS;
                                            return groups.map(group => {
                                                const items = varSearch ? filtered : filtered.filter(v => v.group === group);
                                                if (items.length === 0) return null;
                                                return (
                                                    <div key={group} className="space-y-1">
                                                        {!varSearch && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4 ml-1 flex items-center gap-2"><div className="w-1 h-3 bg-slate-200 rounded-full"></div> {group}</div>}
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
                                                                    className="w-full text-left p-2.5 bg-white border border-slate-100 hover:border-brand-primary transition-all rounded-sm group flex items-start gap-3 relative shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                                                >
                                                                    <div className="mt-0.5 shrink-0">
                                                                        <Checkbox checked={isSelected} onChange={() => { }} />
                                                                    </div>
                                                                    <div className="min-w-0 pr-12">
                                                                        <div className="text-[10px] font-bold text-slate-700 uppercase tracking-tight group-hover:text-brand-primary">{v.label}</div>
                                                                        <div className="text-[9px] text-slate-400 font-medium leading-normal mt-0.5">{v.desc}</div>
                                                                    </div>
                                                                    <code className="absolute right-2 top-2 text-[8px] font-mono text-slate-300 shrink-0 bg-slate-50 px-1 py-0.5 border border-slate-100 rounded group-hover:border-brand-primary group-hover:text-brand-primary transition-all">
                                                                        {`{{${v.key}}}`}
                                                                    </code>
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

                            {sidebarTab === 'signatures' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <div className="relative mt-2">
                                        <input
                                            type="text"
                                            value={sigSearch}
                                            onChange={e => setSigSearch(e.target.value)}
                                            placeholder="SIGNATUR SUCHEN..."
                                            className="w-full bg-white border border-slate-200 rounded-sm px-3 py-2 text-[10px] font-bold uppercase tracking-widest placeholder:text-slate-300 focus:border-brand-primary outline-none transition-all"
                                        />
                                        <FaSignature size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>

                                    <div className="space-y-2">
                                        {signatures.filter((s: any) => !sigSearch || s.name.toLowerCase().includes(sigSearch.toLowerCase())).map((s: any) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => { setComposeBody(prev => prev + `<br><br>${s.content}`); }}
                                                className="w-full text-left p-3 bg-white border border-slate-200 hover:border-brand-primary hover:shadow-md transition-all rounded-sm group relative"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="text-[10px] font-bold text-slate-800 uppercase tracking-tight group-hover:text-brand-primary">{s.name}</div>
                                                    {s.is_default && <span className="text-[8px] font-black bg-brand-primary text-white px-1.5 py-0.5 rounded-sm tracking-widest">DEFAULT</span>}
                                                </div>
                                                <div className="text-slate-400 text-[9px] line-clamp-2 leading-tight italic uppercase font-medium">{s.content.replace(/<[^>]*>/g, '')}</div>
                                                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary">
                                                    <FaPlus size={10} />
                                                </div>
                                            </button>
                                        ))}
                                        {signatures.length === 0 && (
                                            <div className="text-center py-12 px-4 rounded-sm border border-dashed border-slate-200 bg-white">
                                                <FaSignature size={24} className="mx-auto text-slate-100 mb-3" />
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Keine Signaturen gefunden</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                                <FaInfoCircle size={14} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight leading-none">Entwurf wird erstellt...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-10 text-[10px] uppercase font-bold tracking-widest text-slate-400 hover:text-red-500 transition-all hover:bg-slate-50">
                            Abbrechen
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right mr-4 hidden sm:block">
                        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">Empfänger</div>
                        <div className="text-[10px] font-bold text-slate-700 truncate max-w-[200px]">{composeTo || 'Kein Empfänger'}</div>
                    </div>
                    <Button
                        onClick={handleSend}
                        disabled={sendMutation.isPending || !composeTo || !composeSubject}
                        className="bg-brand-primary hover:bg-[#1B4D4F] text-white text-[11px] uppercase font-bold tracking-widest px-10 h-11 shadow-lg shadow-brand-primary/20 transition-all group"
                    >
                        {sendMutation.isPending ? 'Sende...' : 'Nachricht senden'}
                        <FaPaperPlane size={10} className="ml-2.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Button>
                </div>
            </div>

            {/* Modal Components */}
            <NewEmailAccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSubmit={(data) => createAccountMutation.mutate(data)}
            />

            {/* Project Files Selector Modal */}
            <Dialog open={isProjectFilesModalOpen} onOpenChange={setIsProjectFilesModalOpen}>
                <DialogContent hideClose className="max-w-2xl bg-white p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-sm">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <DialogTitle className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2 uppercase">
                            <FaProjectDiagram className="text-slate-400" /> Dateiauswahl aus Projekt
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={() => setIsProjectFilesModalOpen(false)} className="h-8 w-8 text-slate-400">
                            <FaTimes />
                        </Button>
                    </div>
                    <div className="p-6">
                        <div className="mb-6">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Verknüpftes Projekt</h4>
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
                                                onClick={() => !isAlreadyAttached ? handleAddProjectFiles([file]) : removeAttachment(composeAttachments.findIndex(a => a.name === actualFileName))}
                                                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm hover:border-slate-900 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <Checkbox checked={isAlreadyAttached} onChange={() => { }} />
                                                    <FaFileAlt className="text-slate-400" />
                                                    <div className="overflow-hidden">
                                                        <div className="text-[11px] font-bold text-slate-700 truncate">{actualFileName}</div>
                                                        <div className="text-[10px] text-slate-400">{formatFileSize(file.file_size || file.size)}</div>
                                                    </div>
                                                </div>
                                                {isAlreadyAttached && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm"><FaCheckCircle size={10} className="inline mr-1" /> ANGEHÄNGT</span>}
                                            </div>
                                        );
                                    })
                                ) : <p className="text-center text-slate-400 text-sm py-10">Keine Dateien im Projekt gefunden.</p>}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmailComposeContent;
