import { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaPlus, FaCheckCircle, FaHistory,
    FaFileExcel, FaFileCsv, FaTrash,
    FaCheck, FaPaperPlane, FaDownload, FaPrint, FaFilePdf, FaFileInvoiceDollar, FaEye, FaTrashRestore, FaFilter,
    FaStamp, FaBan
} from 'react-icons/fa';

import Checkbox from '../components/common/Checkbox';
import Switch from '../components/common/Switch';
import DataTable from '../components/common/DataTable';
import KPICard from '../components/common/KPICard';
import InvoicePreviewModal from '../components/modals/InvoicePreviewModal';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../api/services';
import TableSkeleton from '../components/common/TableSkeleton';
import ConfirmModal from '../components/common/ConfirmModal';
import { BulkActions } from '../components/common/BulkActions';
import InvoiceStatusBadge from '../components/invoices/InvoiceStatusBadge';


const Invoices = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [statusFilter, setStatusFilter] = useState(location.state?.filter || 'pending');
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [previewInvoice, setPreviewInvoice] = useState<any>(null);
    const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
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
            setIsNewInvoiceOpen(true);
            // Clear location state to prevent modal from reopening on refresh or navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<number | number[] | null>(null);
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
            toast.success('Rechnung erfolgreich erstellt');
        },
        onError: () => {
            toast.error('Fehler beim Erstellen der Rechnung');
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

    const filteredInvoices = useMemo(() => {
        if (!Array.isArray(invoices)) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return invoices.filter((inv: any) => {
            const status = inv.status?.toLowerCase() || 'pending';
            const dueDate = new Date(inv.due_date);
            const isOverdue = dueDate < today && status !== 'paid' && status !== 'cancelled' && status !== 'deleted' && status !== 'archived';

            // Trash and Archive are explicit states
            if (statusFilter === 'trash') return status === 'deleted' || status === 'gelöscht';
            if (statusFilter === 'archive') return status === 'archived' || status === 'archiviert';

            // Exclude Trash/Archive from main tabs
            if (status === 'deleted' || status === 'gelöscht' || status === 'archived' || status === 'archiviert') return false;

            if (statusFilter === 'paid') return status === 'paid' || status === 'bezahlt';
            if (statusFilter === 'cancelled') return status === 'cancelled' || status === 'storniert';

            if (statusFilter === 'overdue') return isOverdue;

            if (statusFilter === 'reminders') return (inv.reminder_level > 0 || isOverdue) && status !== 'paid' && status !== 'cancelled';

            if (statusFilter === 'pending') {
                return (status === 'pending' || status === 'sent' || status === 'draft' || status === 'issued') && !isOverdue;
            }

            if (statusFilter === 'all') return true;

            return status === statusFilter;
        });
    }, [invoices, statusFilter]);

    const toggleSelection = (id: number) => {
        setSelectedInvoices(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedInvoices.length === filteredInvoices.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(filteredInvoices.map((p: any) => p.id));
        }
    };

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
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    const columns = [
        {
            id: 'selection',
            header: (
                <Checkbox checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0} onChange={toggleSelectAll} />
            ),
            accessor: (p: any) => (
                <Checkbox checked={selectedInvoices.includes(p.id)} onChange={() => toggleSelection(p.id)} />
            ),
            className: 'w-10'
        },
        {
            id: 'invoice_number',
            header: 'Rechnung #',
            accessor: (inv: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{inv.invoice_number}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(inv.date).toLocaleDateString('de-DE')}
                    </span>
                </div>
            ),
            sortable: true,
            sortKey: 'invoice_number'
        },
        {
            id: 'customer',
            header: 'Empfänger',
            accessor: (inv: any) => {
                const name = inv.snapshot_customer_name || inv.customer?.company_name || `${inv.customer?.first_name || ''} ${inv.customer?.last_name || ''}`;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{name}</span>
                        {inv.type === 'credit_note' && (
                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Gutschrift</span>
                        )}
                    </div>
                );
            },
            sortable: true
        },
        {
            id: 'project',
            header: 'Projekt',
            accessor: (inv: any) => (
                <span className="text-xs font-medium text-slate-500">{inv.snapshot_project_name || inv.project?.project_name || inv.snapshot_project_number || ''}</span>
            ),
            sortable: true
        },
        {
            id: 'due_date',
            header: 'Fälligkeit',
            accessor: (inv: any) => (
                <div className="flex flex-col">
                    <span className="text-slate-600 font-medium">{new Date(inv.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'due_date'
        },
        {
            id: 'amount',
            header: 'Betrag (Brutto)',
            accessor: (inv: any) => {
                const eur = inv.amount_gross_eur ?? (inv.amount_gross / 100);
                const isNeg = eur < 0;
                return (
                    <span className={`font-semibold ${isNeg ? 'text-red-600' : 'text-slate-800'}`}>
                        {eur.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </span>
                );
            },
            sortable: true,
            sortKey: 'amount_gross',
            align: 'right' as const
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (inv: any) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(inv.due_date);
                const isOverdue = dueDate < today && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'deleted' && inv.status !== 'archived' && inv.status !== 'draft';
                const displayStatus = isOverdue ? 'overdue' : inv.status;
                return <InvoiceStatusBadge status={displayStatus} reminderLevel={inv.reminder_level} type={inv.type} />;
            },
            sortable: true,
            sortKey: 'status',
            align: 'center' as const
        },
        {
            id: 'actions',
            header: '',
            accessor: (inv: any) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setPreviewInvoice(inv)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition" title="Ansehen">
                        <FaEye />
                    </button>
                    {/* Draft: show Issue button */}
                    {inv.status === 'draft' && (
                        <button
                            onClick={() => {
                                if (window.confirm('Rechnung ausstellen und unwiderruflich sperren? (GoBD-konform, keine Änderung mehr möglich)')) {
                                    issueMutation.mutate(inv.id);
                                }
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                            title="Ausstellen (GoBD)"
                        >
                            <FaStamp />
                        </button>
                    )}
                    {/* Issued/Sent/Paid: show Cancel (Storno) button */}
                    {['issued', 'sent', 'paid', 'overdue'].includes(inv.status) && !inv.credit_note && (
                        <button
                            onClick={() => {
                                const reason = window.prompt('Storno-Grund (optional):');
                                if (reason !== null) {
                                    cancelMutation.mutate({ id: inv.id, reason: reason || undefined });
                                }
                            }}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition"
                            title="Stornieren (Gutschrift erstellen)"
                        >
                            <FaBan />
                        </button>
                    )}
                    <button onClick={() => handlePrint(inv)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="Drucken"><FaPrint /></button>
                    <button onClick={() => handleDownload(inv)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition" title="Download"><FaDownload /></button>
                    {/* Only drafts can be deleted */}
                    {inv.status === 'draft' && (
                        <button onClick={() => {
                            setInvoiceToDelete(inv.id);
                            setConfirmTitle('Entwurf löschen');
                            setConfirmMessage('Sind Sie sicher, dass Sie diesen Rechnungsentwurf löschen möchten?');
                            setIsConfirmOpen(true);
                        }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Entwurf löschen"><FaTrash /></button>
                    )}
                </div>
            ),
            align: 'right' as const
        }
    ];

    const tabs = (
        <div className="flex items-center gap-2 whitespace-nowrap px-1 py-1">
            <button onClick={() => setStatusFilter('all')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${statusFilter === 'all' ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Alle</button>
            <button onClick={() => setStatusFilter('pending')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${statusFilter === 'pending' ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Offen</button>
            <button onClick={() => setStatusFilter('paid')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${statusFilter === 'paid' ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Bezahlt</button>
            <button onClick={() => setStatusFilter('overdue')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${statusFilter === 'overdue' ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Überfällig</button>
            <button onClick={() => setStatusFilter('reminders')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${statusFilter === 'reminders' ? 'bg-amber-600 border-amber-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Mahnungen</button>
            <button onClick={() => setStatusFilter('cancelled')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${statusFilter === 'cancelled' ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Storniert</button>

            {(showTrash || statusFilter === 'trash') && (
                <button onClick={() => setStatusFilter('trash')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${statusFilter === 'trash' ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Papierkorb</button>
            )}
            {(showArchive || statusFilter === 'archive') && (
                <button onClick={() => setStatusFilter('archive')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${statusFilter === 'archive' ? 'bg-slate-600 border-slate-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Archiv</button>
            )}
        </div>
    );

    const actions = (
        <div className="relative group z-50" ref={exportRef}>
            <button onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }} className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest bg-white rounded-md flex items-center gap-2 shadow-sm transition">
                <FaDownload /> Export
            </button>
            {isExportOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl border border-slate-100 z-[100] overflow-hidden animate-fadeIn">
                    <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"><FaFileExcel className="text-emerald-600 text-sm" /> Excel (.xlsx)</button>
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 transition"><FaFileCsv className="text-blue-600 text-sm" /> CSV DATEV</button>
                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-3 text-slate-600 border-t border-slate-50 transition"><FaFilePdf className="text-red-600 text-sm" /> PDF Sammel-Report</button>
                </div>
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



    const activeInvoices = useMemo(() => {
        return invoices.filter((inv: any) => {
            const s = inv.status?.toLowerCase();
            return s !== 'archived' && s !== 'archiviert' && s !== 'deleted' && s !== 'gelöscht';
        });
    }, [invoices]);

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
        return dueDate < today && inv.status !== 'paid' && inv.status !== 'cancelled';
    }).length;

    const reminderCount = activeInvoices.filter((inv: any) => {
        return (inv.reminder_level > 0 || (new Date(inv.due_date) < new Date() && inv.status !== 'paid' && inv.status !== 'cancelled'));
    }).length;

    const paidCount = activeInvoices.filter((i: any) => i.status === 'paid').length;

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-6 fade-in pb-10" onClick={() => setIsExportOpen(false)}>
            <div className="flex justify-between items-center sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Rechnungen</h1>
                    <p className="text-slate-500 text-sm hidden sm:block">Zentralverwaltung aller Rechnungsbelege und DATEV-Exporte.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => setIsNewInvoiceOpen(true)}
                        className="bg-brand-700 hover:bg-brand-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-sm font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition active:scale-95"
                    >
                        <FaPlus className="text-[10px]" /> <span className="hidden sm:inline">Neue Rechnung</span><span className="inline sm:hidden">Rechnung</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label="Offener Betrag" value={totalOpenAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaFileInvoiceDollar />} subValue={`${overdueCount} überfällig`} />
                <KPICard label="Bezahlt (Gesamt)" value={totalPaidMonth.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaCheckCircle />} iconColor="text-green-600" iconBg="bg-green-50" subValue={`${paidCount} Transaktionen`} />
                <KPICard label="Mahnungen" value={`${reminderCount}`} icon={<FaPaperPlane />} iconColor="text-amber-600" iconBg="bg-amber-50" subValue="Fällig / Aktiv" />
                <KPICard label="Fremdkosten" value="0,00 €" icon={<FaHistory />} subValue="Diesen Monat" />
            </div>

            <div className="flex-1 flex flex-col min-h-[500px] sm:min-h-0 relative z-0">
                <BulkActions
                    selectedCount={selectedInvoices.length}
                    onClearSelection={() => setSelectedInvoices([])}
                    actions={[
                        {
                            label: 'Bezahlt',
                            icon: <FaCheck className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'paid' } }),
                            variant: 'success',
                            show: statusFilter !== 'trash' && statusFilter !== 'cancelled' && statusFilter !== 'paid'
                        },
                        {
                            label: 'Mahnung senden',
                            icon: <FaPaperPlane className="text-xs text-amber-500" />,
                            onClick: () => {
                                const confirmReminder = window.confirm(`${selectedInvoices.length} Mahnungen senden/hochstufen?`);
                                if (confirmReminder) {
                                    // Logic to increment reminder_level would go here, 
                                    // for now we use a generic bulk update or we might need a specific endpoint
                                    // Let's assume the backend handles increment if we pass a special flag or we do it here
                                    toast.loading('Mahnungen werden verarbeitet...');
                                    selectedInvoices.forEach(id => {
                                        const inv = invoices.find((i: any) => i.id === id);
                                        const nextLevel = (inv?.reminder_level || 0) + 1;
                                        bulkUpdateMutation.mutate({
                                            ids: [id],
                                            data: {
                                                reminder_level: nextLevel,
                                                last_reminder_date: new Date().toISOString().split('T')[0]
                                            }
                                        });
                                    });
                                }
                            },
                            variant: 'primary',
                            show: statusFilter === 'reminders' || statusFilter === 'overdue'
                        },
                        {
                            label: 'Senden',
                            icon: <FaPaperPlane className="text-xs" />,
                            onClick: () => {
                                toast.loading(`${selectedInvoices.length} Rechnungen werden gesendet...`, { duration: 2000 });
                                bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'sent' } });
                            },
                            variant: 'primary',
                            show: statusFilter !== 'trash' && statusFilter !== 'cancelled'
                        },
                        {
                            label: 'Wiederherstellen',
                            icon: <FaTrashRestore className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'draft' } }),
                            variant: 'success',
                            show: statusFilter === 'trash'
                        },
                        {
                            label: 'Archivieren',
                            icon: <FaHistory className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'archived' } }),
                            variant: 'primary',
                            show: statusFilter === 'paid'
                        }
                    ]}
                />

                <DataTable
                    data={filteredInvoices}
                    columns={columns as any}
                    pageSize={10}
                    searchPlaceholder="Suchen nach Nr., Kunde oder Projekt..."
                    searchFields={['invoice_number', 'customer.company_name', 'project.project_name']}
                    actions={actions}
                    tabs={tabs}
                    extraControls={extraControls}
                    onRowClick={(inv: any) => setPreviewInvoice(inv)}
                />
            </div>

            <InvoicePreviewModal isOpen={!!previewInvoice} onClose={() => setPreviewInvoice(null)} invoice={previewInvoice} />

            <NewInvoiceModal
                isOpen={isNewInvoiceOpen}
                onClose={() => setIsNewInvoiceOpen(false)}
                onSubmit={(data: any) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setInvoiceToDelete(null);
                }}
                onConfirm={() => {
                    if (invoiceToDelete && !Array.isArray(invoiceToDelete)) {
                        deleteMutation.mutate(invoiceToDelete as number, {
                            onSuccess: () => {
                                setIsConfirmOpen(false);
                                setInvoiceToDelete(null);
                            }
                        });
                    }
                }}
                title={confirmTitle}
                message={confirmMessage}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

export default Invoices;
