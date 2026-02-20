import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useIsFetching } from '@tanstack/react-query';
import clsx from 'clsx';

const AppLayout = () => {
    const isFetching = useIsFetching();

    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden font-sans text-slate-900">
            <Navigation />

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
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-16 py-6 md:py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
