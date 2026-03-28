import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../api/services';
import {
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive,
    FaDownload, FaTrashAlt, FaExternalLinkAlt, FaFolder, FaUser, FaCloudUploadAlt,
    FaCheckCircle, FaInbox
} from 'react-icons/fa';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui';
import DataTable from '../components/common/DataTable';
import toast from 'react-hot-toast';

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const Documents = () => {
    const queryClient = useQueryClient();
    const [typeFilter, setTypeFilter] = useState('all');
    const [extFilter, setExtFilter] = useState('all');

    const { data: filesData, isLoading } = useQuery({
        queryKey: ['files'],
        queryFn: () => projectService.getFiles({ per_page: 500 }),
    });

    const deleteMutation = useMutation({
        mutationFn: ({ projectId, fileId }: { projectId: string; fileId: string }) =>
            projectService.deleteFile(projectId, fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            toast.success('Datei gelöscht');
        },
        onError: () => toast.error('Fehler beim Löschen'),
    });

    const getFileIcon = (fileName: string) => {
        const lowerName = (fileName || '').toLowerCase();
        if (lowerName.endsWith('.pdf')) return <FaFilePdf className="text-red-500" />;
        if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FaFileWord className="text-blue-500" />;
        if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return <FaFileExcel className="text-emerald-500" />;
        if (['.jpg', '.png', '.jpeg', '.gif', '.svg', '.webp'].some(ext => lowerName.endsWith(ext))) return <FaFileImage className="text-purple-500" />;
        if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return <FaFileArchive className="text-orange-500" />;
        return <FaFileAlt className="text-slate-400" />;
    };

    const handleDownload = async (file: any) => {
        const toastId = toast.loading('Download wird vorbereitet...');
        try {
            const response = await projectService.downloadFile(file.project_id, file.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.original_name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Download gestartet', { id: toastId });
        } catch (error) {
            toast.error('Download fehlgeschlagen', { id: toastId });
        }
    };

    const files = filesData?.data || [];
    const totalCount = filesData?.meta?.total || filesData?.total || 0;

    const filteredFiles = files.filter((f: any) => {
        const matchesType = typeFilter === 'all' || f.type === typeFilter;
        const matchesExt = extFilter === 'all' || f.extension?.toLowerCase() === extFilter.toLowerCase();
        return matchesType && matchesExt;
    });

    const sourceFilesCount = files.filter((f: any) => f.type === 'source').length;
    const targetFilesCount = files.filter((f: any) => f.type === 'target').length;

    const columns = [
        {
            id: 'file',
            header: 'Datei',
            accessor: (file: any) => (
                <div className="flex items-center gap-3">
                    <div className="text-xl shrink-0">
                        {getFileIcon(file.original_name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-bold text-slate-800 truncate leading-tight">
                            {file.original_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-tighter">
                            VER {file.version} • {file.extension}
                        </span>
                    </div>
                </div>
            ),
            width: 300,
        },
        {
            id: 'project',
            header: 'Projekt',
            accessor: (file: any) => (
                <Link
                    to={`/projects/${file.project_id}`}
                    className="flex flex-col hover:text-brand-primary transition-colors"
                >
                    <span className="text-xs font-bold text-slate-700 truncate flex items-center gap-2">
                        <FaFolder className="text-[10px] opacity-20" />
                        {file.project?.project_number}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate pl-4">
                        {file.project?.project_name}
                    </span>
                </Link>
            ),
            width: 200,
        },
        {
            id: 'type',
            header: 'Typ',
            accessor: (file: any) => (
                <div className="flex flex-col gap-1">
                    <Badge variant={file.type === 'target' ? 'success' : 'default'} className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0">
                        {file.type === 'target' ? 'Ausspielung' : 'Eingang'}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-mono">
                        {formatFileSize(file.file_size || 0)}
                    </span>
                </div>
            ),
            width: 120,
        },
        {
            id: 'uploader',
            header: 'Hochgeladen',
            accessor: (file: any) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                        <FaUser className="text-[10px] opacity-20" />
                        {file.uploader?.name || 'System'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {format(new Date(file.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </span>
                </div>
            ),
            width: 180,
        },
        {
            id: 'actions',
            header: '',
            accessor: (file: any) => (
                <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-brand-primary"
                        onClick={() => handleDownload(file)}
                        title="Download"
                    >
                        <FaDownload className="text-xs" />
                    </Button>
                    <Link to={`/projects/${file.project_id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" title="Projekt öffnen">
                            <FaExternalLinkAlt className="text-[10px]" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                        onClick={() => {
                            if (window.confirm('Datei wirklich löschen?')) {
                                deleteMutation.mutate({ projectId: file.project_id, fileId: file.id });
                            }
                        }}
                        title="Löschen"
                    >
                        <FaTrashAlt className="text-xs" />
                    </Button>
                </div>
            ),
            align: 'right' as const,
            width: 120,
        },
    ];

    const filters = [
        {
            id: 'type',
            label: 'Dateityp',
            type: 'select' as const,
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
                { value: 'all', label: 'Alle Typen' },
                { value: 'source', label: 'Eingang' },
                { value: 'target', label: 'Ausspielung' },
            ]
        },
        {
            id: 'extension',
            label: 'Format',
            type: 'select' as const,
            value: extFilter,
            onChange: setExtFilter,
            options: [
                { value: 'all', label: 'Alle Formate' },
                { value: 'pdf', label: 'PDF' },
                { value: 'docx', label: 'Word (DOCX)' },
                { value: 'xlsx', label: 'Excel (XLSX)' },
                { value: 'zip', label: 'Archive (ZIP)' },
            ]
        }
    ];

    const onResetFilters = () => {
        setTypeFilter('all');
        setExtFilter('all');
    };

    return (
        <div className="p-6 space-y-8 animate-fadeIn bg-[#F8FAFB] min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                            <FaFileAlt className="text-lg" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dateien</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Globaler Datei-Index</span>
                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[11px] font-bold text-brand-primary">{totalCount} Dokumente</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gesamt */}
                <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
                        <FaFileAlt size={60} />
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dateien Gesamt</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 leading-tight">
                                {totalCount}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                                Index aktiv
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Über alle Projekte hinweg</p>
                    </div>
                </div>

                {/* Eingänge */}
                <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
                        <FaInbox size={60} />
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eingänge</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 leading-tight">
                                {sourceFilesCount}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-sm">
                                Source
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Kunden-Dokumente & Quellen</p>
                    </div>
                </div>

                {/* Ausspielungen */}
                <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
                        <FaCheckCircle size={60} />
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ausspielungen</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-emerald-600 leading-tight">
                                {targetFilesCount}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                                Fertiggestellt
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Übersetzte Ziel-Dateien</p>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="space-y-4">
                <DataTable
                    data={filteredFiles}
                    columns={columns}
                    isLoading={isLoading}
                    filters={filters}
                    onResetFilters={onResetFilters}
                    activeFilterCount={(typeFilter !== 'all' ? 1 : 0) + (extFilter !== 'all' ? 1 : 0)}
                    searchPlaceholder="Nach Dateiname oder Erweiterung suchen..."
                    searchFields={['original_name', 'extension']}
                    pageSize={25}
                    actions={(
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-tight h-8 px-4 border-[#D1D9D8] hover:bg-slate-50">
                                <FaCloudUploadAlt className="text-slate-400" /> List Export
                            </Button>
                        </div>
                    )}
                />
            </div>
        </div>
    );
};

export default Documents;
