import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaCheckCircle, FaRocket, FaBuilding, FaCreditCard,
    FaChevronRight, FaChevronLeft, FaCertificate, FaShieldAlt,
    FaInfoCircle, FaAsterisk
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

// Define brand colors from the design system
const brandColors = {
    'brand-primary': '#1B4D4F', // Deep Teal
    'brand-accent': '#9BCB56',  // Action Green
};

const steps = [
    { title: 'Unternehmen', icon: <FaBuilding />, description: 'Grunddaten & Standort' },
    { title: 'Finanzen', icon: <FaCreditCard />, description: 'Bank & Steuern' },
    { title: 'Plan & Lizenz', icon: <FaShieldAlt />, description: 'Abonnement wählen' }
];

// Helper to format IBAN
const formatIBAN = (value: string) => {
    const v = value.replace(/\s+/g, '').toUpperCase();
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
        parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ').trim();
};

// Helper to validate IBAN
const isValidIBAN = (iban: string) => {
    const cleaned = iban.replace(/\s+/g, '');
    if (cleaned.length < 15 || cleaned.length > 34) return false;
    // Simple check for German IBANs as primary market
    if (cleaned.startsWith('DE')) {
        return cleaned.length === 22 && /^[A-Z0-9]+$/.test(cleaned);
    }
    return /^[A-Z0-9]+$/.test(cleaned);
};

// Reusable labeled input with required indicator and help text
const Field = ({
    label, name, value, onChange, placeholder, required, helpText, type = 'text', className = '',
    disabled = false, error = false
}: {
    label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string; required?: boolean; helpText?: string; type?: string; className?: string;
    disabled?: boolean; error?: boolean;
}) => (
    <div className={className}>
        <label className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
            {label}
            {required && <FaAsterisk className="text-red-500 text-[6px]" />}
        </label>
        <div className="relative group">
            <input
                name={name} type={type} value={value} onChange={onChange} disabled={disabled}
                className={clsx(
                    "w-full px-4 py-2.5 border rounded-sm outline-none transition-all duration-200",
                    "text-sm font-medium",
                    error
                        ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary",
                    disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white text-slate-800"
                )}
                placeholder={placeholder}
            />
            <div className={clsx(
                "absolute bottom-0 left-0 h-0.5 bg-brand-primary transition-all duration-300",
                "w-0 group-focus-within:w-full"
            )}></div>
        </div>
        {helpText && (
            <p className="mt-1.5 text-[11px] text-slate-400 flex items-start gap-1 leading-relaxed">
                <FaInfoCircle className="shrink-0 mt-0.5" />
                <span>{helpText}</span>
            </p>
        )}
    </div>
);

