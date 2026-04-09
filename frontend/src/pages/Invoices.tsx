import { useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { parseISO, startOfDay, isValid } from 'date-fns';
import {
    FaPlus, FaCheck, FaCheckCircle, FaHistory,
    FaFileInvoiceDollar, FaTrashRestore, FaPaperPlane, FaArchive,
    FaFilter, FaTimes, FaUndo, FaChevronDown, FaEdit, FaTrash
} from 'react-icons/fa';
import { buildInvoiceColumns } from './invoiceColumns';
import { Button } from '../components/ui/button';
import SearchableSelect from '../components/common/SearchableSelect';
import DataTable from '../components/common/DataTable';
import KPICard from '../components/common/KPICard';
import InvoicePreviewModal from '../components/modals/InvoicePreviewModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService, externalCostService, customerService } from '../api/services';

import ConfirmModal from '../components/common/ConfirmModal';
import type { BulkActionItem } from '../components/common/BulkActions';
import { useTranslation } from 'react-i18next';

const Invoices = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [statusView, setStatusView] = useState<'active' | 'archive' | 'trash'>('active');
    const [statusFilter, setStatusFilter] = useState(location.state?.filter || 'all');
    const [customerId, setCustomerId] = useState('');
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [previewInvoice, setPreviewInvoice] = useState<any>(null);
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

    useEffect(() => {
        setSelectedInvoices([]);
    }, [statusFilter]);

    useEffect(() => {
        if (location.state?.openNewModal) {
            navigate('/invoices/new', { replace: true });
        }
    }, [location.state, navigate]);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
    const [confirmVariant, setConfirmVariant] = useState<'danger' | 'warning' | 'info'>('danger');
    const [confirmLabel, setConfirmLabel] = useState('Bestätigen');
    const [cancelReason, setCancelReason] = useState('');

    const queryClient = useQueryClient();

    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: invoiceService.getAll
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getAll
    });

    const today = new Date();
    const startOfMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const { data: externalCostsStats } = useQuery({
        queryKey: ['external-costs', 'stats', startOfMonthDate.toISOString(), endOfMonthDate.toISOString()],
        queryFn: () => externalCostService.getStats({
            start_date: startOfMonthDate.toISOString().split('T')[0],
            end_date: endOfMonthDate.toISOString().split('T')[0],
        }),
    });

    const deleteMutation = useMutation({
        mutationFn: invoiceService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedInvoices([]);
            toast.success(t('invoices.messages.delete_success'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('invoices.messages.delete_error'))
    });

    const issueMutation = useMutation({
        mutationFn: (id: number) => invoiceService.issue(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success(t('invoices.messages.issue_success'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('invoices.messages.issue_error'))
    });

    const cancelMutation = useMutation({
        mutationFn: (args: { id: number; reason?: string }) => invoiceService.cancel(args.id, args.reason),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success(data?.message || t('invoices.messages.cancel_success'));
        },
        onError: (error: any) => toast.error(error?.response?.data?.error || t('invoices.messages.cancel_error'))
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: number[], data: any }) => invoiceService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedInvoices([]);
            toast.success(t('invoices.messages.bulk_update_success', { count: variables.ids.length }));
        },
        onError: () => toast.error(t('invoices.messages.bulk_error'))
    });

    const markAsPaidMutation = useMutation({
        mutationFn: (id: number) => invoiceService.bulkUpdate([id], { status: 'paid' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success(t('invoices.messages.paid_success'));
        },
        onError: () => toast.error(t('common.error')),
    });





    const filteredInvoices = useMemo(() => {
        if (!Array.isArray(invoices)) return [];
        const todayRef = startOfDay(new Date());

        return invoices.filter((inv: any) => {
            const status = inv.status?.toLowerCase() || 'pending';
            const matchesCustomer = !customerId || String(inv.customer_id) === String(customerId);
            if (!matchesCustomer) return false;

            let dueDate: Date | null = null;
            if (inv.due_date) {
                const parsed = typeof inv.due_date === 'string' ? parseISO(inv.due_date) : new Date(inv.due_date);
                dueDate = isValid(parsed) ? startOfDay(parsed) : null;
            }

            const isOverdue = dueDate && dueDate < todayRef && !['paid', 'bezahlt', 'cancelled', 'storniert', 'deleted', 'gelöscht', 'archived', 'archiviert', 'draft'].includes(status);

            if (statusView === 'trash') {
                if (status !== 'deleted' && status !== 'gelöscht') return false;
            } else if (statusView === 'archive') {
                if (status !== 'archived' && status !== 'archiviert') return false;
            } else {
                if (status === 'deleted' || status === 'gelöscht' || status === 'archived' || status === 'archiviert') return false;
            }

            if (statusView === 'active') {
                if (statusFilter === 'credit_notes') return inv.type === 'credit_note';
                if (statusFilter !== 'all' && inv.type === 'credit_note') return false;
                if (statusFilter === 'paid') return status === 'paid' || status === 'bezahlt';
                if (statusFilter === 'cancelled') return status === 'cancelled' || status === 'storniert';
                if (statusFilter === 'overdue') return isOverdue || status === 'overdue' || status === 'überfällig';
                if (statusFilter === 'reminders') return (inv.reminder_level > 0 || isOverdue) && !(status === 'paid' || status === 'bezahlt' || status === 'cancelled' || status === 'storniert');
                if (statusFilter === 'pending') return (status === 'pending' || status === 'draft' || status === 'issued') && !isOverdue;
                if (statusFilter !== 'all' && status !== statusFilter) return false;
            }
            return true;
        });
    }, [invoices, statusView, statusFilter, customerId]);

    const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
        const ids = selectedInvoices.length > 0 ? selectedInvoices : filteredInvoices.map((inv: any) => inv.id);
        if (ids.length === 0) return;
        if (format === 'csv') {
            try {
                const response = await invoiceService.datevExport(ids);
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `DATEV_Export_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link); link.click(); link.remove();
                window.URL.revokeObjectURL(url);
                toast.success(t('invoices.messages.datev_success'));
            } catch (error) { toast.error(t('invoices.messages.datev_error')); }
            return;
        }
        const headers = [t('fields.invoice_number') || 'Nr', t('fields.date'), t('fields.recipient'), t('fields.project'), t('fields.due_date') || 'Fällig', t('fields.amount'), t('common.status')];
        const rows = filteredInvoices.filter((inv: any) => ids.includes(inv.id)).map((inv: any) => [
            inv.invoice_number, new Date(inv.date).toLocaleDateString('de-DE'), inv.snapshot_customer_name || inv.customer?.company_name || '',
            inv.snapshot_project_name || inv.project?.project_name || '', new Date(inv.due_date).toLocaleDateString('de-DE'),
            (inv.amount_gross_eur ?? (inv.amount_gross / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), inv.status || ''
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, `Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
    };

    const handlePrint = async (inv: any, rebuild: boolean = false) => {
        try {
            const response = await invoiceService.print(inv.id, rebuild);
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);
            iframe.onload = () => {
                try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch (e) {
                    const printWindow = window.open(url, '_blank');
                    if (printWindow) printWindow.onload = () => printWindow.print();
                }
                setTimeout(() => { document.body.removeChild(iframe); window.URL.revokeObjectURL(url); }, 2000);
            };
        } catch (error) { toast.error(t('invoice.messages.print_error')); }
    };

    const handleDownload = async (inv: any, rebuild: boolean = false) => {
        try {
            const response = await invoiceService.download(inv.id, rebuild);
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `${inv.invoice_number}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) { toast.error(t('invoice.messages.pdf_error')); }
    };

    const handleDownloadXml = async (inv: any) => {
        try {
            const response = await invoiceService.downloadXml(inv.id);
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `${inv.invoice_number}.xml`);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) { toast.error(t('invoice.messages.xml_error')); }
    };

    const datevExportSingle = async (inv: any) => {
        try {
            const response = await invoiceService.datevExport([inv.id]);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `DATEV_${inv.invoice_number}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`DATEV-Export für ${inv.invoice_number} heruntergeladen`);
        } catch { toast.error('DATEV-Export fehlgeschlagen'); }
    };



    const createCreditNote = (inv: any) => {
        setConfirmTitle('Gutschrift erstellen');
        setConfirmMessage(`Für Rechnung ${inv.invoice_number} eine Gutschrift (Storno) erstellen? Die Rechnung wird damit als storniert markiert.`);
        setConfirmLabel('Gutschrift erstellen');
        setConfirmVariant('warning');
        setConfirmAction(() => () => cancelMutation.mutate({ id: inv.id, reason: 'Gutschrift' }));
        setIsConfirmOpen(true);
    };

    const columns = buildInvoiceColumns({
        t, onEditInvoice: (inv: any) => navigate(`/invoices/${inv.id}/edit`),
        issueMutation, markAsPaidMutation, deleteMutation,
        datevExportSingle, createCreditNote,
        handlePrint, handleDownload, handleDownloadXml, setConfirmTitle, setConfirmMessage, setConfirmLabel, setConfirmVariant, setConfirmAction, setIsConfirmOpen,
    });

    const subTabCounts = useMemo(() => {
        const defaultCounts = { all: 0, pending: 0, paid: 0, overdue: 0, reminders: 0, cancelled: 0, credit_notes: 0 };
        if (!Array.isArray(invoices)) return defaultCounts;
        const todayRef = startOfDay(new Date());
        const active = invoices.filter((inv: any) => {
            const s = (inv.status || 'pending').toLowerCase();
            return s !== 'deleted' && s !== 'gelöscht' && s !== 'archived' && s !== 'archiviert';
        });
        const overdueInvs = active.filter((inv: any) => {
            const s = (inv.status || 'pending').toLowerCase();
            const dueDateRaw = inv.due_date ? new Date(inv.due_date) : null;
            const dueDate = dueDateRaw ? startOfDay(dueDateRaw) : null;
            return (s === 'overdue' || s === 'überfällig') || (dueDate && dueDate < todayRef && !['paid', 'bezahlt', 'cancelled', 'storniert', 'draft'].includes(s));
        });
        return {
            all: active.length,
            pending: active.filter((inv: any) => {
                const s = (inv.status || 'pending').toLowerCase();
                const dueDateRaw = inv.due_date ? new Date(inv.due_date) : null;
                const dueDate = dueDateRaw ? startOfDay(dueDateRaw) : null;
                const isOverdue = dueDate && dueDate < todayRef && !['paid', 'bezahlt', 'cancelled', 'storniert', 'draft'].includes(s);
                return (s === 'pending' || s === 'draft' || s === 'issued') && !isOverdue;
            }).length,
            paid: active.filter((inv: any) => { const s = (inv.status || 'pending').toLowerCase(); return s === 'paid' || s === 'bezahlt'; }).length,
            overdue: overdueInvs.length,
            reminders: active.filter((inv: any) => {
                const s = (inv.status || 'pending').toLowerCase();
                const dueDateRaw = inv.due_date ? new Date(inv.due_date) : null;
                const dueDate = dueDateRaw ? startOfDay(dueDateRaw) : null;
                const isOverdue = dueDate && dueDate < todayRef && !['paid', 'bezahlt', 'cancelled', 'storniert', 'draft'].includes(s);
                return (inv.reminder_level > 0 || isOverdue) && !['paid', 'bezahlt', 'cancelled', 'storniert'].includes(s);
            }).length,
            cancelled: active.filter((inv: any) => { const s = (inv.status || 'pending').toLowerCase(); return s === 'cancelled' || s === 'storniert'; }).length,
            credit_notes: active.filter((inv: any) => inv.type === 'credit_note').length,
        };
    }, [invoices]);

    const tabs = statusView === 'active' ? (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1 overflow-x-auto no-scrollbar">
            <Button onClick={() => setStatusFilter('all')} variant={statusFilter === 'all' ? 'default' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">{t('invoices.tabs.all')}</Button>
            <Button onClick={() => setStatusFilter('pending')} variant={statusFilter === 'pending' ? 'default' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">{t('invoices.tabs.open')} {subTabCounts.pending > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${statusFilter === 'pending' ? 'bg-white text-brand-primary' : 'bg-slate-100 text-slate-600'}`}>{subTabCounts.pending}</span>}</Button>
            <Button onClick={() => setStatusFilter('paid')} variant={statusFilter === 'paid' ? 'default' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">{t('invoices.tabs.paid')}</Button>
            <Button onClick={() => setStatusFilter('overdue')} variant={statusFilter === 'overdue' ? 'destructive' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">{t('invoices.tabs.overdue')} {subTabCounts.overdue > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${statusFilter === 'overdue' ? 'bg-white text-red-600' : 'bg-red-50 text-red-600'}`}>{subTabCounts.overdue}</span>}</Button>
            <Button onClick={() => setStatusFilter('reminders')} variant={statusFilter === 'reminders' ? 'warning' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">{t('invoices.tabs.reminders')} {subTabCounts.reminders > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${statusFilter === 'reminders' ? 'bg-white text-amber-600' : 'bg-amber-50 text-amber-600'}`}>{subTabCounts.reminders}</span>}</Button>
            <Button onClick={() => setStatusFilter('cancelled')} variant={statusFilter === 'cancelled' ? 'default' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">{t('invoices.tabs.cancelled')}</Button>
            <Button onClick={() => setStatusFilter('credit_notes')} variant={statusFilter === 'credit_notes' ? 'default' : 'secondary'} size="sm" className="h-8 gap-2 px-4 text-xs">{t('invoices.tabs.credit_notes')} {subTabCounts.credit_notes > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${statusFilter === 'credit_notes' ? 'bg-white text-brand-primary' : 'bg-brand-primary/10 text-brand-primary'}`}>{subTabCounts.credit_notes}</span>}</Button>
        </div>
    ) : null;

    const activeInvoicesList = useMemo(() => {
        const invoicesArray = Array.isArray(invoices) ? invoices : ((invoices as any)?.data || []);
        return invoicesArray.filter((inv: any) => {
            const s = inv.status?.toLowerCase();
            return (s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht') && (!customerId || String(inv.customer_id) === String(customerId));
        });
    }, [invoices, customerId]);

    const totalOpenAmount = activeInvoicesList
        .filter((i: any) => i.status !== 'paid' && i.status !== 'bezahlt' && i.status !== 'cancelled' && i.status !== 'storniert' && i.type !== 'credit_note')
        .reduce((acc: number, curr: any) => acc + (curr.amount_gross_eur ?? (curr.amount_gross / 100)), 0);

    const totalPaidMonth = activeInvoicesList
        .filter((i: any) => i.status === 'paid' || i.status === 'bezahlt')
        .reduce((acc: number, curr: any) => acc + (curr.amount_gross_eur ?? (curr.amount_gross / 100)), 0);

    const activeFilterCount = (statusView !== 'active' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (customerId ? 1 : 0);
    const resetFilters = () => { setStatusView('active'); setStatusFilter('all'); setCustomerId(''); };

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
                            {activeFilterCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{activeFilterCount}</span>}
                        </div>
                        <Button onClick={() => setIsFilterSidebarOpen(false)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700"><FaTimes className="text-xs" /></Button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{t('projects.filters.status_view')}</label>
                            <div className="relative">
                                <select className="w-full h-9 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:border-[#1B4D4F] outline-none appearance-none pr-8 cursor-pointer hover:border-[#adadad] transition"
                                    value={statusView} onChange={e => { setStatusView(e.target.value as any); setStatusFilter('all'); }}>
                                    <option value="active">{t('projects.filters.active')}</option>
                                    <option value="archive">{t('projects.filters.archive')}</option>
                                    <option value="trash">{t('projects.filters.trash')}</option>
                                </select>
                                <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{t('projects.filters.customers.label')}</label>
                            <SearchableSelect
                                options={[{ value: '', label: t('projects.filters.customers.all') }, ...customers.map((c: any) => ({ value: String(c.id), label: (c.company_name || `${c.first_name || ''} ${c.last_name || ''}`).trim() }))]}
                                value={customerId}
                                onChange={setCustomerId}
                                placeholder={t('projects.filters.customers.placeholder')}
                            />
                        </div>
                        {statusView === 'active' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{t('invoices.filters.invoice_status')}</label>
                                <div className="relative">
                                    <select className="w-full h-9 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:border-[#1B4D4F] outline-none appearance-none pr-8 cursor-pointer hover:border-[#adadad] transition"
                                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                        <option value="all">{t('invoices.tabs.all')}</option>
                                        <option value="pending">{t('invoices.tabs.open')}</option>
                                        <option value="paid">{t('invoices.tabs.paid')}</option>
                                        <option value="overdue">{t('invoices.tabs.overdue')}</option>
                                        <option value="reminders">{t('invoices.tabs.reminders')}</option>
                                        <option value="cancelled">{t('invoices.tabs.cancelled')}</option>
                                        <option value="credit_notes">{t('invoices.tabs.credit_notes')}</option>
                                    </select>
                                    <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="px-4 py-3 border-t border-[#D1D9D8] bg-[#f6f8f8] shrink-0">
                        <Button onClick={resetFilters} variant="secondary" className="w-full justify-center gap-2 text-xs">
                            <FaUndo className="text-xs" /> Filter zurücksetzen
                        </Button>
                    </div>
                </div>
            </>

            <div className="flex flex-col gap-6 fade-in h-full overflow-hidden">
                <div className="flex justify-between items-center gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">{t('invoices.title')}</h1>
                        <p className="text-slate-500 text-sm hidden sm:block">{t('invoices.subtitle')}</p>
                    </div>
                    <Button onClick={() => navigate(statusFilter === 'credit_notes' ? '/invoices/new?type=credit_note' : '/invoices/new')} className="text-white font-bold transition px-4 py-2">
                        <FaPlus className="mr-2 h-4 w-4" /> {statusFilter === 'credit_notes' ? t('invoices.new_credit_note') : t('invoices.new_invoice')}
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <KPICard label={t('invoices.kpi.open_amount')} value={totalOpenAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaFileInvoiceDollar />} subValue={t('invoices.kpi.overdue_sub', { count: subTabCounts.overdue })} />
                    <KPICard label={t('invoices.kpi.paid_total')} value={totalPaidMonth.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaCheckCircle className="text-green-600" />} subValue={t('invoices.kpi.transactions_sub', { count: subTabCounts.paid })} />
                    <KPICard label={t('invoices.kpi.reminders')} value={`${subTabCounts.reminders}`} icon={<FaPaperPlane className="text-amber-600" />} subValue={t('invoices.kpi.reminders_sub')} />
                    <KPICard label={t('invoices.kpi.external_costs')} value={(externalCostsStats?.total_costs ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaHistory />} subValue={t('invoices.kpi.this_month')} />
                </div>

                <div className="flex-1 flex flex-col min-h-0 relative z-0 overflow-hidden">
                    <DataTable
                        isLoading={isLoading}
                        data={filteredInvoices}
                        columns={columns as any}
                        searchPlaceholder={t('invoices.search_placeholder')}
                        searchFields={['invoice_number', 'customer.company_name', 'project.project_name']}
                        onExport={handleExport}
                        tabs={tabs}
                        onRowClick={(inv: any) => setPreviewInvoice(inv)}
                        selectable
                        selectedIds={selectedInvoices}
                        onSelectionChange={(ids) => setSelectedInvoices(ids as number[])}
                        bulkActions={[
                            { label: t('common.edit'), icon: <FaEdit className="text-xs" />, onClick: () => navigate(`/invoices/${selectedInvoices[0]}/edit`), variant: 'default', show: statusView === 'active' && selectedInvoices.length === 1 && filteredInvoices.find(inv => inv.id === selectedInvoices[0])?.status === 'draft' },
                            { label: t('common.delete'), icon: <FaTrash className="text-xs" />, onClick: () => {
                                setConfirmTitle(t('common.delete'));
                                setConfirmMessage(t('invoices.confirm.bulk_delete_message', { count: selectedInvoices.length }));
                                setConfirmLabel(t('common.delete'));
                                setConfirmVariant('danger');
                                setConfirmAction(() => () => {
                                    invoiceService.bulkDelete(selectedInvoices)
                                        .then(() => {
                                            queryClient.invalidateQueries({ queryKey: ['invoices'] });
                                            setSelectedInvoices([]);
                                            toast.success(t('invoices.messages.bulk_delete_success'));
                                        })
                                        .catch(() => toast.error(t('invoices.messages.bulk_error')));
                                });
                                setIsConfirmOpen(true);
                            }, variant: 'danger', show: statusView === 'active' && selectedInvoices.every(id => filteredInvoices.find(inv => inv.id === id)?.status === 'draft') },
                            { label: t('invoices.actions.issue'), icon: <FaCheckCircle className="text-xs" />, onClick: () => {
                                setConfirmTitle(t('invoices.actions.issue'));
                                setConfirmMessage(t('invoices.confirm.bulk_issue_message', { count: selectedInvoices.length }));
                                setConfirmLabel(t('invoices.actions.issue'));
                                setConfirmVariant('info');
                                setConfirmAction(() => () => {
                                    Promise.all(selectedInvoices.map(id => invoiceService.issue(id)))
                                        .then(() => {
                                            queryClient.invalidateQueries({ queryKey: ['invoices'] });
                                            setSelectedInvoices([]);
                                            toast.success(t('invoices.messages.bulk_issue_success'));
                                        })
                                        .catch(() => toast.error(t('invoices.messages.bulk_error')));
                                });
                                setIsConfirmOpen(true);
                            }, variant: 'primary', show: statusView === 'active' && selectedInvoices.every(id => filteredInvoices.find(inv => inv.id === id)?.status === 'draft') },
                            { label: t('invoices.actions.paid'), icon: <FaCheck className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'paid' } }), variant: 'success', show: statusView === 'active' && statusFilter !== 'cancelled' && statusFilter !== 'paid' && !selectedInvoices.some(id => filteredInvoices.find(inv => inv.id === id)?.status === 'draft') },
                            {
                                label: t('invoices.actions.send_reminder'), icon: <FaPaperPlane className="text-xs text-amber-500" />, onClick: () => {
                                    setConfirmTitle(t('invoices.confirm.reminder_title'));
                                    setConfirmMessage(t('invoices.confirm.reminder_message', { count: selectedInvoices.length }));
                                    setConfirmLabel(t('invoices.confirm.reminders_btn'));
                                    setConfirmVariant('warning');
                                    setConfirmAction(() => () => {
                                        const invoicesArray = Array.isArray(invoices) ? invoices : ((invoices as any)?.data || []);
                                        selectedInvoices.forEach(id => {
                                            const inv = invoicesArray.find((i: any) => i.id === id);
                                            bulkUpdateMutation.mutate({ ids: [id], data: { reminder_level: (inv?.reminder_level || 0) + 1, last_reminder_date: new Date().toISOString().split('T')[0] } });
                                        });
                                    });
                                    setIsConfirmOpen(true);
                                }, variant: 'primary', show: statusView === 'active' && (statusFilter === 'reminders' || statusFilter === 'overdue')
                            },
                            { label: t('projects.actions.bulk.archive'), icon: <FaArchive className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'archived' } }), variant: 'default', show: statusView === 'active' && statusFilter === 'paid' },
                            { label: t('projects.actions.bulk.restore'), icon: <FaTrashRestore className="text-xs" />, onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'draft' } }), variant: 'success', show: statusView === 'trash' || statusView === 'archive' }
                        ] as BulkActionItem[]}
                        activeFilterCount={activeFilterCount}
                        onFilterToggle={() => setIsFilterSidebarOpen(v => !v)}
                        isFilterOpen_external={isFilterSidebarOpen}
                    />
                </div>

                <InvoicePreviewModal isOpen={!!previewInvoice} onClose={() => setPreviewInvoice(null)} invoice={previewInvoice} />
                <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={() => { confirmAction(); setIsConfirmOpen(false); }} title={confirmTitle} message={confirmMessage} confirmLabel={confirmLabel} variant={confirmVariant} isLoading={deleteMutation.isPending || issueMutation.isPending || cancelMutation.isPending || bulkUpdateMutation.isPending}>
                    {confirmTitle === t('invoices.confirm.cancel_title') && (
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-slate-500 mb-1">{t('invoices.confirm.cancel_reason')}</label>
                            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full border border-slate-200 rounded-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder={t('invoices.confirm.cancel_placeholder')} rows={3} />
                        </div>
                    )}
                </ConfirmModal>
            </div>
        </div>
    );
};

export default Invoices;
