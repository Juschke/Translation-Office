import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Building2, MapPin, CreditCard, Settings2,
    ChevronRight, ChevronLeft, Check, AlertCircle,
    Info, ShieldCheck, Rocket, Globe, FileText, Users
} from 'lucide-react';
import clsx from 'clsx';
// @ts-ignore
import finanzamt from 'finanzamt';
// @ts-ignore
import { normalizeSteuernummer } from 'normalize-steuernummer';

// ─── IBAN ───────────────────────────────────────────────────────────────────
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

// ─── Types ──────────────────────────────────────────────────────────────────
type FormData = {
    // Schritt 1
    company_name: string;
    legal_form: string;
    industry: string;
    founded_year: string;
    managing_director: string;
    website: string;
    // Schritt 2
    address_street: string;
    address_house_no: string;
    address_zip: string;
    address_city: string;
    address_country: string;
    // Schritt 3
    bank_name: string;
    bank_iban: string;
    bank_bic: string;
    tax_number: string;
    tax_office: string;
    vat_id: string;
    is_small_business: boolean;
    payment_term_days: string;
    currency: string;
    // Schritt 4
    project_id_prefix: string;
    invoice_prefix: string;
    default_languages: string[];
    email_signature: string;
    // Plan
    subscription_plan: string;
    license_key: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

// ─── Design Tokens (lokal) ───────────────────────────────────────────────────
const INPUT_CLS =
    'w-full h-9 px-3 text-sm border border-[#ccc] rounded-[3px] ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'outline-none transition-colors placeholder:text-slate-300 ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20';

const INPUT_ERROR_CLS =
    'w-full h-9 px-3 text-sm border border-red-400 rounded-[3px] ' +
    'bg-red-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'outline-none transition-colors placeholder:text-red-300 ' +
    'focus:border-red-500 focus:ring-1 focus:ring-red-400/20';

const SELECT_CLS =
    'w-full h-9 px-3 text-sm border border-[#ccc] rounded-[3px] ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'outline-none transition-colors cursor-pointer appearance-none ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20';

const LABEL_CLS = 'block text-xs font-semibold text-slate-600 mb-1';

const INFO_BOX_CLS =
    'bg-[#f6f8f8] border border-[#D1D9D8] rounded-[3px] px-4 py-3 ' +
    'flex items-start gap-3 text-xs text-slate-600 leading-relaxed';

const SECTION_TITLE_CLS = 'text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3';

const DIVIDER = <div className="border-t border-[#D1D9D8] my-5" />;

// ─── Chip-Auswahl ────────────────────────────────────────────────────────────
const ChipGroup = ({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
}) => (
    <div>
        <p className={LABEL_CLS}>{label}</p>
        <div className="flex flex-wrap gap-1.5">
            {options.map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt === value ? '' : opt)}
                    className={clsx(
                        'text-xs px-3 py-1.5 rounded-[3px] border transition-all font-medium',
                        value === opt
                            ? 'bg-[#1B4D4F] text-white border-[#123a3c]'
                            : 'border-[#ccc] text-slate-600 bg-gradient-to-b from-white to-[#f8f8f8] hover:border-[#1B4D4F] hover:text-[#1B4D4F]'
                    )}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

// ─── Field ───────────────────────────────────────────────────────────────────
const Field = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    required,
    helpText,
    type = 'text',
    className = '',
    error,
    autoComplete,
    onBlur,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    helpText?: string;
    type?: string;
    className?: string;
    error?: string;
    autoComplete?: string;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) => (
    <div className={clsx('flex flex-col', className)}>
        <label htmlFor={name} className={LABEL_CLS}>
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={error ? INPUT_ERROR_CLS : INPUT_CLS}
        />
        {error ? (
            <span className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                <AlertCircle size={10} className="shrink-0" />
                {error}
            </span>
        ) : helpText ? (
            <span className="flex items-start gap-1 text-[11px] text-slate-400 mt-1 leading-relaxed">
                <Info size={10} className="shrink-0 mt-px" />
                {helpText}
            </span>
        ) : null}
    </div>
);

