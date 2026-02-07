import { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaTimes, FaTrash } from 'react-icons/fa';
import clsx from 'clsx';

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: any[], onProgress: (fileId: string, progress: number) => void) => Promise<void>;
}

const FileUploadModal = ({ isOpen, onClose, onUpload }: FileUploadModalProps) => {
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<{ [key: string]: number }>({});
    const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const allowedExtensions = ['PDF', 'DOC', 'DOCX', 'TXT', 'JPG', 'JPEG', 'PNG', 'GIF', 'SVG', 'XLSX', 'PPTX', 'ZIP', 'IDML'];

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const addFiles = (files: File[]) => {
        const newFiles = files.map(file => {
            const ext = file.name.split('.').pop()?.toUpperCase() || '';
            const isValid = allowedExtensions.includes(ext);

            return {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                file,
                name: file.name,
                ext,
                type: 'source', // Default
                isValid,
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                words: isValid && !['JPG', 'JPEG', 'PNG', 'GIF', 'SVG'].includes(ext) ? Math.floor(Math.random() * 5000) + 100 : 0,
                chars: isValid && !['JPG', 'JPEG', 'PNG', 'GIF', 'SVG'].includes(ext) ? Math.floor(Math.random() * 30000) + 1000 : 0
            };
        });
        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (id: string) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== id));
    };

    const toggleFileType = (id: string) => {
        setSelectedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, type: f.type === 'source' ? 'target' : 'source' } : f
        ));
    };

    const handleUpload = async () => {
        const validFiles = selectedFiles.filter(f => f.isValid);
        if (validFiles.length > 0) {
            setUploading(true);
            try {
                await onUpload(validFiles.map(f => ({
                    id: f.id,
                    file: f.file, // Pass the raw file
                    name: f.name,
                    ext: f.ext,
                    type: f.type,
                    version: '1.0',
                    size: f.size,
                    words: f.words,
                    chars: f.chars,
                    createdAt: new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    status: 'ready'
                })), (fileId, p) => {
                    setProgress(prev => ({ ...prev, [fileId]: p }));
                });

                setUploading(false);
                setProgress({});
                setSelectedFiles([]);
                onClose();
            } catch (error) {
                console.error("Upload failed in modal:", error);
                setUploading(false);
                // Optionally show error in UI
            }
        }
    };

    const updateFileField = (id: string, field: string, value: any) => {
        setSelectedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, [field]: value } : f
        ));
    };

    const renderEditableCell = (file: any, field: 'words' | 'chars') => {
        const isEditing = editingCell?.id === file.id && editingCell?.field === field;
        const value = file[field];

        if (isEditing) {
            return (
                <input
                    autoFocus
                    type="number"
                    defaultValue={value}
                    className="w-20 px-1 py-0.5 bg-white border border-brand-500 rounded text-right text-[10px] font-bold outline-none"
                    onBlur={(e) => {
                        updateFileField(file.id, field, parseInt(e.target.value) || 0);
                        setEditingCell(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            updateFileField(file.id, field, parseInt((e.target as HTMLInputElement).value) || 0);
                            setEditingCell(null);
                        }
                    }}
                />
            );
        }

        return (
            <span
                onClick={() => !uploading && setEditingCell({ id: file.id, field })}
                className="cursor-pointer hover:text-brand-600 border-b border-transparent hover:border-brand-200"
            >
                {value.toLocaleString()}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-scaleUp">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Dateien hochladen</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Multi-Upload & Kategorisierung</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto max-h-[65vh] custom-scrollbar">
                    {/* Dropzone */}
                    <div
                        className={clsx(
                            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group mb-6",
                            dragActive ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => { e.preventDefault(); setDragActive(false); addFiles(Array.from(e.dataTransfer.files)); }}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <FaCloudUploadAlt className="text-xl text-brand-600" />
                        </div>
                        <div className="text-sm font-bold text-slate-700">Dateien auswählen oder hierher ziehen</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Erlaubt: PDF, DOC, Bilder, TXT, etc.</div>
                    </div>

                    {/* File List as Table */}
                    {selectedFiles.length > 0 && (
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Dateiname</th>
                                        <th className="px-4 py-3 text-right">Wörter</th>
                                        <th className="px-4 py-3 text-right">Zeichen</th>
                                        <th className="px-4 py-3 text-right">Größe</th>
                                        <th className="px-4 py-3 text-center">Kategorie</th>
                                        <th className="px-4 py-3 text-right pr-6">Aktion</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {selectedFiles.map((file) => (
                                        <tr key={file.id} className={clsx("group transition-colors", !file.isValid && "bg-red-50/30")}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400 shrink-0">
                                                        {file.ext}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{file.name}</div>
                                                        {!file.isValid && <span className="text-[8px] font-black bg-red-500 text-white px-1 py-0.5 rounded uppercase tracking-tighter">Format nicht unterstützt</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 tabular-nums">
                                                {renderEditableCell(file, 'words')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 tabular-nums">
                                                {renderEditableCell(file, 'chars')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 tabular-nums">
                                                <div className="flex flex-col items-end">
                                                    <span>{file.size}</span>
                                                    {progress[file.id] !== undefined && (
                                                        <div className="mt-1 w-20 bg-slate-100 rounded-full h-1 overflow-hidden">
                                                            <div
                                                                className="bg-brand-500 h-full transition-all duration-300"
                                                                style={{ width: `${progress[file.id]}%` }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => !uploading && toggleFileType(file.id)}
                                                    className={clsx(
                                                        "px-3 py-1 rounded text-[9px] font-black uppercase tracking-tight border transition-all",
                                                        file.type === 'source'
                                                            ? "bg-slate-100 text-slate-600 border-slate-200"
                                                            : "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                                                    )}
                                                >
                                                    {file.type === 'source' ? 'Quelle' : 'Ziel'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right pr-6">
                                                <button
                                                    onClick={() => !uploading && removeFile(file.id)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <FaTrash className="text-[10px]" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                    <button onClick={onClose} disabled={uploading} className="px-5 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30">Abbrechen</button>
                    <button
                        disabled={selectedFiles.length === 0 || !selectedFiles.some(f => f.isValid) || uploading}
                        onClick={handleUpload}
                        className="px-6 py-2 bg-brand-700 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-brand-800 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
                    >
                        {uploading ? 'Wird übertragen...' : `Hochladen (${selectedFiles.filter(f => f.isValid).length})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileUploadModal;
