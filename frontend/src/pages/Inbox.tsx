import { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { mailService, projectService, customerService, partnerService } from '../api/services';
import SearchableSelect from '../components/common/SearchableSelect';
import {
    FaPaperPlane, FaTimes, FaPaperclip, FaPlus, FaEdit,
    FaFileAlt, FaUserCircle, FaKey, FaEye, FaTrashAlt,
    FaFolderOpen, FaReply, FaForward, FaCode, FaCloudUploadAlt,
    FaSearchPlus, FaCheckCircle, FaProjectDiagram, FaAddressBook
} from 'react-icons/fa';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import NewEmailAccountModal from '../components/modals/NewEmailAccountModal';
import NewEmailTemplateModal from '../components/modals/NewEmailTemplateModal';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip";
import {
    Button,
    Input,
    Label,
    Separator,
    Badge,
    ScrollArea,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "../components/ui";

const CommunicationHub = () => {
    const location = useLocation();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('inbox');
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [composeTo, setComposeTo] = useState('');
    const [showToSuggestions, setShowToSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<any>(null);

    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<any>(null);

    const [viewingMail, setViewingMail] = useState<any>(null);
    const [isComposePreview, setIsComposePreview] = useState(false);

    // Project & Drag-and-Drop States
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProjectFilesModalOpen, setIsProjectFilesModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: inboxMessages = [], isLoading: isLoadingInbox } = useQuery({
        queryKey: ['mails', 'inbox'],
        queryFn: () => mailService.getAll('inbox')
    });

    const { data: sentMessages = [], isLoading: isLoadingSent } = useQuery({
        queryKey: ['mails', 'sent'],
        queryFn: () => mailService.getAll('sent')
    });

    const { data: accounts = [] } = useQuery({
        queryKey: ['mail', 'accounts'],
        queryFn: mailService.getAccounts
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['mail', 'templates'],
        queryFn: mailService.getTemplates
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getAll
    });

    const { data: partners = [] } = useQuery({
        queryKey: ['partners'],
        queryFn: partnerService.getAll
    });

    const { data: projectDetails } = useQuery({
        queryKey: ['project', selectedProjectId],
        queryFn: () => selectedProjectId ? projectService.getById(selectedProjectId) : null,
        enabled: !!selectedProjectId
    });

    const { data: customerDetails } = useQuery({
        queryKey: ['customer', selectedCustomerId],
        queryFn: () => selectedCustomerId ? customerService.getById(parseInt(selectedCustomerId)) : null,
        enabled: !!selectedCustomerId && !selectedProjectId
    });

    const contactSuggestions = useMemo(() => {
        const list: any[] = [];
        customers.forEach((c: any) => {
            if (c.email) list.push({ label: `${c.company_name || (c.first_name + ' ' + c.last_name)}`, value: c.email, type: 'Kunde' });
            if (Array.isArray(c.additional_emails)) {
                c.additional_emails.forEach((e: string) => list.push({ label: `${c.company_name || (c.first_name + ' ' + c.last_name)}`, value: e, type: 'Kunde (Alt)' }));
            }
        });
        partners.forEach((p: any) => {
            if (p.email) list.push({ label: `${p.company || (p.first_name + ' ' + p.last_name)}`, value: p.email, type: 'Partner' });
        });
        // Remove duplicates
        const unique = Array.from(new Set(list.map(s => s.value))).map(email => list.find(s => s.value === email));
        return unique;
    }, [customers, partners]);

    const filteredToSuggestions = useMemo(() => {
        if (!composeTo || !showToSuggestions) return [];
        const search = composeTo.toLowerCase();
        return contactSuggestions.filter(s =>
            s.label.toLowerCase().includes(search) ||
            s.value.toLowerCase().includes(search)
        ).slice(0, 10);
    }, [contactSuggestions, composeTo, showToSuggestions]);

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts.find((a: any) => a.is_default) || accounts[0]);
        }
    }, [accounts]);

    useEffect(() => {
        if (location.state?.compose) {
            setComposeTo(location.state.to || '');
            setComposeSubject(location.state.subject || '');
            setComposeBody(location.state.body || '');
            setIsComposeOpen(true);
        }
    }, [location.state]);

    const sendMutation = useMutation({
        mutationFn: (data: any) => {
            const formData = new FormData();
            formData.append('mail_account_id', data.mail_account_id);
            formData.append('to', data.to);
            formData.append('subject', data.subject);
            formData.append('body', data.body);
            composeAttachments.forEach((file, index) => {
                formData.append(`attachments[${index}]`, file);
            });
            return mailService.send(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            resetCompose();
            toast.success('E-Mail erfolgreich gesendet');
        },
        onError: () => {
            toast.error('Fehler beim Senden der E-Mail');
        }
    });

    const resetCompose = () => {
        setIsComposeOpen(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
        setIsComposePreview(false);
        setSelectedProjectId(null);
        setSelectedCustomerId(null);
        setComposeTo('');
        setShowToSuggestions(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setComposeAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (index: number) => {
        setComposeAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddProjectFiles = async (filesToAttach: any[]) => {
        const toastId = toast.loading('Projekt-Dateien werden vorbereitet...');
        try {
            const newAttachments: File[] = [];
            for (const file of filesToAttach) {
                const response = await projectService.downloadFile(selectedProjectId!, file.id);
                // The API returns a blob in response.data
                const blob = response.data;
                const fileName = file.fileName || file.file_name || file.name || 'projekt_datei';
                const f = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
                newAttachments.push(f);
            }
            setComposeAttachments(prev => [...prev, ...newAttachments]);
            toast.success(`${filesToAttach.length} Datei(en) erfolgreich angehängt`, { id: toastId });
            setIsProjectFilesModalOpen(false);
        } catch (error) {
            console.error('Project file attachment error:', error);
            toast.error('Fehler beim Abrufen der Projekt-Dateien', { id: toastId });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleApplyTemplate = (template: any) => {
        setComposeSubject(template.subject);
        setComposeBody(template.body);
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    const syncMutation = useMutation({
        mutationFn: mailService.sync,
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            toast.success(data.message || 'Postfach synchronisiert');
        },
        onError: (error: any) => {
            toast.error('Synchronisierung fehlgeschlagen: ' + (error.response?.data?.message || 'Unbekannter Fehler'));
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: number) => mailService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
        }
    });

    const handleReply = (mail: any) => {
        setComposeTo(mail.from);
        setComposeSubject(`Re: ${mail.subject}`);
        setComposeBody(`<br/><br/>--- Am ${mail.full_time} schrieb ${mail.from}:<br/><blockquote>${mail.body}</blockquote>`);
        setViewingMail(null);
        setIsComposeOpen(true);
    };

    const handleForward = (mail: any) => {
        setComposeTo('');
        setComposeSubject(`Fwd: ${mail.subject}`);
        setComposeBody(`<br/><br/>--- Weitergeleitete Nachricht ---<br/>Von: ${mail.from}<br/>Datum: ${mail.full_time}<br/>Betreff: ${mail.subject}<br/><br/>${mail.body}`);
        setViewingMail(null);
        setIsComposeOpen(true);
    };

    const handleViewMail = (mail: any) => {
        setViewingMail(mail);
        if (!mail.read && activeTab === 'inbox') {
            markAsReadMutation.mutate(mail.id);
        }
    };

    const getPreviewHtml = (html: string) => {
        if (!html) return '';

        const data = projectDetails || (customerDetails ? {
            customer: {
                name: customerDetails.company_name || `${customerDetails.first_name || ''} ${customerDetails.last_name || ''}`.trim(),
                contact_person: customerDetails.contact_person || `${customerDetails.first_name || ''} ${customerDetails.last_name || ''}`.trim()
            },
            project_number: 'N/A',
            name: 'Kein Projekt ausgewählt',
            deadline: null,
            total_amount: '0,00'
        } : {
            customer: { name: 'Musterfirma GmbH', contact_person: 'Max Mustermann' },
            project_number: 'PRJ-XXXX-XXXX',
            name: 'Beispiel Projekt',
            deadline: 'DD.MM.YYYY',
            total_amount: '0,00 €'
        });

        const custName = data.customer?.name || data.customer?.company_name || 'Musterfirma GmbH';
        const contact = data.customer?.contact_person || 'Max Mustermann';

        return html
            .replace(/{{customer_name}}/g, custName)
            .replace(/{{contact_person}}/g, contact)
            .replace(/{{project_number}}/g, data.project_number || 'PRJ-XXXX-XXXX')
            .replace(/{{project_name}}/g, data.name || data.project_name || 'Beispiel Projekt')
            .replace(/{{deadline}}/g, data.deadline ? new Date(data.deadline).toLocaleDateString('de-DE') : 'DD.MM.YYYY')
            .replace(/{{price_net}}/g, data.total_amount ? `${parseFloat(data.total_amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` : '0,00 €')
            .replace(/{{date}}/g, new Date().toLocaleDateString('de-DE'))
            .replace(/{{sender_name}}/g, 'Ihre Administration');
    };

    const createAccountMutation = useMutation({
        mutationFn: mailService.createAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
            setIsAccountModalOpen(false);
            toast.success('Konto erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen des Kontos')
    });

    const updateAccountMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => mailService.updateAccount(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
            setIsAccountModalOpen(false);
            toast.success('Konto aktualisiert');
        },
        onError: () => toast.error('Fehler beim Aktualisieren des Kontos')
    });

    const deleteAccountMutation = useMutation({
        mutationFn: mailService.deleteAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'accounts'] });
            toast.success('Konto gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen des Kontos')
    });

    const createTemplateMutation = useMutation({
        mutationFn: mailService.createTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
            setIsTemplateModalOpen(false);
            toast.success('Vorlage erstellt');
        },
        onError: () => toast.error('Fehler beim Erstellen der Vorlage')
    });

    const updateTemplateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => mailService.updateTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
            setIsTemplateModalOpen(false);
            toast.success('Vorlage aktualisiert');
        },
        onError: () => toast.error('Fehler beim Aktualisieren der Vorlage')
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: mailService.deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'templates'] });
            toast.success('Vorlage gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen der Vorlage')
    });

    if (isLoadingInbox || isLoadingSent) return <div className="p-10 text-center font-medium text-slate-400 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <span>Lade E-Mails...</span>
    </div>;

    return (
        <div className="flex flex-col h-full gap-0 fade-in bg-white border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200 gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold text-slate-800er truncate">Email Management</h1>
                    <p className="text-slate-400 text-xs font-medium hidden sm:block">Zentrale Verwaltung</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 sm:px-6 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                        <span className="hidden xs:inline">{syncMutation.isPending ? 'Synchronisiert...' : 'Postfach abrufen'}</span>
                        <span className="xs:hidden">{syncMutation.isPending ? 'Sync...' : 'Abrufen'}</span>
                    </button>
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 sm:px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                        <FaPlus /> <span className="hidden xs:inline">Neue Email</span><span className="xs:hidden">Mail</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-16 md:w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
                    <nav className="flex-1 p-2 space-y-1">
                        <TooltipProvider delayDuration={0}>
                            <TabButton
                                active={activeTab === 'inbox'}
                                onClick={() => setActiveTab('inbox')}
                                icon={<FaFolderOpen />}
                                label="Posteingang"
                            />
                            <TabButton
                                active={activeTab === 'sent'}
                                onClick={() => setActiveTab('sent')}
                                icon={<FaPaperPlane />}
                                label="Gesendet"
                            />
                            <TabButton
                                active={activeTab === 'templates'}
                                onClick={() => setActiveTab('templates')}
                                icon={<FaFileAlt />}
                                label="Vorlagen"
                            />
                            <TabButton
                                active={activeTab === 'accounts'}
                                onClick={() => setActiveTab('accounts')}
                                icon={<FaUserCircle />}
                                label="Konten"
                            />
                        </TooltipProvider>
                    </nav>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                    {activeTab === 'inbox' && (
                        <div className="flex-1 flex flex-col min-h-0 bg-white">
                            <EmailTable
                                mails={inboxMessages}
                                folder="inbox"
                                onView={handleViewMail}
                                onDelete={(id: number) => {
                                    if (window.confirm('E-Mail wirklich löschen?')) {
                                        mailService.delete(id).then(() => {
                                            queryClient.invalidateQueries({ queryKey: ['mails'] });
                                            toast.success('E-Mail gelöscht');
                                        });
                                    }
                                }}
                            />
                        </div>
                    )}

                    {activeTab === 'sent' && (
                        <div className="flex-1 flex flex-col min-h-0 bg-white">
                            <EmailTable
                                mails={sentMessages}
                                folder="sent"
                                onView={handleViewMail}
                                onDelete={(id: number) => {
                                    if (window.confirm('E-Mail wirklich löschen?')) {
                                        mailService.delete(id).then(() => {
                                            queryClient.invalidateQueries({ queryKey: ['mails'] });
                                            toast.success('E-Mail gelöscht');
                                        });
                                    }
                                }}
                            />
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="flex-1 overflow-auto bg-white">
                            <ResourceTable
                                title="E-Mail Vorlagen"
                                items={templates}
                                type="template"
                                headers={['Name', 'Betreff', 'Kategorie']}
                                onAdd={() => {
                                    setTemplateToEdit(null);
                                    setIsTemplateModalOpen(true);
                                }}
                                onEdit={(tpl: any) => {
                                    setTemplateToEdit(tpl);
                                    setIsTemplateModalOpen(true);
                                }}
                                onDelete={(tpl: any) => {
                                    if (window.confirm('Vorlage wirklich löschen?')) {
                                        deleteTemplateMutation.mutate(tpl.id);
                                    }
                                }}
                                renderRow={(tpl: any) => (
                                    <>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-800">{tpl.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{tpl.subject}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-slate-100 text-xs font-semibold">{tpl.type || 'Allgemein'}</span>
                                        </td>
                                    </>
                                )}
                            />
                        </div>
                    )}

                    {activeTab === 'accounts' && (
                        <div className="flex-1 overflow-auto bg-white">
                            <ResourceTable
                                title="E-Mail Konten"
                                items={accounts}
                                type="account"
                                headers={['Bezeichnung', 'Email', 'Server', 'Status']}
                                onAdd={() => {
                                    setAccountToEdit(null);
                                    setIsAccountModalOpen(true);
                                }}
                                onEdit={(acc: any) => {
                                    setAccountToEdit(acc);
                                    setIsAccountModalOpen(true);
                                }}
                                onDelete={(acc: any) => {
                                    if (window.confirm('Konto wirklich löschen?')) {
                                        deleteAccountMutation.mutate(acc.id);
                                    }
                                }}
                                renderRow={(acc: any) => (
                                    <>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-800">
                                            <div className="flex items-center gap-2">
                                                {acc.name}
                                                {acc.is_default && <span className="bg-slate-50 text-slate-900 text-xs px-1.5 py-0.5 font-semibold">Standard</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{acc.email}</td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                            <div>SMTP: {acc.smtp_host}</div>
                                            <div>IMAP: {acc.imap_host}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                        </td>
                                    </>
                                )}
                            />
                        </div>
                    )}
                </div>
            </div>

            {viewingMail && (
                <EmailDetailModal
                    mail={viewingMail}
                    onClose={() => setViewingMail(null)}
                    onReply={handleReply}
                    onForward={handleForward}
                    onDelete={(id: any) => {
                        if (window.confirm('E-Mail wirklich löschen?')) {
                            mailService.delete(id).then(() => {
                                queryClient.invalidateQueries({ queryKey: ['mails'] });
                                setViewingMail(null);
                                toast.success('E-Mail gelöscht');
                            });
                        }
                    }}
                />
            )}

            <Dialog open={isComposeOpen} onOpenChange={(open) => !open && setIsComposeOpen(false)}>
                <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden border-none shadow-2xl rounded-sm">
                    {/* Minimal Header */}
                    <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                <FaPaperPlane className="text-slate-400 text-xs" />
                                NEUE NACHRICHT
                            </h3>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mt-1">
                                Gesendet via: <span className="font-bold text-slate-600">{selectedAccount?.email}</span>
                            </span>
                        </div>
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
                                    <div className="flex items-center gap-4 py-2 border-b border-slate-50 group">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 group-focus-within:text-slate-900 transition-colors">VON</span>
                                        <select
                                            value={selectedAccount?.id}
                                            onChange={(e) => setSelectedAccount(accounts.find((a: any) => a.id === parseInt(e.target.value)))}
                                            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer appearance-none py-1"
                                        >
                                            {accounts.map((acc: any) => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.email})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Recipient Field */}
                                    <div className="flex items-center gap-4 py-2 border-b border-slate-50 group z-50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 group-focus-within:text-slate-900 transition-colors">AN</span>
                                        <div className="flex-1 relative">
                                            <input
                                                value={composeTo}
                                                onChange={(e) => {
                                                    setComposeTo(e.target.value);
                                                    setShowToSuggestions(true);
                                                    setSuggestionIndex(0);
                                                }}
                                                onFocus={() => setShowToSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'ArrowDown' && filteredToSuggestions.length > 0) {
                                                        e.preventDefault();
                                                        setSuggestionIndex(prev => (prev + 1) % filteredToSuggestions.length);
                                                    } else if (e.key === 'ArrowUp' && filteredToSuggestions.length > 0) {
                                                        e.preventDefault();
                                                        setSuggestionIndex(prev => (prev - 1 + filteredToSuggestions.length) % filteredToSuggestions.length);
                                                    } else if (e.key === 'Enter' && filteredToSuggestions.length > 0 && showToSuggestions) {
                                                        e.preventDefault();
                                                        setComposeTo(filteredToSuggestions[suggestionIndex].value);
                                                        setShowToSuggestions(false);
                                                    } else if (e.key === 'Escape') {
                                                        setShowToSuggestions(false);
                                                    }
                                                }}
                                                className="w-full bg-transparent border-none outline-none text-sm placeholder:text-slate-300 font-medium text-slate-800 py-1"
                                                placeholder="empfaenger@beispiel.de"
                                            />

                                            {showToSuggestions && filteredToSuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-sm overflow-hidden z-[101] animate-in fade-in slide-in-from-top-1">
                                                    {filteredToSuggestions.map((s, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                setComposeTo(s.value);
                                                                setShowToSuggestions(false);
                                                            }}
                                                            className={clsx(
                                                                "w-full text-left px-4 py-3 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors",
                                                                idx === suggestionIndex ? "bg-slate-50" : "hover:bg-slate-50/50"
                                                            )}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">{s.label}</span>
                                                                <span className="text-[10px] font-medium text-slate-400 font-mono tracking-tight">{s.value}</span>
                                                            </div>
                                                            <Badge variant="outline" className="text-[8px] font-black px-1.5 py-0 border-slate-200 text-slate-400 bg-white">
                                                                {s.type}
                                                            </Badge>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subject Field */}
                                    <div className="flex items-center gap-4 py-2 border-b border-slate-50 group">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 group-focus-within:text-slate-900 transition-colors">BETREFF</span>
                                        <input
                                            value={composeSubject}
                                            onChange={(e) => setComposeSubject(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-300 font-bold text-slate-800 py-1"
                                            placeholder="Betreff eingeben..."
                                        />
                                    </div>

                                    {/* Link & variables Fields Section */}
                                    <div className="flex flex-col gap-4 py-6 border-b border-slate-50 bg-slate-50/10 px-6 -mx-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <FaProjectDiagram /> Projekt-Verknüpfung
                                                </label>
                                                {selectedProjectId && (
                                                    <button
                                                        onClick={() => setSelectedProjectId(null)}
                                                        className="text-[9px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-tight"
                                                    >
                                                        Verbindung lösen
                                                    </button>
                                                )}
                                            </div>
                                            <SearchableSelect
                                                options={projects
                                                    .filter((p: any) => p && p.id)
                                                    .map((p: any) => ({
                                                        value: p.id.toString(),
                                                        label: `${p.project_number || 'P-NEW'} — ${p.project_name || p.name || 'Unbenannt'} (${p.customer?.company_name || p.customer?.name || 'Unbekannt'})`
                                                    }))}
                                                value={selectedProjectId || ''}
                                                onChange={(val) => {
                                                    setSelectedProjectId(val || null);
                                                    if (val) {
                                                        const proj = projects.find((p: any) => p.id.toString() === val);
                                                        if (proj?.customer?.email) setComposeTo(proj.customer.email);
                                                        if (!composeSubject) {
                                                            setComposeSubject(`Projekt: ${proj?.project_number || 'ID ' + proj?.id} — ${proj?.project_name || proj?.name}`);
                                                        }
                                                    }
                                                }}
                                                placeholder="Suchen Sie nach Projektnummer oder Name..."
                                                className="bg-white border-slate-200"
                                            />
                                            {projectDetails && (
                                                <div className="flex flex-col gap-1 pt-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-slate-500 uppercase">Kunde</span>
                                                        <span className="text-[10px] font-bold text-slate-900">{projectDetails.customer?.company_name || projectDetails.customer?.name}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-slate-500 uppercase">Status</span>
                                                        <Badge variant="outline" className="text-[8px] font-bold text-emerald-600 border-emerald-200 bg-emerald-50 px-1 py-0 rounded-sm uppercase">
                                                            {projectDetails.status || 'AKTIV'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Editor Switcher */}
                                    <div className="pt-6 flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nachricht Text</span>
                                        <div className="flex bg-slate-100 p-0.5 rounded-sm">
                                            <button
                                                onClick={() => setIsComposePreview(false)}
                                                className={clsx(
                                                    "px-3 py-1 text-[9px] font-bold rounded-sm transition-all",
                                                    !isComposePreview ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5"><FaCode size={10} /> EDITOR</div>
                                            </button>
                                            <button
                                                onClick={() => setIsComposePreview(true)}
                                                className={clsx(
                                                    "px-3 py-1 text-[9px] font-bold rounded-sm transition-all",
                                                    isComposePreview ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5"><FaEye size={10} /> VORSCHAU</div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Editor Content */}
                                    <div className="min-h-[400px] border border-slate-100 rounded-sm overflow-hidden">
                                        {isComposePreview ? (
                                            <div className="p-8 h-full bg-slate-50/30">
                                                <div
                                                    className="prose prose-slate max-w-none text-sm text-slate-800 font-medium leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: getPreviewHtml(composeBody) }}
                                                />
                                            </div>
                                        ) : (
                                            <ReactQuill
                                                theme="snow"
                                                value={composeBody}
                                                onChange={setComposeBody}
                                                modules={quillModules}
                                                className="quill-modern border-none h-full"
                                            />
                                        )}
                                    </div>

                                    {/* Dropzone / Attachment Zone */}
                                    <div
                                        className={clsx(
                                            "mt-8 p-10 border-2 border-dashed rounded-sm transition-all flex flex-col items-center justify-center gap-4",
                                            isDragOver ? "border-brand-500 bg-brand-50/50" : "border-slate-100 bg-slate-50/20 hover:border-slate-200"
                                        )}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                        onDragLeave={() => setIsDragOver(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragOver(false);
                                            if (e.dataTransfer.files) {
                                                setComposeAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                                            }
                                        }}
                                    >
                                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400">
                                            <FaCloudUploadAlt size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Dateien hierher ziehen oder <button onClick={() => fileInputRef.current?.click()} className="text-brand-600 hover:underline">durchsuchen</button></p>
                                            <p className="text-[9px] text-slate-400 font-medium mt-1">Maximale Dateigröße 25MB</p>
                                        </div>

                                        {selectedProjectId && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsProjectFilesModalOpen(true)}
                                                className="mt-2 h-9 text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-white text-slate-600 flex gap-2"
                                            >
                                                <FaSearchPlus size={10} /> Aus Projekt-Dateien wählen
                                            </Button>
                                        )}
                                    </div>

                                    {/* Attachments Section */}
                                    {composeAttachments.length > 0 && (
                                        <div className="pt-8 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ausgewählte Anhänge</span>
                                                <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">{composeAttachments.length}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                                {composeAttachments.map((f, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 group hover:border-slate-900 transition-all rounded-sm shadow-sm">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                                                <FaPaperclip className="text-slate-400 text-[10px]" />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <div className="text-[11px] font-bold text-slate-700 truncate">{f.name}</div>
                                                                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{formatFileSize(f.size)}</div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => removeAttachment(i)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                                                            <FaTimes size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Modern Toolbar Footer */}
                            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-10 px-4 gap-2 border-slate-200 hover:bg-slate-50 font-bold text-[10px] uppercase tracking-wider transition-all"
                                    >
                                        <FaPaperclip size={12} /> Anhängen
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetCompose}
                                        className="h-10 px-4 text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold text-[10px] uppercase tracking-wider transition-all"
                                    >
                                        VERWERFEN
                                    </Button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => sendMutation.mutate({
                                            mail_account_id: selectedAccount?.id,
                                            to: composeTo,
                                            subject: composeSubject,
                                            body: composeBody
                                        })}
                                        disabled={sendMutation.isPending || !composeTo || !composeSubject}
                                        className="h-10 px-10 bg-slate-900 border-none hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/10 gap-3 transition-all rounded-sm disabled:opacity-20"
                                    >
                                        {sendMutation.isPending ? 'Sende...' : 'NACHRICHT SENDEN'} <FaPaperPlane size={10} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Lean Logic Sidebar */}
                        <div className="w-[300px] border-l border-slate-100 bg-slate-50/50 flex flex-col shrink-0 overflow-hidden">
                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-10">
                                    {/* Templates Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <FaFileAlt className="text-slate-400" /> VORLAGEN
                                            </h4>
                                            <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 border-slate-200 text-slate-400">{templates.length}</Badge>
                                        </div>
                                        <div className="space-y-1.5">
                                            {templates.map((tpl: any) => (
                                                <button
                                                    key={tpl.id}
                                                    onClick={() => handleApplyTemplate(tpl)}
                                                    className="w-full text-left p-3 bg-white border border-slate-100 hover:border-slate-900 hover:shadow-sm transition-all group rounded-sm"
                                                >
                                                    <div className="font-bold text-slate-800 text-[11px] mb-0.5 group-hover:text-slate-900 uppercase tracking-tight">{tpl.name}</div>
                                                    <div className="text-slate-400 truncate text-[10px] font-medium tracking-tight uppercase opacity-60">{tpl.type || 'Allgemein'}</div>
                                                </button>
                                            ))}
                                            {templates.length === 0 && (
                                                <div className="text-[10px] text-slate-400 font-medium italic p-2">Keine Vorlagen gefunden.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Variables Section */}
                                    {(selectedProjectId || selectedCustomerId) && (
                                        <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                    <FaKey className="text-slate-400" /> VARIABLEN
                                                </h4>
                                                <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-1 border-emerald-200 text-emerald-600 bg-emerald-50 uppercase rounded-sm">Daten bereit</Badge>
                                            </div>
                                            <div className="grid grid-cols-1 gap-1">
                                                {[
                                                    { label: 'Kunde', key: 'customer_name' },
                                                    { label: 'Ansprechp.', key: 'contact_person' },
                                                    { label: 'Projekt #', key: 'project_number', hidden: !selectedProjectId },
                                                    { label: 'Name', key: 'project_name', hidden: !selectedProjectId },
                                                    { label: 'Deadline', key: 'deadline', hidden: !selectedProjectId },
                                                    { label: 'Betrag', key: 'price_net', hidden: !selectedProjectId },
                                                    { label: 'Datum', key: 'date' },
                                                    { label: 'User', key: 'sender_name' },
                                                ].filter(v => !v.hidden).map(v => (
                                                    <button
                                                        key={v.key}
                                                        onClick={() => setComposeBody(prev => prev + ` {{${v.key}}}`)}
                                                        className="p-2.5 bg-white border border-slate-100 hover:border-slate-900 hover:shadow-sm text-xs font-mono text-slate-600 flex flex-col gap-1 transition-all group rounded-sm"
                                                        title={`Klicken zum Einfügen: {{${v.key}}}`}
                                                    >
                                                        <span className="font-black text-slate-700 text-[9px] uppercase tracking-widest">{v.label}</span>
                                                        <code className="text-[10px] text-slate-400 opacity-60 group-hover:text-slate-900 group-hover:opacity-100 transition-opacity whitespace-nowrap">{"{{" + v.key + "}}"}</code>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="p-3 bg-brand-50/50 border border-brand-100 rounded-sm">
                                                <p className="text-[9px] font-bold text-brand-700 leading-normal uppercase tracking-tight">Tipp: Variablen werden beim Senden automatisch durch Echt-Daten ersetzt.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Project Files Selector Modal */}
            <Dialog open={isProjectFilesModalOpen} onOpenChange={setIsProjectFilesModalOpen}>
                <DialogContent className="max-w-2xl bg-white p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-sm">
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

                        <ScrollArea className="h-[400px] -mr-2 pr-2">
                            <div className="space-y-1.5">
                                {projectDetails?.files?.length > 0 ? (
                                    projectDetails.files.map((file: any) => {
                                        const actualFileName = file.file_name || file.fileName || file.name;
                                        const isAlreadyAttached = composeAttachments.some(a => a.name === actualFileName);

                                        return (
                                            <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm hover:border-slate-900 transition-all group">
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className="w-10 h-10 rounded bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-sm group-hover:border-slate-900 transition-colors">
                                                        <FaFileAlt className="text-slate-400 text-sm group-hover:text-slate-900" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="text-[11px] font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">{actualFileName}</div>
                                                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-tight opacity-60">
                                                            {formatFileSize(file.file_size || file.size)} • {file.type || 'ALLGEMEIN'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={isAlreadyAttached ? "ghost" : "outline"}
                                                    disabled={isAlreadyAttached}
                                                    onClick={() => handleAddProjectFiles([file])}
                                                    className={clsx(
                                                        "h-8 px-4 text-[9px] font-bold uppercase tracking-widest transition-all rounded-sm",
                                                        isAlreadyAttached ? "text-emerald-600 bg-emerald-50" : "border-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                                                    )}
                                                >
                                                    {isAlreadyAttached ? <><FaCheckCircle size={10} className="mr-2" /> Angehängt</> : 'Hinzufügen'}
                                                </Button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-sm">
                                        <FaFolderOpen className="text-slate-200 text-4xl mb-3" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic text-center">Keine Dateien im Projekt vorhanden.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsProjectFilesModalOpen(false)}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            Abbrechen
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <NewEmailAccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                initialData={accountToEdit}
                onSubmit={(data) => {
                    if (accountToEdit) {
                        updateAccountMutation.mutate({ id: accountToEdit.id, data });
                    } else {
                        createAccountMutation.mutate(data);
                    }
                }}
            />

            <NewEmailTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                initialData={templateToEdit}
                onSubmit={(data) => {
                    if (templateToEdit) {
                        updateTemplateMutation.mutate({ id: templateToEdit.id, data });
                    } else {
                        createTemplateMutation.mutate(data);
                    }
                }}
            />
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                onClick={onClick}
                className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 text-xs transition-all",
                    active
                        ? "bg-slate-100 text-slate-800 font-semibold border-r-4 border-slate-900"
                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-600 font-medium"
                )}
            >
                <span className={clsx("text-base", active ? "text-slate-700" : "")}>{icon}</span>
                <span className="hidden md:inline">{label}</span>
            </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="md:hidden">
            {label}
        </TooltipContent>
    </Tooltip>
);

const EmailTable = ({ mails, folder, onView, onDelete }: { mails: any[], folder: string, onView: (m: any) => void, onDelete: (id: number) => void }) => (
    <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 w-1/4">
                        {folder === 'inbox' ? 'Absender' : 'Empfänger'}
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 w-2/4">Betreff</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 w-1/4">Datum</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 text-right w-32">Aktionen</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {mails.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-xs text-slate-400 font-medium">Keine E-Mails vorhanden</td>
                    </tr>
                ) : (
                    mails.map((mail: any) => (
                        <tr
                            key={mail.id}
                            onClick={() => onView(mail)}
                            className={clsx(
                                "hover:bg-slate-50 transition group cursor-pointer",
                                !mail.read && folder === 'inbox' ? "bg-slate-50/50 font-semibold" : ""
                            )}
                        >
                            <td className="px-6 py-4 text-xs font-medium text-slate-700 truncate">
                                {folder === 'inbox' ? mail.from : mail.to_emails?.join(', ')}
                                {!mail.read && folder === 'inbox' && <span className="ml-2 w-2 h-2 rounded-full bg-slate-900 inline-block"></span>}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 truncate">
                                {mail.subject || '(Kein Betreff)'}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400 font-mono whitespace-nowrap">{mail.full_time}</td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => onView(mail)} className="p-2 text-slate-300 hover:text-slate-700 transition" title="Ansehen"><FaEye /></button>
                                    <button onClick={() => onDelete(mail.id)} className="p-2 text-slate-300 hover:text-red-500 transition" title="Löschen"><FaTrashAlt /></button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

const EmailDetailModal = ({ mail, onClose, onReply, onForward, onDelete }: any) => {
    if (!mail) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-8 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl h-full md:h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                            {mail.from.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-slate-900 truncate max-w-2xl leading-tight mb-1">{mail.subject || '(Kein Betreff)'}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                <span className="text-slate-900">{mail.from}</span>
                                <span>•</span>
                                <span>{mail.full_time}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => onReply(mail)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition" title="Antworten">
                            <FaReply /> Antworten
                        </button>
                        <button onClick={() => onForward(mail)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition" title="Weiterleiten">
                            <FaForward /> Weiterleiten
                        </button>
                        <div className="w-[1px] h-4 bg-slate-200 mx-2" />
                        <button onClick={() => onDelete(mail.id)} className="p-2 text-slate-400 hover:text-red-500 transition" title="Löschen">
                            <FaTrashAlt />
                        </button>
                        <button onClick={onClose} className="ml-2 p-2 text-slate-400 hover:text-slate-900 transition">
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-10 bg-white">
                    <div className="max-w-4xl mx-auto">
                        <div
                            className="email-body-content text-slate-800 text-sm leading-relaxed prose prose-slate max-w-none"
                            dangerouslySetInnerHTML={{ __html: mail.body }}
                        />
                    </div>
                </div>
                {mail.attachments && mail.attachments.length > 0 && (
                    <div className="px-10 py-6 border-t border-slate-100 bg-slate-50">
                        <h4 className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.1em]">Anhänge ({mail.attachments.length})</h4>
                        <div className="flex flex-wrap gap-3">
                            {mail.attachments.map((at: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 group hover:border-slate-400 transition cursor-default">
                                    <FaPaperclip className="text-slate-400 group-hover:text-slate-600" />
                                    <span>{at.name}</span>
                                    <span className="text-slate-400 font-normal">({(at.size / 1024).toFixed(0)} KB)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ResourceTable = ({ title, items, headers, renderRow, onAdd, onEdit, onDelete }: any) => (
    <div className="bg-white">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-xs font-semibold text-slate-800">{title}</h2>
            <button onClick={onAdd} className="text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 transition hover:bg-slate-900">
                Neu+
            </button>
        </div>
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-slate-200 bg-slate-50/30">
                    {headers.map((h: string) => (
                        <th key={h} className="px-6 py-4 text-xs font-semibold text-slate-400">{h}</th>
                    ))}
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 text-right">Aktionen</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                    <tr>
                        <td colSpan={headers.length + 1} className="px-6 py-10 text-center text-xs text-slate-400 font-medium">Keine Daten vorhanden</td>
                    </tr>
                ) : (
                    items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                            {renderRow(item)}
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => onEdit?.(item)} className="p-2 text-slate-300 hover:text-slate-700 transition" title="Bearbeiten"><FaEdit /></button>
                                    <button className="p-2 text-slate-300 hover:text-slate-800 transition" title="Details"><FaFolderOpen /></button>
                                    <button onClick={() => onDelete?.(item)} className="p-2 text-slate-300 hover:text-red-500 transition" title="Entfernen"><FaTrashAlt /></button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

export default CommunicationHub;
