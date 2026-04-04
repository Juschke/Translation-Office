import { type ReactNode } from 'react';
import clsx from 'clsx';
import type { NavigateFunction } from 'react-router-dom';
import { StatusBadge } from '../components/common/StatusBadge';
import { FaEdit, FaTrash, FaEye, FaTrashRestore, FaFolderOpen, FaEnvelope } from 'react-icons/fa';
import { getFlagUrl } from '../utils/flags';

export function getStatusBadge(status: string, _t?: any): ReactNode {
    return <StatusBadge status={status} />;
}

function getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export interface BuildProjectColumnsParams {
    navigate: NavigateFunction;
    bulkUpdateMutation: any;
    setEditingProject: (p: any) => void;
    setViewFilesProject: (p: any) => void;
    setIsModalOpen: (v: boolean) => void;
    setProjectToDelete: (id: string | string[] | null) => void;
    setConfirmTitle: (t: string) => void;
    setConfirmMessage: (m: string) => void;
    setIsConfirmOpen: (v: boolean) => void;
    t: any;
}

export function buildProjectColumns({
    navigate,
    bulkUpdateMutation,
    setEditingProject,
    setViewFilesProject,
    setIsModalOpen,
    setProjectToDelete,
    setConfirmTitle,
    setConfirmMessage,
    setIsConfirmOpen,
    t,
}: BuildProjectColumnsParams) {

    return [
        {
            id: 'project_info',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">{t('common.project')}</span>
                </div>
            ),
            accessor: (p: any) => (
                <div className="flex flex-col cursor-pointer group/link w-fit">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover/link:text-brand-primary group-hover/link:underline transition truncate max-w-[150px]" title={p.project_number || `Projekt #${p.id}`}>
                        {p.project_number || `#${p.id}`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium group-hover/link:text-brand-primary transition truncate max-w-[150px]" title={p.project_name || 'Unbenannt'}>
                        {p.project_name || <span className="italic opacity-50">Unbenannt</span>}
                    </span>
                </div>
            ),
            sortable: true,
            sortKey: 'project_name',
            width: 140,
        },
        {
            id: 'customer',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">{t('projects.filters.customers.label')}</span>
                </div>
            ),
            accessor: (p: any) => {
                const salutation = p.customer?.salutation ? `${p.customer.salutation} ` : '';
                const name = p.customer?.company_name || `${salutation}${p.customer?.first_name} ${p.customer?.last_name}` || 'Unbekannt';
                return (
                    <div className="flex items-center gap-2 max-w-[200px] group/cust cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                        <div className="w-7 h-7 bg-slate-50 border border-slate-100 text-slate-900 flex items-center justify-center text-sm font-semibold shrink-0 shadow-sm rounded-sm group-hover/cust:border-brand-primary/30 transition-colors">
                            {getInitials(name)}
                        </div>
                        <div className="flex flex-col leading-snug overflow-hidden">
                            <span className="font-semibold text-slate-800 truncate group-hover/cust:text-brand-primary transition-colors text-xs" title={name}>{name}</span>
                            {(p.customer?.address_street || p.customer?.address_city) && (
                                <div className="text-sm text-slate-400 truncate max-w-[150px] leading-tight mb-0.5">
                                    {p.customer.address_street}{p.customer.address_street && (p.customer.address_zip || p.customer.address_city) ? ', ' : ''}
                                    {p.customer.address_zip} {p.customer.address_city}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                {p.customer?.email && (
                                    <div className="flex items-center gap-1 min-w-0">
                                        <FaEnvelope className="text-sm text-slate-300 shrink-0" />
                                        <span className="text-sm text-slate-400 truncate" title={p.customer.email}>{p.customer.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'customer_id',
            width: 150,
        },
        {
            id: 'partner',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">{t('projects.filters.partners.label')}</span>
                </div>
            ),
            accessor: (p: any) => {
                if (!p.partner) return <span className="text-slate-300 italic text-[11px] px-2">-</span>;
                const salutation = p.partner.salutation ? `${p.partner.salutation} ` : '';
                const name = p.partner.company || `${salutation}${p.partner.first_name} ${p.partner.last_name}`;
                return (
                    <div className="flex items-center gap-2 max-w-[200px] group/part cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                        <div className="w-7 h-7 bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold shrink-0 shadow-sm rounded-sm group-hover/part:border-indigo-200 transition-colors">
                            {getInitials(name)}
                        </div>
                        <div className="flex flex-col leading-snug overflow-hidden">
                            <span className="font-semibold text-slate-800 truncate group-hover/part:text-brand-primary transition-colors text-xs" title={name}>{name}</span>
                            {p.partner.email && (
                                <div className="flex items-center gap-1 min-w-0 mt-0.5">
                                    <FaEnvelope className="text-sm text-slate-300 shrink-0" />
                                    <span className="text-sm text-slate-400 truncate" title={p.partner.email}>{p.partner.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            },
            width: 150,
        },
        {
            id: 'source_lang',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">{t('common.source_language')}</span>
                </div>
            ),
            accessor: (p: any) => {
                const code = p.source_language?.iso_code || p.source || 'de';
                const name = p.source_language?.name_internal || p.source_language?.name || code.toUpperCase();
                return (
                    <div className="flex items-center gap-2 py-1 overflow-hidden" title={name}>
                        <img src={getFlagUrl(code)} className="w-4 h-3 object-cover shadow-sm border border-slate-200 rounded-[1px] brightness-110 shrink-0" alt={name} />
                        <span className="text-[11px] font-bold text-slate-700 truncate">{name}</span>
                    </div>
                );
            },
            defaultVisible: true,
            width: 120,
        },
        {
            id: 'target_lang',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">{t('common.target_language')}</span>
                </div>
            ),
            accessor: (p: any) => {
                const code = p.target_language?.iso_code || p.target || 'en';
                const name = p.target_language?.name_internal || p.target_language?.name || code.toUpperCase();
                return (
                    <div className="flex items-center gap-2 py-1 overflow-hidden" title={name}>
                        <img src={getFlagUrl(code)} className="w-4 h-3 object-cover shadow-sm border border-slate-200 rounded-[1px] brightness-110 shrink-0" alt={name} />
                        <span className="text-[11px] font-bold text-brand-primary truncate">{name}</span>
                    </div>
                );
            },
            defaultVisible: true,
            width: 120,
        },
        {
            id: 'status',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">{t('common.status')}</span>
                </div>
            ),
            accessor: (p: any) => getStatusBadge(p.status, t),
            sortable: true,
            sortKey: 'status',
            width: 110,
        },
        {
            id: 'deadline',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">{t('projects.filters.deadline.label')}</span>
                </div>
            ),
            accessor: (p: any) => {
                if (!p.deadline) return <span className="text-slate-300 text-[11px]">-</span>;
                const date = new Date(p.deadline);
                const today = new Date();
                const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                let badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                let label = `${diffDays} Tage`;
                if (diffDays < 0) {
                    badgeColor = 'bg-red-50 text-red-600 border-red-100';
                    label = `${Math.abs(diffDays)} Tage überfällig`;
                } else if (diffDays === 0) {
                    badgeColor = 'bg-orange-50 text-orange-600 border-orange-100';
                    label = 'Heute fällig';
                } else if (diffDays <= 2) {
                    badgeColor = 'bg-orange-50 text-orange-600 border-orange-100';
                    label = `${diffDays} Tage`;
                }

                return (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                            <span className="whitespace-nowrap">{date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                            <span className="text-slate-400 text-sm opacity-70">{date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className={`px-1 py-0 rounded-[2px] text-sm font-bold border w-fit ${badgeColor}`}>{label}</span>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'deadline',
            width: 140,
        },
        {
            id: 'down_payment',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-right">
                    <span className="text-xs">{t('common.down_payment') || 'Anzahlung'}</span>
                </div>
            ),
            accessor: (p: any) => {
                const totalPaid = (p.payments || []).reduce((sum: number, pay: any) => sum + (parseFloat(pay.amount) || 0), 0);
                const downPaymentAmount = parseFloat(p.down_payment || 0);
                const hasGesamtAmount = parseFloat(p.price_total || 0) > 0;

                let colorClass = 'text-slate-300';
                let displayAmount = downPaymentAmount || 0;

                if (totalPaid > 0) {
                    displayAmount = totalPaid;
                    colorClass = 'text-emerald-600 font-bold';
                } else if (hasGesamtAmount && totalPaid === 0) {
                    colorClass = 'text-red-500 font-bold';
                }

                return (
                    <div className="flex items-center justify-end gap-2 text-right">
                        <span className={clsx('text-xs tabular-nums', colorClass)}>
                            {displayAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                    </div>
                );
            },
            align: 'right' as const,
            width: 80,
        },
        {
            id: 'price_total',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-right">
                    <span className="text-xs">{t('common.total_price') || 'Gesamtpreis'}</span>
                </div>
            ),
            accessor: (p: any) => {
                const positionsNet = (p.positions || []).reduce((sum: number, pos: any) => sum + (parseFloat(pos.customer_total) || 0), 0);
                const extraNet = (p.is_certified ? 5 : 0) +
                    (p.has_apostille ? 15 : 0) +
                    (p.is_express ? 15 : 0) +
                    (p.classification ? 15 : 0) +
                    ((p.copies_count || 0) * (parseFloat(p.copy_price || 0) || 5));

                const netTotal = positionsNet > 0 ? (positionsNet + extraNet) : (parseFloat(p.price_total || 0) + extraNet);
                const grossTotal = netTotal * 1.19;

                return (
                    <span className="font-semibold text-slate-800 text-xs tabular-nums">
                        {grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                );
            },
            align: 'right' as const,
            width: 80,
        },
        {
            id: 'actions',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-right items-end">
                    <span className="text-xs">&nbsp;</span>
                </div>
            ),
            accessor: (p: any) => (
                <div className="flex justify-end gap-0.5 relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/projects/${p.id}`)} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title={t('actions.details')}><FaEye size={12} /></button>
                    <button onClick={() => setViewFilesProject(p)} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title={t('actions.show_files')}><FaFolderOpen size={12} /></button>
                    {p.status !== 'deleted' && (
                        <button onClick={() => { setEditingProject(p); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title={t('actions.edit')}><FaEdit size={12} /></button>
                    )}
                    {p.status === 'deleted' ? (
                        <div className="flex gap-0.5">
                            <button onClick={() => bulkUpdateMutation.mutate({ ids: [p.id], data: { status: 'in_progress' } })} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-sm transition" title={t('actions.restore')}><FaTrashRestore size={12} /></button>
                            <button onClick={() => {
                                setProjectToDelete(p.id);
                                setConfirmTitle('Endgültig löschen');
                                setConfirmMessage('Dieses Projekt wird unwiderruflich gelöscht. Fortfahren?');
                                setIsConfirmOpen(true);
                            }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition" title={t('actions.delete_permanently')}><FaTrash size={12} /></button>
                        </div>
                    ) : (
                        <button onClick={() => {
                            if (p.status === 'archived') {
                                setProjectToDelete(p.id);
                                setConfirmTitle('In den Papierkorb?');
                                setConfirmMessage('Möchten Sie dieses archivierte Projekt in den Papierkorb verschieben?');
                            } else {
                                setProjectToDelete([p.id]);
                                bulkUpdateMutation.mutate({ ids: [p.id], data: { status: 'deleted' } });
                                return;
                            }
                            bulkUpdateMutation.mutate({ ids: [p.id], data: { status: 'deleted' } });
                        }} className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-sm transition" title={t('actions.move_to_trash')}><FaTrash size={12} /></button>
                    )}
                </div>
            ),
            align: 'right' as const,
            width: 80,
        },
    ];
}