const OnboardingPage = () => {
    const { onboard } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stepErrors, setStepErrors] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        company_name: '',
        legal_form: '',
        address_street: '',
        address_house_no: '',
        address_zip: '',
        address_city: '',
        address_country: 'Deutschland',
        bank_name: '',
        bank_iban: '',
        bank_bic: '',
        tax_number: '',
        tax_office: '',
        vat_id: '',
        subscription_plan: 'basic',
        license_key: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'bank_iban') {
            const formatted = formatIBAN(value);
            if (formatted.replace(/\s/g, '').length <= 34) {
                setFormData(prev => ({ ...prev, [name]: formatted }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        setStepErrors([]);
    };

    const validateStep = (): string[] => {
        const errors: string[] = [];
        if (currentStep === 0) {
            if (!formData.company_name.trim()) errors.push('Firmenname ist erforderlich');
            if (!formData.address_street.trim()) errors.push('Straße ist erforderlich');
            if (!formData.address_zip.trim()) errors.push('PLZ ist erforderlich');
            if (!formData.address_city.trim()) errors.push('Stadt ist erforderlich');
        }
        if (currentStep === 1) {
            if (formData.bank_iban && !isValidIBAN(formData.bank_iban)) {
                errors.push('Bitte geben Sie eine gültige IBAN ein');
            }
        }
        return errors;
    };

    const handleNext = () => {
        const errors = validateStep();
        if (errors.length > 0) {
            setStepErrors(errors);
            return;
        }
        setStepErrors([]);
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => {
        setStepErrors([]);
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const finalValidation = validateStep();
        if (finalValidation.length > 0) {
            setStepErrors(finalValidation);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const submissionData = {
                ...formData,
                bank_iban: formData.bank_iban.replace(/\s+/g, '')
            };
            await onboard(submissionData);
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
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-brand-primary/5 p-4 border-l-4 border-brand-primary rounded-r-md flex gap-3">
                            <FaBuilding className="text-brand-primary mt-1 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-brand-primary">Unternehmensidentität</p>
                                <p className="text-xs text-brand-primary/70">Dies bildet das Fundament Ihres digitalen Büros.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <Field
                                label="Name des Übersetzungsbüros" name="company_name"
                                value={formData.company_name} onChange={handleChange}
                                placeholder="z.B. WordFlow Translations GmbH" required
                                helpText="Der offizielle Firmenname, wie er auf Rechnungen erscheint."
                                className="col-span-2"
                                error={stepErrors.some(e => e.includes('Firmenname'))}
                            />
                            <Field
                                label="Rechtsform" name="legal_form"
                                value={formData.legal_form} onChange={handleChange}
                                placeholder="z.B. GmbH, e.K., Einzelunternehmen"
                                helpText="Ihre Gesellschaftsform für den Rechtsverkehr."
                            />
                            <div>
                                <label className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                                    Hauptstandort (Land)
                                </label>
                                <select
                                    name="address_country" value={formData.address_country} onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-sm outline-none transition-all duration-200 text-sm font-medium bg-white text-slate-800 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
                                >
                                    {['Deutschland', 'Österreich', 'Schweiz', 'Luxemburg', 'Frankreich', 'Italien', 'Spanien', 'Niederlande', 'Belgien', 'Polen', 'USA', 'Andere'].map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 grid grid-cols-4 gap-3">
                                <Field
                                    label="Straße" name="address_street"
                                    value={formData.address_street} onChange={handleChange}
                                    placeholder="Musterstraße" required
                                    className="col-span-3"
                                    error={stepErrors.some(e => e.includes('Straße'))}
                                />
                                <Field
                                    label="Hausnr." name="address_house_no"
                                    value={formData.address_house_no} onChange={handleChange}
                                    placeholder="12a"
                                />
                            </div>
                            <div className="col-span-2 grid grid-cols-3 gap-3">
                                <Field
                                    label="PLZ" name="address_zip"
                                    value={formData.address_zip} onChange={handleChange}
                                    placeholder="12345" required
                                    error={stepErrors.some(e => e.includes('PLZ'))}
                                />
                                <Field
                                    label="Stadt" name="address_city"
                                    value={formData.address_city} onChange={handleChange}
                                    placeholder="Berlin" required
                                    className="col-span-2"
                                    error={stepErrors.some(e => e.includes('Stadt'))}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-amber-50 p-4 border-l-4 border-amber-400 rounded-r-md flex gap-3">
                            <FaInfoCircle className="text-amber-500 mt-1 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">Compliance & Finanzen</p>
                                <p className="text-xs text-amber-800/70">Diese Angaben werden für Rechnungen, DATEV-Exporte und Finanzamtsmeldungen verwendet.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <Field
                                label="Bankname / Institut" name="bank_name"
                                value={formData.bank_name} onChange={handleChange}
                                placeholder="z.B. Deutsche Bank, Sparkasse..."
                                className="col-span-2"
                            />
                            <Field
                                label="IBAN (International Bank Account Number)" name="bank_iban"
                                value={formData.bank_iban} onChange={handleChange}
                                placeholder="DE89 3... (wird automatisch formatiert)"
                                className="col-span-2"
                                error={stepErrors.some(e => e.includes('IBAN'))}
                                helpText="Wird auf allen Ihren Rechnungen für Zahlungseingänge angezeigt."
                            />
                            <Field
                                label="BIC / SWIFT-Code" name="bank_bic"
                                value={formData.bank_bic} onChange={handleChange}
                                placeholder="COBADEFFXXX"
                            />
                            <Field
                                label="Zuständiges Finanzamt" name="tax_office"
                                value={formData.tax_office} onChange={handleChange}
                                placeholder="z.B. Berlin-Mitte"
                            />

                            <div className="col-span-2 h-px bg-slate-100 my-2 shadow-[0_1px_0_white]"></div>

                            <Field
                                label="Steuernummer" name="tax_number"
                                value={formData.tax_number} onChange={handleChange}
                                placeholder="12/345/67890"
                            />
                            <Field
                                label="USt-IdNr. (VAT ID)" name="vat_id"
                                value={formData.vat_id} onChange={handleChange}
                                placeholder="DE123456789"
                                helpText="Erforderlich für EU-Geschäfte (Reverse Charge)."
                            />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-8 animate-fadeIn text-center">
                        <div className="max-w-md mx-auto">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Wählen Sie Ihr Paket</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Profitieren Sie von vollem Funktionsumfang passend zu Ihrer Unternehmensgröße.
                                Sie können jederzeit flexibel wechseln.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-5 pt-4">
                            {[
                                { id: 'basic', name: 'Standard', price: '49€', features: ['5 Projekte/Monat', '1 Benutzer', 'E-Mail-Support'] },
                                { id: 'pro', name: 'Professional', price: '99€', features: ['Unbegrenzt Projekte', '5 Benutzer', 'DATEV-Export', 'Prio-Support'] },
                                { id: 'premium', name: 'Premium', price: '199€', features: ['Inkl. aller Features', 'Unlimitierte User', 'API-Schnittstelle', 'Account Manager'] }
                            ].map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => setFormData(prev => ({ ...prev, subscription_plan: p.id }))}
                                    className={clsx(
                                        "relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 transform",
                                        formData.subscription_plan === p.id
                                            ? "border-brand-primary bg-white shadow-xl -translate-y-2"
                                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                                    )}
                                >
                                    {formData.subscription_plan === p.id && (
                                        <div className="absolute top-0 right-0 p-2 transform translate-x-1/3 -translate-y-1/3">
                                            <FaCheckCircle className="text-brand-primary bg-white rounded-full text-2xl shadow-sm" />
                                        </div>
                                    )}
                                    <div className="text-[10px] tracking-[0.2em] font-black text-slate-400 uppercase mb-2">{p.name}</div>
                                    <div className="text-2xl font-black text-brand-primary">{p.price}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5 mb-6">/ MONAT</div>

                                    <div className="text-left space-y-2.5">
                                        {p.features.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                                                <FaCheckCircle className="text-brand-accent text-xs shrink-0" /> {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-lg max-w-lg mx-auto mt-8">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="h-px bg-slate-200 w-12"></div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Enterprise Lizenz</span>
                                <div className="h-px bg-slate-200 w-12"></div>
                            </div>
                            <Field
                                label="Haben Sie einen Lizenzschlüssel?" name="license_key"
                                value={formData.license_key} onChange={handleChange}
                                placeholder="VBA-1234-XXXX-XXXX"
                                className="text-left"
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center p-6 text-slate-800 font-sans">
            <div className="w-full max-w-5xl grid grid-cols-12 rounded-xl shadow-2xl overflow-hidden bg-white min-h-[700px]">

                {/* Left Sidebar - Progress */}
                <div className="col-span-12 lg:col-span-4 bg-brand-primary p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-16 group">
                            <div className="w-12 h-12 bg-white/10 group-hover:bg-brand-accent/20 rounded-lg flex items-center justify-center backdrop-blur-md transition-colors duration-500 border border-white/20">
                                <FaCertificate className="text-brand-accent text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight leading-none text-white m-0">TransOffice</h2>
                                <span className="text-[10px] tracking-[0.3em] font-bold text-brand-accent uppercase">Enterprise Portal</span>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {steps.map((step, i) => (
                                <div key={i} className={clsx(
                                    "flex items-start gap-4 transition-all duration-500 border-l-2 pl-6 relative py-1",
                                    currentStep === i ? "border-brand-accent" : "border-white/10"
                                )}>
                                    <div className={clsx(
                                        "absolute left-0 -translate-x-1/2 top-2 w-3 h-3 rounded-full border-2 transition-all duration-500 shadow-sm",
                                        currentStep > i ? "bg-brand-accent border-brand-accent scale-110" :
                                            currentStep === i ? "bg-white border-white scale-125" : "bg-brand-primary border-white/20"
                                    )}></div>

                                    <div className="flex flex-col">
                                        <span className={clsx(
                                            "text-[9px] font-black uppercase tracking-widest mb-1 transition-colors duration-300",
                                            currentStep === i ? "text-brand-accent" : "text-white/40"
                                        )}>
                                            Phase 0{i + 1}
                                        </span>
                                        <span className={clsx(
                                            "text-base font-bold transition-all duration-300",
                                            currentStep === i ? "text-white translate-x-1" : "text-white/60"
                                        )}>
                                            {step.title}
                                        </span>
                                        <span className="text-[10px] text-white/40 mt-1">{step.description}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 p-5 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 mt-12">
                        <p className="text-[11px] text-white/70 leading-relaxed">
                            <FaInfoCircle className="inline mr-2 text-brand-accent" />
                            Sämtliche Firmendaten unterliegen strengen Datenschutz-Richtlinien und sind SSL-verschlüsselt.
                        </p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="col-span-12 lg:col-span-8 p-10 lg:p-14 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-start mb-12">
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.4em] mb-2 font-display">
                                Konfiguration
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
                                {currentStep === 0 && "Willkommen bei TransOffice"}
                                {currentStep === 1 && "Finanzielle Compliance"}
                                {currentStep === 2 && "Abonnement-Planung"}
                            </h1>
                            <div className="h-1.5 w-16 bg-brand-accent mt-4 rounded-full"></div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-black text-slate-200">0{currentStep + 1}<span className="text-sm font-bold text-slate-300 mx-1">/</span>0{steps.length}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-xs font-bold border border-red-100 mb-8 animate-shake flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">!</div>
                            {error}
                        </div>
                    )}

                    {stepErrors.length > 0 && (
                        <div className="bg-red-50 text-red-700 p-5 rounded-lg text-xs border border-red-100 mb-8 animate-shake">
                            <div className="font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FaAsterisk className="text-red-500" /> Korrektur erforderlich
                            </div>
                            <ul className="list-disc list-inside space-y-1 opacity-90 font-medium">
                                {stepErrors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}

                    <form className="flex-1 flex flex-col" onSubmit={(e) => e.preventDefault()}>
                        <div className="mb-12 flex-1">
                            {renderStep()}
                        </div>

                        <div className="flex justify-between items-center pt-10 border-t border-slate-100 mt-auto">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className={clsx(
                                    "px-6 py-3 rounded-lg text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-widest border border-transparent",
                                    currentStep === 0 ? "opacity-0 pointer-events-none" : "hover:bg-slate-50 text-slate-400 hover:text-slate-600 hover:border-slate-200"
                                )}
                            >
                                <FaChevronLeft /> Zurück
                            </button>

                            <div className="flex items-center gap-4">
                                {currentStep < steps.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="px-10 py-4 bg-brand-primary text-white rounded-lg text-xs font-black shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/95 hover:shadow-xl transition-all flex items-center gap-3 uppercase tracking-widest group"
                                    >
                                        Nächster Schritt <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="px-12 py-5 bg-brand-accent text-brand-primary rounded-lg text-sm font-black shadow-xl shadow-brand-accent/20 hover:scale-[1.02] active:scale-95 hover:shadow-2xl transition-all flex items-center gap-3 uppercase tracking-[0.15em]"
                                    >
                                        {isLoading ? "Wird finalisiert..." : <>Setup abschließen <FaRocket /></>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1B4D4F20; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #1B4D4F40; }
        
        .bg-brand-primary { background-color: ${brandColors['brand-primary']}; }
        .text-brand-primary { color: ${brandColors['brand-primary']}; }
        .border-brand-primary { border-color: ${brandColors['brand-primary']}; }
        
        .bg-brand-accent { background-color: ${brandColors['brand-accent']}; }
        .text-brand-accent { color: ${brandColors['brand-accent']}; }
        .border-brand-accent { border-color: ${brandColors['brand-accent']}; }
      `}</style>
        </div>
    );
};

export default OnboardingPage;
