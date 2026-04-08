import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaPlus, FaPause, FaPlay, FaTrash, FaCalendarAlt, FaFileInvoice, FaEye, FaBolt, FaChevronDown, FaFilter, FaTimes, FaUndo } from 'react-icons/fa';
import { recurringInvoiceService } from '../api/services/invoices';
import { customerService } from '../api/services';
import { triggerBlobDownload } from '../utils/download';
import DataTable from '../components/common/DataTable';
import KPICard from '../components/common/KPICard';
import SearchableSelect from '../components/common/SearchableSelect';
import { Button } from '../components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import RecurringInvoiceModal from '../components/modals/RecurringInvoiceModal';

const RecurringInvoices: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
    const [customerIdFilter, setCustomerIdFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [intervalFilter, setIntervalFilter] = useState('');

    const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: customerService.getAll });

    const { data: recurringInvoices, isLoading } = useQuery({
        queryKey: ['recurringInvoices'],
        queryFn: recurringInvoiceService.getAll
    });

    const pauseMutation = useMutation({
        mutationFn: (id: number) => recurringInvoiceService.pause(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringInvoices'] });
            toast.success('Abonnement pausiert.');
        }
    });

    const activateMutation = useMutation({
        mutationFn: (id: number) => recurringInvoiceService.activate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringInvoices'] });
            toast.success('Abonnement aktiviert.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => recurringInvoiceService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringInvoices'] });
            toast.success('Abonnement gelöscht.');
        }
    });

    const executeMutation = useMutation({
        mutationFn: (id: number) => recurringInvoiceService.executeNow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringInvoices'] });
            toast.success('Rechnung wurde jetzt manuell erstellt.');
        }
    });

    const allItems = recurringInvoices?.data ?? [];
    const summary = recurringInvoices?.summary ?? { active: 0, paused: 0, total_monthly_amount_eur: 0 };

    const items = useMemo(() => allItems.filter((row: any) => {
        if (customerIdFilter && String(row.template_customer_id) !== customerIdFilter) return false;
        if (statusFilter && row.status !== statusFilter) return false;
        if (intervalFilter && row.interval !== intervalFilter) return false;
        return true;
    }), [allItems, customerIdFilter, statusFilter, intervalFilter]);

    const activeFilterCount = [customerIdFilter, statusFilter, intervalFilter].filter(Boolean).length;
    const resetFilters = () => { setCustomerIdFilter(''); setStatusFilter(''); setIntervalFilter(''); };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (items.length === 0) return;
        const headers = ['Name', 'Kunde', 'Intervall', 'Betrag (€)', 'Status', 'Nächste Ausführung'];
        const rows = items.map((row: any) => [
            row.name,
            row.template_customer_name ?? '',
            row.interval === 'monthly' ? 'Monatlich' : row.interval === 'quarterly' ? 'Vierteljährlich' : 'Jährlich',
            (row.template_amount_gross_cents / 100).toFixed(2),
            row.status === 'active' ? 'Aktiv' : 'Pausiert',
            row.next_run_at ? new Date(row.next_run_at).toLocaleDateString('de-DE') : '',
        ]);
        const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, `Serienrechnungen_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
    };

    const columns = [
        {
            id: 'name',
            header: 'Name',
            accessor: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-[13px] tracking-tight">{row.name}</span>
                    <span className="text-[11px] text-slate-400">{row.template_customer_name}</span>
                </div>
            )
        },
        {
            id: 'interval',
            header: 'Intervall',
            accessor: (row: any) => (
                <span className="text-xs font-medium text-slate-600 capitalize">
                    {row.interval === 'monthly' ? 'Monatlich' : row.interval === 'quarterly' ? 'Vierteljährlich' : 'Jährlich'}
                </span>
            )
        },
        {
            id: 'amount',
            header: 'Betrag',
            align: 'right' as const,
            accessor: (row: any) => (
                <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                    {(row.template_amount_gross_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: row.template_currency || 'EUR' })}
                </span>
            )
        },
        {
            id: 'next_run',
            header: 'Nächste Ausführung',
            accessor: (row: any) => (
                <span className="text-xs font-semibold text-slate-500">
                    {row.next_run_at ? new Date(row.next_run_at).toLocaleDateString('de-DE') : '—'}
                </span>
            )
        },
        {
            id: 'status',
            header: 'Status',
            align: 'center' as const,
            accessor: (row: any) => (
                <span className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                    row.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                )}>
                    {row.status === 'active' ? 'Aktiv' : 'Pausiert'}
                </span>
            )
        },
        {
            id: 'actions',
            header: 'Aktionen',
            align: 'right' as const,
            accessor: (row: any) => (
                <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                    onClick={() => executeMutation.mutate(row.id)}
                                >
                                    <FaBolt className="text-[10px] text-brand-primary" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Jetzt ausführen</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                    onClick={() => row.status === 'active' ? pauseMutation.mutate(row.id) : activateMutation.mutate(row.id)}
                                >
                                    {row.status === 'active' ? <FaPause className="text-[10px] text-amber-500" /> : <FaPlay className="text-[10px] text-emerald-600" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">{row.status === 'active' ? 'Pausieren' : 'Aktivieren'}</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                    onClick={() => { setSelectedInvoice(row); setIsModalOpen(true); }}
                                >
                                    <FaEye className="text-[10px] text-slate-400" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Bearbeiten</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-8 h-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                    onClick={() => { if (confirm('Sicher löschen?')) deleteMutation.mutate(row.id); }}
                                >
                                    <FaTrash className="text-[10px]" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Löschen</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        }
    ];


    return (
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-16 py-6 md:py-8 text-slate-800">
            {/* Filter Sidebar */}
            <>
                {isFilterSidebarOpen && <div className="fixed inset-0 z-30 bg-black/[0.03]" onClick={() => setIsFilterSidebarOpen(false)} />}
                <div className={clsx('fixed top-12 right-0 bottom-0 z-40 w-72 bg-white border-l border-[#D1D9D8] shadow-[-4px_0_20px_rgba(0,0,0,0.08)] flex flex-col transition-transform duration-300 ease-in-out', isFilterSidebarOpen ? 'translate-x-0' : 'translate-x-full')}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#D1D9D8] bg-gradient-to-b from-white to-[#f0f0f0] shrink-0">
                        <div className="flex items-center gap-2">
                            <FaFilter className="text-[#1B4D4F] text-xs" />
                            <span className="text-sm font-bold text-slate-700">Filter</span>
                            {activeFilterCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{activeFilterCount}</span>}
                        </div>
                        <button onClick={() => setIsFilterSidebarOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition"><FaTimes className="text-xs" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Kunde</label>
                            <SearchableSelect
                                options={[{ value: '', label: 'Alle Kunden' }, ...(Array.isArray(customers) ? customers : (customers as any)?.data || []).map((c: any) => ({ value: String(c.id), label: (c.company_name || `${c.first_name || ''} ${c.last_name || ''}`).trim() }))]}
                                value={customerIdFilter}
                                onChange={setCustomerIdFilter}
                                placeholder="Kunde..."
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Status</label>
                            <div className="relative">
                                <select className="w-full h-9 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:border-[#1B4D4F] outline-none appearance-none pr-8 cursor-pointer hover:border-[#adadad] transition"
                                    value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="">Alle</option>
                                    <option value="active">Aktiv</option>
                                    <option value="paused">Pausiert</option>
                                </select>
                                <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Intervall</label>
                            <div className="relative">
                                <select className="w-full h-9 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:border-[#1B4D4F] outline-none appearance-none pr-8 cursor-pointer hover:border-[#adadad] transition"
                                    value={intervalFilter} onChange={e => setIntervalFilter(e.target.value)}>
                                    <option value="">Alle</option>
                                    <option value="monthly">Monatlich</option>
                                    <option value="quarterly">Vierteljährlich</option>
                                    <option value="yearly">Jährlich</option>
                                </select>
                                <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 border-t border-[#D1D9D8] bg-[#f6f8f8] shrink-0">
                        <button onClick={resetFilters} className="w-full px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-[#ccc] rounded-[3px] hover:bg-slate-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2"><FaUndo className="text-xs" /> Filter zurücksetzen</button>
                    </div>
                </div>
            </>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-medium tracking-tight">Serienrechnung</h1>
                    <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">Wiederkehrende Rechnungen und Serienläufe verwalten</p>
                </div>
                <Button onClick={() => { setSelectedInvoice(null); setIsModalOpen(true); }} variant="default">
                    <FaPlus className="mr-2 h-4 w-4" /> Neue Serienrechnung
                </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 shrink-0">
                <KPICard label="Aktive Serien" value={summary.active ?? 0} icon={<FaCalendarAlt />} subValue="In automatischem Lauf" />
                <KPICard label="Pausiert" value={summary.paused ?? 0} icon={<FaPause />} subValue="Derzeit deaktiviert" />
                <KPICard label="Gegenwert / Monat" value={(summary.total_monthly_amount_eur ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaFileInvoice />} subValue="Monatliches Umsatzpotenzial" />
                <KPICard label="Gesamt Projekte" value={allItems.length} icon={<FaPlus />} subValue="Alle Serienvorlagen" />
            </div>

            <div className="flex-1 min-h-0">
                <DataTable
                    data={items}
                    columns={columns}
                    isLoading={isLoading}
                    searchPlaceholder="Serienrechnung oder Kunde suchen..."
                    onExport={handleExport}
                    activeFilterCount={activeFilterCount}
                    onFilterToggle={() => setIsFilterSidebarOpen(v => !v)}
                    isFilterOpen_external={isFilterSidebarOpen}
                />
            </div>

            <RecurringInvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} invoice={selectedInvoice} />
        </div>
    );
};

export default RecurringInvoices;
