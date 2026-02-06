import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaExclamationCircle } from 'react-icons/fa';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name || !formData.email || !formData.password) {
            setError('Bitte füllen Sie alle Felder aus.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Die Passwörter stimmen nicht überein.');
            return;
        }

        setIsLoading(true);
        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.confirmPassword
            });
            // AuthGuard will automatically redirect to /onboarding because tenant_id is null
            navigate('/onboarding');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registrierung fehlgeschlagen.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mx-auto h-20 w-20 bg-brand-600 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    TO
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-gray-900">
                    Konto erstellen
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Starten Sie in wenigen Minuten mit Translator Office.
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-md bg-red-50 p-4 border border-red-200">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <FaExclamationCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vollständiger Name</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm h-10 px-3 border" placeholder="Max Mustermann" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">E-Mail-Adresse</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm h-10 px-3 border" placeholder="max@firma.de" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Passwort</label>
                                <input type="password" name="password" required value={formData.password} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm h-10 px-3 border" placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Passwort bestätigen</label>
                                <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm h-10 px-3 border" placeholder="••••••••" />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={clsx(
                                    "flex w-full justify-center rounded-md bg-brand-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all",
                                    isLoading && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Erstellen...
                                    </span>
                                ) : "Konto erstellen"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Haben Sie bereits ein Konto?{' '}
                            <Link to="/login" className="font-semibold leading-6 text-brand-600 hover:text-brand-500 transition-colors">
                                Anmelden
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
