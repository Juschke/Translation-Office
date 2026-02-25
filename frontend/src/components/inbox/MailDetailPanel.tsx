import DOMPurify from 'dompurify';
import { FaTimes, FaReply, FaForward, FaTrashAlt, FaPaperclip, FaFileAlt } from 'react-icons/fa';
import { ScrollArea, Separator } from '../ui';

interface MailDetailPanelProps {
    mail: any;
    onClose: () => void;
    onReply: (mail: any) => void;
    onForward: (mail: any) => void;
    onDelete: (id: any) => void;
}

const MailDetailPanel = ({ mail, onClose, onReply, onForward, onDelete }: MailDetailPanelProps) => {
    if (!mail) return null;

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header / Toolbar */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-1">
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 transition"
                    >
                        <FaTimes size={16} />
                    </button>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onReply(mail)}
                            className="h-8 px-3 text-[10px] font-semibold rounded-[3px] border border-[#ccc] bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_1px_rgba(0,0,0,0.08)] hover:border-[#adadad] hover:text-[#1B4D4F] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.1)] transition flex items-center gap-1.5 uppercase tracking-tight"
                        >
                            <FaReply size={10} /> Antworten
                        </button>
                        <button
                            onClick={() => onForward(mail)}
                            className="h-8 px-3 text-[10px] font-semibold rounded-[3px] border border-[#ccc] bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_1px_rgba(0,0,0,0.08)] hover:border-[#adadad] hover:text-[#1B4D4F] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.1)] transition flex items-center gap-1.5 uppercase tracking-tight"
                        >
                            <FaForward size={10} /> Weiterleiten
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onDelete(mail.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition rounded-sm"
                        title="Löschen"
                    >
                        <FaTrashAlt size={14} />
                    </button>
                    <div className="hidden md:block w-[1px] h-4 bg-slate-100 mx-2" />
                    <button
                        onClick={onClose}
                        className="hidden md:block p-2 text-slate-300 hover:text-slate-900 transition rounded-sm"
                        title="Schließen"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>
            </div>

            <ScrollArea className="flex-1 bg-white">
                <div className="p-8 md:p-10 max-w-5xl">
                    {/* Subject & Info */}
                    <div className="mb-10">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight mb-6">
                            {mail.subject || '(Kein Betreff)'}
                        </h2>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-sm bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-1 shadow-sm border border-[#123a3c]">
                                {mail.from.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900 truncate">{mail.from}</span>
                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest hidden sm:inline">
                                            VON
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tight uppercase">
                                        {mail.full_time}
                                    </span>
                                </div>
                                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
                                    <span className="uppercase tracking-widest text-[9px] opacity-70">AN</span>
                                    <span className="truncate">
                                        {mail.to_emails?.join(', ') || mail.target_email || 'Empfänger unbekannt'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-slate-100 my-8 opacity-50" />

                    {/* Body */}
                    <div className="email-body-container">
                        <div
                            className="email-body-content text-slate-800 text-[14px] leading-[1.8] prose prose-slate max-w-none font-medium selection:bg-slate-900 selection:text-white"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mail.body ?? '') }}
                        />
                    </div>

                    {/* Attachments */}
                    {mail.attachments && mail.attachments.length > 0 && (
                        <div className="mt-16 pt-10 border-t border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-900 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                <FaPaperclip className="text-slate-400" /> ANHÄNGE ({mail.attachments.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {mail.attachments.map((at: any, i: number) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4 px-4 py-4 bg-slate-50 border border-slate-100 rounded-sm group hover:border-slate-900 hover:bg-white transition-all cursor-default shadow-sm hover:shadow-md"
                                    >
                                        <div className="w-10 h-10 rounded bg-white flex items-center justify-center border border-slate-200 shrink-0 group-hover:border-slate-900 transition-colors">
                                            <FaFileAlt className="text-slate-400 text-sm group-hover:text-slate-900" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors mb-0.5">
                                                {at.name}
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-black tracking-widest uppercase">
                                                {(at.size / 1024).toFixed(0)} KB
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default MailDetailPanel;
