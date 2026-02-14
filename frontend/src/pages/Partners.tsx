import { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaUserTie, FaPlus, FaEye, FaEdit, FaTrash, FaGlobe, FaStar, FaHandshake,
    FaCheck, FaBan, FaEnvelope, FaDownload, FaFileExcel, FaFileCsv, FaFilePdf, FaTrashRestore, FaFilter
} from 'react-icons/fa';
import clsx from 'clsx';

import Checkbox from '../components/common/Checkbox';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import Switch from '../components/common/Switch';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import { getFlagUrl } from '../utils/flags';
import ConfirmModal from '../components/common/ConfirmModal';
import { BulkActions } from '../components/common/BulkActions';


const Partners = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedPartners, setSelectedPartners] = useState<number[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<any>(null);
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

    const activePartnersCount = activePartnersList.length;
    const languagePairsCount = useMemo(() => {
        const pairs = new Set();
        activePartnersList.forEach((p: any) => {
            if (Array.isArray(p.languages)) {
                p.languages.forEach((l: string) => pairs.add(l));
            } else if (p.languages) {
                pairs.add(p.languages);
            }
        });
        return pairs.size;
    }, [activePartnersList]);

    const filteredPartners = useMemo(() => {
        if (!Array.isArray(partners)) return [];
        return partners.filter((p: any) => {
            const status = p.status?.toLowerCase();

            if (typeFilter === 'trash') return status === 'deleted' || status === 'gelöscht';
            if (typeFilter === 'archive') return status === 'archived' || status === 'archiviert';

            // For all other tabs, exclude deleted and archived
            if (status === 'deleted' || status === 'gelöscht' || status === 'archived' || status === 'archiviert') return false;

            if (typeFilter === 'all') return true;

            const mappedType = p.type === 'translator' ? 'Übersetzer' : p.type === 'interpreter' ? 'Dolmetscher' : p.type === 'agency' ? 'Agentur' : p.type;
            return mappedType === typeFilter;
        });
    }, [partners, typeFilter]);

    const toggleSelection = (id: number) => {
        setSelectedPartners(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedPartners.length === filteredPartners.length) {
            setSelectedPartners([]);
        } else {
            setSelectedPartners(filteredPartners.map(p => p.id));
        }
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (filteredPartners.length === 0) return;
        const headers = ['ID', 'Partner/Firma', 'E-Mail', 'Typ', 'Bewertung', 'Status'];
        const rows = filteredPartners.map((p: any) => [
            p.id, p.company || `${p.first_name} ${p.last_name}`, p.email || '', p.type || '', p.rating || '0', p.status || ''
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Partner_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportOpen(false);
    };

    const columns = [
        {
            id: 'selection',
            header: (
                <Checkbox checked={selectedPartners.length === filteredPartners.length && filteredPartners.length > 0} onChange={toggleSelectAll} />
            ),
            accessor: (p: any) => (
                <Checkbox checked={selectedPartners.includes(p.id)} onChange={() => toggleSelection(p.id)} />
            ),
            className: 'w-10'
        },
        {
            id: 'partner',
            header: 'Partner / Dienstleister',
            accessor: (p: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md shrink-0 bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-indigo-100">
                        {p.first_name?.[0] || ''}{p.last_name?.[0] || 'P'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 truncate">{p.company || `${p.first_name} ${p.last_name}`}</span>
                        <div className="flex gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">ID: {p.id.toString().padStart(4, '0')}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500 font-medium">{p.type}</span>
                        </div>
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'last_name'
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
            id: 'domains',
            header: 'Fachgebiete',
            accessor: (p: any) => (
                <div className="max-w-[120px]">
                    <p className="text-[10px] text-slate-500 truncate" title={Array.isArray(p.domains) ? p.domains.join(', ') : (p.domains || '-')}>
                        {Array.isArray(p.domains) ? p.domains.join(', ') : (p.domains || '-')}
                    </p>
                </div>
            )
        },
        {
            id: 'languages',
            header: 'Sprachen',
            accessor: (p: any) => (
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(p.languages) ? p.languages : (p.languages ? [p.languages] : [])).map((lang: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-2 px-2 py-1 bg-slate-50 text-slate-700 rounded border border-slate-200 text-[10px] font-bold uppercase shadow-sm">
                                <img src={getFlagUrl(lang)} className="w-5 h-3.5 object-cover rounded-[1px] shadow-sm" alt={lang} />
                                {lang}
                            </span>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: 'location',
            header: 'Standort',
            accessor: (p: any) => (
                <div className="flex flex-col">
                    <span className="text-slate-700 text-xs font-medium">{p.address_city || '-'}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{p.address_country || ''}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'address_city'
        },
        {
            id: 'projects_count',
            header: 'Projekte',
            accessor: (p: any) => (
                <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-slate-700">{p.projects_count || 0}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'projects_count',
            align: 'center' as const
        },
        {
            id: 'rating',
            header: 'Bewertung',
            accessor: (p: any) => (
                <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                            key={star}
                            className={clsx(
                                "text-[10px]",
                                star <= (p.rating || 0) ? "text-amber-400" : "text-slate-200"
                            )}
                        />
                    ))}
                </div>
            ),
            sortable: true,
            sortKey: 'rating',
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
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border tracking-tight ${styles[status] || 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {labels[status] || p.status}
                    </span>
                );
            },
            sortable: true,
            sortKey: 'status',
            align: 'center' as const
        },
        {
            id: 'actions',
            header: '',
            accessor: (p: any) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/partners/${p.id}`)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition" title="Details"><FaEye /></button>
                    <button onClick={() => { setEditingPartner(p); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition" title="Bearbeiten"><FaEdit /></button>
                    <button onClick={() => { setPartnerToDelete(p.id); setIsConfirmOpen(true); }} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Löschen"><FaTrash /></button>
                </div>
            ),
            align: 'right' as const
        }
    ];

    const actions = (
        <div className="relative group z-50" ref={exportRef}>
            <button onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }} className="px-3 py-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest bg-white flex items-center gap-2 shadow-sm transition">
                <FaDownload /> Export
            </button>
            {isExportOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-xl border border-slate-100 z-[100] overflow-hidden animate-slideUp">
                    <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"><FaFileExcel className="text-emerald-600 text-sm" /> Excel (.xlsx)</button>
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"><FaFileCsv className="text-blue-600 text-sm" /> CSV (.csv)</button>
                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 border-t border-slate-50 transition"><FaFilePdf className="text-red-600 text-sm" /> PDF Report</button>
                </div>
            )}
        </div>
    );

    const tabs = (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1">
            <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${typeFilter === 'all' ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                Alle
            </button>
            <button
                onClick={() => setTypeFilter('Übersetzer')}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${typeFilter === 'Übersetzer' ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                Übersetzer
            </button>
            <button
                onClick={() => setTypeFilter('Dolmetscher')}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${typeFilter === 'Dolmetscher' ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                Dolmetscher
            </button>
            <button
                onClick={() => setTypeFilter('Agentur')}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${typeFilter === 'Agentur' ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                Agenturen
            </button>

            {(showTrash || typeFilter === 'trash') && (
                <button
                    onClick={() => setTypeFilter('trash')}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${typeFilter === 'trash' ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                    Papierkorb
                </button>
            )}

            {(showArchive || typeFilter === 'archive') && (
                <button
                    onClick={() => setTypeFilter('archive')}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${typeFilter === 'archive' ? 'bg-slate-600 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                    Archiv
                </button>
            )}
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
        <div className="flex flex-col gap-6 fade-in pb-10" onClick={() => setIsExportOpen(false)}>
            <div className="flex justify-between items-center sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Partnernetzwerk</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">Verwaltung externer Übersetzer, Dolmetscher und Agenturen.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setEditingPartner(null); setIsModalOpen(true); }} className="bg-brand-700 hover:bg-brand-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-sm font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition active:scale-95">
                        <FaPlus className="text-[10px]" /> <span className="hidden sm:inline">Neuer Partner</span><span className="inline sm:hidden">Partner</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <KPICard label="Aktive Partner" value={activePartnersCount} icon={<FaUserTie />} />
                <KPICard label="Sprachabdeckung" value={languagePairsCount} icon={<FaGlobe />} iconColor="text-blue-600" iconBg="bg-blue-50" subValue="Verfügbare Sprachpaare" />
                <KPICard label="Zusammenarbeit" value={stats?.collaboration_count || 0} icon={<FaHandshake />} iconColor="text-green-600" iconBg="bg-green-50" subValue="Projekte diesen Monat" />
            </div>

            <div className="flex-1 flex flex-col min-h-[500px] sm:min-h-0 relative z-0">
                <BulkActions
                    selectedCount={selectedPartners.length}
                    onClearSelection={() => setSelectedPartners([])}
                    actions={[
                        {
                            label: 'Aktivieren',
                            icon: <FaCheck className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedPartners, data: { status: 'available' } }),
                            variant: 'success',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'E-Mail senden',
                            icon: <FaEnvelope className="text-xs" />,
                            onClick: () => {
                                // Get emails from selected partners
                                const selectedEmails = partners
                                    .filter((p: any) => selectedPartners.includes(p.id))
                                    .map((p: any) => p.email)
                                    .filter(Boolean)
                                    .join(', ');

                                if (selectedEmails) {
                                    navigate('/inbox', {
                                        state: {
                                            compose: true,
                                            to: selectedEmails,
                                            subject: 'Nachricht an Partner'
                                        }
                                    });
                                }
                            },
                            variant: 'primary',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'Sperren',
                            icon: <FaBan className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedPartners, data: { status: 'blacklisted' } }),
                            variant: 'danger',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'Wiederherstellen',
                            icon: <FaTrashRestore className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedPartners, data: { status: 'available' } }),
                            variant: 'success',
                            show: typeFilter === 'trash'
                        },
                        {
                            label: 'Löschen',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedPartners, data: { status: 'deleted' } }),
                            variant: 'danger',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'Endgültig löschen',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => {
                                // Bulk permanent delete not implemented in frontend yet
                            },
                            variant: 'dangerSolid',
                            show: false
                        }
                    ]}
                />

                <DataTable
                    data={filteredPartners}
                    columns={columns as any}
                    onRowClick={(p) => navigate(`/partners/${p.id}`)}
                    pageSize={10}
                    searchPlaceholder="Partner nach Name, Sprache oder E-Mail suchen..."
                    searchFields={['first_name', 'last_name', 'company', 'email']}
                    actions={actions}
                    tabs={tabs}
                    extraControls={extraControls}
                    onAddClick={() => { setEditingPartner(null); setIsModalOpen(true); }}
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
                    ['Übersetzer', 'Dolmetscher', 'Agentur'].includes(typeFilter)
                        ? { type: typeFilter === 'Übersetzer' ? 'translator' : typeFilter === 'Dolmetscher' ? 'interpreter' : 'agency' }
                        : undefined
                )}
                isLoading={createMutation.isPending || updateMutation.isPending}
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
        </div>
    );
};

export default Partners;
