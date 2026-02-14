import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifiziere E-Mail...');

    useEffect(() => {
        const verify = async () => {
            const id = searchParams.get('id');
            const hash = searchParams.get('hash');
            const expires = searchParams.get('expires');
            const signature = searchParams.get('signature');

            if (!id || !hash || !expires || !signature) {
                setStatus('error');
                setMessage('Ungültiger Verifizierungslink.');
                return;
            }

            try {
                // Construct the URL exactly as the backend expects it
                // Logic: Backend route is /email/verify/{id}/{hash}?expires=...&signature=...
                const url = `/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`;

                await api.get(url);
                setStatus('success');
                setMessage('Ihre E-Mail wurde erfolgreich verifiziert!');

                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verifizierung fehlgeschlagen.');
            }
        };

        verify();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <FaSpinner className="text-4xl text-brand-600 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Verifizierung läuft...</h2>
                        <p className="text-slate-500 mt-2">Bitte warten Sie einen Moment.</p>
                    </div>
                )}
                {status === 'success' && (
                    <div className="flex flex-col items-center animate-fadeIn">
                        <FaCheckCircle className="text-5xl text-emerald-500 mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Erfolgreich!</h2>
                        <p className="text-slate-600 mt-2">{message}</p>
                        <p className="text-sm text-slate-400 mt-4">Sie werden in Kürze weitergeleitet...</p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="flex flex-col items-center animate-fadeIn">
                        <FaExclamationCircle className="text-5xl text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Fehler</h2>
                        <p className="text-red-600 mt-2">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition"
                        >
                            Zurück zum Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
