import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck } from 'react-icons/fa';
import Input from '../common/Input';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';

interface NewEmailSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const NewEmailSignatureModal: React.FC<NewEmailSignatureModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        content: '',
        is_default: false,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                content: initialData.content || '',
                is_default: !!initialData.is_default,
            });
        } else if (isOpen) {
            setFormData({
                name: '',
                content: '',
                is_default: false,
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleContentChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            content: value
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-sm shadow-sm w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up transform transition-all">
                <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-lg text-slate-800">
                                {initialData ? 'Signatur bearbeiten' : 'Neue Signatur anlegen'}
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm w-fit mt-1">
                                E-MAIL KANTE
                            </span>
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6 bg-white flex flex-col min-h-0">
                        <div className="space-y-4 shrink-0">
                            <Input
                                label="Name der Signatur"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="z.B. Standard-Signatur"
                                required
                            />

                            <div className="flex items-center gap-3">
                                <Switch
                                    id="is_default"
                                    checked={formData.is_default}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                                />
                                <label htmlFor="is_default" className="text-sm text-slate-700 font-medium cursor-pointer">Als Standard festlegen</label>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1 flex flex-col min-h-0">
                            <label className="block text-xs font-bold text-slate-700 mb-1 shrink-0">
                                Inhalt der Signatur
                            </label>

                            <div className="flex-1 min-h-[200px] flex flex-col border border-slate-200 rounded-sm overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.content}
                                    onChange={handleContentChange}
                                    modules={quillModules}
                                    className="flex-1 flex flex-col quill-modern no-rounded-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="px-6 h-10 text-slate-500 text-[11px] font-bold tracking-widest hover:bg-slate-100 transition rounded-sm border border-slate-200"
                        >
                            ABBRECHEN
                        </Button>
                        <Button
                            type="submit"
                            className="px-8 h-10 bg-gradient-to-b from-[#235e62] to-[#1B4D4F] hover:from-[#2a7073] hover:to-[#235e62] text-white rounded-sm text-[11px] font-bold tracking-widest shadow-lg border border-[#123a3c] transition-all flex items-center gap-2"
                        >
                            <FaCheck size={12} className="opacity-70" />
                            SIGNATUR SPEICHERN
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewEmailSignatureModal;
