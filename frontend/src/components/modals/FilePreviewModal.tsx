import { FaTimes, FaDownload, FaExternalLinkAlt } from 'react-icons/fa';

interface FilePreviewModalProps {
 isOpen: boolean;
 onClose: () => void;
 file: {
 name: string;
 url: string;
 type?: string;
 } | null;
 onDownload: () => void;
}

const FilePreviewModal = ({ isOpen, onClose, file, onDownload }: FilePreviewModalProps) => {
 if (!isOpen || !file) return null;

 const isImage = file.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
 const isPDF = file.name.match(/\.pdf$/i);
 const isWord = file.name.match(/\.(doc|docx)$/i);

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn">
 <div className="bg-white rounded-sm shadow-sm w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
 {/* Header */}
 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
 <div className="flex flex-col">
 <h2 className="text-sm font-semibold text-slate-800 truncate max-w-md" title={file.name}>
 {file.name}
 </h2>
 <span className="text-xs text-slate-400 font-medium">Vorschau-Modus</span>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={onDownload}
 className="px-4 py-2 bg-slate-50 text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-2 transition"
 >
 <FaDownload /> Herunterladen
 </button>
 <button
 onClick={() => window.open(file.url, '_blank')}
 className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs font-semibold flex items-center gap-2 transition"
 >
 <FaExternalLinkAlt /> Neuer Tab
 </button>
 <button
 onClick={onClose}
 className="p-2 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-red-500 rounded-full transition ml-2"
 >
 <FaTimes className="text-sm" />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center p-4">
 {isImage && (
 <img
 src={file.url}
 alt={file.name}
 className="max-w-full max-h-full object-contain rounded shadow-sm"
 />
 )}

 {isWord && (
 <div className="text-center p-10 bg-white rounded-sm shadow-sm border border-slate-200 max-w-md">
 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 text-3xl border border-blue-100">
 <span className="font-extrabold">W</span>
 </div>
 <h3 className="font-medium text-slate-700 mb-2">Word-Dokument</h3>
 <p className="text-sm text-slate-500 mb-6">Vorschau nicht verfügbar.</p>
 <button
 onClick={onDownload}
 className="px-6 py-2.5 bg-slate-900 text-white rounded-sm text-xs font-medium shadow-sm shadow-brand-200 hover:bg-slate-900 hover:shadow-sm transition transform"
 >
 Datei herunterladen
 </button>
 </div>
 )}

 {isPDF && (
 <iframe
 src={`${file.url}#toolbar=0`}
 className="w-full h-full rounded shadow-sm bg-white"
 title={file.name}
 />
 )}

 {!isImage && !isPDF && !isWord && (
 <div className="text-center p-10 bg-white rounded-sm shadow-sm border border-slate-200 max-w-md">
 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 text-3xl">
 <span className="font-extrabold">{file.name.split('.').pop()?.toUpperCase() || '?'}</span>
 </div>
 <h3 className="font-medium text-slate-700 mb-2">Keine Vorschau verfügbar</h3>
 <p className="text-sm text-slate-500 mb-6">Dieser Dateityp kann nicht im Browser angezeigt werden.</p>
 <button
 onClick={onDownload}
 className="px-6 py-2.5 bg-slate-900 text-white rounded-sm text-xs font-medium shadow-sm shadow-brand-200 hover:bg-slate-900 hover:shadow-sm transition transform"
 >
 Datei herunterladen
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default FilePreviewModal;
