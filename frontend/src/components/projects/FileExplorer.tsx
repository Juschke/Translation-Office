import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive,
    FaTrashAlt, FaSearch, FaCloudUploadAlt, FaCheckCircle,
    FaExclamationCircle, FaArrowRight, FaInbox, FaBookOpen, FaPrint,
    FaListUl, FaTh, FaFolderOpen, FaChevronRight, FaTimes, FaCheck,
    FaChevronDown, FaDownload, FaEnvelope
} from 'react-icons/fa';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import SearchableSelect from '../common/SearchableSelect';
import ConfirmModal from '../modals/ConfirmModal';
import RenameFileModal from '../modals/RenameFileModal';
import { Button } from '../ui/button';

interface FileExplorerProps {
    projectData: any;
    setIsUploadModalOpen: (open: boolean) => void;
    handlePreviewFile: (file: any) => Promise<void>;
    handleDownloadFile: (file: any) => Promise<void>;
    toggleFileType: (file: any) => Promise<void>;
    onRenameFile: (file: any, newName: string) => Promise<void>;
    onMoveFile: (file: any, newType: string) => Promise<void>;
    onBulkMove: (ids: string[], newType: string) => Promise<void>;
    onBulkDownloadZip: (ids: string[]) => Promise<void>;
    onBulkDelete: (ids: string[]) => Promise<void>;
    onBulkRename: (ids: string[], prefix: string, suffix: string) => Promise<void>;
    onBulkEmail: (ids: string[]) => void;
    formatFileSize: (bytes: any) => string;
    onUpload: (files: any[], onProgress: (id: string, progress: number) => void) => Promise<void>;
}

type FileType = 'source' | 'target' | 'reference' | 'delivery';
type ActiveFilter = 'all' | FileType;
type ViewMode = 'list' | 'grid';

const FILE_TYPE_CONFIG: Record<FileType, { icon: React.ReactNode; bg: string; label: string; short: string; labelKey: string }> = {
    source: {
        icon: <FaInbox className="text-sm" />,
        bg: 'bg-brand-primary/5 text-brand-primary border-brand-primary/10',
        labelKey: 'files.types.source',
        label: 'Eingang',
        short: 'Eingang',
    },
    target: {
        icon: <FaArrowRight className="text-sm" />,
        bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        labelKey: 'files.types.target',
        label: 'Ziel',
        short: 'Ziel',
    },
    reference: {
        icon: <FaBookOpen className="text-sm" />,
        bg: 'bg-blue-50 text-blue-600 border-blue-100',
        labelKey: 'files.types.reference',
        label: 'Referenz',
        short: 'Referenz',
    },
    delivery: {
        icon: <FaCheckCircle className="text-sm" />,
        bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        labelKey: 'files.types.delivery',
        label: 'Lieferung',
        short: 'Lieferung',
    },
};

const FILTERS: { value: ActiveFilter; labelKey: string; defaultLabel: string }[] = [
    { value: 'all', labelKey: 'common.all', defaultLabel: 'Alle' },
    { value: 'source', labelKey: 'files.types.source', defaultLabel: 'Eingang' },
    { value: 'target', labelKey: 'files.types.target', defaultLabel: 'Ziel' },
    { value: 'reference', labelKey: 'files.types.reference', defaultLabel: 'Referenz' },
    { value: 'delivery', labelKey: 'files.types.delivery', defaultLabel: 'Lieferung' },
];

