import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { FaTimes, FaReply, FaForward, FaTrashAlt, FaPaperclip, FaFileAlt, FaEdit } from 'react-icons/fa';
import { ScrollArea, Button } from '../ui';

interface MailDetailPanelProps {
    mail: any;
    isDraft?: boolean;
    onClose: () => void;
    onDelete: (id: any) => void;
}

const MailDetailPanel = ({ mail, isDraft, onClose, onDelete }: MailDetailPanelProps) => {
    const { } = useTranslation();
    if (!mail) return null;

    const handleAction = (type: 'reply' | 'forward' | 'edit') => {
        const sid = `compose_${Date.now()}`;
        const data: any = {
            subject: type === 'reply' ? `Re: ${mail.subject}` : (type === 'forward' ? `Fwd: ${mail.subject}` : mail.subject),
            to: type === 'reply' ? mail.from : (type === 'edit' ? (mail.target_email || mail.to_emails?.[0] || '') : ''),
            body: type === 'edit' ? mail.body : `\n\n--- Ursprüngliche Nachricht ---\nVon: ${mail.from}\nGesendet: ${mail.full_time}\nAn: ${mail.to_emails?.join(', ') || mail.target_email}\nBetreff: ${mail.subject}\n\n${mail.body}`,
            projectId: mail.project_id
        };

        if (type === 'edit') {
            data.draftId = mail.id;
        }

        // Attachments only for forward or edit
        if ((type === 'forward' || type === 'edit') && mail.attachments) {
            data.attachments = mail.attachments;
        }

        localStorage.setItem(sid, JSON.stringify(data));
        window.open(`/email/send?sid=${sid}`, `compose_${sid}`, 'width=1250,height=850,scrollbars=yes');
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header / Toolbar */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10 shrink-0 h-[60px]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 transition"
                    >
                        <FaTimes size={16} />
                    </button>
                    <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-0">
                        {isDraft ? (
                            <Button
                                onClick={() => handleAction('edit')}
                                className="h-8 px-4 text-[10px] font-bold rounded-[3px] border border-[#123a3c] bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white hover:from-[#2a7073] hover:to-[#235e62] active:shadow-inner transition flex items-center gap-1.5 uppercase tracking-tight shadow-md"
                            >
                                <FaEdit size={9} /> Bearbeiten
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleAction('reply')}
                                    className="h-8 px-3 text-[10px] font-bold rounded-[3px] border border-[#ccc] bg-gradient-to-b from-white to-[#f5f5f5] text-slate-600 hover:border-[#adadad] hover:text-slate-900 active:bg-slate-100 transition flex items-center gap-1.5 uppercase tracking-tight shadow-sm"
                                >
                                    <FaReply size={9} /> Antworten
                                </Button>
                                <Button
                                    onClick={() => handleAction('forward')}
                                    className="h-8 px-4 text-[10px] font-bold rounded-[3px] border border-[#123a3c] bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white hover:from-[#2a7073] hover:to-[#235e62] active:shadow-inner transition flex items-center gap-1.5 uppercase tracking-tight shadow-md"
                                >
                                    <FaForward size={9} /> Weiterleiten
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => onDelete(mail.id)}
                        className="h-8 px-3 text-[10px] font-bold rounded-[3px] border border-[#ccc] bg-gradient-to-b text-slate-600  hover:text-red-600 transition flex items-center gap-1.5 uppercase tracking-tight shadow-sm"
                    >
                        <FaTrashAlt size={9} /> Löschen
                    </Button>
                    <div className="hidden md:block w-[1px] h-4 bg-slate-200 mx-1" />
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-8 px-3 text-[10px] font-bold rounded-[3px] border border-[#ccc] bg-gradient-to-b from-white to-[#f5f5f5] text-slate-600 hover:border-[#adadad] hover:text-slate-900 hover:bg-slate-50 transition flex items-center gap-1.5 uppercase tracking-tight shadow-sm"
                    >
                        Schließen <FaTimes size={9} />
                    </Button>
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
                            <div className="w-10 h-10 rounded-sm bg-brand-amary text-white flex items-center justify-center font-bold text-sm shrink-0 mt-1">
                                {mail.from?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-medium uppercase tracking-widest hidden sm:inline">
                                            VON
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 truncate">{mail.from}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tight uppercase">
                                        {mail.full_time}
                                    </span>
                                </div>
                                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
                                    <span className="uppercase tracking-widest text-xs opacity-70">AN</span>
                                    <span className="truncate">
                                        {mail.to_emails?.join(', ') || mail.target_email || 'Empfänger unbekannt'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>


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
                            <h4 className="text-xs font-bold text-slate-900 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                <FaPaperclip className="text-slate-400" /> ANHÄNGE ({mail.attachments.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {mail.attachments.map((at: any, i: number) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4 px-4 py-4 bg-slate-50 border border-slate-100 rounded-sm group hover:border-slate-900 hover:bg-white transition-all cursor-default shadow-sm hover:shadow-md"
                                    >
                                        <div className="w-10 h-10 rounded-sm bg-white flex items-center justify-center border border-slate-200 shrink-0 group-hover:border-slate-900 transition-colors">
                                            <FaFileAlt className="text-slate-400 text-sm group-hover:text-slate-900" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors mb-0.5">
                                                {at.name}
                                            </div>
                                            <div className="text-xs text-slate-400 font-bold tracking-widest uppercase">
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
