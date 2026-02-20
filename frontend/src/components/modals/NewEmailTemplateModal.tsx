import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileAlt, FaInfoCircle } from 'react-icons/fa';
import Input from '../common/Input';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface NewEmailTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const NewEmailTemplateModal: React.FC<NewEmailTemplateModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '',
        type: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                subject: initialData.subject || '',
                body: initialData.body || '',
                type: initialData.type || '',
            });
        } else if (isOpen) {
            setFormData({
                name: '',
                subject: '',
                body: '',
                type: '',
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBodyChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            body: value
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up transform transition-all">
                <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-3">
                            {initialData ? 'Vorlagen bearbeiten' : 'Neue Vorlage anlegen'}
                            <span className="text-xs font-normal text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase">
                                Text-Modul
                            </span>
                        </h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 bg-white flex flex-col min-h-0">
                        {/* Section 1: Template Details */}
                        <div className="space-y-4 shrink-0">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaFileAlt className="text-brand-600" /> Vorlagendetails
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <Input
                                        label="Vorlagen-Name *"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="z.B. Willkommens-Email"
                                        required
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Input
                                        label="Typ / Kategorie"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        placeholder="z.B. Allgemein, Rechnung..."
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="Betreff-Zeile *"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Betreff einfügen..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 shrink-0"></div>

                        {/* Section 2: Editor */}
                        <div className="space-y-4 flex-1 flex flex-col min-h-0">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2 shrink-0">
                                <FaInfoCircle className="text-brand-600" /> Nachrichten-Körper
                            </label>

                            <div className="flex-1 min-h-[300px] flex flex-col border border-slate-200 rounded overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.body}
                                    onChange={handleBodyChange}
                                    modules={quillModules}
                                    className="flex-1 flex flex-col quill-modern no-rounded"
                                />
                            </div>
                            <div className="shrink-0 text-[10px] text-slate-500">
                                Tipp: Verwenden Sie Variablen wie {'{{customer_name}}'} im Text, um diese später dynamisch zu befüllen.
                            </div>
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
                            Vorlage speichern
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewEmailTemplateModal;
