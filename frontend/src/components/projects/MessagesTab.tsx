import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    FaComments, FaCopy, FaPaperclip, FaPaperPlane, FaExchangeAlt,
    FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive,
    FaFile, FaDownload, FaEye, FaEnvelope, FaStickyNote, FaFileInvoiceDollar,
    FaChevronDown, FaChevronUp, FaCheck, FaClock
} from 'react-icons/fa';
import clsx from 'clsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../api/services';
import { Button } from '../ui/button';

interface MessagesTabProps {
    projectData: any;
    projectId: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

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

// ─── Collapsible Panel ───────────────────────────────────────────────────────

const Panel = ({ title, icon: Icon, count, children, defaultOpen = true, accent = 'slate' }: {
    title: string; icon: any; count?: number; children: React.ReactNode; defaultOpen?: boolean; accent?: string;
}) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon size={12} className={`text-${accent}-500`} />
                    <span className="text-xs font-semibold text-slate-700">{title}</span>
                    {count !== undefined && (
                        <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full shadow-sm">{count}</span>
                    )}
                </div>
                {open ? <FaChevronUp size={9} className="text-slate-400" /> : <FaChevronDown size={9} className="text-slate-400" />}
            </button>
            {open && <div className="bg-white">{children}</div>}
        </div>
    );
};

// ─── main component ──────────────────────────────────────────────────────────

