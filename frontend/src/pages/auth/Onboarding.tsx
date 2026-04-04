import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Building2, CreditCard, Sparkles,
    ChevronRight, ChevronLeft, Check, AlertCircle,
    Info, ShieldCheck, Rocket, Globe, FileText, Users
} from 'lucide-react';
import clsx from 'clsx';

// ─── IBAN ──────────────────────────────────────────────────────────────────────
const formatIBAN = (v: string) => {
    const s = v.replace(/\s+/g, '').toUpperCase();
    const parts: string[] = [];
    for (let i = 0; i < s.length; i += 4) parts.push(s.substring(i, i + 4));
    return parts.join(' ').trim();
};
const isValidIBAN = (iban: string) => {
    const c = iban.replace(/\s+/g, '');
    if (c.length < 15 || c.length > 34) return false;
    if (c.startsWith('DE')) return c.length === 22 && /^[A-Z0-9]+$/.test(c);
    return /^[A-Z0-9]+$/.test(c);
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type FormData = {
    company_name: string; legal_form: string;
    address_street: string; address_house_no: string;
    address_zip: string; address_city: string; address_country: string;
    bank_name: string; bank_iban: string; bank_bic: string;
    tax_number: string; tax_office: string; vat_id: string;
    subscription_plan: string; license_key: string;
};
type Errors = Partial<Record<keyof FormData, string>>;

// ─── Field ─────────────────────────────────────────────────────────────────────
const Field = ({
    label, name, value, onChange, placeholder, required,
    helpText, type = 'text', className = '', error, autoComplete
}: {
    label: string; name: keyof FormData; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string; required?: boolean; helpText?: string;
    type?: string; className?: string; error?: string; autoComplete?: string;
}) => (
    <div className={clsx('flex flex-col gap-1', className)}>
        <label htmlFor={name} className="text-[10px] font-semibold text-slate-400">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <input
            id={name} name={name} type={type} value={value}
            onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}
            className={clsx(
                'w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium outline-none transition-all',
                'placeholder:text-slate-300',
                error
                    ? 'border-red-300 bg-red-50 text-red-800 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 bg-white text-slate-800 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/[0.08]'
            )}
        />
        {error ? (
            <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                <AlertCircle size={10} className="shrink-0" />{error}
            </span>
        ) : helpText ? (
            <span className="flex items-start gap-1 text-[11px] text-slate-400 leading-relaxed">
                <Info size={10} className="shrink-0 mt-px" />{helpText}
            </span>
        ) : null}
    </div>
);

// ─── Select ────────────────────────────────────────────────────────────────────
const SelectField = ({
    label, name, value, onChange, options, className = ''
}: {
    label: string; name: keyof FormData; value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[]; className?: string;
}) => (
    <div className={clsx('flex flex-col gap-1', className)}>
        <label htmlFor={name} className="text-[10px] font-semibold text-slate-400">
            {label}
        </label>
        <select
            id={name} name={name} value={value} onChange={onChange}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/[0.08] cursor-pointer appearance-none"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
            }}
        >
            {options.map(o => <option key={o}>{o}</option>)}
        </select>
    </div>
);

// ─── Constants ─────────────────────────────────────────────────────────────────
const STEPS = [
    { label: 'Unternehmen', icon: Building2 },
    { label: 'Finanzen', icon: CreditCard },
    { label: 'Ihr Paket', icon: Sparkles },
];

const COUNTRIES = [
    'Deutschland', 'Österreich', 'Schweiz', 'Luxemburg',
    'Frankreich', 'Italien', 'Spanien', 'Niederlande',
    'Belgien', 'Polen', 'USA', 'Andere',
];

const PLANS = [
    {
        id: 'basic', name: 'Starter', price: '49',
        hint: 'Einzelübersetzer',
        features: ['5 Projekte / Monat', '1 Nutzer', 'Rechnungserstellung', 'E-Mail-Support'],
    },
    {
        id: 'pro', name: 'Professional', price: '99',
        hint: 'Wachsende Büros', badge: 'Beliebt',
        features: ['Unbegrenzte Projekte', 'Bis zu 5 Nutzer', 'DATEV-Export', 'ZUGFeRD', 'Prioritäts-Support'],
    },
    {
        id: 'premium', name: 'Premium', price: '199',
        hint: 'Etablierte Agenturen',
        features: ['Alle Pro-Features', 'Unbegrenzte Nutzer', 'API-Zugang', 'Key Account Manager'],
    },
] as const;

