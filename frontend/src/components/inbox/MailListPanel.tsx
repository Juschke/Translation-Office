import { cn } from '@/lib/utils';
import { FaPaperclip, FaTrashAlt } from 'react-icons/fa';
import Checkbox from '../common/Checkbox';

interface MailListPanelProps {
    mails: any[];
    folder: string;
    onView: (mail: any) => void;
    onDelete: (id: number) => void;
    selectedId?: number;
    selectedMails: number[];
    onSelectMail: (id: number) => void;
    onSelectAll: () => void;
}

const MailListPanel = ({ mails, folder, onView, onDelete, selectedId, selectedMails, onSelectMail, onSelectAll }: MailListPanelProps) => (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
        {mails.length > 0 && (
            <div className="px-3 py-2 border-b border-slate-100 flex items-center bg-slate-50 shrink-0">
                <Checkbox
                    checked={selectedMails.length === mails.length && mails.length > 0}
                    onChange={onSelectAll}
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase ml-2">Alle auswählen</span>
            </div>
        )}
        <div className="flex-1 overflow-auto divide-y divide-slate-100 custom-scrollbar-minimal">
            {mails.length === 0 ? (
                <p className="px-4 py-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                    Keine E-Mails vorhanden
                </p>
            ) : (
                mails.map((mail: any) => {
                    const senderLabel = folder === 'inbox' ? mail.from : mail.to_emails?.join(', ');
                    const initial = (senderLabel || mail.subject || '?').charAt(0).toUpperCase();

                    return (
                        <div
                            key={mail.id}
                            onClick={() => onView(mail)}
                            className={cn(
                                'px-3 py-3 hover:bg-slate-50 transition-colors cursor-pointer relative group border-b border-slate-50',
                                !mail.read && folder === 'inbox' ? 'bg-brand-50/30' : '',
                                selectedId === mail.id ? 'bg-slate-100/80 ring-1 ring-inset ring-slate-200' : '',
                            )}
                        >
                            {selectedId === mail.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-600" />
                            )}
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="pt-2 shrink-0" onClick={e => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedMails.includes(mail.id)}
                                        onChange={() => onSelectMail(mail.id)}
                                    />
                                </div>
                                <div className="w-8 h-8 rounded-sm bg-brand-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                                    {initial}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={cn(
                                                'text-xs truncate',
                                                !mail.read && folder === 'inbox'
                                                    ? 'font-bold text-slate-900'
                                                    : 'font-medium text-slate-500',
                                            )}
                                        >
                                            {senderLabel}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight shrink-0">
                                            {mail.full_time?.split(',')[0]}
                                        </span>
                                    </div>
                                    <h4
                                        className={cn(
                                            'text-[11px] leading-snug line-clamp-2',
                                            !mail.read && folder === 'inbox'
                                                ? 'font-bold text-slate-900'
                                                : 'font-medium text-slate-700',
                                        )}
                                    >
                                        {mail.subject || '(Kein Betreff)'}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 truncate font-medium">
                                        {mail.preview || mail.body?.replace(/<[^>]*>/g, '').substring(0, 100)}
                                    </p>

                                    <div className="flex items-center justify-between mt-0.5 h-4">
                                        <div className="flex gap-1">
                                            {mail.attachments?.length > 0 && (
                                                <FaPaperclip size={8} className="text-slate-300" />
                                            )}
                                            {!mail.read && folder === 'inbox' && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-600 self-center shadow-[0_0_8px_rgba(13,148,136,0.4)]" />
                                            )}
                                        </div>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                onDelete(mail.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all rounded"
                                        >
                                            <FaTrashAlt size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
);

export default MailListPanel;
