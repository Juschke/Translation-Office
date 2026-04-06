import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FaTimes, FaSave, FaLanguage, FaFileAlt, FaGlobe, FaCheck, FaBan, FaEnvelopeOpenText, FaEye, FaCode, FaPlus, FaTag, FaRuler, FaMoneyBillWave } from 'react-icons/fa';
import { clsx } from 'clsx';
import SearchableSelect from '../common/SearchableSelect';
import { settingsService } from '../../api/services';

interface NewMasterDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    type: 'languages' | 'doc_types' | 'services' | 'email_templates' | 'specializations' | 'units' | 'currencies' | 'project_statuses';
    initialData?: any;
}

const NewMasterDataModal: React.FC<NewMasterDataModalProps> = ({ isOpen, onClose, onSubmit, type, initialData }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<any>({});
    const [showPreview, setShowPreview] = useState(false);
    const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const availableVariables = [
        { label: 'Auftragsnummer', value: '{offer_number}' },
        { label: 'Datum', value: '{date}' },
        { label: 'Kunde', value: '{customer_name}' },
        { label: 'Ansprechpartner', value: '{contact_person}' },
        { label: 'Projektname', value: '{project_name}' },
        { label: 'Preis (Netto)', value: '{price_net}' },
        { label: 'Liefertermin', value: '{deadline}' },
    ];

    const insertVariable = (variable: string) => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const text = formData.body || '';
            const newText = text.substring(0, start) + variable + text.substring(end);
            setFormData({ ...formData, body: newText });

            // Restore focus and cursor position (after insertion)
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + variable.length;
                }
            }, 0);
        } else {
            setFormData({ ...formData, body: (formData.body || '') + variable });
        }
    };

    const getPreviewText = (text: string) => {
        if (!text) return '';
        return text
            .replace('{offer_number}', 'AN-2024-001')
            .replace('{date}', new Date().toLocaleDateString('de-DE'))
            .replace('{customer_name}', 'Musterfirma GmbH')
            .replace('{contact_person}', 'Max Mustermann')
            .replace('{project_name}', 'Webseiten-Übersetzung EN>DE')
            .replace('{price_net}', '450,00 €')
            .replace('{deadline}', '15.03.2024');
    };

    const [errors, setErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {});
            setErrors({});

            // Fetch existing categories if type is doc_types
            if (type === 'doc_types') {
                settingsService.getDocTypes().then(data => {
                    const uniqueCategories = Array.from(new Set(data.map((d: any) => d.category).filter(Boolean))) as string[];

                    // Ensure the current category of the item being edited is in the list
                    if (initialData?.category && !uniqueCategories.includes(initialData.category)) {
                        uniqueCategories.push(initialData.category);
                    }

                    setCategories(uniqueCategories.map(cat => ({ value: cat, label: cat })));
                });
            }
        }
    }, [isOpen, initialData, type]);

    const handleAddNewCategory = () => {
        if (newCategoryName.trim()) {
            const newCat = newCategoryName.trim();
            // Check if already exists
            if (!categories.find(c => c.value === newCat)) {
                setCategories(prev => [...prev, { value: newCat, label: newCat }]);
            }
            handleChange('category', newCat);
            setNewCategoryName('');
            setIsAddCategoryModalOpen(false);
        }
    };

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: Record<string, boolean> = {};
        let firstErrorId = '';

        if (type === 'languages') {
            if (!formData.name_internal) { newErrors.name_internal = true; if (!firstErrorId) firstErrorId = 'name_internal'; }
            if (!formData.name_native) { newErrors.name_native = true; if (!firstErrorId) firstErrorId = 'name_native'; }
            if (!formData.iso_code) { newErrors.iso_code = true; if (!firstErrorId) firstErrorId = 'iso_code'; }
        }
        if (type === 'doc_types') {
            if (!formData.category) { newErrors.category = true; if (!firstErrorId) firstErrorId = 'category'; }
            if (!formData.name) { newErrors.name = true; if (!firstErrorId) firstErrorId = 'name'; }
        }
        if (type === 'services') {
            if (!formData.name) { newErrors.name = true; if (!firstErrorId) firstErrorId = 'name'; }
            if (!formData.base_price) { newErrors.base_price = true; if (!firstErrorId) firstErrorId = 'base_price'; }
        }
        if (type === 'email_templates') {
            if (!formData.name) { newErrors.name = true; if (!firstErrorId) firstErrorId = 'name'; }
            if (!formData.subject) { newErrors.subject = true; if (!firstErrorId) firstErrorId = 'subject'; }
            if (!formData.body) { newErrors.body = true; if (!firstErrorId) firstErrorId = 'body'; }
        }
        if (type === 'specializations') {
            if (!formData.name) { newErrors.name = true; if (!firstErrorId) firstErrorId = 'name'; }
        }
        if (type === 'units') {
            if (!formData.name) { newErrors.name = true; if (!firstErrorId) firstErrorId = 'name'; }
        }
        if (type === 'currencies') {
            if (!formData.code) { newErrors.code = true; if (!firstErrorId) firstErrorId = 'code'; }
            if (!formData.name) { newErrors.name = true; if (!firstErrorId) firstErrorId = 'name'; }
            if (!formData.symbol) { newErrors.symbol = true; if (!firstErrorId) firstErrorId = 'symbol'; }
        }
        if (type === 'project_statuses') {
            if (!formData.name) { newErrors.name = true; if (!firstErrorId) firstErrorId = 'name'; }
            if (!formData.label) { newErrors.label = true; if (!firstErrorId) firstErrorId = 'label'; }
        }

        setErrors(newErrors);

        if (firstErrorId) {
            const el = document.getElementById(firstErrorId);
            if (el) {
                el.focus();
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (validate()) {
            const payload = { ...formData };
            // Ensure status is at least active if unset
            if (!payload.status) payload.status = 'active';

            // Specific backend mapping for Languages
            if (type === 'languages') {
                if (payload.status === 'inactive') payload.status = 'archived';
            }

            onSubmit(payload);
        } else {
            toast.error('Bitte füllen Sie alle markierten Pflichtfelder aus.');
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: false }));
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'languages': return 'Neue Sprache anlegen';
            case 'doc_types': return 'Neue Dokumentenart';
            case 'services': return 'Neue Dienstleistung';
            case 'email_templates': return 'Neue Email-Vorlage';
            case 'specializations': return 'Neues Fachgebiet';
            case 'units': return 'Neue Einheit';
            case 'currencies': return 'Neue Währung';
            case 'project_statuses': return 'Neuen Projekt-Status anlegen';
            default: return 'Datensatz anlegen';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'languages': return <FaLanguage className="text-slate-700" />;
            case 'doc_types': return <FaFileAlt className="text-slate-700" />;
            case 'services': return <FaGlobe className="text-slate-700" />;
            case 'email_templates': return <FaEnvelopeOpenText className="text-slate-700" />;
            case 'specializations': return <FaTag className="text-slate-700" />;
            case 'units': return <FaRuler className="text-slate-700" />;
            case 'currencies': return <FaMoneyBillWave className="text-slate-700" />;
            case 'project_statuses': return <FaCheck className="text-slate-700" />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
            <div className={clsx(
                "bg-white rounded-sm shadow-sm w-full overflow-hidden animate-fadeInUp",
                type === 'email_templates' ? "max-w-2xl" : "max-w-lg"
            )}>
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                            {getIcon()}
                        </div>
                        <h3 className="font-medium text-slate-800 text-sm">
                            {initialData ? 'Eintrag bearbeiten' : getTitle()}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Status Field - Common for all */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-400">Status</label>
                        <div className="flex bg-slate-100 p-0.5 rounded-sm border border-slate-200 h-11">
                            <button
                                onClick={() => handleChange('status', 'active')}
                                className={clsx("flex-1 text-xs font-medium rounded-sm flex items-center justify-center gap-2 transition", (formData.status || 'active') === 'active' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
                            >
                                <FaCheck className="text-xs" /> Aktiv
                            </button>
                            <button
                                onClick={() => handleChange('status', 'inactive')}
                                className={clsx("flex-1 text-xs font-medium rounded-sm flex items-center justify-center gap-2 transition", formData.status === 'inactive' ? "bg-white text-slate-500 shadow-sm" : "text-slate-400")}
                            >
                                <FaBan className="text-xs" /> Inaktiv
                            </button>
                        </div>
                    </div>

                    {/* Language Fields */}
                    {type === 'languages' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">{t('fields.code')}</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-3 border border-slate-300 bg-white rounded-sm outline-none focus:border-slate-900 text-sm font-mono"
                                        placeholder="001"
                                        value={formData.code || ''}
                                        onChange={(e) => handleChange('code', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="block text-xs font-medium text-slate-400">Name der Sprache <span className="text-red-500">*</span></label>
                                    <input
                                        id="name_internal"
                                        type="text"
                                        className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all shadow-sm", errors.name_internal ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
                                        placeholder="z.B. Deutsch (Deutschland)"
                                        value={formData.name_internal || ''}
                                        onChange={(e) => handleChange('name_internal', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">Name (Native) <span className="text-red-500">*</span></label>
                                <input
                                    id="name_native"
                                    type="text"
                                    className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all", errors.name_native ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
                                    placeholder="z.B. Deutsch"
                                    value={formData.name_native || ''}
                                    onChange={(e) => handleChange('name_native', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">ISO Code <span className="text-red-500">*</span></label>
                                    <input
                                        id="iso_code"
                                        type="text"
                                        className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all", errors.iso_code ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
                                        placeholder="de-DE"
                                        value={formData.iso_code || ''}
                                        onChange={(e) => handleChange('iso_code', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Flaggen-Code (2-Stellig)</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-3 border border-slate-300 rounded-sm outline-none focus:border-slate-900 text-sm bg-white"
                                        placeholder="de"
                                        maxLength={2}
                                        value={formData.flag_icon || ''}
                                        onChange={(e) => handleChange('flag_icon', e.target.value.toLowerCase())}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Doc Type Fields */}
                    {type === 'doc_types' && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <SearchableSelect
                                    id="category"
                                    label="Kategorie"
                                    placeholder="Wählen oder neu suchen..."
                                    options={categories}
                                    value={formData.category || ''}
                                    onChange={(val) => handleChange('category', val)}
                                    onAddNew={() => setIsAddCategoryModalOpen(true)}
                                    error={errors.category}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
                                <div className="space-y-1.5 col-span-1">
                                    <label className="block text-xs font-medium text-slate-400">{t('fields.code')}</label>
                                    <input
                                        id="code"
                                        type="text"
                                        className="w-full h-11 px-3 border border-slate-300 bg-white rounded-sm outline-none focus:border-slate-900 text-sm transition-all font-mono"
                                        placeholder="001"
                                        value={formData.code || ''}
                                        onChange={(e) => handleChange('code', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="block text-xs font-medium text-slate-400">{t('fields.name')} <span className="text-red-500">*</span></label>
                                    <input
                                        id="name"
                                        type="text"
                                        className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all", errors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
                                        placeholder="z.B. Marketing Broschüre"
                                        value={formData.name || ''}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Service Fields */}
                    {type === 'services' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="block text-xs font-medium text-slate-400">Leistungs-Name <span className="text-red-500">*</span></label>
                                    <input
                                        id="name"
                                        type="text"
                                        className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all", errors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
                                        placeholder="z.B. Lektorat Premium"
                                        value={formData.name || ''}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Leistungscode</label>
                                    <input
                                        type="text"
                                        maxLength={20}
                                        className="w-full h-11 px-3 border border-slate-300 rounded-sm outline-none focus:border-slate-900 text-sm bg-white font-mono"
                                        placeholder="001"
                                        value={formData.service_code || ''}
                                        onChange={(e) => handleChange('service_code', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Einheit</label>
                                    <select
                                        className="w-full h-11 px-3 border border-slate-300 rounded-sm outline-none focus:border-slate-900 text-sm bg-white"
                                        value={formData.unit || ''}
                                        onChange={(e) => handleChange('unit', e.target.value)}
                                    >
                                        <option value="Wort">Wort</option>
                                        <option value="Zeile">Zeile</option>
                                        <option value="Stunde">Stunde</option>
                                        <option value="Seite">Seite</option>
                                        <option value="Pauschal">Pauschal</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Basispreis (€) <span className="text-red-500">*</span></label>
                                    <input
                                        id="base_price"
                                        type="text"
                                        className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all", errors.base_price ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
                                        placeholder="0.12"
                                        value={formData.base_price || ''}
                                        onChange={(e) => handleChange('base_price', e.target.value)}
                                        onBlur={(e) => handleChange('base_price', (parseFloat(e.target.value.replace(',', '.')) || 0).toFixed(2))}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Specialization Fields */}
                    {type === 'specializations' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-2">
                                <div className="space-y-1.5 col-span-1">
                                    <label className="block text-xs font-medium text-slate-400">{t('fields.code')}</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-3 border border-slate-300 bg-white rounded-sm outline-none focus:border-slate-900 text-sm font-mono"
                                        placeholder="001"
                                        value={formData.code || ''}
                                        onChange={(e) => handleChange('code', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-3">
                                    <label className="block text-xs font-medium text-slate-400">Bezeichnung <span className="text-red-500">*</span></label>
                                    <input id="name" type="text" className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all shadow-sm", errors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")} placeholder="z.B. Recht & Verträge" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">Beschreibung</label>
                                <input type="text" className="w-full h-11 px-3 border border-slate-300 rounded-sm outline-none focus:border-slate-900 text-sm bg-white" placeholder="Kurze Beschreibung (optional)" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
                            </div>
                        </>
                    )}

                    {/* Unit Fields */}
                    {type === 'units' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="space-y-1.5 col-span-1">
                                    <label className="block text-xs font-medium text-slate-400">{t('fields.code')}</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-3 border border-slate-300 bg-white rounded-sm outline-none focus:border-slate-900 text-sm font-mono"
                                        placeholder="001"
                                        value={formData.code || ''}
                                        onChange={(e) => handleChange('code', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-3">
                                    <label className="block text-xs font-medium text-slate-400">Bezeichnung <span className="text-red-500">*</span></label>
                                    <input id="name" type="text" className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all shadow-sm", errors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")} placeholder="z.B. Normseite" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Abkürzung</label>
                                    <input type="text" maxLength={10} className="w-full h-11 px-3 border border-slate-300 rounded-sm outline-none focus:border-slate-900 text-sm bg-white font-mono uppercase tracking-tighter" placeholder="z.B. NS" value={formData.abbreviation || ''} onChange={(e) => handleChange('abbreviation', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Einheitstyp</label>
                                    <select
                                        className="w-full h-11 px-3 border border-slate-300 rounded-sm outline-none focus:border-slate-900 text-sm bg-white"
                                        value={formData.type || 'quantity'}
                                        onChange={(e) => handleChange('type', e.target.value)}
                                    >
                                        <option value="quantity">Menge (Wörter, Zeilen...)</option>
                                        <option value="time">Zeitaufwand (Stunden, Tage...)</option>
                                        <option value="flatrate">Pauschal (Dokument, Paket...)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">Beschreibung</label>
                                <input type="text" className="w-full h-11 px-3 border border-slate-300 rounded-sm outline-none focus:border-slate-900 text-sm bg-white" placeholder="Kurze Erklärung (optional)" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* Currency Fields */}
                    {type === 'currencies' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Code (ISO) <span className="text-red-500">*</span></label>
                                    <input id="code" type="text" maxLength={3} className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all uppercase", errors.code ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")} placeholder="EUR" value={formData.code || ''} onChange={(e) => handleChange('code', e.target.value.toUpperCase())} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Symbol <span className="text-red-500">*</span></label>
                                    <input id="symbol" type="text" maxLength={5} className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all", errors.symbol ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")} placeholder="€" value={formData.symbol || ''} onChange={(e) => handleChange('symbol', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-slate-400">Standard</label>
                                    <button type="button" onClick={() => handleChange('is_default', !formData.is_default)} className={clsx("w-full h-11 px-3 border rounded-sm text-xs font-medium transition-all flex items-center justify-center gap-2", formData.is_default ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-slate-300 text-slate-400 bg-white")}>
                                        {formData.is_default ? <><FaCheck className="text-xs" /> Standard</> : 'Nein'}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">Bezeichnung <span className="text-red-500">*</span></label>
                                <input id="name" type="text" className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all", errors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")} placeholder="z.B. Euro" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                            </div>
                        </>
                    )}

                    {/* Email Template Fields */}
                    {type === 'email_templates' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-2">
                                <div className="space-y-1.5 col-span-1">
                                    <label className="block text-xs font-medium text-slate-400">{t('fields.code')}</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-3 border border-slate-300 bg-white rounded-sm outline-none focus:border-slate-900 text-sm font-mono"
                                        placeholder="001"
                                        value={formData.code || ''}
                                        onChange={(e) => handleChange('code', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-3">
                                    <label className="block text-xs font-medium text-slate-400">Vorlagen-Name <span className="text-red-500">*</span></label>
                                    <input
                                        id="name"
                                        type="text"
                                        className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all shadow-sm", errors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
                                        placeholder="z.B. Angebot versenden"
                                        value={formData.name || ''}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">Betreff <span className="text-red-500">*</span></label>
                                <input
                                    id="subject"
                                    type="text"
                                    className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all", errors.subject ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
                                    placeholder="Ihre Anfrage bei Translation Office"
                                    value={formData.subject || ''}
                                    onChange={(e) => handleChange('subject', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="block text-xs font-medium text-slate-400">Inhalt <span className="text-red-500">*</span></label>
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-100"
                                    >
                                        {showPreview ? <><FaCode /> Editor</> : <><FaEye /> Vorschau</>}
                                    </button>
                                </div>

                                {showPreview ? (
                                    <div className="w-full h-48 px-3 py-3 border border-slate-200 rounded-sm text-sm bg-slate-50 overflow-y-auto cursor-not-allowed text-slate-600 whitespace-pre-wrap">
                                        {getPreviewText(formData.body)}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {availableVariables.map((v) => (
                                                <button
                                                    key={v.value}
                                                    onClick={() => insertVariable(v.value)}
                                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-sm text-xs font-medium text-slate-600 hover:text-slate-700 transition"
                                                    title="Klicken zum Einfügen"
                                                >
                                                    {v.label}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            id="body"
                                            ref={textareaRef}
                                            className={clsx("w-full h-32 px-3 py-2 border rounded-sm outline-none focus:border-slate-900 text-sm bg-white transition-all", errors.body ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
                                            placeholder="Hallo {contact_person}, anbei erhalten Sie..."
                                            value={formData.body || ''}
                                            onChange={(e) => handleChange('body', e.target.value)}
                                        />
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {/* Project Status Fields */}
                    {type === 'project_statuses' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="space-y-1.5 col-span-1">
                                    <label className="block text-xs font-medium text-slate-400">{t('fields.code')}</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-3 border border-slate-300 bg-white rounded-sm outline-none focus:border-slate-900 text-sm font-mono"
                                        placeholder="001"
                                        value={formData.code || ''}
                                        onChange={(e) => handleChange('code', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-3">
                                    <label className="block text-xs font-medium text-slate-400">Key (Interner Code) <span className="text-red-500">*</span></label>
                                    <input id="name" type="text" className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all font-mono shadow-sm", errors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")} placeholder="z.B. in_progress" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 -mt-2">Dienet der internen Identifikation (z.B. f_bearbeitung). Keine Leerstellen.</p>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">Anzeigename <span className="text-red-500">*</span></label>
                                <input id="label" type="text" className={clsx("w-full h-11 px-3 border rounded-sm outline-none focus:border-slate-900 text-sm transition-all", errors.label ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")} placeholder="z.B. In Bearbeitung" value={formData.label || ''} onChange={(e) => handleChange('label', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">Stil (Tailwind Klassen)</label>
                                <input type="text" className="w-full h-11 px-3 border border-slate-300 rounded-sm outline-none focus:border-slate-900 text-sm bg-white" placeholder="bg-blue-50 text-blue-700 border-blue-200" value={formData.style || ''} onChange={(e) => handleChange('style', e.target.value)} />
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400">Vorschau:</span>
                                    <span className={clsx('px-2.5 py-0.5 rounded-sm text-xs font-semibold border tracking-tight', formData.style || 'bg-slate-50 text-slate-400 border-slate-200')}>
                                        {formData.label || 'Vorschau'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">Sortierung</label>
                                <input type="number" className="w-full h-11 px-3 border border-slate-300 rounded-sm outline-none focus:border-slate-900 text-sm bg-white" value={formData.sort_order || 0} onChange={(e) => handleChange('sort_order', parseInt(e.target.value))} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-sm border border-slate-300 text-slate-600 text-xs font-medium hover:bg-white transition"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-sm text-xs font-medium hover:bg-slate-800 shadow-sm transition flex items-center gap-2"
                    >
                        <FaSave /> Speichern
                    </button>
                </div>
            </div>

            {/* Sub-Modal for adding new category */}
            {isAddCategoryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-sm shadow-sm w-full max-w-sm overflow-hidden animate-scaleIn">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="font-medium text-slate-800 text-xs">Neue Kategorie</h4>
                            <button onClick={() => setIsAddCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
                        </div>
                        <div className="p-6">
                            <label className="block text-xs font-medium text-slate-400 mb-2">Name der Kategorie</label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full h-11 px-3 border border-slate-300 rounded-sm outline-none focus:border-slate-900 text-sm"
                                placeholder="z.B. Medizinische Dokumente"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                            />
                        </div>
                        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2">
                            <button
                                onClick={() => setIsAddCategoryModalOpen(false)}
                                className="px-4 py-2 text-xs font-medium text-slate-500"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleAddNewCategory}
                                className="px-4 py-2 bg-slate-900 text-white rounded-sm text-xs font-medium flex items-center gap-2"
                            >
                                <FaPlus className="text-xs" /> Hinzufügen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewMasterDataModal;
