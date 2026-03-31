import { useState, useMemo, useRef, useEffect } from 'react';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, subMonths, startOfYear, subYears, isWithinInterval } from 'date-fns';
import {
    FaPlus, FaFileCsv,
    FaFilePdf, FaFileExcel, FaLayerGroup,
    FaDownload,
    FaListUl, FaColumns,
    FaCheck, FaArrowRight, FaEnvelope, FaArchive, FaTrash, FaTrashRestore,
    FaExclamationTriangle, FaChartPie, FaUserTimes
} from 'react-icons/fa';
import { buildProjectColumns } from './projectColumns';
import clsx from 'clsx';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import KPICard from '../components/common/KPICard';
import DataTable, { type FilterDef } from '../components/common/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, customerService, partnerService, settingsService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import KanbanBoard from '../components/projects/KanbanBoard';
import ConfirmModal from '../components/common/ConfirmModal';
import ProjectFilesModal from '../components/modals/ProjectFilesModal';
import type { BulkActionItem } from '../components/common/BulkActions';
import echo from '../utils/echo';

import { useTranslation } from 'react-i18next';


const Projects = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [statusView, setStatusView] = useState<'active' | 'archive' | 'trash'>(() => {
        const p = searchParams.get('view');
        return (p === 'archive' || p === 'trash') ? p : 'active';
    });

    const [filter, setFilter] = useState(() => searchParams.get('status') || 'all');
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [viewFilesProject, setViewFilesProject] = useState<any>(null);
    const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
        const p = searchParams.get('mode');
        return p === 'kanban' ? 'kanban' : 'list';
    });
    const [advancedFilters, setAdvancedFilters] = useState<any>({
        customerId: '',
        partnerId: '',
        sourceLanguageId: searchParams.get('src') || '',
        targetLanguageId: searchParams.get('tgt') || '',
        dateRange: 'all',
        projectSearch: '',
        deadlineDate: '',
        deadlineRange: 'all',
        priority: searchParams.get('priority') || 'all',
        certified: 'all',
        apostille: 'all',
    });

    const updateSearchParams = (updates: Record<string, string | null>) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            for (const [key, value] of Object.entries(updates)) {
                if (value === null) {
                    next.delete(key);
                } else {
                    next.set(key, value);
                }
            }
            return next;
        }, { replace: true });
    };

    const handleSetStatusView = (v: 'active' | 'archive' | 'trash') => {
        setStatusView(v);
        updateSearchParams({ view: v === 'active' ? null : v });
    };

    const handleSetFilter = (v: string) => {
        setFilter(v);
        updateSearchParams({ status: v === 'all' ? null : v });
    };

    const handleSetViewMode = (v: 'list' | 'kanban') => {
        setViewMode(v);
        updateSearchParams({ mode: v === 'list' ? null : v });
    };

    const handleSetAdvancedFilters = (updater: (prev: any) => any) => {
        setAdvancedFilters((prev: any) => {
            const next = updater(prev);
            updateSearchParams({
                src: next.sourceLanguageId || null,
                tgt: next.targetLanguageId || null,
                priority: next.priority === 'all' ? null : next.priority,
            });
            return next;
        });
    };

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

    const queryClient = useQueryClient();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | string[] | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const handleCreateProject = () => {
        navigate('/projects/new');
    };

    const handleEditProject = (project: any) => {
        navigate(`/projects/${project.id}/edit`);
    };

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

    const updateMutation = useMutation({
        mutationFn: (data: any) => projectService.update(data.id, data),
        onMutate: async (updatedProject) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['projects'] });

            // Snapshot the previous value
            const previousProjects = queryClient.getQueryData(['projects']);

            // Optimistically update to the new value
            queryClient.setQueryData(['projects'], (old: any[] | undefined) => {
                if (!old) return [];
                return old.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p);
            });

            // Return a context object with the snapshotted value
            return { previousProjects };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success(t('projects.messages.update_success'));
        },
        onError: (_err, _updatedProject, context: any) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousProjects) {
                queryClient.setQueryData(['projects'], context.previousProjects);
            }
            toast.error(t('projects.messages.update_error'));
        },
        onSettled: () => {
            // Always refetch after error or success to ensure we are in sync with the server
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: projectService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedProjects([]);
            toast.success(t('projects.messages.delete_success'));
        },
        onError: () => {
            toast.error(t('projects.messages.delete_error'));
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: string[], data: any }) => projectService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setSelectedProjects([]);
            const count = variables.ids.length;
            const message = variables.data.status === 'deleted'
                ? t('projects.messages.bulk_trash', { count })
                : t('projects.messages.bulk_update', { count });
            toast.success(message);
        },
        onError: () => {
            toast.error(t('projects.messages.bulk_error'));
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: projectService.bulkDelete,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedProjects([]);
            toast.success(t('projects.messages.bulk_delete', { count: variables.length }));
        },
        onError: () => {
            toast.error(t('projects.messages.bulk_error'));
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

            if (advancedFilters.priority && advancedFilters.priority !== 'all') {
                if (p.priority !== advancedFilters.priority) return false;
            }
            if (advancedFilters.certified !== 'all') {
                if (Boolean(p.is_certified) !== (advancedFilters.certified === 'yes')) return false;
            }
            if (advancedFilters.apostille !== 'all') {
                if (Boolean(p.has_apostille) !== (advancedFilters.apostille === 'yes')) return false;
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
    const ongoingProjects = activeProjectsData.filter((p: any) => ['in_progress', 'review', 'ready_for_pickup'].includes(p.status));
    const activeProjectsCount = ongoingProjects.length;

    const totalRevenue = activeProjectsData.reduce((acc: number, curr: any) => acc + parseFloat(curr.price_total || 0), 0);
    const totalMargin = activeProjectsData.reduce((acc: number, curr: any) => {
        const rev = parseFloat(curr.price_total || 0);
        const cost = parseFloat(curr.partner_cost_net || 0);
        return acc + (rev - cost);
    }, 0);

    const marginPercentage = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
    const unassignedCount = activeProjectsData.filter((p: any) =>
        !p.partner_id && ['in_progress', 'review', 'pending', 'offer'].includes(p.status)
    ).length;

    const urgencyCount = activeProjectsData.filter((p: any) => {
        if (!p.deadline || ['completed', 'delivered', 'invoiced', 'archived', 'deleted'].includes(p.status)) return false;
        return new Date(p.deadline) <= endOfDay(new Date());
    }).length;

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

            if (advancedFilters.deadlineRange && advancedFilters.deadlineRange !== 'all') {
                const now = new Date();
                if (advancedFilters.deadlineRange === 'overdue') {
                    if (!p.deadline || new Date(p.deadline) >= startOfDay(now)) return false;
                } else if (advancedFilters.deadlineRange === 'today') {
                    if (!p.deadline) return false;
                    const dl = new Date(p.deadline);
                    if (dl < startOfDay(now) || dl > endOfDay(now)) return false;
                } else if (advancedFilters.deadlineRange === 'this_week') {
                    if (!p.deadline) return false;
                    const dl = new Date(p.deadline);
                    if (!isWithinInterval(dl, { start: startOfDay(now), end: endOfDay(subDays(startOfWeek(subDays(now, -7), { weekStartsOn: 1 }), 1)) })) return false;
                } else if (advancedFilters.deadlineRange === 'this_month') {
                    if (!p.deadline) return false;
                    const dl = new Date(p.deadline);
                    if (!isWithinInterval(dl, { start: startOfDay(now), end: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)) })) return false;
                }
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

            if (advancedFilters.priority && advancedFilters.priority !== 'all') {
                if (p.priority !== advancedFilters.priority) return false;
            }

            if (advancedFilters.certified !== 'all') {
                const want = advancedFilters.certified === 'yes';
                if (Boolean(p.is_certified) !== want) return false;
            }

            if (advancedFilters.apostille !== 'all') {
                const want = advancedFilters.apostille === 'yes';
                if (Boolean(p.has_apostille) !== want) return false;
            }

            return true;
        });
    }, [projects, statusView, filter, advancedFilters]);

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (filteredProjects.length === 0) return;

        const headers = [t('tables.id'), t('tables.project_name'), t('tables.customer'), t('tables.source_lang'), t('tables.target_lang'), t('tables.status'), t('tables.deadline'), t('tables.price')];
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


    const columns = buildProjectColumns({
        navigate,
        bulkUpdateMutation,
        setEditingProject: handleEditProject,
        setViewFilesProject: (p) => {
            setViewFilesProject(p);
            setIsFilesModalOpen(true);
        },
        setIsModalOpen: () => { },
        setProjectToDelete,
        setConfirmTitle,
        setConfirmMessage,
        setIsConfirmOpen,
        t,
    });

    // Count projects by status for badges


    const activeFilterCount = (statusView !== 'active' ? 1 : 0) + (filter !== 'all' ? 1 : 0) + Object.values(advancedFilters).filter(v => v && v !== 'all').length;
    const resetFilters = () => {
        handleSetStatusView('active');
        handleSetFilter('all');
        handleSetAdvancedFilters(() => ({
            customerId: '', partnerId: '', sourceLanguageId: '', targetLanguageId: '',
            dateRange: 'all', projectSearch: '', deadlineDate: '',
            deadlineRange: 'all', priority: 'all', certified: 'all', apostille: 'all',
        }));
    };

    const tableFilters = useMemo(() => {
        const filters: FilterDef[] = [
            {
                id: 'statusView', label: t('projects.filters.status_view'), type: 'select' as const, value: statusView, onChange: (v: any) => { handleSetStatusView(v as 'active' | 'archive' | 'trash'); handleSetFilter('all'); },
                options: [{ value: 'active', label: t('projects.filters.active') }, { value: 'archive', label: t('projects.filters.archive') }, { value: 'trash', label: t('projects.filters.trash') }]
            }
        ];

        if (statusView === 'active') {
            filters.push({
                id: 'filter', label: t('projects.filters.quick_filter'), type: 'select' as const, value: filter, onChange: (v: any) => handleSetFilter(v),
                options: [
                    { value: 'all', label: t('projects.filters.status_tabs.all') },
                    { value: 'offer', label: t('projects.filters.status_tabs.offer') },
                    { value: 'in_progress', label: t('projects.filters.status_tabs.in_progress') },
                    { value: 'ready_for_pickup', label: t('projects.filters.status_tabs.ready_for_pickup') },
                    { value: 'delivered', label: t('projects.filters.status_tabs.delivered') },
                    { value: 'invoiced', label: t('projects.filters.status_tabs.invoiced') },
                    { value: 'completed', label: t('projects.filters.status_tabs.completed') }
                ]
            });
        }

        filters.push(
            {
                id: 'priority', label: t('projects.filters.priority.label'), type: 'select' as const, value: advancedFilters.priority || 'all', onChange: (v: any) => handleSetAdvancedFilters((prev: any) => ({ ...prev, priority: v })),
                options: [
                    { value: 'all', label: t('projects.filters.priority.all') },
                    { value: 'low', label: t('projects.filters.priority.standard') },
                    { value: 'medium', label: t('projects.filters.priority.normal') },
                    { value: 'high', label: t('projects.filters.priority.high') },
                    { value: 'express', label: t('projects.filters.priority.express') },
                ]
            },
            {
                id: 'customer', label: t('projects.filters.customers.label'), type: 'select' as const, value: advancedFilters.customerId || '', onChange: (v: any) => setAdvancedFilters((prev: any) => ({ ...prev, customerId: v })),
                options: [{ value: '', label: t('projects.filters.customers.all') }, ...customers.map((c: any) => ({ value: c.id, label: (c.company_name || `${c.first_name || ''} ${c.last_name || ''}`).trim() }))]
            },
            {
                id: 'partner', label: t('projects.filters.partners.label'), type: 'select' as const, value: advancedFilters.partnerId || '', onChange: (v: any) => setAdvancedFilters((prev: any) => ({ ...prev, partnerId: v })),
                options: [{ value: '', label: t('projects.filters.partners.all') }, ...partners.map((p: any) => ({ value: p.id, label: (p.company || `${p.first_name || ''} ${p.last_name || ''}`).trim() }))]
            },
            {
                id: 'sourceLang', label: t('projects.filters.languages.source'), type: 'select' as const, value: advancedFilters.sourceLanguageId || '', onChange: (v: any) => handleSetAdvancedFilters((prev: any) => ({ ...prev, sourceLanguageId: v })),
                options: [{ value: '', label: t('projects.filters.languages.all') }, ...languages.map((l: any) => ({ value: l.id, label: l.name || (l.iso_code || '').toUpperCase() }))]
            },
            {
                id: 'targetLang', label: t('projects.filters.languages.target'), type: 'select' as const, value: advancedFilters.targetLanguageId || '', onChange: (v: any) => handleSetAdvancedFilters((prev: any) => ({ ...prev, targetLanguageId: v })),
                options: [{ value: '', label: t('projects.filters.languages.all') }, ...languages.map((l: any) => ({ value: l.id, label: l.name || (l.iso_code || '').toUpperCase() }))]
            },
            {
                id: 'deadlineRange', label: t('projects.filters.deadline.label'), type: 'select' as const, value: advancedFilters.deadlineRange || 'all', onChange: (v: any) => setAdvancedFilters((prev: any) => ({ ...prev, deadlineRange: v })),
                options: [
                    { value: 'all', label: t('projects.filters.deadline.all') },
                    { value: 'overdue', label: t('projects.filters.deadline.overdue') },
                    { value: 'today', label: t('projects.filters.deadline.today') },
                    { value: 'this_week', label: t('projects.filters.deadline.this_week') },
                    { value: 'this_month', label: t('projects.filters.deadline.this_month') },
                ]
            },
            {
                id: 'certified', label: t('projects.filters.certified'), type: 'select' as const, value: advancedFilters.certified || 'all', onChange: (v: any) => setAdvancedFilters((prev: any) => ({ ...prev, certified: v })),
                options: [{ value: 'all', label: t('projects.filters.languages.all') }, { value: 'yes', label: t('projects.filters.yes') }, { value: 'no', label: t('projects.filters.no') }]
            },
            {
                id: 'apostille', label: t('projects.filters.apostille'), type: 'select' as const, value: advancedFilters.apostille || 'all', onChange: (v: any) => setAdvancedFilters((prev: any) => ({ ...prev, apostille: v })),
                options: [{ value: 'all', label: t('projects.filters.languages.all') }, { value: 'yes', label: t('projects.filters.yes') }, { value: 'no', label: t('projects.filters.no') }]
            },
        );

        return filters;
    }, [statusView, filter, advancedFilters, customers, partners, languages]);

    const actions = (
        <div className="flex items-center gap-2">
            <div className="relative group z-50" ref={exportRef}>
                <button onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }} className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium bg-white rounded-sm flex items-center gap-2 shadow-sm transition">
                    <FaDownload /> Exportieren
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

    if (isLoading && viewMode === 'kanban') return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-6 fade-in pb-10" onClick={() => { setIsExportOpen(false); }}>
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">Projekte</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">{t('projects.subtitle')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        onClick={() => navigate('/projects/new')}
                    >
                        <FaPlus className="text-xs" /> <span className="hidden sm:inline">{t('projects.new_project')}</span><span className="inline sm:hidden">{t('projects.new_short')}</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <KPICard
                    label={t('projects.kpi.active_projects')}
                    value={activeProjectsCount}
                    icon={<FaLayerGroup />}
                    subValue={t('projects.kpi.active_count_sub', { total: totalProjectsCount })}
                />
                <KPICard
                    label={t('projects.kpi.open_assignments')}
                    value={unassignedCount}
                    icon={<FaUserTimes />}
                    subValue={unassignedCount > 0 ? t('projects.kpi.unassigned') : t('projects.kpi.all_assigned')}
                />
                <KPICard
                    label={t('projects.kpi.profitability')}
                    value={marginPercentage > 0 ? `${marginPercentage.toFixed(1)}%` : '0%'}
                    icon={<FaChartPie />}
                    subValue={t('projects.kpi.margin_sub', { amount: totalMargin.toLocaleString(undefined, { style: 'currency', currency: 'EUR' }) })}
                />
                <KPICard
                    label={t('projects.kpi.deadline_alarm')}
                    value={urgencyCount}
                    icon={<FaExclamationTriangle />}
                    subValue={urgencyCount > 0 ? t('projects.kpi.overdue') : t('projects.kpi.on_track')}
                />
            </div>

            <div className="flex justify-end -mb-2">
                <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 overflow-hidden">
                    <button
                        onClick={() => handleSetViewMode('list')}
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
                        onClick={() => handleSetViewMode('kanban')}
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
            <div className="flex-1 flex flex-col min-h-[500px] sm:min-h-0 relative z-0">
                {viewMode === 'list' ? (
                    <DataTable
                        data={filteredProjects as any[]}
                        columns={columns as any}
                        onRowClick={(p) => navigate(`/projects/${p.id}`)}
                        searchPlaceholder={t('projects.search_placeholder')}
                        searchFields={['project_name', 'project_number'] as any[]}
                        actions={actions}
                        onAddClick={() => navigate('/projects/new')}
                        selectable
                        selectedIds={selectedProjects}
                        onSelectionChange={(ids) => setSelectedProjects(ids as string[])}
                        bulkActions={[
                            { label: t('projects.actions.bulk.complete'), icon: <FaCheck className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'completed', progress: 100 } }), variant: 'success', show: statusView === 'active' && filter !== 'completed' },
                            { label: t('projects.actions.bulk.reset'), icon: <FaArrowRight className="text-xs rotate-180" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'in_progress' } }), variant: 'default', show: statusView === 'active' && filter === 'completed' },
                            { label: t('projects.actions.bulk.send_email'), icon: <FaEnvelope className="text-xs" />, onClick: () => { if (selectedProjects.length === 1) { const p = projects.find((pro: any) => pro.id === selectedProjects[0]); navigate('/inbox', { state: { compose: true, to: p?.customer?.email, subject: `Projekt: ${p?.project_name} (${p?.project_number || 'ID ' + p?.id})`, body: `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die gewünschten Informationen zum Projekt ${p?.project_name}.\n\nMit freundlichen Grüßen\n${user?.tenant?.company_name || user?.name || ''}`, attachments: p?.files || [] } }); } }, variant: 'primary', show: selectedProjects.length === 1 && statusView === 'active' },
                            { label: t('projects.actions.bulk.archive'), icon: <FaArchive className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'archived' } }), variant: 'default', show: statusView === 'active' },
                            { label: t('projects.actions.bulk.trash'), icon: <FaTrash className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'deleted' } }), variant: 'danger', show: statusView === 'active' },
                            { label: t('projects.actions.bulk.restore'), icon: <FaTrashRestore className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedProjects, data: { status: 'in_progress' } }), variant: 'success', show: statusView === 'trash' || statusView === 'archive' },
                            { label: t('projects.actions.bulk.delete_permanent'), icon: <FaTrash className="text-xs" />, onClick: () => { setProjectToDelete(selectedProjects); setConfirmTitle(t('projects.confirm.delete_title')); setConfirmMessage(t('projects.confirm.delete_message', { count: selectedProjects.length })); setIsConfirmOpen(true); }, variant: 'dangerSolid', show: statusView === 'trash' },
                        ] as BulkActionItem[]}
                        filters={tableFilters}
                        activeFilterCount={activeFilterCount}
                        onResetFilters={resetFilters}
                    />
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col pt-4 overflow-x-hidden">
                        <div className="flex justify-between items-center mb-6 px-4">
                            <h2 className="text-xl font-medium text-slate-800 tracking-tight">{t('projects.board_title')}</h2>
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


            <ProjectFilesModal
                isOpen={isFilesModalOpen}
                onClose={() => {
                    setIsFilesModalOpen(false);
                    setViewFilesProject(null);
                }}
                project={viewFilesProject}
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
