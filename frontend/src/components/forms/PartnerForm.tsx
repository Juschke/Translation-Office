import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaStar } from 'react-icons/fa';
import LanguageSelect from '../common/LanguageSelect';
import Input from '../common/Input';
import CountrySelect from '../common/CountrySelect';
import clsx from 'clsx';

interface PartnerFormProps {
    initialData?: any;
    onChange: (data: any) => void;
    validationErrors?: Set<string>;
    layout?: 'full' | 'compact';
}

const PartnerForm: React.FC<PartnerFormProps> = ({
    initialData,
    onChange,
    validationErrors = new Set(),
    layout = 'full'
}) => {
    const [formData, setFormData] = useState({
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

    useEffect(() => {
        if (initialData) {
            // Map snake_case from API to camelCase for form state
            const mappedData = {
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
        } else {
            onChange(formData);
        }
    }, [initialData]);

    const updateFormData = (updates: Partial<typeof formData>) => {
        const newData = { ...formData, ...updates };
        setFormData(newData);
        onChange(newData);
    };

    const addEmail = () => updateFormData({ emails: [...formData.emails, ''] });
    const removeEmail = (index: number) => updateFormData({ emails: formData.emails.filter((_, i) => i !== index) });
    const updateEmail = (index: number, val: string) => {
        const newEmails = [...formData.emails];
        newEmails[index] = val;
        updateFormData({ emails: newEmails });
    };

    const addPhone = () => updateFormData({ phones: [...formData.phones, ''] });
    const removePhone = (index: number) => updateFormData({ phones: formData.phones.filter((_, i) => i !== index) });
    const updatePhone = (index: number, val: string) => {
        const newPhones = [...formData.phones];
        newPhones[index] = val;
        updateFormData({ phones: newPhones });
    };



    const partnerTypes = [
        { value: 'translator', label: 'Übersetzer' },
        { value: 'trans_interp', label: 'Übersetzer & Dolmetscher' },
        { value: 'interpreter', label: 'Dolmetscher' },
        { value: 'agency', label: 'Agentur' }
    ];

    const isCompact = layout === 'compact';

    return (
        <div className={clsx(isCompact ? "space-y-6" : "space-y-10 pb-10")}>
            {/* Section: Typ & Basis */}
            <div className="space-y-6">
                {!isCompact && (
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">01</div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Klassifizierung & Name</h4>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                    <div className="col-span-12">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Partner-Typ</label>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 w-fit">
                            {partnerTypes.map(pt => (
                                <button
                                    key={pt.value}
                                    type="button"
                                    onClick={() => updateFormData({ type: pt.value })}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all",
                                        formData.type === pt.value ? "bg-white text-brand-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {pt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-2">
                        <Input
                            isSelect
                            label="Anrede"
                            value={formData.salutation}
                            onChange={e => updateFormData({ salutation: e.target.value })}
                        >
                            <option>Herr</option><option>Frau</option><option>Divers</option>
                        </Input>
                    </div>
                    <div className="col-span-12 md:col-span-5">
                        <Input
                            label="Vorname"
                            placeholder="Vorname *"
                            value={formData.firstName}
                            error={validationErrors.has('firstName')}
                            onChange={e => updateFormData({ firstName: e.target.value })}
                        />
                    </div>
                    <div className="col-span-12 md:col-span-5">
                        <Input
                            label="Nachname"
                            placeholder="Nachname *"
                            value={formData.lastName}
                            error={validationErrors.has('lastName')}
                            onChange={e => updateFormData({ lastName: e.target.value })}
                        />
                    </div>

                    {formData.type === 'agency' && (
                        <div className="col-span-12 animate-fadeIn">
                            <Input
                                label="Agenturname / Firma"
                                placeholder="Agenturname / Firma *"
                                value={formData.company}
                                error={validationErrors.has('company')}
                                onChange={e => updateFormData({ company: e.target.value })}
                                className="font-bold"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Section: Kontakt & Sprachen */}
            <div className="space-y-6">
                {!isCompact && (
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">02</div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kontakt & Standort</h4>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                    {!isCompact && (
                        <>
                            <div className="col-span-12 md:col-span-9">
                                <Input
                                    label="Straße"
                                    placeholder="Straße *"
                                    value={formData.street}
                                    error={validationErrors.has('street')}
                                    onChange={e => updateFormData({ street: e.target.value })}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-3">
                                <Input
                                    label="Nr."
                                    placeholder="Nr. *"
                                    className="text-center"
                                    value={formData.houseNo}
                                    error={validationErrors.has('houseNo')}
                                    onChange={e => updateFormData({ houseNo: e.target.value })}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <Input
                                    label="PLZ"
                                    placeholder="PLZ *"
                                    value={formData.zip}
                                    error={validationErrors.has('zip')}
                                    onChange={e => {
                                        const val = e.target.value;
                                        // Simple simulated autofill for demo purposes if country is DE
                                        let cityUpdate = {};
                                        if (formData.country === 'Deutschland' && val.length === 5) {
                                            // TODO: Real lookup
                                            // updateFormData({ zip: val, city: 'Musterstadt' }); // Example
                                        }
                                        updateFormData({ zip: val, ...cityUpdate });
                                    }}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-8">
                                <Input
                                    label="Stadt"
                                    placeholder="Stadt *"
                                    className="font-bold"
                                    value={formData.city}
                                    error={validationErrors.has('city')}
                                    onChange={e => updateFormData({ city: e.target.value })}
                                />
                            </div>

                            {/* Country in its own row */}
                            <div className="col-span-12">
                                <CountrySelect
                                    label="Land"
                                    placeholder="Land *"
                                    value={formData.country || 'Deutschland'}
                                    onChange={v => updateFormData({ country: v })}
                                />
                            </div>
                        </>
                    )}

                    <div className="col-span-12 md:col-span-6 space-y-3">
                        <div className="space-y-2">
                            {formData.emails.map((email, i) => (
                                <div key={i} className="flex gap-2 group">
                                    <Input
                                        label={i === 0 ? "E-Mail" : undefined}
                                        type="email"
                                        placeholder={i === 0 ? "E-Mail Adresse *" : "Weitere E-Mail Adresse"}
                                        value={email}
                                        error={validationErrors.has('email') && i === 0}
                                        onChange={e => updateEmail(i, e.target.value)}
                                    />
                                    {(formData.emails.length > 1 || !isCompact) && formData.emails.length > 1 && (
                                        <button onClick={() => removeEmail(i)} className="h-11 px-3 flex items-center justify-center text-slate-300 hover:text-red-500 bg-slate-50 border border-slate-200 transition flex-shrink-0">
                                            <FaTrash size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {!isCompact && (
                                <button onClick={addEmail} className="text-[10px] text-brand-600 font-bold flex items-center gap-1.5 hover:underline uppercase py-1 ml-1">
                                    <FaPlus size={8} /> Weitere E-Mail
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-6 space-y-3">
                        <div className="space-y-2">
                            {formData.phones.map((phone, i) => (
                                <div key={i} className="flex gap-2 group">
                                    <Input
                                        label={i === 0 ? "Telefon/Mobil" : undefined}
                                        type="tel"
                                        placeholder={i === 0 ? "Telefon" : i === 1 ? "Mobil" : "Weitere Nummer"}
                                        value={phone}
                                        onChange={e => updatePhone(i, e.target.value)}
                                    />
                                    {(formData.phones.length > 1) && (
                                        <button onClick={() => removePhone(i)} className="h-11 px-3 flex items-center justify-center text-slate-300 hover:text-red-500 bg-slate-50 border border-slate-200 transition flex-shrink-0">
                                            <FaTrash size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {!isCompact && (
                                <button onClick={addPhone} className="text-[10px] text-brand-600 font-bold flex items-center gap-1.5 hover:underline uppercase py-1 ml-1">
                                    <FaPlus size={8} /> Weitere Nummer
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-span-12 space-y-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sprachen (Aktiv) *</label>
                        <LanguageSelect
                            isMulti={true}
                            value={formData.languages}
                            onChange={v => updateFormData({ languages: v })}
                            placeholder="Sprachen auswählen..."
                        />
                    </div>
                </div>
            </div>

            {!isCompact && (
                <>
                    {/* Section: Kompetenzen (Extended) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">03</div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kompetenzen & IT</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="col-span-2">
                                <Input
                                    label="Fachgebiete / Spezialisierung"
                                    placeholder="Fachgebiete / Sprachpaare / Fokus"
                                    value={Array.isArray(formData.domains) ? formData.domains.join(', ') : formData.domains}
                                    onChange={e => updateFormData({ domains: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 mt-1 ml-1">Geben Sie hier Ihre Fachgebiete oder Sprachkombinationen als Freitext ein.</p>
                            </div>
                            <div className="col-span-2">
                                <Input
                                    label="Software-Kenntnisse"
                                    placeholder="Software-Kenntnisse (CAT Tools)"
                                    value={formData.software}
                                    onChange={e => updateFormData({ software: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Bankdaten */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">04</div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Bankdaten & Finanzen</h4>
                        </div>

                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 md:col-span-4">
                                <Input label="Name der Bank" placeholder="Name der Bank" value={formData.bankName} error={validationErrors.has('bankName')} onChange={e => updateFormData({ bankName: e.target.value })} />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <Input label="BIC" placeholder="BIC" className="uppercase" value={formData.bic} error={validationErrors.has('bic')} onChange={e => updateFormData({ bic: e.target.value })} />
                            </div>
                            <div className="col-span-6 md:col-span-5">
                                <Input label="IBAN" placeholder="IBAN" className="font-bold" value={formData.iban} error={validationErrors.has('iban')} onChange={e => updateFormData({ iban: e.target.value })} />
                            </div>

                            <div className="col-span-4">
                                <Input
                                    label="Zahlungsziel (Tage)"
                                    type="number"
                                    value={formData.paymentTerms}
                                    onChange={e => updateFormData({ paymentTerms: e.target.value })}
                                    className="font-bold"
                                />
                            </div>
                            <div className="col-span-8">
                                <Input
                                    label="Steuer-ID / USt-IdNr."
                                    placeholder="USt-IdNr. / Steuer-ID"
                                    value={formData.taxId}
                                    error={validationErrors.has('taxId')}
                                    onChange={e => updateFormData({ taxId: e.target.value })}
                                    className="font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Tarife */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">05</div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Konditionen & Tarife</h4>
                        </div>

                        <div className="grid grid-cols-12 gap-x-6 gap-y-6">
                            <div className="col-span-12 md:col-span-4">
                                <Input
                                    label="Wortpreis (Netto)"
                                    type="number"
                                    step="0.001"
                                    placeholder="0.080"
                                    value={formData.unitRates.word}
                                    onChange={e => updateFormData({ unitRates: { ...formData.unitRates, word: e.target.value } })}
                                    endIcon={<span className="text-[10px] font-bold text-slate-300">€</span>}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <Input
                                    label="Zeilenpreis (Netto)"
                                    type="number"
                                    step="0.01"
                                    placeholder="1.20"
                                    value={formData.unitRates.line}
                                    onChange={e => updateFormData({ unitRates: { ...formData.unitRates, line: e.target.value } })}
                                    endIcon={<span className="text-[10px] font-bold text-slate-300">€</span>}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <Input
                                    label="Stundensatz (Netto)"
                                    type="number"
                                    step="1"
                                    placeholder="55.00"
                                    value={formData.unitRates.hour}
                                    onChange={e => updateFormData({ unitRates: { ...formData.unitRates, hour: e.target.value } })}
                                    endIcon={<span className="text-[10px] font-bold text-slate-300">€</span>}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <Input
                                    label="Mindestpauschale"
                                    type="number"
                                    step="0.01"
                                    placeholder="45.00"
                                    value={formData.flatRates.minimum}
                                    onChange={e => updateFormData({ flatRates: { ...formData.flatRates, minimum: e.target.value } })}
                                    endIcon={<span className="text-[10px] font-bold text-slate-300">€</span>}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <Input
                                    label="Beglaubigungsgebühr"
                                    type="number"
                                    step="0.01"
                                    placeholder="5.00"
                                    value={formData.flatRates.cert}
                                    onChange={e => updateFormData({ flatRates: { ...formData.flatRates, cert: e.target.value } })}
                                    endIcon={<span className="text-[10px] font-bold text-slate-300">€</span>}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Internes */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <div className="w-6 h-6 rounded bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-black uppercase">06</div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Interne Akte & Notizen</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Input
                                    isSelect
                                    label="Basis-Status"
                                    className="font-bold"
                                    value={formData.status}
                                    onChange={e => updateFormData({ status: e.target.value })}
                                >
                                    <option value="available">Verfügbar / Aktiv</option>
                                    <option value="busy">Derzeit ausgelastet</option>
                                    <option value="vacation">Urlaub / Abwesend</option>
                                    <option value="blacklisted">Gesperrt / Blacklist</option>
                                </Input>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bewertung / Ranking</label>
                                <div className="flex items-center gap-3 h-8 bg-white ">
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
                            </div>
                            <div className="col-span-2">
                                <Input
                                    label="Interne Notizen"
                                    isTextArea
                                    placeholder="Interne Anmerkungen / Erfahrungen / Feedback..."
                                    value={formData.notes}
                                    onChange={(e) => updateFormData({ notes: e.target.value })}
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
