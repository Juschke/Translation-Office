import { FaFolderOpen, FaPaperPlane, FaTrashAlt, FaFileAlt, FaUserCircle } from 'react-icons/fa';
import MailTabButton from '../../../components/inbox/MailTabButton';
import { TooltipProvider } from '../../../components/ui/tooltip';

interface InboxSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const InboxSidebar = ({ activeTab, setActiveTab }: InboxSidebarProps) => {
    return (
        <div className="w-16 md:w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <nav className="flex-1 flex flex-col p-2 space-y-4">
                <TooltipProvider delayDuration={0}>
                    <div className="space-y-1">
                        <div className="px-3 text-2xs font-bold text-slate-400 uppercase tracking-widest mb-2 hidden md:block">
                            E-Mails
                        </div>
                        <MailTabButton
                            active={activeTab === 'inbox'}
                            onClick={() => setActiveTab('inbox')}
                            icon={<FaFolderOpen />}
                            label="Posteingang"
                        />
                        <MailTabButton
                            active={activeTab === 'sent'}
                            onClick={() => setActiveTab('sent')}
                            icon={<FaPaperPlane />}
                            label="Gesendet"
                        />
                        <MailTabButton
                            active={activeTab === 'archive'}
                            onClick={() => setActiveTab('archive')}
                            icon={<FaFolderOpen className="" />}
                            label="Archiv"
                        />
                        <MailTabButton
                            active={activeTab === 'trash'}
                            onClick={() => setActiveTab('trash')}
                            icon={<FaTrashAlt />}
                            label="Papierkorb"
                        />
                    </div>

                    <div className="space-y-1 mt-auto!">
                        <div className="px-3 text-2xs font-bold text-slate-400 uppercase tracking-widest mb-2 hidden md:block">
                            Verwaltung
                        </div>
                        <MailTabButton
                            active={activeTab === 'templates'}
                            onClick={() => setActiveTab('templates')}
                            icon={<FaFileAlt />}
                            label="Vorlagen"
                        />
                        <MailTabButton
                            active={activeTab === 'accounts'}
                            onClick={() => setActiveTab('accounts')}
                            icon={<FaUserCircle />}
                            label="Konten"
                        />
                    </div>
                </TooltipProvider>
            </nav>
        </div>
    );
};

export default InboxSidebar;
