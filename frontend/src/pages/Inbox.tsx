import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaInbox, FaPaperPlane, FaTrash, FaSearch, FaEnvelopeOpen, FaTimes, FaReply, FaPrint, FaPaperclip, FaPlus } from 'react-icons/fa';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mailService, dashboardService } from '../api/services';
import InboxSkeleton from '../components/common/InboxSkeleton';

const Inbox = () => {
    const location = useLocation();
    const queryClient = useQueryClient();
    const [activeFolder, setActiveFolder] = useState('inbox');
    const [selectedMail, setSelectedMail] = useState<any>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isComposeMinimized, setIsComposeMinimized] = useState(false);

    // Compose States
    const [composeFrom, setComposeFrom] = useState('');
    const [composeTo, setComposeTo] = useState('');
    const [composeCc, setComposeCc] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composeAttachments, setComposeAttachments] = useState<any[]>([]);

    useEffect(() => {
        if (location.state?.compose) {
            setComposeTo(location.state.to || '');
            setComposeSubject(location.state.subject || '');
            setComposeBody(location.state.body || '');
            setComposeAttachments(location.state.attachments || []);
            setIsComposeOpen(true);
        }
    }, [location.state]);

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['mails', activeFolder],
        queryFn: () => mailService.getAll(activeFolder)
    });

    // Fetch stats for unread count
    const { data: dashboardData } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: dashboardService.getStats
    });

    const unreadCount = dashboardData?.stats?.unread_emails || 0;

    const sendMutation = useMutation({
        mutationFn: mailService.send,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            setIsComposeOpen(false);
            setIsComposeMinimized(false);
            // Reset form
            setComposeFrom('');
            setComposeTo('');
            setComposeCc('');
            setComposeSubject('');
            setComposeBody('');
            setComposeAttachments([]);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: mailService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            setSelectedMail(null);
        }
    });

    const markReadMutation = useMutation({
        mutationFn: mailService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
        }
    });

    const handleSelectMail = (mail: any) => {
        setSelectedMail(mail);
        if (!mail.read) {
            markReadMutation.mutate(mail.id);
        }
    };

    // Helper to send mail
    const handleSendMail = () => {
        sendMutation.mutate({
            from: composeFrom.split(',').map(s => s.trim()).filter(Boolean),
            to: composeTo.split(',').map(s => s.trim()).filter(Boolean),
            cc: composeCc.split(',').map(s => s.trim()).filter(Boolean),
            subject: composeSubject,
            body: composeBody,
            attachments: composeAttachments
        });
    };

    if (isLoading) return <InboxSkeleton />;

    return (
        <div className="flex flex-col h-full gap-6 fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Inbox</h1>
                    <p className="text-slate-500 text-sm">Zentrale Kommunikation mit Kunden und Partnern.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Drafts / Minimized Mail Bar */}
                    {isComposeOpen && isComposeMinimized && (
                        <div
                            onClick={() => setIsComposeMinimized(false)}
                            className="flex items-center gap-2 bg-white border border-brand-200 px-3 py-1.5 rounded-md shadow-sm hover:bg-brand-50 cursor-pointer animate-fadeInLeft"
                        >
                            <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                            <span className="text-xs font-semibold text-brand-700">
                                {composeSubject || '(Kein Betreff)'}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsComposeOpen(false);
                                    setIsComposeMinimized(false);
                                }}
                                className="ml-2 text-slate-400 hover:text-red-500"
                            >
                                <FaTimes className="text-[10px]" />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            setIsComposeOpen(true);
                            setIsComposeMinimized(false);
                        }}
                        className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
                    >
                        <FaPlus className="text-xs" /> Neue Nachricht
                    </button>
                </div>
            </div>

            <div className="flex-1 flex bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden relative">
                {/* Sidebar */}
                <div className="w-60 bg-slate-50 border-r border-slate-200 flex flex-col">
                    <nav className="flex-1 p-3 space-y-1">
                        <button
                            onClick={() => setActiveFolder('inbox')}
                            className={clsx(
                                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                                activeFolder === 'inbox' ? 'bg-white shadow-sm border border-slate-200 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-200/50'
                            )}
                        >
                            <span className="flex items-center gap-3"><FaInbox className={activeFolder === 'inbox' ? 'text-brand-600' : 'text-slate-400'} /> Posteingang</span>
                            {activeFolder === 'inbox' && unreadCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-brand-100 text-brand-700">{unreadCount}</span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveFolder('sent')}
                            className={clsx(
                                "w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                                activeFolder === 'sent' ? 'bg-white shadow-sm border border-slate-200 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-200/50'
                            )}
                        >
                            <FaPaperPlane className={clsx("mr-3", activeFolder === 'sent' ? 'text-brand-600' : 'text-slate-400')} /> Gesendet
                        </button>
                        <button
                            onClick={() => setActiveFolder('trash')}
                            className={clsx(
                                "w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                                activeFolder === 'trash' ? 'bg-white shadow-sm border border-slate-200 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-200/50'
                            )}
                        >
                            <FaTrash className={clsx("mr-3", activeFolder === 'trash' ? 'text-brand-600' : 'text-slate-400')} /> Papierkorb
                        </button>
                    </nav>
                </div>

                {/* Mail List */}
                <div className="w-80 border-r border-slate-200 flex flex-col">
                    <div className="p-3 border-b border-slate-100 bg-white">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                            <input
                                type="text"
                                placeholder="Suche..."
                                className="w-full pl-8 pr-4 py-2 bg-slate-100 border-none rounded-md text-xs focus:ring-1 focus:ring-brand-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {messages.map((m: any) => (
                            <div
                                key={m.id}
                                onClick={() => handleSelectMail(m)}
                                className={clsx(
                                    "p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition group",
                                    selectedMail?.id === m.id ? 'bg-brand-50/30' : '',
                                    !m.read && "border-l-2 border-l-brand-600"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={clsx("text-xs truncate mr-2", !m.read ? "font-semibold text-slate-900" : "text-slate-600")}>{m.from}</span>
                                    <span className="text-[10px] text-slate-400 shrink-0">{m.time}</span>
                                </div>
                                <div className={clsx("text-xs mb-1 truncate", !m.read ? "font-semibold text-slate-800" : "text-slate-600")}>{m.subject}</div>
                                <div className="text-[11px] text-slate-400 line-clamp-1">{m.preview}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mail Content */}
                <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden relative">
                    {!selectedMail ? (
                        <div className="flex items-center justify-center h-full text-slate-300 flex-col opacity-40">
                            <FaEnvelopeOpen className="text-5xl mb-4" />
                            <p className="text-sm font-medium">Wähle eine Nachricht aus</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full bg-white">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-800">{selectedMail.subject}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-5 h-5 rounded-md bg-brand-100 flex items-center justify-center text-[10px] text-brand-700 font-semibold uppercase">{selectedMail.from.charAt(0)}</div>
                                        <p className="text-xs text-slate-500">Von: <span className="text-slate-700 font-medium">{selectedMail.from}</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition"><FaReply className="text-sm" /></button>
                                    <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition"><FaPrint className="text-sm" /></button>
                                    <button onClick={() => deleteMutation.mutate(selectedMail.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition ml-2"><FaTrash className="text-sm" /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20">
                                <div className="max-w-3xl mx-auto space-y-6">
                                    {/* Thread Example */}
                                    <div className="flex gap-4 opacity-50 justify-end">
                                        <div className="flex flex-col items-end">
                                            <div className="text-xs bg-brand-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-md">
                                                Guten Tag Herr Mustermann, wir haben Ihre Anfrage erhalten und prüfen die Dateien.
                                            </div>
                                            <span className="text-[10px] mt-1 text-slate-400">Gestern, 09:15</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-md bg-brand-200 shrink-0 flex items-center justify-center text-[10px] text-brand-800 font-semibold">JD</div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-md bg-slate-200 shrink-0 flex items-center justify-center text-[10px] text-slate-600 font-semibold">{selectedMail.from.charAt(0)}</div>
                                        <div className="flex flex-col">
                                            <div className="text-xs bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm max-w-md text-slate-700 leading-relaxed">
                                                {selectedMail.preview} <br /><br />
                                                Vielen Dank für die schnelle Rückmeldung. Benötigen Sie noch weitere Informationen von unserer Seite bezüglich des Fachgebiets?
                                                <br /><br />
                                                Mit freundlichen Grüßen,<br />
                                                {selectedMail.from}
                                            </div>
                                            <span className="text-[10px] mt-1 text-slate-400">{selectedMail.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-white">
                                <div className="max-w-3xl mx-auto flex gap-3 p-1.5 border border-slate-200 rounded-xl focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all bg-slate-50/50">
                                    <button className="p-2 text-slate-400 hover:text-brand-600 transition self-end"><FaPaperclip className="text-sm" /></button>
                                    <textarea
                                        rows={1}
                                        placeholder={`Antworten an ${selectedMail.from}...`}
                                        className="flex-1 bg-transparent border-none outline-none text-xs py-2 px-1 min-h-[40px] max-h-32 resize-none"
                                    ></textarea>
                                    <button className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-md text-xs font-semibold self-end transition">Senden</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Compose Panel (Slide-In Sidebar) */}
                {isComposeOpen && !isComposeMinimized && (
                    <div className="absolute right-0 top-0 bottom-0 z-50 flex justify-end pointer-events-none">
                        <div className="relative w-[500px] h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col animate-fadeInRight border-l border-slate-200 z-10 pointer-events-auto">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <span className="font-semibold text-slate-800 text-sm">Neue Nachricht verfassen</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsComposeMinimized(true)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors" title="Minimieren">
                                        <span className="block w-3 h-0.5 bg-current"></span>
                                    </button>
                                    <button onClick={() => setIsComposeOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><FaTimes /></button>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Absender</label>
                                    <input value={composeFrom} onChange={(e) => setComposeFrom(e.target.value)} type="text" placeholder="Ihre Email oder Alias" className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-brand-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Empfänger (mit Komma trennen)</label>
                                    <input value={composeTo} onChange={(e) => setComposeTo(e.target.value)} type="text" placeholder="name@email.com, colleague@email.com" className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-brand-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">CC</label>
                                    <input value={composeCc} onChange={(e) => setComposeCc(e.target.value)} type="text" placeholder="copy@email.com" className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-brand-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Betreff</label>
                                    <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} type="text" placeholder="Worum geht es?" className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-brand-500 font-semibold" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nachricht</label>
                                    <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} className="w-full h-full min-h-[200px] py-2 text-sm outline-none resize-none border-none" placeholder="Schreibe deine Nachricht hier..."></textarea>
                                </div>

                                {composeAttachments.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {composeAttachments.map((file, i) => (
                                            <div key={i} className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs border border-slate-200">
                                                <FaPaperclip className="text-slate-400 shrink-0" />
                                                <span className="truncate max-w-[150px] font-medium text-slate-700">{file.original_name || file.name}</span>
                                                <button onClick={() => setComposeAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 ml-1"><FaTimes /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <button className="p-2 text-slate-400 hover:text-brand-600 transition flex items-center gap-2">
                                    <FaPaperclip /> <span className="text-xs">Anhang hinzufügen</span>
                                </button>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsComposeMinimized(true)} className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium">Als Entwurf</button>
                                    <button onClick={handleSendMail} disabled={sendMutation.isPending} className="bg-brand-700 hover:bg-brand-800 text-white px-6 py-2 rounded-md text-sm font-semibold shadow-sm transition active:scale-95 disabled:opacity-50">
                                        {sendMutation.isPending ? 'Sende...' : 'Nachricht senden'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inbox;
