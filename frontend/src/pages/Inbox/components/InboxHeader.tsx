import { FaPlus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

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
                <h1 className="text-xl font-semibold text-slate-800 truncate">E-Mail</h1>
                <p className="text-slate-400 text-xs font-medium hidden sm:block">Zentrale Verwaltung</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onSync}
                    disabled={isSyncing}
                >
                    <span className="hidden xs:inline">{isSyncing ? 'Synchronisiert...' : 'E-Mails abrufen'}</span>
                    <span className="xs:hidden">{isSyncing ? t('inbox.sync_syncing') : t('inbox.sync_fetch')}</span>
                </Button>
                <Button
                    variant="default"
                    size="sm"
                    onClick={onCompose}
                >
                    <FaPlus /> <span className="hidden xs:inline">E-Mail schreiben</span><span className="xs:hidden">E-Mail</span>
                </Button>
            </div>
        </div>
    );
};

export default InboxHeader;
