import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    FaComments, FaCopy, FaPaperclip, FaPaperPlane, FaExchangeAlt,
    FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive,
    FaFile, FaDownload, FaEye, FaEnvelope, FaFileInvoiceDollar,
    FaChevronDown, FaChevronUp, FaCheck, FaClock, FaLink, FaUniversity,
    FaCreditCard, FaMoneyBillAlt, FaCheckDouble, FaExternalLinkAlt, FaUserCircle,
    FaPaperPlane as FaSend, FaHistory, FaPlus, FaKey
} from 'react-icons/fa';
import clsx from 'clsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../api/services';
import { Button } from '../ui/button';

interface MessagesTabProps {
    projectData: any;
    projectId: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const KPICard = ({ title, value, icon: Icon, color = "brand" }: { title: string; value: any; icon: any; color?: string }) => (
    <div className="bg-white border border-slate-200 rounded-sm p-3.5 flex items-center justify-between shadow-sm">
        <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{title}</div>
            <div className="text-lg font-bold text-slate-800">{value}</div>
        </div>
        <div className={`w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100`}>
            <Icon size={14} className={color === "brand" ? "text-brand-primary" : "text-slate-400"} />
        </div>
    </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[11px] font-bold text-slate-500 mb-2.5 mt-4 first:mt-0 uppercase tracking-widest">{children}</div>
);

const InfoRow = ({ label, children, noBorder = false }: { label: React.ReactNode; children: React.ReactNode; noBorder?: boolean }) => (
    <div className={clsx("flex gap-3 py-2", !noBorder && "border-b border-slate-50 last:border-0")}>
        <span className="text-[11px] text-slate-400 w-24 shrink-0 pt-px">{label}</span>
        <span className="text-[11px] text-slate-700 font-medium flex-1 min-w-0">{children}</span>
    </div>
);

const getFileIcon = (extension: string = '') => {
    const ext = extension.toLowerCase();
    if (['pdf'].includes(ext)) return { icon: FaFilePdf, color: 'text-red-500' };
    if (['doc', 'docx'].includes(ext)) return { icon: FaFileWord, color: 'text-blue-500' };
    if (['xls', 'xlsx'].includes(ext)) return { icon: FaFileExcel, color: 'text-green-600' };
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return { icon: FaFileImage, color: 'text-purple-500' };
    if (['zip', 'rar', '7z'].includes(ext)) return { icon: FaFileArchive, color: 'text-orange-500' };
    return { icon: FaFile, color: 'text-slate-400' };
};

const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

const fmtShort = (iso: string) =>
    new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });

const StatusBadge = ({ s }: { s: string }) => {
    const map: Record<string, { label: string; cls: string }> = {
        draft:     { label: 'Entwurf',   cls: 'bg-slate-100 text-slate-500' },
        issued:    { label: 'Gestellt',  cls: 'bg-blue-50 text-blue-600' },
        paid:      { label: 'Bezahlt',   cls: 'bg-emerald-50 text-emerald-600' },
        cancelled: { label: 'Storniert', cls: 'bg-red-50 text-red-500' },
    };
    const entry = map[s] || { label: s, cls: 'bg-slate-100 text-slate-500' };
    return <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-sm', entry.cls)}>{entry.label}</span>;
};

// ─── Main Component ──────────────────────────────────────────────────────────