const FileExplorer: React.FC<FileExplorerProps> = ({
    projectData,
    setIsUploadModalOpen,
    handlePreviewFile,
    handleDownloadFile,
    toggleFileType,
    onRenameFile,
    onMoveFile,
    onBulkMove,
    onBulkDownloadZip,
    onBulkDelete,
    onBulkRename,
    onBulkEmail,
    formatFileSize,
    onUpload,
}) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadQueue, setUploadQueue] = useState<any[]>([]);
    const [preparedFiles, setPreparedFiles] = useState<{ file: File; type: FileType }[]>([]);
    const [showScanHint, setShowScanHint] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
    const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
    const [isMoveSubmenuOpen, setIsMoveSubmenuOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [renameMode, setRenameMode] = useState<'single' | 'bulk'>('single');
    const [fileToRename, setFileToRename] = useState<any | null>(null);
    const bulkActionsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bulkActionsRef.current && !bulkActionsRef.current.contains(e.target as Node)) {
                setIsBulkActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isBulkActionsOpen]);

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
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id: string) => selectedIds.has(id));
    const someSelected = allFilteredIds.some((id: string) => selectedIds.has(id));

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
                allFilteredIds.forEach((id: string) => next.delete(id));
                return next;
            });
        } else {
            setSelectedIds(prev => new Set([...prev, ...allFilteredIds]));
        }
    };

    const selectedFiles = allFilteredFiles.filter((f: any) => selectedIds.has(f.id));

    const handleFilesUpload = async (queue: { file: File; type: FileType }[]) => {
        const newFiles = queue.map(item => ({
            id: Math.random().toString(36).substring(7),
            file: item.file,
            name: item.file.name,
            size: item.file.size,
            progress: 0,
            status: 'uploading' as const,
            type: item.type,
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

    const handlePrepareFiles = (files: FileList | File[]) => {
        const newItems = Array.from(files).map(f => ({ file: f, type: 'source' as FileType }));
        setPreparedFiles(prev => [...prev, ...newItems]);
    };

    const removePreparedFile = (index: number) => {
        setPreparedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadPreparedFiles = () => {
        if (preparedFiles.length > 0) {
            handleFilesUpload(preparedFiles);
            setPreparedFiles([]);
        }
    };

    const updatePreparedFileType = (index: number, type: FileType) => {
        setPreparedFiles(prev => prev.map((item, i) => i === index ? { ...item, type } : item));
    };

    const updateAllPreparedFilesType = (type: FileType) => {
        setPreparedFiles(prev => prev.map(item => ({ ...item, type })));
    };


    const confirmUpload = (type: FileType) => {
        if (pendingFiles) handleFilesUpload(pendingFiles.map(f => ({ file: f, type })));
        setPendingFiles(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const totalPreparedSize = preparedFiles.reduce((acc, f) => acc + f.file.size, 0);

    return (
        <div
            className="space-y-6 animate-fadeIn pb-10"
        >
            {/* ── Upload Preparation Section ── */}
            <div
                className={clsx(
                    'rounded-sm overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-200',
                    isDragging
                        ? 'bg-brand-primary/5 border-2 border-dashed border-brand-primary'
                        : 'bg-[#f8f9fa] border border-[#D1D9D8]'
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) handlePrepareFiles(e.dataTransfer.files); }}
            >
                <div className="px-5 py-3 border-b border-[#D1D9D8] bg-white">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        {t('files.uploadFiles', 'Dateien hochladen')}
                    </h3>
                </div>

                <div className="min-h-[120px] bg-white divide-y divide-[#eee]">
                    {preparedFiles.length === 0 ? (
                        <div className="h-[120px] flex flex-col items-center justify-center text-slate-300 gap-2">
                            <FaInbox className="text-2xl" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">{t('files.noFilesSelected', 'Keine Dateien ausgewählt')}</span>
                        </div>
                    ) : (
                        preparedFiles.map((item, idx) => (
                            <div key={idx} className="px-5 py-2.5 flex items-center justify-between group hover:bg-[#fcfdfe]">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-[10px] font-mono text-slate-400">{(idx + 1).toString().padStart(2, '0')}.</span>
                                    <div className="shrink-0">{getFileIcon(item.file.name)}</div>
                                    <span className="text-xs font-bold text-slate-700 truncate">{item.file.name}</span>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{t('common.category', 'Kategorie')}:</span>
                                        <SearchableSelect
                                            className="w-32 h-7 text-[10px]"
                                            options={[
                                                { value: 'source', label: t('files.types.source', 'Eingang') },
                                                { value: 'target', label: t('files.types.target', 'Ziel') },
                                                { value: 'reference', label: t('files.types.reference', 'Referenz') },
                                                { value: 'delivery', label: t('files.types.delivery', 'Lieferung') },
                                            ]}
                                            value={item.type}
                                            onChange={(val) => updatePreparedFileType(idx, val as FileType)}
                                        />
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400 font-bold min-w-[60px] text-right">{formatFileSize(item.file.size)}</span>
                                    <button className="text-slate-300 hover:text-red-500 transition-colors" onClick={() => removePreparedFile(idx)}>
                                        <FaTrashAlt size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-5 py-3 border-t border-[#D1D9D8] bg-[#f8f9fa] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handlePrepareFiles(e.target.files)}
                            ref={fileInputRef}
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="default"
                            size="sm"
                            className="uppercase tracking-widest font-bold px-5"
                        >
                            <FaCloudUploadAlt className="mr-2" /> {t('common.upload', 'Hochladen')}
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 py-1">
                        {preparedFiles.length > 0 && (
                            <>
                                <div className="flex items-center gap-2 pr-4 border-r border-[#D1D9D8]">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t('files.setAllTo', 'Stapel-Zuweisung')}:</span>
                                    <SearchableSelect
                                        className="w-36 h-9 text-[11px]"
                                        options={[
                                            { value: 'source', label: t('files.types.source', 'Eingang') },
                                            { value: 'target', label: t('files.types.target', 'Ziel') },
                                            { value: 'reference', label: t('files.types.reference', 'Referenz') },
                                            { value: 'delivery', label: t('files.types.delivery', 'Lieferung') },
                                        ]}
                                        placeholder={t('files.selectCategory', 'Kategorie...')}
                                        onChange={(val) => updateAllPreparedFilesType(val as FileType)}
                                        value=""
                                    />
                                </div>
                                <Button
                                    onClick={() => uploadPreparedFiles()}
                                    className="uppercase tracking-widest font-bold h-9 px-6"
                                >
                                    <FaCloudUploadAlt className="mr-2" /> {t('common.upload', 'Hochladen')} ({formatFileSize(totalPreparedSize)})
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setPreparedFiles([])}
                                    className="px-3"
                                    title={t('common.clear', 'Leeren')}
                                >
                                    <FaTrashAlt className="text-slate-400" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── File Explorer Card ── */}
            <div className="bg-white border border-[#D1D9D8] rounded-sm shadow-[0_2px_15px_rgba(0,0,0,0.04)] overflow-hidden">
                {/* ── Toolbar ── */}
                <div className="px-5 py-3 border-b border-[#eee] flex flex-wrap items-center gap-4 bg-white min-h-[56px]">
                    <div className="flex items-center gap-1.5 animate-in fade-in duration-300">

                        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            {t('common.documents', 'Dokumente')}
                        </h2>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        {/* Search */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
                            <input
                                type="search"
                                placeholder={t('common.search', 'Dateien suchen...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 w-48 pl-8 pr-3 text-[11px] border border-[#ccc] rounded-sm bg-[#fcfdfe] focus:border-brand-primary outline-none transition shadow-inner"
                            />
                        </div>


                        {/* View Mode */}
                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-sm border border-slate-200">
                            <button onClick={() => setViewMode('list')} className={clsx('h-7 w-7 flex items-center justify-center rounded-sm transition', viewMode === 'list' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400')}><FaListUl /></button>
                            <button onClick={() => setViewMode('grid')} className={clsx('h-7 w-7 flex items-center justify-center rounded-sm transition', viewMode === 'grid' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400')}><FaTh /></button>
                        </div>
                    </div>
                </div>

                {/* ── NEW: High-Density Filter Tabs ── */}
                <div className="px-5 py-2.5 bg-[#f8f9fa] border-b border-[#eee] flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {FILTERS.map(({ value, labelKey, defaultLabel }) => (
                        <Button
                            key={value}
                            onClick={() => setActiveFilter(value)}
                            variant={activeFilter === value ? 'default' : 'secondary'}
                            size="sm"
                            className={clsx(
                                'h-7 py-0 px-3 text-[10px] uppercase font-bold tracking-wider',
                                activeFilter !== value && 'bg-white'
                            )}
                        >
                            {t(labelKey, defaultLabel)} ({filterCount(value)})
                        </Button>
                    ))}
                </div>

                {/* ── NEW: Bulk Action Bar (Under Filters) ── */}
                {selectedIds.size > 0 && (
                    <div className="border-b border-[#D1D9D8] px-5 py-2.5 bg-gradient-to-b from-[#f8f9fa] to-[#eee] flex items-center justify-between gap-4 animate-in slide-in-from-top-1 duration-200 shadow-sm">
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 bg-white border border-[#ccc] px-2 py-0.5 rounded-sm shadow-sm whitespace-nowrap">
                                {selectedIds.size} {t('common.selected', 'Ausgewählt')}
                            </span>
                            <div className="h-4 w-px bg-slate-300" />
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Download Button - Primary/Header style */}
                                <Button
                                    onClick={() => {
                                        if (selectedFiles.length === 1) handleDownloadFile(selectedFiles[0]);
                                        else onBulkDownloadZip(Array.from(selectedIds));
                                    }}
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 px-4 text-[11px] font-bold uppercase tracking-wider shadow-sm"
                                >
                                    <FaDownload size={11} /> {t('common.download', 'Herunterladen')}
                                </Button>

                                <Button
                                    onClick={() => onBulkEmail(Array.from(selectedIds))}
                                    variant="default"
                                    size="sm"
                                    className="h-8 px-4 text-[11px] font-bold uppercase tracking-wider shadow-sm border-[#ccc]"
                                >
                                    <FaEnvelope size={11} className="" /> {t('common.send_email', 'Als E-Mail senden')}
                                </Button>

                                {/* Delete Button - Destructive/Header style */}
                                <Button
                                    onClick={() => {
                                        setIsBulkDeleteModalOpen(true);
                                    }}
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 px-4 text-[11px] font-bold uppercase tracking-wider shadow-sm"
                                >
                                    <FaTrashAlt size={11} /> {t('common.delete', 'Löschen')}
                                </Button>

                                {/* Dropdown for Move and others */}
                                <div className="relative" ref={bulkActionsRef}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setIsBulkActionsOpen(!isBulkActionsOpen)}
                                        className="h-8 px-4 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm border-[#ccc]"
                                    >
                                        Mehr Aktionen <FaChevronDown className={clsx("text-[9px] transition-transform", isBulkActionsOpen && "rotate-180")} />
                                    </Button>

                                    {isBulkActionsOpen && (
                                        <div className="absolute left-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-sm shadow-xl z-[60] py-1 animate-in fade-in slide-in-from-top-1">
                                            {/* Verschieben Submenu */}
                                            <div className="relative group">
                                                <button
                                                    onMouseEnter={() => setIsMoveSubmenuOpen(true)}
                                                    className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition"
                                                >
                                                    <div className="flex items-center gap-3">Verschieben nach</div>
                                                    <FaChevronRight size={8} />
                                                </button>

                                                {isMoveSubmenuOpen && (
                                                    <div
                                                        className="absolute left-full top-0 ml-0 w-40 bg-white border border-slate-200 rounded shadow-lg py-1 animate-in fade-in slide-in-from-left-1"
                                                        onMouseLeave={() => setIsMoveSubmenuOpen(false)}
                                                    >
                                                        {(['source', 'target', 'reference', 'delivery'] as FileType[]).map(type => (
                                                            <button
                                                                key={type}
                                                                className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition capitalize"
                                                                onClick={() => {
                                                                    if (selectedIds.size === 1) onMoveFile(selectedFiles[0], type);
                                                                    else onBulkMove(Array.from(selectedIds), type);
                                                                    setSelectedIds(new Set());
                                                                    setIsBulkActionsOpen(false);
                                                                    setIsMoveSubmenuOpen(false);
                                                                }}
                                                            >
                                                                {FILE_TYPE_CONFIG[type].label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setRenameMode('bulk');
                                                    setIsRenameModalOpen(true);
                                                    setIsBulkActionsOpen(false);
                                                }}
                                                onMouseEnter={() => setIsMoveSubmenuOpen(false)}
                                                className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition"
                                            >
                                                Präfix / Suffix hinzufügen
                                            </button>

                                            <button
                                                onClick={() => {
                                                    const file = selectedFiles[0];
                                                    if (file) {
                                                        setFileToRename(file);
                                                        setRenameMode('single');
                                                        setIsRenameModalOpen(true);
                                                    }
                                                    setIsBulkActionsOpen(false);
                                                }}
                                                onMouseEnter={() => setIsMoveSubmenuOpen(false)}
                                                disabled={selectedIds.size !== 1}
                                                className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                Umbenennen
                                            </button>


                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-black/5 rounded-sm transition"
                            title={t('common.clearSelection', 'Auswahl aufheben')}
                        >
                            <FaTimes size={14} />
                        </button>
                    </div>
                )}

                {/* ── Main Content Area ── */}
                <div className="min-h-[400px]">
                    {allFilteredFiles.length === 0 ? (
                        <div className="h-[400px] flex flex-col items-center justify-center text-slate-300 gap-4">
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-100 flex items-center justify-center">
                                <FaFolderOpen className="text-4xl text-slate-100" />
                            </div>
                            <div className="text-center">
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{t('files.emptyProject', 'Dieser Ordner enthält keine Dateien.')}</p>
                                <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-tighter">{t('files.emptyProjectHint', 'Versuchen Sie, die Filter zu ändern oder neue Dokumente hochzuladen.')}</p>
                            </div>
                        </div>
                    ) : (
                        viewMode === 'list' ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[#fcfdfe] border-b border-[#eee] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <th className="pl-5 pr-2 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                onChange={toggleSelectAll}
                                                className="w-3.5 h-3.5 accent-brand-primary"
                                            />
                                        </th>
                                        <th className="px-3 py-3 text-left">{t('common.name', 'Name')}</th>
                                        <th className="px-3 py-3 text-left w-32">{t('common.file_type', 'Dateityp')}</th>
                                        <th className="px-3 py-3 text-left w-48">{t('common.created_at', 'Erstellt am')}</th>
                                        <th className="px-3 py-3 text-right pr-5 w-24">{t('common.size', 'Größe')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f5f5f5]">
                                    {allFilteredFiles.map((file: any) => {
                                        const name = file.name || file.original_name || 'Unbenannt';
                                        const cfg = FILE_TYPE_CONFIG[file.type as FileType] ?? FILE_TYPE_CONFIG.source;
                                        const isSelected = selectedIds.has(file.id);
                                        return (
                                            <tr
                                                key={file.id}
                                                className={clsx('group transition-colors', isSelected ? 'bg-brand-primary/[0.03]' : 'hover:bg-[#fcfdfe]')}
                                                onClick={() => handlePreviewFile(file)}
                                            >
                                                <td className="pl-5 pr-2 py-2.5" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(file.id)}
                                                        className="w-3.5 h-3.5 accent-brand-primary"
                                                    />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="shrink-0">{getFileIcon(name)}</div>
                                                        <span className="text-[11.5px] font-bold text-slate-700 hover:text-brand-primary cursor-pointer transition truncate max-w-lg">{name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className={clsx('px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase border whitespace-nowrap', cfg.bg)}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-[11px] text-slate-500 whitespace-nowrap">
                                                    {new Date(file.created_at || Date.now()).toLocaleString('de-DE', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="px-3 py-2.5 text-right pr-5 text-[11px] font-mono text-slate-400 font-bold">
                                                    {formatFileSize(file.size || 0)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {allFilteredFiles.map((file: any) => {
                                    const name = file.name || file.original_name || 'Unbenannt';
                                    const isSelected = selectedIds.has(file.id);
                                    return (
                                        <div
                                            key={file.id}
                                            className={clsx(
                                                'group p-4 bg-white border border-[#eee] rounded-sm flex flex-col items-center gap-3 cursor-pointer hover:border-brand-primary/30 transition-all relative',
                                                isSelected && 'bg-brand-primary/[0.02] border-brand-primary'
                                            )}
                                            onClick={() => handlePreviewFile(file)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                className="absolute top-2 left-2 w-3 h-3 accent-brand-primary"
                                                onChange={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <div className="opacity-80 group-hover:scale-105 transition-transform">{getFileIcon(name, true)}</div>
                                            <span className="text-[10px] font-bold text-slate-700 text-center line-clamp-2 w-full break-all leading-tight">{name}</span>
                                            <span className="text-[9px] font-mono text-slate-300 font-bold">{formatFileSize(file.size)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Helper Overlays */}
            {
                uploadQueue.length > 0 && (
                    <div className="fixed bottom-6 right-6 w-80 bg-white border border-[#D1D9D8] rounded-sm shadow-2xl z-[100] animate-in slide-in-from-bottom-4">
                        <div className="px-4 py-3 bg-[#1B4D4F] text-white flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest">{t('common.uploads', 'Hochladevorgänge')} ({uploadQueue.length})</span>
                            <FaTimes className="cursor-pointer" onClick={() => setUploadQueue([])} />
                        </div>
                        <div className="p-4 max-h-64 overflow-y-auto custom-scrollbar space-y-3">
                            {uploadQueue.map(f => (
                                <div key={f.id} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="font-bold text-slate-700 truncate w-40">{f.name}</span>
                                        {f.status === 'saved' ? <FaCheck className="text-emerald-500" /> :
                                            f.status === 'error' ? <FaExclamationCircle className="text-red-500" /> :
                                                <span className="font-mono text-slate-400">{f.progress}%</span>}
                                    </div>
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={clsx("h-full transition-all", f.status === 'saved' ? 'bg-emerald-500' : 'bg-brand-primary')} style={{ width: `${f.progress}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {
                showScanHint && (
                    <div className="fixed top-20 right-6 w-80 bg-white border border-[#D1D9D8] rounded-sm shadow-xl p-4 z-[9997] animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-start gap-3">
                            <FaPrint className="text-brand-primary mt-1" />
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-slate-800 uppercase mb-1">Scan instruction</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed">Save your scan as PDF or JPEG and select it in the file dialog.</p>
                            </div>
                            <FaTimes className="text-slate-300 hover:text-slate-600 cursor-pointer" onClick={() => setShowScanHint(false)} />
                        </div>
                    </div>
                )
            }

            {
                isDragging && (
                    <div className="fixed inset-0 bg-brand-primary/10 border-4 border-dashed border-brand-primary z-[9999] flex flex-col items-center justify-center backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-200">
                        <div className="bg-white p-8 rounded-full shadow-2xl border border-brand-primary/20 mb-6 scale-110">
                            <FaCloudUploadAlt className="text-6xl text-brand-primary" />
                        </div>
                        <div className="text-2xl font-black text-brand-primary uppercase tracking-[0.2em]">{t('files.dropFilesHere', 'Drop files here')}</div>
                    </div>
                )
            }

            <ConfirmModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={() => {
                    onBulkDelete(Array.from(selectedIds));
                    setSelectedIds(new Set());
                    setIsBulkDeleteModalOpen(false);
                }}
                title={t('files.bulkDeleteTitle', 'Dateien löschen')}
                message={t('files.bulkDeleteConfirm', `Möchten Sie die ${selectedIds.size} ausgewählten Dateien wirklich unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)}
                confirmText={t('common.delete', 'Löschen')}
            />

            {
                pendingFiles && (
                    <div className="fixed inset-0 bg-black/30 z-[9998] flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-white rounded-sm border border-[#D1D9D8] shadow-2xl w-full max-w-xs p-5">
                            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-4 text-center">Select category</p>
                            <div className="grid gap-2">
                                {(['source', 'target', 'reference', 'delivery'] as FileType[]).map(type => (
                                    <button key={type} onClick={() => confirmUpload(type)} className={clsx("px-4 py-2.5 rounded-sm border text-[11px] font-bold text-left transition hover:opacity-80 active:scale-95", FILE_TYPE_CONFIG[type].bg)}>
                                        {FILE_TYPE_CONFIG[type].label}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setPendingFiles(null)} className="w-full mt-4 text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition">Cancel</button>
                        </div>
                    </div>
                )
            }
            <RenameFileModal
                isOpen={isRenameModalOpen}
                onClose={() => {
                    setIsRenameModalOpen(false);
                    setFileToRename(null);
                }}
                mode={renameMode}
                initialName={fileToRename ? (fileToRename.file_name || fileToRename.original_name || '') : ''}
                onSubmit={(data) => {
                    if (renameMode === 'single' && fileToRename) {
                        onRenameFile(fileToRename, data.name || '');
                    } else if (renameMode === 'bulk') {
                        onBulkRename(Array.from(selectedIds), data.prefix || '', data.suffix || '');
                        setSelectedIds(new Set());
                    }
                }}
            />
        </div>
    );
};

export default FileExplorer;
