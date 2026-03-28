import clsx from 'clsx';
import { useState, useRef, useEffect } from 'react';
import { FaPlus, FaTrash, FaBook, FaTimes, FaCheck } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../api/services';
import type { ProjectPosition } from './projectTypes';

export type { ProjectPosition } from './projectTypes';

export interface ExtraServiceRow {
    key: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
}

interface ProjectPositionsTableProps {
    positions: ProjectPosition[];
    setPositions: (positions: ProjectPosition[]) => void;
    disabled?: boolean;
    extraRows?: ExtraServiceRow[];
    onToggleExtra?: (key: string) => void;
    onUpdateExtraQty?: (key: string, qty: number) => void;
}

const UNITS = ['Wörter', 'Normzeile', 'Seiten', 'Stunden', 'Pauschal', 'Stk', 'Minuten', 'Tage'];

const EMPTY_POSITION = (): ProjectPosition => ({
    id: Date.now().toString(),
    description: '',
    unit: 'Normzeile',
    quantity: '1.00',
    partnerRate: '0.00',
    partnerMode: 'unit',
    partnerTotal: '0.00',
    customerRate: '0.00',
    customerMode: 'rate',
    customerTotal: '0.00',
    marginType: 'markup',
    marginPercent: '0.00',
});

const fmt2 = (v: string | number) =>
    (parseFloat(v as string) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inlineInput = (invalid = false, align: 'left' | 'right' = 'left', mono = false) =>
    clsx(
        'w-full bg-transparent outline-none border-b-2 pb-px transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        mono ? 'font-mono text-xs' : 'font-medium text-xs',
        align === 'right' ? 'text-right' : 'text-left',
        invalid
            ? 'border-red-300 text-red-500 placeholder:text-red-300'
            : 'border-transparent text-slate-700 placeholder:text-slate-300 hover:border-slate-200 focus:border-[#1B4D4F]',
    );

const inlineSelect = () =>
    'bg-transparent border-0 outline-none text-[10px] font-semibold text-slate-400 cursor-pointer hover:text-slate-600 transition-colors disabled:cursor-not-allowed';

const EMPTY_SERVICE = () => ({ name: '', unit: 'Normzeile', base_price: '' });

const ProjectPositionsTable = ({
    positions,
    setPositions,
    disabled,
    extraRows = [],
    onToggleExtra,
    onUpdateExtraQty,
}: ProjectPositionsTableProps) => {
    const queryClient = useQueryClient();
    const [catalogOpen, setCatalogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newSvc, setNewSvc] = useState(EMPTY_SERVICE);
    const searchRef = useRef<HTMLInputElement>(null);

    const { data: catalog = [] } = useQuery<any[]>({
        queryKey: ['settings', 'services'],
        queryFn: settingsService.getServices,
    });

    const createServiceMutation = useMutation({
        mutationFn: settingsService.createService,
        onSuccess: (created: any) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'services'] });
            addFromCatalog(created);
            setShowCreate(false);
            setNewSvc(EMPTY_SERVICE());
        },
    });

    useEffect(() => {
        if (catalogOpen) setTimeout(() => searchRef.current?.focus(), 50);
    }, [catalogOpen]);

    const update = (index: number, patch: Partial<ProjectPosition>) => {
        if (disabled) return;
        const next = [...positions];
        next[index] = { ...next[index], ...patch };
        setPositions(next);
    };

    const addFromCatalog = (item: any) => {
        const newPos: ProjectPosition = {
            id: Date.now().toString(),
            description: item.name,
            unit: UNITS.includes(item.unit) ? item.unit : 'Normzeile',
            quantity: '1.00',
            partnerRate: '0.00',
            partnerMode: 'unit',
            partnerTotal: '0.00',
            customerRate: (parseFloat(item.base_price) || 0).toFixed(2),
            customerMode: 'rate',
            customerTotal: '0.00',
            marginType: 'markup',
            marginPercent: '0.00',
        };
        setPositions([...positions, newPos]);
        setCatalogOpen(false);
        setSearch('');
    };

    const activeItems = catalog.filter(
        (s: any) => s.status === 'active' &&
            (search === '' || s.name.toLowerCase().includes(search.toLowerCase())),
    );

    return (
        <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="border-b-2 border-slate-200">
                        <th className="px-3 py-2 w-7 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">#</th>
                        <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Beschreibung</th>
                        <th className="px-3 py-2 w-20 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Menge</th>
                        <th className="px-3 py-2 w-24 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Einheit</th>
                        <th className="px-3 py-2 w-36 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 border-l border-slate-100">EK Partner</th>
                        <th className="px-3 py-2 w-40 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 border-l border-slate-100">VK Kunde</th>
                        <th className="px-3 py-2 w-28 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 border-l border-slate-100">Gesamt</th>
                        <th className="px-2 py-2 w-8"></th>
                    </tr>
                </thead>
                <tbody>
                    {positions.map((pos, index) => {
                        const qtyInvalid = !disabled && (parseFloat(pos.quantity) || 0) <= 0;
                        const descInvalid = !disabled && pos.description.trim() === '';
                        const rateInvalid = !disabled && pos.customerMode !== 'unit' && (parseFloat(pos.customerRate) || 0) <= 0;

                        return (
                            <tr key={pos.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-3 py-2.5 text-center text-[11px] font-bold text-slate-300">{index + 1}</td>

                                <td className="px-3 py-2.5">
                                    <input
                                        type="text"
                                        disabled={disabled}
                                        placeholder="Bezeichnung eingeben…"
                                        className={inlineInput(descInvalid)}
                                        value={pos.description}
                                        onChange={e => update(index, { description: e.target.value })}
                                    />
                                </td>

                                <td className="px-3 py-2.5">
                                    <input
                                        type="number"
                                        disabled={disabled}
                                        step="0.01"
                                        min="0"
                                        className={inlineInput(qtyInvalid, 'right', true)}
                                        value={pos.quantity}
                                        onChange={e => update(index, { quantity: e.target.value })}
                                        onBlur={e => update(index, { quantity: (parseFloat(e.target.value) || 0).toFixed(2) })}
                                    />
                                </td>

                                <td className="px-3 py-2.5 text-right">
                                    <select
                                        disabled={disabled}
                                        className={clsx(inlineSelect(), 'w-full text-right')}
                                        value={pos.unit}
                                        onChange={e => update(index, { unit: e.target.value })}
                                    >
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </td>

                                <td className="px-3 py-2.5 border-l border-slate-100">
                                    <div className="flex items-end justify-end gap-2">
                                        <input
                                            type="number"
                                            disabled={disabled}
                                            step="0.01"
                                            min="0"
                                            className={clsx(inlineInput(false, 'right', true), 'w-16')}
                                            value={pos.partnerRate}
                                            onChange={e => update(index, { partnerRate: e.target.value })}
                                            onBlur={e => update(index, { partnerRate: (parseFloat(e.target.value) || 0).toFixed(2) })}
                                        />
                                        <select
                                            disabled={disabled}
                                            className={inlineSelect()}
                                            value={pos.partnerMode}
                                            onChange={e => update(index, { partnerMode: e.target.value })}
                                            title="Modus"
                                        >
                                            <option value="unit">/ Einh.</option>
                                            <option value="flat">Pausch.</option>
                                        </select>
                                    </div>
                                </td>

                                <td className="px-3 py-2.5 border-l border-slate-100">
                                    <div className="flex items-end justify-end gap-2">
                                        {pos.customerMode === 'unit' ? (
                                            <input
                                                type="number"
                                                disabled={disabled}
                                                step="0.01"
                                                min="0"
                                                className={clsx(inlineInput(false, 'right', true), 'w-16')}
                                                value={pos.marginPercent}
                                                onChange={e => update(index, { marginPercent: e.target.value })}
                                                onBlur={e => update(index, { marginPercent: (parseFloat(e.target.value) || 0).toFixed(2) })}
                                                placeholder="0.00"
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                disabled={disabled}
                                                step="0.01"
                                                min="0"
                                                className={clsx(inlineInput(rateInvalid, 'right', true), 'w-16')}
                                                value={pos.customerRate}
                                                onChange={e => update(index, { customerRate: e.target.value })}
                                                onBlur={e => update(index, { customerRate: (parseFloat(e.target.value) || 0).toFixed(2) })}
                                            />
                                        )}
                                        <select
                                            disabled={disabled}
                                            className={inlineSelect()}
                                            value={pos.customerMode === 'flat' ? 'flat' : pos.customerMode === 'rate' ? 'rate' : 'margin'}
                                            onChange={e => {
                                                const v = e.target.value;
                                                if (v === 'flat')      update(index, { customerMode: 'flat',  marginType: 'markup' });
                                                else if (v === 'rate') update(index, { customerMode: 'rate', marginType: 'markup' });
                                                else                   update(index, { customerMode: 'unit', marginType: 'markup' });
                                            }}
                                            title="Modus"
                                        >
                                            <option value="rate">/ Einh.</option>
                                            <option value="margin">% Marge</option>
                                            <option value="flat">Pausch.</option>
                                        </select>
                                    </div>
                                </td>

                                <td className="px-3 py-2.5 text-right border-l border-slate-100">
                                    <span className="font-bold text-xs text-slate-800 tabular-nums">
                                        {fmt2(pos.customerTotal)} €
                                    </span>
                                </td>

                                <td className="px-2 py-2.5 text-center">
                                    {!disabled && positions.length > 1 ? (
                                        <button
                                            onClick={() => setPositions(positions.filter(p => p.id !== pos.id))}
                                            className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                                            title="Löschen"
                                        >
                                            <FaTrash className="text-[10px]" />
                                        </button>
                                    ) : (
                                        <span className="p-1.5 block text-slate-100">
                                            <FaTrash className="text-[10px]" />
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}

                    {/* Zusatzleistungen */}
                    {extraRows.length > 0 && extraRows.map((row, extraIndex) => (
                        <tr key={row.key} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 py-2.5 text-center text-[11px] font-bold text-slate-300">
                                {positions.length + extraIndex + 1}
                            </td>
                            <td className="px-3 py-2.5">
                                <span className="text-xs font-medium text-slate-500 italic">{row.description}</span>
                            </td>
                            <td className="px-3 py-2.5">
                                {!disabled && onUpdateExtraQty ? (
                                    <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        className={inlineInput(false, 'right', true)}
                                        value={row.quantity}
                                        onChange={e => onUpdateExtraQty(row.key, Math.max(1, parseInt(e.target.value) || 1))}
                                        onBlur={e => onUpdateExtraQty(row.key, Math.max(1, parseInt(e.target.value) || 1))}
                                    />
                                ) : (
                                    <span className="font-mono text-xs text-slate-500 tabular-nums block text-right">{row.quantity}</span>
                                )}
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs text-slate-400">{row.unit}</td>
                            <td className="px-3 py-2.5 text-right border-l border-slate-100 text-slate-300 text-xs">—</td>
                            <td className="px-3 py-2.5 text-right border-l border-slate-100 font-mono text-xs text-slate-500 tabular-nums">
                                {fmt2(row.unitPrice)} €
                            </td>
                            <td className="px-3 py-2.5 text-right border-l border-slate-100">
                                <span className="font-bold text-xs text-slate-700 tabular-nums">{fmt2(row.total)} €</span>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                                {!disabled && (
                                    <button
                                        onClick={() => onToggleExtra?.(row.key)}
                                        className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                                        title="Deaktivieren"
                                    >
                                        <FaTrash className="text-[10px]" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer: Actions + Katalog */}
            {!disabled && (
                <div className="border-t border-slate-100">
                    {/* Action buttons — right-aligned */}
                    <div className="flex items-center justify-end gap-2 px-3 pt-2.5 pb-2">
                        <button
                            onClick={() => setPositions([...positions, EMPTY_POSITION()])}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-sm hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <FaPlus className="text-[9px]" />
                            Position hinzufügen
                        </button>

                        <button
                            onClick={() => { setCatalogOpen(o => !o); setShowCreate(false); setSearch(''); }}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors',
                                catalogOpen
                                    ? 'bg-[#163e40] text-white'
                                    : 'bg-[#1B4D4F] text-white hover:bg-[#163e40]',
                            )}
                        >
                            <FaBook className="text-[9px]" />
                            Leistungskatalog
                            {catalog.filter((s: any) => s.status === 'active').length > 0 && (
                                <span className="text-[9px] font-black opacity-70">
                                    ({catalog.filter((s: any) => s.status === 'active').length})
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Katalog Panel */}
                    {catalogOpen && (
                        <div className="mx-3 mb-3 border border-slate-200 rounded-sm bg-white shadow-sm overflow-hidden">
                            {/* Search */}
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Leistung suchen…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="flex-1 text-xs outline-none bg-transparent text-slate-700 placeholder:text-slate-300"
                                />
                                <button
                                    onClick={() => setCatalogOpen(false)}
                                    className="text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    <FaTimes className="text-[10px]" />
                                </button>
                            </div>

                            {/* Service list */}
                            <div className="max-h-44 overflow-y-auto">
                                {activeItems.length === 0 && !showCreate ? (
                                    <p className="text-xs text-slate-400 text-center py-4 italic">
                                        {search ? 'Keine Treffer' : 'Noch keine Leistungen im Katalog'}
                                    </p>
                                ) : (
                                    activeItems.map((item: any) => (
                                        <button
                                            key={item.id}
                                            onClick={() => addFromCatalog(item)}
                                            className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group/item"
                                        >
                                            <div>
                                                <span className="text-xs font-semibold text-slate-700 group-hover/item:text-[#1B4D4F] transition-colors">
                                                    {item.name}
                                                </span>
                                                {item.service_code && (
                                                    <span className="ml-2 text-[9px] font-bold text-slate-300 uppercase tracking-wider">{item.service_code}</span>
                                                )}
                                            </div>
                                            <span className="text-xs font-mono text-slate-400 tabular-nums">
                                                {fmt2(item.base_price)} € / {item.unit}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Create new service */}
                            <div className="border-t border-slate-100">
                                {!showCreate ? (
                                    <button
                                        onClick={() => setShowCreate(true)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-[#1B4D4F] hover:bg-slate-50 transition-colors"
                                    >
                                        <FaPlus className="text-[9px]" />
                                        Neue Leistung im Katalog anlegen
                                    </button>
                                ) : (
                                    <div className="p-3 space-y-2 bg-slate-50/60">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neue Leistung</p>
                                        <input
                                            type="text"
                                            placeholder="Bezeichnung *"
                                            autoFocus
                                            value={newSvc.name}
                                            onChange={e => setNewSvc(s => ({ ...s, name: e.target.value }))}
                                            className="w-full text-xs border-b-2 border-slate-200 focus:border-[#1B4D4F] bg-transparent outline-none pb-px text-slate-700 placeholder:text-slate-300 transition-colors"
                                        />
                                        <div className="flex gap-2">
                                            <select
                                                value={newSvc.unit}
                                                onChange={e => setNewSvc(s => ({ ...s, unit: e.target.value }))}
                                                className="flex-1 text-xs border-b-2 border-slate-200 focus:border-[#1B4D4F] bg-transparent outline-none pb-px text-slate-600 transition-colors"
                                            >
                                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                            <div className="flex items-end gap-1">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0,00"
                                                    value={newSvc.base_price}
                                                    onChange={e => setNewSvc(s => ({ ...s, base_price: e.target.value }))}
                                                    className="w-20 text-right text-xs font-mono border-b-2 border-slate-200 focus:border-[#1B4D4F] bg-transparent outline-none pb-px text-slate-700 placeholder:text-slate-300 transition-colors"
                                                />
                                                <span className="text-xs text-slate-400 pb-px">€</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                disabled={!newSvc.name.trim() || createServiceMutation.isPending}
                                                onClick={() => createServiceMutation.mutate({
                                                    name: newSvc.name.trim(),
                                                    unit: newSvc.unit,
                                                    base_price: parseFloat(newSvc.base_price) || 0,
                                                    status: 'active',
                                                })}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4D4F] text-white text-[10px] font-black uppercase tracking-wider rounded-sm disabled:opacity-40 hover:bg-[#163e40] transition-colors"
                                            >
                                                <FaCheck className="text-[8px]" />
                                                {createServiceMutation.isPending ? 'Speichern…' : 'Erstellen & Hinzufügen'}
                                            </button>
                                            <button
                                                onClick={() => { setShowCreate(false); setNewSvc(EMPTY_SERVICE()); }}
                                                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                Abbrechen
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectPositionsTable;
