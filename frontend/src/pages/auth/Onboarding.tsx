import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Building2, MapPin, CreditCard, Settings2,
    ChevronRight, ChevronLeft, Check, AlertCircle,
    Info, ShieldCheck, Rocket
} from 'lucide-react';
import clsx from 'clsx';
// @ts-ignore
import finanzamt from 'finanzamt';
// @ts-ignore
import { normalizeSteuernummer } from 'normalize-steuernummer';
import { Select, AutoComplete } from 'antd';
import { IMaskInput } from 'react-imask';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import CountrySelect from '../../components/common/CountrySelect';
import taxOfficesData from '../../data/tax_offices.json';

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
    managing_director: string;
    legal_form: string;
    industry: string;
    phone: string;
    mobile: string;
    email: string;
    website: string;
    website_protocol: string;
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
    bank_code: string;
    bank_account_holder: string;
    tax_number: string;
    tax_office: string;
    vat_id: string;
    is_small_business: boolean;
    payment_term_days: string;
    currency: string;
    // Schritt 4
    project_id_prefix: string;
    invoice_prefix: string;
    quote_prefix: string;
    customer_prefix: string;
    vendor_prefix: string;
    system_language: string;
    system_timezone: string;
    email_signature: string;
    company_logo: string | null;
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

// ─── SearchSelect ────────────────────────────────────────────────────────────
const SearchSelect = ({
    label,
    options,
    value,
    onChange,
    placeholder,
    className = '',
    error,
    required = false,
}: {
    label: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
    required?: boolean;
}) => (
    <div className={clsx('flex flex-col', className)}>
        <label className={LABEL_CLS}>
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <Select
            showSearch
            placeholder={placeholder}
            optionFilterProp="children"
            onChange={onChange}
            value={value || undefined}
            className={clsx('w-full ant-select-custom', error && 'ant-select-error')}
            style={{ height: '36px' }}
            dropdownStyle={{ borderRadius: '3px' }}
        >
            {options.map(opt => (
                <Select.Option key={opt} value={opt}>
                    {opt}
                </Select.Option>
            ))}
        </Select>
        {error && (
            <span className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                <AlertCircle size={10} className="shrink-0" />
                {error}
            </span>
        )}
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

const LANGUAGES_OPTIONS = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
];

const TIMEZONES_OPTIONS = [
    { value: 'Europe/Berlin', label: '(GMT+01:00) Berlin' },
    { value: 'Europe/London', label: '(GMT+00:00) London' },
    { value: 'Europe/Paris', label: '(GMT+01:00) Paris' },
    { value: 'Europe/Zurich', label: '(GMT+01:00) Zürich' },
    { value: 'Europe/Vienna', label: '(GMT+01:00) Wien' },
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
        subtitle: 'Sprache, Zeitzone, Signatur',
        body: 'Legen Sie die grundlegenden Systemeinstellungen für Ihr Büro fest. Diese können Sie jederzeit in den Einstellungen anpassen.',
        bullets: [
            'Standardsprache für die Benutzeroberfläche',
            'Zeitzone für korrekte Deadline-Berechnungen',
            'Vorausgefüllte E-Mail-Signatur für Dokumente',
        ],
    },
];

