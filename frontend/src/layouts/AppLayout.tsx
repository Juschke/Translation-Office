import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';
import WorkspaceTabs from '../components/navigation/WorkspaceTabs';
import { WorkspaceTabsProvider } from '../context/WorkspaceTabsContext';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { settingsService, customerService, partnerService } from '../api/services';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import KeyboardShortcutsOverlay from '../components/common/KeyboardShortcutsOverlay';

const AppLayout = () => {
    const isFetching = useIsFetching();
    const queryClient = useQueryClient();
    const [shortcutsOpen, setShortcutsOpen] = useState(false);

    useKeyboardShortcuts({ onShowHelp: () => setShortcutsOpen(true) });

    // Statische Stammdaten und häufig genutzte Listen beim ersten Mount prefetchen,
    // damit Modals und Seiten sofort aus dem Cache lesen können.
    useEffect(() => {
        const staticPrefetches = [
            { queryKey: ['settings', 'languages'], queryFn: settingsService.getLanguages },
            { queryKey: ['settings', 'docTypes'], queryFn: settingsService.getDocTypes },
            { queryKey: ['settings', 'services'], queryFn: settingsService.getServices },
            { queryKey: ['settings', 'specializations'], queryFn: settingsService.getSpecializations },
            { queryKey: ['settings', 'units'], queryFn: settingsService.getUnits },
            { queryKey: ['settings', 'currencies'], queryFn: settingsService.getCurrencies },
            { queryKey: ['settings', 'projectStatuses'], queryFn: settingsService.getProjectStatuses },
            { queryKey: ['companySettings'], queryFn: settingsService.getCompany },
            { queryKey: ['customers'], queryFn: customerService.getAll },
            { queryKey: ['partners'], queryFn: partnerService.getAll },
        ];

        staticPrefetches.forEach(({ queryKey, queryFn }) => {
            queryClient.prefetchQuery({ queryKey, queryFn });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <WorkspaceTabsProvider>
            <div className="h-screen flex flex-col bg-brand-bg overflow-hidden font-sans text-brand-text">
                <Navigation />
                <WorkspaceTabs />

                {/* Global Loading Indicator */}
                <div className={clsx(
                    "fixed bottom-6 right-6 bg-white pl-3 pr-4 py-2 border border-slate-200 z-50 transition-all duration-300 flex items-center gap-3 pointer-events-none rounded-sm",
                    isFetching > 0 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                )}>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-200 border-t-slate-900"></div>
                    <span className="text-xs text-slate-500">Daten werden aktualisiert...</span>
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-16 pb-6 md:pb-8 pt-1 md:pt-2">
                        <Outlet />
                    </div>
                </main>

                <KeyboardShortcutsOverlay
                    open={shortcutsOpen}
                    onClose={() => setShortcutsOpen(false)}
                />
            </div>
        </WorkspaceTabsProvider>
    );
};

export default AppLayout;
