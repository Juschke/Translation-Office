import React, { useState, useMemo, useRef } from 'react';
import {
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive,
    FaDownload, FaTrashAlt, FaSearch, FaCloudUploadAlt, FaCheckCircle,
    FaExclamationCircle, FaArrowRight, FaInbox, FaBookOpen, FaCamera, FaPrint,
    FaListUl, FaTh, FaEye,
} from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';
import KPICard from '../common/KPICard';
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
    onBulkMove: (ids: string[], newType: string) => Promise<void>;
    onBulkDownloadZip: (ids: string[]) => Promise<void>;
    formatFileSize: (bytes: any) => string;
    onUpload: (files: any[], onProgress: (id: string, progress: number) => void) => Promise<void>;
}

type FileType = 'source' | 'target' | 'reference' | 'delivery';
type ActiveFilter = 'all' | FileType;
type ViewMode = 'list' | 'grid';

const FILE_TYPE_CONFIG: Record<FileType, { icon: React.ReactNode; bg: string; label: string; short: string }> = {
    source: {
        icon: <FaInbox className="text-sm" />,
        bg: 'bg-brand-primary/5 text-brand-primary border-brand-primary/10',
        label: 'Eingangsdokumente',
        short: 'Eingang',
    },
    target: {
        icon: <FaArrowRight className="text-sm" />,
        bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        label: 'Zieldokumente',
        short: 'Ziel',
    },
    reference: {
        icon: <FaBookOpen className="text-sm" />,
        bg: 'bg-blue-50 text-blue-600 border-blue-100',
        label: 'Referenzdokumente',
        short: 'Referenz',
    },
    delivery: {
        icon: <FaCheckCircle className="text-sm" />,
        bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        label: 'Lieferdokumente',
        short: 'Lieferung',
    },
};

const FILTERS: { value: ActiveFilter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'source', label: 'Eingangsdokumente' },
    { value: 'target', label: 'Zieldokumente' },
    { value: 'reference', label: 'Referenzdokumente' },
    { value: 'delivery', label: 'Lieferung' },
];

