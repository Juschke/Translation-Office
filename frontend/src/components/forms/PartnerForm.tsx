import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaStar } from 'react-icons/fa';
import MultiSelect from '../common/MultiSelect';
import LanguageSelect from '../common/LanguageSelect';
import Input from '../common/Input';
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
        emails: [''],
        phones: [''],
        languages: [] as string[],
        domains: [] as string[],
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
            setFormData(prev => ({ ...prev, ...initialData }));
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



    const domainOptions = [
        { value: 'legal', label: 'Recht' }, { value: 'tech', label: 'Technik' },
        { value: 'med', label: 'Medizin' }, { value: 'marketing', label: 'Marketing' },
        { value: 'it', label: 'IT & Software' }, { value: 'fin', label: 'Finanzen' }
    ];

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
                            label="Vorname *"
                            placeholder="Vorname"
                            value={formData.firstName}
                            error={validationErrors.has('firstName')}
                            onChange={e => updateFormData({ firstName: e.target.value })}
                        />
                    </div>
                    <div className="col-span-12 md:col-span-5">
                        <Input
                            label="Nachname *"
                            placeholder="Nachname"
                            value={formData.lastName}
                            error={validationErrors.has('lastName')}
                            onChange={e => updateFormData({ lastName: e.target.value })}
                        />
                    </div>

                    {formData.type === 'agency' && (
                        <div className="col-span-12 animate-fadeIn">
                            <Input
                                label="Agenturname / Firma *"
                                placeholder="Name der Agentur oder Firma"
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
                            <div className="col-span-9">
                                <Input
                                    label="Straße"
                                    placeholder="Straße"
                                    value={formData.street}
                                    onChange={e => updateFormData({ street: e.target.value })}
                                />
                            </div>
                            <div className="col-span-3">
                                <Input
                                    label="Nr."
                                    placeholder="Nr."
                                    className="text-center"
                                    value={formData.houseNo}
                                    onChange={e => updateFormData({ houseNo: e.target.value })}
                                />
                            </div>
                            <div className="col-span-4">
                                <Input
                                    label="PLZ"
                                    placeholder="PLZ"
                                    value={formData.zip}
                                    onChange={e => updateFormData({ zip: e.target.value })}
                                />
                            </div>
                            <div className="col-span-8">
                                <Input
                                    label="Stadt"
                                    placeholder="Stadt"
                                    className="font-bold"
                                    value={formData.city}
                                    onChange={e => updateFormData({ city: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <div className="col-span-12 md:col-span-6 space-y-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">E-Mail Adresse *</label>
                        <div className="space-y-2">
                            {formData.emails.map((email, i) => (
                                <div key={i} className="flex gap-2 group">
                                    <Input
                                        type="email"
                                        placeholder="email@beispiel.de"
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
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Telefonnummer</label>
                        <div className="space-y-2">
                            {formData.phones.map((phone, i) => (
                                <div key={i} className="flex gap-2 group">
                                    <Input
                                        type="tel"
                                        placeholder="+49 ..."
                                        value={phone}
                                        onChange={e => updatePhone(i, e.target.value)}
                                    />
                                    {(formData.phones.length > 1 || !isCompact) && formData.phones.length > 1 && (
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
                            <MultiSelect
                                label="Fachgebiete / Fokus"
                                placeholder="Kompetenzen auswählen..."
                                options={domainOptions}
                                value={formData.domains}
                                onChange={v => updateFormData({ domains: v })}
                            />
                            <div className="col-span-2">
                                <Input
                                    label="Software-Kenntnisse (CAT Tools)"
                                    placeholder="SDL Trados Studio, memoQ, Memsource, Wordfast..."
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
                                <Input label="Name der Bank" value={formData.bankName} onChange={e => updateFormData({ bankName: e.target.value })} placeholder="Hausbank" />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <Input label="BIC" className="uppercase font-mono" value={formData.bic} onChange={e => updateFormData({ bic: e.target.value })} placeholder="BIC" />
                            </div>
                            <div className="col-span-6 md:col-span-5">
                                <Input label="IBAN" className="font-bold font-mono" value={formData.iban} onChange={e => updateFormData({ iban: e.target.value })} placeholder="DE00 0000 0000 ..." />
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
                                    label="USt-IdNr. / Steuer-ID"
                                    value={formData.taxId}
                                    onChange={e => updateFormData({ taxId: e.target.value })}
                                    placeholder="z.B. DE123456789"
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

                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-inner space-y-8">
                            <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300 h-10 w-fit mx-auto">
                                <button type="button" onClick={() => updateFormData({ priceMode: 'per_unit' })} className={clsx("px-6 text-[10px] font-bold uppercase rounded-md transition-all", formData.priceMode === 'per_unit' ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Basisraten per Einheit</button>
                                <button type="button" onClick={() => updateFormData({ priceMode: 'flat' })} className={clsx("px-6 text-[10px] font-bold uppercase rounded-md transition-all", formData.priceMode === 'flat' ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Pauschalpreise</button>
                                <button type="button" onClick={() => updateFormData({ priceMode: 'matrix' })} className={clsx("px-6 text-[10px] font-bold uppercase rounded-md transition-all", formData.priceMode === 'matrix' ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>TM-Preismatrix</button>
                            </div>

                            {formData.priceMode === 'per_unit' && (
                                <div className="grid grid-cols-3 gap-6 animate-fadeIn">
                                    <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Wortpreis (Netto)</label>
                                        <div className="relative w-28">
                                            <input type="number" step="0.001" className="w-full h-10 border border-slate-300 rounded-md px-3 text-sm font-black text-center outline-none focus:border-brand-500" value={formData.unitRates.word} onChange={e => updateFormData({ unitRates: { ...formData.unitRates, word: e.target.value } })} placeholder="0.080" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">€</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Zeilenpreis (Netto)</label>
                                        <div className="relative w-28">
                                            <input type="number" step="0.01" className="w-full h-10 border border-slate-300 rounded-md px-3 text-sm font-black text-center outline-none focus:border-brand-500" value={formData.unitRates.line} onChange={e => updateFormData({ unitRates: { ...formData.unitRates, line: e.target.value } })} placeholder="1.20" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">€</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Stundensatz (Netto)</label>
                                        <div className="relative w-28">
                                            <input type="number" step="1" className="w-full h-10 border border-slate-300 rounded-md px-3 text-sm font-black text-center outline-none focus:border-brand-500" value={formData.unitRates.hour} onChange={e => updateFormData({ unitRates: { ...formData.unitRates, hour: e.target.value } })} placeholder="55.00" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">€</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.priceMode === 'flat' && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">Mindestpauschale (Kleineinsätze)</span>
                                        <div className="relative w-32">
                                            <input type="number" className="w-full h-10 border border-slate-300 rounded-md px-4 text-right text-sm font-black pr-8 outline-none focus:border-brand-500" value={formData.flatRates.minimum} onChange={e => updateFormData({ flatRates: { ...formData.flatRates, minimum: e.target.value } })} placeholder="45.00" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">€</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">Beglaubigungsgebühr (Fixum pro Dok.)</span>
                                        <div className="relative w-32">
                                            <input type="number" className="w-full h-10 border border-slate-300 rounded-md px-4 text-right text-sm font-black pr-8 outline-none focus:border-brand-500" value={formData.flatRates.cert} onChange={e => updateFormData({ flatRates: { ...formData.flatRates, cert: e.target.value } })} placeholder="5.00" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">€</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.priceMode === 'matrix' && (
                                <div className="animate-fadeIn p-8 border-2 border-dashed border-slate-300 rounded-lg bg-white text-center">
                                    <FaCreditCard className="mx-auto text-slate-200 text-3xl mb-3" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Detaillierte TM-Analyse-Sätze</p>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">Hier können Sie individuelle Rabattstaffeln für Matches (100%, 95-99%, etc.) konfigurieren.</p>
                                    <button type="button" className="px-6 py-2 bg-brand-50 text-brand-700 rounded text-[10px] font-black uppercase hover:bg-brand-100 transition border border-brand-200">Matrix-Editor öffnen</button>
                                </div>
                            )}
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
                                <div className="flex items-center gap-3 h-11 bg-slate-50 border border-slate-200 rounded px-4">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => updateFormData({ rating: star })}
                                            className={clsx("transition-all hover:scale-125", formData.rating >= star ? "text-amber-400" : "text-slate-200")}
                                        >
                                            <FaStar size={18} />
                                        </button>
                                    ))}
                                    <span className="ml-2 text-xs font-black text-slate-600">{formData.rating}.0</span>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <Input
                                    isTextArea
                                    label="Interne Anmerkungen / Erfahrungen"
                                    placeholder="Zusätzliche Infos, Team-Feedback, Spezialprojekte..."
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
