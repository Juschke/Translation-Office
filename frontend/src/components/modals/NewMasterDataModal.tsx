import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTimes, FaSave, FaLanguage, FaFileAlt, FaGlobe, FaCheck, FaBan, FaEnvelopeOpenText, FaEye, FaCode, FaPlus } from 'react-icons/fa';
import { clsx } from 'clsx';
import SearchableSelect from '../common/SearchableSelect';
import { settingsService } from '../../api/services';

interface NewMasterDataModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSubmit: (data: any) => void;
 type: 'languages' | 'doc_types' | 'services' | 'email_templates';
 initialData?: any;
}

const NewMasterDataModal: React.FC<NewMasterDataModalProps> = ({ isOpen, onClose, onSubmit, type, initialData }) => {
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
 default: return 'Datensatz anlegen';
 }
 };

 const getIcon = () => {
 switch (type) {
 case 'languages': return <FaLanguage className="text-slate-700" />;
 case 'doc_types': return <FaFileAlt className="text-slate-700" />;
 case 'services': return <FaGlobe className="text-slate-700" />;
 case 'email_templates': return <FaEnvelopeOpenText className="text-slate-700" />;
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
 <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center shadow-sm">
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
 <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 h-11">
 <button
 onClick={() => handleChange('status', 'active')}
 className={clsx("flex-1 text-xs font-medium rounded flex items-center justify-center gap-2 transition", (formData.status || 'active') === 'active' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
 >
 <FaCheck className="text-xs" /> Aktiv
 </button>
 <button
 onClick={() => handleChange('status', 'inactive')}
 className={clsx("flex-1 text-xs font-medium rounded flex items-center justify-center gap-2 transition", formData.status === 'inactive' ? "bg-white text-slate-500 shadow-sm" : "text-slate-400")}
 >
 <FaBan className="text-xs" /> Inaktiv
 </button>
 </div>
 </div>

 {/* Language Fields */}
 {type === 'languages' && (
 <>
 <div className="space-y-1.5">
 <label className="block text-xs font-medium text-slate-400">Name der Sprache <span className="text-red-500">*</span></label>
 <input
 id="name_internal"
 type="text"
 className={clsx("w-full h-11 px-3 border rounded outline-none focus:border-slate-900 text-sm transition-all", errors.name_internal ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
 placeholder="z.B. Deutsch (Deutschland)"
 value={formData.name_internal || ''}
 onChange={(e) => handleChange('name_internal', e.target.value)}
 />
 </div>
 <div className="space-y-1.5">
 <label className="block text-xs font-medium text-slate-400">Name (Native) <span className="text-red-500">*</span></label>
 <input
 id="name_native"
 type="text"
 className={clsx("w-full h-11 px-3 border rounded outline-none focus:border-slate-900 text-sm transition-all", errors.name_native ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
 placeholder="z.B. Deutsch"
 value={formData.name_native || ''}
 onChange={(e) => handleChange('name_native', e.target.value)}
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="block text-xs font-medium text-slate-400">ISO Code <span className="text-red-500">*</span></label>
 <input
 id="iso_code"
 type="text"
 className={clsx("w-full h-11 px-3 border rounded outline-none focus:border-slate-900 text-sm transition-all", errors.iso_code ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
 placeholder="de-DE"
 value={formData.iso_code || ''}
 onChange={(e) => handleChange('iso_code', e.target.value)}
 />
 </div>
 <div className="space-y-1.5">
 <label className="block text-xs font-medium text-slate-400">Flaggen-Code (2-Stellig)</label>
 <input
 type="text"
 className="w-full h-11 px-3 border border-slate-300 rounded outline-none focus:border-slate-900 text-sm bg-white"
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
 addNewLabel="Neue Kategorie..."
 error={errors.category}
 />
 </div>
 <div className="space-y-1.5">
 <label className="block text-xs font-medium text-slate-400">Bezeichnung <span className="text-red-500">*</span></label>
 <input
 id="name"
 type="text"
 className={clsx("w-full h-11 px-3 border rounded outline-none focus:border-slate-900 text-sm transition-all", errors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
 placeholder="z.B. Marketing Broschüre"
 value={formData.name || ''}
 onChange={(e) => handleChange('name', e.target.value)}
 />
 </div>
 </div>
 )}

 {/* Service Fields */}
 {type === 'services' && (
 <>
 <div className="space-y-1.5">
 <label className="block text-xs font-medium text-slate-400">Leistungs-Name <span className="text-red-500">*</span></label>
 <input
 id="name"
 type="text"
 className={clsx("w-full h-11 px-3 border rounded outline-none focus:border-slate-900 text-sm transition-all", errors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
 placeholder="z.B. Lektorat Premium"
 value={formData.name || ''}
 onChange={(e) => handleChange('name', e.target.value)}
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="block text-xs font-medium text-slate-400">Einheit</label>
 <select
 className="w-full h-11 px-3 border border-slate-300 rounded outline-none focus:border-slate-900 text-sm bg-white"
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
 className={clsx("w-full h-11 px-3 border rounded outline-none focus:border-slate-900 text-sm transition-all", errors.base_price ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
 placeholder="0.12"
 value={formData.base_price || ''}
 onChange={(e) => handleChange('base_price', e.target.value)}
 />
 </div>
 </div>
 </>
 )}

 {/* Email Template Fields */}
 {type === 'email_templates' && (
 <>
 <div className="space-y-1.5">
 <label className="block text-xs font-medium text-slate-400">Vorlagen-Name <span className="text-red-500">*</span></label>
 <input
 id="name"
 type="text"
 className={clsx("w-full h-11 px-3 border rounded outline-none focus:border-slate-900 text-sm transition-all", errors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
 placeholder="z.B. Angebot versenden"
 value={formData.name || ''}
 onChange={(e) => handleChange('name', e.target.value)}
 />
 </div>
 <div className="space-y-1.5">
 <label className="block text-xs font-medium text-slate-400">Betreff <span className="text-red-500">*</span></label>
 <input
 id="subject"
 type="text"
 className={clsx("w-full h-11 px-3 border rounded outline-none focus:border-slate-900 text-sm transition-all", errors.subject ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
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
 className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100"
 >
 {showPreview ? <><FaCode /> Editor</> : <><FaEye /> Vorschau</>}
 </button>
 </div>

 {showPreview ? (
 <div className="w-full h-48 px-3 py-3 border border-slate-200 rounded text-sm bg-slate-50 overflow-y-auto cursor-not-allowed text-slate-600 whitespace-pre-wrap">
 {getPreviewText(formData.body)}
 </div>
 ) : (
 <>
 <div className="flex flex-wrap gap-1 mb-2">
 {availableVariables.map((v) => (
 <button
 key={v.value}
 onClick={() => insertVariable(v.value)}
 className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:text-slate-700 transition"
 title="Klicken zum Einfügen"
 >
 {v.label}
 </button>
 ))}
 </div>
 <textarea
 id="body"
 ref={textareaRef}
 className={clsx("w-full h-32 px-3 py-2 border rounded outline-none focus:border-slate-900 text-sm bg-white transition-all", errors.body ? "border-red-500 bg-red-50" : "border-slate-300 bg-white")}
 placeholder="Hallo {contact_person}, anbei erhalten Sie..."
 value={formData.body || ''}
 onChange={(e) => handleChange('body', e.target.value)}
 />
 </>
 )}
 </div>
 </>
 )}
 </div>

 {/* Footer */}
 <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
 <button
 onClick={onClose}
 className="px-6 py-2.5 rounded border border-slate-300 text-slate-600 text-xs font-medium hover:bg-white transition"
 >
 Abbrechen
 </button>
 <button
 onClick={handleSubmit}
 className="px-6 py-2.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 shadow-sm transition flex items-center gap-2"
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
 className="w-full h-11 px-3 border border-slate-300 rounded outline-none focus:border-slate-900 text-sm"
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
 className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium flex items-center gap-2"
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
