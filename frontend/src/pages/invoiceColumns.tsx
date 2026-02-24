import {
    FaCheck, FaDownload, FaPrint, FaFilePdf, FaEye,
    FaStamp, FaBan, FaPen, FaFileCode, FaTrash, FaHistory,
} from 'react-icons/fa';
import Checkbox from '../components/common/Checkbox';
import InvoiceStatusBadge from '../components/invoices/InvoiceStatusBadge';

export interface BuildInvoiceColumnsParams {
    selectedInvoices: number[];
    filteredInvoices: any[];
    toggleSelection: (id: number) => void;
    toggleSelectAll: () => void;
    downloadDropdownOpen: number | null;
    setDownloadDropdownOpen: (id: number | null) => void;
    setPreviewInvoice: (inv: any) => void;
    setInvoiceToEdit: (inv: any) => void;
    setIsNewInvoiceOpen: (v: boolean) => void;
    issueMutation: any;
    cancelMutation: any;
    markAsPaidMutation: any;
    archiveMutation: any;
    deleteMutation: any;
    handlePrint: (inv: any) => void;
    handleDownload: (inv: any) => void;
    handleDownloadXml: (inv: any) => void;
    cancelReason: string;
    setCancelReason: (r: string) => void;
    setConfirmTitle: (t: string) => void;
    setConfirmMessage: (m: string) => void;
    setConfirmLabel: (l: string) => void;
    setConfirmVariant: (v: 'danger' | 'warning' | 'info') => void;
    setConfirmAction: (fn: () => () => void) => void;
    setIsConfirmOpen: (v: boolean) => void;
}

