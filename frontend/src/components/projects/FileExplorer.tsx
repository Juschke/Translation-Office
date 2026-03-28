import React, { useState, useMemo, useRef } from 'react';
import {
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive,
    FaDownload, FaTrashAlt, FaSearch, FaCloudUploadAlt, FaCheckCircle,
    FaExclamationCircle, FaArrowRight, FaInbox, FaBookOpen, FaCamera, FaPrint
} from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

interface FileExplorerProps {
    projectData: any;
    setIsUploadModalOpen: (open: boolean) => void;
    handlePreviewFile: (file: any) => Promise<void>;
    handleDownloadFile: (file: any) => Promise<void>;
    setDeleteFileConfirm: (confirm: { isOpen: boolean; fileId: string | null; fileName: string }) => void;
    toggleFileType: (file: any) => Promise<void>;
    onRenameFile: (file: any, newName: string) => Promise<void>;
    onMoveFile: (file: any, newType: string) => Promise<void>;
    formatFileSize: (bytes: any) => string;
    onUpload: (files: any[], onProgress: (id: string, progress: number) => void) => Promise<void>;
}

type FileType = 'source' | 'target' | 'reference';

const FILE_TYPE_CONFIG: Record<FileType, { icon: React.ReactNode; bg: string; label: string }> = {
    source: {
        icon: <FaInbox className="text-sm" />,
        bg: 'bg-brand-primary/5 text-brand-primary border-brand-primary/10',
        label: 'Eingangsdokumente',
    },
    target: {
        icon: <FaArrowRight className="text-sm" />,
        bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        label: 'Zieldokumente',
    },
    reference: {
        icon: <FaBookOpen className="text-sm" />,
        bg: 'bg-blue-50 text-blue-600 border-blue-100',
        label: 'Referenzdokumente',
    },
};

