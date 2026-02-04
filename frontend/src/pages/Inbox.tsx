import { useState } from 'react';
import { FaInbox, FaPaperPlane, FaTrash, FaSearch, FaEnvelopeOpen, FaTimes, FaReply, FaPrint, FaPaperclip, FaPlus } from 'react-icons/fa';
import clsx from 'clsx';

const Inbox = () => {
    const [activeFolder, setActiveFolder] = useState('inbox');
    const [selectedMail, setSelectedMail] = useState<any>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    // Mock Messages
    const messages = [
        { id: 1, from: 'Max Mustermann', subject: 'Anfrage Übersetzung DE-EN', time: '10:30', preview: 'Hallo, können Sie bitte...', read: false, folder: 'inbox' },
        { id: 2, from: 'Kanzlei Recht', subject: 'Re: Rückfrage Vertrag', time: 'Gestern', preview: 'Das passt so, bitte fortfahren.', read: true, folder: 'inbox' },
        { id: 3, from: 'TechCorp Support', subject: 'Glossar Update', time: 'Gestern', preview: 'Hier ist das neue Glossar...', read: true, folder: 'inbox' }
    ];

    const handleSelectMail = (mail: any) => {
        setSelectedMail(mail);
    };

    return (
        <div className="flex flex-col h-full gap-6 fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Nachrichten & E-Mail</h1>
                    <p className="text-slate-500 text-sm">Zentrale Kommunikation mit Kunden und Partnern.</p>
                </div>
                <button
                    onClick={() => setIsComposeOpen(true)}
                    className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
                >
                    <FaPlus className="text-xs" /> Neue Nachricht
                </button>
            </div>

            <div className="flex-1 flex bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden relative">
                {/* Sidebar */}
                <div className="w-60 bg-slate-50 border-r border-slate-200 flex flex-col">
                    <nav className="flex-1 p-3 space-y-1">
                        <button
                            onClick={() => setActiveFolder('inbox')}
                            className={clsx(
                                "w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors",
                                activeFolder === 'inbox' ? 'bg-white shadow-sm border border-slate-200 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-200/50'
                            )}
                        >
                            <span className="flex items-center gap-3"><FaInbox className={activeFolder === 'inbox' ? 'text-brand-600' : 'text-slate-400'} /> Posteingang</span>
                            <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold", activeFolder === 'inbox' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500')}>3</span>
                        </button>
                        <button
                            onClick={() => setActiveFolder('sent')}
                            className={clsx(
                                "w-full flex items-center px-3 py-2 rounded text-sm transition-colors",
                                activeFolder === 'sent' ? 'bg-white shadow-sm border border-slate-200 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-200/50'
                            )}
                        >
                            <FaPaperPlane className={clsx("mr-3", activeFolder === 'sent' ? 'text-brand-600' : 'text-slate-400')} /> Gesendet
                        </button>
                        <button
                            onClick={() => setActiveFolder('trash')}
                            className={clsx(
                                "w-full flex items-center px-3 py-2 rounded text-sm transition-colors",
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
                                className="w-full pl-8 pr-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-brand-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {messages.map(m => (
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
                                    <span className={clsx("text-xs truncate mr-2", !m.read ? "font-bold text-slate-900" : "text-slate-600")}>{m.from}</span>
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
                                    <h2 className="text-base font-bold text-slate-800">{selectedMail.subject}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[10px] text-brand-700 font-bold uppercase">{selectedMail.from.charAt(0)}</div>
                                        <p className="text-xs text-slate-500">Von: <span className="text-slate-700 font-medium">{selectedMail.from}</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded transition"><FaReply className="text-sm" /></button>
                                    <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded transition"><FaPrint className="text-sm" /></button>
                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition ml-2"><FaTrash className="text-sm" /></button>
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
                                        <div className="w-8 h-8 rounded-full bg-brand-200 shrink-0 flex items-center justify-center text-[10px] text-brand-800 font-bold">JD</div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-[10px] text-slate-600 font-bold">{selectedMail.from.charAt(0)}</div>
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
                                    <button className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-lg text-xs font-semibold self-end transition">Senden</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Compose Panel (Slide-In) */}
                {isComposeOpen && (
                    <div className="absolute inset-0 z-50 flex justify-end">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsComposeOpen(false)}></div>
                        <div className="relative w-[500px] h-full bg-white shadow-2xl flex flex-col animate-fadeInRight">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <span className="font-bold text-slate-800 text-sm">Neue Nachricht verfassen</span>
                                <button onClick={() => setIsComposeOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><FaTimes /></button>
                            </div>
                            <div className="p-6 flex-1 flex flex-col space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Empfänger</label>
                                    <input type="text" placeholder="name@email.com" className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-brand-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Betreff</label>
                                    <input type="text" placeholder="Worum geht es?" className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-brand-500 font-semibold" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nachricht</label>
                                    <textarea className="w-full h-full py-2 text-sm outline-none resize-none border-none" placeholder="Schreibe deine Nachricht hier..."></textarea>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <button className="p-2 text-slate-400 hover:text-brand-600 transition"><FaPaperclip className="mr-2" /> <span className="text-xs">Anhang</span></button>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsComposeOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium">Abbrechen</button>
                                    <button className="bg-brand-700 hover:bg-brand-800 text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-sm transition active:scale-95">Nachricht senden</button>
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
