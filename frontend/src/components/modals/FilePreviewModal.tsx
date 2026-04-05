import { useRef, useState } from 'react';
import {
    FaTimes, FaDownload, FaExternalLinkAlt, FaPrint,
    FaTrashAlt, FaFilePdf, FaFileWord, FaFileExcel,
    FaFileImage, FaFileArchive, FaFileAlt,
} from 'react-icons/fa';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        name: string;
        url: string;
        type?: string;
        id?: string;
    } | null;
    onDownload: () => void;
    onDelete?: () => void;
}

const getFileIcon = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.endsWith('.pdf')) return <FaFilePdf className="text-red-500 text-xl" />;
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return <FaFileWord className="text-blue-500 text-xl" />;
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return <FaFileExcel className="text-emerald-500 text-xl" />;
    if (['.jpg', '.png', '.jpeg', '.gif', '.svg', '.webp'].some(e => lower.endsWith(e))) return <FaFileImage className="text-purple-500 text-xl" />;
    if (['.zip', '.rar', '.7z'].some(e => lower.endsWith(e))) return <FaFileArchive className="text-orange-500 text-xl" />;
    return <FaFileAlt className="text-slate-400 text-xl" />;
};

const FilePreviewModal = ({ isOpen, onClose, file, onDownload, onDelete }: FilePreviewModalProps) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    if (!isOpen || !file) return null;

    const name = file.name || 'Datei';
    const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(name);
    const isPDF = /\.pdf$/i.test(name);
    const isWord = /\.(doc|docx)$/i.test(name);
    const canPrint = isPDF || isImage;

    const handlePrint = () => {
        if (isPDF) {
            const iframe = document.getElementById('file-preview-iframe') as HTMLIFrameElement;
            if (iframe?.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
        } else if (isImage && file.url) {
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(`
                    <html><head><title>${name}</title>
                    <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}
                    img{max-width:100%;max-height:100vh;object-fit:contain}</style>
                    </head><body><img src="${file.url}" onload="window.print();window.close()" /></body></html>
                `);
                win.document.close();
            }
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn p-4 md:p-10"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white shadow-2xl w-full max-w-6xl h-full flex flex-col overflow-hidden rounded-xl animate-in zoom-in-95 duration-200 border border-slate-200">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-slate-50 border border-slate-100">
                            {getFileIcon(name)}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-800 truncate max-w-sm" title={name}>
                                {name}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Datei-Vorschau</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 group">
                        {canPrint && (
                            <button
                                onClick={handlePrint}
                                className="h-8 px-3 rounded flex items-center gap-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors text-[10px] font-bold uppercase tracking-widest"
                            >
                                <FaPrint className="text-[10px]" />
                                Drucken
                            </button>
                        )}

                        <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="h-8 px-3 rounded flex items-center gap-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors text-[10px] font-bold uppercase tracking-widest"
                        >
                            <FaExternalLinkAlt className="text-[10px]" />
                            <span className="hidden sm:inline">Neuer Tab</span>
                        </button>

                        <button
                            onClick={onDownload}
                            className="h-8 px-3 rounded flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors text-[10px] font-bold uppercase tracking-widest"
                        >
                            <FaDownload className="text-[10px]" />
                            <span className="hidden sm:inline">Laden</span>
                        </button>

                        {onDelete && (
                            <button
                                onClick={() => { onClose(); onDelete(); }}
                                className="h-8 px-3 rounded flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors text-[10px] font-bold uppercase tracking-widest"
                            >
                                <FaTrashAlt className="text-[10px]" />
                                <span className="hidden sm:inline">Löschen</span>
                            </button>
                        )}

                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white overflow-hidden flex flex-col items-center justify-center min-h-0">
                    {isImage && (
                        <div className="w-full h-full flex items-center justify-center p-8 bg-slate-50 relative">
                            {!imgLoaded && (
                                <div className="absolute flex flex-col items-center gap-3 text-slate-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Laden...</span>
                                </div>
                            )}
                            <img
                                ref={imgRef}
                                src={file.url}
                                alt={name}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                onLoad={() => setImgLoaded(true)}
                            />
                        </div>
                    )}

                    {isPDF && (
                        <iframe
                            id="file-preview-iframe"
                            src={file.url}
                            className="w-full h-full border-none block"
                            title={name}
                        />
                    )}

                    {isWord && (
                        <div className="text-center p-10 bg-white rounded-sm shadow-sm border border-slate-200 max-w-md mx-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 text-3xl border border-blue-100">
                                <span className="font-extrabold">W</span>
                            </div>
                            <h3 className="font-medium text-slate-700 mb-2">Word-Dokument</h3>
                            <p className="text-sm text-slate-500 mb-6">Vorschau nicht verfügbar. Bitte herunterladen.</p>
                            <button onClick={onDownload} className="px-6 py-2.5 bg-slate-900 text-white rounded-sm text-xs font-medium hover:bg-slate-800 transition">
                                <FaDownload className="inline mr-2" />Herunterladen
                            </button>
                        </div>
                    )}

                    {!isImage && !isPDF && !isWord && (
                        <div className="text-center p-10 bg-white rounded-sm shadow-sm border border-slate-200 max-w-md mx-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 text-2xl border border-slate-100">
                                <span className="font-extrabold">{name.split('.').pop()?.toUpperCase() || '?'}</span>
                            </div>
                            <h3 className="font-medium text-slate-700 mb-2">Keine Vorschau verfügbar</h3>
                            <p className="text-sm text-slate-500 mb-6">Dieser Dateityp kann nicht im Browser angezeigt werden.</p>
                            <button onClick={onDownload} className="px-6 py-2.5 bg-slate-900 text-white rounded-sm text-xs font-medium hover:bg-slate-800 transition">
                                <FaDownload className="inline mr-2" />Herunterladen
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
