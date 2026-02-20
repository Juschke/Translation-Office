import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaExclamationCircle, FaShieldAlt } from 'react-icons/fa';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    // 2FA State
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const payload: any = { email, password };
            if (showTwoFactor && twoFactorCode) {
                payload.code = twoFactorCode;
            }

            // If we are in 2FA mode but code is empty, don't submit yet (prevent useless call)
            if (showTwoFactor && !twoFactorCode) {
                setError("Bitte geben Sie den Bestätigungscode ein.");
                setIsLoading(false);
                return;
            }

            const response = await login(payload);

            if (response && response.two_factor) {
                setShowTwoFactor(true);
                // Clear any previous error
                setIsLoading(false);
                return;
            }

            navigate('/');
        } catch (err: any) {
            // Extract error message
            let msg = 'Ungültige E-Mail-Adresse oder Passwort.';
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                if (errors.code) msg = errors.code[0];
                else if (errors.email) msg = errors.email[0];
            } else if (err.response?.data?.message) {
                msg = err.response.data.message;
            }

            setError(msg);

            // If 2FA failed, maybe clear code
            if (showTwoFactor) {
                setTwoFactorCode('');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <div className="mx-auto h-20 w-20 bg-slate-900 rounded-sm flex items-center justify-center text-3xl font-medium text-white shadow-sm">
                    TO
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
                    {showTwoFactor ? '2FA Bestätigung' : 'Willkommen zurück'}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    {showTwoFactor ? 'Bitte geben Sie Ihren Authenticator-Code ein.' : 'Melden Sie sich an, um auf Ihr Dashboard zuzugreifen.'}
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <div className="bg-white py-8 px-4 shadow sm:rounded-sm sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-sm bg-red-50 p-4 border border-red-200">
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

                        {!showTwoFactor ? (
                            <>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">
                                        E-Mail-Adresse
                                    </label>
                                    <div className="mt-2 relative rounded-sm shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <FaUser className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full rounded-sm border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 transition-all"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-900">
                                            Passwort
                                        </label>
                                        <div className="text-sm">
                                            <Link to="/forgot-password" title="Passwort vergessen?" className="font-semibold text-slate-700 hover:text-slate-600">
                                                Passwort vergessen?
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="mt-2 relative rounded-sm shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <FaLock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full rounded-sm border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium leading-6 text-slate-900">
                                    Sicherheitscode / Recovery Code
                                </label>
                                <div className="mt-2 relative rounded-sm shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <FaShieldAlt className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="code"
                                        name="code"
                                        type="text"
                                        autoComplete="one-time-code"
                                        required
                                        autoFocus
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                        className="block w-full rounded-sm border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 transition-all"
                                        placeholder="000 000"
                                    />
                                </div>
                                <div className="mt-2 text-right">
                                    <button type="button" onClick={() => setShowTwoFactor(false)} className="text-xs text-slate-700 hover:underline">
                                        Zurück zur Anmeldung
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={clsx(
                                    "flex w-full justify-center rounded-sm bg-slate-900 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all",
                                    isLoading && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {showTwoFactor ? 'Verifiziere...' : 'Anmelden...'}
                                    </span>
                                ) : (showTwoFactor ? 'Bestätigen' : 'Anmelden')}
                            </button>
                        </div>
                    </form>

                    {!showTwoFactor && (
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-2 text-slate-500">Neu hier?</span>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link to="/register" className="font-semibold leading-6 text-slate-700 hover:text-slate-600 transition-colors">
                                    Kostenloses Konto erstellen
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-8 text-center text-xs text-slate-500">
                    &copy; 2024 Translator Office. Alle Rechte vorbehalten.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