const MessagesTab = ({ projectData, projectId }: MessagesTabProps) => {
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const [chatMode, setChatMode] = useState<'customer' | 'partner'>('customer');
    const [note, setNote] = useState(projectData?.notes || '');
    const [noteEditing, setNoteEditing] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);

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

    const handleSendGuestLink = async () => {
        let token = chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token;
        if (!token) {
            setIsGeneratingToken(true);
            try {
                const response = await projectService.generateToken(projectId, chatMode);
                token = response.access_token;
                await queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
                toast.success('Link wurde generiert');
            } catch { toast.error('Link konnte nicht generiert werden'); return; }
            finally { setIsGeneratingToken(false); }
        } else {
            toast.success('Link bereits vorhanden');
        }
    };

    const handleSaveNote = async () => {
        setSavingNote(true);
        try {
            await projectService.update(projectId, { notes: note });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
            setNoteEditing(false);
            toast.success('Notiz gespeichert');
        } catch { toast.error('Fehler beim Speichern'); }
        finally { setSavingNote(false); }
    };

    const { data: activitiesData = [] } = useQuery({
        queryKey: ['projects', projectId, 'activities'],
        queryFn: () => projectService.getActivities(projectId),
        enabled: true,
    });

    const activePerson = chatMode === 'customer' ? projectData.customer : projectData.translator;
    const tokenExists = chatMode === 'customer' ? !!projectData.access_token : !!projectData.partner_access_token;
    const personName = chatMode === 'customer'
        ? (activePerson?.company_name || activePerson?.name || 'Kunde')
        : (activePerson?.name || 'Partner');
    const personEmail = activePerson?.email || '—';
    const initials = (personName || 'K').substring(0, 1).toUpperCase();

    // derived data for right column
    const invoices: any[] = projectData.invoices || [];
    const payments: any[] = projectData.payments || [];
    const sentEmails: any[] = projectData.sent_emails || projectData.emails || [];
    const totalPaid = payments.reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0);

    const statusBadge = (s: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            draft:     { label: 'Entwurf',    cls: 'bg-slate-100 text-slate-500' },
            issued:    { label: 'Gestellt',   cls: 'bg-blue-50 text-blue-600' },
            paid:      { label: 'Bezahlt',    cls: 'bg-emerald-50 text-emerald-600' },
            cancelled: { label: 'Storniert',  cls: 'bg-red-50 text-red-500' },
        };
        const entry = map[s] || { label: s, cls: 'bg-slate-100 text-slate-500' };
        return <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-sm', entry.cls)}>{entry.label}</span>;
    };

    const methodIcon = (m: string) => {
        if (m === 'Bar') return '💵';
        if (m === 'Karte') return '💳';
        if (m === 'Überweisung') return '🏦';
        return '•';
    };

    return (
        <div className="flex gap-4 h-[680px] animate-fadeIn mb-10">

            {/* ── LEFT: Chat ─────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 bg-white rounded-sm border border-slate-200 shadow-sm flex flex-col overflow-hidden">

                {/* Chat Header */}
                <div className="bg-white px-4 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200">
                            {initials}
                        </div>
                        <div className="flex flex-col leading-tight">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800">{personName}</span>
                                <span className={clsx(
                                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                    chatMode === 'customer' ? "bg-teal-600 text-white" : "bg-blue-500 text-white"
                                )}>
                                    {chatMode === 'customer' ? 'Kunde' : 'Partner'}
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400">{personEmail}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Portal-Link */}
                        <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-sm px-2 py-1 max-w-[260px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Portal</span>
                            <input
                                readOnly
                                value={
                                    (chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token)
                                        ? `${window.location.protocol}//${window.location.host}/guest/project/${chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token}`
                                        : 'Kein Link'
                                }
                                onClick={e => (e.target as HTMLInputElement).select()}
                                className="flex-1 w-full bg-transparent text-[10px] text-slate-400 outline-none cursor-default truncate"
                            />
                            <button
                                onClick={() => {
                                    const token = chatMode === 'customer' ? projectData.access_token : projectData.partner_access_token;
                                    if (token) {
                                        navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/guest/project/${token}`);
                                        toast.success('Link kopiert');
                                    }
                                }}
                                className="text-slate-300 hover:text-teal-600 transition-colors"
                            ><FaCopy size={9} /></button>
                            <Button size="sm" onClick={handleSendGuestLink} disabled={isGeneratingToken} className="h-5 px-2 text-[10px] font-bold flex items-center gap-1">
                                {isGeneratingToken ? <span className="animate-spin text-[10px]">○</span> : <FaPaperPlane size={7} />}
                                {tokenExists ? 'Senden' : 'Generieren'}
                            </Button>
                        </div>

                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setChatMode(chatMode === 'customer' ? 'partner' : 'customer')}
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-teal-600 h-7 px-3 rounded-sm"
                        >
                            <FaExchangeAlt size={9} />
                            {chatMode === 'customer' ? 'Zum Partner' : 'Zum Kunden'}
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"
                    style={{ backgroundColor: '#e5ddd5', backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`, backgroundBlendMode: 'overlay' }}
                >
                    {filteredMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                            <div className="w-14 h-14 bg-white/50 rounded-full flex items-center justify-center">
                                <FaComments className="text-2xl text-white" />
                            </div>
                            <p className="text-xs font-medium italic">Keine Nachrichten vorhanden.</p>
                        </div>
                    ) : (
                        filteredMessages.map((msg: any) => {
                            const isMe = !!msg.user_id;
                            return (
                                <div key={msg.id} className={clsx("flex flex-col w-full", isMe ? "items-end" : "items-start")}>
                                    <div className={clsx(
                                        "px-2.5 py-2 rounded-xl text-xs shadow-sm max-w-[85%] relative min-w-[80px]",
                                        isMe ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none border border-[#c7eba7]"
                                             : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                                    )}>
                                        {msg.file ? (
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                <div className="flex items-center gap-3 p-2 bg-black/5 rounded-sm border border-black/5">
                                                    <div className={clsx("text-2xl", getFileIcon(msg.file.extension).color)}>
                                                        {(() => { const { icon: Icon } = getFileIcon(msg.file.extension); return <Icon />; })()}
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-bold truncate text-[11px] leading-tight">{msg.file.original_name}</span>
                                                        <span className="text-xs text-slate-500 font-medium">{formatBytes(msg.file.file_size)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mb-4">
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs bg-white/50 hover:bg-white flex items-center gap-1.5 font-bold text-slate-600 rounded-sm" onClick={() => handleFilePreview(msg.file)}>
                                                        <FaEye size={10} /> Vorschau
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs bg-white/50 hover:bg-white flex items-center gap-1.5 font-bold text-slate-600 rounded-sm" onClick={() => handleFileDownload(msg.file)}>
                                                        <FaDownload size={10} /> Download
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap break-words pr-12 pb-3">{msg.content}</div>
                                        )}
                                        <div className="absolute bottom-1 right-1.5 flex items-center gap-1">
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && <span className="text-sky-400 text-xs font-bold">✓✓</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-slate-100 bg-white shrink-0">
                    <div className="flex gap-2 items-center">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="w-9 h-9 flex-shrink-0 rounded-full bg-slate-50 text-slate-400 hover:text-teal-600">
                            <FaPaperclip size={13} />
                        </Button>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder={`Nachricht an ${chatMode === 'customer' ? 'Kunden' : 'Partner'}...`}
                                className="w-full h-10 pl-4 pr-12 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none text-xs transition-all"
                                onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                            />
                            <Button variant="default" size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()} className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full">
                                <FaPaperPlane className="text-xs" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Sidebar Panels ───────────────────────────────────── */}
            <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-0.5">

                {/* Notizen */}
                <Panel title="Projektnotiz" icon={FaStickyNote} accent="amber" defaultOpen={true}>
                    <div className="p-3 space-y-2">
                        {noteEditing ? (
                            <>
                                <textarea
                                    autoFocus
                                    rows={4}
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    className="w-full resize-none text-xs text-slate-700 bg-amber-50 border border-amber-200 rounded-sm px-2.5 py-2 outline-none focus:border-amber-400 transition-colors leading-relaxed"
                                    placeholder="Interne Anmerkungen zum Projekt..."
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveNote} disabled={savingNote} className="flex-1 h-7 text-[10px] font-bold">
                                        <FaCheck size={9} className="mr-1" /> Speichern
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => { setNote(projectData?.notes || ''); setNoteEditing(false); }} className="h-7 text-[10px] font-bold px-3">
                                        Abbrechen
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div
                                onClick={() => setNoteEditing(true)}
                                className="min-h-[56px] text-xs text-slate-600 leading-relaxed cursor-pointer hover:bg-amber-50 rounded-sm px-2 py-1.5 transition-colors"
                            >
                                {note
                                    ? <span className="whitespace-pre-wrap">{note}</span>
                                    : <span className="text-slate-300 italic">Klicken zum Bearbeiten...</span>
                                }
                            </div>
                        )}
                    </div>
                </Panel>

                {/* Rechnungen */}
                <Panel title="Rechnungen" icon={FaFileInvoiceDollar} count={invoices.length} accent="blue" defaultOpen={true}>
                    {invoices.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[11px] text-slate-300 italic">Keine Rechnungen vorhanden</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {invoices.map((inv: any) => (
                                <div key={inv.id} className="px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] font-semibold text-slate-700 truncate">{inv.invoice_number || `#${inv.id}`}</span>
                                        <span className="text-[10px] text-slate-400">{inv.issue_date ? fmtShort(inv.issue_date) : '—'}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                                        {statusBadge(inv.status)}
                                        <span className="text-[11px] font-bold text-slate-700">
                                            {parseFloat(inv.total_gross || inv.amount_gross || 0).toFixed(2)} €
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {/* Zahlungen Zusammenfassung */}
                            {payments.length > 0 && (
                                <div className="px-3 py-2 bg-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500 font-semibold">Bezahlt gesamt</span>
                                    <span className="text-[11px] font-bold text-emerald-600">{totalPaid.toFixed(2)} €</span>
                                </div>
                            )}
                        </div>
                    )}
                </Panel>

                {/* Zahlungen */}
                <Panel title="Zahlungsverlauf" icon={FaCheck} count={payments.length} accent="emerald" defaultOpen={false}>
                    {payments.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[11px] text-slate-300 italic">Keine Zahlungen erfasst</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {payments.map((p: any) => (
                                <div key={p.id} className="px-3 py-2.5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base leading-none">{methodIcon(p.payment_method)}</span>
                                        <div className="flex flex-col leading-tight">
                                            <span className="text-[11px] font-semibold text-slate-700">{p.payment_method || '—'}</span>
                                            <span className="text-[10px] text-slate-400">{p.payment_date ? fmtShort(p.payment_date) : '—'}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">{parseFloat(p.amount || 0).toFixed(2)} €</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

                {/* Gesendete E-Mails */}
                <Panel title="Gesendete E-Mails" icon={FaEnvelope} count={sentEmails.length} accent="violet" defaultOpen={false}>
                    {sentEmails.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[11px] text-slate-300 italic">Keine E-Mails gesendet</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {sentEmails.map((mail: any, i: number) => (
                                <div key={i} className="px-3 py-2.5 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-semibold text-slate-700 truncate">{mail.subject || '(kein Betreff)'}</span>
                                            <span className="text-[10px] text-slate-400 truncate">An: {mail.to || mail.recipient || '—'}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{mail.sent_at ? fmtShort(mail.sent_at) : '—'}</span>
                                    </div>
                                    {mail.preview && (
                                        <p className="mt-1 text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{mail.preview}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

                {/* Letzte Aktivitäten (kompakt) */}
                <Panel title="Letzte Aktivitäten" icon={FaClock} accent="slate" defaultOpen={false}>
                    {activitiesData.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[11px] text-slate-300 italic">Keine Aktivitäten</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {activitiesData.slice(0, 8).map((act: any, i: number) => (
                                <div key={i} className="px-3 py-2 flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                    <div className="flex flex-col leading-tight min-w-0">
                                        <span className="text-[11px] text-slate-600 leading-snug">{act.description || act.event}</span>
                                        <span className="text-[10px] text-slate-400">{act.causer?.name || 'System'} · {act.created_at ? fmtShort(act.created_at) : '—'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

            </div>
        </div>
    );
};

export default MessagesTab;