const LEGAL_FORMS = ['GmbH', 'UG (haftungsbeschränkt)', 'e. K.', 'GbR', 'Einzelunternehmen', 'AG'];

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const { onboard } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Errors>({});

    const [form, setForm] = useState<FormData>({
        company_name: '', legal_form: '',
        address_street: '', address_house_no: '', address_zip: '', address_city: '',
        address_country: 'Deutschland',
        bank_name: '', bank_iban: '', bank_bic: '',
        tax_number: '', tax_office: '', vat_id: '',
        subscription_plan: 'pro', license_key: '',
    });

    const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const key = name as keyof FormData;
        if (key === 'bank_iban') {
            const f = formatIBAN(value);
            if (f.replace(/\s/g, '').length <= 34) setForm(p => ({ ...p, bank_iban: f }));
        } else {
            setForm(p => ({ ...p, [key]: value }));
        }
        if (errors[key]) setErrors(p => { const c = { ...p }; delete c[key]; return c; });
    };

    const validate = (): Errors => {
        const e: Errors = {};
        if (step === 0) {
            if (!form.company_name.trim()) e.company_name = 'Firmenname ist erforderlich.';
            if (!form.address_street.trim()) e.address_street = 'Straße ist erforderlich.';
            if (!form.address_zip.trim()) e.address_zip = 'PLZ ist erforderlich.';
            if (!form.address_city.trim()) e.address_city = 'Stadt ist erforderlich.';
        }
        if (step === 1 && form.bank_iban && !isValidIBAN(form.bank_iban)) {
            e.bank_iban = 'Ungültige IBAN (z. B. DE89 3704 0044 0532 0130 00).';
        }
        return e;
    };

    const next = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        setStep(s => Math.min(s + 1, 2));
    };

    const back = () => { setErrors({}); setStep(s => Math.max(s - 1, 0)); };

    const submit = async () => {
        setLoading(true); setSubmitError(null);
        try {
            await onboard({ ...form, bank_iban: form.bank_iban.replace(/\s+/g, '') });
            navigate('/');
        } catch (err: any) {
            setSubmitError(err.response?.data?.message ?? 'Einrichtung fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben.');
        } finally { setLoading(false); }
    };

    // ─── Step content ──────────────────────────────────────────────────────────
    const stepContent = [
        // Step 0 – Unternehmen & Standort
        <div className="space-y-6" key="s0">
            {/* Company */}
            <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-500">Firmenstammdaten</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        label="Firmenname" name="company_name" value={form.company_name} onChange={set}
                        placeholder="z. B. Lingua Franca GmbH" required className="col-span-2"
                        error={errors.company_name} autoComplete="organization"
                        helpText="Erscheint auf allen Rechnungen und Dokumenten."
                    />
                    <div className="col-span-2 flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-slate-400">Rechtsform</label>
                        <input
                            name="legal_form" value={form.legal_form} onChange={set}
                            placeholder="z. B. GmbH, UG, Einzelunternehmen"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/[0.08] transition-all"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {LEGAL_FORMS.map(f => (
                                <button key={f} type="button"
                                    onClick={() => setForm(p => ({ ...p, legal_form: f }))}
                                    className={clsx(
                                        'text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all',
                                        form.legal_form === f
                                            ? 'bg-brand-primary text-white border-brand-primary'
                                            : 'border-slate-200 text-slate-500 hover:border-brand-primary hover:text-brand-primary'
                                    )}
                                >{f}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Address */}
            <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-500">Geschäftsadresse</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectField
                        label="Land" name="address_country" value={form.address_country}
                        onChange={set} options={COUNTRIES} className="col-span-2"
                    />
                    <Field
                        label="Straße" name="address_street" value={form.address_street} onChange={set}
                        placeholder="Musterstraße" required error={errors.address_street} autoComplete="street-address"
                    />
                    <Field
                        label="Hausnummer" name="address_house_no" value={form.address_house_no}
                        onChange={set} placeholder="12 a"
                    />
                    <Field
                        label="PLZ" name="address_zip" value={form.address_zip} onChange={set}
                        placeholder="10115" required error={errors.address_zip} autoComplete="postal-code"
                    />
                    <Field
                        label="Stadt" name="address_city" value={form.address_city} onChange={set}
                        placeholder="Berlin" required error={errors.address_city} autoComplete="address-level2"
                    />
                </div>
            </div>
        </div>,

        // Step 1 – Finanzen
        <div className="space-y-6" key="s1">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                <ShieldCheck size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    Diese Angaben sind <strong>optional</strong>, aber für GoBD-konforme Rechnungen und DATEV-Exporte
                    benötigt. Sie können sie auch später unter <em>Einstellungen → Unternehmen</em> ergänzen.
                </p>
            </div>

            <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-500">Bankverbindung</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        label="Kreditinstitut" name="bank_name" value={form.bank_name} onChange={set}
                        placeholder="z. B. Sparkasse Berlin" className="col-span-2"
                    />
                    <Field
                        label="IBAN" name="bank_iban" value={form.bank_iban} onChange={set}
                        placeholder="DE89 3704 0044 0532 0130 00" className="col-span-2"
                        error={errors.bank_iban}
                        helpText="Wird auf Rechnungen für Zahlungseingänge angezeigt. Automatische Formatierung."
                    />
                    <Field
                        label="BIC / SWIFT" name="bank_bic" value={form.bank_bic} onChange={set}
                        placeholder="COBADEFFXXX" className="col-span-2"
                    />
                </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-500">Steuerdaten</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        label="Zuständiges Finanzamt" name="tax_office" value={form.tax_office} onChange={set}
                        placeholder="z. B. Finanzamt Berlin-Mitte" className="col-span-2"
                    />
                    <Field
                        label="Steuernummer" name="tax_number" value={form.tax_number} onChange={set}
                        placeholder="12/345/67890"
                        helpText="Vom Finanzamt erteilte Steuernummer."
                    />
                    <Field
                        label="USt-IdNr." name="vat_id" value={form.vat_id} onChange={set}
                        placeholder="DE123456789"
                        helpText="Für EU-Geschäfte mit Reverse Charge."
                    />
                </div>
            </div>
        </div>,

        // Step 2 – Paket
        <div className="space-y-5" key="s2">
            <p className="text-sm text-slate-500">
                Wählen Sie Ihr Paket. Sie können jederzeit wechseln.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map(plan => {
                    const active = form.subscription_plan === plan.id;
                    return (
                        <button
                            key={plan.id} type="button"
                            onClick={() => setForm(p => ({ ...p, subscription_plan: plan.id }))}
                            className={clsx(
                                'relative text-left rounded-xl border-2 p-5 transition-all duration-200 outline-none group',
                                active
                                    ? 'border-brand-primary bg-brand-primary/[0.03]'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                            )}
                        >
                            {'badge' in plan && (
                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-[#9BCB56] text-brand-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {plan.badge}
                                </span>
                            )}
                            {active && (
                                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                                    <Check size={10} className="text-white" strokeWidth={3} />
                                </span>
                            )}
                            <p className="text-[9px] font-bold text-slate-400 mb-2">{plan.name}</p>
                            <div className="flex items-baseline gap-0.5 mb-1">
                                <span className="text-2xl font-black text-brand-primary">{plan.price}€</span>
                                <span className="text-[11px] text-slate-400 font-medium">/Mo.</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-4">{plan.hint}</p>
                            <ul className="space-y-1.5">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 font-medium">
                                        <Check size={9} className="text-[#9BCB56] shrink-0 mt-0.5" strokeWidth={3} />{f}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold text-slate-400 mb-3">Enterprise-Lizenz</p>
                <Field
                    label="Lizenzschlüssel (optional)" name="license_key" value={form.license_key} onChange={set}
                    placeholder="VBA-1234-XXXX-XXXX"
                    helpText="Enterprise-Features werden nach Eingabe automatisch freigeschaltet."
                />
            </div>
        </div>,
    ];

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-5xl rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden flex bg-white">

                {/* ── Left hero ──────────────────────────────────────────────── */}
                <div className="hidden lg:flex w-[38%] shrink-0 flex-col bg-brand-primary relative overflow-hidden">
                    {/* Decorative blobs */}
                    <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#9BCB56]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-1/2 -right-16 w-48 h-48 bg-white/4 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col h-full p-10">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-14">
                            <div className="w-9 h-9 rounded-lg bg-[#9BCB56]/20 border border-[#9BCB56]/30 flex items-center justify-center">
                                <span className="text-[#9BCB56] font-black text-sm leading-none">TO</span>
                            </div>
                            <div>
                                <p className="text-white font-black text-base leading-none">TransOffice</p>
                                <p className="text-[#9BCB56]/70 text-[9px] font-bold mt-0.5">Einrichtung</p>
                            </div>
                        </div>

                        {/* Headline */}
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-white leading-tight mb-3">
                                Ihr digitales Übersetzungsbüro wartet.
                            </h2>
                            <p className="text-sm text-white/50 leading-relaxed">
                                Wenige Angaben genügen — in 3 Schritten startklar.
                            </p>
                        </div>

                        {/* Feature list */}
                        <div className="space-y-5 flex-1">
                            {[
                                { icon: FileText, title: 'GoBD-konforme Rechnungen', desc: 'ZUGFeRD, DATEV-Export inklusive' },
                                { icon: Globe, title: 'Projekte & Kunden', desc: 'Von der Anfrage bis zur Rechnung' },
                                { icon: Users, title: 'Partner-Portal', desc: 'Übersetzer nahtlos einbinden' },
                            ].map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                                        <Icon size={15} className="text-[#9BCB56]" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold leading-none mb-1">{title}</p>
                                        <p className="text-white/40 text-[11px]">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="pt-8 border-t border-white/10 flex items-center gap-1.5">
                            <ShieldCheck size={12} className="text-[#9BCB56] shrink-0" />
                            <p className="text-[11px] text-white/30 leading-relaxed">
                                SSL-verschlüsselt · DSGVO-konform · Made in Germany
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Right form ─────────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col min-h-[700px]">

                    {/* Step bar */}
                    <div className="flex items-center px-10 pt-8 pb-6 gap-2">
                        {STEPS.map(({ label, icon: Icon }, i) => {
                            const done = i < step;
                            const active = i === step;
                            return (
                                <div key={i} className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className={clsx(
                                        'flex items-center gap-2 transition-all duration-300',
                                        active ? 'opacity-100' : done ? 'opacity-80' : 'opacity-35'
                                    )}>
                                        <div className={clsx(
                                            'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                                            done ? 'bg-[#9BCB56]' : active ? 'bg-brand-primary' : 'bg-slate-100'
                                        )}>
                                            {done
                                                ? <Check size={12} className="text-white" strokeWidth={3} />
                                                : <Icon size={12} className={active ? 'text-white' : 'text-slate-400'} />
                                            }
                                        </div>
                                        <span className={clsx(
                                            'text-[11px] font-bold whitespace-nowrap hidden sm:block',
                                            active ? 'text-brand-primary' : 'text-slate-400'
                                        )}>{label}</span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className="flex-1 h-px mx-2 transition-colors duration-300"
                                            style={{ background: done ? '#9BCB56' : '#e2e8f0' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto px-10 pb-4">

                        {/* Heading */}
                        <div className="mb-6">
                            <h1 className="text-xl font-bold text-slate-800">
                                {['Ihr Unternehmen', 'Bank & Steuern', 'Paket wählen'][step]}
                            </h1>
                            <p className="text-sm text-slate-400 mt-0.5">
                                {[
                                    'Stammdaten und Geschäftsadresse Ihrer Firma.',
                                    'Bankverbindung und steuerliche Angaben.',
                                    'Wählen Sie das passende Abonnement.',
                                ][step]}
                            </p>
                        </div>

                        {submitError && (
                            <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 font-medium">{submitError}</p>
                            </div>
                        )}

                        <div key={step} className="animate-fadeIn">
                            {stepContent[step]}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="px-10 py-6 border-t border-slate-100 flex items-center justify-between">
                        <button
                            type="button" onClick={back} disabled={step === 0}
                            className={clsx(
                                'flex items-center gap-1.5 text-xs font-bold   px-4 py-2.5 rounded-lg transition-all',
                                step === 0
                                    ? 'invisible'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            <ChevronLeft size={14} /> Zurück
                        </button>

                        <div className="flex items-center gap-3">
                            {/* mini dots */}
                            <div className="flex items-center gap-1">
                                {STEPS.map((_, i) => (
                                    <div key={i} className={clsx(
                                        'rounded-full transition-all duration-300',
                                        i === step ? 'w-4 h-1.5 bg-brand-primary'
                                            : i < step ? 'w-1.5 h-1.5 bg-[#9BCB56]'
                                                : 'w-1.5 h-1.5 bg-slate-200'
                                    )} />
                                ))}
                            </div>

                            {step < 2 ? (
                                <button
                                    type="button" onClick={next}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary/80 transition-colors group shadow-sm"
                                >
                                    Weiter <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    type="button" onClick={submit} disabled={loading}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#9BCB56] text-brand-primary text-xs font-black rounded-lg hover:brightness-105 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Wird eingerichtet…' : <><Rocket size={13} /> Jetzt starten</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
}
