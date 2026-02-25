import { useState, useMemo, useRef, useEffect } from 'react';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaUserTie, FaPlus, FaEye, FaEdit, FaTrash, FaStar, FaHandshake,
    FaCheck, FaBan, FaEnvelope, FaDownload, FaFileExcel, FaFileCsv, FaFilePdf, FaTrashRestore,
    FaEuroSign, FaArchive
} from 'react-icons/fa';
import clsx from 'clsx';

import NewPartnerModal from '../components/modals/NewPartnerModal';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import { Button } from '../components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerService, projectService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import { getFlagUrl, getLanguageName } from '../utils/flags';
import ConfirmModal from '../components/common/ConfirmModal';
import type { BulkActionItem } from '../components/common/BulkActions';
import StatusTabButton from '../components/common/StatusTabButton';
import { TooltipProvider } from '../components/ui/tooltip';


const Partners = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusView, setStatusView] = useState<'active' | 'archive' | 'trash'>('active');
    const [typeFilter, setTypeFilter] = useState('service_providers');
    const [selectedPartners, setSelectedPartners] = useState<number[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<any>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

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
            setEditingPartner(null);
            // Clear location state to prevent modal from reopening on refresh or navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [partnerToDelete, setPartnerToDelete] = useState<number | null>(null);

    const queryClient = useQueryClient();

    const { data: partners = [], isLoading } = useQuery({
        queryKey: ['partners'],
        queryFn: partnerService.getAll
    });

    const { data: stats } = useQuery({
        queryKey: ['partnerStats'],
        queryFn: partnerService.getStats
    });

    const createMutation = useMutation({
        mutationFn: partnerService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            toast.success('Partner erfolgreich angelegt');
        },
        onError: () => {
            toast.error('Fehler beim Anlegen des Partners');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => partnerService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            setEditingPartner(null);
            toast.success('Partner erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren des Partners');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: partnerService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedPartners([]);
            toast.success('Partner erfolgreich gelöscht');
        },
        onError: () => {
            toast.error('Fehler beim Löschen des Partners');
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: number[], data: any }) => partnerService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedPartners([]);
            toast.success(`${variables.ids.length} Partner aktualisiert`);
        },
        onError: () => {
            toast.error('Massenvorgang fehlgeschlagen');
        }
    });

    const activePartnersList = useMemo(() => {
        return partners.filter((p: any) => {
            const s = p.status?.toLowerCase();
            return s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht';
        });
    }, [partners]);

    const { data: allProjectsData } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectService.getAll()
    });

    const partnerFinancials = useMemo(() => {
        const projects = Array.isArray(allProjectsData) ? allProjectsData : (allProjectsData?.data || []);
        // Only consider projects that have a partner assigned
        const partnerProjects = projects.filter((p: any) => p.partner_id);
        const totalCost = partnerProjects.reduce((sum: number, p: any) => sum + (parseFloat(p.partner_cost_net) || 0), 0);
        const avgCost = partnerProjects.length > 0 ? totalCost / partnerProjects.length : 0;
        return { totalCost, avgCost };
    }, [allProjectsData]);

    const partnerQuality = useMemo(() => {
        const rated = activePartnersList.filter((p: any) => p.rating > 0);
        if (rated.length === 0) return 0;
        const total = rated.reduce((sum: number, p: any) => sum + (parseFloat(p.rating) || 0), 0);
        return total / rated.length;
    }, [activePartnersList]);

    const activePartnersCount = activePartnersList.length;

    // Count partners by status for badges
    const activeCount = useMemo(() => partners.filter((p: any) => {
        const s = p.status?.toLowerCase();
        return s !== 'deleted' && s !== 'gelöscht' && s !== 'archived' && s !== 'archiviert';
    }).length, [partners]);
    const archivedCount = useMemo(() => partners.filter((p: any) => {
        const s = p.status?.toLowerCase();
        return s === 'archived' || s === 'archiviert';
    }).length, [partners]);
    const trashedCount = useMemo(() => partners.filter((p: any) => {
        const s = p.status?.toLowerCase();
        return s === 'deleted' || s === 'gelöscht';
    }).length, [partners]);

    const filteredPartners = useMemo(() => {
        if (!Array.isArray(partners)) return [];
        return partners.filter((p: any) => {
            const status = p.status?.toLowerCase();

            // Priority 1: Filter by status view (active/archive/trash)
            if (statusView === 'trash') {
                if (status !== 'deleted' && status !== 'gelöscht') return false;
            } else if (statusView === 'archive') {
                if (status !== 'archived' && status !== 'archiviert') return false;
            } else {
                // Active view: exclude deleted and archived
                if (status === 'deleted' || status === 'gelöscht' || status === 'archived' || status === 'archiviert') return false;
            }

            // Priority 2: Type filter (only for active view)
            if (statusView === 'active') {
                if (typeFilter === 'all') return true;

                if (typeFilter === 'service_providers') {
                    return p.type === 'translator' || p.type === 'interpreter' || p.type === 'trans_interp';
                }

                // Map German filter names to English type values
                const mappedType = p.type === 'translator' ? 'Übersetzer' : p.type === 'interpreter' ? 'Dolmetscher' : p.type === 'trans_interp' ? 'Übersetzer & Dolmetscher' : p.type === 'agency' ? 'Agentur' : p.type;
                return mappedType === typeFilter;
            }

            return true;
        });
    }, [partners, statusView, typeFilter]);

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (filteredPartners.length === 0) return;
        const headers = ['ID', 'Partner/Firma', 'E-Mail', 'Typ', 'Bewertung', 'Status'];
        const rows = filteredPartners.map((p: any) => [
            p.id, p.company || `${p.first_name} ${p.last_name}`, p.email || '', p.type || '', p.rating || '0', p.status || ''
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, `Partner_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
        setIsExportOpen(false);
    };

    const columns = [
        {
            id: 'partner',
            header: 'Partner / Dienstleister',
            accessor: (p: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm shrink-0 bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-medium border border-indigo-100">
                        {p.first_name?.[0] || ''}{p.last_name?.[0] || 'P'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-slate-800 truncate" title={p.company || `${p.first_name} ${p.last_name}`}>{p.company || `${p.first_name} ${p.last_name}`}</span>
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-slate-400 font-medium shrink-0">{p.display_id}</span>
                            <span className="text-xs text-slate-300 shrink-0">•</span>
                            <span
                                className="text-xs text-slate-500 font-medium truncate shrink"
                                title={p.type === 'translator' ? 'Übersetzer' : p.type === 'interpreter' ? 'Dolmetscher' : p.type === 'trans_interp' ? 'Übersetzer & Dolmetscher' : p.type === 'agency' ? 'Agentur' : p.type}
                            >
                                {p.type === 'translator' ? 'Übersetzer' : p.type === 'interpreter' ? 'Dolmetscher' : p.type === 'trans_interp' ? 'Übersetzer & Dolmetscher' : p.type === 'agency' ? 'Agentur' : p.type}
                            </span>
                        </div>
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'last_name'
        },
        {
            id: 'projects_count',
            header: 'Projekte',
            accessor: (p: any) => (
                <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-slate-700">{p.projects_count || 0}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'projects_count',
            align: 'center' as const
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (p: any) => {
                const styles: { [key: string]: string } = {
                    'available': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'busy': 'bg-rose-50 text-rose-700 border-rose-200',
                    'vacation': 'bg-amber-50 text-amber-700 border-amber-200',
                    'blacklisted': 'bg-slate-900 text-white border-slate-900',
                    'archived': 'bg-slate-800 text-white border-slate-700',
                    'deleted': 'bg-red-50 text-red-700 border-red-200'
                };
                const labels: { [key: string]: string } = {
                    'available': 'Verfügbar',
                    'busy': 'Beschäftigt',
                    'vacation': 'Urlaub',
                    'blacklisted': 'Gesperrt',
                    'archived': 'Archiviert',
                    'deleted': 'Gelöscht'
                };
                const status = p.status?.toLowerCase();
                return (
                    <span className={`px-2 py-0.5 rounded-sm text-xs font-medium border tracking-tight ${styles[status] || 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {labels[status] || p.status}
                    </span>
                );
            },
            sortable: true,
            sortKey: 'status',
            align: 'center' as const
        },
        {
            id: 'languages',
            header: 'Sprachen',
            accessor: (p: any) => {
                const languages = Array.isArray(p.languages) ? p.languages : (p.languages ? [p.languages] : []);
                const visibleLangs = languages.slice(0, 2);
                const hiddenCount = languages.length - 2;

                return (
                    <div className="flex flex-col gap-1.5 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                            {visibleLangs.map((lang: string, i: number) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-200 text-xs font-medium shadow-sm whitespace-nowrap">
                                    <img src={getFlagUrl(lang)} className="w-3.5 h-2.5 object-cover rounded-[1px] shadow-sm" alt={lang} />
                                    <span className="truncate max-w-[60px]" title={getLanguageName(lang)}>{getLanguageName(lang)}</span>
                                </span>
                            ))}
                            {hiddenCount > 0 && (
                                <span
                                    className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 text-xs font-medium shadow-sm cursor-help"
                                    title={languages.slice(2).map((l: string) => getLanguageName(l)).join(', ')}
                                >
                                    +{hiddenCount}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'location',
            header: 'Standort',
            accessor: (p: any) => (
                <div className="flex flex-col max-w-[180px]">
                    <span className="text-slate-700 text-xs font-medium truncate" title={[p.address_street, p.address_house_no].filter(Boolean).join(' ')}>
                        {[p.address_street, p.address_house_no].filter(Boolean).join(' ') || '-'}
                    </span>
                    <span className="text-xs text-slate-500 truncate" title={[p.address_zip, p.address_city].filter(Boolean).join(' ')}>
                        {[p.address_zip, p.address_city].filter(Boolean).join(' ')}
                    </span>
                    <span className="text-xs text-slate-400">{p.address_country || ''}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'address_city'
        },
        {
            id: 'email',
            header: 'E-Mail',
            accessor: (p: any) => <span className="text-slate-600 truncate max-w-[150px] inline-block">{p.email || '-'}</span>,
            sortable: true,
            sortKey: 'email'
        },
        {
            id: 'phone',
            header: 'Telefon',
            accessor: (p: any) => <span className="text-slate-600 whitespace-nowrap">{p.phone || '-'}</span>,
            sortable: true,
            sortKey: 'phone'
        },
        {
            id: 'rating',
            header: 'Bewertung',
            accessor: (p: any) => (
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-600">{p.rating || 0}</span>
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                                key={star}
                                className={clsx(
                                    "text-xs",
                                    star <= (p.rating || 0) ? "text-amber-400" : "text-slate-200"
                                )}
                            />
                        ))}
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'rating',
            align: 'center' as const
        },
        {
            id: 'actions',
            header: '',
            accessor: (p: any) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/partners/${p.id}`)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title="Details"><FaEye /></button>
                    <button onClick={async () => {
                        setEditingPartner(p);
                        setIsModalOpen(true);
                        setIsDetailLoading(true);
                        try {
                            const fullData = await partnerService.getById(p.id);
                            setEditingPartner(fullData);
                        } catch (err) {
                            console.error("Failed to load partner details", err);
                        } finally {
                            setIsDetailLoading(false);
                        }
                    }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title="Bearbeiten"><FaEdit /></button>
                    <button onClick={() => { setPartnerToDelete(p.id); setIsConfirmOpen(true); }} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-sm transition" title="Löschen"><FaTrash /></button>
                </div>
            ),
            align: 'right' as const
        }
    ];

    const actions = (
        <div className="relative group z-50" ref={exportRef}>
            <button onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }} className="px-3 py-1.5 border border-slate-200 rounded-sm text-slate-600 hover:bg-slate-50 text-xs font-medium bg-white flex items-center gap-2 shadow-sm transition">
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
    );

    const statusTabs = (
        <TooltipProvider>
            <div className="flex items-center gap-2 mb-4">
                <StatusTabButton
                    active={statusView === 'active'}
                    onClick={() => { setStatusView('active'); setTypeFilter('service_providers'); }}
                    icon={<FaHandshake />}
                    label="Aktiv"
                    count={activeCount}
                />
                <StatusTabButton
                    active={statusView === 'archive'}
                    onClick={() => setStatusView('archive')}
                    icon={<FaArchive />}
                    label="Archiv"
                    count={archivedCount}
                />
                <StatusTabButton
                    active={statusView === 'trash'}
                    onClick={() => setStatusView('trash')}
                    icon={<FaTrash />}
                    label="Papierkorb"
                    count={trashedCount}
                />
            </div>
        </TooltipProvider>
    );

    const tabs = statusView === 'active' ? (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1">
            <button
                onClick={() => setTypeFilter('service_providers')}
                className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${typeFilter === 'service_providers' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                Alle
            </button>
            <button
                onClick={() => setTypeFilter('Übersetzer')}
                className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${typeFilter === 'Übersetzer' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                Übersetzer
            </button>
            <button
                onClick={() => setTypeFilter('Dolmetscher')}
                className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${typeFilter === 'Dolmetscher' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                Dolmetscher
            </button>
            <button
                onClick={() => setTypeFilter('Agentur')}
                className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${typeFilter === 'Agentur' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                Agenturen
            </button>
        </div>
    ) : null;

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-6 fade-in pb-10" onClick={() => setIsExportOpen(false)}>
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">Partnernetzwerk</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">Verwaltung externer Übersetzer, Dolmetscher und Agenturen.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        onClick={() => { setEditingPartner(null); setIsModalOpen(true); }}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-sm flex items-center justify-center gap-2 transition"
                    >
                        <FaPlus className="text-xs" /> <span className="hidden sm:inline">Neuer Partner</span><span className="inline sm:hidden">Neu</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label="Aktive Partner" value={activePartnersCount} icon={<FaUserTie />} />
                <KPICard
                    label="Partner Kosten"
                    value={partnerFinancials.totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    icon={<FaEuroSign />}
                    iconColor="text-rose-600"
                    subValue={`Ø ${partnerFinancials.avgCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} / Projekt`}
                />
                <KPICard
                    label="Qualitätsschnitt"
                    value={`${partnerQuality.toFixed(1)} / 5.0`}
                    icon={<FaStar />}
                    iconColor="text-amber-500"
                    subValue="Durchschnittliche Bewertung"
                />
                <KPICard label="Zusammenarbeit" value={stats?.collaboration_count || 0} icon={<FaHandshake />} iconColor="text-green-600" subValue="Projekte diesen Monat" />
            </div>

            {statusTabs}

            <div className="flex-1 flex flex-col min-h-[500px] sm:min-h-0 relative z-0">
                <DataTable
                    data={filteredPartners}
                    columns={columns as any}
                    onRowClick={(p) => navigate(`/partners/${p.id}`)}
                    pageSize={10}
                    searchPlaceholder="Partner nach Name, Sprache oder E-Mail suchen..."
                    searchFields={['first_name', 'last_name', 'company', 'email']}
                    actions={actions}
                    tabs={tabs}
                    onAddClick={() => { setEditingPartner(null); setIsModalOpen(true); }}
                    selectable
                    selectedIds={selectedPartners}
                    onSelectionChange={(ids) => setSelectedPartners(ids as number[])}
                    bulkActions={[
                        {
                            label: 'Aktivieren',
                            icon: <FaCheck className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedPartners, data: { status: 'available' } }),
                            variant: 'success',
                            show: statusView === 'active'
                        },
                        {
                            label: 'E-Mail senden',
                            icon: <FaEnvelope className="text-xs" />,
                            onClick: () => {
                                const selectedEmails = partners
                                    .filter((p: any) => selectedPartners.includes(p.id))
                                    .map((p: any) => p.email)
                                    .filter(Boolean)
                                    .join(', ');
                                if (selectedEmails) {
                                    navigate('/inbox', { state: { compose: true, to: selectedEmails, subject: 'Nachricht an Partner' } });
                                }
                            },
                            variant: 'primary',
                            show: statusView === 'active'
                        },
                        {
                            label: 'Sperren',
                            icon: <FaBan className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedPartners, data: { status: 'blacklisted' } }),
                            variant: 'danger',
                            show: statusView === 'active'
                        },
                        {
                            label: 'Archivieren',
                            icon: <FaArchive className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedPartners, data: { status: 'archived' } }),
                            variant: 'default',
                            show: statusView === 'active'
                        },
                        {
                            label: 'Löschen',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedPartners, data: { status: 'deleted' } }),
                            variant: 'danger',
                            show: statusView === 'active'
                        },
                        {
                            label: 'Wiederherstellen',
                            icon: <FaTrashRestore className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedPartners, data: { status: 'available' } }),
                            variant: 'success',
                            show: statusView === 'trash' || statusView === 'archive'
                        }
                    ] as BulkActionItem[]}
                />
            </div>

            <NewPartnerModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingPartner(null); }}
                onSubmit={(data) => {
                    if (editingPartner) {
                        updateMutation.mutate({ ...data, id: editingPartner.id });
                    } else {
                        createMutation.mutate(data);
                    }
                }}
                initialData={editingPartner || (
                    ['Übersetzer', 'Dolmetscher', 'Agentur', 'service_providers'].includes(typeFilter)
                        ? { type: typeFilter === 'Übersetzer' ? 'translator' : typeFilter === 'Dolmetscher' ? 'interpreter' : typeFilter === 'service_providers' ? 'trans_interp' : 'agency' }
                        : undefined
                )}
                isLoading={isDetailLoading || createMutation.isPending || updateMutation.isPending}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => { setIsConfirmOpen(false); setPartnerToDelete(null); }}
                onConfirm={() => {
                    if (partnerToDelete) {
                        deleteMutation.mutate(partnerToDelete, {
                            onSuccess: () => {
                                setIsConfirmOpen(false);
                                setPartnerToDelete(null);
                            }
                        });
                    }
                }}
                title="Partner löschen"
                message="Sind Sie sicher, dass Sie diesen Partner in den Papierkorb verschieben möchten? Dieser Vorgang kann später im Papierkorb endgültig gelöscht oder wiederhergestellt werden."
                isLoading={deleteMutation.isPending}
            />
        </div >
    );
};

export default Partners;
