import React from 'react';
import { useWorkspaceTabs } from '../../context/WorkspaceTabsContext';
import clsx from 'clsx';
import { X, Layout, Plus, FileText, User, Users, Settings as SettingsIcon, FilePlus, MoreVertical } from 'lucide-react';

const WorkspaceTabs: React.FC = () => {
    const { tabs, activeTabId, closeTab, closeAllTabs, closeOtherTabs, setActiveTab } = useWorkspaceTabs();
    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (tabs.length === 0) return null;

    const getIcon = (type?: string) => {
        switch (type) {
            case 'project_new': return <FilePlus className="w-3.5 h-3.5" />;
            case 'project_detail': return <Layout className="w-3.5 h-3.5" />;
            case 'customer_detail': return <User className="w-3.5 h-3.5" />;
            case 'partner_detail': return <Users className="w-3.5 h-3.5" />;
            case 'invoice': return <FileText className="w-3.5 h-3.5" />;
            case 'settings': return <SettingsIcon className="w-3.5 h-3.5" />;
            default: return <Plus className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="bg-white border-b border-slate-100 z-[40] sticky top-0 h-10 flex items-center px-4 sm:px-6 lg:px-16 gap-6">
            <div className="flex-1 flex items-end h-full overflow-x-auto no-scrollbar scroll-smooth">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "group flex items-center gap-2 h-8 px-3 rounded-t-sm cursor-pointer transition-all border-b-2 select-none text-[12px] font-medium min-w-[120px] max-w-[200px] shrink-0",
                            activeTabId === tab.id
                                ? "bg-slate-50 text-brand-primary border-brand-primary"
                                : "bg-transparent text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700"
                        )}
                        title={tab.label}
                    >
                        <span className={clsx(
                            "flex-shrink-0 transition-colors",
                            activeTabId === tab.id ? "text-brand-primary" : "text-slate-400 group-hover:text-slate-500"
                        )}>
                            {getIcon(tab.type)}
                        </span>

                        <span className="truncate flex-1">
                            {tab.label}
                        </span>



                        {tab.closable !== false && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeTab(tab.id);
                                }}
                                className={clsx(
                                    "flex-shrink-0 p-0.5 rounded-full transition-all",
                                    activeTabId === tab.id
                                        ? "hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                                        : "hover:bg-slate-200 text-transparent group-hover:text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Global Actions Menu */}
            <div className="relative shrink-0 flex items-center mb-0.5" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={clsx(
                        "p-1.5 rounded-sm transition-colors",
                        menuOpen ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <MoreVertical className="w-4 h-4" />
                </button>

                {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 shadow-xl rounded-sm py-1 z-[60] animate-fadeIn">
                        <button
                            onClick={() => { closeAllTabs(); setMenuOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors flex items-center justify-between uppercase tracking-wider"
                        >
                            <span>Alle schließen</span>
                            <X className="w-3 h-3 opacity-50" />
                        </button>

                        {activeTabId && tabs.length > 1 && (
                            <button
                                onClick={() => { closeOtherTabs(activeTabId); setMenuOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between uppercase tracking-wider"
                            >
                                <span>Andere schließen</span>
                                <div className="flex gap-0.5 opacity-40">
                                    <X className="w-2.5 h-2.5" />
                                    <X className="w-2.5 h-2.5" />
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspaceTabs;
