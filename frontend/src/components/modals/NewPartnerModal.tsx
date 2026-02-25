import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import PartnerForm from '../forms/PartnerForm';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../../api/services';
import { useMemo } from 'react';

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
    const [hasDuplicates, setHasDuplicates] = useState(false);
    const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);

    const { data: companyData } = useQuery({
        queryKey: ['companySettings'],
        queryFn: settingsService.getCompany
    });

    const displayNr = useMemo(() => {
        const id = initialData?.id || formData?.id;
        const prefix = companyData?.partner_id_prefix || 'PR';
        if (id) {
            return `${prefix}${id.toString().padStart(4, '0')}`;
        }
        return `${prefix}xxxx`;
    }, [initialData?.id, formData?.id, companyData]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (hasDuplicates && !ignoreDuplicates) {
            toast.error('Bitte prüfen Sie die Dubletten oder bestätigen Sie die Neuanlage explizit.');
            return;
        }
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
            <div className="bg-white rounded-sm shadow-sm w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden relative animate-fadeInUp">
                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-[110] flex items-center justify-center transition-all duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-slate-100 rounded-full"></div>
                                <div className="w-12 h-12 border-4 border border-brand-primary border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-sm font-bold text-slate-800 tracking-tight">Lade Daten...</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Bitte warten</p>
                            </div>
                        </div>
                    </div>
                )}
                {/* Header */}
                <div className="bg-white px-6 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2">
                            {initialData ? 'Partner bearbeiten' : 'Neuen Partner erfassen'}
                            <span className="text-xs font-medium text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                Nr: {displayNr}
                            </span>
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
                        onDuplicatesChange={setHasDuplicates}
                        ignoreDuplicates={ignoreDuplicates}
                        onIgnoreDuplicatesChange={setIgnoreDuplicates}
                        validationErrors={validationErrors}
                    />
                </div>

                {/* Footer */}
                <div className="bg-white px-6 py-3 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition"
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition"
                    >
                        {isLoading ? 'Verarbeitet...' : (initialData ? 'Änderungen speichern' : 'Partner anlegen')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewPartnerModal;