const FileExplorer: React.FC<FileExplorerProps> = ({
    projectData,
    handlePreviewFile,
    handleDownloadFile,
    setDeleteFileConfirm,
    formatFileSize,
    onUpload,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadQueue, setUploadQueue] = useState<any[]>([]);
    const [showScanHint, setShowScanHint] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scanInputRef = useRef<HTMLInputElement>(null);

    const files = projectData.files || [];

    const getFileIcon = (fileName: string) => {
        const lowerName = (fileName || '').toLowerCase();
        if (lowerName.endsWith('.pdf')) return <FaFilePdf className="text-red-500" />;
        if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FaFileWord className="text-blue-500" />;
        if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return <FaFileExcel className="text-emerald-500" />;
        if (['.jpg', '.png', '.jpeg', '.gif', '.svg', '.webp'].some(ext => lowerName.endsWith(ext))) return <FaFileImage className="text-purple-500" />;
        if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return <FaFileArchive className="text-orange-500" />;
        return <FaFileAlt className="text-slate-400" />;
    };

    const sourceFiles = useMemo(() => files.filter((f: any) =>
        f.type === 'source' && (f.name || f.original_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [files, searchQuery]);

    const targetFiles = useMemo(() => files.filter((f: any) =>
        f.type === 'target' && (f.name || f.original_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [files, searchQuery]);

    const referenceFiles = useMemo(() => files.filter((f: any) =>
        f.type === 'reference' && (f.name || f.original_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [files, searchQuery]);

    const handleFilesUpload = async (filesToUpload: FileList | File[], targetType: FileType = 'source') => {
        const newFiles = Array.from(filesToUpload).map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'uploading' as const,
            type: targetType,
        }));

        setUploadQueue(prev => [...newFiles, ...prev]);

        try {
            await onUpload(newFiles, (id, progress) => {
                setUploadQueue(prev => prev.map(f =>
                    f.id === id ? { ...f, progress, status: progress === 100 ? 'saving' : 'uploading' } : f
                ));
            });
            setUploadQueue(prev => prev.map(f =>
                newFiles.some(nf => nf.id === f.id) ? { ...f, status: 'saved' as const } : f
            ));
            setTimeout(() => {
                setUploadQueue(prev => prev.filter(f => !newFiles.some(nf => nf.id === f.id)));
            }, 3000);
        } catch {
            setUploadQueue(prev => prev.map(f =>
                newFiles.some(nf => nf.id === f.id) ? { ...f, status: 'error' as const } : f
            ));
            toast.error('Hochladen fehlgeschlagen');
        }
    };

    const handleScanClick = () => {
        // On mobile: capture="environment" opens camera directly
        // On desktop: opens file picker + shows scan hint
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) setShowScanHint(true);
        scanInputRef.current?.click();
    };

    const FileTable = ({ files, type }: { files: any[]; type: FileType }) => {
        const cfg = FILE_TYPE_CONFIG[type];
        return (
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden flex flex-col shadow-sm">
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center border', cfg.bg)}>
                            {cfg.icon}
                        </div>
                        <div>
                            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest leading-none">{cfg.label}</h3>
                            <span className="text-[10px] text-slate-400 font-medium">Insgesamt {files.length} Dokumente</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            id={`upload-${type}`}
                            onChange={(e) => e.target.files && handleFilesUpload(e.target.files, type)}
                        />
                        <label
                            htmlFor={`upload-${type}`}
                            className="cursor-pointer bg-white border border-slate-200 hover:border-slate-300 text-slate-600 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
                        >
                            <FaCloudUploadAlt /> Hinzufügen
                        </label>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto min-h-[120px]">
                    {files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 text-slate-300 gap-3 opacity-60">
                            <FaFileAlt className="text-4xl opacity-10" />
                            <p className="text-[11px] font-bold uppercase tracking-widest">Keine {cfg.label}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#fcfdff] text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Dateiname</th>
                                    <th className="px-6 py-3">Größe & Datum</th>
                                    <th className="px-6 py-3 text-right pr-6">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {files.map((file: any) => {
                                    const name = file.name || file.original_name || 'Unbenannt';
                                    return (
                                        <tr key={file.id} className="group hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-xl shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        {getFileIcon(name)}
                                                    </div>
                                                    <span
                                                        className="text-[11.5px] font-bold text-slate-700 truncate group-hover:text-brand-primary cursor-pointer transition-colors"
                                                        onClick={() => handlePreviewFile(file)}
                                                    >
                                                        {name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-500 font-mono tracking-tighter">
                                                        {formatFileSize(file.size || 0)}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-medium">
                                                        {new Date(file.created_at || Date.now()).toLocaleDateString('de-DE')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:text-brand-primary"
                                                        onClick={() => handleDownloadFile(file)}
                                                        title="Herunterladen"
                                                    >
                                                        <FaDownload className="text-xs" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:text-red-500"
                                                        onClick={() => setDeleteFileConfirm({ isOpen: true, fileId: file.id, fileName: name })}
                                                        title="Löschen"
                                                    >
                                                        <FaTrashAlt className="text-xs" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            className="space-y-6 animate-fadeIn"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) handleFilesUpload(e.dataTransfer.files); }}
        >
            {/* Toolbar */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
                    <input
                        type="search"
                        placeholder="Alle Dokumente durchsuchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 block w-full pl-10 pr-4 bg-slate-50 border-transparent text-[11px] rounded-sm focus:bg-white focus:ring-1 focus:ring-brand-primary transition-all border border-slate-100 shadow-inner"
                    />
                </div>

                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-sm shrink-0 border border-slate-200">
                    {/* Upload button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white hover:bg-slate-50 text-brand-primary border border-slate-200 shadow-sm text-[10px] font-bold tracking-widest uppercase px-6 h-9 rounded-sm"
                    >
                        <FaCloudUploadAlt className="mr-2" /> Hochladen
                    </Button>
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
                        ref={fileInputRef}
                    />

                    {/* Scan / Camera button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleScanClick}
                        className="hover:bg-slate-200 text-slate-500 text-[10px] font-bold tracking-widest uppercase px-4 h-9 rounded-sm gap-2"
                        title="Dokument scannen oder mit Kamera aufnehmen"
                    >
                        <FaCamera className="shrink-0" />
                        <span className="hidden sm:inline">Scannen</span>
                    </Button>
                    {/* Hidden scan input — capture="environment" opens camera on mobile */}
                    <input
                        ref={scanInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            setShowScanHint(false);
                            if (e.target.files) handleFilesUpload(e.target.files, 'source');
                            // Reset so same file can be re-selected
                            e.target.value = '';
                        }}
                    />
                </div>
            </div>

            {/* Desktop scan hint */}
            {showScanHint && (
                <div className="bg-blue-50 border border-blue-200 rounded-sm px-6 py-4 flex items-start gap-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="w-9 h-9 rounded-sm bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                        <FaPrint className="text-blue-600 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1">Drucker / Scanner</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Scannen Sie das Dokument an Ihrem Drucker und speichern Sie es als <strong>PDF oder JPEG</strong>.
                            Wählen Sie dann die gespeicherte Datei im geöffneten Datei-Dialog aus.
                            Auf Mobilgeräten öffnet sich die Kamera direkt.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowScanHint(false)}
                        className="text-blue-400 hover:text-blue-600 text-xs font-bold shrink-0 mt-0.5"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Active Uploads */}
            {uploadQueue.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></div>
                            Upload-Status ({uploadQueue.length})
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {uploadQueue.map(f => (
                            <div key={f.id} className="bg-slate-50/50 p-3 rounded-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2 truncate">
                                        <div className="text-xs shrink-0">{getFileIcon(f.name)}</div>
                                        <span className="text-[10px] font-bold text-slate-700 truncate">{f.name}</span>
                                    </div>
                                    {f.status === 'saved' ? <FaCheckCircle className="text-emerald-500 text-xs shrink-0" /> :
                                        f.status === 'error' ? <FaExclamationCircle className="text-red-500 text-xs shrink-0" /> :
                                            <span className="text-[9px] font-mono text-slate-400 shrink-0">{f.progress}%</span>}
                                </div>
                                <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={clsx(
                                            'h-full transition-all duration-300',
                                            f.status === 'error' ? 'bg-red-400' :
                                                f.status === 'saved' ? 'bg-emerald-400' : 'bg-brand-primary'
                                        )}
                                        style={{ width: `${f.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* File Tables */}
            <div className="space-y-6">
                <FileTable files={sourceFiles} type="source" />
                <FileTable files={referenceFiles} type="reference" />
                <FileTable files={targetFiles} type="target" />
            </div>

            {/* Drag Overlay */}
            {isDragging && (
                <div className="fixed inset-0 bg-brand-primary/10 border-4 border-dashed border-brand-primary z-[9999] flex flex-col items-center justify-center backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-full shadow-2xl border border-brand-primary/20 mb-6 scale-110">
                        <FaCloudUploadAlt className="text-6xl text-brand-primary" />
                    </div>
                    <div className="text-2xl font-black text-brand-primary uppercase tracking-[0.2em]">Dateien ablegen</div>
                    <p className="text-sm text-brand-primary/60 mt-2 font-bold uppercase">Upload startet sofort</p>
                </div>
            )}
        </div>
    );
};

export default FileExplorer;
