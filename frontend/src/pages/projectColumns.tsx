import { type ReactNode } from 'react';
import clsx from 'clsx';
import type { NavigateFunction } from 'react-router-dom';
import { FaArrowRight, FaEdit, FaTrash, FaEye, FaEnvelope, FaTrashRestore } from 'react-icons/fa';
import Checkbox from '../components/common/Checkbox';
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
    selectedProjects: string[];
    filteredProjects: any[];
    toggleSelection: (id: string) => void;
    toggleSelectAll: () => void;
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
    selectedProjects,
    filteredProjects,
    toggleSelection,
    toggleSelectAll,
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
            id: 'selection',
            header: (
                <Checkbox
                    checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                    onChange={toggleSelectAll}
                />
            ),
            accessor: (p: any) => (
                <Checkbox
                    checked={selectedProjects.includes(p.id)}
                    onChange={() => toggleSelection(p.id)}
                />
            ),
            className: 'w-10',
            hidden: filteredProjects.length === 0,
        },
        {
            id: 'id',
            header: 'Projekt',
            accessor: (p: any) => (
                <div className="flex flex-col max-w-[150px]">
                    <span className="font-semibold text-slate-800 truncate" title={p.project_name}>{p.project_name}</span>
                    <span className="text-xs font-semibold text-slate-400">{p.project_number || `P-${p.id}`}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'project_name',
            className: 'w-[150px]',
        },
        {
            id: 'customer',
            header: 'Kunde',
            accessor: (p: any) => {
                const name = p.customer?.company_name || `${p.customer?.first_name} ${p.customer?.last_name}` || 'Unbekannt';
                return (
                    <div className="flex items-center gap-3 max-w-[240px]">
                        <div className="w-9 h-9 bg-slate-50 border border-slate-100 text-slate-900 flex items-center justify-center text-xs font-semibold shrink-0 shadow-sm rounded-sm">
                            {getInitials(name)}
                        </div>
                        <div className="flex flex-col text-xs leading-tight overflow-hidden">
                            <span className="font-semibold text-slate-800 truncate mb-0.5" title={name}>{name}</span>
                            {p.customer?.email && (
                                <a href={`mailto:${p.customer.email}`} className="text-xs text-slate-500 hover:text-slate-700 truncate flex items-center gap-1.5 transition-colors">
                                    <FaEnvelope className="opacity-50" /> {p.customer.email}
                                </a>
                            )}
                            {p.customer?.phone && (
                                <span className="text-xs text-slate-400 truncate flex items-center gap-1.5">
                                    <span className="opacity-50">Tel:</span> {p.customer.phone}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'customer_id',
        },
        {
            id: 'partner',
            header: 'Übersetzer',
            accessor: (p: any) => {
                if (!p.partner) return <span className="text-slate-300 italic text-xs">-</span>;
                const name = p.partner.company || `${p.partner.first_name} ${p.partner.last_name}`;
                return (
                    <div className="flex items-center gap-3 max-w-[240px]">
                        <div className="w-9 h-9 bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-xs font-semibold shrink-0 shadow-sm rounded-sm">
                            {getInitials(name)}
                        </div>
                        <div className="flex flex-col text-xs leading-tight overflow-hidden">
                            <span className="font-semibold text-slate-800 truncate mb-0.5" title={name}>{name}</span>
                            {p.partner.email && (
                                <a href={`mailto:${p.partner.email}`} className="text-xs text-slate-500 hover:text-slate-700 truncate flex items-center gap-1.5 transition-colors">
                                    <FaEnvelope className="opacity-50" /> {p.partner.email}
                                </a>
                            )}
                            {p.partner.phone && (
                                <span className="text-xs text-slate-400 truncate flex items-center gap-1.5">
                                    <span className="opacity-50">Tel:</span> {p.partner.phone}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'languages',
            header: 'Sprachpaar',
            accessor: (p: any) => {
                const sourceCode = p.source_language?.iso_code || p.source || 'de';
                const sCode = sourceCode.split('-')[0].toLowerCase();
                const sourceName = p.source_language?.name_internal || p.source_language?.name || getLanguageLabel(sCode);

                const targetCode = p.target_language?.iso_code || p.target || 'en';
                const tCode = targetCode.split('-')[0].toLowerCase();
                const targetName = p.target_language?.name_internal || p.target_language?.name || getLanguageLabel(tCode);

                return (
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <div className="flex items-center gap-1.5" title={`Quelle: ${sourceName}`}>
                                <img src={getFlagUrl(sourceCode)} className="w-4 h-3 object-cover shadow-[0_1px_2px_rgba(0,0,0,0.1)] border border-slate-200 rounded-[1px]" alt={sourceName} />
                                <span className="text-xs font-medium text-slate-700">{sCode}</span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium truncate max-w-[80px] leading-tight" title={sourceName}>{sourceName}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center -mt-2">
                            <FaArrowRight className="text-slate-300 text-xs" />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <div className="flex items-center gap-1.5" title={`Ziel: ${targetName}`}>
                                <img src={getFlagUrl(targetCode)} className="w-4 h-3 object-cover shadow-[0_1px_2px_rgba(0,0,0,0.1)] border border-slate-200 rounded-[1px]" alt={targetName} />
                                <span className="text-xs font-medium text-slate-700">{tCode}</span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium truncate max-w-[80px] leading-tight" title={targetName}>{targetName}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'down_payment',
            header: 'Anzahlung',
            accessor: (p: any) => (
                <span className={clsx('text-xs', parseFloat(p.down_payment) > 0 ? 'text-slate-600 font-medium' : 'text-slate-300')}>
                    {parseFloat(p.down_payment || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
            ),
            align: 'right' as const,
        },
        {
            id: 'price_total',
            header: 'Gesamtpreis',
            accessor: (p: any) => (
                <span className="font-semibold text-slate-800 text-xs">
                    {parseFloat(p.price_total || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
            ),
            align: 'right' as const,
        },
        {
            id: 'deadline',
            header: 'Deadline',
            accessor: (p: any) => {
                if (!p.deadline) return <span className="text-slate-300">-</span>;
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
                }

                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <span>{date.toLocaleDateString('de-DE')}</span>
                            <span className="text-slate-400 text-xs">{date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium border w-fit ${badgeColor}`}>{label}</span>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'deadline',
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (p: any) => getStatusBadge(p.status),
            sortable: true,
            sortKey: 'status',
        },
        {
            id: 'actions',
            header: '',
            accessor: (p: any) => (
                <div className="flex justify-end gap-1 relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/projects/${p.id}`)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title="Details"><FaEye /></button>
                    {p.status !== 'deleted' && (
                        <button onClick={() => { setEditingProject(p); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-sm transition" title="Bearbeiten"><FaEdit /></button>
                    )}
                    {p.status === 'deleted' ? (
                        <div className="flex gap-1">
                            <button onClick={() => bulkUpdateMutation.mutate({ ids: [p.id], data: { status: 'in_progress' } })} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-sm transition" title="Wiederherstellen"><FaTrashRestore /></button>
                            <button onClick={() => {
                                setProjectToDelete(p.id);
                                setConfirmTitle('Endgültig löschen');
                                setConfirmMessage('Dieses Projekt wird unwiderruflich gelöscht. Fortfahren?');
                                setIsConfirmOpen(true);
                            }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition" title="Endgültig löschen"><FaTrash /></button>
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
                        }} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-sm transition" title="In Papierkorb"><FaTrash /></button>
                    )}
                </div>
            ),
            align: 'right' as const,
        },
    ];
}
