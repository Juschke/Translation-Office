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
    FaProjectDiagram, FaCheckCircle, FaLayerGroup,
    FaSignature, FaChevronRight, FaChevronLeft, FaPlus, FaEdit, FaEyeSlash, FaCode, FaSearch, FaSave, FaTrash, FaTerminal
} from 'react-icons/fa';
import clsx from 'clsx';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import NewEmailAccountModal from './modals/NewEmailAccountModal';
import NewEmailTemplateModal from './modals/NewEmailTemplateModal';
import NewEmailSignatureModal from './modals/NewEmailSignatureModal';
import {
    Badge,
    ScrollArea,
    Button,
    Dialog,
    DialogContent,
    DialogTitle
} from "./ui";
import SearchableSelect from './common/SearchableSelect';

interface EmailComposeContentProps {
    onClose?: () => void;
    projectId?: string | null;
    to?: string;
    subject?: string;
    body?: string;
    attachments?: string[];
    draftId?: string | number | null;
    isStandalone?: boolean;
    onSuccess?: () => void;
}

const EmailComposeContent = ({
    onClose,
    projectId: initialProjectId,
    to: initialTo,
    subject: initialSubject,
    body: initialBody,
    attachments: initialAttachments = [],
    draftId: initialDraftId = null,
    isStandalone = false,
    onSuccess,
}: EmailComposeContentProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(isStandalone);
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null);

    const handleHtmlScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (gutterRef.current) {
            gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    const [selectedSignature, setSelectedSignature] = useState<{ id: number; name: string; content: string } | null>(null);
    const [varSearch, setVarSearch] = useState('');
    const [sigSearch, setSigSearch] = useState('');
    const [tplSearch, setTplSearch] = useState('');
    const [sidebarTab, setSidebarTab] = useState<'templates' | 'variables' | 'signatures'>('templates');
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<any>(null);
    const [templateToEdit, setTemplateToEdit] = useState<any>(null);
    const [signatureToEdit, setSignatureToEdit] = useState<any>(null);

    const createAccountMutation = useMutation({
        mutationFn: (data: any) => mailService.createAccount(data),
        onSuccess: (newAccount) => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
            setSelectedAccount(newAccount);
            toast.success('Konto erfolgreich erstellt');
            setIsAccountModalOpen(false);
        },
        onError: () => toast.error('Fehler beim Erstellen des Kontos')
    });

    const createTemplateMutation = useMutation({
        mutationFn: (data: any) => mailService.createTemplate(data),
        onSuccess: (newTemplate) => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
            handleApplyTemplate(newTemplate);
            toast.success('Vorlage erfolgreich erstellt');
            setIsTemplateModalOpen(false);
        },
        onError: () => toast.error('Fehler beim Erstellen der Vorlage')
    });

    const createSignatureMutation = useMutation({
        mutationFn: (data: any) => mailService.createSignature(data),
        onSuccess: (newSignature) => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'signatures'] });
            setSelectedSignature(newSignature);
            toast.success('Signatur erfolgreich erstellt');
            setIsSignatureModalOpen(false);
        },
        onError: () => toast.error('Fehler beim Erstellen der Signatur')
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: (id: number) => mailService.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
            toast.success('Vorlage gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen der Vorlage')
    });

    const deleteSignatureMutation = useMutation({
        mutationFn: (id: number) => mailService.deleteSignature(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'signatures'] });
            toast.success('Signatur gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen der Signatur')
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
        draftId, setDraftId
    } = useEmailCompose();

    // Init from props
    useEffect(() => {
        setIsComposeOpen(true);
        if (initialProjectId) setSelectedProjectId(initialProjectId);
        if (initialTo) setComposeTo(initialTo);
        if (initialSubject) setComposeSubject(initialSubject);
        if (initialBody) setComposeBody(initialBody);
        if (initialDraftId) setDraftId(initialDraftId);

        return () => {
            if (!isStandalone) resetCompose();
        };
    }, [initialProjectId, initialTo, initialSubject, initialBody, initialDraftId, isStandalone]);

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

    const { data: projects = [] } = useQuery({
        queryKey: ['projects', 'all'],
        queryFn: () => projectService.getAll().then(res => res.data || res)
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getAll
    });

    const contactSuggestions = useMemo(() => {
        const list: any[] = [];
        customers.forEach((c: any) => {
            if (c.email) list.push({ label: `${c.company_name || (c.first_name + ' ' + c.last_name)}`, value: c.email, type: 'Kunde' });
        });
        return list;
    }, [customers]);

    const filteredToSuggestions = useMemo(() => {
        if (!composeTo || !showToSuggestions) return [];
        const search = composeTo.toLowerCase();
        return contactSuggestions.filter(s =>
            s.label.toLowerCase().includes(search) ||
            s.value.toLowerCase().includes(search)
        ).slice(0, 10);
    }, [contactSuggestions, composeTo, showToSuggestions]);

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

    // Handle initial attachments from standalone pre-fill
    const didAttachRef = useRef(false);
    useEffect(() => {
        if (initialAttachments.length > 0 && projectDetails?.files && !didAttachRef.current) {
            const filesToAttach = projectDetails.files.filter((f: any) => initialAttachments.includes(f.id.toString()) || initialAttachments.includes(f.id));
            if (filesToAttach.length > 0) {
                handleAddProjectFiles(filesToAttach);
                didAttachRef.current = true;
            }
        }
    }, [initialAttachments, projectDetails]);

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts.find((a: any) => a.is_default) || accounts[0]);
        }
    }, [accounts, selectedAccount]);

    useEffect(() => {
        if (signatures.length > 0 && selectedSignature === null) {
            const def = signatures.find((s: any) => s.is_default) || null;
            if (def) setSelectedSignature(def);
        }
    }, [signatures]);

    const { ALL_VARIABLES, VAR_GROUPS, getPreviewHtml } = useEmailVariables();

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

    const insertAtCursor = (text: string) => {
        if (isHtmlMode) {
            const textarea = editorRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;
                const newValue = value.substring(0, start) + text + value.substring(end);
                setComposeBody(newValue);

                // Focus and set selection after React re-renders with new value
                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + text.length, start + text.length);
                }, 10);
            } else {
                setComposeBody(prev => prev + text);
            }
        } else {
            const quill = quillRef.current?.getEditor();
            if (quill) {
                const range = quill.getSelection(true);
                if (range) {
                    quill.insertText(range.index, text);
                    quill.setSelection(range.index + text.length);
                } else {
                    const length = quill.getLength();
                    quill.insertText(length - 1, text);
                }
            } else {
                setComposeBody(prev => prev + text);
            }
        }
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

    const handleSaveDraft = () => {
        const bodyOverride = selectedSignature
            ? composeBody + '<br><br><hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0">' + selectedSignature.content
            : undefined;
        sendMutation.mutate({ accountId: selectedAccount?.id, bodyOverride, isDraft: true }, {
            onSuccess: () => {
                toast.success('Entwurf gespeichert');
                if (isStandalone) {
                    setTimeout(() => window.close(), 1000);
                } else if (onClose) {
                    onClose();
                }
            }
        });
    };

    const handleSend = () => {
        const bodyOverride = selectedSignature
            ? composeBody + '<br><br><hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0">' + selectedSignature.content
            : undefined;
        sendMutation.mutate({ accountId: selectedAccount?.id, bodyOverride, isDraft: false }, {
            onSuccess: () => {
                toast.success('E-Mail erfolgreich gesendet');
                onSuccess?.();
                if (isStandalone) {
                    setTimeout(() => window.close(), 1500);
                } else if (onClose) {
                    onClose();
                }
            }
        });
    };

    return (
        <div
            className={clsx(
                "flex-1 flex flex-col overflow-hidden bg-white font-inter min-h-0 min-w-[360px]",
                isStandalone ? "h-screen" : "h-full min-h-px"
            )}
            style={!isStandalone ? { maxHeight: 'calc(90vh - 64px)' } : {}}
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
                        <span className="text-[11px] font-bold tracking-tight  whitespace-nowrap truncate">
                            {projectDetails.display_id || projectDetails.project_number} — {projectDetails.project_name || projectDetails.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] border-white/30 text-white font-bold h-5  tracking-widest px-1.5 leading-none">Verknüpft</Badge>
                    </div>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden min-h-0 relative">
                {/* 2. MAIN COMPOSER AREA */}
                <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative min-h-0 min-w-0 bg-white custom-scrollbar">
                    {/* INPUT SECTION */}
                    <div className="px-4 pt-4 pb-2 space-y-2.5 shrink-0 bg-white z-10">
                        {/* PROJEKT (Project Selection) */}
                        <div className="pb-3 border-b border-slate-100 mb-2 relative">

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 group">
                                <span className="text-[9px] font-bold text-slate-400 tracking-widest sm:w-10 shrink-0">PROJEKT</span>
                                <div className="flex-1 flex min-w-0">
                                    <div className="flex-1 group/project">
                                        <SearchableSelect
                                            options={Array.isArray(projects) ? projects.map((p: any) => ({
                                                value: p.id.toString(),
                                                label: `${p.project_number || p.display_id}`,
                                            })) : []}
                                            value={selectedProjectId?.toString() || ''}
                                            onChange={(val) => setSelectedProjectId(val)}
                                            onEdit={selectedProjectId ? () => window.open(`/projects/${selectedProjectId}`, '_blank') : undefined}
                                            placeholder="Projekt zuordnen (optional)..."
                                            className="h-[42px]"
                                            roundedSide="left"
                                            isClearable={true}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => { /* Link to create project if needed */ }}
                                        className="h-[42px] px-4 rounded-r-sm border border-l-0 border-[#123a3c] bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white shadow-md hover:from-[#2a7073] hover:to-[#235e62] active:shadow-inner transition-all flex items-center justify-center group/add shrink-0"
                                        title="Neues Projekt erstellen"
                                    >
                                        <FaPlus size={10} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* VON (Sender) */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 group">
                            <span className="text-[9px] font-bold text-slate-400 tracking-widest sm:w-10 shrink-0">VON</span>
                            <div className="flex-1 flex min-w-0">
                                <div className="relative flex-1 group/sender">
                                    <SearchableSelect
                                        options={accounts.map((acc: any) => ({
                                            value: acc.id.toString(),
                                            label: acc.email,
                                        }))}
                                        value={selectedAccount?.id?.toString() || ''}
                                        onChange={(val) => setSelectedAccount(accounts.find((a: any) => a.id.toString() === val))}
                                        onEdit={() => { setAccountToEdit(selectedAccount); setIsAccountModalOpen(true); }}
                                        placeholder="Sender wählen..."
                                        className="h-[42px]"
                                        roundedSide="left"
                                        isClearable={false}
                                    />
                                </div>
                                <Button
                                    onClick={() => { setAccountToEdit(null); setIsAccountModalOpen(true); }}
                                    className="h-[42px] px-4 rounded-r-sm border border-l-0 border-[#123a3c] bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white shadow-md hover:from-[#2a7073] hover:to-[#235e62] active:shadow-inner transition-all flex items-center justify-center group/add shrink-0"
                                    title="E-Mail Konto hinzufügen"
                                >
                                    <FaPlus size={10} />
                                </Button>
                            </div>
                        </div>

                        {/* AN (Recipient) */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 group">
                            <span className="text-[9px] font-bold text-slate-400 tracking-widest sm:w-10 sm:pt-2.5 shrink-0">AN</span>
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
                                                            <span className="text-[10px] font-bold text-slate-900  tracking-tight">{s.label}</span>
                                                            <span className="text-[10px] font-mono text-slate-400 tracking-tight">{s.value}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        {projectDetails?.customer?.email && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setComposeTo(composeTo === projectDetails.customer.email ? '' : projectDetails.customer.email)}
                                                className={clsx(
                                                    "h-6 px-2 text-[9px] font-bold border transition-all  tracking-wider rounded-sm",
                                                    composeTo === projectDetails.customer.email
                                                        ? "bg-brand-primary text-white border-brand-primary active:bg-brand-primary shadow-sm"
                                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:border-brand-primary hover:text-brand-primary"
                                                )}
                                            >
                                                Kunde
                                            </Button>
                                        )}
                                        {projectDetails?.translator?.email && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setComposeTo(composeTo === projectDetails.translator.email ? '' : projectDetails.translator.email)}
                                                className={clsx(
                                                    "h-6 px-2 text-[9px] font-bold border transition-all  tracking-wider rounded-sm",
                                                    composeTo === projectDetails.translator.email
                                                        ? "bg-brand-primary text-white border-brand-primary active:bg-brand-primary shadow-sm"
                                                        : "bg-slate-50 text-slate-400 border-slate-200 hover:border-brand-primary hover:text-brand-primary"
                                                )}
                                            >
                                                Partner
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BETREFF (Subject) */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 group">
                            <span className="text-[9px] font-bold text-slate-400 tracking-widest sm:w-10 shrink-0">BETREFF</span>
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
                                            <span className="text-[9px] font-mono text-slate-300 ">{formatFileSize(f.size)}</span>
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
                    <div className="flex-none flex flex-col px-4 pb-6 mt-2 min-h-[450px]">
                        <div className="flex-1 flex flex-col border border-slate-100 rounded-sm bg-white overflow-hidden shadow-sm shadow-slate-200/50 min-h-0">
                            {/* Editor Sub-Header / Tool buttons */}
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        className={clsx(
                                            "h-7 px-3 rounded-sm text-[10px] font-bold  tracking-tight flex items-center gap-1.5 transition-all border",
                                            isSidebarOpen
                                                ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                        )}
                                        title={isSidebarOpen ? "Sidebar schließen" : "Sidebar öffnen"}
                                    >
                                        {isSidebarOpen ? <FaChevronRight size={8} /> : <FaChevronLeft size={8} />}
                                        SIDEBAR
                                    </button>
                                    <button
                                        onClick={() => setIsComposePreview(!isComposePreview)}
                                        className={clsx(
                                            "h-7 px-3 rounded-sm text-[10px] font-bold  tracking-tight flex items-center gap-1.5 transition-all border",
                                            isComposePreview
                                                ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                        )}
                                    >
                                        {isComposePreview ? <><FaEyeSlash size={10} /> Live Vorschau</> : <><FaEye size={10} /> Live Vorschau</>}
                                    </button>
                                    <button
                                        onClick={() => setIsHtmlMode(!isHtmlMode)}
                                        className={clsx(
                                            "h-7 px-3 rounded-sm text-[10px] font-bold tracking-tight flex items-center gap-1.5 transition-all border",
                                            isHtmlMode
                                                ? "bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#123a3c] shadow-sm"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                        )}
                                        title="HTML Quellcode bearbeiten"
                                    >
                                        <FaCode size={10} /> HTML
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {selectedProjectId && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setIsProjectFilesModalOpen(true)}
                                            className="h-7 px-2 text-[10px] font-bold text-slate-500 hover:text-brand-primary animate-in fade-in slide-in-from-right-2 duration-300"
                                        >
                                            <FaLayerGroup size={10} className="mr-1.5" /> PROJEKT-DATEIEN
                                        </Button>
                                    )}
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

                            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                                {isComposePreview ? (
                                    <div className="p-4 h-full bg-white animate-in fade-in duration-300">
                                        <div
                                            className="text-[12px] text-slate-800 font-medium leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getPreviewHtml(composeBody)) }}
                                        />
                                    </div>
                                ) : isHtmlMode ? (
                                    <div className="flex-1 flex overflow-hidden bg-[#1e1e1e]">
                                        <div className="flex-1 flex relative overflow-hidden">
                                            {/* Line Numbers Gutter */}
                                            <div
                                                ref={gutterRef}
                                                className="w-8 bg-[#1e1e1e] text-[#858585] text-right pr-2 py-6 font-mono text-[12px] select-none border-r border-[#333333] shrink-0 leading-[1.6] overflow-hidden"
                                            >
                                                {composeBody.split('\n').map((_, i) => (
                                                    <div key={i}>{i + 1}</div>
                                                ))}
                                            </div>
                                            {/* Editor Area */}
                                            <textarea
                                                ref={editorRef}
                                                value={composeBody}
                                                onScroll={handleHtmlScroll}
                                                onChange={e => setComposeBody(e.target.value)}
                                                className="w-full p-4 font-mono text-[12px] bg-[#1e1e1e] text-[#d4d4d4] outline-none resize-none border-none selection:bg-[#264f78] leading-[1.6] min-h-[400px] h-auto overflow-hidden"
                                                spellCheck={false}
                                                placeholder="<p>Schreiben Sie HTML hier...</p>"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-none flex flex-col h-auto">
                                        <ReactQuill
                                            ref={quillRef}
                                            theme="snow"
                                            value={composeBody}
                                            onChange={setComposeBody}
                                            modules={quillModules}
                                            className="quill-modern border-none flex-none h-auto overflow-visible"
                                            placeholder="Schreiben Sie Ihre Nachricht hier..."
                                            style={{ minHeight: '400px' }}
                                        />
                                    </div>
                                )}
                                {selectedSignature && (
                                    <div className="shrink-0 border-t border-slate-200 bg-white animate-in slide-in-from-bottom-2 duration-200 relative mt-4 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)] h-auto">
                                        <label className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-bold text-slate-900 tracking-wide z-10">
                                            Signatur
                                        </label>
                                        <div className="px-4 pt-4 pb-4 h-auto">
                                            <div
                                                className="text-xs text-slate-500 leading-relaxed font-medium mb-1"
                                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedSignature.content) }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSignature(null)}
                                            className="absolute top-1.5 right-2 text-slate-300 hover:text-red-400 transition-colors"
                                            title="Signatur entfernen"
                                        >
                                            <FaTimes size={9} />
                                        </button>
                                    </div>
                                )}
                                {isDragOver && (
                                    <div className="absolute inset-0 bg-brand-primary/10 backdrop-blur-[2px] border-2 border-dashed border-brand-primary z-50 flex items-center justify-center animate-in fade-in duration-200">
                                        <div className="bg-white p-6 rounded-sm shadow-2xl flex flex-col items-center gap-4 border border-brand-primary/20">
                                            <div className="w-16 h-16 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                                                <FaPaperclip size={32} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-sm font-bold text-slate-900  tracking-widest">Dateien hier ablegen</h3>
                                                <p className="text-[10px] font-medium text-slate-400 mt-1 ">Anhänge automatisch hinzufügen</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. MULTI-TOOL SIDEBAR */}
                <div className={clsx(
                    "border-l border-slate-100 flex-col shrink-0 overflow-hidden min-h-0 transition-all duration-300 ease-in-out z-30",
                    "bg-white md:bg-slate-50/30",
                    "fixed inset-y-0 right-0 w-64 md:relative md:flex md:w-80 md:translate-x-0 md:shadow-none shadow-2xl",
                    isSidebarOpen ? "flex translate-x-0" : "flex translate-x-full md:translate-x-full"
                )}>
                    {/* Mobile Overlay */}
                    {isSidebarOpen && (
                        <div
                            className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-[-1]"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}
                    {/* Tabs Header */}
                    <div className="flex bg-white border-b border-slate-100 shrink-0 h-[60px] relative">
                        <Button
                            variant="ghost"
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden h-full px-3 text-slate-400 hover:text-brand-primary border-r border-slate-50"
                            title="Tools einklappen"
                        >
                            <FaChevronRight size={12} />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setSidebarTab('templates')}
                            className={clsx(
                                "flex-1 flex-col h-full rounded-none transition-all relative overflow-hidden flex items-center justify-center",
                                sidebarTab === 'templates' ? "text-brand-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <div className="relative">
                                <FaFileAlt size={12} className="mb-1" />
                                {templates.length > 0 && <span className="absolute -top-1.5 -right-2.5 text-[7px] font-black bg-slate-200 text-slate-500 px-1 py-px rounded-sm leading-none">{templates.length}</span>}
                            </div>
                            <span className="text-[9px] font-bold tracking-widest block">Vorlagen</span>
                            {sidebarTab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"></div>}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setSidebarTab('variables')}
                            className={clsx(
                                "flex-1 flex-col h-full rounded-none transition-all relative overflow-hidden flex items-center justify-center",
                                sidebarTab === 'variables' ? "text-brand-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <div className="relative">
                                <FaTerminal size={12} className="mb-1" />
                                <span className="absolute -top-1.5 -right-2.5 text-[7px] font-black bg-slate-200 text-slate-500 px-1 py-px rounded-sm leading-none">{ALL_VARIABLES.length}</span>
                            </div>
                            <span className="text-[9px] font-bold tracking-widest block">Variable</span>
                            {sidebarTab === 'variables' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"></div>}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setSidebarTab('signatures')}
                            className={clsx(
                                "flex-1 flex-col h-full rounded-none transition-all relative overflow-hidden flex items-center justify-center",
                                sidebarTab === 'signatures' ? "text-brand-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <div className="relative">
                                <FaSignature size={12} className="mx-auto mb-1" />
                                {signatures.length > 0 && <span className="absolute -top-1.5 -right-2.5 text-[7px] font-black bg-slate-200 text-slate-500 px-1 py-px rounded-sm leading-none">{signatures.length}</span>}
                            </div>
                            <span className="text-[9px] font-bold tracking-widest block">Signatur</span>
                            {sidebarTab === 'signatures' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"></div>}
                        </Button>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                        {/* TEMPLATES SEARCH */}
                        {sidebarTab === 'templates' && (
                            <div className="p-4 bg-white border-b border-slate-100 shrink-0">
                                <div className="flex items-stretch h-[38px]">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={tplSearch}
                                            onChange={e => setTplSearch(e.target.value)}
                                            placeholder="Vorlage suchen..."
                                            className="w-full h-full bg-white border border-slate-200 rounded-l-sm rounded-r-none px-3 pr-8 text-[11px] font-bold tracking-tight placeholder:text-slate-300 focus:border-brand-primary outline-none transition-all placeholder:font-normal"
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <FaSearch size={11} className="text-slate-300" />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setTemplateToEdit(null);
                                            setIsTemplateModalOpen(true);
                                        }}
                                        className="h-full w-[38px] min-w-0 p-0 rounded-r-sm rounded-l-none border border-l-0 border-[#123a3c] bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white shadow-none hover:from-[#2a7073] hover:to-[#235e62] transition-all flex items-center justify-center shrink-0"
                                        title="Neue Vorlage erstellen"
                                    >
                                        <FaPlus size={10} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* VARIABLES SEARCH */}
                        {sidebarTab === 'variables' && (
                            <div className="p-4 bg-white border-b border-slate-100 shrink-0">
                                <div className="relative h-[38px]">
                                    <input
                                        type="text"
                                        value={varSearch}
                                        onChange={e => setVarSearch(e.target.value)}
                                        placeholder="Variable suchen..."
                                        className="w-full h-full bg-white border border-slate-200 rounded-sm px-3 pr-8 text-[11px] font-bold tracking-tight placeholder:text-slate-300 focus:border-brand-primary outline-none transition-all placeholder:font-normal"
                                    />
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <FaSearch size={11} className="text-slate-300" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SIGNATURES SEARCH */}
                        {sidebarTab === 'signatures' && (
                            <div className="p-4 bg-white border-b border-slate-100 shrink-0">
                                <div className="flex items-stretch h-[38px]">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={sigSearch}
                                            onChange={e => setSigSearch(e.target.value)}
                                            placeholder="Signatur suchen..."
                                            className="w-full h-full bg-white border border-slate-200 rounded-l-sm rounded-r-none px-3 pr-8 text-[11px] font-bold tracking-tight placeholder:text-slate-300 focus:border-brand-primary outline-none transition-all placeholder:font-normal"
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <FaSearch size={11} className="text-slate-300" />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setSignatureToEdit(null);
                                            setIsSignatureModalOpen(true);
                                        }}
                                        className="h-full w-[38px] min-w-0 p-0 rounded-r-sm rounded-l-none border border-l-0 border-[#123a3c] bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white shadow-none hover:from-[#2a7073] hover:to-[#235e62] transition-all flex items-center justify-center shrink-0"
                                        title="Neue Signatur erstellen"
                                    >
                                        <FaPlus size={10} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 min-h-0 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="pb-8 overflow-x-hidden w-full">
                                    {sidebarTab === 'templates' && (
                                        <div className="w-full space-y-2 animate-in fade-in slide-in-from-right-2 duration-300 overflow-hidden">
                                            {templates.filter((tpl: any) => !tplSearch || tpl.name.toLowerCase().includes(tplSearch.toLowerCase()) || tpl.subject?.toLowerCase().includes(tplSearch.toLowerCase())).map((tpl: any) => (
                                                <div key={tpl.id} className="relative group/tpl border-b border-slate-100 last:border-0">
                                                    <button
                                                        onClick={() => handleApplyTemplate(tpl)}
                                                        className="w-full text-left p-4 pr-10 bg-white hover:bg-slate-50 transition-all relative overflow-hidden min-w-0 flex flex-col"
                                                    >
                                                        <div className="font-bold text-slate-800 text-[10px] mb-0.5 tracking-tight group-hover:text-brand-primary line-clamp-2 break-words uppercase">{tpl.name}</div>
                                                        <div className="text-slate-400 text-[9px] line-clamp-2 leading-tight font-medium break-words">{tpl.subject}</div>
                                                        <div 
                                                            className="text-slate-300 text-[8px] line-clamp-1 leading-tight font-medium mt-1 truncate" 
                                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tpl.body || tpl.content || '').substring(0, 80) }} 
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary">
                                                            <FaChevronRight size={10} />
                                                        </div>
                                                    </button>
                                                    <div className="absolute right-2 bottom-2 flex items-center gap-0.5 opacity-0 group-hover/tpl:opacity-100 transition-all">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setTemplateToEdit(tpl);
                                                                setIsTemplateModalOpen(true);
                                                            }}
                                                            className="w-6 h-6 flex items-center justify-center bg-transparent text-slate-300 hover:text-brand-primary transition-all"
                                                            title="Vorlage bearbeiten"
                                                        >
                                                            <FaEdit size={11} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Möchten Sie die Vorlage "${tpl.name}" wirklich löschen?`)) {
                                                                    deleteTemplateMutation.mutate(tpl.id);
                                                                }
                                                            }}
                                                            className="w-6 h-6 flex items-center justify-center bg-transparent text-slate-300 hover:text-red-500 transition-all"
                                                            title="Vorlage löschen"
                                                        >
                                                            <FaTrash size={11} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {templates.filter((tpl: any) => !tplSearch || tpl.name.toLowerCase().includes(tplSearch.toLowerCase()) || tpl.subject?.toLowerCase().includes(tplSearch.toLowerCase())).length === 0 && (
                                                <div className="text-center py-12 px-4 rounded-sm border border-dashed border-slate-200 bg-white">
                                                    <FaFileAlt size={24} className="mx-auto text-slate-100 mb-3" />
                                                    <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Keine Vorlagen gefunden</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {sidebarTab === 'variables' && (
                                        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                                            <div className="space-y-3">
                                                {(() => {
                                                    const q = varSearch.toLowerCase();
                                                    const filtered = ALL_VARIABLES.filter(v =>
                                                        !q || v.label.toLowerCase().includes(q) || v.key.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q)
                                                    );
                                                    if (filtered.length === 0) return <p className="px-4 py-12 text-[10px] text-slate-300 text-center font-bold  tracking-widest italic border border-dashed border-slate-200 bg-white uppercase">Keine Variable gefunden</p>;
                                                    const groups = varSearch ? [''] : VAR_GROUPS;
                                                    return groups.map(group => {
                                                        const items = varSearch ? filtered : filtered.filter(v => v.group === group);
                                                        if (items.length === 0) return null;
                                                        return (
                                                            <div key={group} className="space-y-1">
                                                                {!varSearch && <div className="text-[9px] font-bold text-slate-400  tracking-widest mb-2 mt-4 ml-1 flex items-center gap-2 uppercase"><div className="w-1 h-3 bg-slate-200 rounded-full"></div> {group}</div>}
                                                                {items.map(v => {
                                                                    const isSelected = composeBody.includes(`{{${v.key}}}`) || composeBody.includes(`{${v.key}}`);
                                                                    return (
                                                                        <div
                                                                            key={v.key}
                                                                            onClick={() => {
                                                                                if (isSelected) {
                                                                                    const regex = new RegExp(`{{${v.key}}}|{${v.key}}`, 'g');
                                                                                    setComposeBody(prev => prev.replace(regex, ''));
                                                                                } else {
                                                                                    insertAtCursor(`{{${v.key}}}`);
                                                                                }
                                                                            }}
                                                                            className="w-full text-left p-4 bg-white border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-all group flex items-start gap-4 relative"
                                                                        >
                                                                            <div className="mt-0.5 shrink-0">
                                                                                <Checkbox
                                                                                    checked={isSelected}
                                                                                    onChange={() => {
                                                                                        if (isSelected) {
                                                                                            const regex = new RegExp(`{{${v.key}}}|{${v.key}}`, 'g');
                                                                                            setComposeBody(prev => prev.replace(regex, ''));
                                                                                        } else {
                                                                                            insertAtCursor(`{{${v.key}}}`);
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="min-w-0 pr-12">
                                                                                <div className="text-[10px] font-bold text-slate-700  tracking-tight group-hover:text-brand-primary">{v.label}</div>
                                                                                <div className="text-[9px] text-slate-400 font-medium leading-normal mt-0.5">{v.desc}</div>
                                                                            </div>
                                                                            <code className="absolute right-3 top-4 text-[8px] font-mono text-slate-300 shrink-0 bg-slate-50 px-1 py-0.5 border border-slate-100 rounded group-hover:border-brand-primary group-hover:text-brand-primary transition-all">
                                                                                {`{{${v.key}}}`}
                                                                            </code>
                                                                        </div>
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
                                        <div className="w-full space-y-2 animate-in fade-in slide-in-from-right-2 duration-300 overflow-hidden">
                                            {signatures.filter((s: any) => !sigSearch || s.name.toLowerCase().includes(sigSearch.toLowerCase())).map((s: any) => (
                                                <div key={s.id} className="relative group/sig border-b border-slate-100 last:border-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedSignature(prev => prev?.id === s.id ? null : s)}
                                                        className={clsx(
                                                            "w-full text-left p-4 pr-10 transition-all relative overflow-hidden min-w-0 flex flex-col",
                                                            selectedSignature?.id === s.id
                                                                ? "bg-brand-primary/5 hover:bg-brand-primary/10"
                                                                : "bg-white hover:bg-slate-50"
                                                        )}
                                                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                                    >
                                                        <div className="flex items-center justify-between mb-0.5 min-w-0 w-full">
                                                            <div className={clsx("text-[10px] font-bold tracking-tight line-clamp-2 mr-2 uppercase break-words", selectedSignature?.id === s.id ? "text-brand-primary" : "text-slate-800 group-hover/sig:text-brand-primary")}>{s.name}</div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {s.is_default && !selectedSignature && <span className="text-[8px] font-black bg-brand-primary text-white px-1.5 py-0.5 rounded-sm tracking-widest">DEFAULT</span>}
                                                            </div>
                                                            {selectedSignature?.id === s.id && (
                                                                <span className="absolute top-1 right-1 text-[7px] font-black bg-brand-primary text-white px-1 py-0.5 rounded-[2px] tracking-widest shadow-sm">
                                                                    AKTIV
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-slate-400 text-[9px] line-clamp-2 leading-tight italic font-medium break-words">{s.content.replace(/<[^>]*>/g, '')}</div>
                                                        {selectedSignature?.id !== s.id && (
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/sig:opacity-100 transition-opacity text-brand-primary">
                                                                <FaChevronRight size={10} />
                                                            </div>
                                                        )}
                                                    </button>
                                                    <div className="absolute right-2 bottom-2 flex items-center gap-0.5 opacity-0 group-hover/sig:opacity-100 transition-all">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSignatureToEdit(s);
                                                                setIsSignatureModalOpen(true);
                                                            }}
                                                            className="w-6 h-6 flex items-center justify-center bg-transparent text-slate-300 hover:text-brand-primary transition-all"
                                                            title="Signatur bearbeiten"
                                                        >
                                                            <FaEdit size={11} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Möchten Sie die Signatur "${s.name}" wirklich löschen?`)) {
                                                                    deleteSignatureMutation.mutate(s.id);
                                                                }
                                                            }}
                                                            className="w-6 h-6 flex items-center justify-center bg-transparent text-slate-300 hover:text-red-500 transition-all"
                                                            title="Signatur löschen"
                                                        >
                                                            <FaTrash size={11} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {signatures.length === 0 && (
                                                <div className="text-center py-12 px-4 rounded-sm border border-dashed border-slate-200 bg-white">
                                                    <FaSignature size={24} className="mx-auto text-slate-100 mb-3" />
                                                    <p className="text-[10px] font-bold text-slate-300  tracking-widest uppercase">Keine Signaturen gefunden</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="px-4 py-5 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    {onClose && (
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="h-9 px-4 text-[11px] font-bold tracking-widest transition-all rounded-sm flex items-center gap-2"
                        >
                            <FaTimes /> Abbrechen
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleSaveDraft}
                        disabled={sendMutation.isPending || !selectedAccount}
                        className="h-9 px-4 text-[11px] font-bold tracking-widest uppercase transition-all rounded-sm flex items-center gap-2"
                    >
                        {sendMutation.isPending ? <FaSave className="animate-pulse" /> : <FaSave />}
                        {sendMutation.isPending ? 'Warten...' : 'Entwurf speichern'}
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sendMutation.isPending || !composeTo || !composeSubject}
                        className="bg-gradient-to-b from-[#235e62] to-[#1B4D4F] hover:from-[#2a7073] hover:to-[#235e62] text-white text-[11px] font-bold tracking-widest px-8 h-9 border border-[#123a3c] shadow-[0_2px_8px_rgba(27,77,79,0.2)] transition-all group rounded-sm flex items-center"
                    >
                        {sendMutation.isPending ? 'Sende...' : 'Nachricht senden'}
                        <FaPaperPlane size={10} className="ml-3 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Button>
                </div>
            </div>

            {/* Modal Components */}
            <NewEmailAccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSubmit={(data) => {
                    if (accountToEdit) {
                        mailService.updateAccount(accountToEdit.id, data).then((updatedAccount) => {
                            queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
                            setSelectedAccount(updatedAccount);
                            setIsAccountModalOpen(false);
                            setAccountToEdit(null);
                        });
                    } else {
                        createAccountMutation.mutate(data);
                    }
                }}
                initialData={accountToEdit}
            />

            <NewEmailTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSubmit={(data) => {
                    if (templateToEdit) {
                        mailService.updateTemplate(templateToEdit.id, data).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
                            setIsTemplateModalOpen(false);
                            setTemplateToEdit(null);
                        });
                    } else {
                        createTemplateMutation.mutate(data);
                    }
                }}
                initialData={templateToEdit}
            />

            <NewEmailSignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onSubmit={(data) => {
                    if (signatureToEdit) {
                        mailService.updateSignature(signatureToEdit.id, data).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['mail', 'signatures'] });
                            setIsSignatureModalOpen(false);
                            setSignatureToEdit(null);
                        });
                    } else {
                        createSignatureMutation.mutate({ ...data, mail_account_id: selectedAccount?.id });
                    }
                }}
                initialData={signatureToEdit}
            />

            {/* Project Files Selector Modal */}
            <Dialog open={isProjectFilesModalOpen} onOpenChange={setIsProjectFilesModalOpen}>
                <DialogContent hideClose className="max-w-2xl bg-white p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-sm min-h-0">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <DialogTitle className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2 ">
                            <FaProjectDiagram className="text-slate-400" /> Dateiauswahl aus Projekt
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={() => setIsProjectFilesModalOpen(false)} className="h-8 w-8 text-slate-400">
                            <FaTimes />
                        </Button>
                    </div>
                    <div className="p-6 overflow-hidden flex flex-col min-h-0">
                        <div className="mb-6 shrink-0">
                            <h4 className="text-[10px] font-bold text-slate-400  tracking-widest mb-1">Verknüpftes Projekt</h4>
                            <p className="text-sm font-bold text-slate-800">{projectDetails?.project_number} — {projectDetails?.project_name || projectDetails?.name}</p>
                        </div>
                        <ScrollArea className="flex-1 min-h-0">
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
                                ) : <p className="text-center text-slate-400 text-sm py-10 uppercase">Keine Dateien im Projekt gefunden.</p>}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmailComposeContent;
