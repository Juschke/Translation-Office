import { type ReactNode } from 'react';
import clsx from 'clsx';
import type { NavigateFunction } from 'react-router-dom';
import { FaArrowRight, FaEdit, FaTrash, FaEye, FaEnvelope, FaTrashRestore, FaTimes } from 'react-icons/fa';
import { getFlagUrl } from '../utils/flags';
import { getLanguageLabel } from '../utils/languages';
import SearchableSelect from '../components/common/SearchableSelect';

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
    // Extra options for inline filtering
    customers?: any[];
    partners?: any[];
    languages?: any[];
    projects?: any[];
    advancedFilters?: any;
    setAdvancedFilters?: (update: React.SetStateAction<any>) => void;
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
    customers = [],
    partners = [],
    languages = [],
    projects = [],
    advancedFilters = {},
    setAdvancedFilters,
}: BuildProjectColumnsParams) {
    const uniqueDeadlines = Array.from(new Set(
        projects
            .filter((p: any) => p.deadline)
            .map((p: any) => p.deadline.split('T')[0].split(' ')[0]) // Handles both ISO and DB format like 2026-02-25 14:00:00
    )).sort();

    return [
        {
            id: 'project_number',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Nr.</span>
                    {setAdvancedFilters ? <div className="h-7 mt-1" /> : null}
                </div>
            ),
            accessor: (p: any) => (
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{p.project_number || p.display_id}</span>
            ),
            sortable: true,
            sortKey: 'project_number',
            className: 'w-[90px]',
        },
        {
            id: 'project_name',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Bezeichnung</span>
                    {setAdvancedFilters ? <div className="h-7 mt-1" /> : null}
                </div>
            ),
            accessor: (p: any) => (
                <span className="font-semibold text-slate-800 truncate block max-w-[180px]" title={p.project_name}>{p.project_name}</span>
            ),
            sortable: true,
            sortKey: 'project_name',
            className: 'w-[180px]',
        },
        {
            id: 'customer',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Kunde</span>
                    {setAdvancedFilters ? (
                        <div onClick={(e) => e.stopPropagation()} className="font-normal w-full mt-1">
                            <SearchableSelect
                                value={advancedFilters.customerId || ''}
                                onChange={(val) => setAdvancedFilters((prev: any) => ({ ...prev, customerId: val }))}
                                options={customers.map((c: any) => {
                                    const name = c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || `Kunde ${c.id}`;
                                    return {
                                        value: c.id.toString(),
                                        label: `${name} ${c.email ? `(${c.email})` : ''}`.trim()
                                    };
                                })}
                                placeholder="Kunde..."
                                className="!h-7 text-[11px] min-w-[120px]"
                            />
                        </div>
                    ) : null}
                </div>
            ),
            accessor: (p: any) => {
                const salutation = p.customer?.salutation ? `${p.customer.salutation} ` : '';
                const name = p.customer?.company_name || `${salutation}${p.customer?.first_name} ${p.customer?.last_name}` || 'Unbekannt';
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
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Übersetzer</span>
                    {setAdvancedFilters ? (
                        <div onClick={(e) => e.stopPropagation()} className="font-normal w-full mt-1">
                            <SearchableSelect
                                value={advancedFilters.partnerId || ''}
                                onChange={(val) => setAdvancedFilters((prev: any) => ({ ...prev, partnerId: val }))}
                                options={partners.map((p: any) => {
                                    const name = p.company || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Partner ${p.id}`;
                                    return {
                                        value: p.id.toString(),
                                        label: `${name} ${p.email ? `(${p.email})` : ''}`.trim()
                                    };
                                })}
                                placeholder="Partner..."
                                className="!h-7 text-[11px] min-w-[120px]"
                            />
                        </div>
                    ) : null}
                </div>
            ),
            accessor: (p: any) => {
                if (!p.partner) return <span className="text-slate-300 italic text-xs">-</span>;
                const salutation = p.partner.salutation ? `${p.partner.salutation} ` : '';
                const name = p.partner.company || `${salutation}${p.partner.first_name} ${p.partner.last_name}`;
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
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Sprachpaar</span>
                    {setAdvancedFilters ? (
                        <div onClick={(e) => e.stopPropagation()} className="font-normal flex gap-1 w-full mt-1">
                            <SearchableSelect
                                value={advancedFilters.sourceLanguageId || ''}
                                onChange={(val) => setAdvancedFilters((prev: any) => ({ ...prev, sourceLanguageId: val }))}
                                options={languages.map((l: any) => ({
                                    value: l.id.toString(),
                                    label: (l.iso_code || '').substring(0, 2).toUpperCase(),
                                    icon: getFlagUrl(l.iso_code)
                                }))}
                                placeholder="Quelle"
                                className="!h-7 text-[10px] w-full min-w-[70px]"
                            />
                            <SearchableSelect
                                value={advancedFilters.targetLanguageId || ''}
                                onChange={(val) => setAdvancedFilters((prev: any) => ({ ...prev, targetLanguageId: val }))}
                                options={languages.map((l: any) => ({
                                    value: l.id.toString(),
                                    label: (l.iso_code || '').substring(0, 2).toUpperCase(),
                                    icon: getFlagUrl(l.iso_code)
                                }))}
                                placeholder="Ziel"
                                className="!h-7 text-[10px] w-full min-w-[70px]"
                            />
                        </div>
                    ) : null}
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
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <div className="flex items-center gap-1.5" title={`Quelle: ${sourceName}`}>
                                <img src={getFlagUrl(sourceCode)} className="w-4 h-3 object-cover shadow-[0_1px_2px_rgba(0,0,0,0.1)] border border-slate-200 rounded-[1px]" alt={sourceName} />
                                <span className="text-xs font-bold text-slate-700">{sCode}</span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium truncate max-w-[80px] leading-tight" title={sourceName}>{sourceName}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center -mt-2">
                            <FaArrowRight className="text-slate-300 text-xs" />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <div className="flex items-center gap-1.5" title={`Ziel: ${targetName}`}>
                                <img src={getFlagUrl(targetCode)} className="w-4 h-3 object-cover shadow-[0_1px_2px_rgba(0,0,0,0.1)] border border-slate-200 rounded-[1px]" alt={targetName} />
                                <span className="text-xs font-bold text-slate-700">{tCode}</span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium truncate max-w-[80px] leading-tight" title={targetName}>{targetName}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'down_payment',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-right">
                    <span className="text-xs">Anzahlung</span>
                    {setAdvancedFilters ? <div className="h-7 mt-1" /> : null}
                </div>
            ),
            accessor: (p: any) => (
                <span className={clsx('text-xs', parseFloat(p.down_payment) > 0 ? 'text-slate-600 font-medium' : 'text-slate-300')}>
                    {parseFloat(p.down_payment || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
            ),
            align: 'right' as const,
        },
        {
            id: 'price_total',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-right">
                    <span className="text-xs">Gesamtpreis</span>
                    {setAdvancedFilters ? <div className="h-7 mt-1" /> : null}
                </div>
            ),
            accessor: (p: any) => (
                <span className="font-semibold text-slate-800 text-xs">
                    {parseFloat(p.price_total || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
            ),
            align: 'right' as const,
        },
        {
            id: 'deadline',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Deadline</span>
                    {setAdvancedFilters ? (
                        <div onClick={(e) => e.stopPropagation()} className="font-normal w-full mt-1 relative">
                            <select
                                className="w-full h-7 text-[11px] border border-slate-300 rounded-[3px] bg-white pl-1 pr-6 shadow-sm text-slate-600 focus:outline-none focus:border-brand-primary appearance-none"
                                value={advancedFilters.deadlineDate || ''}
                                onChange={(e) => setAdvancedFilters((prev: any) => ({ ...prev, deadlineDate: e.target.value }))}
                            >
                                <option value="">Alle</option>
                                {uniqueDeadlines.map((d: any) => (
                                    <option key={d} value={d}>
                                        {new Date(d).toLocaleDateString('de-DE')}
                                    </option>
                                ))}
                            </select>
                            {advancedFilters.deadlineDate && (
                                <button
                                    onClick={() => setAdvancedFilters((prev: any) => ({ ...prev, deadlineDate: '' }))}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <FaTimes size={10} />
                                </button>
                            )}
                        </div>
                    ) : null}
                </div>
            ),
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
            header: (
                <div className="flex flex-col gap-1.5 w-full text-left">
                    <span className="text-xs">Status</span>
                    {setAdvancedFilters ? <div className="h-7 mt-1" /> : null}
                </div>
            ),
            accessor: (p: any) => getStatusBadge(p.status),
            sortable: true,
            sortKey: 'status',
        },
        {
            id: 'actions',
            header: (
                <div className="flex flex-col gap-1.5 w-full text-right items-end">
                    <span className="text-xs">&nbsp;</span>
                    {setAdvancedFilters ? (
                        <div className="h-7 mt-1 flex items-center justify-end">
                            {Object.values(advancedFilters).some(v => v && v !== 'all') && (
                                <button
                                    onClick={() => setAdvancedFilters({
                                        customerId: '', partnerId: '', sourceLanguageId: '', targetLanguageId: '', dateRange: 'all', projectSearch: '', deadlineDate: ''
                                    })}
                                    className="px-2 py-1 text-[10px] font-medium border border-slate-200 text-slate-500 rounded-sm hover:bg-slate-50 hover:text-slate-700 transition"
                                    title="Filter zurücksetzen"
                                >
                                    Zurücksetzen
                                </button>
                            )}
                        </div>
                    ) : null}
                </div>
            ),
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
