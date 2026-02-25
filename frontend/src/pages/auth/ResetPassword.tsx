import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaExclamationTriangle, FaLock } from 'react-icons/fa';
import { authService } from '../../api/services';
import AuthLayout from '../../components/auth/AuthLayout';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        token: '',
        email: '',
        password: '',
        password_confirmation: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
            setError('Ungültiger Reset-Link. Bitte fordern Sie einen neuen Link an.');
        } else {
            setFormData(prev => ({ ...prev, token, email }));
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.password_confirmation) {
            toast.error('Passwörter stimmen nicht überein.');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('Das Passwort muss mindestens 8 Zeichen lang sein.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await authService.resetPassword(formData);
            setIsSuccess(true);
            toast.success('Passwort erfolgreich zurückgesetzt.');
            setTimeout(() => navigate('/auth'), 2000);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Fehler beim Zurücksetzen des Passworts.';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <AuthLayout>
                <div className="text-center space-y-6 py-4">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100">
                        <FaCheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            Erfolgreich!
                        </h3>
                        <p className="text-sm text-slate-600">
                            Ihr Passwort wurde erfolgreich zurückgesetzt.
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                            Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
                        </p>
                    </div>
                    <Link
                        to="/auth"
                        className="inline-block w-full px-4 py-2.5 bg-[#1B4D4F] text-white text-sm font-semibold rounded-lg hover:bg-teal-800 transition-all"
                    >
                        Jetzt anmelden
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Neues Passwort vergeben"
            subtitle="Bitte wählen Sie ein sicheres Passwort mit mindestens 8 Zeichen."
        >
            <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                    <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                        <div className="flex items-center gap-3">
                            <FaExclamationTriangle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                        Neues Passwort
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaLock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                            placeholder="Mindestens 8 Zeichen"
                            autoComplete="new-password"
                            disabled={!!error}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700 mb-2">
                        Passwort bestätigen
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaLock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            required
                            value={formData.password_confirmation}
                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                            placeholder="Passwort wiederholen"
                            autoComplete="new-password"
                            disabled={!!error}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !!error || !formData.password || !formData.token}
                    className={clsx(
                        "w-full flex justify-center items-center gap-2 px-4 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-[#1B4D4F] hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all",
                        (isLoading || !!error || !formData.password || !formData.token) && "opacity-70 cursor-not-allowed"
                    )}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Speichern...
                        </>
                    ) : (
                        'Passwort speichern'
                    )}
                </button>

                {error && (
                    <div className="text-center">
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-teal-700 hover:text-teal-600 transition-colors"
                        >
                            Neuen Reset-Link anfordern
                        </Link>
                    </div>
                )}
            </form>
        </AuthLayout>
    );
};

export default ResetPassword;
