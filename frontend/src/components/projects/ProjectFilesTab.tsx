import { useMemo } from 'react';
import { FaCloudUploadAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive, FaFileAlt, FaEye, FaDownload, FaTrashAlt, FaEllipsisV } from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';
import DataTable from '../common/DataTable';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

interface ProjectFilesTabProps {
    projectData: any;
    fileFilterTab: 'all' | 'source' | 'target';
    setFileFilterTab: (tab: 'all' | 'source' | 'target') => void;
    setIsUploadModalOpen: (open: boolean) => void;
    handlePreviewFile: (file: any) => Promise<void>;
    handleDownloadFile: (file: any) => Promise<void>;
    setDeleteFileConfirm: (confirm: { isOpen: boolean; fileId: string | null; fileName: string }) => void;
    toggleFileType: (file: any) => Promise<void>;
    formatFileSize: (bytes: any) => string;
}

const ProjectFilesTab = ({
    projectData,
    fileFilterTab,
    setFileFilterTab,
    setIsUploadModalOpen,
    handlePreviewFile,
    handleDownloadFile,
    setDeleteFileConfirm,
    toggleFileType,
    formatFileSize,
}: ProjectFilesTabProps) => {

    const columns = useMemo(() => [
        {
            id: 'fileName',
            header: 'Dateiname',
            accessor: (file: any) => {
                const fileName = file.name || file.fileName || file.file_name || file.original_name || 'Unbenannte Datei';
                return (
                    <div className="flex items-center gap-3">
                        <div className="shrink-0">
                            {fileName.toLowerCase().endsWith('.pdf') ? <FaFilePdf className="text-red-500 text-lg" /> :
                                fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx') ? <FaFileWord className="text-blue-500 text-lg" /> :
                                    fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.xlsx') ? <FaFileExcel className="text-emerald-500 text-lg" /> :
                                        fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.png') || fileName.toLowerCase().endsWith('.jpeg') ? <FaFileImage className="text-purple-500 text-lg" /> :
                                            fileName.toLowerCase().endsWith('.zip') || fileName.toLowerCase().endsWith('.rar') ? <FaFileArchive className="text-orange-500 text-lg" /> :
                                                <FaFileAlt className="text-slate-400 text-lg" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="truncate font-bold text-slate-700 text-xs">{fileName}</span>
                            <span className="text-[10px] text-slate-400 font-medium truncate">{file.original_name}</span>
                        </div>
                    </div>
                );
            },
            sortable: true,
        },
        {
            id: 'type',
            header: 'Typ',
            accessor: (file: any) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFileType(file);
                    }}
                    className={clsx(
                        "h-auto px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight border hover:opacity-80 transition cursor-pointer",
                        file.type === 'source' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            file.type === 'target' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                    {file.type === 'source' ? 'Quelle' : file.type === 'target' ? 'Ziel' : file.type}
                </Button>
            ),
        },
        {
            id: 'version',
            header: 'Vers.',
            accessor: (file: any) => (
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200">V{file.version || '1.0'}</span>
            ),
            align: 'center' as const,
        },
        {
            id: 'size',
            header: 'Größe',
            accessor: (file: any) => {
                let displaySize = file.size || file.file_size || '0 B';
                if (typeof displaySize === 'number' || (typeof displaySize === 'string' && !isNaN(Number(displaySize)))) {
                    return formatFileSize(Number(displaySize));
                }
                return displaySize;
            },
            className: "font-mono text-[10px] font-bold text-slate-500",
        },
        {
            id: 'uploaded_by',
            header: 'Hochgeladen von',
            accessor: (file: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[9px] font-black text-slate-700 shadow-inner shrink-0">
                        {(file.uploaded_by?.[0] || file.uploader?.name?.[0] || '?').toUpperCase()}
                    </div>
                    <span className="font-bold text-[11px] text-slate-600 truncate">{file.uploaded_by || file.uploader?.name || 'System'}</span>
                </div>
            ),
        },
        {
            id: 'created_at',
            header: 'Datum / Zeit',
            accessor: (file: any) => {
                const rawDate = file.upload_date || file.created_at;
                const d = rawDate ? new Date(rawDate) : null;
                if (!d || isNaN(d.getTime())) return '-';
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-600">{d.toLocaleDateString('de-DE')}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: '',
            accessor: (file: any) => (
                <div className="flex justify-end gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-brand-primary">
                                <FaEllipsisV className="text-[10px]" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handlePreviewFile(file)} className="gap-2 text-[11px] font-bold">
                                <FaEye className="text-slate-400" /> Ansehen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadFile(file)} className="gap-2 text-[11px] font-bold">
                                <FaDownload className="text-slate-400" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteFileConfirm({ isOpen: true, fileId: file.id, fileName: file.name || file.fileName || file.file_name || file.original_name })}
                                className="gap-2 text-red-500 text-[11px] font-bold focus:text-red-600 focus:bg-red-50"
                            >
                                <FaTrashAlt /> Löschen
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
            align: 'right' as const,
        }
    ], [formatFileSize, handleDownloadFile, handlePreviewFile, setDeleteFileConfirm, toggleFileType]);

    const tabs = (
        <div className="flex bg-slate-100 p-1 rounded-[3px] border border-slate-200 shadow-inner">
            <button
                onClick={() => setFileFilterTab('all')}
                className={clsx(
                    "px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-[2px] transition-all",
                    fileFilterTab === 'all' ? "bg-white text-brand-primary shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                )}
            >
                Alle
            </button>
            <button
                onClick={() => setFileFilterTab('source')}
                className={clsx(
                    "px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-[2px] transition-all",
                    fileFilterTab === 'source' ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-400 hover:text-emerald-600"
                )}
            >
                Quelle
            </button>
            <button
                onClick={() => setFileFilterTab('target')}
                className={clsx(
                    "px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-[2px] transition-all",
                    fileFilterTab === 'target' ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-400 hover:text-blue-600"
                )}
            >
                Ziel
            </button>
        </div>
    );

    const filteredFiles = projectData.files.filter((f: any) => fileFilterTab === 'all' || f.type === fileFilterTab);

    return (
        <div className="flex flex-col gap-4 animate-fadeIn pb-10">
            <DataTable
                data={filteredFiles}
                columns={columns as any}
                pageSize={10}
                searchPlaceholder="Dateien durchsuchen..."
                tabs={tabs}
                extraControls={
                    <Button
                        variant="default"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="h-8 md:h-9 px-4 font-bold bg-[#1B4D4F] hover:bg-[#153a3c] shadow-md shadow-brand-primary/10 flex items-center gap-2 text-[10px] tracking-widest"
                    >
                        <FaCloudUploadAlt /> DATEI HOCHLADEN
                    </Button>
                }
                showSettings={true}
            />
        </div>
    );
};

export default ProjectFilesTab;
