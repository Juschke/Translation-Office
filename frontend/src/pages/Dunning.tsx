import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaFileInvoiceDollar, FaBell, FaDownload, FaCog, FaFilter, FaTimes, FaUndo, FaChevronDown, FaPlus } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { dunningService } from '../api/services/invoices';
import { customerService } from '../api/services';
import { triggerBlobDownload } from '../utils/download';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import DunningModal from '../components/modals/DunningModal';
import SearchableSelect from '../components/common/SearchableSelect';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import clsx from 'clsx';
import { Button } from '../components/ui/button';

const levelLabel = (level: number) => {
    if (level === 0) return null;
    const styles: Record<number, string> = {
        1: 'bg-amber-50 text-amber-600 border-amber-200',
        2: 'bg-orange-50 text-orange-600 border-orange-200',
        3: 'bg-red-50 text-red-600 border-red-200',
    };
    const labels: Record<number, string> = {
        1: 'Zahlungserinnerung',
        2: '1. Mahnung',
        3: '2. Mahnung',
    };
    return (
        <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", styles[level] ?? styles[3])}>
            {labels[level] ?? 'Mahnung'}
        </span>
    );
};

const Dunning: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [confirmInvoice, setConfirmInvoice] = useState<any | null>(null);
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
    const [customerIdFilter, setCustomerIdFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [statusView, setStatusView] = useState<'active' | 'archive' | 'trash'>('active');

    const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: customerService.getAll });

    const { data, isLoading } = useQuery({
        queryKey: ['dunning'],
        queryFn: () => dunningService.getList({}),
    });

    const sendMutation = useMutation({
        mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
            dunningService.sendReminder(id, notes),
        onSuccess: (res) => {
            toast.success(res.message ?? 'Mahnstufe erfasst.');
            queryClient.invalidateQueries({ queryKey: ['dunning'] });
            setConfirmInvoice(null);
        },
    });

    const allItems: any[] = data?.data ?? [];
    const summary = data?.summary ?? {};

    const levelCounts = useMemo(() => ({
        all: allItems.length,
        none: allItems.filter((r: any) => r.reminder_level === 0).length,
        level1: allItems.filter((r: any) => r.reminder_level === 1).length,
        level2: allItems.filter((r: any) => r.reminder_level === 2).length,
        level3: allItems.filter((r: any) => r.reminder_level === 3).length,
    }), [allItems]);

    const items = useMemo(() => allItems.filter((row: any) => {
        if (customerIdFilter && String(row.customer_id) !== customerIdFilter) return false;
        if (levelFilter === 'none' && row.reminder_level !== 0) return false;
        if (levelFilter === 'level1' && row.reminder_level !== 1) return false;
        if (levelFilter === 'level2' && row.reminder_level !== 2) return false;
        if (levelFilter === 'level3' && row.reminder_level !== 3) return false;
        return true;
    }), [allItems, customerIdFilter, levelFilter]);

    const activeFilterCount = [customerIdFilter, statusView !== 'active' ? statusView : ''].filter(Boolean).length;
    const resetFilters = () => { setCustomerIdFilter(''); setStatusView('active'); };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (items.length === 0) return;
        const headers = ['Rechnungs-Nr.', 'Kunde', 'Fällig am', 'Offen (€)', 'Mahnstufe', 'Letzte Mahnung'];
        const rows = items.map((row: any) => [
            row.invoice_number,
            row.customer_name,
            row.due_date ?? '',
            row.amount_due_eur?.toFixed(2) ?? '0.00',
            row.reminder_level ?? 0,
            row.last_reminder_date ?? '',
        ]);
        const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, `Mahnwesen_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
    };

    const columns: any[] = [
        {
            id: 'invoice_number',
            header: 'Rechnungs-Nr.',
            accessor: (row: any) => (
                <button
                    className="text-brand-primary font-bold hover:underline text-[13px] tracking-tight"
                    onClick={() => navigate('/invoices')}
                >
                    {row.invoice_number}
                </button>
            ),
        },
        {
            id: 'customer_name',
            header: 'Kunde',
            accessor: (row: any) => (
                <span className="text-[13px] text-slate-700 font-medium">{row.customer_name}</span>
            ),
        },
        {
            id: 'due_date',
            header: 'Fällig am',
            accessor: (row: any) => (
                <span className={clsx("text-xs", row.days_overdue > 0 ? 'text-red-600 font-bold' : 'text-slate-500 font-medium')}>
                    {row.due_date}
                    {row.days_overdue > 0 && (
                        <span className="ml-1 text-[10px] text-red-400 bg-red-50 px-1 rounded">+{row.days_overdue}d</span>
                    )}
                </span>
            ),
        },
        {
            id: 'amount_due_eur',
            header: 'Offen (€)',
            align: 'right' as const,
            accessor: (row: any) => (
                <span className="text-[13px] font-bold tabular-nums text-slate-900">
                    {row.amount_due_eur?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
            ),
        },
        {
            id: 'reminder_level',
            header: 'Mahnstufe',
            align: 'center' as const,
            accessor: (row: any) => levelLabel(row.reminder_level) ?? <span className="text-slate-300 text-[11px]">—</span>,
        },
        {
            id: 'last_reminder_date',
            header: 'Letzte Mahnung',
            accessor: (row: any) => (
                <span className="text-xs text-slate-400 font-medium">
                    {row.last_reminder_date ?? '—'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Aktionen',
            align: 'right' as const,
            accessor: (row: any) => (
                <div className="flex items-center gap-2 justify-end">
                    {row.reminder_level < 3 && (
                        <Button
                            size="sm"
                            onClick={() => setConfirmInvoice(row)}
                            className="text-[10px] font-bold uppercase tracking-wider px-3 h-8 shadow-sm"
                        >
                            Mahnung Stufe {row.reminder_level + 1}
                        </Button>
                    )}
                    {row.dunning_logs?.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const lastLog = row.dunning_logs[row.dunning_logs.length - 1];
                                            try {
                                                const blob = await dunningService.downloadPdf(row.invoice_id, lastLog.id);
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `Mahnung_${row.invoice_number}_Stufe${lastLog.level}.pdf`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            } catch {
                                                toast.error('PDF konnte nicht geladen werden.');
                                            }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-200 rounded-sm hover:bg-slate-50 transition"
                                    >
                                        <FaDownload className="text-xs" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">Letztes Mahnungs-PDF herunterladen</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            ),
        },
    ];

    const tabs = (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1 overflow-x-auto no-scrollbar">
            <Button onClick={() => setLevelFilter('all')} variant={levelFilter === 'all' ? 'default' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">
                Alle {levelCounts.all > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${levelFilter === 'all' ? 'bg-white text-brand-primary' : 'bg-slate-100 text-slate-600'}`}>{levelCounts.all}</span>}
            </Button>
            <Button onClick={() => setLevelFilter('none')} variant={levelFilter === 'none' ? 'default' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">
                Keine Mahnung
            </Button>
            <Button onClick={() => setLevelFilter('level1')} variant={levelFilter === 'level1' ? 'warning' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">
                Erinnerung {levelCounts.level1 > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${levelFilter === 'level1' ? 'bg-white text-amber-600' : 'bg-amber-50 text-amber-600'}`}>{levelCounts.level1}</span>}
            </Button>
            <Button onClick={() => setLevelFilter('level2')} variant={levelFilter === 'level2' ? 'destructive' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">
                1. Mahnung {levelCounts.level2 > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${levelFilter === 'level2' ? 'bg-white text-red-600' : 'bg-red-50 text-red-600'}`}>{levelCounts.level2}</span>}
            </Button>
            <Button onClick={() => setLevelFilter('level3')} variant={levelFilter === 'level3' ? 'destructive' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">
                2. Mahnung {levelCounts.level3 > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${levelFilter === 'level3' ? 'bg-white text-red-600' : 'bg-red-50 text-red-600'}`}>{levelCounts.level3}</span>}
            </Button>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-16 py-6 md:py-8">
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
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Ansicht</label>
                            <div className="relative">
                                <select className="w-full h-9 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:border-[#1B4D4F] outline-none appearance-none pr-8 cursor-pointer hover:border-[#adadad] transition"
                                    value={statusView} onChange={e => setStatusView(e.target.value as any)}>
                                    <option value="active">Aktiv</option>
                                    <option value="archive">Archiv</option>
                                    <option value="trash">Papierkorb</option>
                                </select>
                                <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Kunde</label>
                            <SearchableSelect
                                options={[{ value: '', label: 'Alle Kunden' }, ...(Array.isArray(customers) ? customers : (customers as any)?.data || []).map((c: any) => ({ value: String(c.id), label: (c.company_name || `${c.first_name || ''} ${c.last_name || ''}`).trim() }))]}
                                value={customerIdFilter}
                                onChange={setCustomerIdFilter}
                            />
                        </div>
                    </div>
                    <div className="px-4 py-3 border-t border-[#D1D9D8] bg-[#f6f8f8] shrink-0">
                        <button onClick={resetFilters} className="w-full px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-[#ccc] rounded-[3px] hover:bg-slate-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2"><FaUndo className="text-xs" /> Filter zurücksetzen</button>
                    </div>
                </div>
            </>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight">Mahnwesen</h1>
                    <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">Überfällige Rechnungen und Mahnstufen verwalten</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="default" onClick={() => navigate('/invoices')}>
                        <FaPlus className="mr-2 h-4 w-4" /> Neue Mahnung
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/settings?tab=dunning')}>
                        <FaCog className="mr-2 h-4 w-4" /> Einstellungen
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <KPICard label="Gesamt überfällig" value={summary.total_count ?? 0} icon={<FaExclamationTriangle />} />
                <KPICard label="Zahlungserinnerungen" value={summary.level1_count ?? 0} icon={<FaBell />} />
                <KPICard label="1. Mahnungen" value={summary.level2_count ?? 0} icon={<FaBell />} />
                <KPICard label="2. Mahnungen" value={summary.level3_count ?? 0} icon={<FaFileInvoiceDollar />} />
            </div>

            <div className="flex-1 min-h-0">
                <DataTable
                    data={items}
                    columns={columns}
                    isLoading={isLoading}
                    searchPlaceholder="Rechnung oder Kunde suchen..."
                    onExport={handleExport}
                    activeFilterCount={activeFilterCount}
                    onFilterToggle={() => setIsFilterSidebarOpen(v => !v)}
                    isFilterOpen_external={isFilterSidebarOpen}
                    tabs={tabs}
                />
            </div>

            <DunningModal
                isOpen={!!confirmInvoice}
                onClose={() => setConfirmInvoice(null)}
                onConfirm={(notes) => sendMutation.mutate({ id: confirmInvoice?.invoice_id, notes })}
                confirmLoading={sendMutation.isPending}
                invoice={confirmInvoice}
            />
        </div>
    );
};

export default Dunning;
