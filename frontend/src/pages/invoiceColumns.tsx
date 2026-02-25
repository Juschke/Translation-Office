import {
    FaCheck, FaPrint, FaFilePdf, FaEye,
    FaStamp, FaBan, FaPen, FaFileCode, FaTrash, FaHistory, FaEllipsisV,
} from 'react-icons/fa';
import { Dropdown } from 'antd';
import InvoiceStatusBadge from '../components/invoices/InvoiceStatusBadge';

export interface BuildInvoiceColumnsParams {
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
        },
        {
            id: 'project',
            header: 'Projekt',
            accessor: (inv: any) => (
                <span className="text-xs font-medium text-slate-500">{inv.snapshot_project_name || inv.project?.project_name || inv.snapshot_project_number || ''}</span>
            ),
            sortable: true,
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
            accessor: (inv: any) => {
                const actionMenuItems = [
                    {
                        key: 'mgmt_header',
                        type: 'group' as const,
                        label: <span className="text-[9px] font-bold text-[#1B4D4F] uppercase tracking-widest pl-1">Verwaltung</span>,
                        children: [
                            {
                                key: 'view',
                                icon: <FaEye className="text-slate-400" />,
                                label: <span className="text-xs">Ansehen (Vorschau)</span>,
                                onClick: () => setPreviewInvoice(inv),
                            },
                            ...(inv.status === 'draft' ? [{
                                key: 'edit',
                                icon: <FaPen className="text-teal-500" />,
                                label: <span className="text-xs">Bearbeiten</span>,
                                onClick: () => { setInvoiceToEdit(inv); setIsNewInvoiceOpen(true); },
                            }] : []),
                        ]
                    },
                    {
                        key: 'fin_header',
                        type: 'group' as const,
                        label: <span className="text-[9px] font-bold text-[#1B4D4F] uppercase tracking-widest pl-1">Finanzen</span>,
                        children: [
                            ...(inv.status === 'cancelled' ? [{
                                key: 'archive',
                                icon: <FaHistory className="text-slate-500" />,
                                label: <span className="text-xs">Archivieren</span>,
                                onClick: () => {
                                    setConfirmTitle('Rechnung archivieren');
                                    setConfirmMessage('Möchten Sie diese stornierte Rechnung archivieren?');
                                    setConfirmLabel('Archivieren');
                                    setConfirmVariant('info');
                                    setConfirmAction(() => () => archiveMutation.mutate({ ids: [inv.id], data: { status: 'archived' } }));
                                    setIsConfirmOpen(true);
                                },
                            }] : []),
                            ...(['issued', 'paid', 'overdue'].includes(inv.status) && !inv.credit_note ? [{
                                key: 'cancel',
                                icon: <FaBan className="text-orange-500" />,
                                label: <span className="text-xs">Stornieren (Gutschrift)</span>,
                                onClick: () => {
                                    setConfirmTitle('Rechnung stornieren');
                                    setConfirmMessage('Möchten Sie diese Rechnung wirklich stornieren? Es wird eine automatische Gutschrift erstellt.');
                                    setConfirmLabel('Stornieren');
                                    setConfirmVariant('warning');
                                    setConfirmAction(() => () => cancelMutation.mutate({ id: inv.id, reason: cancelReason || undefined }));
                                    setIsConfirmOpen(true);
                                },
                            }] : []),
                        ]
                    },
                    {
                        key: 'docs_header',
                        type: 'group' as const,
                        label: <span className="text-[9px] font-bold text-[#1B4D4F] uppercase tracking-widest pl-1">Dokumente</span>,
                        children: [
                            {
                                key: 'print',
                                icon: <FaPrint className="text-slate-500" />,
                                label: <span className="text-xs">Drucken</span>,
                                onClick: () => handlePrint(inv),
                            },
                            {
                                key: 'pdf',
                                icon: <FaFilePdf className="text-red-500" />,
                                label: <span className="text-xs">PDF Herunterladen</span>,
                                onClick: () => handleDownload(inv),
                            },
                            {
                                key: 'xml',
                                icon: <FaFileCode className="text-emerald-500" />,
                                label: <span className="text-xs">E-Rechnung (XML)</span>,
                                onClick: () => handleDownloadXml(inv),
                            },
                        ]
                    },
                    ...(inv.status === 'draft' ? [{
                        key: 'danger_header',
                        type: 'group' as const,
                        label: <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest pl-1">Gefahrenzone</span>,
                        children: [
                            {
                                key: 'delete',
                                icon: <FaTrash />,
                                label: <span className="text-xs font-medium">Entwurf löschen</span>,
                                danger: true,
                                onClick: () => {
                                    setConfirmTitle('Entwurf löschen');
                                    setConfirmMessage('Sind Sie sicher, dass Sie diesen Rechnungsentwurf löschen möchten?');
                                    setConfirmLabel('Löschen');
                                    setConfirmVariant('danger');
                                    setConfirmAction(() => () => deleteMutation.mutate(inv.id));
                                    setIsConfirmOpen(true);
                                },
                            }
                        ]
                    }] : []),
                ];

                return (
                    <div className="flex justify-end gap-1.5 items-center" onClick={(e) => e.stopPropagation()}>
                        {/* Primary Actions (Visible) */}
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
                                className="flex items-center gap-1.5 px-2 py-1 bg-[#1B4D4F]/5 text-[#1B4D4F] hover:bg-[#1B4D4F]/10 border border-[#1B4D4F]/20 rounded-sm text-[10px] font-bold uppercase tracking-tight transition-all shadow-sm"
                                title="Ausstellen (GoBD)"
                            >
                                <FaStamp className="text-xs" />
                                <span>Ausstellen</span>
                            </button>
                        )}

                        {['issued', 'overdue'].includes(inv.status) && (inv.amount_due_eur > 0) && (
                            <button
                                onClick={() => markAsPaidMutation.mutate(inv.id)}
                                disabled={markAsPaidMutation.isPending}
                                className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-sm text-[10px] font-bold uppercase tracking-tight transition-all shadow-sm disabled:opacity-40"
                                title="Als bezahlt markieren"
                            >
                                <FaCheck className="text-xs" />
                                <span>Bezahlt</span>
                            </button>
                        )}

                        <Dropdown
                            menu={{
                                items: actionMenuItems,
                                className: 'invoice-action-menu-dropdown',
                            }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <button
                                className="p-1 px-1.5 rounded-sm hover:bg-slate-100 text-slate-400 hover:text-[#1B4D4F] transition-all border border-transparent hover:border-slate-200"
                                title="Weitere Aktionen"
                            >
                                <FaEllipsisV className="text-[10px]" />
                            </button>
                        </Dropdown>
                    </div>
                );
            },
            align: 'right' as const,
        },
    ];
}
