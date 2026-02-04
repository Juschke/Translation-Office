import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';

const AppLayout = () => {
    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans text-slate-700">
            <Navigation />

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
