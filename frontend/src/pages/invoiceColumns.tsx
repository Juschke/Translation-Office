import {
    FaCheck, FaPrint, FaFilePdf,
    FaStamp, FaBan, FaPen, FaFileCode, FaTrash, FaHistory, FaEllipsisV,
    FaFileInvoiceDollar,
} from 'react-icons/fa';
import { Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import InvoiceStatusBadge from '../components/invoices/InvoiceStatusBadge';
import { ICON_ACTION_BUTTON_CLASS, ICON_SIZE_XS } from '../components/ui/icon-styles';

export interface BuildInvoiceColumnsParams {
    t: (key: string, options?: any) => string;
    onEditInvoice: (inv: any) => void;
    issueMutation: any;
    markAsPaidMutation: any;
    deleteMutation: any;
    handlePrint: (inv: any, rebuild?: boolean) => void;
    handleDownload: (inv: any, rebuild?: boolean) => void;
    handleDownloadXml: (inv: any) => void;
    datevExportSingle: (inv: any) => void;
    createCreditNote: (inv: any) => void;
    setConfirmTitle: (t: string) => void;
    setConfirmMessage: (m: string) => void;
    setConfirmLabel: (l: string) => void;
    setConfirmVariant: (v: 'danger' | 'warning' | 'info') => void;
    setConfirmAction: (fn: () => () => void) => void;
    setIsConfirmOpen: (v: boolean) => void;
}

export function buildInvoiceColumns({
    t,
    onEditInvoice,
    issueMutation,
    markAsPaidMutation,
    deleteMutation,
    handlePrint,
    handleDownload,
    handleDownloadXml,
    datevExportSingle,
    createCreditNote,
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
                <span className="font-semibold text-slate-800">{inv.invoice_number}</span>
            ),
            sortable: true,
            sortKey: 'invoice_number',
            width: 90,
        },
        {
            id: 'date',
            header: t('fields.date'),
            accessor: (inv: any) => (
                <span className="text-xs font-medium text-slate-600">
                    {format(new Date(inv.date), 'dd.MM.yyyy')}
                </span>
            ),
            sortable: true,
            sortKey: 'date',
            width: 80,
        },
        {
            id: 'customer',
            header: t('fields.recipient'),
            accessor: (inv: any) => {
                const salutation = (inv.snapshot_customer_salutation || inv.customer?.salutation) ? `${inv.snapshot_customer_salutation || inv.customer.salutation} ` : '';
                const name = inv.snapshot_customer_name || inv.customer?.company_name || `${inv.customer?.first_name || ''} ${inv.customer?.last_name || ''}`;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{salutation}{name}</span>
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
                <span className="text-xs font-bold text-slate-700">{inv.snapshot_project_number || inv.project?.project_number || ''}</span>
            ),
            sortable: true,
            width: 120,
        },
        {
            id: 'due_date',
            header: t('fields.due_date'),
            accessor: (inv: any) => {
                const date = new Date(inv.due_date);
                const isPast = date < new Date() && !['paid', 'cancelled'].includes(inv.status);
                return (
                    <div className="flex flex-col cursor-help">
                        <span className={`text-[11px] font-semibold ${isPast ? 'text-red-500' : 'text-slate-600'}`}>
                            {format(date, 'dd.MM.yyyy')}
                        </span>
                        <span className="text-[9px] text-slate-400 leading-tight">
                            {formatDistanceToNow(date, { addSuffix: true, locale: de })}
                        </span>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'due_date',
            width: 100,
        },
        {
            id: 'amount_net',
            header: `${t('fields.amount')} (${t('fields.net')})`,
            accessor: (inv: any) => {
                const eur = inv.amount_net_eur ?? (inv.amount_net / 100);
                const gross = inv.amount_gross_eur ?? (inv.amount_gross / 100);
                const sameValue = Math.abs(eur - gross) < 0.001;

                return (
                    <div className="flex flex-col items-end">
                        <span className={`font-medium tabular-nums ${eur < 0 ? 'text-red-500' : 'text-slate-600'}`}>
                            {eur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                        {sameValue && inv.tax_rate === 0 && (
                            <span className="text-[9px] text-slate-400 font-medium">0% USt.</span>
                        )}
                    </div>
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
                    <Tooltip title={inv.tax_rate > 0 ? `${inv.tax_rate}% USt. enthalten` : 'Steuerfrei / 0% USt.'}>
                        <span className={`font-bold tabular-nums cursor-help ${eur < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                            {eur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                    </Tooltip>
                );
            },
            sortable: true,
            sortKey: 'amount_gross',
            align: 'right' as const,
            width: 85,
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
                // ── Primäre Schnellaktionen (sichtbar) ──────────────────────
                // Nur die eine wichtigste Aktion je Status direkt anzeigen.

                // ── Dropdown-Menü (flach, nach Häufigkeit sortiert) ─────────
                const items: MenuProps['items'] = [];

                // 1. Bearbeiten — nur Entwurf
                if (inv.status === 'draft') {
                    items.push({
                        key: 'edit',
                        icon: <FaPen className="text-slate-400 text-xs" />,
                        label: <span className="text-xs text-slate-700">Bearbeiten</span>,
                        onClick: () => onEditInvoice(inv),
                    });
                    items.push({ type: 'divider' });
                }

                // 2. Drucken
                items.push({
                    key: 'print',
                    icon: <FaPrint className="text-slate-400 text-xs" />,
                    label: <span className="text-xs text-slate-700">Drucken</span>,
                    onClick: () => handlePrint(inv),
                });

                // 3. Download
                items.push({
                    key: 'pdf',
                    icon: <FaFilePdf className="text-slate-400 text-xs" />,
                    label: <span className="text-xs text-slate-700">Download</span>,
                    onClick: () => handleDownload(inv),
                });

                // 4. Stornieren (Gutschrift)
                if (['issued', 'paid', 'overdue'].includes(inv.status) && !inv.credit_note_id && !inv.creditNote) {
                    items.push({
                        key: 'credit_note',
                        icon: <FaBan className="text-slate-400 text-xs" />,
                        label: <span className="text-xs text-slate-700">Stornieren (Gutschrift)</span>,
                        onClick: () => createCreditNote(inv),
                    });
                }

                items.push({ type: 'divider' });

                // 6. Weitere Optionen
                const moreChildren: NonNullable<MenuProps['items']> = [
                    {
                        key: 'datev',
                        icon: <FaFileInvoiceDollar className="text-slate-400 text-xs" />,
                        label: <span className="text-xs text-slate-700">DATEV</span>,
                        onClick: () => datevExportSingle(inv),
                    },
                    {
                        key: 'xml',
                        icon: <FaFileCode className="text-slate-400 text-xs" />,
                        label: <span className="text-xs text-slate-700">ZUGFeRD</span>,
                        onClick: () => handleDownloadXml(inv),
                    },
                    {
                        key: 'rebuild',
                        icon: <FaHistory className="text-slate-400 text-xs" />,
                        label: <span className="text-xs text-slate-700">Neu erstellen</span>,
                        onClick: () => handleDownload(inv, true),
                    },
                ];

                items.push({
                    key: 'more',
                    icon: <FaEllipsisV className="text-slate-400 text-xs" />,
                    label: <span className="text-xs text-slate-500 font-medium">Weitere</span>,
                    children: moreChildren,
                });

                // 7. Löschen — nur Entwurf
                if (inv.status === 'draft') {
                    items.push({ type: 'divider' });
                    items.push({
                        key: 'delete',
                        icon: <FaTrash className="text-red-400 text-xs" />,
                        label: <span className="text-xs text-red-500">Löschen</span>,
                        danger: true,
                        onClick: () => {
                            setConfirmTitle(t('invoice.confirm.delete_title'));
                            setConfirmMessage(t('invoice.confirm.delete_message'));
                            setConfirmLabel(t('actions.delete'));
                            setConfirmVariant('danger');
                            setConfirmAction(() => () => deleteMutation.mutate(inv.id));
                            setIsConfirmOpen(true);
                        },
                    });
                }

                return (
                    <div className="flex justify-end gap-1.5 items-center" onClick={e => e.stopPropagation()}>

                        {/* Ausstellen — Entwurf */}
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
                                className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-sm text-[10px] font-semibold transition-all"
                                title={t('invoice.actions.issue')}
                            >
                                <FaStamp className={ICON_SIZE_XS} />
                                <span>Ausstellen</span>
                            </button>
                        )}

                        {/* Als bezahlt markieren — offen / überfällig */}
                        {['issued', 'overdue'].includes(inv.status) && inv.amount_due_eur > 0 && (
                            <button
                                onClick={() => markAsPaidMutation.mutate(inv.id)}
                                disabled={markAsPaidMutation.isPending}
                                className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-sm text-[10px] font-semibold transition-all disabled:opacity-40"
                                title={t('invoice.actions.paid')}
                            >
                                <FaCheck className={ICON_SIZE_XS} />
                                <span>Bezahlt</span>
                            </button>
                        )}

                        {/* Mehr-Menü */}
                        <Dropdown
                            menu={{ items, className: 'invoice-action-menu-dropdown' }}
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
