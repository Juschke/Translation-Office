import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaTimes, FaFileAlt, FaInfoCircle, FaPlus, FaEye, FaEdit } from 'react-icons/fa';
import { Collapse } from 'antd';
import Input from '../common/Input';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import {
    getTemplateVariables,
    getExampleVariableMap,
    buildPreviewHtml,
    type VariableGroup,
} from '../../lib/templateUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NewEmailTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => void;
    initialData?: Partial<FormData>;
}

interface FormData {
    name: string;
    subject: string;
    body: string;
    type: string;
}

type ActiveTab = 'bearbeiten' | 'vorschau';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_FORM: FormData = { name: '', subject: '', body: '', type: '' };

const GROUP_LABELS: Record<VariableGroup, string> = {
    firma: 'Firma',
    absender: 'Absender',
    projekt: 'Projekt',
    datum: 'Datum',
};

const GROUP_ORDER: VariableGroup[] = ['projekt', 'firma', 'absender', 'datum'];

const ALL_VARIABLES = getTemplateVariables();

const quillModules = {
    toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'clean'],
    ],
};

// ---------------------------------------------------------------------------
// Sub-component: Variable Helper Panel
// ---------------------------------------------------------------------------

interface VariableHelperProps {
    onInsert: (key: string) => void;
}

