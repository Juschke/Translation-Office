import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import PartnerForm from '../forms/PartnerForm';

interface NewPartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const NewPartnerModal: React.FC<NewPartnerModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState<any>(null);
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

    if (!isOpen) return null;

    const handleSubmit = () => {
        const errors = new Set<string>();
        if (!formData?.firstName) errors.add('firstName');
        if (!formData?.lastName) errors.add('lastName');
        if (formData?.type === 'agency' && !formData?.company) errors.add('company');
        if (!formData?.emails?.[0]) errors.add('email');

        setValidationErrors(errors);
        if (errors.size > 0) return;

        onSubmit(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-fadeInUp">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">
                            {initialData ? 'Partner bearbeiten' : 'Neuen Partner erfassen'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Zentrale Stammdaten & Preiskonditionen</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-white p-8 custom-scrollbar">
                    <PartnerForm
                        initialData={initialData}
                        onChange={setFormData}
                        validationErrors={validationErrors}
                    />
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-8 py-5 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded border border-slate-300 text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-10 py-2.5 bg-brand-700 text-white rounded text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-800 transition-all active:scale-95"
                    >
                        {initialData ? 'Änderungen speichern' : 'Partner anlegen'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewPartnerModal;