const FileExplorer: React.FC<FileExplorerProps> = ({
    projectData,
    handlePreviewFile,
    handleDownloadFile,
    setDeleteFileConfirm,
    onBulkMove,
    onBulkDownloadZip,
    formatFileSize,
    onUpload,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadQueue, setUploadQueue] = useState<any[]>([]);
    const [showScanHint, setShowScanHint] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
    const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scanInputRef = useRef<HTMLInputElement>(null);

    const files = projectData.files || [];

    const getFileIcon = (fileName: string, large = false) => {
        const lowerName = (fileName || '').toLowerCase();
        const cls = large ? 'text-4xl' : 'text-xl';
        if (lowerName.endsWith('.pdf')) return <FaFilePdf className={`${cls} text-red-500`} />;
        if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FaFileWord className={`${cls} text-blue-500`} />;
        if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return <FaFileExcel className={`${cls} text-emerald-500`} />;
        if (['.jpg', '.png', '.jpeg', '.gif', '.svg', '.webp'].some(ext => lowerName.endsWith(ext))) return <FaFileImage className={`${cls} text-purple-500`} />;
        if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return <FaFileArchive className={`${cls} text-orange-500`} />;
        return <FaFileAlt className={`${cls} text-slate-400`} />;
    };

    const allFilteredFiles = useMemo(() => files.filter((f: any) => {
        const matchesType = activeFilter === 'all' || f.type === activeFilter;
        const matchesSearch = (f.name || f.original_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    }), [files, activeFilter, searchQuery]);

    const stats = useMemo(() => ({
        totalCount: files.length,
        totalSize: files.reduce((acc: number, f: any) => acc + (f.size || 0), 0),
        countByType: {
            source: files.filter((f: any) => f.type === 'source').length,
            target: files.filter((f: any) => f.type === 'target').length,
            reference: files.filter((f: any) => f.type === 'reference').length,
            delivery: files.filter((f: any) => f.type === 'delivery').length,
        },
    }), [files]);

    const filterCount = (value: ActiveFilter) => value === 'all' ? stats.totalCount : stats.countByType[value];

    // Multi-select helpers
    const allFilteredIds = allFilteredFiles.map((f: any) => f.id as string);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));
    const someSelected = allFilteredIds.some(id => selectedIds.has(id));

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                allFilteredIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            setSelectedIds(prev => new Set([...prev, ...allFilteredIds]));
        }
    };

    const selectedFiles = allFilteredFiles.filter((f: any) => selectedIds.has(f.id));

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
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) setShowScanHint(true);
        scanInputRef.current?.click();
    };

    const openTypePicker = (files: FileList | File[]) => setPendingFiles(Array.from(files));

    const confirmUpload = (type: FileType) => {
        if (pendingFiles) handleFilesUpload(pendingFiles, type);
        setPendingFiles(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div
            className="space-y-5 animate-fadeIn pb-10"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) openTypePicker(e.dataTransfer.files); }}
        >
            {/* KPI Cards — full size like main pages */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KPICard
                    label="Dokumente gesamt"
                    value={stats.totalCount}
                    icon={<FaFileAlt />}
                    iconColor="text-slate-500"
                    iconBg="bg-slate-100"
                />
                <KPICard
                    label="Gesamtgröße"
                    value={formatFileSize(stats.totalSize)}
                    icon={<FaCloudUploadAlt />}
                    iconColor="text-slate-500"
                    iconBg="bg-slate-100"
                />
                <KPICard
                    label="Eingangsdokumente"
                    value={stats.countByType.source}
                    icon={<FaInbox />}
                    iconColor="text-brand-primary"
                    iconBg="bg-brand-primary/10"
                />
                <KPICard
                    label="Zieldokumente"
                    value={stats.countByType.target}
                    icon={<FaArrowRight />}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-50"
                />
            </div>

            {/* Scan hint */}
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
                    <button onClick={() => setShowScanHint(false)} className="text-blue-400 hover:text-blue-600 text-xs font-bold shrink-0 mt-0.5">✕</button>
                </div>
            )}

            {/* Upload queue */}
            {uploadQueue.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
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
                                        className={clsx('h-full transition-all duration-300',
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

            {/* Main table card */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">

                {/* Integrated toolbar inside the card */}
                <div className="border-b border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
                    {/* Top Row: Search & Actions */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
                            <input
                                type="search"
                                placeholder="Dokumente durchsuchen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 block w-full pl-9 pr-4 bg-white border border-slate-200 text-[11px] rounded-sm focus:ring-1 focus:ring-brand-primary transition-all shadow-inner"
                            />
                        </div>

                        {/* Actions: Upload / Scan / View toggle */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 h-9 px-4 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-brand-primary/90 transition-all shadow-sm"
                            >
                                <FaCloudUploadAlt /> Hochladen
                            </button>
                            <input type="file" multiple className="hidden" onChange={(e) => e.target.files?.length && openTypePicker(e.target.files)} ref={fileInputRef} />

                            <button
                                onClick={handleScanClick}
                                className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-sm hover:bg-slate-50 transition-all"
                                title="Scannen"
                            >
                                <FaCamera className="text-sm" />
                            </button>
                            <input ref={scanInputRef} type="file" accept="image/*,application/pdf" capture="environment" multiple className="hidden"
                                onChange={(e) => { setShowScanHint(false); if (e.target.files?.length) openTypePicker(e.target.files); e.target.value = ''; }}
                            />

                            <div className="flex items-center gap-0.5 bg-slate-200/50 p-0.5 rounded-sm border border-slate-200">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={clsx('h-8 w-8 flex items-center justify-center rounded-sm transition-all text-xs',
                                        viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
                                    )}
                                    title="Listenansicht"
                                ><FaListUl /></button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={clsx('h-8 w-8 flex items-center justify-center rounded-sm transition-all text-xs',
                                        viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
                                    )}
                                    title="Kachelansicht"
                                ><FaTh /></button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Filter Badges */}
                    <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white/30">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2 shrink-0">Filter:</span>
                        <div className="flex items-center gap-1.5">
                            {FILTERS.map(({ value, label }) => {
                                const count = filterCount(value);
                                const isActive = activeFilter === value;
                                return (
                                    <button
                                        key={value}
                                        onClick={() => setActiveFilter(value)}
                                        className={clsx(
                                            'px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all border whitespace-nowrap',
                                            isActive
                                                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                        )}
                                    >
                                        {label}
                                        <span className={clsx('rounded-sm px-1.5 py-0.5 text-[8px] font-mono leading-none',
                                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 font-bold'
                                        )}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bulk action bar */}
                {someSelected && (
                    <div className="px-4 py-2.5 bg-brand-primary/[0.03] border-b border-brand-primary/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 animate-in slide-in-from-top-2 duration-150">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                                {selectedFiles.length} ausgewählt
                            </span>
                            <div className="w-px h-4 bg-brand-primary/20" />
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">Verschieben nach:</span>
                                {(['source', 'target', 'reference', 'delivery'] as FileType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            onBulkMove(Array.from(selectedIds), type);
                                            setSelectedIds(new Set());
                                        }}
                                        className="px-2 py-1 rounded-sm text-[8px] font-bold uppercase tracking-widest bg-white border border-slate-200 text-slate-500 hover:border-brand-primary hover:text-brand-primary hover:shadow-sm transition-all"
                                    >
                                        {FILE_TYPE_CONFIG[type].short}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:ml-auto">
                            {selectedFiles.length > 1 ? (
                                <button
                                    onClick={() => onBulkDownloadZip(Array.from(selectedIds))}
                                    className="h-8 px-3 rounded flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors text-[9px] font-bold uppercase tracking-widest"
                                >
                                    <FaDownload className="text-[8px]" /> ZIP herunterladen
                                </button>
                            ) : (
                                <button
                                    onClick={() => { handleDownloadFile(selectedFiles[0]); }}
                                    className="h-8 px-3 rounded flex items-center gap-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors text-[9px] font-bold uppercase tracking-widest"
                                >
                                    <FaDownload className="text-[8px]" /> Herunterladen
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    if (selectedFiles.length === 1) {
                                        setDeleteFileConfirm({ isOpen: true, fileId: selectedFiles[0].id, fileName: selectedFiles[0].name || selectedFiles[0].original_name });
                                    } else {
                                        toast('Mehrfach-Löschen: Bitte einzeln löschen.', { icon: 'ℹ️' });
                                    }
                                    setSelectedIds(new Set());
                                }}
                                className="h-8 px-3 rounded flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors text-[9px] font-bold uppercase tracking-widest"
                            >
                                <FaTrashAlt className="text-[8px]" /> Löschen
                            </button>

                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-[9px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1.5 uppercase tracking-widest"
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {allFilteredFiles.length === 0 && (
                    <div
                        className="flex flex-col items-center justify-center py-20 gap-5 cursor-pointer hover:bg-slate-50/50 transition-all"
                        onClick={() => { if (!searchQuery) fileInputRef.current?.click(); }}
                    >
                        <FaCloudUploadAlt className="text-5xl text-slate-200" />
                        <div className="text-center">
                            <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest">
                                {searchQuery ? `Keine Ergebnisse für «${searchQuery}»` : 'Keine Dokumente vorhanden'}
                            </p>
                            {!searchQuery && <p className="text-xs text-slate-300 mt-1">Dateien hierher ziehen oder klicken zum Hochladen</p>}
                        </div>
                        {!searchQuery && (
                            <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase tracking-wider"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            >
                                <FaCloudUploadAlt className="mr-2" /> Hochladen
                            </Button>
                        )}
                    </div>
                )}

                {/* Grid view */}
                {viewMode === 'grid' && allFilteredFiles.length > 0 && (
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {allFilteredFiles.map((file: any) => {
                            const name = file.name || file.original_name || 'Unbenannt';
                            const cfg = FILE_TYPE_CONFIG[file.type as FileType] ?? FILE_TYPE_CONFIG.source;
                            const isSelected = selectedIds.has(file.id);
                            return (
                                <div
                                    key={file.id}
                                    className={clsx(
                                        'group bg-white border rounded-sm p-4 flex flex-col items-center gap-3 cursor-pointer hover:shadow-sm transition-all relative',
                                        isSelected ? 'border-brand-primary bg-brand-primary/[0.02]' : 'border-slate-200 hover:border-brand-primary/30'
                                    )}
                                    onClick={() => handlePreviewFile(file)}
                                    title={name}
                                >
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-2 left-2 w-3.5 h-3.5 accent-brand-primary cursor-pointer"
                                    />
                                    {/* Type badge */}
                                    <span className={clsx('absolute top-2 right-2 px-1.5 py-0.5 rounded-sm text-[7px] font-black border', cfg.bg)}>
                                        {cfg.short.charAt(0)}
                                    </span>
                                    {/* Actions — always visible */}
                                    <div className="absolute bottom-1.5 right-1.5 flex gap-0.5">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-brand-primary bg-white/90 border border-slate-100"
                                            onClick={(e) => { e.stopPropagation(); handleDownloadFile(file); }} title="Herunterladen">
                                            <FaDownload className="text-[9px]" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500 bg-white/90 border border-slate-100"
                                            onClick={(e) => { e.stopPropagation(); setDeleteFileConfirm({ isOpen: true, fileId: file.id, fileName: name }); }} title="Löschen">
                                            <FaTrashAlt className="text-[9px]" />
                                        </Button>
                                    </div>
                                    <div className="mt-4 opacity-80">
                                        {getFileIcon(name, true)}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-700 text-center line-clamp-2 break-all w-full leading-tight">
                                        {name}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-mono -mt-1">
                                        {formatFileSize(file.size || 0)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* List view */}
                {viewMode === 'list' && allFilteredFiles.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#fcfdff] text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="pl-4 pr-2 py-3 w-8">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                            onChange={toggleSelectAll}
                                            className="w-3.5 h-3.5 accent-brand-primary cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-3 py-3 w-28">Typ</th>
                                    <th className="px-3 py-3">Dateiname</th>
                                    <th className="px-3 py-3 w-24">Größe</th>
                                    <th className="px-3 py-3 w-40">Hochgeladen am</th>
                                    <th className="px-3 py-3 w-36">Von</th>
                                    <th className="px-3 py-3 pr-4 w-28">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allFilteredFiles.map((file: any) => {
                                    const name = file.name || file.original_name || 'Unbenannt';
                                    const cfg = FILE_TYPE_CONFIG[file.type as FileType] ?? FILE_TYPE_CONFIG.source;
                                    const isSelected = selectedIds.has(file.id);
                                    return (
                                        <tr key={file.id} className={clsx('transition-colors', isSelected ? 'bg-brand-primary/[0.03]' : 'hover:bg-slate-50/70')}>
                                            <td className="pl-4 pr-2 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(file.id)}
                                                    className="w-3.5 h-3.5 accent-brand-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={clsx('px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase border', cfg.bg)}>
                                                    {cfg.short}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="shrink-0">{getFileIcon(name)}</div>
                                                    <span
                                                        className="text-[11.5px] font-bold text-slate-700 truncate hover:text-brand-primary cursor-pointer transition-colors max-w-xs"
                                                        onClick={() => handlePreviewFile(file)}
                                                        title={name}
                                                    >
                                                        {name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="text-[10px] text-slate-500 font-mono tracking-tighter whitespace-nowrap">
                                                    {formatFileSize(file.size || 0)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                                    {new Date(file.created_at || Date.now()).toLocaleString('de-DE', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                                    {file.uploader?.name ?? <span className="text-slate-300">—</span>}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 pr-4">
                                                {/* Actions always visible */}
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-brand-primary"
                                                        onClick={() => handlePreviewFile(file)} title="Vorschau">
                                                        <FaEye className="text-xs" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-brand-primary"
                                                        onClick={() => handleDownloadFile(file)} title="Herunterladen">
                                                        <FaDownload className="text-xs" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500"
                                                        onClick={() => setDeleteFileConfirm({ isOpen: true, fileId: file.id, fileName: name })} title="Löschen">
                                                        <FaTrashAlt className="text-xs" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Type picker modal */}
            {pendingFiles && (
                <div className="fixed inset-0 bg-black/30 z-[9998] flex items-center justify-center backdrop-blur-[2px] animate-in fade-in duration-150">
                    <div className="bg-white rounded-sm border border-slate-200 shadow-2xl w-full max-w-sm mx-4">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Dokumenttyp wählen</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {pendingFiles.length === 1 ? `«${pendingFiles[0].name}»` : `${pendingFiles.length} Dateien`}
                            </p>
                        </div>
                        <div className="p-4 flex flex-col gap-2">
                            {(['source', 'target', 'reference'] as FileType[]).map((type) => {
                                const cfg = FILE_TYPE_CONFIG[type];
                                return (
                                    <button key={type} onClick={() => confirmUpload(type)}
                                        className={clsx('flex items-center gap-4 px-4 py-3.5 rounded-sm border text-left transition-all hover:shadow-sm', cfg.bg)}>
                                        <span className="text-base shrink-0">{cfg.icon}</span>
                                        <p className="text-[11px] font-bold">{cfg.label}</p>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="px-4 pb-4">
                            <button
                                onClick={() => { setPendingFiles(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider py-2"
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Drag overlay */}
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
