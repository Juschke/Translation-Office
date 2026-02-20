import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaPlus, FaTrash, FaEnvelope } from 'react-icons/fa';
import Input from '../common/Input';
import CountrySelect from '../common/CountrySelect';
import PhoneInput from '../common/PhoneInput';
import SearchableSelect from '../common/SearchableSelect';
import { fetchCityByZip } from '../../utils/autoFill';
import { IMaskInput } from 'react-imask';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const legalFormOptions = [
    { value: 'Einzelunternehmen', label: 'Einzelunternehmen' },
    { value: 'GbR', label: 'GbR (Gesellschaft bürgerlichen Rechts)' },
    { value: 'GmbH', label: 'GmbH (Gesellschaft mit beschränkter Haftung)' },
    { value: 'GmbH & Co. KG', label: 'GmbH & Co. KG' },
    { value: 'UG (haftungsbeschränkt)', label: 'UG (haftungsbeschränkt)' },
    { value: 'AG', label: 'AG (Aktiengesellschaft)' },
    { value: 'KG', label: 'KG (Kommanditgesellschaft)' },
    { value: 'OHG', label: 'OHG (Offene Handelsgesellschaft)' },
    { value: 'e.K.', label: 'e.K. (eingetragener Kaufmann / -frau)' },
    { value: 'PartG', label: 'PartG (Partnerschaftsgesellschaft)' },
    { value: 'eG', label: 'eG (eingetragene Genossenschaft)' },
    { value: 'e.V.', label: 'e.V. (eingetragener Verein)' },
    { value: 'Stiftung', label: 'Stiftung' },
    { value: 'Körperschaft d.ö.R.', label: 'Körperschaft d.ö.R.' }
];

interface CustomerFormData {
    id?: number;
    type: 'private' | 'company' | 'authority';
    salutation: string;
    first_name: string;
    last_name: string;
    company_name: string;
    legal_form: string;
    address_street: string;
    address_house_no: string;
    address_zip: string;
    address_city: string;
    address_country: string;
    email: string;
    phone: string;
    notes: string;
    additional_emails: string[];
    additional_phones: string[];
    payment_terms_days: number | '';
    iban: string;
    bic: string;
    bank_name: string;
    bank_code: string;
    bank_account_holder: string;
    tax_id: string;
    vat_id: string;
    leitweg_id: string;
}

interface NewCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CustomerFormData) => void;
    initialData?: Partial<CustomerFormData>;
}

