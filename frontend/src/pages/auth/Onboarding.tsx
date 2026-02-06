import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaCheckCircle, FaRocket, FaBuilding, FaCreditCard,
    FaUserPlus, FaChevronRight, FaChevronLeft, FaPlus, FaTrash, FaGlobe, FaCertificate, FaShieldAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const steps = [
    { title: 'Unternehmen', icon: <FaBuilding /> },
    { title: 'Finanzen', icon: <FaCreditCard /> },
    { title: 'Plan & Lizenz', icon: <FaShieldAlt /> },
    { title: 'Team', icon: <FaUserPlus /> }
];

const OnboardingPage = () => {
    const { onboard } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        company_name: '',
        legal_form: '',
        address_street: '',
        address_house_no: '',
        address_zip: '',
        address_city: '',
        address_country: 'DE',
        bank_name: '',
        bank_iban: '',
        bank_bic: '',
        tax_number: '',
        vat_id: '',
        subscription_plan: 'basic',
        license_key: '',
        invitations: [] as string[]
    });

    const [inviteEmail, setInviteEmail] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const addInvite = () => {
        if (inviteEmail && !formData.invitations.includes(inviteEmail)) {
            setFormData(prev => ({ ...prev, invitations: [...prev.invitations, inviteEmail] }));
            setInviteEmail('');
        }
    };

    const removeInvite = (index: number) => {
        setFormData(prev => ({ ...prev, invitations: prev.invitations.filter((_, i) => i !== index) }));
    };

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await onboard(formData);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Onboarding fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Name des Übersetzungsbüros</label>
                                <input name="company_name" value={formData.company_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="z.B. WordFlow Translations" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rechtsform</label>
                                <input name="legal_form" value={formData.legal_form} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="z.B. GmbH, e.K." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Straße</label>
                                <input name="address_street" value={formData.address_street} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="Musterstraße" />
                            </div>
                            <div className="grid grid-cols-3 gap-2 col-span-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PLZ</label>
                                    <input name="address_zip" value={formData.address_zip} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="12345" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stadt</label>
                                    <input name="address_city" value={formData.address_city} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="Berlin" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bankname</label>
                                <input name="bank_name" value={formData.bank_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="Sparkasse Berlin" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">IBAN</label>
                                <input name="bank_iban" value={formData.bank_iban} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="DE12 3456 ..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">BIC</label>
                                <input name="bank_bic" value={formData.bank_bic} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="WELADED..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">USt-ID / Steuernummer</label>
                                <input name="vat_id" value={formData.vat_id} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="DE 999 999 999" />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'basic', name: 'Standard', price: '49€' },
                                { id: 'pro', name: 'Professional', price: '99€' },
                                { id: 'premium', name: 'Premium', price: '199€' }
                            ].map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => setFormData(prev => ({ ...prev, subscription_plan: p.id }))}
                                    className={clsx(
                                        "p-4 border-2 rounded-xl cursor-pointer transition text-center",
                                        formData.subscription_plan === p.id ? "border-brand-600 bg-brand-50" : "border-slate-100 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{p.name}</div>
                                    <div className="text-xl font-black text-slate-800">{p.price}</div>
                                    <div className="text-[9px] text-slate-500 mt-2">pro Monat / User</div>
                                </div>
                            ))}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Oder Lizenzschlüssel</span></div>
                        </div>
                        <input name="license_key" value={formData.license_key} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="VBA-1234-XXXX-XXXX" />
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex gap-2">
                            <input
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="kollege@büro.de"
                            />
                            <button type="button" onClick={addInvite} className="bg-brand-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-800 transition">
                                <FaPlus /> Hinzufügen
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.invitations.map((email, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">{email}</span>
                                    <button type="button" onClick={() => removeInvite(i)} className="text-slate-300 hover:text-red-500 transition"><FaTrash /></button>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-xs text-blue-800 leading-relaxed italic">
                            <FaGlobe className="shrink-0 mt-0.5" />
                            <span>Sie können jederzeit weitere Teammitglieder in den Einstellungen hinzufügen.</span>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-slate-800 font-sans">
            <div className="w-full max-w-4xl grid grid-cols-12 gap-8 items-stretch">

                {/* Left Sidebar - Progress */}
                <div className="col-span-12 lg:col-span-4 bg-brand-900 rounded-3xl p-8 text-white shadow-2xl shadow-brand-900/40 flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-brand-700 rounded-full blur-[100px] opacity-30"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                <FaCertificate className="text-white text-xl" />
                            </div>
                            <span className="text-lg font-black tracking-tighter uppercase whitespace-nowrap">TransOffice <span className="text-brand-400">Pro</span></span>
                        </div>

                        <div className="space-y-8">
                            {steps.map((step, i) => (
                                <div key={i} className={clsx(
                                    "flex items-center gap-4 transition-all duration-500",
                                    currentStep === i ? "opacity-100 scale-105" : "opacity-40"
                                )}>
                                    <div className={clsx(
                                        "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-black transition-colors duration-500",
                                        currentStep >= i ? "bg-white text-brand-900 border-white" : "border-white/30 text-white/50"
                                    )}>
                                        {currentStep > i ? <FaCheckCircle /> : step.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-300">Schritt {i + 1}</span>
                                        <span className="font-bold">{step.title}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 p-5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                        <p className="text-xs text-brand-100 leading-relaxed font-medium">
                            "Wir unterstützen Sie dabei, Ihr Übersetzungsbüro effizient und digital zu führen."
                        </p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-slate-100 flex flex-col relative overflow-hidden">
                    <div className="mb-10">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                            {currentStep === 0 && "Herzlich Willkommen!"}
                            {currentStep === 1 && "Finanzielle Details"}
                            {currentStep === 2 && "Wählen Sie Ihren Plan"}
                            {currentStep === 3 && "Laden Sie Ihr Team ein"}
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            {currentStep === 0 && "Starten wir mit den Grunddaten Ihres Unternehmens."}
                            {currentStep === 1 && "Diese Informationen benötigen wir für Ihre Rechnungen."}
                            {currentStep === 2 && "Passen Sie die Plattform an Ihre Bedürfnisse an."}
                            {currentStep === 3 && "Zusammen arbeitet es sich besser. Fügen Sie Kollegen hinzu."}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-xs font-bold border border-red-100 mb-8 animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={currentStep === steps.length - 1 ? handleSubmit : (e) => e.preventDefault()} className="flex-1 flex flex-col justify-between">
                        <div className="mb-12">
                            {renderStep()}
                        </div>

                        <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className={clsx(
                                    "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition flex items-center gap-2",
                                    currentStep === 0 ? "opacity-0 pointer-events-none" : "hover:bg-slate-100 text-slate-500"
                                )}
                            >
                                <FaChevronLeft /> Zurück
                            </button>

                            {currentStep < steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-brand-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-700/20 hover:bg-brand-800 transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    Weiter <FaChevronRight />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-10 py-4 bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition transform hover:scale-110 active:scale-95 flex items-center gap-3"
                                >
                                    {isLoading ? "Wird finalisiert..." : <>System starten <FaRocket /></>}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}</style>
        </div>
    );
};

export default OnboardingPage;
