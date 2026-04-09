import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaEye, FaEyeSlash, FaCode, FaPaperclip } from 'react-icons/fa';
import Input from '../common/Input';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Button } from '../ui';
import { useEmailVariables } from '../../hooks/useEmailVariables';
import DOMPurify from 'dompurify';
import clsx from 'clsx';
import EmailSidebarPicker from '../common/EmailSidebarPicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface NewEmailTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const NewEmailTemplateModal: React.FC<NewEmailTemplateModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const { getPreviewHtml } = useEmailVariables();
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const [showVariablesSidebar, setShowVariablesSidebar] = useState(true);
    const [selectedSignature, setSelectedSignature] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const quillRef = useRef<any>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [errors, setErrors] = useState<{ name?: boolean; body?: boolean }>({});
    
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '',
        type: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                subject: initialData.subject || '',
                body: initialData.body || '',
                type: initialData.type || '',
            });
            setAttachments([]);
            setErrors({});
        } else if (isOpen) {
            setFormData({
                name: '',
                subject: '',
                body: '',
                type: '',
            });
            setSelectedSignature(null);
            setAttachments([]);
            setErrors({});
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when typing
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const handleBodyChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            body: value
        }));
        if (errors.body) {
            setErrors(prev => ({ ...prev, body: false }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newErrors: { name?: boolean; body?: boolean } = {};
        let firstErrorField: 'name' | 'body' | null = null;

        if (!formData.name.trim()) {
            newErrors.name = true;
            if (!firstErrorField) firstErrorField = 'name';
        }

        const isBodyEmpty = !formData.body || formData.body === '<p><br></p>';
        if (isBodyEmpty) {
            newErrors.body = true;
            if (!firstErrorField) firstErrorField = 'body';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            
            // Focus first error
            if (firstErrorField === 'name') {
                const nameInput = document.getElementsByName('name')[0] as HTMLInputElement;
                if (nameInput) nameInput.focus();
            } else if (firstErrorField === 'body') {
                if (quillRef.current) {
                    quillRef.current.getEditor().focus();
                }
            }
            return;
        }

        let finalBody = formData.body;
        if (selectedSignature) {
            finalBody = finalBody + `<br/><br/>${selectedSignature}`;
        }

        onSubmit({
            ...formData,
            body: finalBody,
            attachments: attachments
        });
    };

    const toggleVariable = (key: string) => {
        const varTag = `{{${key}}}`;
        const editor = quillRef.current?.getEditor();

        if (editor) {
            // Insert at cursor position in Quill
            const range = editor.getSelection(true);
            const index = range ? range.index : editor.getLength();
            editor.insertText(index, varTag, 'user');
            editor.setSelection(index + varTag.length, 0);
            // Sync state from Quill
            setFormData(prev => ({ ...prev, body: editor.root.innerHTML }));
        } else {
            // Fallback: toggle in raw body (HTML/textarea mode)
            setFormData(prev => {
                if (prev.body.includes(varTag)) {
                    return { ...prev, body: prev.body.replace(new RegExp(varTag.replace(/[{}]/g, '\\$&'), 'g'), '') };
                }
                return { ...prev, body: prev.body + varTag };
            });
        }
    };

    const handleSelectSignature = (content: string) => {
        setSelectedSignature(content);
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    const fullPreviewHtml = isPreviewMode ? getPreviewHtml(formData.body + (selectedSignature ? `<br/><br/>${selectedSignature}` : '')) : '';

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className={clsx(
                "bg-white rounded-sm shadow-sm w-full transition-all duration-300 flex flex-col overflow-hidden animate-fade-in-up transform",
                showVariablesSidebar ? "max-w-6xl h-[90vh]" : "max-w-4xl max-h-[90vh]"
            )}>
                <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        multiple 
                        className="hidden" 
                    />

                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-slate-800">
                                {initialData ? 'Vorlage bearbeiten' : 'Neue Vorlage anlegen'}
                            </h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowVariablesSidebar(!showVariablesSidebar)}
                                            className={clsx(
                                                "h-8 px-2 transition-all flex items-center justify-center",
                                                showVariablesSidebar ? "text-brand-primary bg-brand-primary/5" : "text-slate-400"
                                            )}
                                        >
                                            <FaCode size={14} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs font-bold tracking-widest uppercase">
                                            {showVariablesSidebar ? 'Sidebar ausblenden' : 'Sidebar einblenden'}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <div className="w-px h-6 bg-slate-100 mx-1"></div>
                            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                                <FaTimes className="text-lg" />
                            </button>
                        </div>
                    </div>

                    {/* Content Section with Optional Sidebar */}
                    <div className="flex-1 flex overflow-hidden min-h-0 bg-white">
                        {/* Main Form Area */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 min-w-0 h-full">
                            {/* Section 1: Template Details */}
                            <div className="space-y-4 shrink-0">
                                <label className="block text-xs font-medium text-slate-700 mb-3 flex items-center gap-2">
                                    Vorlagendetails
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <Input
                                            label="Name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="z.B. Willkommens-Email"
                                            error={errors.name}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Input
                                            label="Kategorie"
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            placeholder="z.B. Allgemein, Rechnung..."
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            label="Betreff"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="Betreff einfügen..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 shrink-0"></div>

                            {/* Section 2: Editor */}
                            <div className="space-y-4 flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2 shrink-0">
                                        Nachricht
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                                            className={clsx(
                                                "h-7 px-3 rounded-sm text-[10px] font-bold tracking-tight flex items-center gap-1.5 transition-all border",
                                                isPreviewMode
                                                    ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                            )}
                                        >
                                            {isPreviewMode ? <><FaEyeSlash size={10} /> Live Vorschau</> : <><FaEye size={10} /> Live Vorschau</>}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setIsHtmlMode(!isHtmlMode)}
                                            className={clsx(
                                                "h-7 px-3 rounded-sm text-[10px] font-bold tracking-tight flex items-center gap-1.5 transition-all border",
                                                isHtmlMode
                                                    ? "bg-gradient-to-b from-[#235e62] to-[#1B4D4F] text-white border-[#123a3c] shadow-sm"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                            )}
                                            title="HTML Quellcode bearbeiten"
                                        >
                                            <FaCode size={10} /> HTML
                                        </button>
                                    </div>
                                </div>

                                <div className={clsx(
                                    "flex-1 min-h-[400px] flex flex-col border rounded-sm overflow-hidden relative shadow-sm transition-all duration-200",
                                    errors.body ? "border-red-500 bg-red-50/10 ring-1 ring-red-500" : "border-slate-200"
                                )}>
                                    {isPreviewMode ? (
                                        <div className="flex-1 p-8 bg-white overflow-y-auto animate-in fade-in duration-300">
                                            <div className="max-w-none">
                                                <div 
                                                    className="text-[14px] text-slate-800 leading-relaxed font-medium"
                                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fullPreviewHtml) }} 
                                                />
                                            </div>
                                            
                                            {attachments.length > 0 && (
                                                <div className="mt-8 flex flex-wrap gap-2">
                                                    {attachments.map((file, i) => (
                                                        <div key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-sm text-[10px] text-slate-500 flex items-center gap-2">
                                                            <FaPaperclip size={8} /> {file.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : isHtmlMode ? (
                                        <div className="flex-1 flex overflow-hidden bg-[#1e1e1e]">
                                            <textarea
                                                value={formData.body}
                                                onChange={e => handleBodyChange(e.target.value)}
                                                className="w-full h-full p-4 font-mono text-[12px] bg-[#1e1e1e] text-[#d4d4d4] outline-none resize-none border-none selection:bg-[#264f78] leading-[1.6]"
                                                spellCheck={false}
                                                placeholder="<p>Schreiben Sie HTML hier...</p>"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                                            <div className="flex-1 flex flex-col overflow-y-auto">
                                                <ReactQuill
                                                    ref={quillRef}
                                                    theme="snow"
                                                    value={formData.body}
                                                    onChange={handleBodyChange}
                                                    modules={quillModules}
                                                    className="quill-modern border-none flex-none overflow-visible"
                                                    placeholder="Schreiben Sie Ihre Nachricht hier..."
                                                    style={{ minHeight: '300px' }}
                                                />
                                                
                                                {selectedSignature && (
                                                    <div className="shrink-0 border-t border-slate-200 bg-white animate-in slide-in-from-bottom-2 duration-200 relative mt-8 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)] h-auto mx-4 mb-2">
                                                        <label className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-bold text-slate-900 tracking-wide z-10">
                                                            Signatur
                                                        </label>
                                                        <div className="px-4 pt-4 pb-4 h-auto">
                                                            <div
                                                                className="text-xs text-slate-500 leading-relaxed font-medium mb-1"
                                                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedSignature) }}
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedSignature(null)}
                                                            className="absolute top-1.5 right-2 text-slate-300 hover:text-red-400 transition-colors"
                                                            title="Signatur entfernen"
                                                        >
                                                            <FaTimes size={9} />
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="p-4 pt-2">
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {attachments.map((file, i) => (
                                                            <div key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-[10px] font-medium text-slate-600 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                                <FaPaperclip size={10} className="text-slate-400" />
                                                                <span className="max-w-[150px] truncate">{file.name}</span>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => removeAttachment(i)}
                                                                    className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <FaTimes size={10} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="text-[10px] font-bold text-brand-primary hover:text-[#1B4D4F] transition-colors flex items-center gap-1.5 tracking-widest uppercase py-2"
                                                    >
                                                        <FaPaperclip size={10} /> + Anhang hinzufügen
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Variable & Signature Picker */}
                        {showVariablesSidebar && (
                            <div className="w-80 h-full shrink-0 border-l border-slate-100 animate-in slide-in-from-right duration-300 overflow-hidden">
                                <EmailSidebarPicker 
                                    onSelectVariable={toggleVariable} 
                                    onSelectSignature={handleSelectSignature}
                                    currentBody={formData.body}
                                    currentSignature={selectedSignature}
                                    className="h-full"
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={onClose}
                            className="h-10 px-6 text-[11px] font-bold tracking-widest uppercase transition-all flex items-center gap-2"
                        >
                            <FaTimes size={10} /> Abbrechen
                        </Button>
                        <Button
                            type="submit"
                            className="h-10 px-10 text-[11px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 shadow-md bg-gradient-to-b from-[#235e62] to-[#1B4D4F] hover:from-[#2a7073] hover:to-[#235e62] text-white border-[#123a3c]"
                        >
                            Vorlage speichern
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewEmailTemplateModal;
