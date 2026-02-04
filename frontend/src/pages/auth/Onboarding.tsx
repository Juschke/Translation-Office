import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaRocket } from 'react-icons/fa';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleStart = () => {
        setIsLoading(true);
        setTimeout(() => {
            navigate('/');
        }, 1500);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <div className="bg-white p-10 rounded-2xl shadow-xl max-w-2xl w-full border border-gray-100">
                <div className="mb-6 flex justify-center">
                    <div className="bg-green-100 p-4 rounded-full">
                        <FaCheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Willkommen bei Translater Office!</h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Ihr Konto wurde erfolgreich erstellt. Wir haben alles vorbereitet, damit Sie sofort loslegen können.
                    Starten Sie jetzt mit einer kurzen Einführung oder erkunden Sie das Dashboard auf eigene Faust.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-brand-50 p-6 rounded-xl border border-brand-100">
                        <h3 className="font-bold text-brand-800 text-lg mb-2">Projekte verwalten</h3>
                        <p className="text-sm text-brand-600">Erstellen und verwalten Sie komplexe Übersetzungsprojekte mit Leichtigkeit.</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="font-bold text-blue-800 text-lg mb-2">Team & Partner</h3>
                        <p className="text-sm text-blue-600">Laden Sie Kollegen ein und verknüpfen Sie sich mit Ihren bevorzugten Übersetzern.</p>
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 border border-transparent text-lg font-medium rounded-lg shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all transform hover:scale-105"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Wird geladen...
                        </span>
                    ) : (
                        <>
                            <FaRocket className="mr-3" /> Zum Dashboard
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default OnboardingPage;
