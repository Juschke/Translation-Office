import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBuilding, FaGlobe, FaExclamationCircle } from 'react-icons/fa';
import clsx from 'clsx';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        industry: '',
        language: 'de'
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (step === 1) {
            if (!formData.name || !formData.email || !formData.password) {
                setError('Bitte füllen Sie alle Felder aus.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Die Passwörter stimmen nicht überein.');
                return;
            }
            setStep(2);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        // Mock registration
        setTimeout(() => {
            setIsLoading(false);
            navigate('/onboarding');
        }, 1500);
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
                    Starten Sie in wenigen Minuten mit Translater Office.
                </p>

                {/* Stepper */}
                <div className="mt-8 flex justify-center items-center gap-4">
                    <div className={clsx("flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors", step >= 1 ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500")}>1</div>
                    <div className={clsx("w-16 h-1 rounded transition-colors", step >= 2 ? "bg-brand-600" : "bg-gray-200")}></div>
                    <div className={clsx("flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors", step >= 2 ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500")}>2</div>
                </div>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleNext}>
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

                        {step === 1 && (
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
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Firmenname</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaBuilding className="text-gray-400" />
                                        </div>
                                        <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm h-10 border" placeholder="Ihre Firma GmbH" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Branche</label>
                                    <select name="industry" value={formData.industry} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm h-10 px-3 border">
                                        <option value="">Bitte wählen...</option>
                                        <option value="translation">Übersetzungsbüro</option>
                                        <option value="freelance">Freelancer</option>
                                        <option value="enterprise">Unternehmen</option>
                                        <option value="other">Andere</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bevorzugte Sprache</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaGlobe className="text-gray-400" />
                                        </div>
                                        <select name="language" value={formData.language} onChange={handleChange} className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm h-10 border">
                                            <option value="de">Deutsch</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="flex h-5 items-center">
                                        <input id="terms" name="terms" type="checkbox" required className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="terms" className="font-medium text-gray-700">Ich akzeptiere die <a href="#" className="text-brand-600 hover:text-brand-500">AGB</a> und <a href="#" className="text-brand-600 hover:text-brand-500">Datenschutzbestimmungen</a>.</label>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            {step === 2 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex w-1/3 justify-center rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all"
                                >
                                    Zurück
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={clsx(
                                    "flex w-full justify-center rounded-md bg-brand-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all",
                                    step === 2 ? "w-2/3" : "w-full",
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
                                ) : (step === 1 ? "Weiter" : "Konto erstellen")}
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
