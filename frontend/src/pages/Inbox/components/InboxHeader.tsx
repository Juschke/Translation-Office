import { FaPlus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface InboxHeaderProps {
    onSync: () => void;
    isSyncing: boolean;
    onCompose: () => void;
}

const InboxHeader = ({ onSync, isSyncing, onCompose }: InboxHeaderProps) => {
    const { t } = useTranslation();

    return (
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200 gap-4">
            <div className="min-w-0">
                <h1 className="text-xl font-semibold text-slate-800 truncate">Email Management</h1>
                <p className="text-slate-400 text-xs font-medium hidden sm:block">Zentrale Verwaltung</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={onSync}
                    disabled={isSyncing}
                    className="px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-[3px] border border-[#ccc] bg-gradient-to-b from-white to-[#ebebeb] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_1px_rgba(0,0,0,0.08)] hover:border-[#adadad] hover:text-[#1B4D4F] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.1)] transition disabled:opacity-50 flex items-center gap-2"
                >
                    <span className="hidden xs:inline">{isSyncing ? 'Synchronisiert...' : 'E-Mails abrufen'}</span>
                    <span className="xs:hidden">{isSyncing ? t('inbox.sync_syncing') : t('inbox.sync_fetch')}</span>
                </button>
                <button
                    onClick={onCompose}
                    className="px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-[3px] border border-[#123a3c] bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_1px_rgba(0,0,0,0.12)] [text-shadow:0_-1px_0_rgba(0,0,0,0.2)] hover:from-[#2a7073] hover:to-[#235e62] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] transition flex items-center gap-2"
                >
                    <FaPlus className="text-[10px]" /> <span className="hidden xs:inline">E-Mail schreiben</span><span className="xs:hidden">E-Mail</span>
                </button>
            </div>
        </div>
    );
};

export default InboxHeader;