// ─── Main ────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const { onboard } = useAuth();
    const navigate = useNavigate();
    const detectFinanzamt = (city: string) => {
        if (!city) return '';
        const lowerCity = city.toLowerCase();
        const found = taxOfficesData.find((fa: any) => 
            fa.ort.toLowerCase() === lowerCity || 
            fa.name.toLowerCase().includes(lowerCity)
        );
        return found ? `Finanzamt ${found.name}` : '';
    };
 
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setForm(p => ({ ...p, company_logo: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const [step, setStep] = useState(0);
    const searchCache = useRef<Record<string, any>>({});
    const searchTimeout = useRef<any>(null);
    const [streetOptions, setStreetOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Errors>({});


    const handleIbanAutoDetect = async (iban: string) => {
        const clean = iban.replace(/\s/g, '');
        if (clean.length < 15) {
            // Optional: clear if too short? 
            // User said "wenn ausgetauscht", so maybe only when we have a result.
            return;
        }
        try {
            const res = await fetch(`https://openiban.com/validate/${clean}?getBIC=true&validateBankCode=true`);
            const data = await res.json();
            
            setForm(p => ({
                ...p,
                bank_name: data.valid ? (data.bankData?.name || '') : '',
                bank_bic: data.valid ? (data.bankData?.bic || '') : '',
                bank_code: data.valid ? (data.bankData?.bankCode || '') : ''
            }));

            if (data.valid && data.bankData?.name) {
                toast.success(`Bank erkannt: ${data.bankData.name}`);
            }
        } catch (e) {
            console.error('IBAN AutoDetect Error:', e);
            // On error, clear to be safe
            setForm(p => ({ ...p, bank_name: '', bank_bic: '', bank_code: '' }));
        }
    };

    const [zipLoading, setZipLoading] = useState(false);

    const [form, setForm] = useState<FormData>({
        company_name: '',
        managing_director: '',
        legal_form: '',
        industry: '',
        phone: '',
        mobile: '',
        email: '',
        website: '',
        website_protocol: 'https://',
        address_street: '',
        address_house_no: '',
        address_zip: '',
        address_city: '',
        address_country: 'Deutschland',
        bank_name: '',
        bank_iban: '',
        bank_bic: '',
        bank_code: '',
        bank_account_holder: '',
        tax_number: '',
        tax_office: '',
        vat_id: '',
        is_small_business: false,
        payment_term_days: '30',
        currency: 'EUR',
        project_id_prefix: 'PR',
        invoice_prefix: 'RE',
        quote_prefix: 'AN',
        customer_prefix: 'KD',
        vendor_prefix: 'KP',
        system_language: 'de',
        system_timezone: 'Europe/Berlin',
        email_signature: '',
        company_logo: null,
        subscription_plan: 'pro',
        license_key: '',
    });

    // Auto-detect Finanzamt when entering Finance step
    useEffect(() => {
        if (step === 2 && form.address_city && !form.tax_office) {
            const fa = detectFinanzamt(form.address_city);
            if (fa) setForm(p => ({ ...p, tax_office: fa }));
        }
    }, [step, form.address_city, detectFinanzamt]);

    // ─── Helpers ─────────────────────────────────────────────────────────────
    const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const key = name as keyof FormData;
        if (key === 'address_zip') {
            const v = value.replace(/\D/g, '').substring(0, 5);
            setForm(p => ({ ...p, address_zip: v }));
            if (v.length === 5) handleZipAutoDetect(v);
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


    const handleZipAutoDetect = async (zip: string) => {
        if (zip.length !== 5) return;
        setZipLoading(true);
        try {
            const res = await fetch(`https://openplzapi.org/de/Localities?postalCode=${zip}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const city = data[0].name as string;
                setForm(p => ({ 
                    ...p, 
                    address_city: city,
                    tax_office: detectFinanzamt(city) || p.tax_office
                }));
                toast.success(`Stadt erkannt: ${city}`);
            }
        } catch {
            // silent fail
        } finally {
            setZipLoading(false);
        }
    };

    const fetchStreetSuggestions = (searchText: string) => {
        if (searchText.length < 3) {
            setStreetOptions([]);
            return;
        }

        // Check Cache immediately (no debounce for cached hits)
        if (searchCache.current[searchText]) {
            setStreetOptions(searchCache.current[searchText]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        
        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&addressdetails=1&countrycodes=de,at,ch,lu&limit=10`
                );
                const data = await res.json();
                const suggestions = data
                    .filter((item: any) => item.address?.road)
                    .map((item: any) => ({
                        value: `${item.address.road}|${item.address.postcode || ''}|${item.address.city || item.address.town || item.address.village || ''}|${item.address.country || ''}`,
                        label: `${item.address.road}${item.address.postcode ? ', ' + item.address.postcode : ''} ${item.address.city || item.address.town || item.address.village || ''}${item.address.country ? ' (' + item.address.country + ')' : ''}`,
                        street: item.address.road || '',
                        zip: item.address.postcode || '',
                        city: item.address.city || item.address.town || item.address.village || '',
                        country: item.address.country || ''
                    }));
                
                // Remove duplicates by label
                const unique = suggestions.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.label === v.label) === i);
                
                searchCache.current[searchText] = unique;
                setStreetOptions(unique);
            } catch { /* silent */ }
        }, 400); // 400ms delay
    };

    const handleStreetSelect = (val: string, option: any) => {
        const city = option.city || '';
        const street = option.street || '';
        setForm(p => ({
            ...p,
            address_street: street || p.address_street,
            address_zip: option.zip || p.address_zip,
            address_city: city || p.address_city,
            address_country: option.country || p.address_country,
            tax_office: (city ? detectFinanzamt(city) : '') || p.tax_office
        }));
        
        // Clear errors for auto-filled fields
        setErrors(p => {
            const e = { ...p };
            delete e.address_street;
            if (option.zip) delete e.address_zip;
            if (option.city) delete e.address_city;
            return e;
        });
    };

    // ─── Steuernummer Auto-Erkennung ─────────────────────────────────────────
    const handleTaxNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const raw = e.target.value.trim();
        if (!raw) return;
        try {
            const normalized = normalizeSteuernummer(raw);
            if (normalized) {
                const result = finanzamt(normalized);
                if (result && result.name) {
                    setForm(p => ({ 
                        ...p, 
                        tax_office: `Finanzamt ${result.name}`,
                        // Also try to fill address if empty
                        address_zip: p.address_zip || result.hausanschrift?.plz || '',
                        address_city: p.address_city || result.hausanschrift?.ort || '',
                    }));
                    toast.success(`Finanzamt erkannt: ${result.name}`);
                }
            }
        } catch {
            // silent fail
        }
    };

    // ─── Validation ───────────────────────────────────────────────────────────
    const validate = (): Errors => {
        const e: Errors = {};
        if (step === 0) {
            if (!form.company_name.trim()) e.company_name = 'Firmenname ist erforderlich.';
            if (!form.managing_director.trim()) e.managing_director = 'Geschäftsführer ist erforderlich.';
            if (!form.legal_form.trim()) e.legal_form = 'Rechtsform ist erforderlich.';
            if (!form.email.trim()) {
                e.email = 'E-Mail ist erforderlich.';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                e.email = 'Ungültiges E-Mail-Format.';
            }
        }
        if (step === 1) {
            if (!form.address_street.trim()) e.address_street = 'Straße ist erforderlich.';
            if (!form.address_house_no.trim()) e.address_house_no = 'Nr. ist erforderlich.';
            if (!form.address_zip.trim()) e.address_zip = 'Postleitzahl ist erforderlich.';
            if (!form.address_city.trim()) e.address_city = 'Stadt ist erforderlich.';
            if (!form.address_country.trim()) e.address_country = 'Land ist erforderlich.';
        }
        if (step === 2) {
            if (form.bank_iban && !isValidIBAN(form.bank_iban)) {
                e.bank_iban = 'Ungültige IBAN (z. B. DE89 3704 0044 0532 0130 00).';
            }
            if (!form.tax_number.trim()) {
                e.tax_number = 'Steuernummer ist erforderlich.';
            }
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
            const finalWebsite = form.website 
                ? (form.website.startsWith('http') ? form.website : `${form.website_protocol}${form.website}`)
                : '';

            await onboard({
                ...form,
                website: finalWebsite,
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
                    <Field
                        label="Geschäftsführer / Inhaber"
                        name="managing_director"
                        value={form.managing_director}
                        onChange={set}
                        placeholder="z. B. Maria Müller"
                        required
                        className="col-span-2"
                        error={errors.managing_director}
                        autoComplete="name"
                    />
                    <SearchSelect
                        label="Rechtsform"
                        options={LEGAL_FORMS}
                        value={form.legal_form}
                        onChange={v => setField('legal_form', v)}
                        placeholder="Wählen..."
                        required
                        error={errors.legal_form}
                    />
                    <SearchSelect
                        label="Branche"
                        options={INDUSTRIES}
                        value={form.industry}
                        onChange={v => setField('industry', v)}
                        placeholder="Wählen..."
                    />
                    <Field
                        label="E-Mail (Unternehmen)"
                        name="email"
                        value={form.email}
                        onChange={set}
                        placeholder="info@firma.de"
                        required
                        type="email"
                        className="col-span-2"
                        error={errors.email}
                        autoComplete="email"
                    />
                    <div>
                        <label className={LABEL_CLS}>Festnetztelefon</label>
                        <PhoneInput
                            international
                            defaultCountry="DE"
                            value={form.phone}
                            onChange={v => setField('phone', v || '')}
                            className="phone-input-custom"
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Mobiltelefon</label>
                        <PhoneInput
                            international
                            defaultCountry="DE"
                            value={form.mobile}
                            onChange={v => setField('mobile', v || '')}
                            className="phone-input-custom"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className={LABEL_CLS}>Website</label>
                        <div className="flex h-9 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                            <select
                                name="website_protocol"
                                value={form.website_protocol}
                                onChange={set}
                                className="h-full px-2 text-xs border border-[#ccc] border-r-0 rounded-l-[3px] bg-[#f8f8f8] outline-none focus:border-[#1B4D4F] transition-colors"
                            >
                                <option value="https://">https://</option>
                                <option value="http://">http://</option>
                            </select>
                            <input
                                name="website"
                                value={form.website}
                                onChange={set}
                                placeholder="www.beispiel.de"
                                className="flex-1 h-full px-3 text-sm border border-[#ccc] rounded-r-[3px] bg-white outline-none focus:border-[#1B4D4F] transition-colors"
                            />
                        </div>
                    </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="col-span-1 sm:col-span-9 flex flex-col">
                        <label className={LABEL_CLS}>
                            Straße <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <AutoComplete
                            options={streetOptions}
                            onSearch={fetchStreetSuggestions}
                            onSelect={handleStreetSelect}
                            value={form.address_street}
                            filterOption={false}
                            getPopupContainer={trigger => trigger.parentElement!}
                        >
                            <input
                                placeholder="Musterstraße"
                                className={errors.address_street ? INPUT_ERROR_CLS : INPUT_CLS}
                                onChange={(e) => setField('address_street', e.target.value)}
                                autoComplete="off"
                            />
                        </AutoComplete>
                        {errors.address_street && (
                            <span className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                                <AlertCircle size={10} className="shrink-0" />
                                {errors.address_street}
                            </span>
                        )}
                    </div>
                    <Field
                        label="Nr."
                        name="address_house_no"
                        value={form.address_house_no}
                        onChange={set}
                        placeholder="12 a"
                        required
                        error={errors.address_house_no}
                        className="col-span-1 sm:col-span-3"
                    />
                    <Field
                        label="Postleitzahl"
                        name="address_zip"
                        value={form.address_zip}
                        onChange={set}
                        placeholder="10115"
                        required
                        error={errors.address_zip}
                        autoComplete="postal-code"
                        helpText={zipLoading ? 'Stadt wird ermittelt…' : undefined}
                        className="col-span-1 sm:col-span-4"
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
                        className="col-span-1 sm:col-span-8"
                    />
                    <div className="col-span-1 sm:col-span-12 flex flex-col">
                        <label className={LABEL_CLS}>
                            Land <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <CountrySelect
                            label=""
                            value={form.address_country}
                            onChange={v => setField('address_country', v)}
                            error={!!errors.address_country}
                            className="onboarding-country-select"
                        />
                        {errors.address_country && (
                            <span className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                                <AlertCircle size={10} className="shrink-0" />
                                {errors.address_country}
                            </span>
                        )}
                    </div>
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
            <div>
                <p className={SECTION_TITLE_CLS}>Bankverbindung</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className={LABEL_CLS}>IBAN</label>
                        <IMaskInput
                            mask="aa00 0000 0000 0000 0000 00"
                            prepare={v => v.toUpperCase()}
                            value={form.bank_iban}
                            onAccept={(v) => {
                                setField('bank_iban', v);
                                if (v.replace(/\s/g, '').length >= 15) handleIbanAutoDetect(v);
                            }}
                            onBlur={(e) => {
                                const v = e.target.value;
                                if (v.replace(/\s/g, '').length >= 15) handleIbanAutoDetect(v);
                            }}
                            placeholder="DE00 0000 0000 0000 0000 00"
                            className={clsx(INPUT_CLS, errors.bank_iban && "border-red-500 bg-red-50")}
                        />
                        {errors.bank_iban && <p className="text-red-500 text-[10px] mt-1">{errors.bank_iban}</p>}
                    </div>
                    <div>
                        <label className={LABEL_CLS}>BIC / SWIFT</label>
                        <IMaskInput
                            mask="aaaaaaaaaaa"
                            prepare={v => v.toUpperCase()}
                            value={form.bank_bic}
                            onAccept={(v) => setField('bank_bic', v)}
                            placeholder="XXXXXXXX"
                            className={INPUT_CLS}
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Bankleitzahl (BLZ)</label>
                        <IMaskInput
                            mask="00000000"
                            value={form.bank_code}
                            onAccept={(v) => setField('bank_code', v)}
                            placeholder="12345678"
                            className={INPUT_CLS}
                        />
                    </div>
                    <Field
                        label="Kreditinstitut"
                        name="bank_name"
                        value={form.bank_name}
                        onChange={set}
                        placeholder="z. B. Sparkasse Berlin"
                        className="col-span-2"
                    />
                    <Field
                        label="Kontoinhaber"
                        name="bank_account_holder"
                        value={form.bank_account_holder || form.company_name}
                        onChange={set}
                        placeholder="Name des Inhabers"
                        className="col-span-2"
                        autoComplete="name"
                    />
                </div>
            </div>

            {DIVIDER}

            <div>
                <p className={SECTION_TITLE_CLS}>Steuerdaten</p>
                <div className="mb-4">
                    <div className="p-3 border border-[#D1D9D8] rounded-[3px] bg-[#f6f8f8] flex items-center justify-between gap-4">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL_CLS}>Steuernummer <span className="text-red-500 ml-0.5">*</span></label>
                        <IMaskInput
                            mask="00/000/00000"
                            value={form.tax_number}
                            onAccept={(v) => setField('tax_number', v)}
                            onBlur={handleTaxNumberBlur}
                            placeholder="12/345/67890"
                            className={clsx(INPUT_CLS, errors.tax_number && "border-red-500 bg-red-50")}
                        />
                        {errors.tax_number && <p className="text-red-500 text-[10px] mt-1">{errors.tax_number}</p>}
                    </div>
                    {!form.is_small_business && (
                        <Field
                            label="USt-IdNr."
                            name="vat_id"
                            value={form.vat_id}
                            onChange={set}
                            placeholder="DE123456789"
                        />
                    )}
                    <div className="col-span-2 flex flex-col">
                        <label className={LABEL_CLS}>Finanzamt</label>
                        <AutoComplete
                            options={taxOfficesData.map(fa => ({ value: `Finanzamt ${fa.name}`, label: `Finanzamt ${fa.name} (${fa.ort})` }))}
                            value={form.tax_office}
                            onSearch={(v) => setField('tax_office', v)}
                            onSelect={(v) => setField('tax_office', v)}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            <input
                                placeholder="Finanzamt suchen..."
                                className={INPUT_CLS}
                                onChange={(e) => setField('tax_office', e.target.value)}
                            />
                        </AutoComplete>
                    </div>
                </div>
            </div>

            {DIVIDER}

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

    const step3 = (
        <div className="space-y-6" key="s3">
            {/* Logo Upload */}
            <div>
                <p className={SECTION_TITLE_CLS}>Unternehmenslogo</p>
                <div className="flex items-center gap-6 mt-2">
                    <div 
                        className={clsx(
                            "w-24 h-24 rounded-[3px] border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
                            form.company_logo ? "border-[#1B4D4F] bg-white" : "border-slate-300 bg-slate-50 hover:border-[#1B4D4F]"
                        )}
                    >
                        {form.company_logo ? (
                            <img src={form.company_logo} alt="Logo Preview" className="w-full h-full object-contain" />
                        ) : (
                            <Building2 className="text-slate-300" size={32} />
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="cursor-pointer bg-white border border-[#ccc] px-4 py-2 rounded-[3px] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                            Logo hochladen
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                        </label>
                        {form.company_logo && (
                            <button 
                                type="button" 
                                onClick={() => setForm(p => ({ ...p, company_logo: null }))}
                                className="text-[10px] text-red-500 hover:underline text-left"
                            >
                                Logo entfernen
                            </button>
                        )}
                        <p className="text-[10px] text-slate-400">PNG, JPG oder SVG. Max. 2MB. Empfohlen: Quadratisch.</p>
                    </div>
                </div>
            </div>

            {DIVIDER}


            {/* Default Settings */}
            <div>
                <p className={SECTION_TITLE_CLS}>Standard-Einstellungen</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className={LABEL_CLS}>Amtssprache der Platform</label>
                        <select
                            name="system_language"
                            value={form.system_language}
                            onChange={set}
                            className={SELECT_CLS}
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 10px center',
                                paddingRight: '28px',
                            }}
                        >
                            {LANGUAGES_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className={LABEL_CLS}>Zeitzone</label>
                        <select
                            name="system_timezone"
                            value={form.system_timezone}
                            onChange={set}
                            className={SELECT_CLS}
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 10px center',
                                paddingRight: '28px',
                            }}
                        >
                            {TIMEZONES_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {DIVIDER}

            {/* E-Mail-Signatur */}
            <div>
                <p className={SECTION_TITLE_CLS}>E-Mail-Signatur (Vorschau)</p>
                <div className="flex flex-col">
                    <textarea
                        id="email_signature"
                        name="email_signature"
                        value={form.email_signature}
                        onChange={set}
                        rows={4}
                        className={clsx(
                            'w-full px-3 py-2 text-sm border border-[#ccc] rounded-[3px] font-mono',
                            'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
                            'outline-none resize-none transition-colors leading-relaxed',
                            'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20'
                        )}
                        placeholder={'Mit freundlichen Grüßen\n[Firmenname]\n[Adresse]'}
                    />
                    <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Info size={10} />
                        Wird automatisch am Ende aller System-E-Mails angefügt.
                    </span>
                </div>
            </div>
        </div>
    );

    const stepContent = [step0, step1, step2, step3];

    const panel = LEFT_PANEL[step];
    const PanelIcon = panel.icon;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center py-8 px-4 sm:px-6">
            <div className="w-full max-w-5xl min-h-[500px] lg:h-[850px] max-h-[95vh] border border-[#D1D9D8] rounded-sm shadow-[0_2px_12px_rgba(0,0,0,0.10)] overflow-hidden flex flex-col lg:flex-row bg-white my-auto">

                {/* ── Linke Spalte ──────────────────────────────────────────── */}
                <div className="hidden lg:flex w-[35%] shrink-0 flex-col bg-[#1B4D4F] relative overflow-hidden">
                    {/* Decorative */}
                    <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/[0.03] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#9BCB56]/[0.06] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col h-full px-8 py-8 overflow-y-auto custom-scrollbar">
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
                <div className="flex-1 flex flex-col h-full overflow-hidden">

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
                    <div className="flex-1 overflow-y-auto custom-scrollbar-slate px-10 py-5">
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
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(155, 203, 86, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(155, 203, 86, 0.4); }
                .custom-scrollbar-slate::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-slate::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-slate::-webkit-scrollbar-thumb { background: rgba(30, 41, 59, 0.1); border-radius: 10px; }
                .custom-scrollbar-slate::-webkit-scrollbar-thumb:hover { background: rgba(30, 41, 59, 0.2); }
                
                .ant-select-custom .ant-select-selector {
                    border-radius: 3px !important;
                    border-color: #ccc !important;
                    height: 36px !important;
                    display: flex !important;
                    align-items: center !important;
                    background: linear-gradient(to bottom, #fff, #fbfbfb) !important;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
                }
                .ant-select-custom.ant-select-focused .ant-select-selector {
                    border-color: #1B4D4F !important;
                    box-shadow: 0 0 0 1px rgba(27, 77, 79, 0.2) !important;
                }
                .ant-select-custom.ant-select-error .ant-select-selector {
                    border-color: #ef4444 !important;
                    background: #fef2f2 !important;
                }
                .ant-select-custom .ant-select-selection-placeholder {
                    color: #cbd5e1 !important;
                    font-size: 14px !important;
                }
                .ant-select-custom .ant-select-selection-item {
                    font-size: 14px !important;
                    color: #334155 !important;
                }

                /* Phone Input Customization */
                .phone-input-custom {
                    display: flex;
                    align-items: center;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    height: 36px;
                    padding: 0 8px;
                    background: linear-gradient(to bottom, #fff, #fbfbfb);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .phone-input-custom:focus-within {
                    border-color: #1B4D4F;
                    box-shadow: 0 0 0 1px rgba(27, 77, 79, 0.2);
                }
                .phone-input-custom .PhoneInputInput {
                    border: none !important;
                    outline: none !important;
                    background: transparent !important;
                    font-size: 14px;
                    padding-left: 8px;
                    width: 100%;
                }
                .phone-input-custom .PhoneInputCountry {
                    margin-right: 4px;
                }

                /* Country Select Alignment */
                .onboarding-country-select {
                    border-color: #ccc !important;
                    border-radius: 3px !important;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
                }
                .onboarding-country-select:hover {
                    border-color: #1B4D4F !important;
                }
                .onboarding-country-select[data-error="true"],
                div[data-error="true"] .onboarding-country-select {
                    border-color: #ef4444 !important;
                    background: #fef2f2 !important;
                }
            `}</style>
        </div>
    );
}
