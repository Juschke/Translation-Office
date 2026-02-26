import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaSave, FaPlus, FaTrash, FaEye, FaPalette } from 'react-icons/fa';
import clsx from 'clsx';
import { settingsService } from '../../api/services';
import Input from '../common/Input';

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
            { id: '1', rate: '19.00', label: '19% MwSt.', paragraph: '§ 1 Abs. 1 Nr. 1 UStG', is_default: true },
            { id: '2', rate: '7.00', label: '7% MwSt.', paragraph: '§ 12 Abs. 2 UStG', is_default: false },
            { id: '3', rate: '0.00', label: '0% (§ 19 UStG)', paragraph: 'Kleinunternehmerregelung gem. § 19 UStG', is_default: false },
            { id: '4', rate: '0.00', label: '0% (Reverse Charge)', paragraph: 'Steuerschuldnerschaft gem. § 13b UStG', is_default: false },
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

    const [newTaxRate, setNewTaxRate] = useState({ rate: '', label: '', paragraph: '' });
    const [activeSection, setActiveSection] = useState('numbers');

    useEffect(() => {
        if (companyData) {
            setFormData((prev: any) => ({
                ...prev,
                invoice_prefix: companyData.invoice_prefix || prev.invoice_prefix,
                invoice_start_number: companyData.invoice_start_number || prev.invoice_start_number,
                credit_note_prefix: companyData.credit_note_prefix || prev.credit_note_prefix,
                credit_note_start_number: companyData.credit_note_start_number || prev.credit_note_start_number,
                project_id_prefix: companyData.project_id_prefix || companyData.offer_prefix || prev.project_id_prefix,
                project_start_number: companyData.project_start_number || companyData.offer_start_number || prev.project_start_number,
                customer_id_prefix: companyData.customer_id_prefix || companyData.customer_number_prefix || prev.customer_id_prefix,
                customer_start_number: companyData.customer_start_number || prev.customer_start_number,
                translator_id_prefix: companyData.translator_id_prefix || prev.translator_id_prefix,
                interpreter_id_prefix: companyData.interpreter_id_prefix || prev.interpreter_id_prefix,
                agency_id_prefix: companyData.agency_id_prefix || prev.agency_id_prefix,
                customer_number_auto: companyData.customer_number_auto ?? prev.customer_number_auto,
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
            toast.success('Rechnungs-Einstellungen gespeichert!');
        },
        onError: () => toast.error('Fehler beim Speichern.')
    });

    const handleSave = () => updateMutation.mutate(formData);
    const handleChange = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));

    // Preview of next number
    const invoicePreview = useMemo(() => {
        const year = new Date().getFullYear();
        const prefix = formData.invoice_prefix || 'RE';
        const num = formData.invoice_start_number || '00001';
        return `${prefix}-${year}-${num}`;
    }, [formData.invoice_prefix, formData.invoice_start_number]);

    const projectPreview = useMemo(() => {
        const year = new Date().toLocaleDateString('de-DE', { year: '2-digit', month: '2-digit' }).replace('.', '');
        const prefix = formData.project_id_prefix || 'P';
        const num = formData.project_start_number || '0001';
        return `${prefix}-${year}-${num}`;
    }, [formData.project_id_prefix, formData.project_start_number]);

    const paymentTextPreview = useMemo(() => {
        return (formData.default_payment_text || '').replace('{days}', formData.default_payment_days || '14');
    }, [formData.default_payment_text, formData.default_payment_days]);

    const addTaxRate = () => {
        if (!newTaxRate.rate || !newTaxRate.label) {
            toast.error('Steuersatz und Bezeichnung sind erforderlich.');
            return;
        }
        const id = Date.now().toString();
        handleChange('tax_rates', [...formData.tax_rates, { ...newTaxRate, id, is_default: false }]);
        setNewTaxRate({ rate: '', label: '', paragraph: '' });
    };

    const removeTaxRate = (id: string) => {
        handleChange('tax_rates', formData.tax_rates.filter((t: any) => t.id !== id));
    };

    const setDefaultTaxRate = (id: string) => {
        handleChange('tax_rates', formData.tax_rates.map((t: any) => ({ ...t, is_default: t.id === id })));
    };

    const sections = [
        { id: 'numbers', label: 'Nummernkreise' },
        { id: 'payment', label: 'Zahlungsbedingungen' },
        { id: 'tax', label: 'Steuersätze' },
        { id: 'texts', label: 'Textvorlagen' },
        { id: 'layout', label: 'Layout & Fußzeile' },
        { id: 'design', label: 'Design' },
    ];
    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-slate-800">Rechnung & Angebot</h3>
                </div>
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white text-xs font-medium hover:bg-brand-primary/90 transition disabled:opacity-50 rounded"
                >
                    <FaSave /> {updateMutation.isPending ? 'Speichert...' : 'Speichern'}
                </button>
            </div>

            {/* Section Navigation */}
            <div className="flex items-center gap-1 px-8 pt-6 pb-2 border-b border-slate-100 overflow-x-auto">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={clsx(
                            'px-3 py-2 text-sm font-medium rounded-sm transition whitespace-nowrap',
                            activeSection === s.id
                                ? 'bg-brand-primary text-white'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        )}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="p-8">
                {/* ── Nummernkreise ── */}
                {activeSection === 'numbers' && (
                    <div>
                        <SettingRow
                            label="Rechnungsnummer"
                            description="Format: Präfix-Jahr-Nummer. Das Präfix und die Startnummer können frei gewählt werden. Die Nummer wird automatisch fortlaufend hochgezählt."
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Präfix"
                                        placeholder="RE"
                                        value={formData.invoice_prefix}
                                        onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                                        helperText="z.B. RE, R, oder R-"
                                    />
                                    <Input
                                        label="Beginnt bei"
                                        placeholder="00001"
                                        value={formData.invoice_start_number}
                                        onChange={(e) => handleChange('invoice_start_number', e.target.value)}
                                        helperText="Numerisch, beliebig viele Stellen"
                                    />
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-sm border-0">
                                    <FaEye className="text-slate-400 text-xs shrink-0" />
                                    <span className="text-sm text-slate-500">Nächste Rechnungsnummer:</span>
                                    <span className="text-sm font-semibold text-slate-900">{invoicePreview}</span>
                                </div>
                            </div>
                        </SettingRow>

                        <SettingRow
                            label="Gutschriften-Nummer"
                            description="Präfix für automatisch erstellte Gutschriften (Stornos)."
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Präfix"
                                    placeholder="GS"
                                    value={formData.credit_note_prefix}
                                    onChange={(e) => handleChange('credit_note_prefix', e.target.value)}
                                    helperText="z.B. GS, G- oder ST-"
                                />
                                <Input
                                    label="Beginnt bei"
                                    placeholder="0001"
                                    value={formData.credit_note_start_number}
                                    onChange={(e) => handleChange('credit_note_start_number', e.target.value)}
                                />
                            </div>
                        </SettingRow>

                        <SettingRow
                            label="Projektnummer"
                            description="Format für Projektnummern. Wird beim Erstellen eines Projekts automatisch vergeben."
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Präfix"
                                        placeholder="P"
                                        value={formData.project_id_prefix}
                                        onChange={(e) => handleChange('project_id_prefix', e.target.value)}
                                    />
                                    <Input
                                        label="Beginnt bei"
                                        placeholder="0001"
                                        value={formData.project_start_number}
                                        onChange={(e) => handleChange('project_start_number', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-sm border-0">
                                    <FaEye className="text-slate-400 text-xs shrink-0" />
                                    <span className="text-sm text-slate-500">Nächste Projektnummer (Beispiel):</span>
                                    <span className="text-sm font-semibold text-slate-900">{projectPreview}</span>
                                </div>
                            </div>
                        </SettingRow>

                        <SettingRow
                            label="Kundennummer"
                            description="Die Kundennummer wird automatisch vergeben. Hier können Sie das Präfix anpassen."
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Präfix"
                                    placeholder="K"
                                    value={formData.customer_id_prefix}
                                    onChange={(e) => handleChange('customer_id_prefix', e.target.value)}
                                />
                                <Input
                                    label="Beginnt bei"
                                    placeholder="10000"
                                    value={formData.customer_start_number}
                                    onChange={(e) => handleChange('customer_start_number', e.target.value)}
                                />
                            </div>
                        </SettingRow>

                        <SettingRow
                            label="Partnernummern"
                            description="Präfixe für verschiedene Partner-Typen."
                        >
                            <div className="grid grid-cols-3 gap-4">
                                <Input
                                    label="Übersetzer"
                                    placeholder="TR"
                                    value={formData.translator_id_prefix}
                                    onChange={(e) => handleChange('translator_id_prefix', e.target.value)}
                                />
                                <Input
                                    label="Dolmetscher"
                                    placeholder="IN"
                                    value={formData.interpreter_id_prefix}
                                    onChange={(e) => handleChange('interpreter_id_prefix', e.target.value)}
                                />
                                <Input
                                    label="Agentur"
                                    placeholder="AG"
                                    value={formData.agency_id_prefix}
                                    onChange={(e) => handleChange('agency_id_prefix', e.target.value)}
                                />
                            </div>
                        </SettingRow>
                    </div>
                )}

                {/* ── Zahlungsbedingungen ── */}
                {activeSection === 'payment' && (
                    <div>
                        <SettingRow
                            label="Standard-Zahlungsziel"
                            description="Wählen Sie das Standard-Zahlungsziel für neue Rechnungen. Dieses kann pro Rechnung individuell angepasst werden."
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
                                            {d === '0' ? 'Sofort' : `${d} Tage`}
                                        </button>
                                    ))}
                                    <Input
                                        placeholder="Eigene Tage"
                                        type="number"
                                        value={!['0', '7', '14', '30'].includes(formData.default_payment_days) ? formData.default_payment_days : ''}
                                        onChange={(e) => handleChange('default_payment_days', e.target.value)}
                                        className="w-32"
                                    />
                                </div>
                            </div>
                        </SettingRow>

                        <SettingRow
                            label="Zahlungstext"
                            description="Der Text, der auf Ihren Rechnungen als Zahlungsbedingung erscheint. Verwenden Sie {days} als Platzhalter."
                        >
                            <div className="space-y-3">
                                <Input
                                    isTextArea
                                    value={formData.default_payment_text}
                                    onChange={(e) => handleChange('default_payment_text', e.target.value)}
                                />
                                <div className="p-3 rounded-sm border-0">
                                    <span className="text-xs text-slate-400 block mb-1">Vorschau:</span>
                                    <span className="text-sm text-slate-700">{paymentTextPreview}</span>
                                </div>
                            </div>
                        </SettingRow>

                        <SettingRow
                            label="Lohnkostenanteil"
                            description="Hinweis zum Lohnkostenanteil auf Rechnungen anzeigen (gesetzlich vorgeschrieben für Privatkunden bei Handwerker-Leistungen)."
                        >
                            <button
                                onClick={() => handleChange('show_labor_cost_hint', !formData.show_labor_cost_hint)}
                                className={clsx(
                                    'px-4 py-2 rounded-sm text-sm font-medium border transition',
                                    formData.show_labor_cost_hint
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                )}
                            >
                                {formData.show_labor_cost_hint ? 'Anzeigen' : 'Ausgeblendet'}
                            </button>
                        </SettingRow>
                    </div>
                )}

                {/* ── Steuersätze ── */}
                {activeSection === 'tax' && (
                    <div>
                        <SettingRow
                            label="Steuersätze verwalten"
                            description="Hinterlegen Sie die Steuersätze und zugehörigen Paragraphen, die Sie für Rechnungen und Angebote benötigen."
                        >
                            <div className="space-y-4">
                                {/* Existing tax rates */}
                                <div className="border border-slate-200 rounded-sm overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2.5">Satz</th>
                                                <th className="px-4 py-2.5">Bezeichnung</th>
                                                <th className="px-4 py-2.5">Paragraph</th>
                                                <th className="px-4 py-2.5 text-center">Standard</th>
                                                <th className="px-4 py-2.5 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {formData.tax_rates.map((t: any) => (
                                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-2.5 font-medium text-slate-900">{t.rate}%</td>
                                                    <td className="px-4 py-2.5 text-slate-700">{t.label}</td>
                                                    <td className="px-4 py-2.5 text-slate-500 text-xs">{t.paragraph}</td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <button
                                                            onClick={() => setDefaultTaxRate(t.id)}
                                                            className={clsx(
                                                                'w-4 h-4 rounded-full border-2 transition',
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

                                {/* Add new tax rate */}
                                <div className="border border-dashed border-slate-200 rounded-sm p-4">
                                    <h5 className="text-xs font-medium text-slate-400 mb-3">Neuen Steuersatz hinzufügen</h5>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Input
                                            placeholder="Satz (%)"
                                            type="number"
                                            value={newTaxRate.rate}
                                            onChange={(e) => setNewTaxRate({ ...newTaxRate, rate: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Bezeichnung"
                                            value={newTaxRate.label}
                                            onChange={(e) => setNewTaxRate({ ...newTaxRate, label: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Paragraph"
                                            value={newTaxRate.paragraph}
                                            onChange={(e) => setNewTaxRate({ ...newTaxRate, paragraph: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={addTaxRate}
                                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition rounded-sm"
                                    >
                                        <FaPlus className="text-xs" /> Hinzufügen
                                    </button>
                                </div>
                            </div>
                        </SettingRow>
                    </div>
                )}

                {/* ── Textvorlagen ── */}
                {activeSection === 'texts' && (
                    <div>
                        <SettingRow
                            label="Rechnungs-Einleitung"
                            description="Der Einleitungstext, der auf jeder Rechnung erscheint."
                        >
                            <Input
                                isTextArea
                                value={formData.invoice_intro_text}
                                onChange={(e) => handleChange('invoice_intro_text', e.target.value)}
                                helperText="Dieser Text erscheint nach der Anrede auf der Rechnung."
                            />
                        </SettingRow>

                        <SettingRow
                            label="Rechnungs-Schlusstext"
                            description="Der Schlusstext unter den Positionen auf der Rechnung."
                        >
                            <Input
                                isTextArea
                                value={formData.invoice_closing_text}
                                onChange={(e) => handleChange('invoice_closing_text', e.target.value)}
                            />
                        </SettingRow>

                        <SettingRow
                            label="Gutschrift-Einleitung"
                            description="Text für automatisch erstellte Gutschriften (Stornos)."
                        >
                            <Input
                                isTextArea
                                value={formData.credit_note_intro_text}
                                onChange={(e) => handleChange('credit_note_intro_text', e.target.value)}
                            />
                        </SettingRow>

                        <SettingRow
                            label="Angebots-Einleitung"
                            description="Einleitungstext für Angebote."
                        >
                            <Input
                                isTextArea
                                value={formData.offer_intro_text}
                                onChange={(e) => handleChange('offer_intro_text', e.target.value)}
                            />
                        </SettingRow>

                        <SettingRow
                            label="Angebots-Schlusstext"
                            description="Schlusstext für Angebote inkl. Gültigkeit."
                        >
                            <Input
                                isTextArea
                                value={formData.offer_closing_text}
                                onChange={(e) => handleChange('offer_closing_text', e.target.value)}
                            />
                        </SettingRow>
                    </div>
                )}

                {/* ── Layout & Fußzeile ── */}
                {activeSection === 'layout' && (
                    <div>
                        <SettingRow
                            label="Absenderzeile"
                            description="Die kleine Absenderzeile über dem Empfänger-Adressfeld. Kann ausgeblendet werden, wenn Sie auf eigenem Briefpapier drucken."
                        >
                            <button
                                onClick={() => handleChange('show_sender_line', !formData.show_sender_line)}
                                className={clsx(
                                    'px-4 py-2 rounded-sm text-sm font-medium border transition',
                                    formData.show_sender_line
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                )}
                            >
                                {formData.show_sender_line ? 'Anzeigen' : 'Ausgeblendet'}
                            </button>
                        </SettingRow>

                        <SettingRow
                            label="Fußzeile"
                            description="Die Fußzeile enthält Ihre Firmendetails, Kontaktdaten und Bankverbindung. Sie können zwischen Standard (3 Spalten) und individueller Fußzeile wählen."
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
                                        Anzeigen
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
                                        Ausblenden
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
                                                            ? 'bg-slate-100 text-slate-900 border-slate-300'
                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                    )}
                                                >
                                                    {s === 'standard' ? 'Standard (3 Spalten)' : 'Individuell'}
                                                </button>
                                            ))}
                                        </div>

                                        {formData.footer_style === 'standard' && (
                                            <div className="bg-slate-50 p-4 rounded-sm border border-slate-200">
                                                <span className="text-xs text-slate-400 block mb-2">Vorschau der Standard-Fußzeile:</span>
                                                <div className="grid grid-cols-3 gap-4 text-xs text-slate-500 border-t border-slate-200 pt-3">
                                                    <div>
                                                        <strong className="text-slate-600 block mb-1">Anschrift</strong>
                                                        {companyData?.company_name || 'Firma'}<br />
                                                        {companyData?.address_street || 'Straße'} {companyData?.address_house_no || ''}<br />
                                                        {companyData?.address_zip || ''} {companyData?.address_city || 'Stadt'}
                                                    </div>
                                                    <div className="text-center">
                                                        <strong className="text-slate-600 block mb-1">Kontakt</strong>
                                                        {companyData?.email && <>Email: {companyData.email}<br /></>}
                                                        {companyData?.phone && <>Tel: {companyData.phone}</>}
                                                    </div>
                                                    <div className="text-right">
                                                        <strong className="text-slate-600 block mb-1">Steuer & Bank</strong>
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
                                                    <span className="text-sm text-slate-500">Spaltenanzahl:</span>
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
                                                <p className="text-xs text-slate-400">
                                                    Im individuellen Modus können Sie jede Spalte einer Fußzeile frei gestalten. Die Konfiguration der einzelnen Spalteninhalte erfolgt in der Druckvorschau.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </SettingRow>
                    </div>
                )}

                {/* ── Design ── */}
                {activeSection === 'design' && (
                    <div>
                        <SettingRow
                            label="Rechnungs-Layout"
                            description="Wählen Sie eines der drei verfügbaren Layouts. Das Layout bestimmt die grundlegende Struktur Ihrer Rechnungs-PDF."
                        >
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    {
                                        id: 'din5008',
                                        label: 'DIN 5008',
                                        desc: 'Klassisches Geschäftsbrief-Format nach DIN-Norm',
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
                                        label: 'Modern',
                                        desc: 'Farbiger Header, zeitgemäßes Design mit Akzentfarben',
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
                                        label: 'Klassisch',
                                        desc: 'Formaler Stil mit zentriertem Kopf, Serifen-Schrift',
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
                            label="Schriftart"
                            description="Die Schriftart für Ihre Rechnungs-PDFs. Bitte beachten Sie, dass nicht alle Schriften auf allen Systemen verfügbar sind."
                        >
                            <select
                                className="w-full h-10 border border-slate-200 rounded-sm px-3 text-sm font-medium text-slate-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 outline-none transition"
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
                            <div className="mt-3 p-3 border-0 rounded-sm">
                                <span className="text-xs text-slate-400 block mb-1">Vorschau:</span>
                                <span className="text-sm text-slate-700" style={{ fontFamily: formData.invoice_font_family }}>
                                    Rechnung Nr. RE-2026-00001 — Nettobetrag: 1.250,00 €
                                </span>
                            </div>
                        </SettingRow>

                        <SettingRow
                            label="Schriftgröße"
                            description="Die Basisschriftgröße für die Rechnung. Größere Schrift ist besser lesbar, kleinere passt mehr Inhalt auf die Seite."
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
                            label="Hauptfarbe"
                            description="Die Akzentfarbe für Linien, Überschriften und den Header (Modern-Layout). Wirkt sich auf die gesamte Optik der Rechnung aus."
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
                                        { color: '#000000', label: 'Schwarz' },
                                        { color: '#1e293b', label: 'Slate' },
                                        { color: '#1e3a5f', label: 'Navy' },
                                        { color: '#14532d', label: 'Grün' },
                                        { color: '#7c2d12', label: 'Braun' },
                                        { color: '#581c87', label: 'Lila' },
                                        { color: '#0f172a', label: 'Dunkel' },
                                        { color: '#0c4a6e', label: 'Blau' },
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
                                <div className="p-3 rounded-sm border-0">
                                    <span className="text-xs text-slate-400 block mb-2">Vorschau:</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-24 rounded-sm" style={{ background: formData.invoice_primary_color }} />
                                        <span className="text-sm font-semibold" style={{ color: formData.invoice_primary_color }}>Rechnungsbetrag: 1.250,00 €</span>
                                    </div>
                                </div>
                            </div>
                        </SettingRow>

                        <SettingRow
                            label="Firmenlogo"
                            description="Ihr Logo erscheint auf allen generierten Rechnungs-PDFs. Laden Sie es unter Unternehmensdaten hoch."
                        >
                            <div className="flex items-center gap-4">
                                {companyData?.company_logo || companyData?.settings?.company_logo ? (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-sm">
                                        <FaPalette className="text-slate-400" />
                                        <span className="text-sm text-slate-600 font-medium">Logo vorhanden ✓</span>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm">
                                        <span className="text-xs text-amber-700 font-medium">Kein Logo hinterlegt. Laden Sie es unter "Unternehmensdaten" hoch.</span>
                                    </div>
                                )}
                            </div>
                        </SettingRow>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceSettingsTab;