export function buildInvoiceColumns({
    selectedInvoices,
    filteredInvoices,
    toggleSelection,
    toggleSelectAll,
    downloadDropdownOpen,
    setDownloadDropdownOpen,
    setPreviewInvoice,
    setInvoiceToEdit,
    setIsNewInvoiceOpen,
    issueMutation,
    cancelMutation,
    markAsPaidMutation,
    archiveMutation,
    deleteMutation,
    handlePrint,
    handleDownload,
    handleDownloadXml,
    cancelReason,
    setConfirmTitle,
    setConfirmMessage,
    setConfirmLabel,
    setConfirmVariant,
    setConfirmAction,
    setIsConfirmOpen,
}: BuildInvoiceColumnsParams) {
    return [
        {
            id: 'selection',
            header: (
                <Checkbox
                    checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={toggleSelectAll}
                />
            ),
            accessor: (p: any) => (
                <Checkbox checked={selectedInvoices.includes(p.id)} onChange={() => toggleSelection(p.id)} />
            ),
            className: 'w-10',
        },
        {
            id: 'invoice_number',
            header: 'Rechnung #',
            accessor: (inv: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{inv.invoice_number}</span>
                    <span className="text-xs font-semibold text-slate-400">{new Date(inv.date).toLocaleDateString('de-DE')}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'invoice_number',
        },
        {
            id: 'customer',
            header: 'Empfänger',
            accessor: (inv: any) => {
                const name = inv.snapshot_customer_name || inv.customer?.company_name || `${inv.customer?.first_name || ''} ${inv.customer?.last_name || ''}`;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{name}</span>
                        {inv.type === 'credit_note' && <span className="text-xs font-medium text-red-500">Gutschrift</span>}
                    </div>
                );
            },
            sortable: true,
            sortKey: 'snapshot_customer_name',
        },
        {
            id: 'project',
            header: 'Projekt',
            accessor: (inv: any) => (
                <span className="text-xs font-medium text-slate-500">{inv.snapshot_project_name || inv.project?.project_name || inv.snapshot_project_number || ''}</span>
            ),
            sortable: true,
            sortKey: 'snapshot_project_name',
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
            sortKey: 'due_date',
        },
        {
            id: 'amount',
            header: 'Betrag (Brutto)',
            accessor: (inv: any) => {
                const eur = inv.amount_gross_eur ?? (inv.amount_gross / 100);
                return (
                    <span className={`font-semibold ${eur < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        {eur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                );
            },
            sortable: true,
            sortKey: 'amount_gross',
            align: 'right' as const,
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
            align: 'center' as const,
        },
        {
            id: 'actions',
            header: '',
            accessor: (inv: any) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setPreviewInvoice(inv)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title="Ansehen">
                        <FaEye />
                    </button>
                    {inv.status === 'draft' && (
                        <button
                            onClick={() => {
                                setConfirmTitle('Rechnung ausstellen');
                                setConfirmMessage('Rechnung ausstellen und unwiderruflich sperren? (GoBD-konform, keine Änderung mehr möglich)');
                                setConfirmLabel('Jetzt ausstellen');
                                setConfirmVariant('info');
                                setConfirmAction(() => () => issueMutation.mutate(inv.id));
                                setIsConfirmOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-sm transition"
                            title="Ausstellen (GoBD)"
                        >
                            <FaStamp />
                        </button>
                    )}
                    {inv.status === 'draft' && (
                        <button
                            onClick={() => { setInvoiceToEdit(inv); setIsNewInvoiceOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition"
                            title="Entwurf bearbeiten"
                        >
                            <FaPen />
                        </button>
                    )}
                    {['issued', 'paid', 'overdue'].includes(inv.status) && !inv.credit_note && (
                        <button
                            onClick={() => {
                                setConfirmTitle('Rechnung stornieren');
                                setConfirmMessage('Möchten Sie diese Rechnung wirklich stornieren? Es wird eine automatische Gutschrift erstellt.');
                                setConfirmLabel('Stornieren');
                                setConfirmVariant('warning');
                                setConfirmAction(() => () => cancelMutation.mutate({ id: inv.id, reason: cancelReason || undefined }));
                                setIsConfirmOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-sm transition"
                            title="Stornieren (Gutschrift erstellen)"
                        >
                            <FaBan />
                        </button>
                    )}
                    {inv.status === 'cancelled' && (
                        <button
                            onClick={() => {
                                setConfirmTitle('Rechnung archivieren');
                                setConfirmMessage('Möchten Sie diese stornierte Rechnung archivieren?');
                                setConfirmLabel('Archivieren');
                                setConfirmVariant('info');
                                setConfirmAction(() => () => archiveMutation.mutate({ ids: [inv.id], data: { status: 'archived' } }));
                                setIsConfirmOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-sm transition"
                            title="Archivieren"
                        >
                            <FaHistory />
                        </button>
                    )}
                    {['issued', 'overdue'].includes(inv.status) && (inv.amount_due_eur > 0) && (
                        <button
                            onClick={() => markAsPaidMutation.mutate(inv.id)}
                            disabled={markAsPaidMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-sm transition disabled:opacity-40"
                            title="Als bezahlt markieren"
                        >
                            <FaCheck />
                        </button>
                    )}
                    <button onClick={() => handlePrint(inv)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition" title="Drucken"><FaPrint /></button>

                    <div className="relative invoice-download-dropdown">
                        <button
                            onClick={() => setDownloadDropdownOpen(downloadDropdownOpen === inv.id ? null : inv.id)}
                            className={`p-1.5 rounded-sm transition ${downloadDropdownOpen === inv.id ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            title="Download"
                        >
                            <FaDownload />
                        </button>
                        {downloadDropdownOpen === inv.id && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-sm border border-slate-200 z-[100] rounded-sm overflow-hidden text-left origin-top-right ring-1 ring-black ring-opacity-5">
                                <div className="py-1">
                                    <div className="px-4 py-2 text-xs font-medium text-slate-400 bg-transparent border-b border-slate-100 mb-1">
                                        Download Optionen
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(inv); setDownloadDropdownOpen(null); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-blue-50 flex items-center gap-3 text-slate-700 transition-colors group">
                                        <div className="p-1.5 bg-red-50 rounded group-hover:bg-red-100 transition-colors">
                                            <FaFilePdf className="text-red-500 text-sm" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">PDF (Druckansicht)</div>
                                            <div className="text-xs text-slate-400">Standard Dokument</div>
                                        </div>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDownloadXml(inv); setDownloadDropdownOpen(null); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-emerald-50 flex items-center gap-3 text-slate-700 transition-colors group">
                                        <div className="p-1.5 bg-emerald-50 rounded group-hover:bg-emerald-100 transition-colors">
                                            <FaFileCode className="text-emerald-500 text-sm" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">E-Rechnung (XML)</div>
                                            <div className="text-xs text-slate-400">XRechnung 3.0 / ZUGFeRD</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {inv.status === 'draft' && (
                        <button onClick={() => {
                            setConfirmTitle('Entwurf löschen');
                            setConfirmMessage('Sind Sie sicher, dass Sie diesen Rechnungsentwurf löschen möchten?');
                            setConfirmLabel('Löschen');
                            setConfirmVariant('danger');
                            setConfirmAction(() => () => deleteMutation.mutate(inv.id));
                            setIsConfirmOpen(true);
                        }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition" title="Entwurf löschen"><FaTrash /></button>
                    )}
                </div>
            ),
            align: 'right' as const,
        },
    ];
}
