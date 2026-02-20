import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
 FaCheckCircle, FaRocket, FaBuilding, FaCreditCard,
 FaUserPlus, FaChevronRight, FaChevronLeft, FaPlus, FaTrash, FaGlobe, FaCertificate, FaShieldAlt,
 FaInfoCircle, FaAsterisk
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const steps = [
 { title: 'Unternehmen', icon: <FaBuilding /> },
 { title: 'Finanzen', icon: <FaCreditCard /> },
 { title: 'Plan & Lizenz', icon: <FaShieldAlt /> },
 { title: 'Team', icon: <FaUserPlus /> }
];

// Reusable labeled input with required indicator and help text
const Field = ({
 label, name, value, onChange, placeholder, required, helpText, type = 'text', className = '',
 disabled = false
}: {
 label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
 placeholder?: string; required?: boolean; helpText?: string; type?: string; className?: string;
 disabled?: boolean;
}) => (
 <div className={className}>
 <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1">
 {label}
 {required && <FaAsterisk className="text-red-400 text-[6px]" />}
 </label>
 <input
 name={name} type={type} value={value} onChange={onChange} disabled={disabled}
 className="w-full px-4 py-2 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
 placeholder={placeholder}
 />
 {helpText && (
 <p className="mt-1 text-xs text-slate-400 flex items-start gap-1">
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
 vat_id: '',
 subscription_plan: 'basic',
 license_key: '',
 invitations: [] as string[]
 });

 const [inviteEmail, setInviteEmail] = useState('');

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
 setStepErrors([]);
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

 // Validate current step before advancing
 const validateStep = (): string[] => {
 const errors: string[] = [];
 if (currentStep === 0) {
 if (!formData.company_name.trim()) errors.push('Firmenname ist erforderlich');
 if (!formData.address_street.trim()) errors.push('Straße ist erforderlich');
 if (!formData.address_zip.trim()) errors.push('PLZ ist erforderlich');
 if (!formData.address_city.trim()) errors.push('Stadt ist erforderlich');
 }
 if (currentStep === 1) {
 // Finance fields are recommended but not strictly blocking
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
 <Field
 label="Name des Übersetzungsbüros" name="company_name"
 value={formData.company_name} onChange={handleChange}
 placeholder="z.B. WordFlow Translations GmbH" required
 helpText="Der offizielle Firmenname, wie er auf Rechnungen erscheint."
 className="col-span-2"
 />
 <Field
 label="Rechtsform" name="legal_form"
 value={formData.legal_form} onChange={handleChange}
 placeholder="z.B. GmbH, e.K., Einzelunternehmen"
 helpText="Ihre Gesellschaftsform für den Rechtsverkehr."
 />
 <div>
 <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1">
 Land
 </label>
 <select
 name="address_country" value={formData.address_country} onChange={handleChange}
 className="w-full px-4 py-2 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-brand-500"
 >
 <option value="Deutschland">Deutschland</option>
 <option value="Österreich">Österreich</option>
 <option value="Schweiz">Schweiz</option>
 <option value="Luxemburg">Luxemburg</option>
 <option value="Liechtenstein">Liechtenstein</option>
 <option value="Frankreich">Frankreich</option>
 <option value="Italien">Italien</option>
 <option value="Spanien">Spanien</option>
 <option value="Niederlande">Niederlande</option>
 <option value="Belgien">Belgien</option>
 <option value="Polen">Polen</option>
 <option value="Tschechien">Tschechien</option>
 <option value="Dänemark">Dänemark</option>
 <option value="Schweden">Schweden</option>
 <option value="Norwegen">Norwegen</option>
 <option value="Finnland">Finnland</option>
 <option value="Vereinigtes Königreich">Vereinigtes Königreich</option>
 <option value="Irland">Irland</option>
 <option value="USA">USA</option>
 <option value="Kanada">Kanada</option>
 <option value="Australien">Australien</option>
 <option value="Andere">Andere</option>
 </select>
 </div>
 <div className="col-span-2 grid grid-cols-4 gap-3">
 <Field
 label="Straße" name="address_street"
 value={formData.address_street} onChange={handleChange}
 placeholder="Musterstraße" required
 className="col-span-3"
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
 />
 <Field
 label="Stadt" name="address_city"
 value={formData.address_city} onChange={handleChange}
 placeholder="Berlin" required
 className="col-span-2"
 />
 </div>
 </div>
 </div>
 );
 case 1:
 return (
 <div className="space-y-4 animate-fadeIn">
 <div className="p-3 bg-amber-50 border border-amber-100 rounded-sm text-xs text-amber-700 flex items-start gap-2">
 <FaInfoCircle className="shrink-0 mt-0.5" />
 <span>Diese Angaben werden auf Ihren Rechnungen und für den DATEV-Export verwendet. Sie können sie später in den Einstellungen ändern.</span>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <Field
 label="Bankname" name="bank_name"
 value={formData.bank_name} onChange={handleChange}
 placeholder="z.B. Sparkasse Berlin"
 helpText="Name Ihrer Geschäftsbank."
 className="col-span-2"
 />
 <Field
 label="IBAN" name="bank_iban"
 value={formData.bank_iban} onChange={handleChange}
 placeholder="DE89 3704 0044 0532 0130 00"
 helpText="Internationale Bankkontonummer (22 Stellen für DE)."
 className="col-span-2"
 />
 <Field
 label="BIC / SWIFT" name="bank_bic"
 value={formData.bank_bic} onChange={handleChange}
 placeholder="COBADEFFXXX"
 helpText="Bank Identifier Code Ihrer Bank."
 />
 <div>
 <div className="h-4"></div> {/* spacer for alignment */}
 </div>

 <div className="col-span-2 h-px bg-slate-100 my-1"></div>

 <Field
 label="Steuernummer" name="tax_number"
 value={formData.tax_number} onChange={handleChange}
 placeholder="12/345/67890"
 helpText="Vom Finanzamt zugewiesen (für Inland)."
 />
 <Field
 label="USt-IdNr." name="vat_id"
 value={formData.vat_id} onChange={handleChange}
 placeholder="DE123456789"
 helpText="EU-Umsatzsteuer-ID (für EU-Geschäfte & Reverse Charge)."
 />
 </div>
 </div>
 );
 case 2:
 return (
 <div className="space-y-6 animate-fadeIn">
 <div className="grid grid-cols-3 gap-4">
 {[
 { id: 'basic', name: 'Standard', price: '49€', features: ['5 Projekte/Monat', '1 Benutzer', 'E-Mail-Support'] },
 { id: 'pro', name: 'Professional', price: '99€', features: ['Unbegrenzt Projekte', '5 Benutzer', 'DATEV-Export', 'Prioritäts-Support'] },
 { id: 'premium', name: 'Premium', price: '199€', features: ['Alles in Pro', 'Unbegrenzt Benutzer', 'API-Zugang', 'Persönlicher Berater'] }
 ].map((p) => (
 <div
 key={p.id}
 onClick={() => setFormData(prev => ({ ...prev, subscription_plan: p.id }))}
 className={clsx(
 "p-4 border-2 rounded-sm cursor-pointer transition text-center",
 formData.subscription_plan === p.id ? "border-slate-900 bg-slate-50 shadow-sm" : "border-slate-100 hover:bg-slate-50"
 )}
 >
 <div className="text-xs font-medium text-slate-400 mb-1">{p.name}</div>
 <div className="text-xl font-semibold text-slate-800">{p.price}</div>
 <div className="text-xs text-slate-500 mt-1 mb-3">pro Monat / User</div>
 <div className="text-left space-y-1">
 {p.features.map((f, i) => (
 <div key={i} className="flex items-center gap-1 text-xs text-slate-500">
 <FaCheckCircle className="text-emerald-400 text-xs shrink-0" /> {f}
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 <div className="relative">
 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
 <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-slate-400 font-medium">Oder Lizenzschlüssel</span></div>
 </div>
 <Field
 label="Lizenzschlüssel" name="license_key"
 value={formData.license_key} onChange={handleChange}
 placeholder="VBA-1234-XXXX-XXXX"
 helpText="Falls Sie einen Lizenzschlüssel erhalten haben, geben Sie ihn hier ein."
 />
 </div>
 );
 case 3:
 return (
 <div className="space-y-6 animate-fadeIn">
 <div className="flex gap-2">
 <input
 value={inviteEmail}
 onChange={(e) => setInviteEmail(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInvite(); } }}
 className="flex-1 px-4 py-2 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-brand-500"
 placeholder="kollege@unternehmen.de"
 type="email"
 />
 <button type="button" onClick={addInvite} className="bg-slate-900 text-white px-4 py-2 rounded-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition">
 <FaPlus /> Einladen
 </button>
 </div>
 {formData.invitations.length > 0 && (
 <div className="space-y-2">
 {formData.invitations.map((email, i) => (
 <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-sm">
 <span className="text-sm font-medium text-slate-700">{email}</span>
 <button type="button" onClick={() => removeInvite(i)} className="text-slate-300 hover:text-red-500 transition"><FaTrash /></button>
 </div>
 ))}
 </div>
 )}
 <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm flex gap-3 text-xs text-blue-800 leading-relaxed">
 <FaGlobe className="shrink-0 mt-0.5" />
 <span>Dieser Schritt ist optional. Sie können jederzeit weitere Teammitglieder in den Einstellungen hinzufügen. Eingeladene erhalten eine E-Mail mit Zugangsdaten.</span>
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
 <div className="col-span-12 lg:col-span-4 bg-slate-900 rounded-sm p-8 text-white shadow-sm shadow-brand-900/40 flex flex-col justify-between overflow-hidden relative">
 <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-slate-900 rounded-full blur-[100px] opacity-30"></div>
 <div className="relative z-10">
 <div className="flex items-center gap-3 mb-12">
 <div className="w-10 h-10 bg-white/20 rounded-sm flex items-center justify-center backdrop-blur-md">
 <FaCertificate className="text-white text-xl" />
 </div>
 <span className="text-lg font-semibold tracking-tight whitespace-nowrap">TransOffice <span className="text-slate-500">Pro</span></span>
 </div>

 <div className="space-y-8">
 {steps.map((step, i) => (
 <div key={i} className={clsx(
 "flex items-center gap-4 transition-all duration-500",
 currentStep === i ? "opacity-100 scale-105" : currentStep > i ? "opacity-70" : "opacity-40"
 )}>
 <div className={clsx(
 "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors duration-500",
 currentStep > i ? "bg-emerald-400 text-white border-emerald-400" :
 currentStep >= i ? "bg-white text-brand-900 border-white" : "border-white/30 text-white/50"
 )}>
 {currentStep > i ? <FaCheckCircle /> : step.icon}
 </div>
 <div className="flex flex-col">
 <span className="text-xs font-medium text-brand-300">Schritt {i + 1}</span>
 <span className="font-medium">{step.title}</span>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="relative z-10 mt-12 p-5 bg-white/10 rounded-sm backdrop-blur-md border border-white/10">
 <p className="text-xs text-brand-100 leading-relaxed font-medium">
 <FaInfoCircle className="inline mr-1" />
 Alle Angaben können später in den Einstellungen jederzeit geändert werden.
 </p>
 </div>
 </div>

 {/* Right Side - Form */}
 <div className="col-span-12 lg:col-span-8 bg-white rounded-sm p-8 lg:p-12 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
 <div className="mb-8">
 <h1 className="text-3xl font-semibold text-slate-800 tracking-tight mb-2">
 {currentStep === 0 && "Herzlich Willkommen!"}
 {currentStep === 1 && "Finanzielle Details"}
 {currentStep === 2 && "Wählen Sie Ihren Plan"}
 {currentStep === 3 && "Laden Sie Ihr Team ein"}
 </h1>
 <p className="text-slate-500 text-sm font-medium">
 {currentStep === 0 && "Starten wir mit den Grunddaten Ihres Unternehmens. Pflichtfelder sind mit ✱ markiert."}
 {currentStep === 1 && "Diese Informationen benötigen wir für Ihre Rechnungen und den DATEV-Export."}
 {currentStep === 2 && "Passen Sie die Plattform an Ihre Bedürfnisse an."}
 {currentStep === 3 && "Zusammen arbeitet es sich besser. Fügen Sie Kollegen hinzu (optional)."}
 </p>
 </div>

 {error && (
 <div className="bg-red-50 text-red-700 p-4 rounded-sm text-xs font-medium border border-red-100 mb-6 animate-shake">
 {error}
 </div>
 )}

 {stepErrors.length > 0 && (
 <div className="bg-red-50 text-red-700 p-4 rounded-sm text-xs font-medium border border-red-100 mb-6 animate-shake">
 <div className="font-medium mb-1">Bitte korrigieren Sie folgende Angaben:</div>
 <ul className="list-disc list-inside space-y-0.5">
 {stepErrors.map((err, i) => <li key={i}>{err}</li>)}
 </ul>
 </div>
 )}

 <form className="flex-1 flex flex-col justify-between" onSubmit={(e) => e.preventDefault()}>
 <div className="mb-10">
 {renderStep()}
 </div>

 {/* Progress bar */}
 <div className="w-full bg-slate-100 rounded-full h-1 mb-6">
 <div
 className="bg-slate-900 h-1 rounded-full transition-all duration-500"
 style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
 ></div>
 </div>

 <div className="flex justify-between items-center pt-6 border-t border-slate-100">
 <button
 type="button"
 onClick={handleBack}
 disabled={currentStep === 0}
 className={clsx(
 "px-6 py-2.5 rounded-sm text-xs font-medium transition flex items-center gap-2",
 currentStep === 0 ? "opacity-0 pointer-events-none" : "hover:bg-slate-100 text-slate-500"
 )}
 >
 <FaChevronLeft /> Zurück
 </button>

 {currentStep < steps.length - 1 ? (
 <button
 type="button"
 onClick={handleNext}
 className="px-8 py-3 bg-slate-900 text-white rounded-sm text-xs font-medium shadow-sm hover:bg-slate-800 transition flex items-center gap-2"
 >
 Weiter <FaChevronRight />
 </button>
 ) : (
 <button
 type="button"
 onClick={async (e) => {
 // Final validation or adding pending invite
 if (inviteEmail && !formData.invitations.includes(inviteEmail)) {
 // We cannot easily update state and submit in the same event loop due to closure
 // So we construct a new object to submit
 const finalData = {
 ...formData,
 invitations: [...formData.invitations, inviteEmail]
 };
 setIsLoading(true);
 setError(null);
 try {
 await onboard(finalData);
 navigate('/');
 } catch (err: any) {
 setError(err.response?.data?.message || 'Onboarding fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben.');
 setIsLoading(false);
 }
 } else {
 handleSubmit(e);
 }
 }}
 disabled={isLoading}
 className="px-10 py-4 bg-emerald-600 text-white rounded-sm text-sm font-semibold shadow-sm hover:bg-emerald-700 transition flex items-center gap-3"
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
