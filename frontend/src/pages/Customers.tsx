import { useState, useMemo, useRef, useEffect } from 'react';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaUsers, FaBriefcase, FaChartLine, FaPlus, FaEye, FaEdit, FaTrash,
    FaCheck, FaBan, FaEnvelope, FaDownload, FaFileExcel, FaFileCsv, FaFilePdf, FaTrashRestore, FaUserPlus, FaArchive
} from 'react-icons/fa';


import NewCustomerModal from '../components/modals/NewCustomerModal';
import KPICard from '../components/common/KPICard';
import StatusBadge from '../components/common/StatusBadge';
import DataTable, { type FilterDef } from '../components/common/DataTable';
import { Button } from '../components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import ConfirmModal from '../components/common/ConfirmModal';
import type { BulkActionItem } from '../components/common/BulkActions';
import { useTranslation } from 'react-i18next';


const Customers = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusView, setStatusView] = useState<'active' | 'archive' | 'trash'>('active');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
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
            setEditingCustomer(null);
            // Clear location state to prevent modal from reopening on refresh or navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);
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
            toast.success(t('customers.messages.create_success'));
        },
        onError: () => {
            toast.error(t('customers.messages.create_error'));
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => customerService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            setEditingCustomer(null);
            toast.success(t('customers.messages.update_success'));
        },
        onError: () => {
            toast.error(t('customers.messages.update_error'));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: customerService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success(t('customers.messages.delete_success'));
        },
        onError: () => {
            toast.error(t('customers.messages.delete_error'));
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: number[], data: any }) => customerService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success(t('customers.messages.bulk_update_success', { count: variables.ids.length }));
        },
        onError: () => {
            toast.error(t('customers.messages.bulk_update_error'));
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: customerService.bulkDelete,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success(t('customers.messages.bulk_delete_success', { count: variables.length }));
        },
        onError: () => {
            toast.error(t('customers.messages.bulk_delete_error'));
        }
    });

    const activeCustomersData = useMemo(() => {
        return customers.filter((c: any) => {
            const s = c.status?.toLowerCase();
            return s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht';
        });
    }, [customers]);

    const activeCustomersCount = activeCustomersData.length;

    const newCustomersCount = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return activeCustomersData.filter((c: any) => new Date(c.created_at) >= thirtyDaysAgo).length;
    }, [activeCustomersData]);


    const filteredCustomers = useMemo(() => {
        if (!Array.isArray(customers)) return [];
        return customers.filter((c: any) => {
            const status = c.status?.toLowerCase();

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

                const mappedType = c.type === 'company' ? 'Firma' : c.type === 'private' ? 'Privat' : c.type === 'authority' ? 'Behörde' : c.type;
                return mappedType === typeFilter;
            }

            return true;
        });
    }, [customers, statusView, typeFilter]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
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
        triggerBlobDownload(blob, `Kunden_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
        setIsExportOpen(false);
    };

    const columns = [
        {
            id: 'company',
            header: t('customers.table.company'),
            accessor: (c: any) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 shrink-0 bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold border-slate-100 border rounded-sm`}>
                        {c.company_name?.substring(0, 2).toUpperCase() || c.last_name?.substring(0, 2).toUpperCase() || 'CU'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-800 truncate">{c.company_name || `${c.first_name} ${c.last_name}`}</span>
                        <div className="flex gap-2">
                            <span className="text-xs text-slate-400 font-medium">ID: {c.display_id}</span>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs text-slate-500 font-medium">{c.type}</span>
                        </div>
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'company_name'
        },
        {
            id: 'contact',
            header: t('customers.table.contact'),
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
            header: t('customers.table.address'),
            accessor: (c: any) => (
                <div className="flex flex-col max-w-[150px]">
                    <span className="text-slate-700 truncate">{c.address_street} {c.address_house_no}</span>
                    <span className="text-xs text-slate-400 truncate">{c.address_zip} {c.address_city}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'address_city'
        },
        {
            id: 'phone',
            header: t('customers.table.phone'),
            accessor: (c: any) => <span className="text-slate-600">{c.phone || '-'}</span>,
            sortable: true,
            sortKey: 'phone'
        },
        {
            id: 'projects_count',
            header: t('customers.table.projects'),
            accessor: (c: any) => (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-sm bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
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
            header: t('customers.table.sales'),
            accessor: (c: any) => <span className="font-semibold text-slate-800">{formatCurrency(c.sales || 0)}</span>,
            sortable: true,
            sortKey: 'sales',
            align: 'right' as const
        },
        {
            id: 'status',
            header: t('common.status'),
            accessor: (c: any) => <StatusBadge status={c.status} type="customer" />,
            sortable: true,
            sortKey: 'status',
            align: 'center' as const
        },
        {
            id: 'actions',
            header: '',
            accessor: (c: any) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/customers/${c.id}`)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title="Details"><FaEye /></button>
                    <button onClick={async () => {
                        setEditingCustomer(c);
                        setIsModalOpen(true);
                        setIsDetailLoading(true);
                        try {
                            const fullData = await customerService.getById(c.id);
                            setEditingCustomer(fullData);
                        } catch (err) {
                            // Error already handled by axios interceptor
                        } finally {
                            setIsDetailLoading(false);
                        }
                    }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title="Bearbeiten"><FaEdit /></button>
                    <button onClick={() => {
                        setCustomerToDelete(c.id);
                        setConfirmTitle(t('customers.status.deleted'));
                        setConfirmMessage(t('customers.confirm.delete_message', { count: 1 }));
                        setIsConfirmOpen(true);
                    }} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-sm transition" title={t('actions.delete')}><FaTrash /></button>
                </div>
            ),
            align: 'right' as const
        }
    ];


    const activeFilterCount = (statusView !== 'active' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0);
    const resetFilters = () => {
        setStatusView('active');
        setTypeFilter('all');
    };

    const tableFilters: FilterDef[] = [
        {
            id: 'statusView', label: t('projects.filters.status_view'), type: 'select' as const, value: statusView, onChange: (v: any) => { setStatusView(v as 'active' | 'archive' | 'trash'); setTypeFilter('all'); },
            options: [{ value: 'active', label: t('projects.filters.active') }, { value: 'archive', label: t('projects.filters.archive') }, { value: 'trash', label: t('projects.filters.trash') }]
        },
        ...(statusView === 'active' ? [{
            id: 'type', label: t('customers.filters.type'), type: 'select' as const, value: typeFilter, onChange: (v: any) => setTypeFilter(v),
            options: [
                { value: 'all', label: t('customers.filters.types.all') },
                { value: 'Firma', label: t('customers.filters.types.company') },
                { value: 'Privat', label: t('customers.filters.types.private') },
                { value: 'Behörde', label: t('customers.filters.types.authority') }
            ]
        }] : [])
    ];

    const actions = (
        <div className="relative group z-50" ref={exportRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium bg-white rounded-sm flex items-center gap-2 shadow-sm transition"
            >
                <FaDownload /> Exportieren
            </button>
            {isExportOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-sm shadow-sm border border-slate-100 z-[100] overflow-hidden animate-slideUp">
                    <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition">
                        <FaFileExcel className="text-emerald-600 text-sm" /> Excel (.xlsx)
                    </button>
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition">
                        <FaFileCsv className="text-blue-600 text-sm" /> CSV (.csv)
                    </button>
                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 border-t border-slate-50 transition">
                        <FaFilePdf className="text-red-600 text-sm" /> PDF Report
                    </button>
                </div>
            )}
        </div>
    );

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-6 fade-in pb-10" onClick={() => { setIsExportOpen(false); }}>
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">{t('customers.title')}</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">{t('customers.subtitle')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold shadow-sm flex items-center justify-center gap-2 transition"
                    >
                        <FaPlus className="text-xs" /> <span className="hidden sm:inline">{t('customers.new_customer')}</span><span className="inline sm:hidden">{t('customers.new_short')}</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label={t('customers.kpi.total_customers')} value={stats?.total_active || activeCustomersCount} icon={<FaUsers />} />
                <KPICard label={t('customers.kpi.new_entries')} value={newCustomersCount} icon={<FaUserPlus />} iconColor="text-indigo-600" subValue={t('customers.kpi.last_30_days')} />
                <KPICard label={t('customers.kpi.top_customer')} value={stats?.top_customer || '-'} icon={<FaBriefcase />} iconColor="text-blue-600" subValue={t('customers.kpi.top_customer_sub')} />
                <KPICard
                    label={t('customers.kpi.revenue_ytd')}
                    value={formatCurrency(stats?.total_revenue_ytd || 0)}
                    icon={<FaChartLine />}
                    iconColor="text-green-600"
                    trend={stats?.revenue_trend !== undefined ? {
                        value: `${stats.revenue_trend > 0 ? '+' : ''}${stats.revenue_trend}%`,
                        label: t('customers.kpi.vs_last_year'),
                        isPositive: stats.revenue_trend >= 0
                    } : undefined}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-[500px] sm:min-h-0 relative z-0">
                <DataTable
                    data={filteredCustomers}
                    columns={columns as any}
                    onRowClick={(c) => navigate(`/customers/${c.id}`)}
                    searchPlaceholder={t('customers.search_placeholder')}
                    searchFields={['company_name', 'contact_person', 'email']}
                    actions={actions}
                    onAddClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
                    selectable
                    selectedIds={selectedCustomers}
                    onSelectionChange={(ids) => setSelectedCustomers(ids as number[])}
                    bulkActions={[
                        {
                            label: t('customers.actions.activate'),
                            icon: <FaCheck className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Aktiv' } }),
                            variant: 'success',
                            show: statusView === 'active'
                        },
                        {
                            label: t('projects.actions.bulk.send_email'),
                            icon: <FaEnvelope className="text-xs" />,
                            onClick: () => {
                                const selectedEmails = customers
                                    .filter((c: any) => selectedCustomers.includes(c.id))
                                    .map((c: any) => c.email)
                                    .filter(Boolean)
                                    .join(', ');
                                if (selectedEmails) {
                                    navigate('/inbox', { state: { compose: true, to: selectedEmails, subject: 'Nachricht an Kunden' } });
                                }
                            },
                            variant: 'primary',
                            show: statusView === 'active'
                        },
                        {
                            label: t('customers.actions.deactivate'),
                            icon: <FaBan className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Inaktiv' } }),
                            variant: 'danger',
                            show: statusView === 'active'
                        },
                        {
                            label: t('projects.actions.bulk.archive'),
                            icon: <FaArchive className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Archiviert' } }),
                            variant: 'default',
                            show: statusView === 'active'
                        },
                        {
                            label: t('projects.actions.bulk.trash'),
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Gelöscht' } }),
                            variant: 'danger',
                            show: statusView === 'active'
                        },
                        {
                            label: t('projects.actions.bulk.restore'),
                            icon: <FaTrashRestore className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Aktiv' } }),
                            variant: 'success',
                            show: statusView === 'trash' || statusView === 'archive'
                        },
                        {
                            label: t('projects.actions.bulk.delete_permanent'),
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => {
                                setCustomerToDelete(selectedCustomers);
                                setConfirmTitle(t('customers.confirm.delete_title'));
                                setConfirmMessage(t('customers.confirm.delete_message', { count: selectedCustomers.length }));
                                setIsConfirmOpen(true);
                            },
                            variant: 'dangerSolid',
                            show: statusView === 'trash'
                        }
                    ] as BulkActionItem[]}
                    filters={tableFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={resetFilters}
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
                isLoading={isDetailLoading || updateMutation.isPending}
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
