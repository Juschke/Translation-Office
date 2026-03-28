import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileAlt } from 'react-icons/fa';

interface NewDocTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    isLoading?: boolean;
}

const NewDocTypeModal: React.FC<NewDocTypeModalProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [defaultPrice, setDefaultPrice] = useState<string>('0.00');
    const [vatRate, setVatRate] = useState<string>('19.00');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setCategory(initialData.category || '');
            setDefaultPrice(initialData.default_price?.toString() || '0.00');
            setVatRate(initialData.vat_rate?.toString() || '19.00');
            setStatus(initialData.status || 'active');
        } else if (isOpen) {
            setName('');
            setCategory('');
            setDefaultPrice('0.00');
            setVatRate('19.00');
            setStatus('active');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
            name,
            category,
            default_price: parseFloat(defaultPrice) || 0,
            vat_rate: parseFloat(vatRate) || 0,
            status
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-sm shadow-sm w-full max-w-md flex flex-col overflow-hidden animate-fade-in-up transform transition-all">
                <form onSubmit={handleSave} className="flex flex-col">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-3">
                            <FaFileAlt className="text-slate-700" />
                            {initialData ? 'Dokumentenart bearbeiten' : 'Neue Dokumentenart'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 bg-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-2">Bezeichnung *</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm bg-white outline-none focus:border-slate-900 shadow-sm h-10 transition"
                                    placeholder="z.B. Geburtsurkunde, Vertrag..."
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-2">Kategorie</label>
                                <input
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    type="text"
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm bg-white outline-none focus:border-slate-900 shadow-sm h-10 transition"
                                    placeholder="z.B. Personenstandsurkunden, Recht..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">Standardpreis (€)</label>
                                <input
                                    value={defaultPrice}
                                    onChange={(e) => setDefaultPrice(e.target.value)}
                                    type="number"
                                    step="0.01"
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm bg-white outline-none focus:border-slate-900 shadow-sm h-10 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">MwSt.-Satz (%)</label>
                                <input
                                    value={vatRate}
                                    onChange={(e) => setVatRate(e.target.value)}
                                    type="number"
                                    step="0.01"
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm bg-white outline-none focus:border-slate-900 shadow-sm h-10 transition"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-2">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm bg-white outline-none focus:border-slate-900 shadow-sm h-10 transition"
                                >
                                    <option value="active">Aktiv</option>
                                    <option value="inactive">Inaktiv</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-sm border border-slate-300 text-slate-600 text-xs font-medium hover:bg-white transition"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="px-8 py-2.5 bg-slate-900 text-white rounded-sm text-xs font-medium shadow-sm hover:bg-slate-800 transition disabled:opacity-50 disabled:scale-100"
                        >
                            {isLoading ? 'Speichert...' : 'Speichern'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewDocTypeModal;
