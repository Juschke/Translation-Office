import { useRef, useState } from 'react';
import { Button } from '../ui/button';
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fadeIn md:p-10"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                            {getFileIcon(name)}
                        </div>
                        <div className="min-w-0">
                            <h2 className="max-w-sm truncate text-sm font-bold text-slate-800" title={name}>
                                {name}
                            </h2>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Datei-Vorschau</p>
                        </div>
                    </div>

                    <div className="group flex shrink-0 items-center gap-2">
                        {canPrint && (
                            <Button onClick={handlePrint} variant="secondary" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest">
                                <FaPrint className="text-[10px]" />
                                Drucken
                            </Button>
                        )}

                        <Button onClick={() => window.open(file.url, '_blank')} variant="secondary" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest">
                            <FaExternalLinkAlt className="text-[10px]" />
                            <span className="hidden sm:inline">Neuer Tab</span>
                        </Button>

                        <Button onClick={onDownload} variant="default" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest">
                            <FaDownload className="text-[10px]" />
                            <span className="hidden sm:inline">Laden</span>
                        </Button>

                        {onDelete && (
                            <Button onClick={() => { onClose(); onDelete(); }} variant="destructive" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest">
                                <FaTrashAlt className="text-[10px]" />
                                <span className="hidden sm:inline">Löschen</span>
                            </Button>
                        )}

                        <div className="mx-1 h-6 w-px bg-slate-200" />

                        <Button onClick={onClose} variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600">
                            <FaTimes />
                        </Button>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-white">
                    {isImage && (
                        <div className="relative flex h-full w-full items-center justify-center bg-slate-50 p-8">
                            {!imgLoaded && (
                                <div className="absolute flex flex-col items-center gap-3 text-slate-400">
                                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Laden...</span>
                                </div>
                            )}
                            <img
                                ref={imgRef}
                                src={file.url}
                                alt={name}
                                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                                onLoad={() => setImgLoaded(true)}
                            />
                        </div>
                    )}

                    {isPDF && (
                        <iframe
                            id="file-preview-iframe"
                            src={file.url}
                            className="block h-full w-full border-none"
                            title={name}
                        />
                    )}

                    {isWord && (
                        <div className="mx-4 max-w-md rounded-sm border border-slate-200 bg-white p-10 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-3xl text-blue-500">
                                <span className="font-extrabold">W</span>
                            </div>
                            <h3 className="mb-2 font-medium text-slate-700">Word-Dokument</h3>
                            <p className="mb-6 text-sm text-slate-500">Vorschau nicht verfügbar. Bitte herunterladen.</p>
                            <Button onClick={onDownload} variant="default" className="px-6 text-xs font-medium">
                                <FaDownload className="mr-2 inline" />Herunterladen
                            </Button>
                        </div>
                    )}

                    {!isImage && !isPDF && !isWord && (
                        <div className="mx-4 max-w-md rounded-sm border border-slate-200 bg-white p-10 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-2xl text-slate-300">
                                <span className="font-extrabold">{name.split('.').pop()?.toUpperCase() || '?'}</span>
                            </div>
                            <h3 className="mb-2 font-medium text-slate-700">Keine Vorschau verfügbar</h3>
                            <p className="mb-6 text-sm text-slate-500">Dieser Dateityp kann nicht im Browser angezeigt werden.</p>
                            <Button onClick={onDownload} variant="default" className="px-6 text-xs font-medium">
                                <FaDownload className="mr-2 inline" />Herunterladen
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
