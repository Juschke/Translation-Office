import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash, FaUser, FaMapMarkerAlt, FaEnvelope, FaPhone, FaInfoCircle } from 'react-icons/fa';
import Input from '../common/Input';
import CountrySelect from '../common/CountrySelect';

interface NewCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const NewCustomerModal: React.FC<NewCustomerModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        type: 'private',
        salutation: 'Herr',
        first_name: '',
        last_name: '',
        company_name: '',
        address_street: '',
        address_house_no: '',
        address_zip: '',
        address_city: '',
        address_country: 'DE',
        email: '',
        phone: '',
        notes: '',
        additional_emails: [] as string[],
        additional_phones: [] as string[],
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                additional_emails: initialData.additional_emails || [],
                additional_phones: initialData.additional_phones || [],
                type: (initialData.type === 'Firma' || initialData.type === 'company') ? 'company' :
                    (initialData.type === 'Privat' || initialData.type === 'private') ? 'private' : 'authority',
            });
        } else if (isOpen) {
            setFormData({
                type: 'private',
                salutation: 'Herr',
                first_name: '',
                last_name: '',
                company_name: '',
                address_street: '',
                address_house_no: '',
                address_zip: '',
                address_city: '',
                address_country: 'DE',
                email: '',
                phone: '',
                notes: '',
                additional_emails: [],
                additional_phones: [],
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (index: number, value: string, field: 'additional_emails' | 'additional_phones') => {
        const newArr = [...formData[field]];
        newArr[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArr }));
    };

    const addField = (field: 'additional_emails' | 'additional_phones') => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeField = (field: 'additional_emails' | 'additional_phones', index: number) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up transform transition-all">
                <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-3">
                            {initialData ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}
                            <span className="text-xs font-normal text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase">
                                Stammdaten & Kontakt
                            </span>
                        </h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 bg-white">
                        {/* Section 1: Classification */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaUser className="text-brand-600" /> Kunden-Typ
                            </label>

                            <div className="flex bg-slate-100 p-1 rounded border border-slate-200 w-fit">
                                <button type="button" onClick={() => setFormData(p => ({ ...p, type: 'private' }))} className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase transition ${formData.type === 'private' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-700'}`}>Privat</button>
                                <button type="button" onClick={() => setFormData(p => ({ ...p, type: 'company' }))} className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase transition ${formData.type === 'company' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-700'}`}>Firma</button>
                                <button type="button" onClick={() => setFormData(p => ({ ...p, type: 'authority' }))} className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase transition ${formData.type === 'authority' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-700'}`}>Behörde</button>
                            </div>

                            <div className="grid grid-cols-6 gap-4 mt-6">
                                {(formData.type === 'company' || formData.type === 'authority') && (
                                    <div className="col-span-6 animate-fadeIn">
                                        <Input
                                            label={formData.type === 'authority' ? 'Behörde / Institution' : 'Firmenname'}
                                            name="company_name"
                                            value={formData.company_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                )}
                                <div className="col-span-1">
                                    <Input
                                        isSelect
                                        label="Anrede"
                                        name="salutation"
                                        value={formData.salutation}
                                        onChange={handleChange}
                                    >
                                        <option value="Herr">Herr</option>
                                        <option value="Frau">Frau</option>
                                    </Input>
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="Vorname"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <Input
                                        label="Nachname *"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100"></div>

                        {/* Section 2: Address */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaMapMarkerAlt className="text-brand-600" /> Adresse
                            </label>
                            <div className="grid grid-cols-6 gap-4">
                                <div className="col-span-5">
                                    <Input
                                        label="Straße"
                                        name="address_street"
                                        value={formData.address_street}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Input
                                        label="Nr."
                                        name="address_house_no"
                                        value={formData.address_house_no}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="PLZ"
                                        name="address_zip"
                                        value={formData.address_zip}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({ ...prev, address_zip: val }));
                                            // Simple simulated autofill for demo
                                            if (formData.address_country === 'DE' && val.length === 5) {
                                                // TODO: Real lookup
                                                // setFormData(prev => ({ ...prev, address_city: 'Musterstadt' }));
                                            }
                                        }}
                                    />
                                </div>
                                <div className="col-span-4">
                                    <Input
                                        label="Stadt"
                                        name="address_city"
                                        value={formData.address_city}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-span-6">
                                    <CountrySelect
                                        label="Land"
                                        value={formData.address_country || 'DE'}
                                        onChange={(val) => setFormData(prev => ({ ...prev, address_country: val }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100"></div>

                        {/* Section 3: Contact */}
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                    <FaEnvelope className="text-brand-600" /> Kontakt E-Mail
                                </label>
                                <div className="space-y-4">
                                    <Input
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        type="email"
                                        placeholder="Haupt-Email"
                                    />
                                    <div className="space-y-2">
                                        {formData.additional_emails.map((email, i) => (
                                            <div key={i} className="flex gap-2">
                                                <Input
                                                    value={email}
                                                    onChange={(e) => handleArrayChange(i, e.target.value, 'additional_emails')}
                                                    type="email"
                                                    placeholder="Weitere Email"
                                                />
                                                <button type="button" onClick={() => removeField('additional_emails', i)} className="text-slate-300 hover:text-red-500 transition"><FaTrash /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addField('additional_emails')} className="text-[10px] text-brand-600 font-bold flex items-center gap-1 hover:underline uppercase">
                                            <FaPlus className="text-[8px]" /> Weitere E-Mail
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                    <FaPhone className="text-brand-600" /> Telefonnummer
                                </label>
                                <div className="space-y-4">
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        type="tel"
                                        placeholder="Haupt-Telefon"
                                    />
                                    <div className="space-y-2">
                                        {formData.additional_phones.map((phone, i) => (
                                            <div key={i} className="flex gap-2">
                                                <Input
                                                    value={phone}
                                                    onChange={(e) => handleArrayChange(i, e.target.value, 'additional_phones')}
                                                    type="tel"
                                                    placeholder="Weitere Nummer"
                                                />
                                                <button type="button" onClick={() => removeField('additional_phones', i)} className="text-slate-300 hover:text-red-500 transition"><FaTrash /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addField('additional_phones')} className="text-[10px] text-brand-600 font-bold flex items-center gap-1 hover:underline uppercase">
                                            <FaPlus className="text-[8px]" /> Weitere Nummer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100"></div>

                        {/* Section 4: Notes */}
                        <div className="space-y-4 pb-8">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaInfoCircle className="text-brand-600" /> Notizen
                            </label>
                            <Input
                                isTextArea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Interne Notizen..."
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded border border-slate-300 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-white transition"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 bg-brand-700 text-white rounded text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-brand-800 transition transform hover:scale-105 active:scale-95"
                        >
                            Kunde speichern
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewCustomerModal;
