import { useState, useMemo, useRef, useEffect } from 'react';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, subMonths, startOfYear, subYears, isWithinInterval } from 'date-fns';
import {
    FaPlus, FaFileCsv,
    FaFilePdf, FaFileExcel, FaLayerGroup, FaChartLine, FaGlobe,
    FaDownload,
    FaListUl, FaColumns,
    FaCheck, FaArrowRight, FaEnvelope, FaArchive, FaTrash, FaTrashRestore, FaCheckCircle
} from 'react-icons/fa';
import { buildProjectColumns } from './projectColumns';
import clsx from 'clsx';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import NewProjectModal from '../components/modals/NewProjectModal';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, customerService, partnerService, settingsService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import KanbanBoard from '../components/projects/KanbanBoard';
import ConfirmModal from '../components/common/ConfirmModal';
import type { BulkActionItem } from '../components/common/BulkActions';
import StatusTabButton from '../components/common/StatusTabButton';
import { TooltipProvider } from '../components/ui/tooltip';
import echo from '../utils/echo';


const Projects = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusView, setStatusView] = useState<'active' | 'archive' | 'trash'>('active');
    const [filter, setFilter] = useState('all');
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [advancedFilters, setAdvancedFilters] = useState({
        customerId: '',
        partnerId: '',
        sourceLanguageId: '',
        targetLanguageId: '',
        dateRange: 'all',
        projectSearch: '',
        deadlineDate: '',
    });

    const exportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (location.state?.openNewModal) {
            setIsModalOpen(true);
            // Clear location state to prevent modal from reopening on refresh or navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    // deleted/archived states removed in favor of filter

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | string[] | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const queryClient = useQueryClient();

    // Listen to real-time project updates
    useEffect(() => {
        const channel = echo.channel('projects');
        channel.listen('ProjectUpdated', () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
        });

        return () => {
            echo.leaveChannel('projects');
        };
    }, [queryClient]);

    // Clear selection when changing tabs
    useEffect(() => {
        setSelectedProjects([]);
    }, [statusView, filter]);

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getAll,
        refetchInterval: 10000, // Aktualisiert die Tabelle automatisch alle 10 Sekunden im Hintergrund
        refetchOnWindowFocus: true, // Aktualisiert SOFORT, wenn man wieder in das Browser-Fenster klickt
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getAll
    });

    const { data: partners = [] } = useQuery({
        queryKey: ['partners'],
        queryFn: partnerService.getAll
    });

    const { data: languages = [] } = useQuery({
        queryKey: ['languages'],
        queryFn: settingsService.getLanguages
    });

    const createMutation = useMutation({
        mutationFn: projectService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            toast.success('Projekt erfolgreich erstellt');
        },
        onError: () => {
            toast.error('Fehler beim Erstellen des Projekts');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => projectService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            setEditingProject(null);
            toast.success('Projekt erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren des Projekts');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: projectService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedProjects([]);
            toast.success('Projekt erfolgreich gelöscht');
        },
        onError: () => {
            toast.error('Fehler beim Löschen des Projekts');
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: string[], data: any }) => projectService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setSelectedProjects([]);
            const count = variables.ids.length;
            const message = variables.data.status === 'deleted'
                ? `${count} Projekte in den Papierkorb verschoben`
                : `${count} Projekte aktualisiert`;
            toast.success(message);
        },
        onError: () => {
            toast.error('Massenvorgang fehlgeschlagen');
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: projectService.bulkDelete,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedProjects([]);
            toast.success(`${variables.length} Projekte endgültig gelöscht`);
        },
        onError: () => {
            toast.error('Fehler beim endgültigen Löschen');
        }
    });

    const filteredProjectsByAdvanced = useMemo(() => {
        if (!Array.isArray(projects)) return [];
        return projects.filter((p: any) => {
            if (advancedFilters.projectSearch) {
                const searchLow = advancedFilters.projectSearch.toLowerCase();
                if (!(p.project_name?.toLowerCase().includes(searchLow) || p.project_number?.toLowerCase().includes(searchLow))) return false;
            }
            if (advancedFilters.customerId && p.customer_id?.toString() !== advancedFilters.customerId) return false;
            if (advancedFilters.partnerId && p.partner_id?.toString() !== advancedFilters.partnerId) return false;
            if (advancedFilters.sourceLanguageId && p.source_lang_id?.toString() !== advancedFilters.sourceLanguageId) return false;
            if (advancedFilters.targetLanguageId && p.target_lang_id?.toString() !== advancedFilters.targetLanguageId) return false;

            if (advancedFilters.deadlineDate) {
                if (!p.deadline) return false;
                const dDate = new Date(p.deadline).toISOString().split('T')[0];
                if (dDate !== advancedFilters.deadlineDate) return false;
            }

            if (advancedFilters.dateRange && advancedFilters.dateRange !== 'all') {
                const now = new Date();
                let start: Date | null = null;
                let end: Date = endOfDay(now);

                switch (advancedFilters.dateRange) {
                    case 'today': start = startOfDay(now); break;
                    case 'yesterday': { const yest = subDays(now, 1); start = startOfDay(yest); end = endOfDay(yest); break; }
                    case 'this_week': start = startOfWeek(now, { weekStartsOn: 1 }); break;
                    case 'this_month': start = startOfMonth(now); break;
                    case 'last_3_months': start = subMonths(now, 3); break;
                    case 'last_6_months': start = subMonths(now, 6); break;
                    case 'this_year': start = startOfYear(now); break;
                    case 'last_year': { const ly = subYears(now, 1); start = startOfYear(ly); end = endOfDay(new Date(ly.getFullYear(), 11, 31)); break; }
                }

                if (start) {
                    const pDate = new Date(p.created_at || p.createdAt || p.date);
                    if (!isWithinInterval(pDate, { start, end })) return false;
                }
            }
            return true;
        });
    }, [projects, advancedFilters]);

    const activeProjectsData = useMemo(() => {
        return filteredProjectsByAdvanced.filter((p: any) => {
            const s = p.status?.toLowerCase();
            return s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht';
        });
    }, [filteredProjectsByAdvanced]);

    const totalProjectsCount = activeProjectsData.length;
    const activeProjectsCount = activeProjectsData.filter((p: any) => ['in_progress', 'review', 'ready_for_pickup'].includes(p.status)).length;
    const totalRevenue = activeProjectsData.reduce((acc: number, curr: any) => acc + parseFloat(curr.price_total || 0), 0);
    const totalMargin = activeProjectsData.reduce((acc: number, curr: any) => {
        const rev = parseFloat(curr.price_total || 0);
        const cost = parseFloat(curr.partner_cost_net || 0);
        return acc + (rev - cost);
    }, 0);

    const filteredProjects = useMemo(() => {
        let result = projects.filter((p: any) => {
            // Priority 1: Filter by status view (active/archive/trash)
            if (statusView === 'trash') {
                if (p.status !== 'deleted') return false;
            } else if (statusView === 'archive') {
                if (p.status !== 'archived') return false;
            } else {
                // Active view: exclude deleted and archived
                if (p.status === 'deleted' || p.status === 'archived') return false;
            }

            // Priority 2: Standard filter tabs (only for active view)
            if (statusView === 'active') {
                if (filter === 'all') return true;
                if (filter === 'offer') return ['offer', 'pending', 'draft'].includes(p.status);
                if (filter === 'in_progress') return ['in_progress', 'review'].includes(p.status);
                if (filter === 'ready_for_pickup') return p.status === 'ready_for_pickup';
                if (filter === 'invoiced') return p.status === 'invoiced';
                if (filter === 'delivered') return p.status === 'delivered';
                if (filter === 'completed') return p.status === 'completed';
            }

            return true;
        });

        // Advanced Filters
        return result.filter((p: any) => {
            if (advancedFilters.projectSearch) {
                const searchLow = advancedFilters.projectSearch.toLowerCase();
                if (!(p.project_name?.toLowerCase().includes(searchLow) || p.project_number?.toLowerCase().includes(searchLow))) return false;
            }
            if (advancedFilters.customerId && p.customer_id?.toString() !== advancedFilters.customerId) return false;
            if (advancedFilters.partnerId && p.partner_id?.toString() !== advancedFilters.partnerId) return false;
            if (advancedFilters.sourceLanguageId && p.source_lang_id?.toString() !== advancedFilters.sourceLanguageId) return false;
            if (advancedFilters.targetLanguageId && p.target_lang_id?.toString() !== advancedFilters.targetLanguageId) return false;

            if (advancedFilters.deadlineDate) {
                if (!p.deadline) return false;
                const dDate = new Date(p.deadline).toISOString().split('T')[0];
                if (dDate !== advancedFilters.deadlineDate) return false;
            }

            if (advancedFilters.dateRange && advancedFilters.dateRange !== 'all') {
                const now = new Date();
                let start: Date | null = null;
                let end: Date = endOfDay(now);

                switch (advancedFilters.dateRange) {
                    case 'today': start = startOfDay(now); break;
                    case 'yesterday': { const yest = subDays(now, 1); start = startOfDay(yest); end = endOfDay(yest); break; }
                    case 'this_week': start = startOfWeek(now, { weekStartsOn: 1 }); break;
                    case 'this_month': start = startOfMonth(now); break;
                    case 'last_3_months': start = subMonths(now, 3); break;
                    case 'last_6_months': start = subMonths(now, 6); break;
                    case 'this_year': start = startOfYear(now); break;
                    case 'last_year': { const ly = subYears(now, 1); start = startOfYear(ly); end = endOfDay(new Date(ly.getFullYear(), 11, 31)); break; }
                }

                if (start) {
                    const pDate = new Date(p.created_at || p.createdAt || p.date);
                    if (!isWithinInterval(pDate, { start, end })) return false;
                }
            }
            return true;
        });
    }, [projects, statusView, filter, advancedFilters]);

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
        triggerBlobDownload(blob, `Projekte_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
        setIsExportOpen(false);
    };

    const handleEditProject = async (p: any) => {
        setEditingProject(p);
        setIsModalOpen(true);
        setIsDetailLoading(true);
        try {
            const fullData = await projectService.getById(p.id);
            setEditingProject(fullData);
        } catch (err) {
            console.error("Failed to load project details", err);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const columns = buildProjectColumns({
        navigate,
        bulkUpdateMutation,
        setEditingProject: handleEditProject,
        setIsModalOpen: (val) => { if (!val) setIsModalOpen(false); },
        setProjectToDelete,
        setConfirmTitle,
        setConfirmMessage,
        setIsConfirmOpen,
        advancedFilters,
        setAdvancedFilters,
        customers,
        partners,
        languages,
        projects
    });

    // Count projects by status for badges
    const activeCount = useMemo(() => filteredProjectsByAdvanced.filter((p: any) => p.status !== 'deleted' && p.status !== 'archived').length, [filteredProjectsByAdvanced]);
    const archivedCount = useMemo(() => filteredProjectsByAdvanced.filter((p: any) => p.status === 'archived').length, [filteredProjectsByAdvanced]);
    const trashedCount = useMemo(() => filteredProjectsByAdvanced.filter((p: any) => p.status === 'deleted').length, [filteredProjectsByAdvanced]);

    const statusTabs = (
        <TooltipProvider>
            <div className="flex items-center gap-2 mb-4">
                <StatusTabButton
                    active={statusView === 'active'}
                    onClick={() => { setStatusView('active'); setFilter('all'); }}
                    icon={<FaCheckCircle />}
                    label="Aktiv"
                    count={activeCount}
                />
                <StatusTabButton
                    active={statusView === 'archive'}
                    onClick={() => { setStatusView('archive'); setFilter('all'); }}
                    icon={<FaArchive />}
                    label="Archiv"
                    count={archivedCount}
                />
                <StatusTabButton
                    active={statusView === 'trash'}
                    onClick={() => { setStatusView('trash'); setFilter('all'); }}
                    icon={<FaTrash />}
                    label="Papierkorb"
                    count={trashedCount}
                />
            </div>
        </TooltipProvider>
    );

    const tabs = statusView === 'active' ? (
        <div className="flex items-center gap-2 whitespace-nowrap px-1">
            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${filter === 'all' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Übersicht</button>
            <button onClick={() => setFilter('offer')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${filter === 'offer' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Neu</button>
            <button onClick={() => setFilter('in_progress')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${filter === 'in_progress' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Bearbeitung</button>
            <button onClick={() => setFilter('delivered')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${filter === 'delivered' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Geliefert</button>
            <button onClick={() => setFilter('invoiced')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${filter === 'invoiced' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Rechnung</button>
            <button onClick={() => setFilter('ready_for_pickup')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${filter === 'ready_for_pickup' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Abholbereit</button>
            <button onClick={() => setFilter('completed')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${filter === 'completed' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Abgeschlossen</button>
        </div>
    ) : null;

    const actions = (
        <div className="flex items-center gap-2">
            <div className="relative group z-50" ref={exportRef}>
                <button onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }} className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium bg-white rounded-sm flex items-center gap-2 shadow-sm transition">
                    <FaDownload /> Export
                </button>
                {isExportOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-sm shadow-sm border border-slate-100 z-[100] overflow-hidden animate-slideUp">
                        <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"><FaFileExcel className="text-emerald-600 text-sm" /> Excel (.xlsx)</button>
                        <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"><FaFileCsv className="text-blue-600 text-sm" /> CSV (.csv)</button>
                        <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 border-t border-slate-50 transition"><FaFilePdf className="text-red-600 text-sm" /> PDF Report</button>
                    </div>
                )}
            </div>
        </div>
    );

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-6 fade-in pb-10" onClick={() => { setIsExportOpen(false); }}>
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">Projekte & Aufträge</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">Verwalten und überwachen Sie alle Übersetzungsaufträge.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-sm flex items-center justify-center gap-2 transition"
                    >
                        <FaPlus className="text-xs" /> <span className="hidden sm:inline">Neues Projekt</span><span className="inline sm:hidden">Neu</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label="Gesamtprojekte" value={totalProjectsCount} icon={<FaLayerGroup />} />
                <KPICard label="Aktive Projekte" value={activeProjectsCount} icon={<FaChartLine />} iconColor="text-blue-600" iconBg="bg-blue-50" />
                <KPICard label="Marge gesamt" value={totalMargin.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaGlobe />} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
                <KPICard label="Umsatz YTD" value={totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaChartLine />} iconColor="text-green-600" iconBg="bg-green-50" />
            </div>

            <div className="flex justify-end -mb-2">
                <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 overflow-hidden">
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all rounded-sm",
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
                            "flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all rounded-sm",
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

            {statusTabs}

            <div className="flex-1 flex flex-col min-h-[500px] sm:min-h-0 relative z-0">
                {viewMode === 'list' ? (
                    <DataTable
                        data={filteredProjects as any[]}
                        columns={columns as any}
                        onRowClick={(p) => navigate(`/projects/${p.id}`)}
                        pageSize={window.innerWidth < 768 ? 5 : 10}
                        searchPlaceholder="Suchen nach Projekten..."
                        searchFields={['project_name', 'project_number'] as any[]}
                        actions={actions}
                        tabs={tabs}
                        onAddClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        selectable
                        selectedIds={selectedProjects}
                        onSelectionChange={(ids) => setSelectedProjects(ids as string[])}
                        bulkActions={[
                            { label: 'Abschließen', icon: <FaCheck className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'completed', progress: 100 } }), variant: 'success', show: statusView === 'active' && filter !== 'completed' },
                            { label: 'Zurücksetzen', icon: <FaArrowRight className="text-xs rotate-180" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'in_progress' } }), variant: 'default', show: statusView === 'active' && filter === 'completed' },
                            { label: 'E-Mail senden', icon: <FaEnvelope className="text-xs" />, onClick: () => { if (selectedProjects.length === 1) { const p = projects.find((pro: any) => pro.id === selectedProjects[0]); navigate('/inbox', { state: { compose: true, to: p?.customer?.email, subject: `Projekt: ${p?.project_name} (${p?.project_number || 'ID ' + p?.id})`, body: `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die gewünschten Informationen zum Projekt ${p?.project_name}.\n\nMit freundlichen Grüßen\n${user?.tenant?.company_name || user?.name || ''}`, attachments: p?.files || [] } }); } }, variant: 'primary', show: selectedProjects.length === 1 && statusView === 'active' },
                            { label: 'Archivieren', icon: <FaArchive className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'archived' } }), variant: 'default', show: statusView === 'active' },
                            { label: 'Papierkorb', icon: <FaTrash className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'deleted' } }), variant: 'danger', show: statusView === 'active' },
                            { label: 'Wiederherstellen', icon: <FaTrashRestore className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'in_progress' } }), variant: 'success', show: statusView === 'trash' || statusView === 'archive' },
                            { label: 'Endgültig löschen', icon: <FaTrash className="text-xs" />, onClick: () => { setProjectToDelete(selectedProjects); setConfirmTitle('Projekte endgültig löschen'); setConfirmMessage(`Sind Sie sicher, dass Sie ${selectedProjects.length} Projekte endgültig löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.`); setIsConfirmOpen(true); }, variant: 'dangerSolid', show: statusView === 'trash' },
                        ] as BulkActionItem[]}
                    />
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col pt-4 overflow-x-hidden">
                        <div className="flex justify-between items-center mb-6 px-4">
                            <h2 className="text-xl font-medium text-slate-800 tracking-tight">Projekt-Board</h2>
                        </div>
                        <div className="flex-1 min-h-0 px-4 overflow-y-auto pb-10 custom-scrollbar">
                            <KanbanBoard
                                projects={filteredProjects}
                                onProjectClick={(p) => navigate(`/projects/${p.id}`)}
                                onStatusChange={(projectId, newStatus) => {
                                    updateMutation.mutate({ id: projectId, status: newStatus });
                                }}
                                onEdit={handleEditProject}
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
                isLoading={isDetailLoading || createMutation.isPending || updateMutation.isPending}
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
