import React, { useState } from 'react';
import { FaTimes, FaPlus, FaTrash, FaUser, FaMapMarkerAlt, FaEnvelope, FaPhone, FaInfoCircle } from 'react-icons/fa';

interface NewCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const NewCustomerModal: React.FC<NewCustomerModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [type, setType] = useState('private');
    const [emails, setEmails] = useState<string[]>(['']);
    const [phones, setPhones] = useState<string[]>(['']);
    React.useEffect(() => {
        if (initialData) {
            setType(initialData.type === 'Firma' ? 'company' : 'private');
            setEmails(initialData.email ? [initialData.email] : ['']);
        } else {
            setType('private');
            setEmails(['']);
            setPhones(['']);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => [...prev, '']);
    };

    const removeField = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
        setter(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up transform transition-all">

                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-3">
                        Neuen Kunden anlegen
                        <span className="text-xs font-normal text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase">
                            Stammdaten & Kontakt
                        </span>
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
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
                            <button onClick={() => setType('private')} className={`px-6 py-1.5 rounded text-[10px] font-bold uppercase transition ${type === 'private' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-700'}`}>Privat</button>
                            <button onClick={() => setType('company')} className={`px-6 py-1.5 rounded text-[10px] font-bold uppercase transition ${type === 'company' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-700'}`}>Firma</button>
                        </div>

                        <div className="grid grid-cols-6 gap-4 mt-6">
                            {type === 'company' && (
                                <div className="col-span-6 animate-fadeIn">
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Firmenname *</label>
                                    <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-brand-500 shadow-sm h-10 transition" />
                                </div>
                            )}
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Anrede</label>
                                <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-brand-500 shadow-sm h-10 transition">
                                    <option>Herr</option><option>Frau</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vorname *</label>
                                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-brand-500 shadow-sm h-10 transition" />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nachname *</label>
                                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-brand-500 shadow-sm h-10 transition" />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100"></div>

                    {/* Section 2: Address */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-brand-600" /> Adresse
                        </label>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Straße</label>
                                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white shadow-sm h-10" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nr.</label>
                                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white shadow-sm h-10" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PLZ</label>
                                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white shadow-sm h-10" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stadt</label>
                                <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white shadow-sm h-10" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Land</label>
                                <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white shadow-sm h-10">
                                    <option value="DE">Deutschland</option>
                                    <option value="AT">Österreich</option>
                                    <option value="CH">Schweiz</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100"></div>

                    {/* Section 3: Contact */}
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaEnvelope className="text-brand-600" /> E-Mail Adressen
                            </label>
                            <div className="space-y-2">
                                {emails.map((_, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input type="email" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm shadow-sm h-10" placeholder="email@beispiel.de" />
                                        {emails.length > 1 && <button onClick={() => removeField(setEmails, i)} className="text-slate-300 hover:text-red-500 transition"><FaTrash /></button>}
                                    </div>
                                ))}
                                <button onClick={() => addField(setEmails)} className="text-[10px] text-brand-600 font-bold flex items-center gap-1 hover:underline uppercase">
                                    <FaPlus className="text-[8px]" /> Weitere E-Mail
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaPhone className="text-brand-600" /> Telefonnummern
                            </label>
                            <div className="space-y-2">
                                {phones.map((_, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input type="tel" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm shadow-sm h-10" placeholder="+49..." />
                                        {phones.length > 1 && <button onClick={() => removeField(setPhones, i)} className="text-slate-300 hover:text-red-500 transition"><FaTrash /></button>}
                                    </div>
                                ))}
                                <button onClick={() => addField(setPhones)} className="text-[10px] text-brand-600 font-bold flex items-center gap-1 hover:underline uppercase">
                                    <FaPlus className="text-[8px]" /> Weitere Nummer
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100"></div>

                    {/* Section 4: Notes */}
                    <div className="space-y-4 pb-8">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                            <FaInfoCircle className="text-brand-600" /> Projekt-Informationen & Notizen
                        </label>
                        <textarea className="w-full border border-slate-300 rounded p-4 text-sm h-32 focus:border-brand-500 outline-none shadow-sm resize-none" placeholder="Besonderheiten bei Abrechnung, Fachterminologie-Wünsche, etc."></textarea>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded border border-slate-300 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-white transition"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={() => { onSubmit({}); onClose(); }}
                        className="px-8 py-2.5 bg-brand-700 text-white rounded text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-brand-800 transition transform hover:scale-105 active:scale-95"
                    >
                        Kunde speichern
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewCustomerModal;
