import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../api/services';
import { FaListOl, FaEye, FaSave, FaInfoCircle } from 'react-icons/fa';
import { Button } from '../ui/button';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Switch } from '../ui/switch';

// To avoid losing focus on input during re-renders,
// components must be defined OUTSIDE the parent component and ideally memoized.
const toBool = (v: any, def: boolean = false) => {
    if (v === undefined || v === null) return def;
    return v === true || v === '1' || v === 'true';
};
const ConfigRow = React.memo(({ title, prefixKey, startKey, showYearKey, formData, handleChange, preview }: any) => (
    <div className="py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/30 px-4 -mx-4 transition-colors rounded-sm grid grid-cols-12 gap-4 items-center">
        <div className="col-span-12 md:col-span-4 flex flex-col justify-center h-full">
            <span className="text-sm font-medium text-slate-700">{title}</span>
        </div>

        <div className="col-span-12 md:col-span-8 flex flex-col gap-1.5">
            <div className="flex gap-3">
                <div className="flex flex-col gap-0.5 flex-1">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest pl-1">Präfix</span>
                    <input
                        type="text"
                        value={formData[prefixKey] || ''}
                        onChange={(e) => handleChange(prefixKey, e.target.value)}
                        placeholder="z.B. RE"
                        className="w-full h-8 border border-slate-200 rounded-sm px-2.5 text-xs font-semibold text-slate-800 focus:border-brand-primary outline-none transition shadow-sm bg-white"
                    />
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest pl-1">Start-Nummer</span>
                    <input
                        type="number"
                        value={formData[startKey] || ''}
                        onChange={(e) => handleChange(startKey, e.target.value)}
                        placeholder="00001"
                        className="w-full h-8 border border-slate-200 rounded-sm px-2.5 text-xs font-semibold text-slate-800 focus:border-brand-primary outline-none transition shadow-sm bg-white"
                    />
                </div>
                <div className="flex flex-col gap-0.5 w-20 items-center shrink-0">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest">Jahr</span>
                    <div className="h-8 flex items-center justify-center">
                        <Switch
                            checked={formData[showYearKey] || false}
                            onCheckedChange={(val) => handleChange(showYearKey, val)}
                            className="scale-75"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-sm px-2 py-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <FaEye className="text-2xs" />
                    <span className="text-2xs font-bold uppercase tracking-widest italic leading-none">Vorschau:</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900 tracking-tight leading-none">{preview}</span>
            </div>
        </div>
    </div>
));

