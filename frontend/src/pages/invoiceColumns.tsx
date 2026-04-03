import {
    FaCheck, FaPrint, FaFilePdf, FaEye,
    FaStamp, FaBan, FaPen, FaFileCode, FaTrash, FaHistory, FaEllipsisV,
} from 'react-icons/fa';
import { Dropdown } from 'antd';
import InvoiceStatusBadge from '../components/invoices/InvoiceStatusBadge';

export interface BuildInvoiceColumnsParams {
    t: (key: string, options?: any) => string;
    setPreviewInvoice: (inv: any) => void;
    onEditInvoice: (inv: any) => void;
    issueMutation: any;
    cancelMutation: any;
    markAsPaidMutation: any;
    archiveMutation: any;
    deleteMutation: any;
    handlePrint: (inv: any, rebuild?: boolean) => void;
    handleDownload: (inv: any, rebuild?: boolean) => void;
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
    t,
    setPreviewInvoice,
    onEditInvoice,
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
            header: t('fields.invoice_number'),
            accessor: (inv: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{inv.invoice_number}</span>
                    <span className="text-xs font-semibold text-slate-400">{new Date(inv.date).toLocaleDateString('de-DE')}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'invoice_number',
            width: 100,
        },
        {
            id: 'customer',
            header: t('fields.recipient'),
            accessor: (inv: any) => {
                const name = inv.snapshot_customer_name || inv.customer?.company_name || `${inv.customer?.first_name || ''} ${inv.customer?.last_name || ''}`;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{name}</span>
                        {inv.type === 'credit_note' && <span className="text-xs font-medium text-red-500">{t('invoices.tabs.credit_notes')}</span>}
                    </div>
                );
            },
            sortable: true,
            width: 140,
        },
        {
            id: 'project',
            header: t('fields.project'),
            accessor: (inv: any) => (
                <span className="text-xs font-medium text-slate-500">{inv.snapshot_project_name || inv.project?.project_name || inv.snapshot_project_number || ''}</span>
            ),
            sortable: true,
            width: 120,
        },
        {
            id: 'due_date',
            header: t('fields.due_date'),
            accessor: (inv: any) => (
                <div className="flex flex-col">
                    <span className="text-slate-600 font-medium">{new Date(inv.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'due_date',
            width: 90,
        },
        {
            id: 'amount_net',
            header: `${t('fields.amount')} (${t('fields.net')})`,
            accessor: (inv: any) => {
                const eur = inv.amount_net_eur ?? (inv.amount_net / 100);
                return (
                    <span className={`font-medium tabular-nums ${eur < 0 ? 'text-red-500' : 'text-slate-600'}`}>
                        {eur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                );
            },
            sortable: true,
            sortKey: 'amount_net',
            align: 'right' as const,
            width: 80,
        },
        {
            id: 'amount_gross',
            header: `${t('fields.amount')} (${t('fields.gross')})`,
            accessor: (inv: any) => {
                const eur = inv.amount_gross_eur ?? (inv.amount_gross / 100);
                return (
                    <span className={`font-bold tabular-nums ${eur < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {eur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                );
            },
            sortable: true,
            sortKey: 'amount_gross',
            align: 'right' as const,
            width: 80,
        },
        {
            id: 'status',
            header: t('common.status'),
            accessor: (inv: any) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dRaw = new Date(inv.due_date);
                const dueDate = new Date(dRaw.getFullYear(), dRaw.getMonth(), dRaw.getDate());
                const isOverdue = dueDate < today && !['paid', 'bezahlt', 'cancelled', 'storniert', 'deleted', 'gelöscht', 'archived', 'archiviert', 'draft'].includes(inv.status?.toLowerCase());
                const displayStatus = isOverdue ? 'overdue' : inv.status;
                return <InvoiceStatusBadge status={displayStatus} reminderLevel={inv.reminder_level} type={inv.type} />;
            },
            sortable: true,
            sortKey: 'status',
            align: 'center' as const,
            width: 100,
        },
        {
            id: 'actions',
            header: '',
            accessor: (inv: any) => {
                const actionMenuItems = [
                    {
                        key: 'mgmt_header',
                        type: 'group' as const,
                        label: <span className="text-2xs font-bold text-brand-primary uppercase tracking-widest pl-1">{t('common.management')}</span>,
                        children: [
                            {
                                key: 'view',
                                icon: <FaEye className="text-slate-400" />,
                                label: <span className="text-xs">{t('common.details')}</span>,
                                onClick: () => setPreviewInvoice(inv),
                            },
                            ...(inv.status === 'draft' ? [{
                                key: 'edit',
                                icon: <FaPen className="text-brand-primary" />,
                                label: <span className="text-xs">{t('actions.edit')}</span>,
                                onClick: () => onEditInvoice(inv),
                            }] : []),
                        ]
                    },
                    {
                        key: 'fin_header',
                        type: 'group' as const,
                        label: <span className="text-2xs font-bold text-brand-primary uppercase tracking-widest pl-1">{t('common.finance')}</span>,
                        children: [
                            ...(inv.status === 'cancelled' ? [{
                                key: 'archive',
                                icon: <FaHistory className="text-slate-500" />,
                                label: <span className="text-xs">{t('projects.actions.bulk.archive')}</span>,
                                onClick: () => {
                                    setConfirmTitle(t('projects.actions.bulk.archive'));
                                    setConfirmMessage(t('projects.confirm.archive_message', { count: 1 }));
                                    setConfirmLabel(t('projects.actions.bulk.archive'));
                                    setConfirmVariant('info');
                                    setConfirmAction(() => () => archiveMutation.mutate({ ids: [inv.id], data: { status: 'archived' } }));
                                    setIsConfirmOpen(true);
                                },
                            }] : []),
                            ...(['issued', 'paid', 'overdue'].includes(inv.status) && !inv.credit_note ? [{
                                key: 'cancel',
                                icon: <FaBan className="text-orange-500" />,
                                label: <span className="text-xs">{t('invoices.confirm.cancel_title')}</span>,
                                onClick: () => {
                                    setConfirmTitle(t('invoices.confirm.cancel_title'));
                                    setConfirmMessage(t('invoices.confirm.cancel_message_note') || 'Möchten Sie diese Rechnung wirklich stornieren? Es wird eine automatische Gutschrift erstellt.');
                                    setConfirmLabel(t('invoices.confirm.cancel_title'));
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
                        label: <span className="text-2xs font-bold text-brand-primary uppercase tracking-widest pl-1">{t('common.documents')}</span>,
                        children: [
                            {
                                key: 'print',
                                icon: <FaPrint className="text-slate-500" />,
                                label: <span className="text-xs">{t('invoices.actions.print')}</span>,
                                onClick: () => handlePrint(inv),
                            },
                            {
                                key: 'pdf',
                                icon: <FaFilePdf className="text-red-500" />,
                                label: <span className="text-xs">{t('common.download')} PDF</span>,
                                onClick: () => handleDownload(inv),
                            },
                            {
                                key: 'xml',
                                icon: <FaFileCode className="text-emerald-500" />,
                                label: <span className="text-xs">{t('invoices.actions.download_xml')}</span>,
                                onClick: () => handleDownloadXml(inv),
                            },
                            {
                                key: 'rebuild',
                                icon: <FaHistory className="text-blue-500" />,
                                label: <span className="text-xs">{t('invoices.actions.rebuild')}</span>,
                                onClick: () => handleDownload(inv, true),
                            },
                        ]
                    },
                    ...(inv.status === 'draft' ? [{
                        key: 'danger_header',
                        type: 'group' as const,
                        label: <span className="text-2xs font-bold text-red-500 uppercase tracking-widest pl-1">{t('common.danger_zone')}</span>,
                        children: [
                            {
                                key: 'delete',
                                icon: <FaTrash />,
                                label: <span className="text-xs font-medium">{t('actions.delete')}</span>,
                                danger: true,
                                onClick: () => {
                                    setConfirmTitle(t('invoices.confirm.delete_title') || t('actions.delete'));
                                    setConfirmMessage(t('invoices.confirm.delete_message') || 'Sind Sie sicher, dass Sie diesen Rechnungsentwurf löschen möchten?');
                                    setConfirmLabel(t('actions.delete'));
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
                                    setConfirmTitle(t('invoices.confirm.issue_title') || 'Rechnung ausstellen');
                                    setConfirmMessage(t('invoices.confirm.issue_message') || 'Rechnung ausstellen und unwiderruflich sperren? (GoBD-konform, keine Änderung mehr möglich)');
                                    setConfirmLabel(t('invoices.confirm.issue_btn') || 'Jetzt ausstellen');
                                    setConfirmVariant('info');
                                    setConfirmAction(() => () => issueMutation.mutate(inv.id));
                                    setIsConfirmOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 border border-brand-primary/20 rounded-sm text-2xs font-bold uppercase tracking-tight transition-all shadow-sm"
                                title={t('invoices.actions.issue') || "Ausstellen (GoBD)"}
                            >
                                <FaStamp className="text-xs" />
                                <span>{t('invoices.actions.issue_short') || "Ausstellen"}</span>
                            </button>
                        )}

                        {['issued', 'overdue'].includes(inv.status) && (inv.amount_due_eur > 0) && (
                            <button
                                onClick={() => markAsPaidMutation.mutate(inv.id)}
                                disabled={markAsPaidMutation.isPending}
                                className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-sm text-2xs font-bold uppercase tracking-tight transition-all shadow-sm disabled:opacity-40"
                                title={t('invoices.actions.paid')}
                            >
                                <FaCheck className="text-xs" />
                                <span>{t('invoices.actions.paid')}</span>
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
                                className="p-1 px-1.5 rounded-sm hover:bg-slate-100 text-slate-400 hover:text-brand-primary transition-all border border-transparent hover:border-slate-200"
                                title={t('common.more_actions')}
                            >
                                <FaEllipsisV className="text-2xs" />
                            </button>
                        </Dropdown>
                    </div>
                );
            },
            align: 'right' as const,
            width: 90,
        },
    ];
}
