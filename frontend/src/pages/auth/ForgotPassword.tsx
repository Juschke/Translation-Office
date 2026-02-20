import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { authService } from '../../api/services';
import Input from '../../components/common/Input';
import { Button } from '../../components/common/Button';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);

        try {
            const response = await authService.forgotPassword(email);
            setStatus({ type: 'success', message: response.message });
        } catch (error: any) {
            setStatus({
                type: 'error',
                message: error.response?.data?.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-slate-900 w-12 h-12 rounded-sm flex items-center justify-center font-bold text-white text-2xl shadow-sm">TO</div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
                    Passwort vergessen?
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Kein Problem. Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:px-10 rounded-sm">
                    {status?.type === 'success' ? (
                        <div className="text-center animate-fadeIn">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                                <FaCheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">E-Mail gesendet</h3>
                            <p className="mt-2 text-sm text-slate-500">
                                {status.message}
                            </p>
                            <div className="mt-6">
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-slate-900 hover:text-slate-700 flex items-center justify-center gap-2"
                                >
                                    <FaArrowLeft className="w-3 h-3" /> Zurück zum Login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {status?.type === 'error' && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm flex items-center gap-3">
                                    <FaExclamationTriangle className="shrink-0" />
                                    <span>{status.message}</span>
                                </div>
                            )}

                            <div>
                                <Input
                                    label="E-Mail-Adresse"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@beispiel.de"
                                />
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full h-11"
                                    isLoading={isLoading}
                                    disabled={!email}
                                >
                                    Absenden
                                </Button>
                            </div>

                            <div className="flex items-center justify-center">
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2"
                                >
                                    <FaArrowLeft className="w-3 h-3" /> Zurück zum Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
