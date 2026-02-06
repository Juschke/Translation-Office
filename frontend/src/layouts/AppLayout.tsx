import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useIsFetching } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import clsx from 'clsx';
import { FaExclamationTriangle, FaPaperPlane, FaCheck, FaTimes } from 'react-icons/fa';

const AppLayout = () => {
    const isFetching = useIsFetching();
    const { user } = useAuth();
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [isBannerVisible, setIsBannerVisible] = useState(true);

    const handleResendVerification = async () => {
        if (resendStatus === 'sending' || resendStatus === 'sent') return;
        setResendStatus('sending');
        try {
            await api.post('/email/resend');
            setResendStatus('sent');
            setTimeout(() => setResendStatus('idle'), 10000);
        } catch (error) {
            console.error(error);
            setResendStatus('error');
            setTimeout(() => setResendStatus('idle'), 5000);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans text-slate-700">
            <Navigation />

            {/* Email Verification Banner */}
            {user && !user.email_verified_at && isBannerVisible && (
                <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-center gap-4 text-xs font-medium text-amber-800 relative group">
                    <div className="flex items-center gap-2">
                        <FaExclamationTriangle className="text-amber-500" />
                        <span>Ihre E-Mail Adresse ist noch nicht bestätigt. Bitte prüfen Sie Ihren Posteingang.</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleResendVerification}
                            disabled={resendStatus !== 'idle'}
                            className="px-2 py-1 bg-white border border-amber-200 text-[10px] font-semibold uppercase tracking-wider hover:bg-amber-100 transition-colors flex items-center gap-2 rounded-md"
                        >
                            {resendStatus === 'sending' && "Sende..."}
                            {resendStatus === 'sent' && <><FaCheck className="text-emerald-500" /> Gesendet</>}
                            {resendStatus === 'error' && "Fehler beim Senden"}
                            {resendStatus === 'idle' && <><FaPaperPlane /> Link erneut senden</>}
                        </button>
                        {resendStatus === 'sent' && <span className="text-[10px] text-emerald-600 font-semibold">E-Mail wurde versendet!</span>}
                    </div>

                    <button
                        onClick={() => setIsBannerVisible(false)}
                        className="absolute right-4 p-1 hover:bg-amber-100 text-amber-600 transition-colors rounded-md"
                        title="Schließen"
                    >
                        <FaTimes className="text-[10px]" />
                    </button>
                </div>
            )}

            {/* Global Loading Indicator */}
            <div className={clsx(
                "fixed bottom-6 right-6 bg-white pl-3 pr-4 py-2 shadow-lg border border-slate-200 z-50 transition-all duration-300 flex items-center gap-3 pointer-events-none rounded-md",
                isFetching > 0 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            )}>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-brand-600"></div>
                <span className="text-xs font-semibold text-slate-600">Daten werden aktualisiert...</span>
            </div>

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
