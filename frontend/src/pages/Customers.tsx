import { useState, useMemo, useEffect } from 'react';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaUsers, FaBriefcase, FaChartLine, FaPlus, FaEye, FaEdit, FaTrash,
    FaCheck, FaBan, FaEnvelope, FaTrashRestore, FaUserPlus, FaArchive,
    FaFilter, FaTimes, FaUndo, FaChevronDown
} from 'react-icons/fa';

import NewCustomerModal from '../components/modals/NewCustomerModal';
import KPICard from '../components/common/KPICard';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import { Button } from '../components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../api/services';
import ConfirmModal from '../components/common/ConfirmModal';
import type { BulkActionItem } from '../components/common/BulkActions';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const Customers = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusView, setStatusView] = useState<'active' | 'archive' | 'trash'>('active');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

    useEffect(() => {
        if (location.state?.openNewModal) {
            setIsModalOpen(true);
            setEditingCustomer(null);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

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
        onError: () => toast.error(t('customers.messages.create_error'))
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
        onError: () => toast.error(t('customers.messages.update_error'))
    });

    const deleteMutation = useMutation({
        mutationFn: customerService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success(t('customers.messages.delete_success'));
        },
        onError: () => toast.error(t('customers.messages.delete_error'))
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: number[], data: any }) => customerService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success(t('customers.messages.bulk_update_success', { count: variables.ids.length }));
        },
        onError: () => toast.error(t('customers.messages.bulk_update_error'))
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: customerService.bulkDelete,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedCustomers([]);
            toast.success(t('customers.messages.bulk_delete_success', { count: variables.length }));
        },
        onError: () => toast.error(t('customers.messages.bulk_delete_error'))
    });

    const activeCustomersData = useMemo(() => {
        if (!Array.isArray(customers)) return [];
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

            if (statusView === 'trash') {
                if (status !== 'deleted' && status !== 'gelöscht') return false;
            } else if (statusView === 'archive') {
                if (status !== 'archived' && status !== 'archiviert') return false;
            } else {
                if (status === 'deleted' || status === 'gelöscht' || status === 'archived' || status === 'archiviert') return false;
            }

            if (statusView === 'active' && typeFilter !== 'all') {
                const mappedType = c.type === 'company' ? 'Firma' : c.type === 'private' ? 'Privat' : c.type === 'authority' ? 'Behörde' : c.type;
                if (mappedType !== typeFilter) return false;
            }

            return true;
        });
    }, [customers, statusView, typeFilter]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (filteredCustomers.length === 0) return;
        const headers = [t('tables.id'), t('tables.company_name'), t('tables.contact_person'), t('tables.email'), t('tables.revenue'), t('tables.status')];
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
    };

    const columns = [
        {
            id: 'code',
            header: t('fields.code'),
            accessor: (c: any) => <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50/50 px-2 py-1 border border-slate-200/50 rounded-sm">{c.display_id || '-'}</span>,
            className: 'w-32',
            sortable: true,
            sortKey: 'display_id'
        },
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
                    <button onClick={() => navigate(`/customers/${c.id}`)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title={t('actions.details')}><FaEye /></button>
                    <button onClick={async () => {
                        setEditingCustomer(c);
                        setIsModalOpen(true);
                        setIsDetailLoading(true);
                        try {
                            const fullData = await customerService.getById(c.id);
                            setEditingCustomer(fullData);
                        } catch (err) { } finally {
                            setIsDetailLoading(false);
                        }
                    }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title={t('actions.edit')}><FaEdit /></button>
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

    return (
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-16 py-6 md:py-8">
            {/* ── Filter Sidebar ── */}
            <>
                {isFilterSidebarOpen && (
                    <div className="fixed inset-0 z-30 bg-black/[0.03]" onClick={() => setIsFilterSidebarOpen(false)} />
                )}
                <div className={clsx(
                    "fixed top-12 right-0 bottom-0 z-40 w-72 bg-white border-l border-[#D1D9D8] shadow-[-4px_0_20px_rgba(0,0,0,0.08)] flex flex-col transition-transform duration-300 ease-in-out",
                    isFilterSidebarOpen ? "translate-x-0" : "translate-x-full"
                )}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#D1D9D8] bg-gradient-to-b from-white to-[#f0f0f0] shrink-0">
                        <div className="flex items-center gap-2">
                            <FaFilter className="text-[#1B4D4F] text-xs" />
                            <span className="text-sm font-bold text-slate-700">Filter</span>
                            {activeFilterCount > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{activeFilterCount}</span>
                            )}
                        </div>
                        <button onClick={() => setIsFilterSidebarOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition"><FaTimes className="text-xs" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{t('projects.filters.status_view')}</label>
                            <div className="relative">
                                <select className="w-full h-9 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:border-[#1B4D4F] outline-none appearance-none pr-8 cursor-pointer hover:border-[#adadad] transition"
                                    value={statusView} onChange={e => { setStatusView(e.target.value as any); setTypeFilter('all'); }}>
                                    <option value="active">{t('projects.filters.active')}</option>
                                    <option value="archive">{t('projects.filters.archive')}</option>
                                    <option value="trash">{t('projects.filters.trash')}</option>
                                </select>
                                <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        {statusView === 'active' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{t('customers.filters.type')}</label>
                                <div className="relative">
                                    <select className="w-full h-9 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:border-[#1B4D4F] outline-none appearance-none pr-8 cursor-pointer hover:border-[#adadad] transition"
                                        value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                                        <option value="all">{t('customers.filters.types.all')}</option>
                                        <option value="Firma">{t('customers.filters.types.company')}</option>
                                        <option value="Privat">{t('customers.filters.types.private')}</option>
                                        <option value="Behörde">{t('customers.filters.types.authority')}</option>
                                    </select>
                                    <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="px-4 py-3 border-t border-[#D1D9D8] bg-[#f6f8f8] shrink-0">
                        <button onClick={resetFilters} className="w-full px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-[#ccc] rounded-[3px] hover:bg-slate-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2">
                            <FaUndo className="text-xs" /> Filter zurücksetzen
                        </button>
                    </div>
                </div>
            </>

            <div className="flex justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight">{t('customers.title')}</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">{t('customers.subtitle')}</p>
                </div>
                <Button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}>
                    <FaPlus className="mr-2 h-4 w-4" /> {t('customers.new_customer')}
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <KPICard label={t('customers.kpi.total_customers')} value={stats?.total_active || activeCustomersCount} icon={<FaUsers />} />
                <KPICard label={t('customers.kpi.new_entries')} value={newCustomersCount} icon={<FaUserPlus />} subValue={t('customers.kpi.last_30_days')} />
                <KPICard label={t('customers.kpi.top_customer')} value={stats?.top_customer || '-'} icon={<FaBriefcase />} subValue={t('customers.kpi.top_customer_sub')} />
                <KPICard label={t('customers.kpi.revenue_ytd')} value={formatCurrency(stats?.total_revenue_ytd || 0)} icon={<FaChartLine />}
                    trend={stats?.revenue_trend !== undefined ? { value: `${stats.revenue_trend > 0 ? '+' : ''}${stats.revenue_trend}%`, label: t('customers.kpi.vs_last_year'), isPositive: stats.revenue_trend >= 0 } : undefined} />
            </div>

            <div className="flex-1 min-h-0">
                <DataTable
                    isLoading={isLoading}
                    data={filteredCustomers}
                    columns={columns as any}
                    onRowClick={(c) => navigate(`/customers/${c.id}`)}
                    searchPlaceholder={t('customers.search_placeholder')}
                    searchFields={['company_name', 'contact_person', 'email']}
                    onExport={handleExport}
                    selectable
                    selectedIds={selectedCustomers}
                    onSelectionChange={(ids) => setSelectedCustomers(ids as number[])}
                    bulkActions={[
                        { label: t('customers.actions.activate'), icon: <FaCheck className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Aktiv' } }), variant: 'success', show: statusView === 'active' },
                        {
                            label: t('projects.actions.bulk.send_email'), icon: <FaEnvelope className="text-xs" />, onClick: () => {
                                const selectedEmails = customers.filter((c: any) => selectedCustomers.includes(c.id)).map((c: any) => c.email).filter(Boolean).join(', ');
                                if (selectedEmails) navigate('/inbox', { state: { compose: true, to: selectedEmails, subject: 'Nachricht an Kunden' } });
                            }, variant: 'primary', show: statusView === 'active'
                        },
                        { label: t('customers.actions.deactivate'), icon: <FaBan className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Inaktiv' } }), variant: 'danger', show: statusView === 'active' },
                        { label: t('projects.actions.bulk.archive'), icon: <FaArchive className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Archiviert' } }), variant: 'default', show: statusView === 'active' },
                        { label: t('projects.actions.bulk.trash'), icon: <FaTrash className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Gelöscht' } }), variant: 'danger', show: statusView === 'active' },
                        { label: t('projects.actions.bulk.restore'), icon: <FaTrashRestore className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedCustomers, data: { status: 'Aktiv' } }), variant: 'success', show: statusView === 'trash' || statusView === 'archive' },
                        {
                            label: t('projects.actions.bulk.delete_permanent'), icon: <FaTrash className="text-xs" />, onClick: () => {
                                setCustomerToDelete(selectedCustomers); setConfirmTitle(t('customers.confirm.delete_title')); setConfirmMessage(t('customers.confirm.delete_message', { count: selectedCustomers.length })); setIsConfirmOpen(true);
                            }, variant: 'dangerSolid', show: statusView === 'trash'
                        }
                    ] as BulkActionItem[]}
                    activeFilterCount={activeFilterCount}
                    onFilterToggle={() => setIsFilterSidebarOpen(v => !v)}
                    isFilterOpen_external={isFilterSidebarOpen}
                />
            </div>

            <NewCustomerModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
                onSubmit={(data) => {
                    if (editingCustomer) updateMutation.mutate({ ...data, id: editingCustomer.id });
                    else createMutation.mutate(data);
                }}
                initialData={editingCustomer || (typeFilter === 'Firma' ? { type: 'company' } as any : typeFilter === 'Privat' ? { type: 'private' } as any : typeFilter === 'Behörde' ? { type: 'authority' } as any : undefined)}
                isLoading={isDetailLoading || updateMutation.isPending}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => { setIsConfirmOpen(false); setCustomerToDelete(null); }}
                onConfirm={() => {
                    if (customerToDelete) {
                        if (Array.isArray(customerToDelete)) bulkDeleteMutation.mutate(customerToDelete, { onSuccess: () => { setIsConfirmOpen(false); setCustomerToDelete(null); } });
                        else deleteMutation.mutate(customerToDelete as number, { onSuccess: () => { setIsConfirmOpen(false); setCustomerToDelete(null); } });
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
