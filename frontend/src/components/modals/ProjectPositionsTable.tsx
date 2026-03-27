import { FaPlus, FaTrash } from 'react-icons/fa';
import type { ProjectPosition } from './projectTypes';

export type { ProjectPosition } from './projectTypes';

interface ProjectPositionsTableProps {
    positions: ProjectPosition[];
    setPositions: (positions: ProjectPosition[]) => void;
    disabled?: boolean;
}

const UNITS = ['Wörter', 'Normzeile', 'Seiten', 'Stunden', 'Pauschal', 'Stk', 'Minuten', 'Tage'];

const EMPTY_POSITION = (): ProjectPosition => ({
    id: Date.now().toString(),
    description: 'Zusatzleistung',
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

const ProjectPositionsTable = ({ positions, setPositions, disabled }: ProjectPositionsTableProps) => {
    const update = (index: number, patch: Partial<ProjectPosition>) => {
        if (disabled) return;
        const next = [...positions];
        next[index] = { ...next[index], ...patch };
        setPositions(next);
    };

    return (
        <div className="overflow-x-auto border border-slate-200 rounded-sm shadow-sm bg-white">
            <table className="w-full text-left border-collapse min-w-[680px]">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-3 w-8 text-center">#</th>
                        <th className="px-4 py-3">Beschreibung</th>
                        <th className="px-4 py-3 w-24 text-right">Menge</th>
                        <th className="px-4 py-3 w-28 text-right">Einheit</th>
                        <th className="px-4 py-3 w-36 text-right text-red-500/80 border-l border-slate-100 text-[10px] font-black uppercase tracking-tight">EK Partner</th>
                        <th className="px-4 py-3 w-40 text-right text-emerald-600/80 border-l border-slate-100 text-[10px] font-black uppercase tracking-tight">VK Kunde</th>
                        <th className="px-4 py-3 w-28 text-right border-l border-slate-100 text-[10px] font-black uppercase tracking-tight">Gesamt</th>
                        <th className="px-2 py-3 w-8"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {positions.map((pos, index) => (
                        <tr key={pos.id} className="group hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 text-center text-slate-400 font-medium">{index + 1}</td>

                            {/* Beschreibung */}
                            <td className="px-4 py-3">
                                <input
                                    type="text"
                                    disabled={disabled}
                                    placeholder="Bezeichnung..."
                                    className="w-full bg-transparent outline-none font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-1 -mx-1 disabled:cursor-not-allowed"
                                    value={pos.description}
                                    onChange={e => update(index, { description: e.target.value })}
                                />
                            </td>

                            {/* Menge */}
                            <td className="px-4 py-3 text-right">
                                <input
                                    type="number"
                                    disabled={disabled}
                                    step="0.01"
                                    min="0"
                                    className="w-full text-right bg-transparent outline-none font-mono focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-1 -mx-1 disabled:cursor-not-allowed"
                                    value={pos.quantity}
                                    onChange={e => update(index, { quantity: e.target.value })}
                                    onBlur={e => update(index, { quantity: (parseFloat(e.target.value) || 0).toFixed(2) })}
                                />
                            </td>

                            {/* Einheit */}
                            <td className="px-4 py-3 text-right">
                                <select
                                    disabled={disabled}
                                    className="w-full h-7 px-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 outline-none cursor-pointer hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    value={pos.unit}
                                    onChange={e => update(index, { unit: e.target.value })}
                                >
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </td>

                            {/* EK Partner */}
                            <td className="px-4 py-3 text-right border-l border-slate-100">
                                <div className="flex items-center justify-end gap-1.5">
                                    <input
                                        type="number"
                                        disabled={disabled}
                                        step="0.01"
                                        min="0"
                                        className="w-16 text-right bg-transparent outline-none font-mono text-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 rounded px-1 disabled:cursor-not-allowed disabled:text-red-300"
                                        value={pos.partnerRate}
                                        onChange={e => update(index, { partnerRate: e.target.value })}
                                        onBlur={e => update(index, { partnerRate: (parseFloat(e.target.value) || 0).toFixed(2) })}
                                    />
                                    <select
                                        disabled={disabled}
                                        className="h-7 px-1 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-500 outline-none cursor-pointer hover:border-slate-400 disabled:cursor-not-allowed"
                                        value={pos.partnerMode}
                                        onChange={e => update(index, { partnerMode: e.target.value })}
                                        title="Berechnungsmodus"
                                    >
                                        <option value="unit">/ Einh.</option>
                                        <option value="flat">Pausch.</option>
                                    </select>
                                </div>
                            </td>

                            {/* VK Kunde */}
                            <td className="px-4 py-3 text-right border-l border-slate-100">
                                <div className="flex items-center justify-end gap-1.5">
                                    {pos.customerMode === 'unit' ? (
                                        <input
                                            type="number"
                                            disabled={disabled}
                                            step="0.01"
                                            min="0"
                                            className="w-16 text-right bg-transparent outline-none font-mono text-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded px-1 disabled:cursor-not-allowed disabled:text-emerald-400"
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
                                            className="w-16 text-right bg-transparent outline-none font-mono text-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded px-1 disabled:cursor-not-allowed disabled:text-emerald-400"
                                            value={pos.customerRate}
                                            onChange={e => update(index, { customerRate: e.target.value })}
                                            onBlur={e => update(index, { customerRate: (parseFloat(e.target.value) || 0).toFixed(2) })}
                                        />
                                    )}
                                    <select
                                        disabled={disabled}
                                        className="h-7 px-1 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-500 outline-none cursor-pointer hover:border-slate-400 disabled:cursor-not-allowed"
                                        value={pos.customerMode === 'flat' ? 'flat' : pos.customerMode === 'rate' ? 'rate' : 'margin'}
                                        onChange={e => {
                                            const v = e.target.value;
                                            if (v === 'flat')   update(index, { customerMode: 'flat',  marginType: 'markup' });
                                            else if (v === 'rate') update(index, { customerMode: 'rate', marginType: 'markup' });
                                            else                update(index, { customerMode: 'unit',  marginType: 'markup' });
                                        }}
                                        title="Berechnungsmodus Kundenpreis"
                                    >
                                        <option value="rate">/ Einh.</option>
                                        <option value="margin">% Marge</option>
                                        <option value="flat">Pausch.</option>
                                    </select>
                                </div>
                            </td>

                            {/* Gesamt (Kunde) */}
                            <td className="px-4 py-3 text-right font-semibold text-slate-800 border-l border-slate-100">
                                {fmt2(pos.customerTotal)} €
                            </td>

                            {/* Löschen */}
                            <td className="px-2 py-3 text-center">
                                {!disabled && positions.length > 1 ? (
                                    <button
                                        onClick={() => setPositions(positions.filter(p => p.id !== pos.id))}
                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title="Löschen"
                                    >
                                        <FaTrash className="text-xs" />
                                    </button>
                                ) : (
                                    <button disabled className="p-1.5 text-slate-200 cursor-not-allowed">
                                        <FaTrash className="text-xs" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {!disabled && (
                <div className="p-2 border-t border-slate-100 bg-white flex justify-center">
                    <button
                        onClick={() => setPositions([...positions, EMPTY_POSITION()])}
                        className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm"
                    >
                        <FaPlus /> Position hinzufügen
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProjectPositionsTable;