const NewCustomerModal: React.FC<NewCustomerModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState<CustomerFormData>({
        type: 'private',
        salutation: 'Herr',
        first_name: '',
        last_name: '',
        company_name: '',
        legal_form: '',
        address_street: '',
        address_house_no: '',
        address_zip: '',
        address_city: '',
        address_country: 'Deutschland',
        email: '',
        phone: '',
        notes: '',
        additional_emails: [],
        additional_phones: [],
        payment_terms_days: 14, // Default payment terms
        iban: '',
        bic: '',
        bank_name: '',
        bank_code: '',
        bank_account_holder: '',
        tax_id: '',
        vat_id: '',
        leitweg_id: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isValidatingIban, setIsValidatingIban] = useState(false);

    const validate = useCallback((data: typeof formData) => {
        const newErrors: Record<string, string> = {};

        // Name Validation
        if (!data.last_name) newErrors.last_name = 'Nachname ist ein Pflichtfeld';
        else if (data.last_name.length < 2) newErrors.last_name = 'Nachname muss mindestens 2 Zeichen lang sein';

        if (!data.first_name) newErrors.first_name = 'Vorname ist ein Pflichtfeld';
        else if (data.first_name.length < 2) newErrors.first_name = 'Vorname muss mindestens 2 Zeichen lang sein';

        // Company Validation
        if ((data.type === 'company' || data.type === 'authority') && !data.company_name) {
            newErrors.company_name = data.type === 'authority' ? 'Name der Behörde ist erforderlich' : 'Firmenname ist erforderlich';
        }

        // Address Validation
        if (!data.address_street) newErrors.address_street = 'Straße ist erforderlich';
        if (!data.address_house_no) newErrors.address_house_no = 'Nr. ist erforderlich';
        if (!data.address_zip) newErrors.address_zip = 'PLZ ist erforderlich';
        else if (data.address_country === 'Deutschland' && !/^\d{5}$/.test(data.address_zip)) {
            newErrors.address_zip = 'PLZ muss exakt 5 Ziffern enthalten';
        }
        if (!data.address_city) newErrors.address_city = 'Stadt ist erforderlich';

        // Email Validation
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            newErrors.email = 'Ungültiges E-Mail-Format';
        }

        // Phone Validation (basic check if provided)
        if (data.phone && data.phone.length < 5) newErrors.phone = 'Telefonnummer ist zu kurz';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, []);

    // ZIP to City Auto-Fill enrichment
    useEffect(() => {
        const fillCity = async () => {
            // Only auto-fill if ZIP looks complete (e.g. 5 digits for DE)
            if (formData.address_zip && formData.address_zip.length === 5 && !formData.address_city) {
                const city = await fetchCityByZip(formData.address_zip, formData.address_country);
                if (city) {
                    setFormData(prev => ({ ...prev, address_city: city }));
                }
            }
        };
        fillCity();
    }, [formData.address_zip, formData.address_country]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                additional_emails: initialData.additional_emails || [],
                additional_phones: initialData.additional_phones || [],
                type: ((initialData.type as any) === 'Firma' || initialData.type === 'company') ? 'company' :
                    ((initialData.type as any) === 'Privat' || initialData.type === 'private') ? 'private' : 'authority',
            });
        } else if (isOpen) {
            setFormData({
                type: 'private',
                salutation: 'Herr',
                first_name: '',
                last_name: '',
                company_name: '',
                legal_form: '',
                address_street: '',
                address_house_no: '',
                address_zip: '',
                address_city: '',
                address_country: 'Deutschland',
                email: '',
                phone: '',
                notes: '',
                additional_emails: [],
                additional_phones: [],
                payment_terms_days: 14,
                iban: '',
                bic: '',
                bank_name: '',
                bank_code: '',
                bank_account_holder: '',
                tax_id: '',
                vat_id: '',
                leitweg_id: '',
            });
            setTouched({});
            setErrors({});
            setIsValidatingIban(false);
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        validate(formData);
    }, [formData, validate]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handlePhoneChange = (value: string) => {
        setFormData(prev => ({ ...prev, phone: value }));
        setTouched(prev => ({ ...prev, phone: true }));
    };

    const handleArrayChange = (index: number, value: string, field: 'additional_emails' | 'additional_phones') => {
        const newArr = [...formData[field]];
        newArr[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArr }));
    };

    const addField = (field: 'additional_emails' | 'additional_phones') => {
        if (formData[field].length < 3) {
            setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
        } else {
            // Optional: Toast notification or shaking effect could be added here
        }
    };

    const removeField = (field: 'additional_emails' | 'additional_phones', index: number) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all as touched to show errors
        const allTouched: Record<string, boolean> = {};
        Object.keys(formData).forEach(key => allTouched[key] = true);
        setTouched(allTouched);

        if (validate(formData)) {
            onSubmit(formData);
        }
    };

    const handleIbanBlur = async () => {
        const cleanIban = (formData.iban || '').replace(/\s/g, '');
        if (!cleanIban || cleanIban.length < 15) return;
        setIsValidatingIban(true);
        try {
            const response = await fetch(`https://openiban.com/validate/${cleanIban}?getBIC=true&validateBankCode=true`);
            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    setFormData(prev => ({
                        ...prev,
                        bic: data.bankData?.bic || prev.bic,
                        bank_name: data.bankData?.name || prev.bank_name,
                        bank_code: data.bankData?.bankCode || prev.bank_code,
                    }));
                    setErrors(prev => ({ ...prev, iban: '' }));
                    toast.success(`Bank erkannt: ${data.bankData?.name || 'IBAN valide'}`);
                } else {
                    setErrors(prev => ({ ...prev, iban: 'Ungültige IBAN' }));
                }
            }
        } catch (error) {
            console.warn('IBAN Validation API unavailable');
        } finally {
            setIsValidatingIban(false);
        }
    };

    const handleBicBlur = () => {
        const bicVal = (formData.bic || '').toUpperCase().trim();
        if (!bicVal || bicVal.length < 4) return;
        const commonBanks: Record<string, string> = {
            'DEUTDE': 'Deutsche Bank AG',
            'COMADE': 'Commerzbank AG',
            'DRESDE': 'Dresdner Bank',
            'PBNKDE': 'Postbank (DB)',
            'INGDDE': 'ING-DiBa AG',
            'N26ADE': 'N26 Bank AG',
            'SOLODE': 'Solarisbank AG',
            'DKBADE': 'DKB Deutsche Kreditbank',
            'GENODE': 'Volksbanken Raiffeisenbanken',
            'HASADE': 'Hamburger Sparkasse',
            'BELADE': 'Berliner Sparkasse',
            'MAZADE': 'Mainzer Volksbank',
            'KRHADE': 'Sparkasse Hannover',
            'WELADE': 'Landesbank Baden-Württemberg',
            'BYLADE': 'BayernLB',
            'HEFADE': 'Helaba',
            'NOLA DE': 'NordLB'
        };
        const prefix6 = bicVal.substring(0, 6);
        const prefix4 = bicVal.substring(0, 4);
        if (!formData.bank_name) {
            const foundBank = commonBanks[prefix6] || commonBanks[prefix4];
            if (foundBank) {
                setFormData(prev => ({ ...prev, bank_name: foundBank }));
            }
        }
    };

    const getError = (field: string) => touched[field] ? errors[field] : '';

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-sm shadow-sm w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-fade-in-up transform transition-all">
                <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="bg-white px-6 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="font-semibold text-base text-slate-800 flex items-center gap-3">
                                {initialData ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}
                                <span className="text-xs font-medium text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                    CRM Stammdaten
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Zentrale Verwaltung der Kundenprofile</p>
                        </div>
                        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8 bg-white">
                        {/* Section 1: Classification */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">01</div>
                                <h4 className="text-xs font-semibold text-slate-800">Klassifizierung & Name</h4>
                            </div>

                            <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                                <div className="col-span-12">
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Kunden-Typ</label>
                                    <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 w-fit">
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, type: 'private' }))} className={`px-4 py-1.5 rounded-sm text-xs font-medium transition-all ${formData.type === 'private' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Privat</button>
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, type: 'company' }))} className={`px-4 py-1.5 rounded-sm text-xs font-medium transition-all ${formData.type === 'company' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Firma</button>
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, type: 'authority' }))} className={`px-4 py-1.5 rounded-sm text-xs font-medium transition-all ${formData.type === 'authority' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Behörde</button>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-400 font-medium ml-1">Wählen Sie die Rechtsform des Kunden für korrekte Rechnungsstellung</p>
                                </div>

                                {(formData.type === 'company' || formData.type === 'authority') && (
                                    <div className="col-span-12 animate-fadeIn grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                        <Input
                                            label={formData.type === 'authority' ? 'Behörde / Institution' : 'Firmenname'}
                                            name="company_name"
                                            value={formData.company_name}
                                            onChange={handleChange}
                                            placeholder={formData.type === 'authority' ? 'z.B. Standesamt Kassel' : 'z.B. Muster GmbH'}
                                            helperText={getError('company_name') || (formData.type === 'authority' ? 'Name der Behörde' : 'Firmenname')}
                                            error={!!getError('company_name')}
                                        />
                                        {formData.type === 'authority' ? (
                                            <Input
                                                label="Leitweg-ID (E-Rechnung)"
                                                name="leitweg_id"
                                                value={formData.leitweg_id}
                                                onChange={handleChange}
                                                placeholder="z.B. 1234-5678-90"
                                                helperText="Erforderlich für XRechnung / ZUGFeRD"
                                            />
                                        ) : (
                                            <div className="md:mt-0">
                                                <SearchableSelect
                                                    label="Rechtsform"
                                                    options={legalFormOptions}
                                                    value={formData.legal_form}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, legal_form: val }))}
                                                    placeholder="Rechtsform wählen..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="col-span-12 md:col-span-2">
                                    <Input
                                        isSelect
                                        label="Anrede"
                                        name="salutation"
                                        value={formData.salutation}
                                        onChange={handleChange}
                                        helperText="Formelle Anrede"
                                    >
                                        <option value="Herr">Herr</option>
                                        <option value="Frau">Frau</option>
                                        <option value="Divers">Divers</option>
                                    </Input>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <Input
                                        label="Vorname *"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Max"
                                        helperText={getError('first_name') || 'Vorname des Ansprechpartners'}
                                        error={!!getError('first_name')}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <Input
                                        label="Nachname *"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Mustermann"
                                        helperText={getError('last_name') || 'Pflichtfeld: Nachname der Person'}
                                        error={!!getError('last_name')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Contact */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">02</div>
                                <h4 className="text-xs font-semibold text-slate-800">Kontaktdaten</h4>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-6 space-y-4">
                                    <Input
                                        label="E-Mail (Primär)"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        type="email"
                                        startIcon={<FaEnvelope />}
                                        placeholder="max.mustermann@beispiel.de"
                                        helperText={getError('email') || 'Hauptadresse für E-Mails und Dokumente'}
                                        error={!!getError('email')}
                                    />

                                    <div className="space-y-2">
                                        {formData.additional_emails.map((email, i) => (
                                            <div key={i} className="flex gap-2 group animate-fadeIn items-start">
                                                <Input
                                                    containerClassName="flex-1"
                                                    value={email}
                                                    onChange={(e) => handleArrayChange(i, e.target.value, 'additional_emails')}
                                                    type="email"
                                                    startIcon={<FaEnvelope />}
                                                    placeholder="alternative.email@beispiel.de"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeField('additional_emails', i)}
                                                    className="h-9 px-3 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-sm transition flex-shrink-0"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.additional_emails.length < 3 && (
                                            <button type="button" onClick={() => addField('additional_emails')} className="text-xs text-slate-700 font-medium flex items-center gap-1.5 hover:text-slate-900 transition-colors py-2 ml-1">
                                                <FaPlus className="text-xs" /> Weitere E-Mail hinzufügen
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-12 md:col-span-6 space-y-6">
                                    <PhoneInput
                                        label="Telefon / Mobil"
                                        value={formData.phone}
                                        onChange={handlePhoneChange}
                                        helperText={getError('phone') || 'Format: +49 123 456789'}
                                        error={!!getError('phone')}
                                    />

                                    <div className="space-y-2">
                                        {formData.additional_phones.map((phone, i) => (
                                            <div key={i} className="flex gap-2 group animate-fadeIn items-start">
                                                <div className="flex-1">
                                                    <PhoneInput
                                                        value={phone}
                                                        onChange={(val) => handleArrayChange(i, val, 'additional_phones')}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeField('additional_phones', i)}
                                                    className="h-9 px-3 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-sm transition flex-shrink-0"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.additional_phones.length < 3 && (
                                            <button type="button" onClick={() => addField('additional_phones')} className="text-xs text-slate-700 font-medium flex items-center gap-1.5 hover:text-slate-900 transition-colors py-2 ml-1">
                                                <FaPlus className="text-xs" /> Weitere Nummer hinzufügen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Address */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">03</div>
                                <h4 className="text-xs font-semibold text-slate-800">Standort & Adresse</h4>
                            </div>

                            <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                                <div className="col-span-12 md:col-span-9">
                                    <Input
                                        label="Straße *"
                                        name="address_street"
                                        value={formData.address_street}
                                        onChange={handleChange}
                                        required
                                        placeholder="Königsplatz"
                                        helperText={getError('address_street') || 'Straßenname ohne Hausnummer'}
                                        error={!!getError('address_street')}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-3">
                                    <Input
                                        label="Nr. *"
                                        name="address_house_no"
                                        value={formData.address_house_no}
                                        onChange={handleChange}
                                        required
                                        placeholder="10"
                                        helperText={getError('address_house_no') || 'Nr. / Zusatz'}
                                        error={!!getError('address_house_no')}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <Input
                                        label="PLZ *"
                                        name="address_zip"
                                        value={formData.address_zip}
                                        placeholder="34117"
                                        maxLength={10}
                                        onChange={handleChange}
                                        required
                                        helperText={getError('address_zip') || '5-stellige Postleitzahl'}
                                        error={!!getError('address_zip')}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-8">
                                    <Input
                                        label="Stadt *"
                                        name="address_city"
                                        value={formData.address_city}
                                        onChange={handleChange}
                                        required
                                        placeholder="Kassel"
                                        className="font-medium"
                                        helperText={getError('address_city') || 'Vollständiger Name der Stadt'}
                                        error={!!getError('address_city')}
                                    />
                                </div>
                                <div className="col-span-12">
                                    <CountrySelect
                                        label="Land"
                                        value={formData.address_country || 'Deutschland'}
                                        onChange={(val) => setFormData(prev => ({ ...prev, address_country: val }))}
                                        helperText="Land für steuerliche Zuordnung"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Bookkeeping */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">04</div>
                                <h4 className="text-xs font-semibold text-slate-800">Buchhaltung & Zahlungsdaten</h4>
                            </div>

                            <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                                <div className="col-span-12 md:col-span-4">
                                    <Input
                                        label="Zahlungsziel (Tage)"
                                        name="payment_terms_days"
                                        type="number"
                                        value={formData.payment_terms_days}
                                        onChange={handleChange}
                                        placeholder="14"
                                        helperText="Standard-Zahlungsfrist für Rechnungen"
                                    />
                                </div>
                                {formData.type !== 'private' && (
                                    <div className="col-span-12 md:col-span-4">
                                        <Input
                                            label="USt-IdNr."
                                            name="vat_id"
                                            value={formData.vat_id}
                                            onChange={handleChange}
                                            placeholder="DE123456789"
                                        />
                                    </div>
                                )}
                                {formData.type !== 'private' && (
                                    <div className="col-span-12 md:col-span-4">
                                        <Input
                                            label="Steuernummer"
                                            name="tax_id"
                                            value={formData.tax_id}
                                            onChange={handleChange}
                                            placeholder="026 333 44444"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">05</div>
                                <h4 className="text-xs font-semibold text-slate-800">Bankverbindung</h4>
                            </div>

                            <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                                <div className="col-span-12">
                                    <Input
                                        label="Kontoinhaber"
                                        name="bank_account_holder"
                                        value={formData.bank_account_holder}
                                        onChange={handleChange}
                                        placeholder={formData.type === 'company' || formData.type === 'authority' ? formData.company_name || 'Musterfirma GmbH' : `${formData.first_name || 'Max'} ${formData.last_name || 'Mustermann'}`.trim()}
                                        helperText="Automatisch vorausgefüllt basierend auf dem Namen."
                                    />
                                </div>
                                <div className="col-span-12">
                                    <div className="flex flex-col">
                                        <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">IBAN</label>
                                        <div className="relative">
                                            <IMaskInput
                                                mask="aa00 0000 0000 0000 0000 00"
                                                definitions={{ 'a': /[a-zA-Z]/ }}
                                                placeholder="DE00 0000 0000 0000 0000 00"
                                                value={formData.iban || ''}
                                                onAccept={(value) => {
                                                    setFormData(prev => ({ ...prev, iban: value.toUpperCase() }));
                                                    setTouched(prev => ({ ...prev, iban: true }));
                                                }}
                                                onBlur={handleIbanBlur}
                                                className={clsx(
                                                    'flex h-9 w-full rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none',
                                                    'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900',
                                                    errors.iban && 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10'
                                                )}
                                            />
                                            {isValidatingIban && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                        {errors.iban && <span className="text-xs text-red-500 font-medium block mt-1">{errors.iban}</span>}
                                    </div>
                                </div>
                                <div className="col-span-12 sm:col-span-4">
                                    <Input
                                        label="Bankname"
                                        name="bank_name"
                                        value={formData.bank_name}
                                        onChange={handleChange}
                                        placeholder="Musterbank AG"
                                    />
                                </div>
                                <div className="col-span-12 sm:col-span-4">
                                    <Input
                                        label="BLZ"
                                        name="bank_code"
                                        value={formData.bank_code}
                                        onChange={handleChange}
                                        placeholder="000 000 00"
                                    />
                                </div>
                                <div className="col-span-12 sm:col-span-4">
                                    <div className="flex flex-col">
                                        <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">BIC</label>
                                        <IMaskInput
                                            mask="aaaaaa aa [aaa]"
                                            definitions={{ 'a': /[a-zA-Z0-9]/ }}
                                            placeholder="ABCDEFGH"
                                            value={formData.bic || ''}
                                            onAccept={(value) => {
                                                setFormData(prev => ({ ...prev, bic: value.toUpperCase() }));
                                                setTouched(prev => ({ ...prev, bic: true }));
                                            }}
                                            onBlur={handleBicBlur}
                                            className={clsx(
                                                'flex h-9 w-full rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none',
                                                'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900'
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 6: Notes */}
                        <div className="space-y-6 pb-10">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-semibold">06</div>
                                <h4 className="text-xs font-semibold text-slate-800">Interne Akte</h4>
                            </div>
                            <Input
                                isTextArea
                                label="Interne Notizen"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Interne Bemerkungen, Besonderheiten des Kunden, Historie..."
                                helperText="Informationen sind nur für Mitarbeiter sichtbar"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-white transition-all shadow-sm"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2 bg-slate-900 text-white rounded text-xs font-semibold shadow-sm hover:bg-slate-800 transition-all"
                        >
                            {initialData ? 'Änderungen speichern' : 'Kunde anlegen'}
                        </button>
                    </div>
                </form >
            </div >
        </div >
    );
};

export default NewCustomerModal;
