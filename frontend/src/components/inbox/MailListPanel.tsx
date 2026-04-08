import clsx from 'clsx';
import { FaPaperclip, FaTrashAlt, FaSyncAlt } from 'react-icons/fa';
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
    onSync: () => void;
    isSyncing: boolean;
}

const MailListPanel = ({
    mails,
    folder,
    onView,
    onDelete,
    selectedId,
    selectedMails,
    onSelectMail,
    onSelectAll,
    onSync,
    isSyncing
}: MailListPanelProps) => (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
        {/* Modernized Header */}
        <div className="px-3 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10 shrink-0 h-[60px]">
            <div className="flex items-center gap-3">
                {/* Aligned Bulk Checkbox */}
                <div className="shrink-0">
                    <Checkbox
                        checked={selectedMails.length === mails.length && mails.length > 0}
                        onChange={onSelectAll}
                    />
                </div>
                <div className="h-4 w-[1px] bg-slate-200" />
                <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-tight">
                    {folder === 'inbox' ? 'Posteingang' :
                        folder === 'sent' ? 'Gesendet' :
                            folder === 'trash' ? 'Papierkorb' :
                                folder === 'archive' ? 'Archiv' :
                                    folder === 'templates' ? 'Vorlagen' :
                                        folder === 'accounts' ? 'E-Mail Konten' :
                                            'Entwürfe'}
                </h3>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onSync}
                    disabled={isSyncing}
                    className="p-2 text-slate-400 hover:text-brand-primary transition-colors disabled:opacity-50"
                    title="Aktualisieren"
                >
                    <FaSyncAlt className={clsx("text-sm", isSyncing && "animate-spin")} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-auto divide-y divide-slate-100 custom-scrollbar-minimal">
            {mails.length === 0 ? (
                <div className="px-4 py-12 flex flex-col items-center justify-center gap-3 text-slate-400 opacity-60">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-xl">
                        {folder === 'inbox' ? '📥' : '✉️'}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center">
                        Keine E-Mails vorhanden
                    </p>
                </div>
            ) : (
                mails.map((mail: any) => {
                    const senderLabel = folder === 'inbox' ? mail.from : mail.to_emails?.join(', ');
                    const initial = (senderLabel || mail.subject || '?').charAt(0).toUpperCase();

                    return (
                        <div
                            key={mail.id}
                            onClick={() => onView(mail)}
                            className={clsx(
                                'px-3 py-3 hover:bg-slate-50 transition-colors cursor-pointer relative group',
                                !mail.read && folder === 'inbox' ? 'bg-slate-50/50' : '',
                                selectedId === mail.id ? 'bg-slate-100/80' : '',
                            )}
                        >
                            {selectedId === mail.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-primary" />
                            )}
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="pt-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedMails.includes(mail.id)}
                                        onChange={() => onSelectMail(mail.id)}
                                    />
                                </div>
                                <div className="w-8 h-8 rounded-sm bg-brand-primary text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                    {initial}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={clsx(
                                                'text-xs truncate',
                                                !mail.read && folder === 'inbox'
                                                    ? 'font-bold text-slate-900'
                                                    : 'font-medium text-slate-600',
                                            )}
                                        >
                                            {senderLabel}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0">
                                            {mail.full_time?.split(',')[0]}
                                        </span>
                                    </div>
                                    <h4
                                        className={clsx(
                                            'text-[11px] leading-snug line-clamp-2',
                                            !mail.read && folder === 'inbox'
                                                ? 'font-bold text-slate-900 border-l-[3px] border-brand-primary/10 pl-2 -ml-[11px]'
                                                : 'font-medium text-slate-700',
                                        )}
                                    >
                                        {mail.subject || '(Kein Betreff)'}
                                    </h4>
                                    <p className="text-xs text-slate-400 truncate font-medium">
                                        {mail.preview || mail.body?.replace(/<[^>]*>/g, '').substring(0, 100)}
                                    </p>

                                    <div className="flex items-center justify-between mt-0.5 h-4">
                                        <div className="flex gap-1">
                                            {mail.attachments?.length > 0 && (
                                                <FaPaperclip size={8} className="text-slate-300" />
                                            )}
                                            {!mail.read && folder === 'inbox' && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 self-center" />
                                            )}
                                        </div>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                onDelete(mail.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all rounded-sm"
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
