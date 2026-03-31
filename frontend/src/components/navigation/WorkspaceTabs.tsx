import React from 'react';
import { useWorkspaceTabs } from '../../context/WorkspaceTabsContext';
import clsx from 'clsx';
import { X, Layout, Plus, FileText, User, Users, Settings as SettingsIcon, FilePlus } from 'lucide-react';

const WorkspaceTabs: React.FC = () => {
    const { tabs, activeTabId, closeTab, setActiveTab } = useWorkspaceTabs();

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
        <div className="bg-white h-8 flex items-end px-1 overflow-x-auto no-scrollbar scroll-smooth z-20 sticky top-0">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                        "group flex items-center gap-2 h-8 px-3 rounded-t-sm cursor-pointer transition-all border-b-2 select-none text-[12px] font-medium min-w-[120px] max-w-[200px]",
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
    );
};

export default WorkspaceTabs;