const NumberCircleSettingsTab = () => {
    const queryClient = useQueryClient();
    const { data: companyData } = useQuery({
        queryKey: ['companySettings'],
        queryFn: settingsService.getCompany
    });

    const [formData, setFormData] = useState<any>({
        customer_id_prefix: 'K',
        customer_start_number: '1',
        customer_show_year: false,
        partner_id_prefix: 'P',
        partner_start_number: '1',
        partner_show_year: false,
        project_id_prefix: 'PR',
        project_start_number: '1',
        project_show_year: true,
        appointment_id_prefix: 'A',
        appointment_start_number: '1',
        appointment_show_year: true,
        offer_id_prefix: 'AG',
        offer_start_number: '1',
        offer_show_year: true,
        invoice_prefix: 'RE',
        invoice_start_number: '1',
        invoice_show_year: true,
        credit_note_prefix: 'GS',
        credit_note_start_number: '1',
        credit_note_show_year: true
    });

    useEffect(() => {
        if (companyData) {
            setFormData({
                customer_id_prefix: companyData.customer_id_prefix || 'K',
                customer_start_number: companyData.customer_start_number || '1',
                customer_show_year: toBool(companyData.customer_show_year, false),
                partner_id_prefix: companyData.partner_id_prefix || 'P',
                partner_start_number: companyData.partner_start_number || '1',
                partner_show_year: toBool(companyData.partner_show_year, false),
                project_id_prefix: companyData.project_id_prefix || 'PR',
                project_start_number: companyData.project_start_number || '1',
                project_show_year: toBool(companyData.project_show_year, true),
                appointment_id_prefix: companyData.appointment_id_prefix || 'A',
                appointment_start_number: companyData.appointment_start_number || '1',
                appointment_show_year: toBool(companyData.appointment_show_year, true),
                offer_id_prefix: companyData.offer_id_prefix || 'AG',
                offer_start_number: companyData.offer_start_number || '1',
                offer_show_year: toBool(companyData.offer_show_year, true),
                invoice_prefix: companyData.invoice_prefix || 'RE',
                invoice_start_number: companyData.invoice_start_number || '1',
                invoice_show_year: toBool(companyData.invoice_show_year, true),
                credit_note_prefix: companyData.credit_note_prefix || 'GS',
                credit_note_start_number: companyData.credit_note_start_number || '1',
                credit_note_show_year: toBool(companyData.credit_note_show_year, true)
            });
        }
    }, [companyData]);

    const updateMutation = useMutation({
        mutationFn: settingsService.updateCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companySettings'] });
            toast.success('Nummernkreise gespeichert!');
        },
        onError: () => toast.error('Fehler beim Speichern.')
    });

    const handleSave = useCallback(() => {
        // Check for duplicate prefixes
        const circles = [
            { name: 'Kunden', p: formData.customer_id_prefix },
            { name: 'Partner', p: formData.partner_id_prefix },
            { name: 'Projekte', p: formData.project_id_prefix },
            { name: 'Termine', p: formData.appointment_id_prefix },
            { name: 'Angebote', p: formData.offer_id_prefix },
            { name: 'Rechnungen', p: formData.invoice_prefix },
            { name: 'Gutschriften', p: formData.credit_note_prefix }
        ];

        // Find duplicates
        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                if (circles[i].p && circles[i].p === circles[j].p) {
                    toast.error(`Kritischer Konflikt: Die Präfixe für "${circles[i].name}" und "${circles[j].name}" sind identisch ("${circles[i].p}"). Bitte verwenden Sie für jeden Bereich ein eindeutiges Präfix, um Überschneidungen zu vermeiden.`);
                    return;
                }
            }
        }

        updateMutation.mutate(formData);
    }, [formData, updateMutation]);
    const handleChange = useCallback((field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    }, []);

    const previews = useMemo(() => {
        const year = new Date().getFullYear();

        return {
            customer: `${formData.customer_id_prefix || 'K'}${formData.customer_show_year ? '-' + year : ''}-${String(formData.customer_start_number || '1').padStart(5, '0')}`,
            partner: `${formData.partner_id_prefix || 'P'}${formData.partner_show_year ? '-' + year : ''}-${String(formData.partner_start_number || '1').padStart(5, '0')}`,
            project: `${formData.project_id_prefix || 'PR'}${formData.project_show_year ? '-' + year : ''}-${String(formData.project_start_number || '1').padStart(5, '0')}`,
            appointment: `${formData.appointment_id_prefix || 'A'}${formData.appointment_show_year ? '-' + year : ''}-${String(formData.appointment_start_number || '1').padStart(5, '0')}`,
            offer: `${formData.offer_id_prefix || 'AG'}${formData.offer_show_year ? '-' + year : ''}-${String(formData.offer_start_number || '1').padStart(5, '0')}`,
            invoice: `${formData.invoice_prefix || 'RE'}${formData.invoice_show_year ? '-' + year : ''}-${String(formData.invoice_start_number || '1').padStart(5, '0')}`,
            credit_note: `${formData.credit_note_prefix || 'GS'}${formData.credit_note_show_year ? '-' + year : ''}-${String(formData.credit_note_start_number || '1').padStart(5, '0')}`
        };
    }, [formData]);

    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-hidden animate-fadeIn h-full flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2.5">
                    <FaListOl className="text-brand-primary" />
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight italic">Nummernkreise</h3>
                </div>
                <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2"
                >
                    <FaSave /> {updateMutation.isPending ? 'Speichert...' : 'Speichern'}
                </Button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="mb-6">
                    <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                        Stammdaten
                    </h4>
                    <ConfigRow
                        title="Kunden"
                        prefixKey="customer_id_prefix"
                        startKey="customer_start_number"
                        showYearKey="customer_show_year"
                        formData={formData}
                        handleChange={handleChange}
                        preview={previews.customer}
                    />
                    <ConfigRow
                        title="Partner / Übersetzer"
                        prefixKey="partner_id_prefix"
                        startKey="partner_start_number"
                        showYearKey="partner_show_year"
                        formData={formData}
                        handleChange={handleChange}
                        preview={previews.partner}
                    />
                </div>

                <div className="mb-6">
                    <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                        Projektmanagement
                    </h4>
                    <ConfigRow
                        title="Projekte"
                        prefixKey="project_id_prefix"
                        startKey="project_start_number"
                        showYearKey="project_show_year"
                        formData={formData}
                        handleChange={handleChange}
                        preview={previews.project}
                    />
                    <ConfigRow
                        title="Termine"
                        prefixKey="appointment_id_prefix"
                        startKey="appointment_start_number"
                        showYearKey="appointment_show_year"
                        formData={formData}
                        handleChange={handleChange}
                        preview={previews.appointment}
                    />
                    <ConfigRow
                        title="Angebote"
                        prefixKey="offer_id_prefix"
                        startKey="offer_start_number"
                        showYearKey="offer_show_year"
                        formData={formData}
                        handleChange={handleChange}
                        preview={previews.offer}
                    />
                </div>

                <div className="mb-2">
                    <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                        Finanzwesen
                    </h4>
                    <ConfigRow
                        title="Rechnungen"
                        prefixKey="invoice_prefix"
                        startKey="invoice_start_number"
                        showYearKey="invoice_show_year"
                        formData={formData}
                        handleChange={handleChange}
                        preview={previews.invoice}
                    />
                    <ConfigRow
                        title="Gutschriften"
                        prefixKey="credit_note_prefix"
                        startKey="credit_note_start_number"
                        showYearKey="credit_note_show_year"
                        formData={formData}
                        handleChange={handleChange}
                        preview={previews.credit_note}
                    />
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-start gap-3 shrink-0">
                <div className="w-8 h-8 rounded-sm bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/10">
                    <FaInfoCircle className="text-xs" />
                </div>
                <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-700 leading-none">Wichtiger Hinweis zur Nummerierung</p>
                    <p className="text-2xs text-slate-500 leading-relaxed italic">
                        Startnummern dienen als Basis für neue Einträge. Das System zählt ab dieser Nummer automatisch fortlaufend hoch.
                        Standardmäßig werden 5-stellige Nummern (z.B. 00001) generiert.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NumberCircleSettingsTab;
