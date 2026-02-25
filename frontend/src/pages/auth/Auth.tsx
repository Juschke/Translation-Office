import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaLock, FaExclamationCircle, FaShieldAlt, FaEnvelope } from 'react-icons/fa';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login, register } = useAuth();

    // Determine initial tab from URL or default to login
    const initialTab = location.pathname.includes('register') ? 'register' : 'login';
    const [activeTab, setActiveTab] = useState(initialTab);

    return (
        <AuthLayout>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="login" className="text-base">Anmelden</TabsTrigger>
                    <TabsTrigger value="register" className="text-base">Registrieren</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                    <LoginForm login={login} navigate={navigate} />
                </TabsContent>

                <TabsContent value="register">
                    <RegisterForm register={register} navigate={navigate} />
                </TabsContent>
            </Tabs>
        </AuthLayout>
    );
};

/* ================================
   LOGIN FORM
================================ */
interface LoginFormProps {
    login: (payload: any) => Promise<any>;
    navigate: any;
}

const LoginForm = ({ login, navigate }: LoginFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
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

            if (showTwoFactor && !twoFactorCode) {
                setError("Bitte geben Sie den Bestätigungscode ein.");
                setIsLoading(false);
                return;
            }

            const response = await login(payload);

            if (response && response.two_factor) {
                setShowTwoFactor(true);
                setIsLoading(false);
                return;
            }

            navigate('/');
        } catch (err: any) {
            let msg = 'Ungültige E-Mail-Adresse oder Passwort.';
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                if (errors.code) msg = errors.code[0];
                else if (errors.email) msg = errors.email[0];
            } else if (err.response?.data?.message) {
                msg = err.response.data.message;
            }

            setError(msg);
            if (showTwoFactor) setTwoFactorCode('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                    <div className="flex items-center gap-3">
                        <FaExclamationCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {showTwoFactor ? (
                <>
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-100 mb-3">
                            <FaShieldAlt className="h-7 w-7 text-teal-700" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">2FA Bestätigung</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            Geben Sie Ihren Authenticator-Code ein
                        </p>
                    </div>

                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-2">
                            Sicherheitscode / Recovery Code
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaShieldAlt className="h-5 w-5 text-slate-400" />
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
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                placeholder="000 000"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setShowTwoFactor(false);
                            setTwoFactorCode('');
                            setError(null);
                        }}
                        className="text-sm text-slate-600 hover:text-slate-900 underline"
                    >
                        ← Zurück zur Anmeldung
                    </button>
                </>
            ) : (
                <>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                            E-Mail-Adresse
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaUser className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                placeholder="name@beispiel.de"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                Passwort
                            </label>
                            <a
                                href="/forgot-password"
                                className="text-sm font-medium text-teal-700 hover:text-teal-600"
                            >
                                Vergessen?
                            </a>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaLock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                    "w-full flex justify-center items-center gap-2 px-4 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-[#1B4D4F] hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all",
                    isLoading && "opacity-70 cursor-not-allowed"
                )}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {showTwoFactor ? 'Verifiziere...' : 'Anmelden...'}
                    </>
                ) : (
                    showTwoFactor ? 'Bestätigen' : 'Anmelden'
                )}
            </button>
        </form>
    );
};

/* ================================
   REGISTER FORM
================================ */
interface RegisterFormProps {
    register: (data: any) => Promise<any>;
    navigate: any;
}

const RegisterForm = ({ register, navigate }: RegisterFormProps) => {
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
        if (formData.password.length < 8) {
            setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
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
            navigate('/onboarding');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Registrierung fehlgeschlagen.';
            setError(message);
            setIsLoading(false);
        }
    };

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                    <div className="flex items-center gap-3">
                        <FaExclamationCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Vollständiger Name
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        placeholder="Max Mustermann"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 mb-2">
                    E-Mail-Adresse
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="register-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        placeholder="max@firma.de"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-2">
                    Passwort
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="register-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        placeholder="Mindestens 8 Zeichen"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Passwort bestätigen
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        placeholder="Passwort wiederholen"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                    "w-full flex justify-center items-center gap-2 px-4 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-[#1B4D4F] hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all",
                    isLoading && "opacity-70 cursor-not-allowed"
                )}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Erstellen...
                    </>
                ) : (
                    'Konto erstellen'
                )}
            </button>

            <p className="text-xs text-center text-slate-500 mt-4">
                Mit der Registrierung stimmen Sie unseren{' '}
                <a href="#" className="text-teal-700 hover:underline">Nutzungsbedingungen</a>
                {' '}und der{' '}
                <a href="#" className="text-teal-700 hover:underline">Datenschutzerklärung</a> zu.
            </p>
        </form>
    );
};

export default AuthPage;
