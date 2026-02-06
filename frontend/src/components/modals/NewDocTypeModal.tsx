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

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
        } else if (isOpen) {
            setName('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-fade-in-up transform transition-all">
                <form onSubmit={handleSave} className="flex flex-col">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-3">
                            <FaFileAlt className="text-brand-600" />
                            {initialData ? 'Dokumentenart bearbeiten' : 'Neue Dokumentenart'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 bg-white">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Bezeichnung *</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                type="text"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white outline-none focus:border-brand-500 shadow-sm h-10 transition"
                                placeholder="z.B. Geburtsurkunde, Vertrag..."
                                required
                                autoFocus
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
                            disabled={isLoading || !name.trim()}
                            className="px-8 py-2.5 bg-brand-700 text-white rounded text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-brand-800 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
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
