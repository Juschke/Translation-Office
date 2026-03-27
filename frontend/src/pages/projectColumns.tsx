import { type ReactNode } from 'react';
import clsx from 'clsx';
import type { NavigateFunction } from 'react-router-dom';
import { FaArrowRight, FaEdit, FaTrash, FaEye, FaTrashRestore, FaCheckCircle } from 'react-icons/fa';
import { getFlagUrl } from '../utils/flags';
import { getLanguageLabel } from '../utils/languages';

export function getStatusBadge(status: string): ReactNode {
    const labels: Record<string, string> = {
        draft: 'Neu',
        offer: 'Neu',
        pending: 'Neu',
        in_progress: 'Bearbeitung',
        review: 'Bearbeitung',
        ready_for_pickup: 'Abholbereit',
        invoiced: 'Rechnung',
        delivered: 'Geliefert',
        completed: 'Abgeschlossen',
        cancelled: 'Storniert',
        archived: 'Archiviert',
        deleted: 'Gelöscht',
    };
    const styles: Record<string, string> = {
        draft: 'bg-slate-50 text-slate-600 border-slate-200',
        offer: 'bg-orange-50 text-orange-700 border-orange-200',
        pending: 'bg-orange-50 text-orange-700 border-orange-200',
        in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
        review: 'bg-blue-50 text-blue-700 border-blue-200',
        ready_for_pickup: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        invoiced: 'bg-purple-50 text-purple-700 border-purple-200',
        delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        completed: 'bg-emerald-600 text-white border-emerald-700',
        cancelled: 'bg-slate-100 text-slate-500 border-slate-300',
        archived: 'bg-slate-100 text-slate-500 border-slate-300',
        deleted: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-sm text-xs font-semibold border tracking-tight ${styles[status] || styles.draft}`}>
            {labels[status] || status}
        </span>
    );
}

function getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export interface BuildProjectColumnsParams {
    navigate: NavigateFunction;
    bulkUpdateMutation: any;
    setEditingProject: (p: any) => void;
    setIsModalOpen: (v: boolean) => void;
    setProjectToDelete: (id: string | string[] | null) => void;
    setConfirmTitle: (t: string) => void;
    setConfirmMessage: (m: string) => void;
    setIsConfirmOpen: (v: boolean) => void;
}

export function buildProjectColumns({
    navigate,
    bulkUpdateMutation,
    setEditingProject,
    setIsModalOpen,
    setProjectToDelete,
    setConfirmTitle,
    setConfirmMessage,
    setIsConfirmOpen,
}: BuildProjectColumnsParams) {

    return [
        {
            id: 'project_number',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Nr.</span>
                </div>
            ),
            accessor: (p: any) => (
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{p.project_number || p.display_id}</span>
            ),
            sortable: true,
            sortKey: 'project_number',
            width: 90,
        },
        {
            id: 'project_name',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Bezeichnung</span>
                </div>
            ),
            accessor: (p: any) => (
                <span className="font-semibold text-slate-800 truncate block max-w-[150px]" title={p.project_name || `Projekt #${p.id}`}>
                    {p.project_name || <span className="text-slate-400 italic font-normal">Unbenannt (ID: {p.id})</span>}
                </span>
            ),
            sortable: true,
            sortKey: 'project_name',
            width: 120,
        },
        {
            id: 'customer',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Kunde</span>
                </div>
            ),
            accessor: (p: any) => {
                const salutation = p.customer?.salutation ? `${p.customer.salutation} ` : '';
                const name = p.customer?.company_name || `${salutation}${p.customer?.first_name} ${p.customer?.last_name}` || 'Unbekannt';
                return (
                    <div className="flex items-center gap-2 max-w-[200px]">
                        <div className="w-7 h-7 bg-slate-50 border border-slate-100 text-slate-900 flex items-center justify-center text-[10px] font-semibold shrink-0 shadow-sm rounded-sm">
                            {getInitials(name)}
                        </div>
                        <div className="flex flex-col text-[11px] leading-tight overflow-hidden">
                            <span className="font-semibold text-slate-800 truncate" title={name}>{name}</span>
                            {p.customer?.email && (
                                <span className="text-[10px] text-slate-400 truncate tracking-tight">{p.customer.email}</span>
                            )}
                        </div>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'customer_id',
            width: 180,
        },
        {
            id: 'partner',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Übersetzer</span>
                </div>
            ),
            accessor: (p: any) => {
                if (!p.partner) return <span className="text-slate-300 italic text-[11px]">-</span>;
                const salutation = p.partner.salutation ? `${p.partner.salutation} ` : '';
                const name = p.partner.company || `${salutation}${p.partner.first_name} ${p.partner.last_name}`;
                return (
                    <div className="flex items-center gap-2 max-w-[200px]">
                        <div className="w-7 h-7 bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-[10px] font-semibold shrink-0 shadow-sm rounded-sm">
                            {getInitials(name)}
                        </div>
                        <div className="flex flex-col text-[11px] leading-tight overflow-hidden">
                            <span className="font-semibold text-slate-800 truncate" title={name}>{name}</span>
                            {p.partner.email && (
                                <span className="text-[10px] text-slate-400 truncate tracking-tight">{p.partner.email}</span>
                            )}
                        </div>
                    </div>
                );
            },
            width: 180,
        },
        {
            id: 'languages',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Sprachpaar</span>
                </div>
            ),
            accessor: (p: any) => {
                const sourceCode = p.source_language?.iso_code || p.source || 'de';
                const sCode = sourceCode.substring(0, 2).toUpperCase();
                const sourceName = p.source_language?.name_internal || p.source_language?.name || getLanguageLabel(sCode);

                const targetCode = p.target_language?.iso_code || p.target || 'en';
                const tCode = targetCode.substring(0, 2).toUpperCase();
                const targetName = p.target_language?.name_internal || p.target_language?.name || getLanguageLabel(tCode);

                return (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 min-w-[40px]" title={`Quelle: ${sourceName}`}>
                            <img src={getFlagUrl(sourceCode)} className="w-3.5 h-2.5 object-cover shadow-sm border border-slate-200 rounded-[1px]" alt={sourceName} />
                            <span className="text-[11px] font-bold text-slate-700">{sCode}</span>
                        </div>
                        <FaArrowRight className="text-slate-300 text-[9px] shrink-0" />
                        <div className="flex items-center gap-1.5 min-w-[40px]" title={`Ziel: ${targetName}`}>
                            <img src={getFlagUrl(targetCode)} className="w-3.5 h-2.5 object-cover shadow-sm border border-slate-200 rounded-[1px]" alt={targetName} />
                            <span className="text-[11px] font-bold text-slate-700">{tCode}</span>
                        </div>
                    </div>
                );
            },
            width: 200,
        },
        {
            id: 'down_payment',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-right">
                    <span className="text-xs">Anzahlung</span>
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
                const totalPaid = (p.payments || []).reduce((sum: number, pay: any) => sum + (parseFloat(pay.amount) || 0), 0);
                const isPaid = (grossTotal - totalPaid) <= 0.05;

                return (
                    <div className="flex items-center justify-end gap-2 text-right">
                        {isPaid ? (
                            <FaCheckCircle className="text-emerald-500 text-xs" title="Vollständig bezahlt" />
                        ) : (
                            <span className={clsx('text-[11px]', parseFloat(p.down_payment) > 0 ? 'text-slate-600 font-medium' : 'text-slate-300')}>
                                {parseFloat(p.down_payment || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                            </span>
                        )}
                    </div>
                );
            },
            align: 'right' as const,
            width: 90,
        },
        {
            id: 'price_total',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-right">
                    <span className="text-xs">Gesamtpreis</span>
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
                    <span className="font-semibold text-slate-800 text-[11px]">
                        {grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                );
            },
            align: 'right' as const,
            width: 90,
        },
        {
            id: 'deadline',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Deadline</span>
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
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                            <span>{date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            <span className="text-slate-400 text-[10px]">{date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className={`px-1 py-0 rounded-[2px] text-[9px] font-bold border w-fit uppercase ${badgeColor}`}>{label}</span>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'deadline',
            width: 220,
        },
        {
            id: 'status',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Status</span>
                </div>
            ),
            accessor: (p: any) => getStatusBadge(p.status),
            sortable: true,
            sortKey: 'status',
            width: 110,
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
                    <button onClick={() => navigate(`/projects/${p.id}`)} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title="Details"><FaEye size={12} /></button>
                    {p.status !== 'deleted' && (
                        <button onClick={() => { setEditingProject(p); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title="Bearbeiten"><FaEdit size={12} /></button>
                    )}
                    {p.status === 'deleted' ? (
                        <div className="flex gap-0.5">
                            <button onClick={() => bulkUpdateMutation.mutate({ ids: [p.id], data: { status: 'in_progress' } })} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-sm transition" title="Wiederherstellen"><FaTrashRestore size={12} /></button>
                            <button onClick={() => {
                                setProjectToDelete(p.id);
                                setConfirmTitle('Endgültig löschen');
                                setConfirmMessage('Dieses Projekt wird unwiderruflich gelöscht. Fortfahren?');
                                setIsConfirmOpen(true);
                            }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition" title="Endgültig löschen"><FaTrash size={12} /></button>
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
                        }} className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-sm transition" title="In Papierkorb"><FaTrash size={12} /></button>
                    )}
                </div>
            ),
            align: 'right' as const,
            width: 60,
        },
    ];
}
