import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaTrash, FaStar, FaEnvelope } from 'react-icons/fa';
import LanguageSelect from '../common/LanguageSelect';
import Input from '../common/Input';
import CountrySelect from '../common/CountrySelect';
import PhoneInput from '../common/PhoneInput';
import { fetchCityByZip, fetchBankByIban } from '../../utils/autoFill';
import clsx from 'clsx';

export interface PartnerFormData {
    id?: number;
    type: string;
    salutation: string;
    firstName: string;
    lastName: string;
    company: string;
    street: string;
    houseNo: string;
    zip: string;
    city: string;
    country: string;
    emails: string[];
    phones: string[];
    languages: string[];
    domains: string | string[];
    software: string;
    priceMode: string;
    unitRates: { word: string; line: string; hour: string };
    flatRates: { minimum: string; cert: string };
    paymentTerms: string;
    taxId: string;
    bankName: string;
    iban: string;
    bic: string;
    notes: string;
    status: string;
    rating: number;
}

interface PartnerFormProps {
    initialData?: Partial<PartnerFormData> | any;
    onChange: (data: PartnerFormData) => void;
    validationErrors?: Set<string>;
    layout?: 'full' | 'compact';
}

const PartnerForm: React.FC<PartnerFormProps> = ({
    initialData,
    onChange,
    validationErrors: externalValidationErrors = new Set(),
    layout = 'full'
}) => {
    const [formData, setFormData] = useState<PartnerFormData>({
        type: 'translator',
        salutation: 'Herr',
        firstName: '',
        lastName: '',
        company: '',
        street: '',
        houseNo: '',
        zip: '',
        city: '',
        country: 'Deutschland',
        emails: [''],
        phones: [''],
        languages: [] as string[],
        domains: '' as string | string[],
        software: '',
        priceMode: 'per_unit',
        unitRates: { word: '', line: '', hour: '' },
        flatRates: { minimum: '', cert: '' },
        paymentTerms: '30',
        taxId: '',
        bankName: '',
        iban: '',
        bic: '',
        notes: '',
        status: 'available',
        rating: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validate = useCallback((data: PartnerFormData) => {
        const newErrors: Record<string, string> = {};

        if (!data.lastName) newErrors.lastName = 'Nachname ist erforderlich';
        if (!data.firstName) newErrors.firstName = 'Vorname ist erforderlich';
        if (data.type === 'agency' && !data.company) newErrors.company = 'Agenturname ist erforderlich';

        if (data.emails[0] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emails[0])) {
            newErrors.email = 'Ungültiges E-Mail-Format';
        }

        if (data.zip && data.country === 'Deutschland' && !/^\d{5}$/.test(data.zip)) {
            newErrors.zip = 'PLZ muss 5-stellig sein';
        }

        if (data.iban && !/^[A-Z]{2}\d{2}[A-Z\d]{12,30}$/.test(data.iban.replace(/\s/g, ''))) {
            newErrors.iban = 'Ungültiges IBAN-Format';
        }

        if (data.bic && !/^[A-Z]{6}[A-Z\d]{2}([A-Z\d]{3})?$/.test(data.bic)) {
            newErrors.bic = 'Ungültiger BIC (8 oder 11 Zeichen)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, []);

    // ZIP to City Auto-Fill enrichment
    useEffect(() => {
        const fillCity = async () => {
            if (formData.zip.length === 5 && !formData.city) {
                const city = await fetchCityByZip(formData.zip, formData.country);
                if (city) {
                    setFormData(prev => ({ ...prev, city }));
                }
            }
        };
        fillCity();
    }, [formData.zip, formData.country]);

    // IBAN to Bank/BIC Auto-Fill enrichment
    useEffect(() => {
        const fillBank = async () => {
            const cleanIban = formData.iban.replace(/\s/g, '');
            if (cleanIban.length >= 15 && (!formData.bankName || !formData.bic)) {
                const bankData = await fetchBankByIban(cleanIban);
                if (bankData) {
                    setFormData(prev => ({
                        ...prev,
                        bankName: prev.bankName || bankData.bankName,
                        bic: prev.bic || bankData.bic
                    }));
                }
            }
        };
        fillBank();
    }, [formData.iban]);

    useEffect(() => {
        if (initialData) {
            const mappedData: PartnerFormData = {
                ...formData,
                id: initialData.id,
                type: initialData.type || formData.type,
                salutation: initialData.salutation || formData.salutation,
                firstName: initialData.first_name || initialData.firstName || formData.firstName,
                lastName: initialData.last_name || initialData.lastName || formData.lastName,
                company: initialData.company || formData.company,
                street: initialData.address_street || initialData.street || formData.street,
                houseNo: initialData.address_house_no || initialData.houseNo || formData.houseNo,
                zip: initialData.address_zip || initialData.zip || formData.zip,
                city: initialData.address_city || initialData.city || formData.city,
                country: initialData.address_country || initialData.country || formData.country,
                emails: initialData.email
                    ? [initialData.email, ...(initialData.additional_emails || [])]
                    : (initialData.emails || formData.emails),
                phones: initialData.phone
                    ? [initialData.phone, ...(initialData.additional_phones || [])]
                    : (initialData.phones || formData.phones),
                languages: initialData.languages || formData.languages,
                domains: initialData.domains || formData.domains,
                software: initialData.software || formData.software,
                priceMode: initialData.price_mode || initialData.priceMode || formData.priceMode,
                unitRates: initialData.unit_rates || initialData.unitRates || formData.unitRates,
                flatRates: initialData.flat_rates || initialData.flatRates || formData.flatRates,
                paymentTerms: String(initialData.payment_terms || initialData.paymentTerms || formData.paymentTerms),
                taxId: initialData.tax_id || initialData.taxId || formData.taxId,
                bankName: initialData.bank_name || initialData.bankName || formData.bankName,
                iban: initialData.iban || formData.iban,
                bic: initialData.bic || formData.bic,
                notes: initialData.notes || formData.notes,
                status: initialData.status || formData.status,
                rating: initialData.rating !== undefined ? initialData.rating : formData.rating
            };
            setFormData(mappedData);
            onChange(mappedData);
        }
    }, [initialData]);

    useEffect(() => {
        validate(formData);
        onChange(formData);
    }, [formData, validate, onChange]);

    const updateFormData = (updates: Partial<PartnerFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const markTouched = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const addEmail = () => updateFormData({ emails: [...formData.emails, ''] });
    const removeEmail = (index: number) => updateFormData({ emails: formData.emails.filter((_, i) => i !== index) });
    const updateEmail = (index: number, val: string) => {
        const newEmails = [...formData.emails];
        newEmails[index] = val;
        updateFormData({ emails: newEmails });
        markTouched('email');
    };

    const addPhone = () => updateFormData({ phones: [...formData.phones, ''] });
    const removePhone = (index: number) => updateFormData({ phones: formData.phones.filter((_, i) => i !== index) });

    const partnerTypes = [
        { value: 'translator', label: 'Übersetzer' },
        { value: 'trans_interp', label: 'Übersetzer & Dolmetscher' },
        { value: 'interpreter', label: 'Dolmetscher' },
        { value: 'agency', label: 'Agentur' }
    ];

    const isCompact = layout === 'compact';
    const getError = (field: string) => (touched[field] || externalValidationErrors.has(field)) ? errors[field] : '';

    return (
        <div className={clsx(isCompact ? "space-y-6" : "space-y-12 pb-10")}>
            {/* Section: Typ & Basis */}
            <div className="space-y-6">
                {!isCompact && (
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">01</div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Klassifizierung & Name</h4>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-x-8 gap-y-6">
                    <div className="col-span-12">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Partner-Typ</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
                            {partnerTypes.map(pt => (
                                <button
                                    key={pt.value}
                                    type="button"
                                    onClick={() => updateFormData({ type: pt.value })}
                                    className={clsx(
                                        "px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all",
                                        formData.type === pt.value ? "bg-white text-brand-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {pt.label}
                                </button>
                            ))}
                        </div>
                        <p className="mt-1.5 text-[10px] text-slate-400 font-medium ml-1">Definiert die Art der Zusammenarbeit und Vergütungsbasis</p>
                    </div>

                    <div className="col-span-12 md:col-span-2">
                        <Input
                            isSelect
                            label="Anrede"
                            value={formData.salutation}
                            onChange={e => updateFormData({ salutation: e.target.value })}
                            helperText="Formelle Korrespondenz"
                        >
                            <option>Herr</option><option>Frau</option><option>Divers</option>
                        </Input>
                    </div>
                    <div className="col-span-12 md:col-span-5">
                        <Input
                            label="Vorname *"
                            placeholder="z.B. Maria"
                            value={formData.firstName}
                            error={!!getError('firstName')}
                            onChange={e => updateFormData({ firstName: e.target.value })}
                            onBlur={() => markTouched('firstName')}
                            helperText={getError('firstName') || "Vorname des Partners"}
                        />
                    </div>
                    <div className="col-span-12 md:col-span-5">
                        <Input
                            label="Nachname *"
                            placeholder="z.B. Musterfrau"
                            value={formData.lastName}
                            error={!!getError('lastName')}
                            onChange={e => updateFormData({ lastName: e.target.value })}
                            onBlur={() => markTouched('lastName')}
                            helperText={getError('lastName') || "Familienname des Partners"}
                        />
                    </div>

                    <div className="col-span-12 space-y-2 animate-fadeIn">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sprachen *</label>
                        <LanguageSelect
                            isMulti={true}
                            value={formData.languages}
                            onChange={v => updateFormData({ languages: v })}
                            placeholder="Sprachen auswählen..."
                        />
                        <p className="mt-1 text-[10px] text-slate-400 font-medium ml-1">Präferenz für Projektzuweisungen</p>
                    </div>

                    {formData.type === 'agency' && (
                        <div className="col-span-12 animate-fadeIn">
                            <Input
                                label="Agenturname / Firma *"
                                placeholder="z.B. Übersetzungsbüro Kassel"
                                value={formData.company}
                                error={!!getError('company')}
                                onChange={e => updateFormData({ company: e.target.value })}
                                onBlur={() => markTouched('company')}
                                className="font-bold"
                                helperText={getError('company') || "Vollständiger Name der Agentur laut Handelsregister"}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Section: Kontaktdaten */}
            <div className="space-y-6">
                {!isCompact && (
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">02</div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kontaktdaten</h4>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-x-8 gap-y-6">
                    <div className="col-span-12 md:col-span-6 space-y-6">
                        <div className="space-y-4">
                            {formData.emails.map((email, i) => (
                                <div key={i} className="flex gap-2 group animate-fadeIn items-end">
                                    <Input
                                        containerClassName="flex-1"
                                        label={i === 0 ? "E-Mail (Primär) *" : undefined}
                                        type="email"
                                        startIcon={<FaEnvelope />}
                                        placeholder={i === 0 ? "haupt.partner@beispiel.de" : "zusatz.partner@beispiel.de"}
                                        value={email}
                                        error={i === 0 && !!getError('email')}
                                        onChange={e => updateEmail(i, e.target.value)}
                                        helperText={i === 0 ? (getError('email') || "Hauptkontakt für alle Projektanfragen") : undefined}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeEmail(i)}
                                        className={clsx(
                                            "h-9 px-3 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-md transition flex-shrink-0",
                                            i === 0 && formData.emails.length === 1 ? "hidden" : ""
                                        )}
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            ))}
                            {!isCompact && (
                                <button type="button" onClick={addEmail} className="text-[10px] text-brand-600 font-bold flex items-center gap-1.5 hover:text-brand-700 transition-colors uppercase py-1 ml-1">
                                    <FaPlus className="text-[8px]" /> Weitere E-Mail hinzufügen
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-6 space-y-6">
                        <div className="space-y-4">
                            {formData.phones.map((phone, i) => (
                                <div key={i} className="flex gap-2 group animate-fadeIn items-end">
                                    <div className="flex-1">
                                        <PhoneInput
                                            label={i === 0 ? "Telefon (Primär) *" : undefined}
                                            value={phone}
                                            onChange={val => {
                                                const newPhones = [...formData.phones];
                                                newPhones[i] = val;
                                                updateFormData({ phones: newPhones });
                                            }}
                                            helperText={i === 0 ? "Direkte Erreichbarkeit" : undefined}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removePhone(i)}
                                        className={clsx(
                                            "h-9 px-3 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-md transition flex-shrink-0",
                                            i === 0 && formData.phones.length === 1 ? "hidden" : ""
                                        )}
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            ))}
                            {!isCompact && (
                                <button type="button" onClick={addPhone} className="text-[10px] text-brand-600 font-bold flex items-center gap-1.5 hover:text-brand-700 transition-colors uppercase py-1 ml-1">
                                    <FaPlus className="text-[8px]" /> Weitere Nummer hinzufügen
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section: Standort & Adresse */}
            <div className="space-y-6">
                {!isCompact && (
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">03</div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Standort & Adresse</h4>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-x-8 gap-y-6">
                    {!isCompact && (
                        <>
                            <div className="col-span-12 md:col-span-9">
                                <Input
                                    label="Straße"
                                    placeholder="z.B. Königsplatz"
                                    value={formData.street}
                                    onChange={e => updateFormData({ street: e.target.value })}
                                    helperText="Straßenbezeichnung"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-3">
                                <Input
                                    label="Nr."
                                    placeholder="10"
                                    value={formData.houseNo}
                                    onChange={e => updateFormData({ houseNo: e.target.value })}
                                    helperText="Hausnummer"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <Input
                                    label="PLZ"
                                    placeholder="34117"
                                    value={formData.zip}
                                    maxLength={10}
                                    error={!!getError('zip')}
                                    onChange={e => updateFormData({ zip: e.target.value })}
                                    onBlur={() => markTouched('zip')}
                                    helperText={getError('zip') || "5-stellige Postleitzahl"}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-8">
                                <Input
                                    label="Stadt"
                                    placeholder="Kassel"
                                    className="font-bold"
                                    value={formData.city}
                                    onChange={e => updateFormData({ city: e.target.value })}
                                    helperText="Vollständiger Name des Wohnorts"
                                />
                            </div>

                            <div className="col-span-12">
                                <CountrySelect
                                    label="Land"
                                    value={formData.country || 'Deutschland'}
                                    onChange={v => updateFormData({ country: v })}
                                    helperText="Land für steuerliche Zuordnung"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {!isCompact && (
                <>
                    {/* Section: Kompetenzen */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">04</div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kompetenzen & IT</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="col-span-2">
                                <Input
                                    label="Fachgebiete / Spezialisierung"
                                    placeholder="z.B. Recht, Technik, Medizin..."
                                    value={Array.isArray(formData.domains) ? formData.domains.join(', ') : formData.domains}
                                    onChange={e => updateFormData({ domains: e.target.value })}
                                    helperText="Thematische Schwerpunkte und Expertise des Partners"
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    label="Software-Kenntnisse"
                                    placeholder="z.B. SDL Trados, Memsource, memoQ..."
                                    value={formData.software}
                                    onChange={e => updateFormData({ software: e.target.value })}
                                    helperText="Verfügbare CAT-Tools und andere relevante Fachsoftware"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Bankdaten */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">05</div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Finanzen & Steuer</h4>
                        </div>

                        <div className="grid grid-cols-12 gap-x-8 gap-y-6">
                            <div className="col-span-12 md:col-span-4">
                                <Input label="Kreditinstitut" placeholder="Name der Bank" value={formData.bankName} onChange={e => updateFormData({ bankName: e.target.value })} helperText="Name der Bankgesellschaft" />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <Input label="BIC (SWIFT)" placeholder="DABA DE HH XXX" className="uppercase" value={formData.bic} error={!!getError('bic')} onChange={e => updateFormData({ bic: e.target.value })} onBlur={() => markTouched('bic')} helperText={getError('bic') || "Internationale Kennung"} />
                            </div>
                            <div className="col-span-6 md:col-span-5">
                                <Input label="IBAN" placeholder="DE12 3456 ..." className="font-bold" value={formData.iban} error={!!getError('iban')} onChange={e => updateFormData({ iban: e.target.value })} onBlur={() => markTouched('iban')} helperText={getError('iban') || "Internationale Kontonummer"} />
                            </div>

                            <div className="col-span-12 md:col-span-4">
                                <Input
                                    label="Zahlungsziel (Tage)"
                                    type="number"
                                    min={0}
                                    value={formData.paymentTerms}
                                    onChange={e => updateFormData({ paymentTerms: e.target.value })}
                                    className="font-bold"
                                    helperText="Frist in Tagen ab Rechnungserhalt"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-8">
                                <Input
                                    label="Steuernummer / USt-IdNr."
                                    placeholder="DE123456789"
                                    value={formData.taxId}
                                    onChange={e => updateFormData({ taxId: e.target.value })}
                                    className="font-bold uppercase"
                                    helperText="Wichtig für die korrekte Abrechnung von Honoraren"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Tarife */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">06</div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Konditionen & Tarife</h4>
                        </div>

                        <div className="grid grid-cols-12 gap-x-8 gap-y-6">
                            <div className="col-span-12 md:col-span-4">
                                <Input
                                    label="Wortpreis (Netto)"
                                    type="number"
                                    step="0.001"
                                    min={0}
                                    placeholder="0.080"
                                    value={formData.unitRates.word}
                                    onChange={e => updateFormData({ unitRates: { ...formData.unitRates, word: e.target.value } })}
                                    endIcon={<span className="text-[10px] font-bold text-slate-300">€</span>}
                                    helperText="Netto-Preis pro Wort"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <Input
                                    label="Zeilenpreis (Netto)"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder="1.20"
                                    value={formData.unitRates.line}
                                    onChange={e => updateFormData({ unitRates: { ...formData.unitRates, line: e.target.value } })}
                                    endIcon={<span className="text-[10px] font-bold text-slate-300">€</span>}
                                    helperText="Preis pro Normzeile (55 Anschläge)"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <Input
                                    label="Stundensatz (Netto)"
                                    type="number"
                                    step="1"
                                    min={0}
                                    placeholder="55.00"
                                    value={formData.unitRates.hour}
                                    onChange={e => updateFormData({ unitRates: { ...formData.unitRates, hour: e.target.value } })}
                                    endIcon={<span className="text-[10px] font-bold text-slate-300">€</span>}
                                    helperText="Für Dolmetschen oder Lektorat"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <Input
                                    label="Mindestpauschale"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder="45.00"
                                    value={formData.flatRates.minimum}
                                    onChange={e => updateFormData({ flatRates: { ...formData.flatRates, minimum: e.target.value } })}
                                    endIcon={<span className="text-[10px] font-bold text-slate-300">€</span>}
                                    helperText="Min. Vergütung pro Auftrag"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <Input
                                    label="Beglaubigungsgebühr"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder="5.00"
                                    value={formData.flatRates.cert}
                                    onChange={e => updateFormData({ flatRates: { ...formData.flatRates, cert: e.target.value } })}
                                    endIcon={<span className="text-[10px] font-bold text-slate-300">€</span>}
                                    helperText="Pauschale pro Beglaubigungssatz"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Internes */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">07</div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Interne Akte & Notizen</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Input
                                    isSelect
                                    label="Basis-Status"
                                    className="font-bold"
                                    value={formData.status}
                                    onChange={e => updateFormData({ status: e.target.value })}
                                    helperText="Bestimmt die Sichtbarkeit in Projekten"
                                >
                                    <option value="available">Verfügbar / Aktiv</option>
                                    <option value="busy">Derzeit ausgelastet</option>
                                    <option value="vacation">Urlaub / Abwesend</option>
                                    <option value="blacklisted">Gesperrt / Blacklist</option>
                                </Input>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Bewertung / Ranking</label>
                                <div className="flex items-center gap-3 h-11 bg-white ">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => updateFormData({ rating: star })}
                                            className={clsx("transition-all hover:scale-125", formData.rating >= star ? "text-amber-400" : "text-slate-200")}
                                        >
                                            <FaStar size={24} />
                                        </button>
                                    ))}
                                    <span className="ml-2 text-xs font-black text-slate-600">{formData.rating}.0</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium ml-1">Qualitätsindex basierend auf Feedback</p>
                            </div>
                            <div className="col-span-2">
                                <Input
                                    label="Interne Notizen"
                                    isTextArea
                                    placeholder="Interne Anmerkungen / Erfahrungen / Feedback (nur für Admins sichtbar)..."
                                    value={formData.notes}
                                    onChange={(e) => updateFormData({ notes: e.target.value })}
                                    helperText="Informationen werden nicht an den Partner kommuniziert"
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PartnerForm;
