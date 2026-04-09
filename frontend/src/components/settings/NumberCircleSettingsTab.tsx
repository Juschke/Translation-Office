import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { settingsService } from '../../api/services';
import {
    FaListOl, FaSave
} from 'react-icons/fa';
import { Button } from '../ui/button';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Switch } from '../ui/switch';
import { Select } from '../ui/select';
import clsx from 'clsx';

const NumberCategory = ({ items, formData, handleChange, previews, t }: any) => (
    <div className="space-y-12">
        {items.map((item: any) => (
            <div key={item.id} id={"item-" + item.id} className="pb-12 border-b border-slate-100 last:border-0 last:pb-0 scroll-mt-24">
                <div className="grid grid-cols-12 gap-10 items-start">
                    {/* Label Column */}
                    <div className="col-span-12 lg:col-span-3 space-y-2">
                        <label className="block text-base font-bold text-slate-900 tracking-tight">{item.label}</label>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">{t('settings.number_circles.base_desc', { label: item.label.toLowerCase() })}</p>
                    </div>

                    {/* Configuration Column */}
                    <div className="col-span-12 lg:col-span-9">
                        <div className="flex flex-wrap items-start gap-x-10 gap-y-8 mb-10">
                            {/* Prefix & Start */}
                            <div className="flex gap-4">
                                <div className="w-24 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('settings.number_circles.prefix_label')}</label>
                                    <input
                                        type="text"
                                        value={formData[item.prefixKey] || ''}
                                        onChange={(e) => handleChange(item.prefixKey, e.target.value)}
                                        className="w-full h-11 border border-slate-200 rounded-sm px-4 text-sm font-bold text-slate-800 focus:border-brand-primary outline-none transition bg-white shadow-sm"
                                    />
                                </div>
                                <div className="w-32 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('settings.number_circles.start_nr_label')}</label>
                                    <input
                                        type="number"
                                        value={formData[item.startKey] || ''}
                                        onChange={(e) => handleChange(item.startKey, e.target.value)}
                                        className="w-full h-11 border border-slate-200 rounded-sm px-4 text-sm font-bold text-slate-800 focus:border-brand-primary outline-none transition bg-white shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Separator & Padding */}
                            <div className="flex gap-4">
                                <div className="w-32 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('settings.number_circles.separator_label')}</label>
                                    <Select
                                        value={formData[item.separatorKey] || '-'}
                                        onChange={(e: any) => handleChange(item.separatorKey, e.target.value)}
                                        className="h-11 text-xs shadow-sm bg-white font-bold"
                                    >
                                        <option value="none">{t('settings.number_circles.sep_none')}</option>
                                        <option value="-">{t('settings.number_circles.sep_dash')}</option>
                                        <option value="/">{t('settings.number_circles.sep_slash')}</option>
                                        <option value=".">{t('settings.number_circles.sep_dot')}</option>
                                        <option value="_">{t('settings.number_circles.sep_underscore')}</option>
                                    </Select>
                                </div>
                                <div className="w-32 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('settings.number_circles.padding_label')}</label>
                                    <Select
                                        value={String(formData[item.paddingKey] || '5')}
                                        onChange={(e: any) => handleChange(item.paddingKey, e.target.value)}
                                        className="h-11 text-xs shadow-sm bg-white font-bold"
                                    >
                                        {[3, 4, 5, 6].map(n => (
                                            <option key={n} value={String(n)}>{t('settings.number_circles.padding_n', { n })}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            {/* Date Options (Pills) */}
                            <div className="flex items-center gap-10 h-11 self-end pb-0.5 border-l border-slate-100 pl-8">
                                {/* Year Pill Selection */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('settings.number_circles.year_label')}</span>
                                    <div className="flex bg-slate-100 p-0.5 rounded-sm w-fit shadow-inner">
                                        {[
                                            { id: 'none', label: 'Kein' },
                                            { id: 'YY', label: '24 (YY)' },
                                            { id: 'YYYY', label: '2024 (YYYY)' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => handleChange(item.yearKey, opt.id)}
                                                className={clsx(
                                                    "px-3 py-1 text-[10px] font-bold rounded-sm transition-all whitespace-nowrap",
                                                    formData[item.yearKey] === opt.id
                                                        ? "bg-white text-brand-primary shadow-sm"
                                                        : "text-slate-500 hover:text-slate-800"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Month Pill Selection */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('settings.number_circles.month_label')}</span>
                                    <div className="flex bg-slate-100 p-0.5 rounded-sm w-fit shadow-inner">
                                        {[
                                            { id: 'none', label: 'Kein' },
                                            { id: 'M', label: '9 (M)' },
                                            { id: 'MM', label: '09 (MM)' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => handleChange(item.monthKey, opt.id)}
                                                className={clsx(
                                                    "px-3 py-1 text-[10px] font-bold rounded-sm transition-all whitespace-nowrap",
                                                    formData[item.monthKey] === opt.id
                                                        ? "bg-white text-brand-primary shadow-sm"
                                                        : "text-slate-500 hover:text-slate-800"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Day Pill Selection */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('settings.number_circles.day_label')}</span>
                                    <div className="flex bg-slate-100 p-0.5 rounded-sm w-fit shadow-inner">
                                        {[
                                            { id: 'none', label: 'Kein' },
                                            { id: 'D', label: '1 (D)' },
                                            { id: 'DD', label: '01 (DD)' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => handleChange(item.dayKey, opt.id)}
                                                className={clsx(
                                                    "px-3 py-1 text-[10px] font-bold rounded-sm transition-all whitespace-nowrap",
                                                    formData[item.dayKey] === opt.id
                                                        ? "bg-white text-brand-primary shadow-sm"
                                                        : "text-slate-500 hover:text-slate-800"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Reset Toggle */}
                            <div className="flex items-center gap-4 h-11 self-end border-l border-slate-100 pl-8">
                                <Switch
                                    checked={formData[item.resetKey] || false}
                                    onCheckedChange={(val) => handleChange(item.resetKey, val)}
                                    className="scale-90"
                                />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{t('settings.number_circles.reset_label')}</span>
                                    <span className="text-[10px] font-bold text-slate-600 block leading-tight">{t('settings.number_circles.reset_yearly')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Large Modern Preview Area */}
                        <div className="pt-2 animate-fadeIn">
                            <div className="text-[10px] font-bold text-slate-400/60 uppercase tracking-[0.3em] mb-4 pl-1">{t('settings.number_circles.preview_label')}</div>
                            <div className="text-6xl font-black text-slate-400 tracking-[-0.06em] leading-none select-all hover:text-brand-primary transition-all duration-300 transform origin-left">
                                {previews[item.id]}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const NumberCircleSettingsTab = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { data: companyData } = useQuery({
        queryKey: ['companySettings'],
        queryFn: settingsService.getCompany
    });

    const categoriesList = useMemo(() => [
        { id: 'customer', label: t('settings.number_circles.cat_customer'), prefixKey: 'customer_id_prefix', defaultPrefix: 'KD', startKey: 'customer_start_number', yearKey: 'customer_year_format', monthKey: 'customer_month_format', dayKey: 'customer_day_format', separatorKey: 'customer_separator', paddingKey: 'customer_padding', resetKey: 'customer_reset_yearly' },
        { id: 'partner', label: t('settings.number_circles.cat_partner'), prefixKey: 'partner_id_prefix', defaultPrefix: 'P', startKey: 'partner_start_number', yearKey: 'partner_year_format', monthKey: 'partner_month_format', dayKey: 'partner_day_format', separatorKey: 'partner_separator', paddingKey: 'partner_padding', resetKey: 'partner_reset_yearly' },
        { id: 'project', label: t('settings.number_circles.cat_project'), prefixKey: 'project_id_prefix', defaultPrefix: 'PRJ', startKey: 'project_start_number', yearKey: 'project_year_format', monthKey: 'project_month_format', dayKey: 'project_day_format', separatorKey: 'project_separator', paddingKey: 'project_padding', resetKey: 'project_reset_yearly' },
        { id: 'appointment', label: t('settings.number_circles.cat_appointment'), prefixKey: 'appointment_id_prefix', defaultPrefix: 'TRM', startKey: 'appointment_start_number', yearKey: 'appointment_year_format', monthKey: 'appointment_month_format', dayKey: 'appointment_day_format', separatorKey: 'appointment_separator', paddingKey: 'appointment_padding', resetKey: 'appointment_reset_yearly' },
        { id: 'offer', label: t('settings.number_circles.cat_offer'), prefixKey: 'offer_id_prefix', defaultPrefix: 'ANG', startKey: 'offer_start_number', yearKey: 'offer_year_format', monthKey: 'offer_month_format', dayKey: 'offer_day_format', separatorKey: 'offer_separator', paddingKey: 'offer_padding', resetKey: 'offer_reset_yearly' },
        { id: 'invoice', label: t('settings.number_circles.cat_invoice'), prefixKey: 'invoice_prefix', defaultPrefix: 'RE', startKey: 'invoice_start_number', yearKey: 'invoice_year_format', monthKey: 'invoice_month_format', dayKey: 'invoice_day_format', separatorKey: 'invoice_separator', paddingKey: 'invoice_padding', resetKey: 'invoice_reset_yearly' },
        { id: 'credit_note', label: t('settings.number_circles.cat_credit_note'), prefixKey: 'credit_note_prefix', defaultPrefix: 'GUT', startKey: 'credit_note_start_number', yearKey: 'credit_note_year_format', monthKey: 'credit_note_month_format', dayKey: 'credit_note_day_format', separatorKey: 'credit_note_separator', paddingKey: 'credit_note_padding', resetKey: 'credit_note_reset_yearly' }
    ], [t]);

    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (companyData) {
            const initial: any = {};
            categoriesList.forEach(cat => {
                initial[cat.prefixKey] = companyData[cat.prefixKey] || cat.defaultPrefix;
                initial[cat.startKey] = companyData[cat.startKey] || '1';
                initial[cat.yearKey] = companyData[cat.yearKey] || 'YYYY';
                initial[cat.monthKey] = companyData[cat.monthKey] || 'none';
                initial[cat.dayKey] = companyData[cat.dayKey] || 'none';
                initial[cat.separatorKey] = companyData[cat.separatorKey] || '-';
                initial[cat.paddingKey] = String(companyData[cat.paddingKey] || '5');
                initial[cat.resetKey] = companyData[cat.resetKey] || false;
            });

            setFormData(initial);
        }
    }, [companyData, categoriesList]);

    useEffect(() => {
        const section = searchParams.get('section');
        if (section) {
            setTimeout(() => {
                const element = document.getElementById(`section-${section}`) || document.getElementById(`item-${section}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [searchParams]);

    const updateMutation = useMutation({
        mutationFn: settingsService.updateCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companySettings'] });
            toast.success(t('settings.number_circles.save_success'));
        },
        onError: () => toast.error(t('settings.number_circles.save_error'))
    });

    const handleSave = useCallback(() => updateMutation.mutate(formData), [formData, updateMutation]);
    const handleChange = useCallback((field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    }, []);

    const previews = useMemo(() => {
        const date = new Date();
        const yearFull = date.getFullYear();
        const yearShort = String(yearFull).slice(-2);
        const monthShort = String(date.getMonth() + 1).padStart(2, '0');
        const dayShort = String(date.getDate()).padStart(2, '0');

        const generate = (cat: any) => {
            const prefix = formData[cat.prefixKey] || '';
            const nrValue = formData[cat.startKey] || '1';
            const paddingValue = Number(formData[cat.paddingKey] || 5);
            const nr = String(nrValue).padStart(paddingValue, '0');

            const sep = formData[cat.separatorKey] === 'none' ? '' : formData[cat.separatorKey] || '-';

            let yearPart = '';
            if (formData[cat.yearKey] === 'YYYY') yearPart = yearFull.toString();
            else if (formData[cat.yearKey] === 'YY') yearPart = yearShort;

            let monthPart = '';
            if (formData[cat.monthKey] === 'MM') monthPart = monthShort;
            else if (formData[cat.monthKey] === 'M') monthPart = String(date.getMonth() + 1);

            let dayPart = '';
            if (formData[cat.dayKey] === 'DD') dayPart = dayShort;
            else if (formData[cat.dayKey] === 'D') dayPart = String(date.getDate());

            const parts = [prefix, yearPart, monthPart, dayPart, nr].filter(p => p !== '');
            return parts.join(sep);
        };

        const result: any = {};
        categoriesList.forEach(cat => {
            result[cat.id] = generate(cat);
        });
        return result;
    }, [formData, categoriesList]);

    return (
        <div className="bg-white shadow-sm border border-slate-100 rounded-sm overflow-hidden animate-fadeIn flex-1 min-h-0 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <FaListOl className="text-brand-primary" />
                    <h3 className="text-sm font-medium text-slate-800">{t('settings.number_circles.header')}</h3>
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

            <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                <div id="section-master_data" className="mb-12 scroll-mt-20">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{t('settings.number_circles.section_master_data') || 'BASIS'}</h4>
                    <NumberCategory
                        formData={formData}
                        handleChange={handleChange}
                        previews={previews}
                        t={t}
                        items={[
                            categoriesList.find(c => c.id === 'customer'),
                            categoriesList.find(c => c.id === 'partner'),
                        ].filter(Boolean)}
                    />
                </div>

                <div id="section-projects" className="mb-12 scroll-mt-20">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{t('settings.number_circles.section_projects') || 'PROJEKTE'}</h4>
                    <NumberCategory
                        formData={formData}
                        handleChange={handleChange}
                        previews={previews}
                        t={t}
                        items={[
                            categoriesList.find(c => c.id === 'project'),
                            categoriesList.find(c => c.id === 'appointment'),
                            categoriesList.find(c => c.id === 'offer'),
                        ].filter(Boolean)}
                    />
                </div>

                <div id="section-finance" className="mb-0 scroll-mt-20">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{t('settings.number_circles.section_finance') || 'FINANZEN'}</h4>
                    <NumberCategory
                        formData={formData}
                        handleChange={handleChange}
                        previews={previews}
                        t={t}
                        items={[
                            categoriesList.find(c => c.id === 'invoice'),
                            categoriesList.find(c => c.id === 'credit_note'),
                        ].filter(Boolean)}
                    />
                </div>
            </div>
        </div>
    );
};

export default NumberCircleSettingsTab;
