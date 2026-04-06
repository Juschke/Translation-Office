import {
    FaCheck, FaPrint, FaFilePdf, FaEye,
    FaStamp, FaBan, FaPen, FaFileCode, FaTrash, FaHistory, FaEllipsisV,
} from 'react-icons/fa';
import { Dropdown } from 'antd';
import InvoiceStatusBadge from '../components/invoices/InvoiceStatusBadge';
import { ICON_ACTION_BUTTON_CLASS, ICON_COLOR_BRAND, ICON_COLOR_DANGER, ICON_COLOR_DEFAULT, ICON_COLOR_MUTED, ICON_COLOR_SUCCESS, ICON_COLOR_WARNING, ICON_DROPDOWN_ITEM_CLASS, ICON_SIZE_XS } from '../components/ui/icon-styles';

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
                        {inv.type === 'credit_note' && <span className="text-xs font-medium text-brand-primary">{t('invoice.tabs.credit_notes')}</span>}
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
                        label: <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest pl-1">{t('common.management')}</span>,
                        children: [
                            {
                                key: 'view',
                                icon: <FaEye className={`${ICON_DROPDOWN_ITEM_CLASS} ${ICON_COLOR_MUTED}`} />,
                                label: <span className="text-xs">{t('common.details')}</span>,
                                onClick: () => setPreviewInvoice(inv),
                            },
                            ...(inv.status === 'draft' ? [{
                                key: 'edit',
                                icon: <FaPen className={`${ICON_DROPDOWN_ITEM_CLASS} ${ICON_COLOR_BRAND}`} />,
                                label: <span className="text-xs">{t('actions.edit')}</span>,
                                onClick: () => onEditInvoice(inv),
                            }] : []),
                        ]
                    },
                    {
                        key: 'fin_header',
                        type: 'group' as const,
                        label: <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest pl-1">{t('common.finance')}</span>,
                        children: [
                            ...(inv.status === 'cancelled' ? [{
                                key: 'archive',
                                icon: <FaHistory className={`${ICON_DROPDOWN_ITEM_CLASS} ${ICON_COLOR_DEFAULT}`} />,
                                label: <span className="text-xs">{t('buttons.archive')}</span>,
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
                                icon: <FaBan className={`${ICON_DROPDOWN_ITEM_CLASS} ${ICON_COLOR_WARNING}`} />,
                                label: <span className="text-xs">{t('invoice.confirm.cancel_title')}</span>,
                                onClick: () => {
                                    setConfirmTitle(t('invoice.confirm.cancel_title'));
                                    setConfirmMessage(t('invoice.confirm.cancel_message_note'));
                                    setConfirmLabel(t('invoice.confirm.cancel_title'));
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
                        label: <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest pl-1">{t('common.documents')}</span>,
                        children: [
                            {
                                key: 'print',
                                icon: <FaPrint className={`${ICON_DROPDOWN_ITEM_CLASS} ${ICON_COLOR_DEFAULT}`} />,
                                label: <span className="text-xs">{t('invoice.actions.print')}</span>,
                                onClick: () => handlePrint(inv),
                            },
                            {
                                key: 'pdf',
                                icon: <FaFilePdf className={`${ICON_DROPDOWN_ITEM_CLASS} ${ICON_COLOR_DANGER}`} />,
                                label: <span className="text-xs">{t('common.download')} PDF</span>,
                                onClick: () => handleDownload(inv),
                            },
                            {
                                key: 'xml',
                                icon: <FaFileCode className={`${ICON_DROPDOWN_ITEM_CLASS} ${ICON_COLOR_SUCCESS}`} />,
                                label: <span className="text-xs">{t('invoice.actions.download_xml')}</span>,
                                onClick: () => handleDownloadXml(inv),
                            },
                            {
                                key: 'rebuild',
                                icon: <FaHistory className={`${ICON_DROPDOWN_ITEM_CLASS} ${ICON_COLOR_BRAND}`} />,
                                label: <span className="text-xs">{t('invoice.actions.rebuild')}</span>,
                                onClick: () => handleDownload(inv, true),
                            },
                        ]
                    },
                    ...(inv.status === 'draft' ? [{
                        key: 'danger_header',
                        type: 'group' as const,
                        label: <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1">{t('common.danger_zone')}</span>,
                        children: [
                            {
                                key: 'delete',
                                icon: <FaTrash className={`${ICON_DROPDOWN_ITEM_CLASS} ${ICON_COLOR_DANGER}`} />,
                                label: <span className="text-xs font-medium">{t('actions.delete')}</span>,
                                danger: true,
                                onClick: () => {
                                    setConfirmTitle(t('invoice.confirm.delete_title'));
                                    setConfirmMessage(t('invoice.confirm.delete_message'));
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
                                    setConfirmTitle(t('invoice.confirm.issue_title'));
                                    setConfirmMessage(t('invoice.confirm.issue_message'));
                                    setConfirmLabel(t('invoice.confirm.issue_btn'));
                                    setConfirmVariant('info');
                                    setConfirmAction(() => () => issueMutation.mutate(inv.id));
                                    setIsConfirmOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 border border-brand-primary/20 rounded-sm text-[10px] font-bold uppercase transition-all shadow-sm"
                                title={t('invoice.actions.issue')}
                            >
                                <FaStamp className={ICON_SIZE_XS} />
                                <span>{t('invoice.actions.issue_short')}</span>
                            </button>
                        )}

                        {['issued', 'overdue'].includes(inv.status) && (inv.amount_due_eur > 0) && (
                            <button
                                onClick={() => markAsPaidMutation.mutate(inv.id)}
                                disabled={markAsPaidMutation.isPending}
                                className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-sm text-[10px] font-bold uppercase transition-all shadow-sm disabled:opacity-40"
                                title={t('invoice.actions.paid')}
                            >
                                <FaCheck className={ICON_SIZE_XS} />
                                <span>{t('invoice.actions.paid')}</span>
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
                                className={ICON_ACTION_BUTTON_CLASS}
                                title={t('common.more_actions')}
                            >
                                <FaEllipsisV className={ICON_SIZE_XS} />
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
