import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileAlt } from 'react-icons/fa';
import { Button } from '../ui/button';

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
            <div className="bg-white rounded-sm shadow-sm w-full max-w-md flex flex-col overflow-hidden animate-fadeInUp">
                <form onSubmit={handleSave} className="flex flex-col">
                    {/* Header */}
                    <div className="bg-white px-6 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <h3 className="font-semibold text-base text-slate-800 flex items-center gap-3">
                            <FaFileAlt className="text-slate-700" />
                            {initialData ? 'Dokumentenart bearbeiten' : 'Neue Dokumentenart'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-red-500 transition">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 bg-white">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Bezeichnung *</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                type="text"
                                className="w-full h-9 border border-slate-200 rounded-sm px-3 py-1 text-sm bg-white outline-none focus:ring-1 focus:ring-brand-600/5 focus:border-brand-600 shadow-desktop-inset transition"
                                placeholder="z.B. Geburtsurkunde, Vertrag..."
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={onClose}
                            className="font-bold border-slate-300"
                        >
                            Abbrechen
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            isLoading={isLoading}
                            disabled={!name.trim()}
                            className="font-bold shadow-md min-w-[100px]"
                        >
                            Speichern
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewDocTypeModal;
