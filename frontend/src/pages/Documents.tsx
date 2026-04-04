import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../api/services';
import {
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive,
    FaDownload, FaTrashAlt, FaExternalLinkAlt, FaFolder, FaUser, FaCloudUploadAlt,
    FaCheckCircle, FaInbox, FaHdd
} from 'react-icons/fa';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui';
import DataTable from '../components/common/DataTable';
import KPICard from '../components/common/KPICard';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const Documents = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
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
            toast.success(t('common.messages.deleted') || 'Datei gelöscht');
        },
        onError: () => toast.error(t('common.messages.error') || 'Fehler beim Löschen'),
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
        const toastId = toast.loading(t('common.messages.downloading') || 'Download wird vorbereitet...');
        try {
            const response = await projectService.downloadFile(file.project_id, file.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.original_name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(t('common.messages.download_started') || 'Download gestartet', { id: toastId });
        } catch (error) {
            toast.error(t('common.messages.download_failed') || 'Download fehlgeschlagen', { id: toastId });
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
    const totalSize = files.reduce((acc: number, f: any) => acc + (f.file_size || 0), 0);

    const columns = [
        {
            id: 'file',
            header: t('common.file') || 'Datei',
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
            header: t('common.project') || 'Projekt',
            accessor: (file: any) => (
                <Link
                    to={`/projects/${file.project_id}`}
                    className="flex flex-col hover:text-brand-primary transition-colors group"
                >
                    <span className="text-xs font-bold text-slate-700 truncate flex items-center gap-2 group-hover:text-brand-primary">
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
            header: t('common.type') || 'Typ',
            accessor: (file: any) => (
                <div className="flex flex-col gap-1">
                    <Badge variant={file.type === 'target' ? 'success' : 'default'} className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0 w-fit">
                        {file.type === 'target' ? 'Ausspielung' : 'Eingang'}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                        {formatFileSize(file.file_size || 0)}
                    </span>
                </div>
            ),
            width: 120,
        },
        {
            id: 'uploader',
            header: t('common.uploaded_by') || 'Hochgeladen',
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
                <div className="flex items-center justify-end gap-0.5" onClick={e => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5"
                        onClick={() => handleDownload(file)}
                        title={t('common.download') || "Download"}
                    >
                        <FaDownload className="text-xs" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        onClick={() => navigate(`/projects/${file.project_id}`)}
                        title={t('projects.actions.view_details') || "Projekt öffnen"}
                    >
                        <FaExternalLinkAlt className="text-[10px]" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => {
                            if (window.confirm(t('common.confirm_delete') || 'Datei wirklich löschen?')) {
                                deleteMutation.mutate({ projectId: file.project_id, fileId: file.id });
                            }
                        }}
                        title={t('common.delete') || "Löschen"}
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
            label: t('common.type') || 'Dateityp',
            type: 'select' as const,
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
                { value: 'all', label: t('projects.filters.status_tabs.all') || 'Alle Typen' },
                { value: 'source', label: t('documents.format_source') },
                { value: 'target', label: t('documents.format_target') },
            ]
        },
        {
            id: 'extension',
            label: t('common.format') || 'Format',
            type: 'select' as const,
            value: extFilter,
            onChange: setExtFilter,
            options: [
                { value: 'all', label: t('projects.filters.status_tabs.all') || 'Alle Formate' },
                { value: 'pdf', label: t('documents.format_pdf') },
                { value: 'docx', label: t('documents.format_word') },
                { value: 'xlsx', label: t('documents.format_excel') },
                { value: 'zip', label: t('documents.format_zip') },
            ]
        }
    ];

    const onResetFilters = () => {
        setTypeFilter('all');
        setExtFilter('all');
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-16 py-6 md:py-8">
            <div className="flex flex-col gap-6 h-full overflow-hidden fade-in">
                {/* Header Section */}
                <div className="flex justify-between items-center gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">Dokumente</h1>
                        <p className="text-slate-500 text-sm hidden sm:block">Zentrale Verwaltung aller Projektdokumente und Lieferungen</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-tight h-9 px-4 border-slate-200 hover:bg-slate-50 transition-all">
                            <FaCloudUploadAlt className="text-slate-400" /> List Export
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        label="Dateien Gesamt"
                        value={totalCount}
                        icon={<FaFileAlt />}
                        subValue="Indexierte Dokumente"
                    />
                    <KPICard
                        label="Speicherplatz"
                        value={formatFileSize(totalSize)}
                        icon={<FaHdd />}
                        subValue="Belegter Speicher"
                    />
                    <KPICard
                        label="Quell-Dokumente"
                        value={sourceFilesCount}
                        icon={<FaInbox />}
                        subValue="Eingänge von Kunden"
                    />
                    <KPICard
                        label="Ausspielungen"
                        value={targetFilesCount}
                        icon={<FaCheckCircle />}
                        subValue="Gelieferte Dateien"
                    />
                </div>

                {/* Table Section */}
                <div className="flex-1 flex flex-col min-h-[500px] relative z-0">
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
                        onRowClick={(file) => navigate(`/projects/${file.project_id}`)}
                    />
                </div>
            </div>
        </div>
    );
};

export default Documents;
