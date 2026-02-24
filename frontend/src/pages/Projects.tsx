import { useState, useMemo, useEffect } from 'react';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaDownload, FaLayerGroup, FaChartLine, FaGlobe,
    FaCheck, FaArrowRight, FaEnvelope, FaArchive, FaTrash, FaTrashRestore
} from 'react-icons/fa';
import { buildProjectColumns } from './projectColumns';
import { useAuth } from '../context/AuthContext';
import NewProjectModal from '../components/modals/NewProjectModal';
import Switch from '../components/common/Switch';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import KanbanBoard from '../components/projects/KanbanBoard';
import ConfirmModal from '../components/common/ConfirmModal';
import { BulkActions } from '../components/common/BulkActions';
import type { MenuProps } from 'antd';
import { Segmented, Space, Dropdown, Typography, Card } from 'antd';
import { Button } from '../components/ui/button';
import { DownOutlined, FilterOutlined, PlusOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined, LayoutOutlined, TableOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;


const Projects = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [showTrash, setShowTrash] = useState(false);
    const [showArchive, setShowArchive] = useState(false);

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

    const activeProjectsData = useMemo(() => {
        return projects.filter((p: any) => {
            const s = p.status?.toLowerCase();
            return s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht';
        });
    }, [projects]);

    const totalProjectsCount = activeProjectsData.length;
    const activeProjectsCount = activeProjectsData.filter((p: any) => ['in_progress', 'review', 'ready_for_pickup'].includes(p.status)).length;
    const totalRevenue = activeProjectsData.reduce((acc: number, curr: any) => acc + parseFloat(curr.price_total || 0), 0);
    const totalMargin = activeProjectsData.reduce((acc: number, curr: any) => {
        const rev = parseFloat(curr.price_total || 0);
        const cost = parseFloat(curr.partner_cost_net || 0);
        return acc + (rev - cost);
    }, 0);

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
        triggerBlobDownload(blob, `Projekte_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
    };

    const columns = buildProjectColumns({
        selectedProjects,
        filteredProjects,
        toggleSelection,
        toggleSelectAll,
        navigate,
        bulkUpdateMutation,
        setEditingProject,
        setIsModalOpen,
        setProjectToDelete,
        setConfirmTitle,
        setConfirmMessage,
        setIsConfirmOpen,
    });

    const views = [
        { label: 'Alle Projekte', value: 'all' },
        { label: 'Neue Angebote', value: 'offer' },
        { label: 'In Bearbeitung', value: 'in_progress' },
        { label: 'Geliefert', value: 'delivered' },
        { label: 'In Rechnung', value: 'invoiced' },
        { label: 'Abholbereit', value: 'ready_for_pickup' },
        { label: 'Abgeschlossen', value: 'completed' },
        ...(showTrash || filter === 'trash' ? [{ label: 'Papierkorb', value: 'trash' }] : []),
        ...(showArchive || filter === 'archive' ? [{ label: 'Archiv', value: 'archive' }] : [])
    ];

    const exportItems: MenuProps['items'] = [
        { key: 'xlsx', label: 'Excel (.xlsx)', icon: <FileExcelOutlined className="text-emerald-600" />, onClick: () => handleExport('xlsx') },
        { key: 'csv', label: 'CSV (.csv)', icon: <FileTextOutlined className="text-blue-600" />, onClick: () => handleExport('csv') },
        { key: 'pdf', label: 'PDF Report', icon: <FilePdfOutlined className="text-red-600" />, onClick: () => handleExport('pdf') },
    ];

    const actions = (
        <Dropdown menu={{ items: exportItems }} placement="bottomRight">
            <Button className="h-9 px-4">
                <FaDownload className="mr-2" />
                Export <DownOutlined style={{ fontSize: '10px' }} />
            </Button>
        </Dropdown>
    );
    const extraControls = (
        <Dropdown
            dropdownRender={() => (
                <Card size="small" className="w-64">
                    <Text strong type="secondary" className="block mb-2 uppercase tracking-wider text-[10px]">Ansicht anpassen</Text>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Text>Papierkorb anzeigen</Text>
                            <Switch checked={showTrash} onChange={() => setShowTrash(!showTrash)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Text>Archiv anzeigen</Text>
                            <Switch checked={showArchive} onChange={() => setShowArchive(!showArchive)} />
                        </div>
                    </div>
                </Card>
            )}
            trigger={['click']}
        >
            <Button size="icon">
                <FilterOutlined />
            </Button>
        </Dropdown>
    );

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-6 fade-in pb-10">
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <Title level={4} style={{ margin: 0 }}>Projekte & Aufträge</Title>
                    <Text type="secondary">Verwalten und überwachen Sie alle Übersetzungsaufträge.</Text>
                </div>
                <Space>
                    <Button
                        variant="primary"
                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        className="h-9 px-6 font-bold"
                    >
                        <PlusOutlined className="mr-2" />
                        Neues Projekt
                    </Button>
                </Space>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label="Gesamtprojekte" value={totalProjectsCount} icon={<FaLayerGroup />} />
                <KPICard label="Aktive Projekte" value={activeProjectsCount} icon={<FaChartLine />} />
                <KPICard label="Marge gesamt" value={totalMargin.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaGlobe />} />
                <KPICard label="Umsatz YTD" value={totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaChartLine />} />
            </div>

            <div className="flex justify-end -mb-2">
                <Segmented
                    value={viewMode}
                    onChange={(v) => setViewMode(v as 'list' | 'kanban')}
                    options={[
                        { value: 'list', icon: <TableOutlined /> },
                        { value: 'kanban', icon: <LayoutOutlined /> }
                    ]}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-[500px] sm:min-h-0 relative z-0">
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
                        pageSize={10}
                        searchPlaceholder="Suchen nach Projekten..."
                        searchFields={['project_name', 'project_number']}
                        actions={actions}
                        onViewChange={(v) => setFilter(v)}
                        views={views}
                        currentView={filter}
                        extraControls={extraControls}
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
