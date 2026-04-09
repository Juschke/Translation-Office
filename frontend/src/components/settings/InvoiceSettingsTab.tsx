import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaSave, FaPlus, FaTrash, FaPalette, FaFileInvoice } from 'react-icons/fa';
import clsx from 'clsx';
import { settingsService } from '../../api/services';
import Input from '../common/Input';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';

const SettingRow = ({ label, description, children, className }: any) => (
    <div className={clsx('grid grid-cols-12 gap-6 py-6 border-b border-slate-100 last:border-0 items-start', className)}>
        <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
        </div>
        <div className="col-span-12 md:col-span-8">
            {children}
        </div>
    </div>
);

const InvoiceSettingsTab = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const { data: companyData } = useQuery({
        queryKey: ['companySettings'],
        queryFn: settingsService.getCompany
    });

    const [formData, setFormData] = useState<any>({
        // Nummernkreise
        project_id_prefix: 'P',
        project_start_number: '00001',
        project_next_preview: '',
        credit_note_prefix: 'GS',
        credit_note_start_number: '0001',
        customer_id_prefix: 'KD',
        customer_start_number: '10000',
        translator_id_prefix: 'TR',
        interpreter_id_prefix: 'IN',
        agency_id_prefix: 'AG',
        customer_number_auto: true,

        // Zahlungsbedingungen
        default_payment_days: '14',
        default_payment_text: 'Zahlung innerhalb von {days} Tagen ab Rechnungseingang ohne Abzüge.',

        // Steuersätze
        tax_rates: [
            { id: '1', rate: '19.00', label: '19% MwSt.', is_default: true },
            { id: '2', rate: '7.00', label: '7% MwSt.', is_default: false },
            { id: '3', rate: '0.00', label: '0% (§ 19 UStG)', is_default: false },
            { id: '4', rate: '0.00', label: '0% (Reverse Charge)', is_default: false },
        ],

        // Textvorlagen
        invoice_intro_text: 'Sehr geehrte Damen und Herren,\n\nwir stellen Ihnen hiermit folgende Leistungen in Rechnung:',
        invoice_closing_text: 'Bitte überweisen Sie den Betrag auf das unten angegebene Konto unter Angabe der Rechnungsnummer.',
        credit_note_intro_text: 'Sehr geehrte Damen und Herren,\n\nwir erstellen Ihnen hiermit folgende Gutschrift:',
        offer_intro_text: 'Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Anfrage. Wir bieten Ihnen folgende Leistungen an:',
        offer_closing_text: 'Dieses Angebot ist 30 Tage gültig.',

        // Fußzeile
        footer_style: 'standard', // 'standard' | 'custom'
        footer_columns: 3,
        show_footer: true,
        show_sender_line: true,

        // Lohnkostenanteil
        show_labor_cost_hint: false,

        // Design
        invoice_layout: 'din5008',
        invoice_font_family: 'Inter, Helvetica, Arial, sans-serif',
        invoice_font_size: '9pt',
        invoice_primary_color: '#000000',
    });

    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [newTaxRate, setNewTaxRate] = useState({ rate: '', label: '' });

    // Scroll effect for sidebar navigation
    useEffect(() => {
        const section = searchParams.get('section');
        if (section) {
            setTimeout(() => {
                const element = document.getElementById(`section-${section}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [searchParams]);


    useEffect(() => {
        if (companyData) {
            setFormData((prev: any) => ({
                ...prev,
                default_payment_days: companyData.default_payment_days || prev.default_payment_days,
                default_payment_text: companyData.default_payment_text || prev.default_payment_text,
                invoice_intro_text: companyData.invoice_intro_text || prev.invoice_intro_text,
                invoice_closing_text: companyData.invoice_closing_text || prev.invoice_closing_text,
                credit_note_intro_text: companyData.credit_note_intro_text || prev.credit_note_intro_text,
                offer_intro_text: companyData.offer_intro_text || prev.offer_intro_text,
                offer_closing_text: companyData.offer_closing_text || prev.offer_closing_text,
                footer_style: companyData.footer_style || prev.footer_style,
                footer_columns: companyData.footer_columns || prev.footer_columns,
                show_footer: companyData.show_footer ?? prev.show_footer,
                show_sender_line: companyData.show_sender_line ?? prev.show_sender_line,
                show_labor_cost_hint: companyData.show_labor_cost_hint ?? prev.show_labor_cost_hint,
                invoice_layout: companyData.invoice_layout || prev.invoice_layout,
                invoice_font_family: companyData.invoice_font_family || prev.invoice_font_family,
                invoice_font_size: companyData.invoice_font_size || prev.invoice_font_size,
                invoice_primary_color: companyData.invoice_primary_color || prev.invoice_primary_color,
            }));
            if (companyData.tax_rates && Array.isArray(companyData.tax_rates)) {
                setFormData((prev: any) => ({ ...prev, tax_rates: companyData.tax_rates }));
            }
        }
    }, [companyData]);

    const updateMutation = useMutation({
        mutationFn: settingsService.updateCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companySettings'] });
            toast.success(t('settings.invoice.save_success'));
        },
        onError: () => toast.error(t('settings.invoice.save_error'))
    });

    const handleSave = () => updateMutation.mutate(formData);
    const handleChange = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));

    const paymentTextPreview = useMemo(() => {
        return (formData.default_payment_text || '').replace('{days}', formData.default_payment_days || '14');
    }, [formData.default_payment_text, formData.default_payment_days]);

    const addTaxRate = () => {
        if (!newTaxRate.rate || !newTaxRate.label) {
            toast.error(t('settings.invoice.tax_rate_required'));
            return;
        }
        const id = Date.now().toString();
        // Paragraph is being removed as per user request
        handleChange('tax_rates', [...formData.tax_rates, { ...newTaxRate, id, is_default: false, paragraph: '' }]);
        setNewTaxRate({ rate: '', label: '' });
        setIsTaxModalOpen(false);
    };

    const removeTaxRate = (id: string) => {
        handleChange('tax_rates', formData.tax_rates.filter((t: any) => t.id !== id));
    };

    const setDefaultTaxRate = (id: string) => {
        handleChange('tax_rates', formData.tax_rates.map((t: any) => ({ ...t, is_default: t.id === id })));
    };


    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-y-auto custom-scrollbar flex-1 min-h-0 animate-fadeIn">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <FaFileInvoice className="text-brand-primary" />
                    <h3 className="text-sm font-medium text-slate-800">{t('settings.invoice.header')}</h3>
                </div>
                <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2"
                >
                    <FaSave /> {updateMutation.isPending ? t('settings.saving') : t('settings.save')}
                </Button>
            </div>


            <div className="p-8">


                {/* ── Zahlungsbedingungen ── */}
                <div id="section-payment" className="mb-12 scroll-mt-20">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{t('settings.invoice.section_payment')}</h4>
                    <SettingRow
                        label={t('settings.invoice.payment_days_label')}
                        description={t('settings.invoice.payment_days_desc')}
                    >
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {['0', '7', '14', '30'].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => handleChange('default_payment_days', d)}
                                        className={clsx(
                                            'px-4 py-2 rounded-sm text-sm font-medium border transition',
                                            formData.default_payment_days === d
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        )}
                                    >
                                        {d === '0' ? t('settings.payment_term_immediate') : t('settings.payment_term_days', { days: d })}
                                    </button>
                                ))}
                                <Input
                                    placeholder={t('settings.invoice.payment_days_custom')}
                                    type="number"
                                    value={!['0', '7', '14', '30'].includes(formData.default_payment_days) ? formData.default_payment_days : ''}
                                    onChange={(e) => handleChange('default_payment_days', e.target.value)}
                                    className="w-32"
                                />
                            </div>
                        </div>
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.payment_text_label')}
                        description={t('settings.invoice.payment_text_desc')}
                    >
                        <div className="space-y-3">
                            <Input
                                isTextArea
                                value={formData.default_payment_text}
                                onChange={(e) => handleChange('default_payment_text', e.target.value)}
                            />
                            <div className="p-3 rounded-sm border-0">
                                <span className="text-xs text-slate-400 block mb-1">{t('settings.invoice.payment_text_preview')}</span>
                                <span className="text-sm text-slate-700 font-medium italic">"{paymentTextPreview}"</span>
                            </div>
                        </div>
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.labor_cost_label')}
                        description={t('settings.invoice.labor_cost_desc')}
                    >
                        <button
                            onClick={() => handleChange('show_labor_cost_hint', !formData.show_labor_cost_hint)}
                            className={clsx(
                                'px-4 py-2 rounded-sm text-sm font-medium border transition',
                                formData.show_labor_cost_hint
                                    ? 'bg-brand-primary text-white border-brand-primary'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            )}
                        >
                            {formData.show_labor_cost_hint ? t('settings.invoice.show') : t('settings.invoice.hidden')}
                        </button>
                    </SettingRow>
                </div>


                {/* ── Steuersätze ── */}
                <div id="section-tax" className="mb-12 scroll-mt-20">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{t('settings.invoice.section_tax')}</h4>
                    <SettingRow
                        label={t('settings.invoice.tax_manage_label')}
                        description={t('settings.invoice.tax_manage_desc')}
                    >
                        <div className="space-y-4">
                            {/* Existing tax rates */}
                            <div className="border border-slate-200 rounded-sm overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2.5">{t('settings.invoice.tax_col_rate')}</th>
                                            <th className="px-4 py-2.5">{t('settings.invoice.tax_col_label')}</th>
                                            <th className="px-4 py-2.5 text-center">{t('settings.invoice.tax_col_default')}</th>
                                            <th className="px-4 py-2.5 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-[13px]">
                                        {formData.tax_rates.map((t: any) => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-2.5 font-medium text-slate-900">{t.rate}%</td>
                                                <td className="px-4 py-2.5 text-slate-700">{t.label}</td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        onClick={() => setDefaultTaxRate(t.id)}
                                                        className={clsx(
                                                            'w-4 h-4 rounded-full border-2 transition mx-auto',
                                                            t.is_default ? 'bg-brand-primary border-brand-primary' : 'border-slate-300 hover:border-slate-400'
                                                        )}
                                                    />
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        onClick={() => removeTaxRate(t.id)}
                                                        className="p-1 text-slate-300 hover:text-red-500 transition"
                                                    >
                                                        <FaTrash className="text-xs" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-start">
                                <Button
                                    variant="default"
                                    onClick={() => setIsTaxModalOpen(true)}
                                    className="flex items-center gap-2"
                                >
                                    <FaPlus className="text-xs" /> {t('settings.invoice.tax_add')}
                                </Button>
                            </div>
                        </div>
                    </SettingRow>
                </div>


                {/* ── Textvorlagen ── */}
                <div id="section-texts" className="mb-12 scroll-mt-20">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{t('settings.invoice.section_texts')}</h4>
                    <SettingRow
                        label={t('settings.invoice.invoice_intro_label')}
                        description={t('settings.invoice.invoice_intro_desc')}
                    >
                        <Input
                            isTextArea
                            value={formData.invoice_intro_text}
                            onChange={(e) => handleChange('invoice_intro_text', e.target.value)}
                            helperText={t('settings.invoice.invoice_intro_helper')}
                        />
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.invoice_closing_label')}
                        description={t('settings.invoice.invoice_closing_desc')}
                    >
                        <Input
                            isTextArea
                            value={formData.invoice_closing_text}
                            onChange={(e) => handleChange('invoice_closing_text', e.target.value)}
                        />
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.credit_note_intro_label')}
                        description={t('settings.invoice.credit_note_intro_desc')}
                    >
                        <Input
                            isTextArea
                            value={formData.credit_note_intro_text}
                            onChange={(e) => handleChange('credit_note_intro_text', e.target.value)}
                        />
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.offer_intro_label')}
                        description={t('settings.invoice.offer_intro_desc')}
                    >
                        <Input
                            isTextArea
                            value={formData.offer_intro_text}
                            onChange={(e) => handleChange('offer_intro_text', e.target.value)}
                        />
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.offer_closing_label')}
                        description={t('settings.invoice.offer_closing_desc')}
                    >
                        <Input
                            isTextArea
                            value={formData.offer_closing_text}
                            onChange={(e) => handleChange('offer_closing_text', e.target.value)}
                        />
                    </SettingRow>
                </div>


                {/* ── Layout & Fußzeile ── */}
                <div id="section-layout" className="mb-12 scroll-mt-20">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{t('settings.invoice.section_layout')}</h4>
                    <SettingRow
                        label={t('settings.invoice.sender_line_label')}
                        description={t('settings.invoice.sender_line_desc')}
                    >
                        <button
                            onClick={() => handleChange('show_sender_line', !formData.show_sender_line)}
                            className={clsx(
                                'px-4 py-2 rounded-sm text-sm font-medium border transition',
                                formData.show_sender_line
                                    ? 'bg-brand-primary text-white border-brand-primary'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            )}
                        >
                            {formData.show_sender_line ? t('settings.invoice.show') : t('settings.invoice.hidden')}
                        </button>
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.footer_label')}
                        description={t('settings.invoice.footer_desc')}
                    >
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleChange('show_footer', true)}
                                    className={clsx(
                                        'px-4 py-2 rounded-sm text-sm font-medium border transition',
                                        formData.show_footer
                                            ? 'bg-brand-primary text-white border-brand-primary'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    )}
                                >
                                    {t('settings.invoice.show')}
                                </button>
                                <button
                                    onClick={() => handleChange('show_footer', false)}
                                    className={clsx(
                                        'px-4 py-2 rounded-sm text-sm font-medium border transition',
                                        !formData.show_footer
                                            ? 'bg-brand-primary text-white border-brand-primary'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    )}
                                >
                                    {t('settings.invoice.hide')}
                                </button>
                            </div>

                            {formData.show_footer && (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        {['standard', 'custom'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleChange('footer_style', s)}
                                                className={clsx(
                                                    'px-4 py-2 rounded-sm text-sm font-medium border transition',
                                                    formData.footer_style === s
                                                        ? 'bg-slate-100 text-slate-900 border-slate-300 font-bold'
                                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                )}
                                            >
                                                {s === 'standard' ? t('settings.invoice.footer_standard') : t('settings.invoice.footer_custom')}
                                            </button>
                                        ))}
                                    </div>

                                    {formData.footer_style === 'standard' && (
                                        <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 shadow-inner">
                                            <span className="text-[10px] font-bold text-slate-400 block mb-3 uppercase tracking-widest">{t('settings.invoice.footer_preview_title')}</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] text-slate-500 border-t border-slate-200 pt-3 italic">
                                                <div>
                                                    <strong className="text-slate-600 block mb-1 not-italic">{t('settings.invoice.footer_col_address')}</strong>
                                                    {companyData?.company_name || 'Firma'}<br />
                                                    {companyData?.address_street || 'Straße'} {companyData?.address_house_no || ''}<br />
                                                    {companyData?.address_zip || ''} {companyData?.address_city || 'Stadt'}
                                                </div>
                                                <div className="text-center">
                                                    <strong className="text-slate-600 block mb-1 not-italic">{t('settings.invoice.footer_col_contact')}</strong>
                                                    {companyData?.email && <>Email: {companyData.email}<br /></>}
                                                    {companyData?.phone && <>Tel: {companyData.phone}</>}
                                                </div>
                                                <div className="text-right">
                                                    <strong className="text-slate-600 block mb-1 not-italic">{t('settings.invoice.footer_col_tax_bank')}</strong>
                                                    {companyData?.tax_number && <>St.-Nr: {companyData.tax_number}<br /></>}
                                                    {companyData?.vat_id && <>USt-ID: {companyData.vat_id}<br /></>}
                                                    {companyData?.bank_iban && <>IBAN: {companyData.bank_iban}</>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.footer_style === 'custom' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-slate-500">{t('settings.invoice.footer_columns_label')}</span>
                                                {[1, 2, 3, 4].map(n => (
                                                    <button
                                                        key={n}
                                                        onClick={() => handleChange('footer_columns', n)}
                                                        className={clsx(
                                                            'w-8 h-8 rounded-sm text-sm font-medium border transition',
                                                            formData.footer_columns === n
                                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                        )}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-400">{t('settings.invoice.footer_custom_hint')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </SettingRow>
                </div>


                {/* ── Design ── */}
                <div id="section-design" className="mb-0 scroll-mt-20">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{t('settings.invoice.section_design')}</h4>
                    <SettingRow
                        label={t('settings.invoice.layout_label')}
                        description={t('settings.invoice.layout_desc')}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                {
                                    id: 'din5008',
                                    label: t('settings.invoice.layout_din5008_label'),
                                    desc: t('settings.invoice.layout_din5008_desc'),
                                    preview: (
                                        <div className="space-y-1">
                                            <div className="h-1.5 w-8 bg-current opacity-20 rounded-sm" />
                                            <div className="h-1 w-12 bg-current opacity-10 rounded-sm" />
                                            <div className="mt-2 space-y-0.5">
                                                <div className="h-0.5 w-full bg-current opacity-30" />
                                                <div className="h-2 w-full bg-current opacity-5" />
                                                <div className="h-2 w-full bg-current opacity-5" />
                                                <div className="h-0.5 w-full bg-current opacity-30" />
                                            </div>
                                            <div className="h-1 w-10 bg-current opacity-15 ml-auto rounded-sm" />
                                        </div>
                                    )
                                },
                                {
                                    id: 'modern',
                                    label: t('settings.invoice.layout_modern_label'),
                                    desc: t('settings.invoice.layout_modern_desc'),
                                    preview: (
                                        <div className="space-y-1">
                                            <div className="h-4 w-full rounded-sm" style={{ background: formData.invoice_primary_color || '#1e293b' }} />
                                            <div className="h-1 w-10 bg-current opacity-10 rounded-sm" />
                                            <div className="mt-1 space-y-0.5">
                                                <div className="h-1.5 w-full rounded-sm" style={{ background: formData.invoice_primary_color || '#1e293b', opacity: 0.8 }} />
                                                <div className="h-2 w-full bg-current opacity-5" />
                                                <div className="h-2 w-full bg-slate-100" />
                                                <div className="h-2 w-full bg-current opacity-5" />
                                            </div>
                                            <div className="h-1 w-10 bg-current opacity-15 ml-auto rounded-sm" />
                                        </div>
                                    )
                                },
                                {
                                    id: 'classic',
                                    label: t('settings.invoice.layout_classic_label'),
                                    desc: t('settings.invoice.layout_classic_desc'),
                                    preview: (
                                        <div className="space-y-1">
                                            <div className="text-center space-y-0.5">
                                                <div className="h-1.5 w-8 bg-current opacity-20 rounded-sm mx-auto" />
                                                <div className="h-0.5 w-14 bg-current opacity-10 rounded-sm mx-auto" />
                                                <div className="h-px w-full bg-current opacity-20 mt-1" />
                                                <div className="h-px w-full bg-current opacity-20" />
                                            </div>
                                            <div className="mt-1 space-y-0.5">
                                                <div className="h-0.5 w-full bg-current opacity-15" />
                                                <div className="h-2 w-full bg-current opacity-5" />
                                                <div className="h-2 w-full bg-current opacity-5" />
                                                <div className="h-0.5 w-full bg-current opacity-15" />
                                            </div>
                                            <div className="h-1 w-10 bg-current opacity-15 ml-auto rounded-sm" />
                                        </div>
                                    )
                                }
                            ].map(layout => (
                                <button
                                    key={layout.id}
                                    onClick={() => handleChange('invoice_layout', layout.id)}
                                    className={clsx(
                                        'relative flex flex-col border rounded-sm p-4 transition-all text-left group',
                                        formData.invoice_layout === layout.id
                                            ? 'border-brand-primary bg-slate-50 ring-1 ring-brand-primary'
                                            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50/50'
                                    )}
                                >
                                    <div className="w-full aspect-[3/4] bg-white border border-slate-100 rounded-sm p-3 mb-3 overflow-hidden">
                                        {layout.preview}
                                    </div>
                                    <span className={clsx(
                                        'text-sm font-semibold block',
                                        formData.invoice_layout === layout.id ? 'text-slate-900' : 'text-slate-600'
                                    )}>
                                        {layout.label}
                                    </span>
                                    <span className="text-xs text-slate-400 mt-0.5 leading-snug">{layout.desc}</span>
                                    {formData.invoice_layout === layout.id && (
                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs">✓</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.font_label')}
                        description={t('settings.invoice.font_desc')}
                    >
                        <select
                            className="w-full h-10 border border-slate-200 rounded-sm px-3 text-sm font-medium text-slate-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 outline-none transition uppercase"
                            value={formData.invoice_font_family}
                            onChange={(e) => handleChange('invoice_font_family', e.target.value)}
                        >
                            <option value="Inter, Helvetica, Arial, sans-serif">Inter (Standard)</option>
                            <option value="Arial, Helvetica, sans-serif">Arial</option>
                            <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                            <option value="Roboto, Arial, sans-serif">Roboto</option>
                            <option value="Georgia, Times New Roman, serif">Georgia (Serif)</option>
                            <option value="Times New Roman, Times, serif">Times New Roman</option>
                            <option value="Palatino, Book Antiqua, serif">Palatino</option>
                            <option value="Courier New, monospace">Courier New (Monospace)</option>
                        </select>
                        <div className="mt-3 p-3 border border-slate-100 rounded-sm italic shadow-sm bg-slate-50/30">
                            <span className="text-[10px] text-slate-400 block mb-1 font-bold uppercase tracking-widest">{t('settings.invoice.font_preview')}</span>
                            <span className="text-sm text-slate-700" style={{ fontFamily: formData.invoice_font_family }}>
                                {t('settings.invoice.font_preview_text')}
                            </span>
                        </div>
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.font_size_label')}
                        description={t('settings.invoice.font_size_desc')}
                    >
                        <div className="flex gap-2">
                            {['8pt', '9pt', '10pt', '11pt'].map(size => (
                                <button
                                    key={size}
                                    onClick={() => handleChange('invoice_font_size', size)}
                                    className={clsx(
                                        'px-5 py-2.5 rounded-sm text-sm font-medium border transition',
                                        formData.invoice_font_size === size
                                            ? 'bg-brand-primary text-white border-brand-primary'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    )}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.color_label')}
                        description={t('settings.invoice.color_desc')}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={formData.invoice_primary_color}
                                    onChange={(e) => handleChange('invoice_primary_color', e.target.value)}
                                    className="w-10 h-10 rounded-sm border border-slate-200 cursor-pointer p-0.5"
                                />
                                <Input
                                    placeholder="#000000"
                                    value={formData.invoice_primary_color}
                                    onChange={(e) => handleChange('invoice_primary_color', e.target.value)}
                                    className="w-32"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { color: '#000000', label: t('settings.invoice.color_black') },
                                    { color: '#1e293b', label: t('settings.invoice.color_slate') },
                                    { color: '#1e3a5f', label: t('settings.invoice.color_navy') },
                                    { color: '#14532d', label: t('settings.invoice.color_green') },
                                    { color: '#7c2d12', label: t('settings.invoice.color_brown') },
                                    { color: '#581c87', label: t('settings.invoice.color_purple') },
                                    { color: '#0f172a', label: t('settings.invoice.color_dark') },
                                    { color: '#0c4a6e', label: t('settings.invoice.color_blue') },
                                ].map(preset => (
                                    <button
                                        key={preset.color}
                                        onClick={() => handleChange('invoice_primary_color', preset.color)}
                                        className={clsx(
                                            'flex items-center gap-2 px-3 py-1.5 rounded-sm border text-xs font-medium transition',
                                            formData.invoice_primary_color === preset.color
                                                ? 'border-brand-primary bg-slate-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        )}
                                        title={preset.label}
                                    >
                                        <span
                                            className="w-4 h-4 rounded-full border border-slate-200"
                                            style={{ background: preset.color }}
                                        />
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            <div className="p-3 rounded-sm border border-slate-100 shadow-sm bg-slate-50/30">
                                <span className="text-[10px] text-slate-400 block mb-2 font-bold uppercase tracking-widest">{t('settings.invoice.color_preview')}</span>
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-24 rounded-sm" style={{ background: formData.invoice_primary_color }} />
                                    <span className="text-sm font-semibold" style={{ color: formData.invoice_primary_color }}>{t('settings.invoice.color_preview_text')}</span>
                                </div>
                            </div>
                        </div>
                    </SettingRow>

                    <SettingRow
                        label={t('settings.invoice.logo_label')}
                        description={t('settings.invoice.logo_desc')}
                    >
                        <div className="flex items-center gap-4">
                            {companyData?.company_logo || companyData?.settings?.company_logo ? (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-sm">
                                    <FaPalette className="text-slate-400" />
                                    <span className="text-sm text-slate-600 font-medium">{t('settings.invoice.logo_exists')}</span>
                                </div>
                            ) : (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm">
                                    <span className="text-xs text-amber-700 font-medium font-bold uppercase tracking-wider">{t('settings.invoice.logo_missing')}</span>
                                </div>
                            )}
                        </div>
                    </SettingRow>
                </div>

            </div>

            {/* Tax Rate Modal */}
            <Dialog open={isTaxModalOpen} onOpenChange={setIsTaxModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('settings.invoice.tax_new_title')}</DialogTitle>
                        <DialogDescription>
                            {t('settings.invoice.tax_manage_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tax-rate" className="text-right">
                                {t('settings.invoice.tax_col_rate')}
                            </Label>
                            <Input
                                id="tax-rate"
                                type="number"
                                step="any"
                                value={newTaxRate.rate}
                                onChange={(e) => setNewTaxRate({ ...newTaxRate, rate: e.target.value })}
                                className="col-span-3"
                                placeholder="19.00"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tax-label" className="text-right">
                                {t('settings.invoice.tax_col_label')}
                            </Label>
                            <Input
                                id="tax-label"
                                value={newTaxRate.label}
                                onChange={(e) => setNewTaxRate({ ...newTaxRate, label: e.target.value })}
                                className="col-span-3"
                                placeholder="Regelbesteuerung"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsTaxModalOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="button" onClick={addTaxRate}>
                            {t('settings.invoice.tax_add')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default InvoiceSettingsTab;
