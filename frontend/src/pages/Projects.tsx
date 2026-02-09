import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaPlus, FaArrowRight, FaFileCsv,
    FaFilePdf, FaFileExcel, FaLayerGroup, FaChartLine, FaGlobe,
    FaEdit, FaTrash, FaEye, FaDownload,
    FaCheck, FaArchive, FaTrashRestore, FaEnvelope, FaFilter,
    FaListUl, FaColumns
} from 'react-icons/fa';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import NewProjectModal from '../components/modals/NewProjectModal';
import Checkbox from '../components/common/Checkbox';
import Switch from '../components/common/Switch';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../api/services';
import { getFlagUrl } from '../utils/flags';
import { getLanguageLabel } from '../utils/languages';
import TableSkeleton from '../components/common/TableSkeleton';
import KanbanBoard from '../components/projects/KanbanBoard';
import ConfirmModal from '../components/common/ConfirmModal';
import { BulkActions } from '../components/common/BulkActions';


const Projects = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [showTrash, setShowTrash] = useState(false);
    const [showArchive, setShowArchive] = useState(false);
    const [isViewSettingsOpen, setIsViewSettingsOpen] = useState(false);

    const exportRef = useRef<HTMLDivElement>(null);
    const viewSettingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
            if (viewSettingsRef.current && !viewSettingsRef.current.contains(event.target as Node)) {
                setIsViewSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    // deleted/archived states removed in favor of filter

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | string[] | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const queryClient = useQueryClient();
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getAll
    });

    const createMutation = useMutation({
        mutationFn: projectService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => projectService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            setEditingProject(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: projectService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedProjects([]);
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: string[], data: any }) => projectService.bulkUpdate(args.ids, args.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setSelectedProjects([]);
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: projectService.bulkDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedProjects([]);
        }
    });

    const activeProjectsData = useMemo(() => {
        return projects.filter((p: any) => {
            const s = p.status?.toLowerCase();
            return s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht';
        });
    }, [projects]);

    const totalProjectsCount = activeProjectsData.length;
    const activeProjectsCount = activeProjectsData.filter((p: any) => ['in_progress', 'review', 'ready_for_pickup'].includes(p.status)).length;
    const totalVolume = activeProjectsData.reduce((acc: number, curr: any) => acc + (curr.word_count || 0), 0);
    const totalRevenue = activeProjectsData.reduce((acc: number, curr: any) => acc + parseFloat(curr.price_total || 0), 0);

    const filteredProjects = useMemo(() => {
        if (!Array.isArray(projects)) return [];
        return projects.filter((p: any) => {
            // Priority 1: Check for explicit Archive/Trash tabs
            if (filter === 'trash') return p.status === 'deleted';
            if (filter === 'archive') return p.status === 'archived';

            // For all other tabs, exclude deleted and archived
            if (p.status === 'deleted' || p.status === 'archived') return false;

            // Priority 2: Standard Tabs filtering
            if (filter === 'all') return true;
            if (filter === 'offer') return ['offer', 'pending', 'draft'].includes(p.status);
            if (filter === 'in_progress') return ['in_progress', 'review'].includes(p.status);
            if (filter === 'ready_for_pickup') return p.status === 'ready_for_pickup';
            if (filter === 'invoiced') return p.status === 'invoiced';
            if (filter === 'delivered') return p.status === 'delivered';
            if (filter === 'completed') return p.status === 'completed';

            return true;
        });
    }, [projects, filter]);

    const getStatusBadge = (status: string) => {
        const labels: { [key: string]: string } = {
            'draft': 'Angebot',
            'offer': 'Angebot',
            'pending': 'Angebot',
            'in_progress': 'Bearbeitung',
            'review': 'Bearbeitung',
            'ready_for_pickup': 'Abholbereit',
            'invoiced': 'Rechnung',
            'delivered': 'Geliefert',
            'completed': 'Abgeschlossen',
            'cancelled': 'Storniert',
            'archived': 'Archiviert',
            'deleted': 'Gelöscht'
        };
        const styles: { [key: string]: string } = {
            'draft': 'bg-slate-50 text-slate-600 border-slate-200',
            'offer': 'bg-orange-50 text-orange-700 border-orange-200',
            'pending': 'bg-orange-50 text-orange-700 border-orange-200',
            'in_progress': 'bg-blue-50 text-blue-700 border-blue-200',
            'review': 'bg-blue-50 text-blue-700 border-blue-200',
            'ready_for_pickup': 'bg-indigo-50 text-indigo-700 border-indigo-200',
            'invoiced': 'bg-purple-50 text-purple-700 border-purple-200',
            'delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'completed': 'bg-emerald-600 text-white border-emerald-700',
            'cancelled': 'bg-gray-100 text-gray-500 border-gray-300',
            'archived': 'bg-slate-100 text-slate-500 border-slate-300',
            'deleted': 'bg-red-50 text-red-700 border-red-200'
        };
        return <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase border tracking-tight ${styles[status] || styles['draft']}`}>{labels[status] || status}</span>;
    }

    const toggleSelection = (id: string) => {
        setSelectedProjects(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedProjects.length === filteredProjects.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(filteredProjects.map((p: any) => p.id));
        }
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (filteredProjects.length === 0) return;

        const headers = ['ID', 'Projektname', 'Kunde', 'Quelle', 'Ziel', 'Status', 'Deadline', 'Preis'];
        const rows = filteredProjects.map((p: any) => [
            p.project_number || p.id,
            p.project_name,
            p.customer?.company_name || `${p.customer?.first_name} ${p.customer?.last_name}`,
            p.source_language?.iso_code || '',
            p.target_language?.iso_code || '',
            p.status,
            p.deadline ? new Date(p.deadline).toLocaleDateString('de-DE') : '',
            p.price_total || '0'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Projekte_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportOpen(false);
    };

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    const columns = [
        {
            id: 'selection',
            header: (
                <Checkbox
                    checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                    onChange={toggleSelectAll}
                />
            ),
            accessor: (p: any) => (
                <Checkbox
                    checked={selectedProjects.includes(p.id)}
                    onChange={() => toggleSelection(p.id)}
                />
            ),
            className: 'w-10',
            hidden: filteredProjects.length === 0
        },
        {
            id: 'id',
            header: 'Projekt',
            accessor: (p: any) => (
                <div className="flex flex-col max-w-[150px]">
                    <span className="font-semibold text-slate-800 truncate" title={p.project_name}>{p.project_name}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.project_number || `P-${p.id}`}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'project_name',
            className: 'w-[150px]'
        },
        {
            id: 'customer',
            header: 'Kunde',
            accessor: (p: any) => {
                const name = p.customer?.company_name || `${p.customer?.first_name} ${p.customer?.last_name}` || 'Unbekannt';
                return (
                    <div className="flex items-center gap-3 max-w-[240px]">
                        <div className="w-9 h-9 bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0 shadow-sm rounded-md">
                            {getInitials(name)}
                        </div>
                        <div className="flex flex-col text-xs leading-tight overflow-hidden">
                            <span className="font-semibold text-slate-800 truncate mb-0.5" title={name}>
                                {name}
                            </span>
                            {p.customer?.email && (
                                <a href={`mailto:${p.customer.email}`} className="text-[10px] text-slate-500 hover:text-brand-600 truncate flex items-center gap-1.5 transition-colors">
                                    <FaEnvelope className="opacity-50" /> {p.customer.email}
                                </a>
                            )}
                            {p.customer?.phone && (
                                <span className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                                    <span className="opacity-50">Tel:</span> {p.customer.phone}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'customer_id'
        },
        {
            id: 'partner',
            header: 'Übersetzer',
            accessor: (p: any) => {
                if (!p.partner) return <span className="text-slate-300 italic text-xs">-</span>;
                const name = p.partner.company || `${p.partner.first_name} ${p.partner.last_name}`;
                return (
                    <div className="flex items-center gap-3 max-w-[240px]">
                        <div className="w-9 h-9 bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-xs font-semibold shrink-0 shadow-sm rounded-md">
                            {getInitials(name)}
                        </div>
                        <div className="flex flex-col text-xs leading-tight overflow-hidden">
                            <span className="font-semibold text-slate-800 truncate mb-0.5" title={name}>
                                {name}
                            </span>
                            {p.partner.email && (
                                <a href={`mailto:${p.partner.email}`} className="text-[10px] text-slate-500 hover:text-brand-600 truncate flex items-center gap-1.5 transition-colors">
                                    <FaEnvelope className="opacity-50" /> {p.partner.email}
                                </a>
                            )}
                            {p.partner.phone && (
                                <span className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                                    <span className="opacity-50">Tel:</span> {p.partner.phone}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'languages',
            header: 'Sprachpaar',
            accessor: (p: any) => {
                const sourceCode = p.source_language?.iso_code || p.source || 'de';
                const sCode = sourceCode.split('-')[0].toLowerCase();
                const sourceName = p.source_language?.name_internal || p.source_language?.name || getLanguageLabel(sCode);

                const targetCode = p.target_language?.iso_code || p.target || 'en';
                const tCode = targetCode.split('-')[0].toLowerCase();
                const targetName = p.target_language?.name_internal || p.target_language?.name || getLanguageLabel(tCode);

                return (
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <div className="flex items-center gap-1.5" title={`Quelle: ${sourceName}`}>
                                <img
                                    src={getFlagUrl(sourceCode)}
                                    className="w-4 h-3 object-cover shadow-[0_1px_2px_rgba(0,0,0,0.1)] border border-slate-200 rounded-[1px]"
                                    alt={sourceName}
                                />
                                <span className="text-[10px] font-bold text-slate-700 uppercase">{sCode}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium truncate max-w-[80px] leading-tight" title={sourceName}>{sourceName}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center -mt-2">
                            <FaArrowRight className="text-slate-300 text-[10px]" />
                        </div>

                        <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <div className="flex items-center gap-1.5" title={`Ziel: ${targetName}`}>
                                <img
                                    src={getFlagUrl(targetCode)}
                                    className="w-4 h-3 object-cover shadow-[0_1px_2px_rgba(0,0,0,0.1)] border border-slate-200 rounded-[1px]"
                                    alt={targetName}
                                />
                                <span className="text-[10px] font-bold text-slate-700 uppercase">{tCode}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium truncate max-w-[80px] leading-tight" title={targetName}>{targetName}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'down_payment',
            header: 'Anzahlung',
            accessor: (p: any) => (
                <span className={clsx("text-xs", parseFloat(p.down_payment) > 0 ? "text-slate-600 font-medium" : "text-slate-300")}>
                    {parseFloat(p.down_payment || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
            ),
            align: 'right' as const
        },
        {
            id: 'price_total',
            header: 'Gesamtpreis',
            accessor: (p: any) => (
                <span className="font-semibold text-slate-800 text-xs">
                    {parseFloat(p.price_total || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
            ),
            align: 'right' as const
        },
        {
            id: 'deadline',
            header: 'Deadline',
            accessor: (p: any) => {
                if (!p.deadline) return <span className="text-slate-300">-</span>;
                const date = new Date(p.deadline);
                const today = new Date();
                const diffTime = date.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                let label = `${diffDays} Tage`;

                if (diffDays < 0) {
                    badgeColor = 'bg-red-50 text-red-600 border-red-100';
                    label = `${Math.abs(diffDays)} Tage überfällig`;
                } else if (diffDays === 0) {
                    badgeColor = 'bg-orange-50 text-orange-600 border-orange-100';
                    label = 'Heute fällig';
                } else if (diffDays <= 2) {
                    badgeColor = 'bg-orange-50 text-orange-600 border-orange-100';
                }

                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <span>{date.toLocaleDateString('de-DE')}</span>
                            <span className="text-slate-400 text-[10px]">
                                {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border w-fit ${badgeColor}`}>
                            {label}
                        </span>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'deadline'
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (p: any) => getStatusBadge(p.status),
            sortable: true,
            sortKey: 'status'
        },
        {
            id: 'actions',
            header: '',
            accessor: (p: any) => (
                <div className="flex justify-end gap-1 relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/projects/${p.id}`)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition" title="Details"><FaEye /></button>
                    {p.status !== 'deleted' && (
                        <button onClick={() => { setEditingProject(p); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition" title="Bearbeiten"><FaEdit /></button>
                    )}
                    {p.status === 'deleted' ? (
                        <div className="flex gap-1">
                            <button onClick={() => bulkUpdateMutation.mutate({ ids: [p.id], data: { status: 'in_progress' } })} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition" title="Wiederherstellen"><FaTrashRestore /></button>
                            <button onClick={() => {
                                setProjectToDelete(p.id);
                                setConfirmTitle('Endgültig löschen');
                                setConfirmMessage('Dieses Projekt wird unwiderruflich gelöscht. Fortfahren?');
                                setIsConfirmOpen(true);
                            }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Endgültig löschen"><FaTrash /></button>
                        </div>
                    ) : (
                        <button onClick={() => {
                            if (p.status === 'archived') {
                                setProjectToDelete(p.id);
                                setConfirmTitle('In den Papierkorb?');
                                setConfirmMessage('Möchten Sie dieses archivierte Projekt in den Papierkorb verschieben?');
                            } else {
                                setProjectToDelete([p.id]); // Re-use state logic
                                bulkUpdateMutation.mutate({ ids: [p.id], data: { status: 'deleted' } });
                                return; // Skip modal for soft delete
                            }
                            // Fallback for direct trash action if needed, though usually handled via update
                            bulkUpdateMutation.mutate({ ids: [p.id], data: { status: 'deleted' } });
                        }} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="In Papierkorb"><FaTrash /></button>
                    )}
                </div>
            ),
            align: 'right' as const
        }
    ];

    const tabs = (
        <div className="flex items-center gap-6">
            <button onClick={() => setFilter('all')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'all' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Übersicht</button>
            <button onClick={() => setFilter('offer')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'offer' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Angebot</button>
            <button onClick={() => setFilter('in_progress')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'in_progress' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Bearbeitung</button>
            <button onClick={() => setFilter('ready_for_pickup')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'ready_for_pickup' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Abholbereit</button>
            <button onClick={() => setFilter('invoiced')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'invoiced' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Rechnung</button>
            <button onClick={() => setFilter('delivered')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'delivered' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Geliefert</button>
            <button onClick={() => setFilter('completed')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'completed' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Abgeschlossen</button>

            {(showTrash || filter === 'trash') && (
                <button onClick={() => setFilter('trash')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'trash' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Papierkorb</button>
            )}
            {(showArchive || filter === 'archive') && (
                <button onClick={() => setFilter('archive')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${filter === 'archive' ? 'border-slate-600 text-slate-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Archiv</button>
            )}
        </div>
    );

    const actions = (
        <div className="flex items-center gap-2">
            <div className="relative group z-50" ref={exportRef}>
                <button onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }} className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest bg-white rounded-md flex items-center gap-2 shadow-sm transition">
                    <FaDownload /> Export
                </button>
                {isExportOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl border border-slate-100 z-[100] overflow-hidden animate-fadeIn">
                        <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"><FaFileExcel className="text-emerald-600 text-sm" /> Excel (.xlsx)</button>
                        <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"><FaFileCsv className="text-blue-600 text-sm" /> CSV (.csv)</button>
                        <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 border-t border-slate-50 transition"><FaFilePdf className="text-red-600 text-sm" /> PDF Report</button>
                    </div>
                )}
            </div>
        </div>
    );
    const extraControls = (
        <div className="relative" ref={viewSettingsRef}>
            <button
                onClick={() => setIsViewSettingsOpen(!isViewSettingsOpen)}
                className={`p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 transition shadow-sm ${isViewSettingsOpen ? "bg-brand-50 border-brand-200 text-brand-600" : ""}`}
                title="Ansichtseinstellungen"
            >
                <FaFilter className="text-sm" />
            </button>
            {isViewSettingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-xl border border-slate-100 z-[100] p-4 fade-in">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest">Ansicht anpassen</h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-1">
                            <span className={`text-xs font-medium ${showTrash ? "text-slate-700" : "text-slate-400"}`}>Papierkorb anzeigen</span>
                            <Switch checked={showTrash} onChange={() => setShowTrash(!showTrash)} />
                        </div>
                        <div className="flex items-center justify-between p-1">
                            <span className={`text-xs font-medium ${showArchive ? "text-slate-700" : "text-slate-400"}`}>Archiv anzeigen</span>
                            <Switch checked={showArchive} onChange={() => setShowArchive(!showArchive)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-6 h-full fade-in" onClick={() => { setIsExportOpen(false); }}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Projektübersicht</h1>
                    <p className="text-slate-500 text-sm">Verwalten und überwachen Sie alle Übersetzungsaufträge.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95">
                        <FaPlus className="text-xs" /> Neues Projekt
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard label="Gesamtprojekte" value={totalProjectsCount} icon={<FaLayerGroup />} />
                <KPICard label="Aktive Projekte" value={activeProjectsCount} icon={<FaChartLine />} iconColor="text-blue-600" iconBg="bg-blue-50" />
                <KPICard label="Gesamtvolumen" value={totalVolume.toLocaleString('de-DE')} subValue="Wörter" icon={<FaGlobe />} />
                <KPICard label="Umsatz YTD" value={totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaChartLine />} iconColor="text-green-600" iconBg="bg-green-50" />
            </div>

            <div className="flex justify-end -mb-2">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-hidden">
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md",
                            viewMode === 'list'
                                ? "bg-white text-slate-800 shadow-sm"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        )}
                        title="Tabellenansicht"
                    >
                        <FaListUl className="text-xs" />
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md",
                            viewMode === 'kanban'
                                ? "bg-white text-slate-800 shadow-sm"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        )}
                        title="Kanban-Ansicht"
                    >
                        <FaColumns className="text-xs" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-0">
                <BulkActions
                    selectedCount={selectedProjects.length}
                    onClearSelection={() => setSelectedProjects([])}
                    actions={[
                        {
                            label: 'Abschließen',
                            icon: <FaCheck className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'completed', progress: 100 } }),
                            variant: 'success',
                            show: filter !== 'trash' && filter !== 'completed'
                        },
                        {
                            label: 'Zurücksetzen',
                            icon: <FaArrowRight className="text-xs rotate-180" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'in_progress' } }),
                            variant: 'default',
                            show: filter === 'completed'
                        },
                        {
                            label: 'E-Mail senden',
                            icon: <FaEnvelope className="text-xs" />,
                            onClick: () => {
                                // Existing logic for single project email
                                if (selectedProjects.length === 1) {
                                    const p = projects.find((pro: any) => pro.id === selectedProjects[0]);
                                    navigate('/inbox', {
                                        state: {
                                            compose: true,
                                            to: p?.customer?.email,
                                            subject: `Projekt: ${p?.project_name} (${p?.project_number || 'ID ' + p?.id})`,
                                            body: `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die gewünschten Informationen zum Projekt ${p?.project_name}.\n\nMit freundlichen Grüßen\n${user?.tenant?.company_name || user?.name || ''}`,
                                            attachments: p?.files || []
                                        }
                                    });
                                }
                            },
                            variant: 'primary',
                            show: selectedProjects.length === 1 && filter !== 'trash'
                        },
                        // Archive Action
                        {
                            label: 'Archivieren',
                            icon: <FaArchive className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'archived' } }),
                            variant: 'default',
                            show: filter !== 'trash' && filter !== 'archive'
                        },
                        // Papierkorb Action (Soft delete)
                        {
                            label: 'Papierkorb',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'deleted' } }),
                            variant: 'danger',
                            show: filter !== 'trash' && filter !== 'deleted'
                        },
                        {
                            label: 'Wiederherstellen',
                            icon: <FaTrashRestore className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'in_progress' } }),
                            variant: 'success',
                            show: filter === 'trash' || filter === 'deleted'
                        },
                        {
                            label: 'Endgültig löschen',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => {
                                setProjectToDelete(selectedProjects);
                                setConfirmTitle('Projekte endgültig löschen');
                                setConfirmMessage(`Sind Sie sicher, dass Sie ${selectedProjects.length} Projekte endgültig löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.`);
                                setIsConfirmOpen(true);
                            },
                            variant: 'dangerSolid',
                            show: filter === 'trash' || filter === 'deleted'
                        }
                    ]}
                />


                {viewMode === 'list' ? (
                    <DataTable
                        data={filteredProjects}
                        columns={columns as any}
                        onRowClick={(p) => navigate(`/projects/${p.id}`)}
                        pageSize={window.innerWidth < 768 ? 5 : 10}
                        searchPlaceholder="Suchen nach Projekten..."
                        searchFields={['project_name', 'project_number']}
                        actions={actions}
                        tabs={tabs}
                        extraControls={extraControls}
                        onAddClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                    />
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col pt-4 overflow-x-hidden">
                        <div className="flex justify-between items-center mb-6 px-4">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Projekt-Board</h2>
                        </div>
                        <div className="flex-1 min-h-0 px-4 overflow-y-auto pb-10 custom-scrollbar">
                            <KanbanBoard
                                projects={filteredProjects}
                                onProjectClick={(p) => navigate(`/projects/${p.id}`)}
                                onStatusChange={(projectId, newStatus) => {
                                    updateMutation.mutate({ id: projectId, status: newStatus });
                                }}
                                onEdit={(p) => {
                                    setEditingProject(p);
                                    setIsModalOpen(true);
                                }}
                            />
                        </div>
                    </div >
                )}
            </div >

            <NewProjectModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingProject(null); }}
                onSubmit={(data) => {
                    if (editingProject) {
                        updateMutation.mutate({ ...data, id: editingProject.id });
                    } else {
                        createMutation.mutate(data);
                    }
                }}
                initialData={editingProject}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setProjectToDelete(null);
                }}
                onConfirm={() => {
                    if (projectToDelete) {
                        if (Array.isArray(projectToDelete)) {
                            bulkDeleteMutation.mutate(projectToDelete, {
                                onSuccess: () => {
                                    setIsConfirmOpen(false);
                                    setProjectToDelete(null);
                                }
                            });
                        } else {
                            deleteMutation.mutate(projectToDelete as string, {
                                onSuccess: () => {
                                    setIsConfirmOpen(false);
                                    setProjectToDelete(null);
                                }
                            });
                        }
                    }
                }}
                title={confirmTitle}
                message={confirmMessage}
                isLoading={deleteMutation.isPending || bulkDeleteMutation.isPending}
            />
        </div >
    );
};

export default Projects;
