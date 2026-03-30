import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaEnvelope } from 'react-icons/fa';
import { authService } from '../../api/services';
import AuthLayout from '../../components/auth/AuthLayout';
import clsx from 'clsx';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);

        try {
            const response = await authService.forgotPassword(email);
            setStatus({ type: 'success', message: response.message || t('auth.reset_email_sent') });
            setEmail('');
        } catch (error: any) {
            setStatus({
                type: 'error',
                message: error.response?.data?.message || t('auth.error_try_again')
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={t('auth.forgot_password') + '?'}
            subtitle={t('auth.no_problem')}
        >
            {status?.type === 'success' ? (
                <div className="text-center space-y-6 py-4">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100">
                        <FaCheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                           {t('auth.email_sent')}
                        </h3>
                        <p className="text-sm text-slate-600">
                            {status.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            {t('auth.check_spam')}
                        </p>
                    </div>
                    <Link
                        to="/auth"
                        className="inline-flex items-center justify-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
                    >
                        <FaArrowLeft className="w-3 h-3" /> {t('auth.back_to_login')}
                    </Link>
                </div>
            ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {status?.type === 'error' && (
                        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                            <div className="flex items-center gap-3">
                                <FaExclamationTriangle className="h-5 w-5 text-red-500 shrink-0" />
                                <p className="text-sm font-medium text-red-800">{status.message}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                            E-Mail-Adresse
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                placeholder="name@beispiel.de"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !email}
                        className={clsx(
                            "w-full flex justify-center items-center gap-2 px-4 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all",
                            (isLoading || !email) && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Senden...
                            </>
                        ) : (
                            'Reset-Link senden'
                        )}
                    </button>

                    <div className="text-center">
                        <Link
                            to="/auth"
                            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <FaArrowLeft className="w-3 h-3" /> {t('auth.back_to_login')}
                        </Link>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
};

export default ForgotPassword;
