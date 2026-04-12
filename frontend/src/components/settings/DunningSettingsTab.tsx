import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaSave, FaBell, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { dunningService } from '../../api/services/invoices';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import SettingRow from '../common/SettingRow';
import clsx from 'clsx';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const PREVIEW_DATA: Record<string, string> = {
    '{{invoice_number}}': 'RE-2026-10042',
    '{{invoice_date}}': '01.04.2026',
    '{{due_date}}': '15.04.2026',
    '{{amount_gross}}': '1.249,50 €',
    '{{fee}}': '5,00 €',
    '{{new_due_date}}': '22.04.2026'
};


const DUNNING_VARIABLES = Object.keys(PREVIEW_DATA);

const CustomToolbar = ({ id, onTogglePreview, isPreview }: { id: string; onTogglePreview: () => void; isPreview: boolean }) => (
    <div id={`toolbar-${id}`} className={clsx(
        "ql-toolbar-custom flex items-center justify-between border-slate-200 rounded-t-sm transition-all h-10 px-1 bg-slate-50/50 border shadow-sm",
        isPreview && "!bg-white border-slate-300 shadow-none"
    )}>
        <div className="flex items-center h-full">
            <div className={clsx("flex items-center h-full transition-opacity", isPreview && "opacity-30 pointer-events-none")}>
                <span className="ql-formats !mr-4">
                    <button className="ql-bold transition-all" />
                    <button className="ql-italic transition-all" />
                    <button className="ql-underline transition-all" />
                </span>
                <span className="ql-formats !mr-4">
                    <button className="ql-list" value="ordered" />
                    <button className="ql-list" value="bullet" />
                </span>
                <span className="ql-formats !mr-0">
                    <button className="ql-clean" />
                </span>
            </div>
        </div>

        <button
            type="button"
            onClick={onTogglePreview}
            className={clsx(
                "w-8 h-8 flex items-center justify-center rounded-sm transition-all absolute right-2",
                isPreview
                    ? "text-slate-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50"
                    : "text-slate-400 hover:text-brand-primary hover:bg-white border border-transparent hover:border-slate-100"
            )}
            title={isPreview ? "Vorschau schließen" : "Vorschau mit Beispieldaten"}
        >
            {isPreview ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
        </button>
    </div>
);

const DunningSettingsTab = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<any>(null);
    const [previewStates, setPreviewStates] = useState<Record<string, boolean>>({
        level1: false,
        level2: false,
        level3: false
    });

    const quillRefs = {
        level1: useRef<any>(null),
        level2: useRef<any>(null),
        level3: useRef<any>(null)
    };

    const { data: settings, isLoading } = useQuery({
        queryKey: ['dunningSettings'],
        queryFn: dunningService.getSettings,
    });

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const updateMutation = useMutation({
        mutationFn: dunningService.updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dunningSettings'] });
            toast.success('Mahneinstellungen gespeichert.');
        },
        onError: () => toast.error('Fehler beim Speichern.')
    });

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const insertVariable = (level: 'level1' | 'level2' | 'level3', variable: string) => {
        if (previewStates[level]) {
            setPreviewStates(prev => ({ ...prev, [level]: false }));
            setTimeout(() => {
                const quill = quillRefs[level].current?.getEditor();
                if (quill) {
                    const range = quill.getSelection(true);
                    quill.insertText(range.index, variable);
                    quill.setSelection(range.index + variable.length);
                    quill.focus();
                }
            }, 50);
            return;
        }

        const quill = quillRefs[level].current?.getEditor();
        if (quill) {
            const range = quill.getSelection(true);
            quill.insertText(range.index, variable);
            quill.setSelection(range.index + variable.length);
        }
    };

    const getPreviewContent = (content: string) => {
        let result = content || '';
        Object.entries(PREVIEW_DATA).forEach(([key, val]) => {
            result = result.split(key).join(`<span class="variable-marker">${val}</span>`);
        });
        return result;
    };

    const togglePreview = (level: string) => {
        setPreviewStates(prev => ({ ...prev, [level]: !prev[level] }));
    };

    if (isLoading || !formData) {
        return <div className="p-8 text-center text-slate-500 text-sm">Lade Einstellungen...</div>;
    }

    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-y-auto custom-scrollbar flex-1 min-h-0 animate-fadeIn pr-2">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <FaBell className="text-brand-primary" />
                    <h3 className="text-sm font-medium text-slate-800">Mahneinstellungen</h3>
                </div>
                <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2"
                >
                    <FaSave /> Speichern
                </Button>
            </div>

            <div className="p-8">
                {[
                    { id: 'level1', label: 'Stufe 1: Zahlungserinnerung', color: 'bg-emerald-500', subjectField: 'level1_subject', bodyField: 'level1_body', daysField: 'level1_days_after_due' },
                    { id: 'level2', label: 'Stufe 2: Erste Mahnung', color: 'bg-amber-500', subjectField: 'level2_subject', bodyField: 'level2_body', daysField: 'level2_days_after_due', feeField: 'level2_fee_cents', feeDesc: 'Zusätzliche Kosten für den Kunden.' },
                    { id: 'level3', label: 'Stufe 3: Zweite Mahnung', color: 'bg-rose-500', subjectField: 'level3_subject', bodyField: 'level3_body', daysField: 'level3_days_after_due', feeField: 'level3_fee_cents', feeDesc: 'Zusätzliche Kosten für den Kunden.' }
                ].map((lvl, index) => (
                    <div key={lvl.id} className={clsx(index > 0 && "mt-12 pt-12 border-t border-slate-100", "mb-16 last:mb-6")}>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">
                            {lvl.label}
                        </h4>

                        <SettingRow label="Tage nach Fälligkeit" className="border-0 pb-2" alignCenter={true} description="Anzahl Tage nach Rechnungsfälligkeit bis diese Mahnstufe automatisch ausgelöst wird.">
                            <Input
                                type="number"
                                value={formData[lvl.daysField]}
                                onChange={(e) => handleChange(lvl.daysField, e.target.value)}
                                className="w-48 h-10 border-slate-200 bg-white"
                            />
                        </SettingRow>

                        {lvl.feeField && (
                            <SettingRow label="Mahngebühr (€)" className="border-0 pb-2" alignCenter={true} description="Zusätzliche Kosten, die dem Kunden für diese Mahnstufe berechnet werden.">
                                <Input
                                    type="number"
                                    value={formData[lvl.feeField] / 100}
                                    onChange={(e) => handleChange(lvl.feeField, parseFloat(e.target.value) * 100)}
                                    className="w-48 h-10 border-slate-200 bg-white"
                                />
                            </SettingRow>
                        )}

                        <SettingRow label="Betreff" className="border-0 pb-4" alignCenter={true} description="Betreffzeile der Mahnungs-Email an den Kunden.">
                            <Input
                                value={formData[lvl.subjectField]}
                                onChange={(e) => handleChange(lvl.subjectField, e.target.value)}
                                className="h-10 border-slate-200 bg-white"
                            />
                        </SettingRow>

                        <SettingRow
                            label="Nachricht"
                            variables={DUNNING_VARIABLES}
                            onVariableClick={(v: string) => insertVariable(lvl.id as any, v)}
                            description="Der Haupttext Ihrer Benachrichtigung."
                            alignCenter={false}
                        >
                            <div className="quill-editor-container relative">
                                <CustomToolbar
                                    id={lvl.id}
                                    onTogglePreview={() => togglePreview(lvl.id)}
                                    isPreview={previewStates[lvl.id]}
                                />

                                {previewStates[lvl.id] ? (
                                    <div
                                        className="min-h-[220px] p-8 bg-white border border-slate-200 border-t-0 rounded-b-sm text-sm leading-relaxed text-slate-700 ql-editor animate-fadeIn"
                                        dangerouslySetInnerHTML={{ __html: getPreviewContent(formData[lvl.bodyField]) }}
                                    />
                                ) : (
                                    <ReactQuill
                                        ref={quillRefs[lvl.id as keyof typeof quillRefs]}
                                        theme="snow"
                                        value={formData[lvl.bodyField]}
                                        onChange={(val) => handleChange(lvl.bodyField, val)}
                                        modules={{ toolbar: `#toolbar-${lvl.id}` }}
                                        className="bg-white rounded-b-sm border-t-0 border-slate-200"
                                    />
                                )}
                            </div>
                        </SettingRow>
                    </div>
                ))}
            </div>

            <style>{`
                .quill-editor-container .ql-container {
                    min-height: 220px;
                    font-family: inherit;
                    font-size: 14px;
                    border-bottom-left-radius: 4px;
                    border-bottom-right-radius: 4px;
                    border-color: #e2e8f0;
                }
                .quill-editor-container .ql-toolbar {
                    border-top-left-radius: 4px;
                    border-top-right-radius: 4px;
                    border-color: #e2e8f0;
                }
                .quill-editor-container .ql-editor {
                    padding: 16px;
                    line-height: 1.6;
                }
                .ql-toolbar-custom .ql-formats {
                    margin-right: 12px;
                }
                .variable-marker {
                    background-color: var(--slate-100, #f1f5f9);
                    color: var(--slate-600, #475569);
                    font-weight: 700;
                    padding: 0 4px;
                    border-radius: 2px;
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    display: inline-block;
                    margin: 0 2px;
                }
                .ql-toolbar-custom .ql-stroke {
                    stroke: #94a3b8;
                    stroke-width: 2.5;
                }
                .ql-toolbar-custom .ql-fill {
                    fill: #94a3b8;
                }
                .ql-toolbar-custom button:hover .ql-stroke {
                    stroke: var(--brand-primary, #10b981);
                }
            `}</style>
        </div>
    );
};

export default DunningSettingsTab;