const MessagesTab = ({ projectData, projectId }: MessagesTabProps) => {
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const [chatMode, setChatMode] = useState<'customer' | 'partner'>('customer');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [portalMode, setPortalMode] = useState<'link' | 'account'>('link');

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    const filteredMessages = [...(projectData.messages || [])]
        .filter((msg: any) => (msg.type === chatMode) || (!msg.type && chatMode === 'customer'))
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    useEffect(() => { scrollToBottom(); }, [filteredMessages]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        projectService.postMessage(projectId, newMessage, chatMode).then(() => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('file', e.target.files[0]);
            formData.append('type', 'reference');
            const toastId = toast.loading('Lade Datei hoch...');
            projectService.uploadFile(projectId, formData).then((response: any) => {
                toast.dismiss(toastId);
                toast.success('Datei gesendet');
                const content = `[Datei hochgeladen: ${e.target.files![0].name}]`;
                projectService.postMessage(projectId, content, chatMode, response.id).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
                });
            }).catch(() => {
                toast.dismiss(toastId);
                toast.error('Upload Fehler');
            });
        }
    };

    const handleFilePreview = async (file: any) => {
        try {
            const response = await projectService.downloadFile(projectId, file.id);
            const blob = new Blob([response.data], { type: file.mime_type });
            window.open(window.URL.createObjectURL(blob), '_blank');
        } catch { toast.error('Vorschau nicht möglich'); }
    };

    const handleFileDownload = async (file: any) => {
        try {
            const response = await projectService.downloadFile(projectId, file.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.original_name || 'download');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch { toast.error('Download fehlgeschlagen'); }
    };

    const handleGenerateToken = async () => {
        setIsGeneratingToken(true);
        try {
            await projectService.generateToken(projectId, chatMode);
            await queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
            toast.success('Portal-Link generiert');
        } catch { toast.error('Link konnte nicht generiert werden'); }
        finally { setIsGeneratingToken(false); }
    };

    const handleCopyToken = () => {
        const token = chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token;
        if (token) {
            navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/guest/project/${token}`);
            toast.success('Link kopiert');
        }
    };

    const handleSendGuestLink = async () => {
        const token = chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token;
        if (!token) {
            await handleGenerateToken();
        } else {
            toast.success('Link bereits vorhanden');
        }
    };

    const { data: activitiesData = [] } = useQuery({
        queryKey: ['projects', projectId, 'activities'],
        queryFn: () => projectService.getActivities(projectId),
        enabled: true,
    });

    const activePerson = chatMode === 'customer' ? projectData.customer : projectData.translator;
    const tokenExists = chatMode === 'customer' ? !!projectData.access_token : !!projectData.partner_access_token;
    const portalToken = chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token;
    const portalUrl = portalToken
        ? `${window.location.protocol}//${window.location.host}/guest/project/${portalToken}`
        : null;
    const personName = chatMode === 'customer'
        ? (activePerson?.company_name || activePerson?.name || 'Kunde')
        : (activePerson?.name || 'Partner');
    const personEmail = activePerson?.email || '—';
    const initials = (personName || 'K').substring(0, 1).toUpperCase();

    const invoices: any[] = projectData.invoices || [];
    const payments: any[] = projectData.payments || [];
    const sentEmails: any[] = projectData.sent_emails || projectData.emails || [];

    return (
        <div className="space-y-6 animate-fadeIn transition-all">
            
            {/* ── KPI SECTION ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Nachrichten" value={projectData.messages?.length || 0} icon={FaComments} />
                <KPICard title="Gesendete E-Mails" value={sentEmails.length} icon={FaEnvelope} />
                <KPICard 
                    title="Portal-Status" 
                    value={tokenExists ? "Aktiv" : "Inaktiv"} 
                    icon={FaLink} 
                    color={tokenExists ? "brand" : "slate"} 
                />
                <KPICard 
                    title="Letzte Aktivität" 
                    value={(activitiesData as any[])[0]?.created_at ? fmtShort((activitiesData as any[])[0].created_at) : "—"} 
                    icon={FaClock} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
                
                {/* ── LEFT: CHAT BOX ────────────────────────────────────────── */}
                <div className="bg-white rounded-sm border border-slate-200 overflow-hidden flex flex-col h-[600px] shadow-sm">
                    {/* Chat Header */}
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-primary font-bold text-sm">
                                {initials}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800 tracking-tight leading-snug">{personName}</span>
                                <span className="text-[11px] text-slate-400 font-medium tracking-tight">{personEmail}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setChatMode(chatMode === 'customer' ? 'partner' : 'customer')}
                                className="flex items-center gap-2 h-8 px-3 rounded-sm bg-slate-50 hover:bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition border border-slate-200"
                            >
                                <FaExchangeAlt className="text-brand-primary" size={10} />
                                {chatMode === 'customer' ? 'Zu Partner' : 'Zu Kunde'}
                            </button>
                        </div>
                    </div>

                    {/* Chat Body */}
                    <div 
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-[#FDFDFD]"
                        style={{ 
                            backgroundImage: `radial-gradient(circle, #f1f1f1 1px, transparent 1px)`,
                            backgroundSize: '24px 24px'
                        }}
                    >
                        {filteredMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 opacity-50">
                                <FaComments size={40} className="text-slate-100" />
                                <p className="text-xs font-semibold uppercase tracking-widest">Keine Nachrichten</p>
                            </div>
                        ) : (
                            filteredMessages.map((msg: any) => {
                                const isMe = !!msg.user_id;
                                return (
                                    <div key={msg.id} className={clsx("flex flex-col w-full", isMe ? "items-end" : "items-start")}>
                                        <div className={clsx(
                                            "px-3.5 py-2.5 rounded-sm shadow-sm max-w-[85%] relative min-w-[80px] border",
                                            isMe ? "bg-white border-brand-primary/10" : "bg-slate-50 border-slate-200"
                                        )}>
                                            {msg.file ? (
                                                <div className="flex flex-col gap-2.5 min-w-[200px]">
                                                    <div className="flex items-center gap-3 p-2 bg-slate-100/50 rounded-sm">
                                                        <div className={clsx("text-2xl", getFileIcon(msg.file.extension).color)}>
                                                            {(() => { const { icon: Icon } = getFileIcon(msg.file.extension); return <Icon />; })()}
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="font-bold truncate text-[11px] text-slate-700 leading-tight">{msg.file.original_name}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold">{formatBytes(msg.file.file_size)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[10px] bg-white border border-slate-100 hover:border-brand-primary font-bold text-slate-600 rounded-sm" onClick={() => handleFilePreview(msg.file)}>
                                                            <FaEye className="text-brand-primary" size={9} /> Vorschau
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[10px] bg-white border border-slate-100 hover:border-brand-primary font-bold text-slate-600 rounded-sm" onClick={() => handleFileDownload(msg.file)}>
                                                            <FaDownload className="text-brand-primary" size={9} /> Laden
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-slate-700 leading-relaxed break-words whitespace-pre-wrap pb-4">{msg.content}</div>
                                            )}
                                            <div className="absolute bottom-1 right-2 flex items-center gap-1.5 grayscale opacity-60">
                                                <span className="text-[9px] font-bold text-slate-400">
                                                    {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && <FaCheckDouble size={9} className="text-brand-primary" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <div className="flex gap-2.5 items-center">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-brand-primary hover:bg-slate-100 transition border border-slate-100"
                            >
                                <FaPaperclip size={14} />
                            </button>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Ihre Nachricht schreiben..."
                                    className="w-full h-10 pl-5 pr-12 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-primary outline-none text-[11px] font-medium transition-all"
                                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                                />
                                <button 
                                    onClick={handleSendMessage} 
                                    disabled={!newMessage.trim()} 
                                    className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-primary/90 transition shadow-sm"
                                >
                                    <FaPaperPlane size={10} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: ADMINISTRATIVE BOX ─────────────────────────────── */}
                <div className="bg-white rounded-sm border border-slate-200 p-5 shadow-sm space-y-6 h-[600px] overflow-y-auto custom-scrollbar">
                    
                    {/* PORTAL SECTION - Cleaned up and restructured */}
                    <div className="space-y-4">
                        <SectionLabel>Portal-Verwaltung</SectionLabel>
                        
                        <div className="space-y-5">
                            {/* Toggle for Kunde/Partner - Premium Style */}
                            <div className="flex p-1 bg-slate-100/50 rounded-md border border-slate-100">
                                <button
                                    onClick={() => setChatMode('customer')}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all",
                                        chatMode === 'customer' 
                                            ? "bg-white text-brand-primary shadow-sm ring-1 ring-slate-200" 
                                            : "text-slate-400 hover:text-slate-500"
                                    )}
                                >
                                    <FaUserCircle size={10} /> Kunde
                                </button>
                                <button
                                    onClick={() => setChatMode('partner')}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all",
                                        chatMode === 'partner' 
                                            ? "bg-white text-brand-primary shadow-sm ring-1 ring-slate-200" 
                                            : "text-slate-400 hover:text-slate-500"
                                    )}
                                >
                                    <FaUserCircle size={10} /> Partner
                                </button>
                            </div>

                            {/* Selection: Link vs Account */}
                            <div className="space-y-3">
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setPortalMode('link')}
                                        className={clsx(
                                            "flex-1 py-3 px-4 rounded-sm border transition-all text-left group",
                                            portalMode === 'link' ? "border-brand-primary bg-brand-primary/5" : "border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <div className={clsx("text-[10px] font-bold uppercase tracking-widest mb-1", portalMode === 'link' ? "text-brand-primary" : "text-slate-400")}>Direkt-Link</div>
                                        <div className="text-[9px] text-slate-500 leading-tight">Sofortiger Zugriff ohne Login-Daten.</div>
                                    </button>
                                    <button 
                                        onClick={() => setPortalMode('account')}
                                        className={clsx(
                                            "flex-1 py-3 px-4 rounded-sm border transition-all text-left group",
                                            portalMode === 'account' ? "border-brand-primary bg-brand-primary/5" : "border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <div className={clsx("text-[10px] font-bold uppercase tracking-widest mb-1", portalMode === 'account' ? "text-brand-primary" : "text-slate-400")}>Portal-Konto</div>
                                        <div className="text-[9px] text-slate-500 leading-tight">Dauerhaftes Konto mit E-Mail-Einladung.</div>
                                    </button>
                                </div>

                                {portalMode === 'link' ? (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
                                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-sm px-3 py-2.5 text-[10px] text-slate-400 font-mono truncate">
                                            <FaLink className="text-brand-primary shrink-0" size={10} />
                                            <span className="flex-1 truncate">{portalUrl || 'Kein Link generiert'}</span>
                                            {portalUrl && (
                                                <button onClick={handleCopyToken} className="hover:text-brand-primary p-1 rounded hover:bg-white transition shadow-sm"><FaCopy size={10} /></button>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {!tokenExists && (
                                                <Button variant="secondary" onClick={handleGenerateToken} disabled={isGeneratingToken} className="flex-1 h-9 text-[10px] font-bold gap-2">
                                                    <FaKey size={10} className="text-brand-primary" /> Link generieren
                                                </Button>
                                            )}
                                            <Button onClick={handleSendGuestLink} className="flex-1 h-9 text-[10px] font-bold gap-2">
                                                <FaSend size={10} /> Per E-Mail senden
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
                                        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-sm text-[10px] text-amber-700 leading-relaxed italic">
                                            Der Empfänger erhält eine Einladungs-E-Mail zur Registrierung. Damit kann er dauerhaft auf alle Dokumente zugreifen.
                                        </div>
                                        <Button className="w-full h-9 text-[10px] font-bold gap-2 bg-brand-primary text-white">
                                            <FaUserCircle size={11} /> Einladung verschicken
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* INVOICES SECTION */}
                    <div className="space-y-3">
                        <SectionLabel>Finanzen & Rechnungen</SectionLabel>
                        {invoices.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic pl-1">Keine Rechnungen vorhanden</p>
                        ) : (
                            <div className="rounded-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                                {invoices.map((inv: any) => (
                                    <div key={inv.id} className="p-3 bg-white flex items-center justify-between hover:bg-slate-50 transition">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-700 leading-tight">{inv.invoice_number || `#${inv.id}`}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{inv.issue_date ? fmtShort(inv.issue_date) : '—'}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <StatusBadge s={inv.status} />
                                            <span className="text-[11px] font-bold text-slate-800 tracking-tight">
                                                {parseFloat(inv.amount_gross_eur || inv.total_gross || inv.amount_gross || 0).toFixed(2)} €
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* EMAILS SECTION */}
                    <div className="space-y-3">
                        <SectionLabel>E-Mail Protokoll</SectionLabel>
                        {sentEmails.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic pl-1">Keine E-Mails protokolliert</p>
                        ) : (
                            <div className="rounded-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                                {sentEmails.slice(0, 3).map((mail: any, i: number) => (
                                    <div key={i} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition">
                                        <div className="w-8 h-8 rounded-full bg-brand-primary/5 border border-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                                            <FaEnvelope size={11} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <span className="text-[11px] font-bold text-slate-700 truncate">{mail.subject || '(kein Betreff)'}</span>
                                                <span className="text-[9px] font-bold text-slate-400 shrink-0">{mail.sent_at ? fmtShort(mail.sent_at) : '—'}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate">Empfänger: {mail.to || '—'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


                </div>
            </div>
        </div>
    );
};

export default MessagesTab;
