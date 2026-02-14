import { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    FaPlus, FaCheckCircle, FaHistory,
    FaFileExcel, FaFileCsv, FaTrash,
    FaCheck, FaPaperPlane, FaDownload, FaPrint, FaFilePdf, FaFileInvoiceDollar, FaEye, FaTrashRestore, FaFilter
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
    const [statusFilter, setStatusFilter] = useState('all');
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
            toast.success('Rechnung erfolgreich gelöscht');
        },
        onError: () => {
            toast.error('Fehler beim Löschen der Rechnung');
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

    const bulkDeleteMutation = useMutation({
        mutationFn: invoiceService.bulkDelete,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setSelectedInvoices([]);
            toast.success(`${variables.length} Rechnungen endgültig gelöscht`);
        },
        onError: () => {
            toast.error('Fehler beim endgültigen Löschen');
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

            if (statusFilter === 'pending') {
                // Pending means: Not paid, not cancelled, AND not overdue (unless we want overdue in pending?)
                // Usually "Open" includes overdue, but since we have a separate tab, let's keep them separate or include?
                // Providing a distinct "Offen" (active, not overdue) vs "Überfällig" is useful.
                return (status === 'pending' || status === 'sent' || status === 'draft') && !isOverdue;
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

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (filteredInvoices.length === 0) return;
        const headers = ['Nr', 'Datum', 'Kunde', 'Projekt', 'Fällig', 'Betrag', 'Status'];
        const rows = filteredInvoices.map((inv: any) => [
            inv.invoice_number,
            new Date(inv.date).toLocaleDateString('de-DE'),
            inv.customer?.company_name || `${inv.customer?.first_name} ${inv.customer?.last_name}`,
            inv.project?.project_name || '',
            new Date(inv.due_date).toLocaleDateString('de-DE'),
            parseFloat(inv.amount_gross || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\./g, ''),
            inv.status || ''
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Rechnungen_Export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
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
            link.setAttribute('download', `Rechnung_${inv.invoice_number}.pdf`);
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
            accessor: (inv: any) => inv.customer?.company_name || `${inv.customer?.first_name} ${inv.customer?.last_name}`,
            sortable: true
        },
        {
            id: 'project',
            header: 'Projekt',
            accessor: (inv: any) => (
                <span className="text-xs font-medium text-slate-500">{inv.project?.project_name || inv.project?.project_number}</span>
            ),
            sortable: true
        },
        {
            id: 'due_date',
            header: 'Fälligkeit',
            accessor: (inv: any) => (
                <div className="flex flex-col">
                    <span className="text-slate-600 font-medium">{new Date(inv.due_date).toLocaleDateString('de-DE')}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'due_date'
        },
        {
            id: 'amount',
            header: 'Betrag (Brutto)',
            accessor: (inv: any) => (
                <span className="font-semibold text-slate-800">{parseFloat(inv.amount_gross || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            ),
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
                const isOverdue = dueDate < today && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'deleted' && inv.status !== 'archived';
                const displayStatus = isOverdue ? 'overdue' : inv.status;
                return <InvoiceStatusBadge status={displayStatus} />;
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
                    <button onClick={() => handlePrint(inv)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="Drucken"><FaPrint /></button>
                    <button onClick={() => handleDownload(inv)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition" title="Download"><FaDownload /></button>
                    <button onClick={() => {
                        setInvoiceToDelete(inv.id);
                        setConfirmTitle('Rechnung löschen');
                        setConfirmMessage('Sind Sie sicher, dass Sie diese Rechnung in den Papierkorb verschieben möchten?');
                        setIsConfirmOpen(true);
                    }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Löschen"><FaTrash /></button>
                </div>
            ),
            align: 'right' as const
        }
    ];

    const tabs = (
        <div className="flex items-center gap-6">
            <button onClick={() => setStatusFilter('all')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'all' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Alle</button>
            <button onClick={() => setStatusFilter('pending')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'pending' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Offen</button>
            <button onClick={() => setStatusFilter('paid')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'paid' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Bezahlt</button>
            <button onClick={() => setStatusFilter('overdue')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'overdue' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Überfällig</button>
            <button onClick={() => setStatusFilter('cancelled')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'cancelled' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Storniert</button>

            {(showTrash || statusFilter === 'trash') && (
                <button onClick={() => setStatusFilter('trash')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'trash' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Papierkorb</button>
            )}
            {(showArchive || statusFilter === 'archive') && (
                <button onClick={() => setStatusFilter('archive')} className={`py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition relative ${statusFilter === 'archive' ? 'border-slate-600 text-slate-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Archiv</button>
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
        .filter((i: any) => i.status !== 'paid')
        .reduce((acc: number, curr: any) => acc + parseFloat(curr.amount_gross || 0), 0);

    const totalPaidMonth = activeInvoices
        .filter((i: any) => i.status === 'paid')
        .reduce((acc: number, curr: any) => acc + parseFloat(curr.amount_gross || 0), 0);

    const overdueCount = activeInvoices.filter((inv: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(inv.due_date);
        return dueDate < today && inv.status !== 'paid';
    }).length;

    const paidCount = activeInvoices.filter((i: any) => i.status === 'paid').length;

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col h-full gap-6 fade-in" onClick={() => setIsExportOpen(false)}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Finanzen</h1>
                    <p className="text-slate-500 text-sm">Zentralverwaltung aller Rechnungsbelege und DATEV-Exporte.</p>
                </div>
                <button
                    onClick={() => setIsNewInvoiceOpen(true)}
                    className="bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
                >
                    <FaPlus className="text-xs" /> Neue Rechnung
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard label="Offener Betrag" value={totalOpenAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaFileInvoiceDollar />} subValue={`${overdueCount} überfällig`} />
                <KPICard label="Bezahlt (Gesamt)" value={totalPaidMonth.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} icon={<FaCheckCircle />} iconColor="text-green-600" iconBg="bg-green-50" subValue={`${paidCount} Transaktionen`} />
                <KPICard label="Fremdkosten" value="0,00 €" icon={<FaHistory />} subValue="Diesen Monat" />
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-0">
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
                            label: 'Offen setzen',
                            icon: <FaHistory className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'pending' } }),
                            variant: 'primary',
                            show: statusFilter === 'paid' || statusFilter === 'cancelled'
                        },
                        {
                            label: 'Stornieren',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'cancelled' } }),
                            variant: 'warning',
                            show: statusFilter !== 'trash' && statusFilter !== 'cancelled'
                        },
                        {
                            label: 'Wiederherstellen',
                            icon: <FaTrashRestore className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'pending' } }),
                            variant: 'success',
                            show: statusFilter === 'trash' || statusFilter === 'cancelled'
                        },
                        {
                            label: 'Papierkorb',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => bulkUpdateMutation.mutate({ ids: selectedInvoices, data: { status: 'deleted' } }),
                            variant: 'danger',
                            show: statusFilter !== 'trash'
                        },
                        {
                            label: 'Endgültig löschen',
                            icon: <FaTrash className="text-xs" />,
                            onClick: () => {
                                setInvoiceToDelete(selectedInvoices);
                                setConfirmTitle('Rechnungen endgültig löschen');
                                setConfirmMessage(`Sind Sie sicher, dass Sie ${selectedInvoices.length} Rechnungen endgültig löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.`);
                                setIsConfirmOpen(true);
                            },
                            variant: 'dangerSolid',
                            show: statusFilter === 'trash'
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
                    if (invoiceToDelete) {
                        if (Array.isArray(invoiceToDelete)) {
                            bulkDeleteMutation.mutate(invoiceToDelete, {
                                onSuccess: () => {
                                    setIsConfirmOpen(false);
                                    setInvoiceToDelete(null);
                                }
                            });
                        } else {
                            deleteMutation.mutate(invoiceToDelete as number, {
                                onSuccess: () => {
                                    setIsConfirmOpen(false);
                                    setInvoiceToDelete(null);
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

export default Invoices;
