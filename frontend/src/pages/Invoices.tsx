import { useState, useMemo, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { triggerBlobDownload } from '../utils/download';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaPlus, FaCheck, FaCheckCircle, FaHistory,
    FaFileExcel, FaFileCsv, FaFilePdf, FaDownload,
    FaFileInvoiceDollar, FaTrashRestore, FaPaperPlane, FaFileInvoice, FaArchive, FaTrash,
} from 'react-icons/fa';
import { buildInvoiceColumns } from './invoiceColumns';
import { Button } from '../components/ui/button';

import DataTable from '../components/common/DataTable';
import KPICard from '../components/common/KPICard';
import InvoicePreviewModal from '../components/modals/InvoicePreviewModal';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import ConfirmModal from '../components/common/ConfirmModal';
import type { BulkActionItem } from '../components/common/BulkActions';
import StatusTabButton from '../components/common/StatusTabButton';
import { TooltipProvider } from '../components/ui/tooltip';



const Invoices = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [statusView, setStatusView] = useState<'active' | 'archive' | 'trash'>('active');
    const [statusFilter, setStatusFilter] = useState(location.state?.filter || 'pending');
    useEffect(() => {
        setSelectedInvoices([]);
    }, [statusFilter]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [previewInvoice, setPreviewInvoice] = useState<any>(null);
    const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

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
            setIsNewInvoiceOpen(true);
            // Clear location state to prevent modal from reopening on refresh or navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [invoiceToEdit, setInvoiceToEdit] = useState<any>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const queryClient = useQueryClient();

    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: invoiceService.getAll
    });

    const createMutation = useMutation({
        mutationFn: invoiceService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setIsNewInvoiceOpen(false);
            setInvoiceToEdit(null);
            toast.success('Rechnung erfolgreich erstellt');
        },
        onError: () => {
            toast.error('Fehler beim Erstellen der Rechnung');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (args: { id: number, data: any }) => invoiceService.update(args.id, args.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setIsNewInvoiceOpen(false);
            setInvoiceToEdit(null);
            toast.success('Rechnung erfolgreich aktualisiert');
        },
        onError: () => {
            toast.error('Fehler beim Aktualisieren der Rechnung');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: invoiceService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedInvoices([]);
            toast.success('Rechnungsentwurf gelöscht');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Nur Entwürfe können gelöscht werden.');
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
            toast.success('Rechnung ausgestellt und gesperrt (GoBD-konform)');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Fehler beim Ausstellen');
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (args: { id: number; reason?: string }) => invoiceService.cancel(args.id, args.reason),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success(data?.message || 'Rechnung storniert, Gutschrift erstellt');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Fehler beim Stornieren');
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: number[], data: any }) => invoiceService.bulkUpdate(args.ids, args.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedInvoices([]);
            toast.success(`${variables.ids.length} Rechnungen aktualisiert`);
        },
        onError: () => {
            toast.error('Rechnungen konnten nicht aktualisiert werden');
        }
    });

    const markAsPaidMutation = useMutation({
        mutationFn: (id: number) => invoiceService.bulkUpdate([id], { status: 'paid' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success('Rechnung als bezahlt markiert');
        },
        onError: () => toast.error('Fehler beim Aktualisieren'),
    });

    const filteredInvoices = useMemo(() => {
        if (!Array.isArray(invoices)) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return invoices.filter((inv: any) => {
            const status = inv.status?.toLowerCase() || 'pending';
            const dueDate = new Date(inv.due_date);
            const isOverdue = dueDate < today && status !== 'paid' && status !== 'cancelled' && status !== 'deleted' && status !== 'archived' && status !== 'draft';

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
                if (statusFilter === 'overdue') return isOverdue;
                if (statusFilter === 'reminders') return (inv.reminder_level > 0 || isOverdue) && status !== 'paid' && status !== 'cancelled';
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
                toast.success('DATEV Export erfolgreich erstellt.');
            } catch (error) {
                console.error('DATEV Export failure:', error);
                toast.error('Fehler beim DATEV Export.');
            }
            return;
        }

        // Keep other formats as is or placeholder
        const headers = ['Nr', 'Datum', 'Kunde', 'Projekt', 'Fällig', 'Betrag', 'Status'];
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

    const handlePrint = async (inv: any) => {
        try {
            // Show a small toast or indicator if possible, but the print dialog is the goal
            const response = await invoiceService.print(inv.id);

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
            console.error('Print error:', error);
            toast.error('Fehler beim Öffnen der PDF-Datei zum Drucken.');
        }
    };

    const handleDownload = async (inv: any) => {
        try {
            // Use the authenticated download endpoint
            const response = await invoiceService.download(inv.id);

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
            console.error('Download error:', error);
            toast.error('Fehler beim Herunterladen der PDF-Datei.');
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
            console.error('XML Download error:', error);
            toast.error('Fehler beim Herunterladen der XML-Datei.');
        }
    };

    const columns = buildInvoiceColumns({

        setPreviewInvoice,
        setInvoiceToEdit,
        setIsNewInvoiceOpen,
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

    const tabs = statusView === 'active' ? (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1">
            <button onClick={() => setStatusFilter('all')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'all' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Alle</button>
            <button onClick={() => setStatusFilter('pending')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'pending' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Offen</button>
            <button onClick={() => setStatusFilter('paid')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'paid' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Bezahlt</button>
            <button onClick={() => setStatusFilter('overdue')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'overdue' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Überfällig</button>
            <button onClick={() => setStatusFilter('reminders')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'reminders' ? 'bg-amber-600 border-amber-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Mahnungen</button>
            <button onClick={() => setStatusFilter('cancelled')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'cancelled' ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Storniert</button>
            <button onClick={() => setStatusFilter('credit_notes')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all border ${statusFilter === 'credit_notes' ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Gutschriften</button>
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
    const activeCount = useMemo(() => invoices.filter((inv: any) => {
        const s = inv.status?.toLowerCase();
        return s !== 'deleted' && s !== 'gelöscht' && s !== 'archived' && s !== 'archiviert';
    }).length, [invoices]);
    const archivedCount = useMemo(() => invoices.filter((inv: any) => {
        const s = inv.status?.toLowerCase();
        return s === 'archived' || s === 'archiviert';
    }).length, [invoices]);
    const trashedCount = useMemo(() => invoices.filter((inv: any) => {
        const s = inv.status?.toLowerCase();
        return s === 'deleted' || s === 'gelöscht';
    }).length, [invoices]);

    const totalOpenAmount = activeInvoices
        .filter((i: any) => i.status !== 'paid' && i.status !== 'cancelled' && i.type !== 'credit_note')
        .reduce((acc: number, curr: any) => acc + (curr.amount_gross_eur ?? (curr.amount_gross / 100)), 0);

    const totalPaidMonth = activeInvoices
        .filter((i: any) => i.status === 'paid')
        .reduce((acc: number, curr: any) => acc + (curr.amount_gross_eur ?? (curr.amount_gross / 100)), 0);

    const overdueCount = activeInvoices.filter((inv: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(inv.due_date);
        return dueDate < today && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft';
    }).length;

    const reminderCount = activeInvoices.filter((inv: any) => {
        return (inv.reminder_level > 0 || (new Date(inv.due_date) < new Date() && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft'));
    }).length;

    const paidCount = activeInvoices.filter((i: any) => i.status === 'paid').length;

    const statusTabs = (
        <TooltipProvider>
            <div className="flex items-center gap-2 mb-4">
                <StatusTabButton
                    active={statusView === 'active'}
                    onClick={() => { setStatusView('active'); setStatusFilter('pending'); }}
                    icon={<FaFileInvoice />}
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

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-6 fade-in pb-10" onClick={() => setIsExportOpen(false)}>
            <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight truncate">Rechnungen</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">Zentralverwaltung aller Rechnungsbelege und DATEV-Exporte.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        onClick={() => setIsNewInvoiceOpen(true)}
                        className={clsx(
                            "text-white font-bold shadow-sm flex items-center justify-center gap-2 transition px-4 py-2",
                            statusFilter === 'credit_notes' ? "bg-red-600 hover:bg-red-700" : "bg-brand-primary hover:bg-brand-primary/90"
                        )}
                    >
                        <FaPlus className="text-xs" />
                        <span className="hidden sm:inline">
                            {statusFilter === 'credit_notes' ? 'Neue Gutschrift' : 'Neue Rechnung'}
                        </span>
                        <span className="inline sm:hidden">
                            Neu
                        </span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label="Offener Betrag" value={totalOpenAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaFileInvoiceDollar />} subValue={`${overdueCount} überfällig`} />
                <KPICard label="Bezahlt (Gesamt)" value={totalPaidMonth.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaCheckCircle className="text-green-600" />} subValue={`${paidCount} Transaktionen`} />
                <KPICard label="Mahnungen" value={`${reminderCount}`} icon={<FaPaperPlane className="text-amber-600" />} subValue="Fällig / Aktiv" />
                <KPICard label="Fremdkosten" value="0,00 €" icon={<FaHistory />} subValue="Diesen Monat" />
            </div>

            {statusTabs}

            <div className="flex-1 flex flex-col min-h-[500px] sm:min-h-0 relative z-0">
                <DataTable
                    data={filteredInvoices}
                    columns={columns as any}
                    pageSize={10}
                    searchPlaceholder="Suchen nach Nr., Kunde oder Projekt..."
                    searchFields={['invoice_number', 'customer.company_name', 'project.project_name']}
                    actions={actions}
                    tabs={tabs}
                    onRowClick={(inv: any) => setPreviewInvoice(inv)}
                    selectable
                    selectedIds={selectedInvoices}
                    onSelectionChange={(ids) => setSelectedInvoices(ids as number[])}
                    bulkActions={[
                        {
                            label: 'Bezahlt',
                            icon: <FaCheck className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'paid' } }),
                            variant: 'success',
                            show: statusView === 'active' && statusFilter !== 'cancelled' && statusFilter !== 'paid'
                        },
                        {
                            label: 'Mahnung senden',
                            icon: <FaPaperPlane className="text-xs text-amber-500" />,
                            onClick: () => {
                                setConfirmTitle('Mahnungen versenden');
                                setConfirmMessage(`${selectedInvoices.length} Mahnungen senden/hochstufen?`);
                                setConfirmLabel('Mahnungen senden');
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
                            label: 'Archivieren',
                            icon: <FaArchive className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'archived' } }),
                            variant: 'default',
                            show: statusView === 'active' && statusFilter === 'paid'
                        },
                        {
                            label: 'Wiederherstellen',
                            icon: <FaTrashRestore className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'draft' } }),
                            variant: 'success',
                            show: statusView === 'trash' || statusView === 'archive'
                        }
                    ] as BulkActionItem[]}
                />
            </div>

            <InvoicePreviewModal isOpen={!!previewInvoice} onClose={() => setPreviewInvoice(null)} invoice={previewInvoice} />

            <NewInvoiceModal
                isOpen={isNewInvoiceOpen}
                onClose={() => {
                    setIsNewInvoiceOpen(false);
                    setInvoiceToEdit(null);
                }}
                onSubmit={(data: any) => {
                    if (invoiceToEdit) {
                        updateMutation.mutate({ id: invoiceToEdit.id, data });
                    } else {
                        createMutation.mutate(data);
                    }
                }}
                isLoading={createMutation.isPending || updateMutation.isPending}
                invoice={invoiceToEdit}
                defaultType={statusFilter === 'credit_notes' ? 'credit_note' : 'invoice'}
            />

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
                {confirmTitle === 'Rechnung stornieren' && (
                    <div className="mt-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Storno-Grund (optional)</label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="z.B. Fehlerhafte Angaben, Kundenwunsch..."
                            rows={3}
                        />
                    </div>
                )}
            </ConfirmModal>
        </div>
    );
};

export default Invoices;
