import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { authService } from '../../api/services';
import Input from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
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

        setIsLoading(true);
        setError(null);

        try {
            await authService.resetPassword(formData);
            setIsSuccess(true);
            toast.success('Passwort erfolgreich zurückgesetzt.');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Fehler beim Zurücksetzen des Passworts.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-12 px-4 shadow-sm border border-slate-200 sm:px-10 rounded-sm text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
                            <FaCheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Erfolgreich!</h2>
                        <p className="text-slate-600 mb-8">
                            Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
                        </p>
                        <Link to="/login" className="w-full inline-block bg-slate-900 text-white rounded-sm py-3 font-semibold hover:bg-slate-800 transition-all">
                            Jetzt anmelden
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-slate-900 w-12 h-12 rounded-sm flex items-center justify-center font-bold text-white text-2xl shadow-sm">TO</div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
                    Neues Passwort vergeben
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:px-10 rounded-sm">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm flex items-center gap-3 animate-shake">
                            <FaExclamationTriangle className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <Input
                                label="Neues Passwort"
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                        </div>

                        <div>
                            <Input
                                label="Passwort bestätigen"
                                type="password"
                                required
                                value={formData.password_confirmation}
                                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full h-11"
                                isLoading={isLoading}
                                disabled={!!error || !formData.password || !formData.token}
                            >
                                Passwort speichern
                            </Button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-6 text-center">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2"
                            >
                                <FaArrowLeft className="w-3 h-3" /> Neuen Link anfordern
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
