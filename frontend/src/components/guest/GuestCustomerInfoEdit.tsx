import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import { Button } from '../ui/button';
import ConfirmModal from '../common/ConfirmModal';
import toast from 'react-hot-toast';
import { guestService } from '@/api/services';

interface GuestCustomerInfoEditProps {
    customer: any;
    token: string;
}

export const GuestCustomerInfoEdit: React.FC<GuestCustomerInfoEditProps> = ({ customer, token }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        company_name: '',
        first_name: '',
        last_name: '',
        address_street: '',
        address_house_no: '',
        address_zip: '',
        address_city: '',
        email: '',
        phone: '',
    });

    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; data: any | null }>({
        isOpen: false,
        data: null,
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                company_name: customer.company_name || '',
                first_name: customer.first_name || '',
                last_name: customer.last_name || '',
                address_street: customer.address_street || '',
                address_house_no: customer.address_house_no || '',
                address_zip: customer.address_zip || '',
                address_city: customer.address_city || '',
                email: customer.email || '',
                phone: customer.phone || '',
            });
        }
    }, [customer]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => guestService.updateProject(token, data),
        onSuccess: () => {
            toast.success('Kundendaten erfolgreich aktualisiert');
            setIsEditing(false);
            setConfirmState({ isOpen: false, data: null });
            queryClient.invalidateQueries({ queryKey: ['guestProject', token] });
        },
        onError: (error: any) => {
            console.error('Update error:', error);
            toast.error(t('messages.error'));
        },
    });

    const handleSaveClick = () => {
        // Validierung
        if (!formData.first_name && !formData.company_name) {
            toast.error('Bitte geben Sie mindestens einen Namen oder Firmennamen ein');
            return;
        }

        // Öffne Bestätigungsdialog
        setConfirmState({
            isOpen: true,
            data: { customer: formData },
        });
    };

    const handleConfirm = () => {
        if (confirmState.data) {
            updateMutation.mutate(confirmState.data);
        }
    };

    const handleCancel = () => {
        setFormData({
            company_name: customer.company_name || '',
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            address_street: customer.address_street || '',
            address_house_no: customer.address_house_no || '',
            address_zip: customer.address_zip || '',
            address_city: customer.address_city || '',
            email: customer.email || '',
            phone: customer.phone || '',
        });
        setIsEditing(false);
    };

    return (
        <>
            <div className="rounded-sm border border-slate-200 shadow-sm bg-white overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h2 className="text-sm font-semibold text-slate-900">Ihre Daten</h2>
                    {!isEditing && (
                        <Button
                            onClick={() => setIsEditing(true)}
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                        >
                            <FaEdit className="mr-2" />
                            Bearbeiten
                        </Button>
                    )}
                </div>

                <div className="p-4 sm:p-6">
                    {isEditing ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSaveClick();
                            }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Firma
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                        placeholder="Firmenname"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Vorname
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                        placeholder="Vorname"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Nachname
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                        placeholder="Nachname"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Straße
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address_street}
                                        onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                        placeholder="Straße"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Hausnummer
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address_house_no}
                                        onChange={(e) => setFormData({ ...formData, address_house_no: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                        placeholder="Nr."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        PLZ
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address_zip}
                                        onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                        placeholder="PLZ"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Stadt
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address_city}
                                        onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                        placeholder="Stadt"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        E-Mail
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                        placeholder="E-Mail"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Telefon
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                        placeholder="Telefon"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="w-full sm:w-auto"
                                    disabled={updateMutation.isPending}
                                >
                                    <FaCheck className="mr-2" />
                                    Änderungen speichern
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCancel}
                                    variant="secondary"
                                    className="w-full sm:w-auto"
                                    disabled={updateMutation.isPending}
                                >
                                    <FaTimes className="mr-2" />
                                    Abbrechen
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {formData.company_name && (
                                <div className="md:col-span-2">
                                    <span className="block text-xs font-medium text-slate-600 mb-1">Firma</span>
                                    <p className="text-slate-900 font-medium">{formData.company_name}</p>
                                </div>
                            )}

                            {(formData.first_name || formData.last_name) && (
                                <div className="md:col-span-2">
                                    <span className="block text-xs font-medium text-slate-600 mb-1">Name</span>
                                    <p className="text-slate-900 font-medium">
                                        {formData.first_name} {formData.last_name}
                                    </p>
                                </div>
                            )}

                            {(formData.address_street || formData.address_city) && (
                                <div className="md:col-span-2">
                                    <span className="block text-xs font-medium text-slate-600 mb-1">Anschrift</span>
                                    <p className="text-slate-700">
                                        {formData.address_street} {formData.address_house_no}
                                        {formData.address_street && <br />}
                                        {formData.address_zip} {formData.address_city}
                                    </p>
                                </div>
                            )}

                            {formData.email && (
                                <div className="md:col-span-2">
                                    <span className="block text-xs font-medium text-slate-600 mb-1">E-Mail</span>
                                    <a href={`mailto:${formData.email}`} className="text-slate-900 hover:text-brand-primary hover:underline">
                                        {formData.email}
                                    </a>
                                </div>
                            )}

                            {formData.phone && (
                                <div className="md:col-span-2">
                                    <span className="block text-xs font-medium text-slate-600 mb-1">Telefon</span>
                                    <a href={`tel:${formData.phone}`} className="text-slate-900 hover:text-brand-primary hover:underline">
                                        {formData.phone}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false, data: null })}
                onConfirm={handleConfirm}
                title="Änderungen bestätigen"
                message="Möchten Sie Ihre Kundendaten wirklich aktualisieren? Diese Änderungen werden sofort wirksam."
                confirmText="Ja, speichern"
                cancelText="Abbrechen"
                type="warning"
                isLoading={updateMutation.isPending}
            />
        </>
    );
};