const VariableHelper: React.FC<VariableHelperProps> = ({ onInsert }) => {
    const collapseItems = GROUP_ORDER.map(group => {
        const vars = ALL_VARIABLES.filter(v => v.group === group);
        return {
            key: group,
            label: (
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {GROUP_LABELS[group]}
                </span>
            ),
            children: (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 py-1">
                    {vars.map(v => (
                        <button
                            key={v.key}
                            type="button"
                            title={`Beispiel: ${v.example}`}
                            onClick={() => onInsert(v.key)}
                            className="flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-sm border border-slate-200 bg-white text-left hover:border-slate-900 hover:bg-slate-50 transition-all group"
                        >
                            <span className="text-[10px] font-medium text-slate-600 group-hover:text-slate-900 leading-tight truncate">
                                {v.label}
                            </span>
                            <FaPlus size={7} className="text-slate-400 group-hover:text-slate-700 shrink-0" />
                        </button>
                    ))}
                </div>
            ),
        };
    });

    return (
        <div className="border border-slate-200 rounded-sm overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Verfügbare Variablen
                </span>
                <span className="ml-2 text-[10px] text-slate-400">
                    — Klicken zum Einfügen an Cursor-Position
                </span>
            </div>
            <Collapse
                ghost
                size="small"
                items={collapseItems}
                className="variable-helper-collapse"
            />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Sub-component: Preview Panel
// ---------------------------------------------------------------------------

interface PreviewPanelProps {
    subject: string;
    body: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ subject, body }) => {
    const exampleVars = getExampleVariableMap();
    const previewSubject = buildPreviewHtml(subject, exampleVars);
    const previewBody = buildPreviewHtml(body, exampleVars);
    const sanitizedBody = DOMPurify.sanitize(previewBody);

    return (
        <div className="space-y-4">
            {/* Hint about amber highlights */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-sm bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                <FaInfoCircle size={12} className="shrink-0 mt-0.5 text-amber-500" />
                <span>
                    Bekannte Variablen werden mit Beispielwerten befüllt.{' '}
                    <span className="font-semibold">Amber-markierte</span> Platzhalter sind unbekannt
                    oder werden zur Laufzeit durch das System ersetzt.
                </span>
            </div>

            {/* Subject preview */}
            <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Betreff-Vorschau
                </span>
                <div
                    className="px-4 py-3 rounded-sm border border-slate-200 bg-white text-sm font-semibold text-slate-800 min-h-[40px]"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewSubject) || '<span class="text-slate-300 font-normal italic">Kein Betreff</span>' }}
                />
            </div>

            {/* Body preview */}
            <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Nachrichten-Vorschau
                </span>
                <div
                    className="px-6 py-5 rounded-sm border border-slate-200 bg-white min-h-[300px] prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed overflow-auto"
                    dangerouslySetInnerHTML={{
                        __html: sanitizedBody || '<p class="text-slate-300 italic">Kein Inhalt</p>',
                    }}
                />
            </div>

            {/* Example values legend */}
            <details className="group">
                <summary className="text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none hover:text-slate-600 transition-colors">
                    Verwendete Beispielwerte anzeigen
                </summary>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pl-2">
                    {ALL_VARIABLES.map(v => (
                        <div key={v.key} className="flex items-baseline gap-2 text-[10px]">
                            <code className="font-mono text-slate-400 shrink-0">{`{{${v.key}}}`}</code>
                            <span className="text-slate-600 truncate">{v.example}</span>
                        </div>
                    ))}
                </div>
            </details>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const NewEmailTemplateModal: React.FC<NewEmailTemplateModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
}) => {
    const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
    const [activeTab, setActiveTab] = useState<ActiveTab>('bearbeiten');
    // ReactQuill exposes a ref to the Quill instance via getEditor()
    const quillRef = useRef<any>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name ?? '',
                subject: initialData.subject ?? '',
                body: initialData.body ?? '',
                type: initialData.type ?? '',
            });
        } else if (isOpen) {
            setFormData(EMPTY_FORM);
        }
        // Always open on the edit tab when (re-)opened
        setActiveTab('bearbeiten');
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    // ------------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------------

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBodyChange = (value: string) => {
        setFormData(prev => ({ ...prev, body: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    /**
     * Inserts `{{key}}` at the cursor position inside the Quill editor.
     * If no cursor position is available the placeholder is appended.
     */
    const handleInsertVariable = useCallback((key: string) => {
        const token = `{{${key}}}`;
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection(true);
            if (range) {
                quill.insertText(range.index, token, 'user');
                quill.setSelection(range.index + token.length, 0);
                return;
            }
        }
        // Fallback: append at end
        setFormData(prev => ({ ...prev, body: prev.body + ' ' + token }));
    }, []);

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-sm shadow-sm w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in-up transform transition-all">
                <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">

                    {/* ---- Header ---- */}
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-3">
                            {initialData ? 'Vorlage bearbeiten' : 'Neue Vorlage anlegen'}
                            <span className="text-xs font-normal text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                                Text-Modul
                            </span>
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition"
                        >
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                    {/* ---- Tab Bar ---- */}
                    <div className="border-b border-slate-200 shrink-0 bg-white">
                        <div className="flex px-6">
                            <button
                                type="button"
                                onClick={() => setActiveTab('bearbeiten')}
                                className={`flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                                    activeTab === 'bearbeiten'
                                        ? 'border-slate-900 text-slate-900'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <FaEdit size={10} /> Bearbeiten
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('vorschau')}
                                className={`flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                                    activeTab === 'vorschau'
                                        ? 'border-slate-900 text-slate-900'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <FaEye size={10} /> Vorschau
                            </button>
                        </div>
                    </div>

                    {/* ---- Content ---- */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white min-h-0">

                        {/* == BEARBEITEN TAB == */}
                        {activeTab === 'bearbeiten' && (
                            <div className="p-8 space-y-8 flex flex-col">

                                {/* Section 1: Template Details */}
                                <div className="space-y-4 shrink-0">
                                    <label className="block text-xs font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaFileAlt className="text-slate-700" /> Vorlagendetails
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <Input
                                                label="Vorlagen-Name *"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="z.B. Willkommens-E-Mail"
                                                required
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Input
                                                label="Typ / Kategorie"
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                placeholder="z.B. Allgemein, Rechnung..."
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                label="Betreff-Zeile *"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="Betreff einfügen, z.B. Ihr Projekt {{project_number}}"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 shrink-0" />

                                {/* Section 2: Editor */}
                                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-2 shrink-0">
                                        <FaInfoCircle className="text-slate-700" /> Nachrichten-Körper
                                    </label>

                                    <div className="flex-1 min-h-[300px] flex flex-col border border-slate-200 rounded-sm overflow-hidden">
                                        <ReactQuill
                                            ref={quillRef}
                                            theme="snow"
                                            value={formData.body}
                                            onChange={handleBodyChange}
                                            modules={quillModules}
                                            className="flex-1 flex flex-col quill-modern no-rounded-sm"
                                        />
                                    </div>

                                    <div className="shrink-0 text-xs text-slate-500">
                                        Tipp: Verwenden Sie Variablen wie{' '}
                                        <code className="font-mono bg-slate-100 px-1 rounded text-slate-700">
                                            {'{{customer_name}}'}
                                        </code>{' '}
                                        im Text, um diese später dynamisch zu befüllen.
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 shrink-0" />

                                {/* Section 3: Variable Helper (collapsible) */}
                                <div className="shrink-0">
                                    <VariableHelper onInsert={handleInsertVariable} />
                                </div>
                            </div>
                        )}

                        {/* == VORSCHAU TAB == */}
                        {activeTab === 'vorschau' && (
                            <div className="p-8">
                                <PreviewPanel subject={formData.subject} body={formData.body} />
                            </div>
                        )}
                    </div>

                    {/* ---- Footer ---- */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() =>
                                setActiveTab(activeTab === 'bearbeiten' ? 'vorschau' : 'bearbeiten')
                            }
                            className="px-4 py-2.5 rounded-sm border border-slate-200 text-slate-500 text-xs font-medium hover:bg-white transition flex items-center gap-2"
                        >
                            {activeTab === 'bearbeiten' ? (
                                <><FaEye size={10} /> Vorschau anzeigen</>
                            ) : (
                                <><FaEdit size={10} /> Zurück zum Bearbeiten</>
                            )}
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-sm border border-slate-300 text-slate-600 text-xs font-medium hover:bg-white transition"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2.5 bg-slate-900 text-white rounded-sm text-xs font-medium shadow-sm hover:bg-slate-800 transition"
                            >
                                Vorlage speichern
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewEmailTemplateModal;
