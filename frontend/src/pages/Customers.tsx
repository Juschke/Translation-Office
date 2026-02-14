import { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    FaUsers, FaBriefcase, FaChartLine, FaPlus, FaEye, FaEdit, FaTrash,
    FaCheck, FaBan, FaEnvelope, FaDownload, FaFileExcel, FaFileCsv, FaFilePdf, FaTrashRestore, FaFilter
} from 'react-icons/fa';


import NewCustomerModal from '../components/modals/NewCustomerModal';
import Checkbox from '../components/common/Checkbox';
import Switch from '../components/common/Switch';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import ConfirmModal from '../components/common/ConfirmModal';
import { BulkActions } from '../components/common/BulkActions';


const Customers = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
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
    // deleted/archived states removed in favor of typeFilter

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<number | number[] | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const queryClient = useQueryClient();

    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getAll
    });

    const { data: stats } = useQuery({
        queryKey: ['customerStats'],
        queryFn: customerService.getStats
    });

    const createMutation = useMutation({
        mutationFn: customerService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            toast.success('Kunde erfolgreich angelegt');
        },
        onError: () => {
            toast.error('Fehler beim Anlegen des Kunden');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => customerService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            setEditingCustomer(null);
            toast.success('Kunde erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren des Kunden');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: customerService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success('Kunde erfolgreich gelöscht');
        },
        onError: () => {
            toast.error('Fehler beim Löschen des Kunden');
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: number[], data: any }) => customerService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success(`${variables.ids.length} Kunden aktualisiert`);
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren der Kunden');
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: customerService.bulkDelete,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success(`${variables.length} Kunden endgültig gelöscht`);
        },
        onError: () => {
            toast.error('Fehler beim endgültigen Löschen');
        }
    });

    const activeCustomersData = useMemo(() => {
        return customers.filter((c: any) => {
            const s = c.status?.toLowerCase();
            return s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht';
        });
    }, [customers]);

    const activeCustomersCount = activeCustomersData.length;


    const filteredCustomers = useMemo(() => {
        if (!Array.isArray(customers)) return [];
        return customers.filter((c: any) => {
            const status = c.status?.toLowerCase();

            if (typeFilter === 'trash') return status === 'deleted' || status === 'gelöscht';
            if (typeFilter === 'archive') return status === 'archived' || status === 'archiviert';

            // For all other tabs, exclude deleted and archived
            if (status === 'deleted' || status === 'gelöscht' || status === 'archived' || status === 'archiviert') return false;

            if (typeFilter === 'all') return true;

            const mappedType = c.type === 'company' ? 'Firma' : c.type === 'private' ? 'Privat' : c.type === 'authority' ? 'Behörde' : c.type;
            return mappedType === typeFilter;
        });
    }, [customers, typeFilter]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
    };

    const toggleSelection = (id: number) => {
        setSelectedCustomers(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedCustomers.length === filteredCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(filteredCustomers.map(c => c.id));
        }
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (filteredCustomers.length === 0) return;

        const headers = ['ID', 'Unternehmen/Name', 'Ansprechpartner', 'E-Mail', 'Umsatz', 'Status'];
        const rows = filteredCustomers.map((c: any) => [
            c.id,
            c.company_name || `${c.first_name} ${c.last_name}`,
            c.contact_person || '',
            c.email || '',
            c.sales || '0',
            c.status || ''
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Kunden_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
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
                <Checkbox
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={toggleSelectAll}
                />
            ),
            accessor: (c: any) => (
                <Checkbox
                    checked={selectedCustomers.includes(c.id)}
                    onChange={() => toggleSelection(c.id)}
                />
            ),
            className: 'w-10'
        },
        {
            id: 'company',
            header: 'Unternehmen',
            accessor: (c: any) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 shrink-0 bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-semibold border-slate-100 border rounded-md`}>
                        {c.company_name?.substring(0, 2).toUpperCase() || c.last_name?.substring(0, 2).toUpperCase() || 'CU'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-800 truncate">{c.company_name || `${c.first_name} ${c.last_name}`}</span>
                        <div className="flex gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">ID: {c.id.toString().padStart(4, '0')}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500 font-medium">{c.type}</span>
                        </div>
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'company_name'
        },
        {
            id: 'contact',
            header: 'Ansprechpartner',
            accessor: (c: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-700">{c.contact_person || `${c.first_name} ${c.last_name}`}</span>
                    <span className="text-xs text-slate-500">{c.email}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'contact_person'
        },
        {
            id: 'address',
            header: 'Adresse',
            accessor: (c: any) => (
                <div className="flex flex-col max-w-[150px]">
                    <span className="text-slate-700 truncate">{c.address_street} {c.address_house_no}</span>
                    <span className="text-[10px] text-slate-400 truncate">{c.address_zip} {c.address_city}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'address_city'
        },
        {
            id: 'phone',
            header: 'Telefon',
            accessor: (c: any) => <span className="text-slate-600">{c.phone || '-'}</span>,
            sortable: true,
            sortKey: 'phone'
        },
        {
            id: 'projects_count',
            header: 'Projekte',
            accessor: (c: any) => (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {c.projects_count || 0}
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'projects_count',
            align: 'center' as const
        },
        {
            id: 'sales',
            header: 'Umsatz (YTD)',
            accessor: (c: any) => <span className="font-semibold text-slate-800">{formatCurrency(c.sales || 0)}</span>,
            sortable: true,
            sortKey: 'sales',
            align: 'right' as const
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (c: any) => {
                const statusStyles: { [key: string]: string } = {
                    'active': 'bg-emerald-50 text-emerald-700 border-emerald-100', // Lighter border
                    'inactive': 'bg-slate-50 text-slate-400 border-slate-200',
                    'deleted': 'bg-red-50 text-red-700 border-red-200',
                    'archived': 'bg-slate-800 text-white border-slate-700'
                };
                const labels: { [key: string]: string } = {
                    'active': 'Aktiv',
                    'inactive': 'Inaktiv',
                    'deleted': 'Gelöscht',
                    'archived': 'Archiviert'
                };
                const displayStatus = c.status === 'Aktiv' ? 'active' : c.status === 'Inaktiv' ? 'inactive' : c.status?.toLowerCase();
                return (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border tracking-tight ${statusStyles[displayStatus] || 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {labels[displayStatus] || c.status}
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
            accessor: (c: any) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/customers/${c.id}`)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition" title="Details"><FaEye /></button>
                    <button onClick={() => { setEditingCustomer(c); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition" title="Bearbeiten"><FaEdit /></button>
                    <button onClick={() => {
                        setCustomerToDelete(c.id);
                        setConfirmTitle('Kunde löschen');
                        setConfirmMessage('Sind Sie sicher, dass Sie diesen Kunden in den Papierkorb verschieben möchten?');
                        setIsConfirmOpen(true);
                    }} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Löschen"><FaTrash /></button>
                </div>
            ),
            align: 'right' as const
        }
    ];

    const actions = (
        <div className="relative group z-50" ref={exportRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest bg-white rounded-md flex items-center gap-2 shadow-sm transition"
            >
                <FaDownload /> Export
            </button>
            {isExportOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-xl border border-slate-100 z-[100] overflow-hidden animate-slideUp">
                    <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition">
                        <FaFileExcel className="text-emerald-600 text-sm" /> Excel (.xlsx)
                    </button>
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition">
                        <FaFileCsv className="text-blue-600 text-sm" /> CSV (.csv)
                    </button>
                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 border-t border-slate-50 transition">
                        <FaFilePdf className="text-red-600 text-sm" /> PDF Report
                    </button>
                </div>
            )}
        </div>
    );

    const tabs = (
        <div className="flex items-center gap-6">
            <button
                onClick={() => setTypeFilter('all')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'all' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Alle Kunden
            </button>
            <button
                onClick={() => setTypeFilter('Firma')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'Firma' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Firmen
            </button>
            <button
                onClick={() => setTypeFilter('Privat')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'Privat' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Privat
            </button>
            <button
                onClick={() => setTypeFilter('Behörde')}
                className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'Behörde' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Behörden
            </button>

            {(showTrash || typeFilter === 'trash') && (
                <button
                    onClick={() => setTypeFilter('trash')}
                    className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'trash' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Papierkorb
                </button>
            )}

            {(showArchive || typeFilter === 'archive') && (
                <button
                    onClick={() => setTypeFilter('archive')}
                    className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${typeFilter === 'archive' ? 'border-slate-600 text-slate-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
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
        <div className="flex flex-col gap-6 h-full fade-in" onClick={() => { setIsExportOpen(false); }}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Kundenstamm</h1>
                    <p className="text-slate-500 text-sm">Zentralverwaltung aller Auftraggeber und Rechnungsadressen.</p>
                </div>
                <button
                    onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
                    className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
                >
                    <FaPlus className="text-xs" /> Neuer Kunde
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard label="Gesamtkunden" value={stats?.total_active || activeCustomersCount} icon={<FaUsers />} />
                <KPICard label="Top Auftraggeber" value={stats?.top_customer || '-'} icon={<FaBriefcase />} iconColor="text-blue-600" iconBg="bg-blue-50" subValue="Höchster Umsatz YTD" />
                <KPICard
                    label="Umsatz YTD"
                    value={formatCurrency(stats?.total_revenue_ytd || 0)}
                    icon={<FaChartLine />}
                    iconColor="text-green-600"
                    iconBg="bg-green-50"
                    trend={stats?.revenue_trend !== undefined ? {
                        value: `${stats.revenue_trend > 0 ? '+' : ''}${stats.revenue_trend}%`,
                        label: 'vs. Vorjahr',
                        isPositive: stats.revenue_trend >= 0
                    } : undefined}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-0">
                <BulkActions
                    selectedCount={selectedCustomers.length}
                    onClearSelection={() => setSelectedCustomers([])}
                    actions={[
                        {
                            label: 'Aktivieren',
                            icon: <FaCheck className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Aktiv' } }),
                            variant: 'success',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'E-Mail senden',
                            icon: <FaEnvelope className="text-xs" />,
                            onClick: () => {
                                // Get emails from selected customers
                                const selectedEmails = customers
                                    .filter((c: any) => selectedCustomers.includes(c.id))
                                    .map((c: any) => c.email)
                                    .filter(Boolean)
                                    .join(', ');

                                if (selectedEmails) {
                                    navigate('/inbox', {
                                        state: {
                                            compose: true,
                                            to: selectedEmails,
                                            subject: 'Nachricht an Kunden'
                                        }
                                    });
                                }
                            },
                            variant: 'primary',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'Deaktivieren',
                            icon: <FaBan className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Inaktiv' } }),
                            variant: 'danger',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'Wiederherstellen',
                            icon: <FaTrashRestore className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Aktiv' } }),
                            variant: 'success',
                            show: typeFilter === 'trash'
                        },
                        {
                            label: 'Löschen',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Gelöscht' } }),
                            variant: 'danger',
                            show: typeFilter !== 'trash'
                        },
                        {
                            label: 'Endgültig löschen',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => {
                                setCustomerToDelete(selectedCustomers);
                                setConfirmTitle('Kunden endgültig löschen');
                                setConfirmMessage(`Sind Sie sicher, dass Sie ${selectedCustomers.length} Kunden endgültig löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.`);
                                setIsConfirmOpen(true);
                            },
                            variant: 'dangerSolid',
                            show: typeFilter === 'trash'
                        }
                    ]}
                />


                <DataTable
                    data={filteredCustomers}
                    columns={columns as any}
                    onRowClick={(c) => navigate(`/customers/${c.id}`)}
                    pageSize={10}
                    searchPlaceholder="Kunden nach Name, Kontakt oder E-Mail suchen..."
                    searchFields={['company_name', 'contact_person', 'email']}
                    actions={actions}
                    tabs={tabs}
                    extraControls={extraControls}
                    onAddClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
                />
            </div>

            <NewCustomerModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
                onSubmit={(data) => {
                    if (editingCustomer) {
                        updateMutation.mutate({ ...data, id: editingCustomer.id });
                    } else {
                        createMutation.mutate(data);
                    }
                }}
                initialData={editingCustomer || (
                    typeFilter === 'Firma' ? { type: 'company' } as any :
                        typeFilter === 'Privat' ? { type: 'private' } as any :
                            typeFilter === 'Behörde' ? { type: 'authority' } as any :
                                undefined
                )}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setCustomerToDelete(null);
                }}
                onConfirm={() => {
                    if (customerToDelete) {
                        if (Array.isArray(customerToDelete)) {
                            bulkDeleteMutation.mutate(customerToDelete, {
                                onSuccess: () => {
                                    setIsConfirmOpen(false);
                                    setCustomerToDelete(null);
                                }
                            });
                        } else {
                            deleteMutation.mutate(customerToDelete as number, {
                                onSuccess: () => {
                                    setIsConfirmOpen(false);
                                    setCustomerToDelete(null);
                                }
                            });
                        }
                    }
                }}
                title={confirmTitle}
                message={confirmMessage}
                isLoading={deleteMutation.isPending || bulkDeleteMutation.isPending}
            />
        </div>
    );
};

export default Customers;
