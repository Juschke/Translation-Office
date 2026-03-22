import React, { useState, useMemo } from 'react';
import {
    FaFolder, FaFolderOpen, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel,
    FaFileImage, FaFileArchive, FaDownload, FaTrashAlt, FaPen, FaCopy,
    FaPaste, FaEllipsisV, FaSearch, FaPlus, FaCloudUploadAlt
} from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator
} from '../ui/dropdown-menu';
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
}

const FOLDERS = [
    { id: 'source', name: 'Eingangsdokumente', icon: <FaFolder className="text-amber-500" />, openIcon: <FaFolderOpen className="text-amber-500" /> },
    { id: 'target', name: 'Ausgangsdokumente', icon: <FaFolder className="text-blue-500" />, openIcon: <FaFolderOpen className="text-blue-500" /> },
    { id: 'reference', name: 'Referenzen', icon: <FaFolder className="text-slate-500" />, openIcon: <FaFolderOpen className="text-slate-500" /> },
];

const FileExplorer: React.FC<FileExplorerProps> = ({
    projectData,
    setIsUploadModalOpen,
    handlePreviewFile,
    handleDownloadFile,
    setDeleteFileConfirm,
    onRenameFile,
    onMoveFile,
    formatFileSize,
}) => {
    const [selectedFolderId, setSelectedFolderId] = useState<string>('source');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [clipboard, setClipboard] = useState<{ action: 'copy' | 'cut', files: any[] } | null>(null);
    const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const files = projectData.files || [];

    const getFileIcon = (fileName: string) => {
        const lowerName = fileName.toLowerCase();
        if (lowerName.endsWith('.pdf')) return <FaFilePdf className="text-red-500" />;
        if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FaFileWord className="text-blue-500" />;
        if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return <FaFileExcel className="text-emerald-500" />;
        if (['.jpg', '.png', '.jpeg', '.gif', '.svg', '.webp'].some(ext => lowerName.endsWith(ext))) return <FaFileImage className="text-purple-500" />;
        if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return <FaFileArchive className="text-orange-500" />;
        return <FaFileAlt className="text-slate-400" />;
    };

    const currentFolderFiles = useMemo(() => {
        return files.filter((f: any) => {
            const matchesFolder = f.type === selectedFolderId;
            const matchesSearch = (f.name || f.original_name || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFolder && matchesSearch;
        });
    }, [files, selectedFolderId, searchQuery]);

    const handleFileClick = (fileId: string, e: React.MouseEvent) => {
        if (e.ctrlKey) {
            setSelectedFileIds(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
        } else {
            setSelectedFileIds([fileId]);
        }
    };

    const handleRename = async (file: any) => {
        if (!renameValue || renameValue === (file.name || file.original_name)) {
            setRenamingFileId(null);
            return;
        }
        try {
            await onRenameFile(file, renameValue);
            setRenamingFileId(null);
            toast.success('Datei umbenannt');
        } catch (error) {
            toast.error('Fehler beim Umbenennen');
        }
    };

    const handleMove = async (newType: string) => {
        if (selectedFileIds.length === 0) return;
        try {
            for (const id of selectedFileIds) {
                const file = files.find((f: any) => f.id === id);
                if (file) await onMoveFile(file, newType);
            }
            setSelectedFileIds([]);
            toast.success(`${selectedFileIds.length} Dateien verschoben nach ${FOLDERS.find(f => f.id === newType)?.name}`);
        } catch (error) {
            toast.error('Fehler beim Verschieben');
        }
    };

    const handleCopy = (mode: 'copy' | 'cut') => {
        const selectedFiles = files.filter((f: any) => selectedFileIds.includes(f.id));
        setClipboard({ action: mode, files: selectedFiles });
        toast.success(`${selectedFiles.length} Dateien in Zwischenablage`);
    };

    const handlePaste = async () => {
        if (!clipboard) return;
        try {
            if (clipboard.action === 'cut') {
                for (const file of clipboard.files) {
                    await onMoveFile(file, selectedFolderId);
                }
                setClipboard(null);
                toast.success('Dateien erfolgreich verschoben');
            } else {
                // For "copy", we'd need a backend endpoint to clone files. 
                // Since moving is more common in this workflow, we'll suggest that or skip if not supported.
                toast.error('Kopieren wird aktuell nicht unterstützt, nur Verschieben (Ausschneiden)');
            }
        } catch (error) {
            toast.error('Fehler beim Einfügen');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedFileIds(currentFolderFiles.map((f: any) => f.id));
        } else {
            setSelectedFileIds([]);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden font-sans">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 gap-4">
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-slate-600 hover:text-brand-primary"
                        onClick={() => setIsUploadModalOpen(true)}
                    >
                        <FaCloudUploadAlt className="mr-1.5" /> Hochladen
                    </Button>
                    <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-slate-600 disabled:opacity-30"
                        disabled={selectedFileIds.length === 0}
                        onClick={() => handleCopy('cut')}
                    >
                        <FaCopy className="mr-1.5 text-xs" /> Ausschneiden
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-slate-600 disabled:opacity-30"
                        disabled={!clipboard}
                        onClick={handlePaste}
                    >
                        <FaPaste className="mr-1.5 text-xs" /> Einfügen
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-slate-600 disabled:opacity-30"
                                disabled={selectedFileIds.length === 0}
                            >
                                <FaFolder className="mr-1.5 text-xs text-blue-400" /> Verschieben...
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48">
                            <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ziel auswählen</div>
                            {FOLDERS.map(f => (
                                <DropdownMenuItem
                                    key={f.id}
                                    onClick={() => handleMove(f.id)}
                                    className="gap-2 text-[11px] font-bold"
                                >
                                    {f.icon} {f.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="w-[1px] h-4 bg-slate-300 mx-1 text-xs"></div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-red-600 hover:bg-red-50 disabled:opacity-30"
                        disabled={selectedFileIds.length === 0}
                        onClick={() => {
                            const id = selectedFileIds[0];
                            const file = files.find((f: any) => f.id === id);
                            if (file) setDeleteFileConfirm({ isOpen: true, fileId: id, fileName: file.name || file.original_name });
                        }}
                    >
                        <FaTrashAlt className="mr-1.5 text-xs" /> Löschen
                    </Button>
                </div>

                {/* Central wider search input */}
                <div className="flex-1 max-w-2xl px-4 flex justify-center">
                    <div className="relative w-full">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
                        <input
                            type="search"
                            placeholder="Dateien durchsuchen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 block w-full pl-10 pr-3 bg-white border border-slate-200 text-xs rounded-[4px] shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                    </div>
                </div>

                {/* View switcher buttons on the right of search */}
                <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-[4px] shadow-sm shrink-0">
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx(
                            "px-3 py-1.5 rounded-[2px] text-[10px] font-bold transition-all",
                            viewMode === 'list' ? "bg-slate-100 text-brand-primary shadow-inner" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Liste
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={clsx(
                            "px-3 py-1.5 rounded-[2px] text-[10px] font-bold transition-all",
                            viewMode === 'grid' ? "bg-slate-100 text-brand-primary shadow-inner" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Kacheln
                    </button>
                </div>
            </div>

            <div className="flex flex-1 min-h-0">
                {/* Sidebar */}
                <div className="w-64 bg-slate-50 border-right border-slate-200 p-2 border-r">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 pt-2">Projektordner</div>
                    <div className="flex flex-col gap-0.5">
                        {FOLDERS.map((folder) => {
                            const isActive = selectedFolderId === folder.id;
                            const folderFiles = files.filter((f: any) => f.type === folder.id);
                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => {
                                        setSelectedFolderId(folder.id);
                                        setSelectedFileIds([]); // Clear selection when switching folders
                                    }}
                                    className={clsx(
                                        "flex items-center justify-between px-3 py-2 text-xs rounded-[4px] transition-all group",
                                        isActive ? "bg-white text-brand-primary shadow-sm border border-slate-200 font-bold" : "text-slate-600 hover:bg-slate-200/50 hover:pl-4 transition-all"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-base">{isActive ? folder.openIcon : folder.icon}</span>
                                        <span>{folder.name}</span>
                                    </div>
                                    <span className={clsx(
                                        "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                                        isActive ? "bg-brand-primary text-white" : "bg-slate-200 text-slate-500"
                                    )}>
                                        {folderFiles.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-white overflow-y-auto">
                    {currentFolderFiles.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                            <FaFolderOpen className="text-6xl" />
                            <div className="text-sm font-medium">Dieser Ordner ist leer</div>
                            <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(true)}>
                                Datei hochladen
                            </Button>
                        </div>
                    ) : viewMode === 'list' ? (
                        /* List View */
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-400 font-bold sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 border-b border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                className="w-3.5 h-3.5 rounded-sm border-slate-300 text-brand-primary focus:ring-brand-primary/20 cursor-pointer"
                                                checked={currentFolderFiles.length > 0 && selectedFileIds.length === currentFolderFiles.length}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                            <span>Dateiname</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-2 border-b border-slate-200">Größe</th>
                                    <th className="px-4 py-2 border-b border-slate-200">Geändert</th>
                                    <th className="px-4 py-2 border-b border-slate-200 text-right"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentFolderFiles.map((file: any) => {
                                    const isSelected = selectedFileIds.includes(file.id);
                                    const isRenaming = renamingFileId === file.id;
                                    const name = file.name || file.original_name || 'Unbenannt';

                                    return (
                                        <tr
                                            key={file.id}
                                            onClick={(e) => handleFileClick(file.id, e)}
                                            onDoubleClick={() => handlePreviewFile(file)}
                                            className={clsx(
                                                "group hover:bg-slate-50 cursor-default select-none transition-colors",
                                                isSelected && "bg-brand-primary/5 hover:bg-brand-primary/10"
                                            )}
                                        >
                                            <td className="px-4 py-2.5 border-b border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        className="w-3.5 h-3.5 rounded-sm border-slate-300 text-brand-primary focus:ring-brand-primary/20 cursor-pointer pointer-events-none"
                                                        checked={isSelected}
                                                        readOnly
                                                    />
                                                    <span className="text-base shrink-0">{getFileIcon(name)}</span>
                                                    {isRenaming ? (
                                                        <input
                                                            autoFocus
                                                            value={renameValue}
                                                            onChange={(e) => setRenameValue(e.target.value)}
                                                            onBlur={() => handleRename(file)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleRename(file)}
                                                            className="flex-1 px-2 py-0.5 border border-brand-primary rounded-sm focus:outline-none"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-slate-700 truncate">{name}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 border-b border-slate-100 text-slate-500 font-mono">
                                                {formatFileSize(file.size || 0)}
                                            </td>
                                            <td className="px-4 py-2.5 border-b border-slate-100 text-slate-400">
                                                {new Date(file.created_at || Date.now()).toLocaleDateString('de-DE')}
                                            </td>
                                            <td className="px-4 py-2.5 border-b border-slate-100 text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition">
                                                            <FaEllipsisV className="text-[10px] text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => handlePreviewFile(file)} className="gap-2 text-[11px] font-bold">
                                                            <FaPlus className="text-slate-400" /> Vorschau
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadFile(file)} className="gap-2 text-[11px] font-bold">
                                                            <FaDownload className="text-slate-400" /> Herunterladen
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setRenamingFileId(file.id);
                                                                setRenameValue(name);
                                                            }}
                                                            className="gap-2 text-[11px] font-bold"
                                                        >
                                                            <FaPen className="text-slate-400" /> Umbenennen
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleCopy('cut')} className="gap-2 text-[11px] font-bold">
                                                            <FaCopy className="text-slate-400" /> Ausschneiden (Verschieben)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <div className="px-2 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verschieben nach...</div>
                                                        {FOLDERS.map(f => f.id !== file.type && (
                                                            <DropdownMenuItem
                                                                key={f.id}
                                                                onClick={() => onMoveFile(file, f.id)}
                                                                className="gap-2 text-[11px] font-bold pl-4"
                                                            >
                                                                {f.icon} {f.name}
                                                            </DropdownMenuItem>
                                                        ))}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteFileConfirm({ isOpen: true, fileId: file.id, fileName: name })}
                                                            className="gap-2 text-red-500 text-[11px] font-bold"
                                                        >
                                                            <FaTrashAlt /> Löschen
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        /* Grid View */
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {currentFolderFiles.map((file: any) => {
                                const isSelected = selectedFileIds.includes(file.id);
                                const name = file.name || file.original_name || 'Unbenannt';

                                return (
                                    <div
                                        key={file.id}
                                        onClick={(e) => handleFileClick(file.id, e)}
                                        onDoubleClick={() => handlePreviewFile(file)}
                                        className={clsx(
                                            "flex flex-col items-center p-3 rounded-sm border transition-all cursor-default select-none group relative",
                                            isSelected
                                                ? "bg-brand-primary/5 border-brand-primary/20 shadow-sm"
                                                : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                                        )}
                                    >
                                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="w-3.5 h-3.5 rounded-sm border-slate-300 text-brand-primary focus:ring-brand-primary/20 cursor-pointer"
                                                checked={isSelected}
                                                onChange={() => handleFileClick(file.id, { ctrlKey: true } as any)}
                                            />
                                        </div>
                                        <div className="text-4xl mb-3 relative">
                                            {getFileIcon(name)}
                                            {file.version && (
                                                <span className="absolute -top-1 -right-2 bg-slate-800 text-white text-[8px] px-1 rounded-sm font-bold">V{file.version}</span>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 text-center line-clamp-2 w-full break-all leading-tight">
                                            {name}
                                        </span>
                                        <span className="text-[9px] text-slate-400 mt-1">
                                            {formatFileSize(file.size || 0)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Status Bar */}
            <div className="px-4 py-1.5 bg-slate-600 text-white text-[10px] flex items-center justify-between font-medium">
                <div className="flex items-center gap-4">
                    <span className="opacity-90">{files.length} Elemente insgesamt</span>
                    {selectedFileIds.length > 0 && (
                        <span className=" text-[9px] text-white px-1.5 py-1.5 rounded-[2px] font-black uppercase tracking-tighter  animate-in fade-in zoom-in duration-200">
                            {selectedFileIds.length} ausgewählt
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">

                    <span className="bg-white/20 px-2 py-1.5 rounded-[2px]">{FOLDERS.find(f => f.id === selectedFolderId)?.name}</span>
                </div>
            </div>
        </div>
    );
};

export default FileExplorer;