// ─── SelectField ─────────────────────────────────────────────────────────────
const SelectField = ({
    label,
    name,
    value,
    onChange,
    options,
    className = '',
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    className?: string;
}) => (
    <div className={clsx('flex flex-col', className)}>
        <label htmlFor={name} className={LABEL_CLS}>
            {label}
        </label>
        <div className="relative">
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className={SELECT_CLS}
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    paddingRight: '28px',
                }}
            >
                {options.map(o => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    </div>
);

// ─── Konstanten ───────────────────────────────────────────────────────────────
const STEPS = [
    { label: 'Firmenprofil', icon: Building2 },
    { label: 'Adresse', icon: MapPin },
    { label: 'Finanzen', icon: CreditCard },
    { label: 'System', icon: Settings2 },
];

const LEGAL_FORMS = ['GmbH', 'UG', 'e.K.', 'GbR', 'Einzelunternehmen', 'AG', 'Freiberufler', 'Sonstige'];
const INDUSTRIES = ['Übersetzungsbüro', 'Dolmetscherbüro', 'Sprachdienstleister', 'Beeidigter Übersetzer', 'Sonstige'];

const COUNTRIES = [
    { value: 'Deutschland', label: 'Deutschland' },
    { value: 'Österreich', label: 'Österreich' },
    { value: 'Schweiz', label: 'Schweiz' },
    { value: 'Luxemburg', label: 'Luxemburg' },
    { value: 'Frankreich', label: 'Frankreich' },
    { value: 'Italien', label: 'Italien' },
    { value: 'Spanien', label: 'Spanien' },
    { value: 'Niederlande', label: 'Niederlande' },
    { value: 'Belgien', label: 'Belgien' },
    { value: 'Polen', label: 'Polen' },
    { value: 'USA', label: 'USA' },
    { value: 'Andere', label: 'Andere' },
];

const PAYMENT_TERMS = [
    { value: '0', label: 'Sofort fällig' },
    { value: '7', label: '7 Tage' },
    { value: '14', label: '14 Tage' },
    { value: '30', label: '30 Tage' },
    { value: '45', label: '45 Tage' },
];

const CURRENCIES = [
    { value: 'EUR', label: 'EUR — Euro' },
    { value: 'CHF', label: 'CHF — Schweizer Franken' },
    { value: 'USD', label: 'USD — US-Dollar' },
];

const LANGUAGE_PAIRS = [
    'DE↔EN', 'DE↔FR', 'DE↔PL', 'DE↔TR',
    'DE↔RU', 'DE↔AR', 'DE↔IT', 'DE↔ES',
];

// ─── Step Left Panel Content ─────────────────────────────────────────────────
const LEFT_PANEL = [
    {
        icon: Building2,
        title: 'Firmenprofil\nanlegen',
        subtitle: 'Grunddaten Ihres Unternehmens',
        body: 'Ihre Stammdaten sind die Basis für alle Dokumente im System. Diese Angaben erscheinen automatisch auf Rechnungen, Angeboten und Lieferscheinen.',
        bullets: [
            'Firmenname und Rechtsform für den Briefkopf',
            'Branche für vorausgefüllte Vorlagen',
            'Alle Daten jederzeit unter Einstellungen → Unternehmen ändern',
        ],
    },
    {
        icon: MapPin,
        title: 'Rechnungs-\nadresse',
        subtitle: 'Geschäftsanschrift & Impressum',
        body: 'Die Geschäftsadresse erscheint im Rechnungskopf und im Impressum Ihres Kundenzugangs. Bei EU-Rechnungen prüft das System automatisch Reverse-Charge-Pflichten.',
        bullets: [
            'Pflichtangabe für steuerlich korrekte Rechnungen',
            'Automatische Befüllung der Stadt anhand der PLZ',
            'Kann für Rechnungsadresse des Kunden abweichen',
        ],
    },
    {
        icon: CreditCard,
        title: 'Finanzen &\nCompliance',
        subtitle: 'Bankdaten, Steuernummern, GoBD',
        body: 'Für GoBD-konforme Rechnungen und den DATEV-Export werden Bankverbindung und Steuerdaten benötigt. Diese Angaben sind optional — können aber später nicht automatisch ergänzt werden.',
        bullets: [
            'IBAN erscheint auf jeder Ausgangsrechnung',
            'Steuernummer für Inlandsrechnungen erforderlich',
            'USt-IdNr. für EU-Auslandsgeschäfte (Reverse Charge)',
            'Kleinunternehmer-Regelung §19 UStG unterstützt',
        ],
    },
    {
        icon: Settings2,
        title: 'System-\nkonfiguration',
        subtitle: 'Nummerierung, Sprachen, Signatur',
        body: 'Legen Sie jetzt Präfixe für Projektnummern und Rechnungen fest. Diese können später nicht mehr ohne Datenverlust geändert werden — wählen Sie sorgfältig.',
        bullets: [
            'Projekt-Präfix: z.B. "PR" → PR-2026-0001',
            'Rechnungs-Präfix: z.B. "RE" → RE-2026-0001',
            'Vorausgefüllte Sprachpaare als Master-Daten',
        ],
    },
];

// ─── Main ────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const { onboard } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Errors>({});
    const [zipLoading, setZipLoading] = useState(false);

    const [form, setForm] = useState<FormData>({
        company_name: '',
        legal_form: '',
        industry: '',
        founded_year: '',
        managing_director: '',
        website: '',
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
        is_small_business: false,
        payment_term_days: '30',
        currency: 'EUR',
        project_id_prefix: 'PR',
        invoice_prefix: 'RE',
        default_languages: [],
        email_signature: '',
        subscription_plan: 'pro',
        license_key: '',
    });

    // ─── Helpers ─────────────────────────────────────────────────────────────
    const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    const setField = (key: keyof FormData, value: string | boolean | string[]) => {
        setForm(p => ({ ...p, [key]: value }));
        if (errors[key]) setErrors(p => { const c = { ...p }; delete c[key]; return c; });
    };

    // Update signature when company data changes
    const updateSignature = (companyName: string, street: string, houseNo: string, zip: string, city: string) => {
        const addr = [street && houseNo ? `${street} ${houseNo}` : street, zip && city ? `${zip} ${city}` : city]
            .filter(Boolean).join(', ');
        const sig = `Mit freundlichen Grüßen\n${companyName || '[Firmenname]'}\n${addr || '[Adresse]'}`;
        setForm(p => ({ ...p, email_signature: sig }));
    };

    // ─── PLZ Auto-Erkennung ───────────────────────────────────────────────────
    const handleZipBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const zip = e.target.value.trim();
        if (zip.length !== 5 || !/^\d{5}$/.test(zip)) return;
        if (form.address_city) return; // already filled
        setZipLoading(true);
        try {
            const res = await fetch(`https://openplzapi.org/de/Localities?postalCode=${zip}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const city = data[0].name as string;
                setForm(p => ({ ...p, address_city: city }));
                toast.success(`Stadt automatisch erkannt: ${city}`);
            }
        } catch {
            // silent fail
        } finally {
            setZipLoading(false);
        }
    };

    // ─── Steuernummer Auto-Erkennung ─────────────────────────────────────────
    const handleTaxNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const raw = e.target.value.trim();
        if (!raw || form.tax_office) return;
        try {
            const normalized = normalizeSteuernummer(raw, { state: 'BE' });
            if (normalized) {
                const result = finanzamt(normalized);
                if (result && result.name) {
                    setForm(p => ({ ...p, tax_office: result.name }));
                    toast.success(`Finanzamt erkannt: ${result.name}`);
                }
            }
        } catch {
            // silent fail — user can type manually
        }
    };

    // ─── Validation ───────────────────────────────────────────────────────────
    const validate = (): Errors => {
        const e: Errors = {};
        if (step === 0) {
            if (!form.company_name.trim()) e.company_name = 'Firmenname ist erforderlich.';
        }
        if (step === 1) {
            if (!form.address_street.trim()) e.address_street = 'Straße ist erforderlich.';
            if (!form.address_house_no.trim()) e.address_house_no = 'Hausnummer ist erforderlich.';
            if (!form.address_zip.trim()) e.address_zip = 'PLZ ist erforderlich.';
            if (!form.address_city.trim()) e.address_city = 'Stadt ist erforderlich.';
        }
        if (step === 2 && form.bank_iban && !isValidIBAN(form.bank_iban)) {
            e.bank_iban = 'Ungültige IBAN (z. B. DE89 3704 0044 0532 0130 00).';
        }
        return e;
    };

    const next = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        if (step === 1) {
            // Update signature when address is confirmed
            updateSignature(form.company_name, form.address_street, form.address_house_no, form.address_zip, form.address_city);
        }
        setStep(s => Math.min(s + 1, 3));
    };

    const back = () => { setErrors({}); setStep(s => Math.max(s - 1, 0)); };

    const submit = async () => {
        setLoading(true);
        setSubmitError(null);
        try {
            await onboard({
                ...form,
                bank_iban: form.bank_iban.replace(/\s+/g, ''),
            });
            navigate('/');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setSubmitError(
                apiErr.response?.data?.message ??
                'Einrichtung fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben.'
            );
        } finally {
            setLoading(false);
        }
    };

    const toggleLanguage = (lang: string) => {
        setForm(p => ({
            ...p,
            default_languages: p.default_languages.includes(lang)
                ? p.default_languages.filter(l => l !== lang)
                : [...p.default_languages, lang],
        }));
    };

    // ─── Step 1: Firmenprofil ─────────────────────────────────────────────────
    const step0 = (
        <div className="space-y-5" key="s0">
            <div>
                <p className={SECTION_TITLE_CLS}>Firmenstammdaten</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        label="Firmenname"
                        name="company_name"
                        value={form.company_name}
                        onChange={set}
                        placeholder="z. B. Lingua Franca GmbH"
                        required
                        className="col-span-2"
                        error={errors.company_name}
                        autoComplete="organization"
                    />
                    <div className="col-span-2">
                        <ChipGroup
                            label="Rechtsform"
                            options={LEGAL_FORMS}
                            value={form.legal_form}
                            onChange={v => setField('legal_form', v)}
                        />
                    </div>
                    <div className="col-span-2">
                        <ChipGroup
                            label="Branche"
                            options={INDUSTRIES}
                            value={form.industry}
                            onChange={v => setField('industry', v)}
                        />
                    </div>
                    <Field
                        label="Gründungsjahr"
                        name="founded_year"
                        value={form.founded_year}
                        onChange={set}
                        placeholder="z. B. 2015"
                        type="number"
                    />
                    <Field
                        label="Geschäftsführer / Inhaber"
                        name="managing_director"
                        value={form.managing_director}
                        onChange={set}
                        placeholder="z. B. Maria Müller"
                        autoComplete="name"
                    />
                    <Field
                        label="Website"
                        name="website"
                        value={form.website}
                        onChange={set}
                        placeholder="https://www.beispiel.de"
                        className="col-span-2"
                        type="url"
                    />
                </div>
            </div>

            {DIVIDER}

            <div className={INFO_BOX_CLS}>
                <Info size={14} className="text-[#1B4D4F] shrink-0 mt-0.5" />
                <span>
                    Diese Angaben erscheinen auf Rechnungen, Angeboten und Briefköpfen.
                    Sie können alle Daten später unter{' '}
                    <strong>Einstellungen → Unternehmen</strong> anpassen.
                </span>
            </div>
        </div>
    );

    // ─── Step 2: Adresse ──────────────────────────────────────────────────────
    const step1 = (
        <div className="space-y-5" key="s1">
            <div>
                <p className={SECTION_TITLE_CLS}>Geschäftsadresse</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectField
                        label="Land"
                        name="address_country"
                        value={form.address_country}
                        onChange={set}
                        options={COUNTRIES}
                        className="col-span-2"
                    />
                    <Field
                        label="Straße"
                        name="address_street"
                        value={form.address_street}
                        onChange={set}
                        placeholder="Musterstraße"
                        required
                        error={errors.address_street}
                        autoComplete="street-address"
                    />
                    <Field
                        label="Hausnummer"
                        name="address_house_no"
                        value={form.address_house_no}
                        onChange={set}
                        placeholder="12 a"
                        required
                        error={errors.address_house_no}
                    />
                    <Field
                        label="Postleitzahl"
                        name="address_zip"
                        value={form.address_zip}
                        onChange={set}
                        onBlur={handleZipBlur}
                        placeholder="10115"
                        required
                        error={errors.address_zip}
                        autoComplete="postal-code"
                        helpText={zipLoading ? 'Stadt wird ermittelt…' : undefined}
                    />
                    <Field
                        label="Stadt"
                        name="address_city"
                        value={form.address_city}
                        onChange={set}
                        placeholder="Berlin"
                        required
                        error={errors.address_city}
                        autoComplete="address-level2"
                    />
                </div>
            </div>

            {DIVIDER}

            <div className={INFO_BOX_CLS}>
                <Info size={14} className="text-[#1B4D4F] shrink-0 mt-0.5" />
                <span>
                    Die Geschäftsadresse wird für Rechnungsköpfe und das Impressum verwendet.
                    Bei Übereinstimmung mit der Rechnungsadresse des Kunden wird automatisch
                    auf <strong>Reverse-Charge</strong> hingewiesen.
                </span>
            </div>
        </div>
    );

    // ─── Step 3: Finanzen & Steuern ───────────────────────────────────────────
    const step2 = (
        <div className="space-y-5" key="s2">
            {/* Info-Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-[3px] px-4 py-3 flex items-start gap-3">
                <ShieldCheck size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    Diese Angaben sind <strong>optional</strong>, werden aber für
                    GoBD-konforme Rechnungen und den DATEV-Export benötigt.
                    Sie können alle Felder auch später unter{' '}
                    <em>Einstellungen → Unternehmen</em> ergänzen.
                </p>
            </div>

            {/* Bankverbindung */}
            <div>
                <p className={SECTION_TITLE_CLS}>Bankverbindung</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        label="Kreditinstitut"
                        name="bank_name"
                        value={form.bank_name}
                        onChange={set}
                        placeholder="z. B. Sparkasse Berlin"
                        className="col-span-2"
                    />
                    <Field
                        label="IBAN"
                        name="bank_iban"
                        value={form.bank_iban}
                        onChange={set}
                        placeholder="DE89 3704 0044 0532 0130 00"
                        className="col-span-2"
                        error={errors.bank_iban}
                        helpText="Wird auf Rechnungen angezeigt. Automatische Formatierung aktiv."
                    />
                    <Field
                        label="BIC / SWIFT"
                        name="bank_bic"
                        value={form.bank_bic}
                        onChange={set}
                        placeholder="COBADEFFXXX"
                    />
                </div>
            </div>

            {DIVIDER}

            {/* Steuerdaten */}
            <div>
                <p className={SECTION_TITLE_CLS}>Steuerdaten</p>

                {/* Kleinunternehmer Toggle */}
                <div className="mb-4 p-3 border border-[#D1D9D8] rounded-[3px] bg-[#f6f8f8] flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-slate-700">
                            Kleinunternehmerregelung §19 UStG
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Ich bin nach §19 UStG steuerbefreit (Kleinunternehmer)
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setField('is_small_business', !form.is_small_business)}
                        className={clsx(
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors',
                            form.is_small_business
                                ? 'bg-[#1B4D4F] border-[#1B4D4F]'
                                : 'bg-slate-200 border-slate-200'
                        )}
                        role="switch"
                        aria-checked={form.is_small_business}
                    >
                        <span
                            className={clsx(
                                'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                                form.is_small_business ? 'translate-x-4' : 'translate-x-0'
                            )}
                        />
                    </button>
                </div>

                {form.is_small_business && (
                    <div className={clsx(INFO_BOX_CLS, 'mb-4')}>
                        <Info size={14} className="text-[#1B4D4F] shrink-0 mt-0.5" />
                        <span>
                            Als Kleinunternehmer werden Ihre Rechnungen <strong>ohne Umsatzsteuer</strong> ausgestellt.
                            Es wird automatisch der §19-UStG-Hinweis eingefügt.
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        label="Steuernummer"
                        name="tax_number"
                        value={form.tax_number}
                        onChange={set}
                        onBlur={handleTaxNumberBlur}
                        placeholder="12/345/67890"
                        helpText="Automatische Finanzamt-Erkennung beim Verlassen des Feldes."
                    />
                    <Field
                        label="Zuständiges Finanzamt"
                        name="tax_office"
                        value={form.tax_office}
                        onChange={set}
                        placeholder="z. B. Finanzamt Berlin-Mitte"
                        helpText="Wird automatisch aus der Steuernummer ermittelt."
                    />
                    {!form.is_small_business && (
                        <Field
                            label="USt-IdNr."
                            name="vat_id"
                            value={form.vat_id}
                            onChange={set}
                            placeholder="DE123456789"
                            className="col-span-2"
                            helpText="Nur für Unternehmen mit Umsatzsteuerpflicht. Steuerbefreite Übersetzer lassen dieses Feld leer."
                        />
                    )}
                </div>
            </div>

            {DIVIDER}

            {/* Rechnungs-Einstellungen */}
            <div>
                <p className={SECTION_TITLE_CLS}>Rechnungs-Einstellungen</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectField
                        label="Zahlungsziel"
                        name="payment_term_days"
                        value={form.payment_term_days}
                        onChange={set}
                        options={PAYMENT_TERMS}
                    />
                    <SelectField
                        label="Bevorzugte Währung"
                        name="currency"
                        value={form.currency}
                        onChange={set}
                        options={CURRENCIES}
                    />
                </div>
            </div>
        </div>
    );

    // ─── Step 4: Systemkonfiguration ─────────────────────────────────────────
    const step3 = (
        <div className="space-y-5" key="s3">
            {/* Nummerierung */}
            <div>
                <p className={SECTION_TITLE_CLS}>Nummerierung</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        label="Projekt-ID Präfix"
                        name="project_id_prefix"
                        value={form.project_id_prefix}
                        onChange={set}
                        placeholder="PR"
                        helpText={`z.B. 'PR' → PR-${new Date().getFullYear()}-0001. Erscheint auf allen Projekten.`}
                    />
                    <Field
                        label="Rechnungs-Präfix"
                        name="invoice_prefix"
                        value={form.invoice_prefix}
                        onChange={set}
                        placeholder="RE"
                        helpText={`z.B. 'RE' → RE-${new Date().getFullYear()}-0001`}
                    />
                </div>
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-[3px] px-3 py-2 flex items-start gap-2">
                    <AlertCircle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800">
                        Präfixe können nach Anlegen erster Datensätze nicht mehr ohne Datenverlust geändert werden.
                    </p>
                </div>
            </div>

            {DIVIDER}

            {/* Sprachpaare */}
            <div>
                <p className={SECTION_TITLE_CLS}>Hauptsächlich genutzte Sprachpaare</p>
                <p className="text-[11px] text-slate-500 mb-3">
                    Gewählte Paare werden nach Abschluss als Master-Daten angelegt.
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {LANGUAGE_PAIRS.map(lang => {
                        const active = form.default_languages.includes(lang);
                        return (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => toggleLanguage(lang)}
                                className={clsx(
                                    'text-xs px-3 py-1.5 rounded-[3px] border font-mono font-medium transition-all',
                                    active
                                        ? 'bg-[#1B4D4F] text-white border-[#123a3c]'
                                        : 'border-[#ccc] text-slate-600 bg-gradient-to-b from-white to-[#f8f8f8] hover:border-[#1B4D4F] hover:text-[#1B4D4F]'
                                )}
                            >
                                {active && <Check size={10} className="inline mr-1" strokeWidth={3} />}
                                {lang}
                            </button>
                        );
                    })}
                </div>
            </div>

            {DIVIDER}

            {/* E-Mail-Signatur */}
            <div>
                <p className={SECTION_TITLE_CLS}>E-Mail-Signatur (Vorschau)</p>
                <div className="flex flex-col">
                    <label htmlFor="email_signature" className={LABEL_CLS}>
                        Standardsignatur für ausgehende E-Mails
                    </label>
                    <textarea
                        id="email_signature"
                        name="email_signature"
                        value={form.email_signature}
                        onChange={set}
                        rows={4}
                        className={clsx(
                            'w-full px-3 py-2 text-sm border border-[#ccc] rounded-[3px] font-mono',
                            'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
                            'outline-none resize-none transition-colors',
                            'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20'
                        )}
                        placeholder={'Mit freundlichen Grüßen\n[Firmenname]\n[Adresse]'}
                    />
                    <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Info size={10} />
                        Basiert auf Ihren Firmendaten aus Schritt 1 und 2.
                    </span>
                </div>
            </div>

            {DIVIDER}

            {/* Nächste Schritte */}
            <div>
                <p className={SECTION_TITLE_CLS}>Nach dem Einrichten empfohlen</p>
                <div className="bg-[#f6f8f8] border border-[#D1D9D8] rounded-[3px] divide-y divide-[#D1D9D8]">
                    {[
                        {
                            icon: FileText,
                            title: 'Logo hochladen',
                            path: 'Einstellungen → Unternehmen',
                        },
                        {
                            icon: Globe,
                            title: 'E-Mail-Konto verknüpfen',
                            path: 'Einstellungen → Unternehmen → E-Mail',
                        },
                        {
                            icon: Users,
                            title: 'Übersetzer einladen',
                            path: 'Team → Mitglieder einladen',
                        },
                    ].map(({ icon: Icon, title, path }) => (
                        <div key={title} className="flex items-center gap-3 px-4 py-3">
                            <div className="w-7 h-7 rounded-[3px] bg-[#1B4D4F]/10 flex items-center justify-center shrink-0">
                                <Icon size={13} className="text-[#1B4D4F]" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700">{title}</p>
                                <p className="text-[11px] text-slate-400">{path}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const stepContent = [step0, step1, step2, step3];

    const panel = LEFT_PANEL[step];
    const PanelIcon = panel.icon;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-5xl border border-[#D1D9D8] rounded-sm shadow-[0_2px_12px_rgba(0,0,0,0.10)] overflow-hidden flex bg-white">

                {/* ── Linke Spalte ──────────────────────────────────────────── */}
                <div className="hidden lg:flex w-[35%] shrink-0 flex-col bg-[#1B4D4F] relative overflow-hidden">
                    {/* Decorative */}
                    <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/[0.03] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#9BCB56]/[0.06] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col h-full px-8 py-8">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5 mb-10">
                            <div className="w-8 h-8 rounded-[3px] bg-[#9BCB56]/20 border border-[#9BCB56]/30 flex items-center justify-center">
                                <span className="text-[#9BCB56] font-black text-sm leading-none">TO</span>
                            </div>
                            <div>
                                <p className="text-white font-black text-sm leading-none tracking-tight">TransOffice</p>
                                <p className="text-[#9BCB56]/60 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Einrichtungsassistent</p>
                            </div>
                        </div>

                        {/* Step icon */}
                        <div className="w-12 h-12 rounded-[3px] bg-white/10 border border-white/10 flex items-center justify-center mb-5">
                            <PanelIcon size={22} className="text-[#9BCB56]" />
                        </div>

                        {/* Headline */}
                        <h2 className="text-xl font-black text-white leading-tight tracking-tight mb-2 whitespace-pre-line">
                            {panel.title}
                        </h2>
                        <p className="text-xs font-semibold text-[#9BCB56]/80 uppercase tracking-wider mb-4">
                            {panel.subtitle}
                        </p>
                        <p className="text-sm text-white/50 leading-relaxed mb-7">
                            {panel.body}
                        </p>

                        {/* Bullets */}
                        <div className="space-y-3 flex-1">
                            {panel.bullets.map(b => (
                                <div key={b} className="flex items-start gap-2.5">
                                    <div className="w-4 h-4 rounded-[2px] bg-[#9BCB56]/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={9} className="text-[#9BCB56]" strokeWidth={3} />
                                    </div>
                                    <p className="text-[12px] text-white/60 leading-relaxed">{b}</p>
                                </div>
                            ))}
                        </div>

                        {/* Fortschrittsanzeige */}
                        <div className="pt-6 border-t border-white/10">
                            <div className="flex items-center gap-1 mb-2">
                                {STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={clsx(
                                            'h-1 flex-1 rounded-full transition-all duration-300',
                                            i < step ? 'bg-[#9BCB56]'
                                                : i === step ? 'bg-white'
                                                    : 'bg-white/20'
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="text-[11px] text-white/30">
                                Schritt {step + 1} von {STEPS.length}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-1.5 mt-4">
                            <ShieldCheck size={11} className="text-[#9BCB56] shrink-0" />
                            <p className="text-[10px] text-white/25">
                                SSL-verschlüsselt · DSGVO-konform · Made in Germany
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Rechte Spalte ─────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col min-h-[680px]">

                    {/* Step-Indicator */}
                    <div className="flex items-center px-10 pt-7 pb-5 border-b border-[#D1D9D8] gap-1">
                        {STEPS.map(({ label, icon: Icon }, i) => {
                            const done = i < step;
                            const active = i === step;
                            return (
                                <div key={i} className="flex items-center gap-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={clsx(
                                            'w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200',
                                            done ? 'bg-[#9BCB56] border-[#7aaa3a]'
                                                : active ? 'bg-[#1B4D4F] border-[#123a3c]'
                                                    : 'bg-white border-[#ccc]'
                                        )}>
                                            {done
                                                ? <Check size={10} className="text-white" strokeWidth={3} />
                                                : <Icon size={11} className={active ? 'text-white' : 'text-slate-400'} />
                                            }
                                        </div>
                                        <span className={clsx(
                                            'text-[11px] font-semibold whitespace-nowrap hidden md:block',
                                            active ? 'text-[#1B4D4F]'
                                                : done ? 'text-[#7aaa3a]'
                                                    : 'text-slate-400'
                                        )}>{label}</span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div
                                            className="flex-1 h-px mx-2 transition-colors duration-300"
                                            style={{ background: done ? '#9BCB56' : '#D1D9D8' }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Heading */}
                    <div className="px-10 pt-6 pb-2">
                        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                            {['Ihr Unternehmen', 'Geschäftsadresse', 'Finanzen & Steuern', 'Systemkonfiguration'][step]}
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {[
                                'Stammdaten, Rechtsform und Branche Ihrer Firma.',
                                'Ihre Geschäftsanschrift für Rechnungsköpfe und Impressum.',
                                'Bankverbindung, Steuerdaten und Rechnungseinstellungen.',
                                'Nummerierung, Sprachpaare und E-Mail-Signatur.',
                            ][step]}
                        </p>
                    </div>

                    {/* Fehler */}
                    {submitError && (
                        <div className="mx-10 mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-[3px] px-4 py-3">
                            <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 font-medium">{submitError}</p>
                        </div>
                    )}

                    {/* Formular */}
                    <div className="flex-1 overflow-y-auto px-10 py-5">
                        <div key={step} className="onboarding-fade">
                            {stepContent[step]}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="px-10 py-5 border-t border-[#D1D9D8] flex items-center justify-between">
                        {step === 0 ? (
                            <div />
                        ) : (
                            <button
                                type="button"
                                onClick={back}
                                className={clsx(
                                    'flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-[3px] border transition-all',
                                    'border-[#ccc] text-slate-600 bg-gradient-to-b from-white to-[#f5f5f5]',
                                    'hover:border-[#aaa] hover:text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                                )}
                            >
                                <ChevronLeft size={13} /> Zurück
                            </button>
                        )}

                        <div className="flex items-center gap-3">
                            {/* Dots */}
                            <div className="flex items-center gap-1">
                                {STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={clsx(
                                            'rounded-full transition-all duration-300',
                                            i === step ? 'w-4 h-1.5 bg-[#1B4D4F]'
                                                : i < step ? 'w-1.5 h-1.5 bg-[#9BCB56]'
                                                    : 'w-1.5 h-1.5 bg-slate-200'
                                        )}
                                    />
                                ))}
                            </div>

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={next}
                                    className={clsx(
                                        'flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-[3px] border transition-all',
                                        'bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#123a3c]',
                                        'shadow-[0_1px_3px_rgba(0,0,0,0.18)] hover:brightness-110 active:brightness-90'
                                    )}
                                >
                                    Weiter <ChevronRight size={13} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={submit}
                                    disabled={loading}
                                    className={clsx(
                                        'flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-[3px] border transition-all',
                                        'bg-gradient-to-b from-[#a8d95f] to-[#9BCB56] text-[#1B4D4F] border-[#7aaa3a]',
                                        'shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:brightness-105 active:brightness-90',
                                        'disabled:opacity-60 disabled:cursor-not-allowed'
                                    )}
                                >
                                    {loading
                                        ? 'Wird eingerichtet…'
                                        : <><Rocket size={13} /> Einrichtung abschließen</>
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes onboardFade {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .onboarding-fade { animation: onboardFade 0.25s ease-out forwards; }
            `}</style>
        </div>
    );
}
