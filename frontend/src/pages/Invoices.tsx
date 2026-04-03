import { useState, useMemo, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { parseISO, startOfDay, isValid } from 'date-fns';
import {
    FaPlus, FaCheck, FaCheckCircle, FaHistory,
    FaFileExcel, FaFileCsv, FaFilePdf, FaDownload,
    FaFileInvoiceDollar, FaTrashRestore, FaPaperPlane, FaArchive,
} from 'react-icons/fa';
import { buildInvoiceColumns } from './invoiceColumns';
import { Button } from '../components/ui/button';

import DataTable, { type FilterDef } from '../components/common/DataTable';
import KPICard from '../components/common/KPICard';
import InvoicePreviewModal from '../components/modals/InvoicePreviewModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService, externalCostService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import ConfirmModal from '../components/common/ConfirmModal';
import type { BulkActionItem } from '../components/common/BulkActions';
import { useTranslation } from 'react-i18next';


const Invoices = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [statusView, setStatusView] = useState<'active' | 'archive' | 'trash'>('active');
    const [statusFilter, setStatusFilter] = useState(location.state?.filter || 'all');
    useEffect(() => {
        setSelectedInvoices([]);
    }, [statusFilter]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [previewInvoice, setPreviewInvoice] = useState<any>(null);

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
            navigate('/invoices/new', { replace: true });
        }
    }, [location.state, navigate]);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const queryClient = useQueryClient();

    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: invoiceService.getAll
    });

    // Query for external costs (this month)
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const { data: externalCostsStats } = useQuery({
        queryKey: ['external-costs', 'stats', startOfMonth.toISOString(), endOfMonth.toISOString()],
        queryFn: () => externalCostService.getStats({
            start_date: startOfMonth.toISOString().split('T')[0],
            end_date: endOfMonth.toISOString().split('T')[0],
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
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || t('invoices.messages.delete_error'));
        }
    });

    const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
    const [confirmVariant, setConfirmVariant] = useState<'danger' | 'warning' | 'info'>('danger');
    const [confirmLabel, setConfirmLabel] = useState('Bestätigen');
    const [cancelReason, setCancelReason] = useState('');

    const issueMutation = useMutation({
        mutationFn: (id: number) => invoiceService.issue(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success(t('invoices.messages.issue_success'));
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || t('invoices.messages.issue_error'));
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (args: { id: number; reason?: string }) => invoiceService.cancel(args.id, args.reason),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success(data?.message || t('invoices.messages.cancel_success'));
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || t('invoices.messages.cancel_error'));
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: number[], data: any }) => invoiceService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedInvoices([]);
            toast.success(t('invoices.messages.bulk_update_success', { count: variables.ids.length }));
        },
        onError: () => {
            toast.error(t('invoices.messages.bulk_error'));
        }
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
        const today = startOfDay(new Date());

        return invoices.filter((inv: any) => {
            const status = inv.status?.toLowerCase() || 'pending';

            // Parse due_date safely with date-fns
            let dueDate: Date | null = null;
            if (inv.due_date) {
                const parsed = typeof inv.due_date === 'string' ? parseISO(inv.due_date) : new Date(inv.due_date);
                dueDate = isValid(parsed) ? startOfDay(parsed) : null;
            }

            const isOverdue = dueDate && dueDate < today && !['paid', 'bezahlt', 'cancelled', 'storniert', 'deleted', 'gelöscht', 'archived', 'archiviert', 'draft'].includes(status);

            // Priority 1: Filter by status view (active/archive/trash)
            if (statusView === 'trash') {
                if (status !== 'deleted' && status !== 'gelöscht') return false;
            } else if (statusView === 'archive') {
                if (status !== 'archived' && status !== 'archiviert') return false;
            } else {
                // Active view: exclude deleted and archived
                if (status === 'deleted' || status === 'gelöscht' || status === 'archived' || status === 'archiviert') return false;
            }

            // Priority 2: Status filter (only for active view)
            if (statusView === 'active') {
                if (statusFilter === 'credit_notes') return inv.type === 'credit_note';

                // Main tabs (exclude credit notes by default to avoid confusion)
                if (statusFilter !== 'all' && inv.type === 'credit_note') return false;

                if (statusFilter === 'paid') return status === 'paid' || status === 'bezahlt';
                if (statusFilter === 'cancelled') return status === 'cancelled' || status === 'storniert';
                if (statusFilter === 'overdue') return isOverdue || status === 'overdue' || status === 'überfällig';
                if (statusFilter === 'reminders') return (inv.reminder_level > 0 || isOverdue) && !(status === 'paid' || status === 'bezahlt' || status === 'cancelled' || status === 'storniert');
                if (statusFilter === 'pending') {
                    return (status === 'pending' || status === 'draft' || status === 'issued') && !isOverdue;
                }
                if (statusFilter === 'all') return true;

                return status === statusFilter;
            }

            return true;
        });
    }, [invoices, statusView, statusFilter]);

    const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
        const ids = selectedInvoices.length > 0
            ? selectedInvoices
            : filteredInvoices.map((inv: any) => inv.id);

        if (ids.length === 0) return;

        if (format === 'csv') {
            try {
                const response = await invoiceService.datevExport(ids);
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `DATEV_Export_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                setIsExportOpen(false);
                toast.success(t('invoices.messages.datev_success'));
            } catch (error) {
                toast.error(t('invoices.messages.datev_error'));
            }
            return;
        }

        // Keep other formats as is or placeholder
        const headers = [t('fields.invoice_number_short') || 'Nr', t('fields.date'), t('fields.customer'), t('fields.project'), t('fields.due_date_short') || 'Fällig', t('fields.amount'), t('common.status')];
        const rows = filteredInvoices.filter((inv: any) => ids.includes(inv.id)).map((inv: any) => [
            inv.invoice_number,
            new Date(inv.date).toLocaleDateString('de-DE'),
            inv.snapshot_customer_name || inv.customer?.company_name || '',
            inv.snapshot_project_name || inv.project?.project_name || '',
            new Date(inv.due_date).toLocaleDateString('de-DE'),
            (inv.amount_gross_eur ?? (inv.amount_gross / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            inv.status || ''
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, `Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
        setIsExportOpen(false);
    };

    const handlePrint = async (inv: any, rebuild: boolean = false) => {
        try {
            // Show a small toast or indicator if possible, but the print dialog is the goal
            const response = await invoiceService.print(inv.id, rebuild);

            // Create blob URL
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);

            // Create an iframe for direct printing without opening a new window
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            iframe.src = url;

            document.body.appendChild(iframe);

            iframe.onload = () => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    // Fallback to new window if iframe print fails
                    const printWindow = window.open(url, '_blank');
                    if (printWindow) {
                        printWindow.onload = () => printWindow.print();
                    }
                }

                // Cleanup after print dialog is closed or started
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    window.URL.revokeObjectURL(url);
                }, 2000);
            };
        } catch (error) {
            toast.error(t('invoices.messages.print_error'));
        }
    };

    const handleDownload = async (inv: any, rebuild: boolean = false) => {
        try {
            // Use the authenticated download endpoint
            const response = await invoiceService.download(inv.id, rebuild);

            // Create blob and trigger download
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${inv.invoice_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(t('invoices.messages.pdf_error'));
        }
    };

    const handleDownloadXml = async (inv: any) => {
        try {
            const response = await invoiceService.downloadXml(inv.id);
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${inv.invoice_number}.xml`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(t('invoices.messages.xml_error'));
        }
    };

    const columns = buildInvoiceColumns({
        t,
        setPreviewInvoice,
        onEditInvoice: (inv: any) => navigate(`/invoices/${inv.id}/edit`),
        issueMutation,
        cancelMutation,
        markAsPaidMutation,
        archiveMutation: bulkUpdateMutation,
        deleteMutation,
        handlePrint,
        handleDownload,
        handleDownloadXml,
        cancelReason,
        setCancelReason,
        setConfirmTitle,
        setConfirmMessage,
        setConfirmLabel,
        setConfirmVariant,
        setConfirmAction,
        setIsConfirmOpen,
    });

    const subTabCounts = useMemo(() => {
        const defaultCounts = {
            all: 0,
            pending: 0,
            paid: 0,
            overdue: 0,
            reminders: 0,
            cancelled: 0,
            credit_notes: 0
        };

        if (!Array.isArray(invoices)) return defaultCounts;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const active = invoices.filter((inv: any) => {
            const s = (inv.status || 'pending').toLowerCase();
            return s !== 'deleted' && s !== 'gelöscht' && s !== 'archived' && s !== 'archiviert';
        });

        const overdueInvs = active.filter((inv: any) => {
            const s = (inv.status || 'pending').toLowerCase();
            const dueDateRaw = inv.due_date ? new Date(inv.due_date) : null;
            const dueDate = dueDateRaw ? new Date(dueDateRaw.getFullYear(), dueDateRaw.getMonth(), dueDateRaw.getDate()) : null;
            return (s === 'overdue' || s === 'überfällig') || (dueDate && dueDate < today && !['paid', 'bezahlt', 'cancelled', 'storniert', 'draft'].includes(s));
        });

        return {
            all: active.length,
            pending: active.filter((inv: any) => {
                const s = (inv.status || 'pending').toLowerCase();
                const dueDateRaw = inv.due_date ? new Date(inv.due_date) : null;
                const dueDate = dueDateRaw ? new Date(dueDateRaw.getFullYear(), dueDateRaw.getMonth(), dueDateRaw.getDate()) : null;
                const isOverdue = dueDate && dueDate < today && !['paid', 'bezahlt', 'cancelled', 'storniert', 'draft'].includes(s);
                return (s === 'pending' || s === 'draft' || s === 'issued') && !isOverdue;
            }).length,
            paid: active.filter((inv: any) => {
                const s = (inv.status || 'pending').toLowerCase();
                return s === 'paid' || s === 'bezahlt';
            }).length,
            overdue: overdueInvs.length,
            reminders: active.filter((inv: any) => {
                const s = (inv.status || 'pending').toLowerCase();
                const dueDateRaw = inv.due_date ? new Date(inv.due_date) : null;
                const dueDate = dueDateRaw ? new Date(dueDateRaw.getFullYear(), dueDateRaw.getMonth(), dueDateRaw.getDate()) : null;
                const isOverdue = dueDate && dueDate < today && !['paid', 'bezahlt', 'cancelled', 'storniert', 'draft'].includes(s);
                return (inv.reminder_level > 0 || isOverdue) && !['paid', 'bezahlt', 'cancelled', 'storniert'].includes(s);
            }).length,
            cancelled: active.filter((inv: any) => {
                const s = (inv.status || 'pending').toLowerCase();
                return s === 'cancelled' || s === 'storniert';
            }).length,
            credit_notes: active.filter((inv: any) => inv.type === 'credit_note').length,
        };
    }, [invoices]);

    const tabs = statusView === 'active' ? (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1 overflow-x-auto no-scrollbar">
            <button
                onClick={() => setStatusFilter('all')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'all' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                {t('invoices.tabs.all')}
            </button>
            <button
                onClick={() => setStatusFilter('pending')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'pending' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                {t('invoices.tabs.open')}
                {subTabCounts.pending > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${statusFilter === 'pending' ? 'bg-white text-brand-primary' : 'bg-slate-100 text-slate-600'}`}>{subTabCounts.pending}</span>}
            </button>
            <button
                onClick={() => setStatusFilter('paid')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'paid' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                {t('invoices.tabs.paid')}
            </button>
            <button
                onClick={() => setStatusFilter('overdue')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'overdue' ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                {t('invoices.tabs.overdue')}
                {subTabCounts.overdue > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${statusFilter === 'overdue' ? 'bg-white text-red-600' : 'bg-red-50 text-red-600'}`}>{subTabCounts.overdue}</span>}
            </button>
            <button
                onClick={() => setStatusFilter('reminders')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'reminders' ? 'bg-amber-600 border-amber-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                {t('invoices.tabs.reminders')}
                {subTabCounts.reminders > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${statusFilter === 'reminders' ? 'bg-white text-amber-600' : 'bg-amber-50 text-amber-600'}`}>{subTabCounts.reminders}</span>}
            </button>
            <button
                onClick={() => setStatusFilter('cancelled')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'cancelled' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                {t('invoices.tabs.cancelled')}
            </button>
            <button
                onClick={() => setStatusFilter('credit_notes')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'credit_notes' ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
                {t('invoices.tabs.credit_notes')}
                {subTabCounts.credit_notes > 0 && <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] ${statusFilter === 'credit_notes' ? 'bg-white text-red-600' : 'bg-red-50 text-red-600'}`}>{subTabCounts.credit_notes}</span>}
            </button>
        </div>
    ) : null;

    const actions = (
        <div className="relative group z-50" ref={exportRef}>
            <button onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }} className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium bg-white rounded-sm flex items-center gap-2 shadow-sm transition">
                <FaDownload /> Export
            </button>
            {isExportOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-sm border border-slate-100 z-[100] overflow-hidden animate-fadeIn">
                    <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"><FaFileExcel className="text-emerald-600 text-sm" /> Excel (.xlsx)</button>
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"><FaFileCsv className="text-blue-600 text-sm" /> CSV DATEV</button>
                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-600 border-t border-slate-50 transition"><FaFilePdf className="text-red-600 text-sm" /> PDF Sammel-Report</button>
                </div>
            )}
        </div>
    );

    const activeInvoices = useMemo(() => {
        return invoices.filter((inv: any) => {
            const s = inv.status?.toLowerCase();
            return s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht';
        });
    }, [invoices]);

    // Count invoices by status for badges

    const totalOpenAmount = activeInvoices
        .filter((i: any) => i.status !== 'paid' && i.status !== 'bezahlt' && i.status !== 'cancelled' && i.status !== 'storniert' && i.type !== 'credit_note')
        .reduce((acc: number, curr: any) => acc + (curr.amount_gross_eur ?? (curr.amount_gross / 100)), 0);

    const totalPaidMonth = activeInvoices
        .filter((i: any) => i.status === 'paid' || i.status === 'bezahlt')
        .reduce((acc: number, curr: any) => acc + (curr.amount_gross_eur ?? (curr.amount_gross / 100)), 0);

    const overdueCount = subTabCounts.overdue || 0;
    const reminderCount = subTabCounts.reminders || 0;
    const paidCount = subTabCounts.paid || 0;

    const activeFilterCount = (statusView !== 'active' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);
    const resetFilters = () => {
        setStatusView('active');
        setStatusFilter('all');
    };

    const tableFilters: FilterDef[] = [
        {
            id: 'statusView', label: t('projects.filters.status_view'), type: 'select' as const, value: statusView, onChange: (v: any) => { setStatusView(v as 'active' | 'archive' | 'trash'); setStatusFilter('all'); },
            options: [{ value: 'active', label: t('projects.filters.active') }, { value: 'archive', label: t('projects.filters.archive') }, { value: 'trash', label: t('projects.filters.trash') }]
        },
        ...(statusView === 'active' ? [{
            id: 'statusFilter', label: t('invoices.filters.invoice_status'), type: 'select' as const, value: statusFilter, onChange: (v: any) => setStatusFilter(v),
            options: [
                { value: 'all', label: t('invoices.tabs.all') },
                { value: 'pending', label: t('invoices.tabs.open') },
                { value: 'paid', label: t('invoices.tabs.paid') },
                { value: 'overdue', label: t('invoices.tabs.overdue') },
                { value: 'reminders', label: t('invoices.tabs.reminders') },
                { value: 'cancelled', label: t('invoices.tabs.cancelled') },
                { value: 'credit_notes', label: t('invoices.tabs.credit_notes') }
            ]
        }] : [])
    ];

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-16 py-6 md:py-8">
            <div className="flex flex-col gap-6 fade-in h-full overflow-hidden" onClick={() => setIsExportOpen(false)}>
                <div className="flex justify-between items-center gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">{t('invoices.title')}</h1>
                        <p className="text-slate-500 text-sm hidden sm:block">{t('invoices.subtitle')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button
                            onClick={() => navigate(statusFilter === 'credit_notes' ? '/invoices/new?type=credit_note' : '/invoices/new')}
                            className={clsx(
                                "text-white font-bold shadow-sm flex items-center justify-center gap-2 transition px-4 py-2",
                                statusFilter === 'credit_notes' ? "bg-red-600 hover:bg-red-700" : "bg-brand-primary hover:bg-brand-primary/90"
                            )}
                        >
                            <FaPlus className="text-xs" />
                            <span className="hidden sm:inline">
                                {statusFilter === 'credit_notes' ? t('invoices.new_credit_note') : t('invoices.new_invoice')}
                            </span>
                            <span className="inline sm:hidden">
                                {t('common.new_short') || 'Neu'}
                            </span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <KPICard label={t('invoices.kpi.open_amount')} value={totalOpenAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaFileInvoiceDollar />} subValue={t('invoices.kpi.overdue_sub', { count: overdueCount })} />
                    <KPICard label={t('invoices.kpi.paid_total')} value={totalPaidMonth.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaCheckCircle className="text-green-600" />} subValue={t('invoices.kpi.transactions_sub', { count: paidCount })} />
                    <KPICard label={t('invoices.kpi.reminders')} value={`${reminderCount}`} icon={<FaPaperPlane className="text-amber-600" />} subValue={t('invoices.kpi.reminders_sub')} />
                    <KPICard
                        label={t('invoices.kpi.external_costs')}
                        value={(externalCostsStats?.total_costs ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        icon={<FaHistory />}
                        subValue={t('invoices.kpi.this_month')}
                    />
                </div>



                <div className="flex-1 flex flex-col min-h-0 relative z-0 overflow-hidden">
                    <DataTable
                        data={filteredInvoices}
                        columns={columns as any}
                        searchPlaceholder={t('invoices.search_placeholder')}
                        searchFields={['invoice_number', 'customer.company_name', 'project.project_name']}
                        actions={actions}
                        tabs={tabs}
                        onRowClick={(inv: any) => setPreviewInvoice(inv)}
                        selectable
                        selectedIds={selectedInvoices}
                        onSelectionChange={(ids) => setSelectedInvoices(ids as number[])}
                        bulkActions={[
                            {
                                label: t('invoices.actions.paid'),
                                icon: <FaCheck className="text-xs" />,
                                onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'paid' } }),
                                variant: 'success',
                                show: statusView === 'active' && statusFilter !== 'cancelled' && statusFilter !== 'paid'
                            },
                            {
                                label: t('invoices.actions.send_reminder'),
                                icon: <FaPaperPlane className="text-xs text-amber-500" />,
                                onClick: () => {
                                    setConfirmTitle(t('invoices.confirm.reminder_title'));
                                    setConfirmMessage(t('invoices.confirm.reminder_message', { count: selectedInvoices.length }));
                                    setConfirmLabel(t('invoices.confirm.reminders_btn'));
                                    setConfirmVariant('warning');
                                    setConfirmAction(() => () => {
                                        toast.loading('Mahnungen werden verarbeitet...');
                                        selectedInvoices.forEach(id => {
                                            const inv = invoices.find((i: any) => i.id === id);
                                            const nextLevel = (inv?.reminder_level || 0) + 1;
                                            bulkUpdateMutation.mutate({
                                                ids: [id],
                                                data: { reminder_level: nextLevel, last_reminder_date: new Date().toISOString().split('T')[0] }
                                            });
                                        });
                                    });
                                    setIsConfirmOpen(true);
                                },
                                variant: 'primary',
                                show: statusView === 'active' && (statusFilter === 'reminders' || statusFilter === 'overdue')
                            },
                            {
                                label: t('projects.actions.bulk.archive'),
                                icon: <FaArchive className="text-xs" />,
                                onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'archived' } }),
                                variant: 'default',
                                show: statusView === 'active' && statusFilter === 'paid'
                            },
                            {
                                label: t('projects.actions.bulk.restore'),
                                icon: <FaTrashRestore className="text-xs" />,
                                onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'draft' } }),
                                variant: 'success',
                                show: statusView === 'trash' || statusView === 'archive'
                            }
                        ] as BulkActionItem[]}
                        filters={tableFilters}
                        activeFilterCount={activeFilterCount}
                        onResetFilters={resetFilters}
                    />
                </div>

                <InvoicePreviewModal isOpen={!!previewInvoice} onClose={() => setPreviewInvoice(null)} invoice={previewInvoice} />


                <ConfirmModal
                    isOpen={isConfirmOpen}
                    onClose={() => {
                        setIsConfirmOpen(false);
                    }}
                    onConfirm={() => {
                        confirmAction();
                        setIsConfirmOpen(false);
                    }}
                    title={confirmTitle}
                    message={confirmMessage}
                    confirmLabel={confirmLabel}
                    variant={confirmVariant}
                    isLoading={deleteMutation.isPending || issueMutation.isPending || cancelMutation.isPending || bulkUpdateMutation.isPending}
                >
                    {confirmTitle === t('invoices.confirm.cancel_title') && (
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-slate-500 mb-1">{t('invoices.confirm.cancel_reason')}</label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full border border-slate-200 rounded-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder={t('invoices.confirm.cancel_placeholder')}
                                rows={3}
                            />
                        </div>
                    )}
                </ConfirmModal>
            </div>
        </div>
    );
};

export default Invoices;
