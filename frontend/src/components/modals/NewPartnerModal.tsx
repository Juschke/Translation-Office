import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import clsx from 'clsx';
import PartnerForm from '../forms/PartnerForm';

interface NewPartnerModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSubmit: (data: any) => void;
 initialData?: any;
 isLoading?: boolean;
}

const NewPartnerModal: React.FC<NewPartnerModalProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
 const [formData, setFormData] = useState<any>(null);
 const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

 if (!isOpen) return null;

 const handleSubmit = () => {
 const errors = new Set<string>();
 const data = formData || initialData;

 if (!data?.lastName) errors.add('lastName');
 if (data?.type === 'agency' && !data?.company) errors.add('company');

 // Optional but recommended fields - we still validate them if they are empty
 // but maybe we should only warn? For now let's keep them as required by UI
 // but check if they exist in the combined data.
 if (!data?.firstName) errors.add('firstName');
 if (!data?.emails?.[0]) errors.add('email');

 // Bank details: Optional, but if one is filled, all must be filled
 if (data?.bankName || data?.bic || data?.iban) {
 if (!data?.bankName) errors.add('bankName');
 if (!data?.bic) errors.add('bic');
 if (!data?.iban) errors.add('iban');
 }

 setValidationErrors(errors);
 if (errors.size > 0) return;

 onSubmit(data);
 onClose();
 };

 return (
 <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
 <div className="bg-white rounded-sm shadow-sm w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-fadeInUp">
 {/* Header */}
 <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
 <div>
 <h3 className="font-semibold text-base text-slate-800">
 {initialData ? 'Partner bearbeiten' : 'Neuen Partner erfassen'}
 </h3>
 <p className="text-xs text-slate-400 font-medium mt-0.5">Zentrale Stammdaten & Preiskonditionen</p>
 </div>
 <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
 <FaTimes className="text-lg" />
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto bg-white p-6 custom-scrollbar">
 <PartnerForm
 initialData={initialData}
 onChange={setFormData}
 validationErrors={validationErrors}
 />
 </div>

 {/* Footer */}
 <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-3 shrink-0">
 <button
 onClick={onClose}
 className="px-5 py-2 rounded border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-white transition-all"
 >
 Abbrechen
 </button>
 <button
 onClick={handleSubmit}
 disabled={isLoading}
 className={clsx(
 "px-8 py-2 bg-slate-900 text-white rounded text-xs font-semibold shadow-sm hover:bg-slate-800 transition-all",
 isLoading && "opacity-50 cursor-not-allowed"
 )}
 >
 {isLoading ? 'Verarbeitet...' : (initialData ? 'Änderungen speichern' : 'Partner anlegen')}
 </button>
 </div>
 </div>
 </div>
 );
};

export default NewPartnerModal;
