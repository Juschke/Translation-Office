import { FaPlus, FaTrash } from 'react-icons/fa';
import type { ProjectPosition } from './projectTypes';

export type { ProjectPosition } from './projectTypes';

interface ProjectPositionsTableProps {
    positions: ProjectPosition[];
    setPositions: (positions: ProjectPosition[]) => void;
}

const EMPTY_POSITION = (): ProjectPosition => ({
    id: Date.now().toString(),
    description: 'Zusatzleistung',
    amount: '1.00',
    unit: 'Normzeile',
    quantity: '1.00',
    partnerRate: '0.00',
    partnerMode: 'unit',
    partnerTotal: '0.00',
    customerRate: '0.00',
    customerMode: 'unit',
    customerTotal: '0.00',
    marginType: 'markup',
    marginPercent: '0.00',
});

const ProjectPositionsTable = ({ positions, setPositions }: ProjectPositionsTableProps) => {
    const update = (index: number, patch: Partial<ProjectPosition>) => {
        const next = [...positions];
        next[index] = { ...next[index], ...patch };
        setPositions(next);
    };

    return (
        <div className="overflow-x-auto border border-slate-200 rounded-sm shadow-sm bg-white">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-3 w-10 text-center">#</th>
                        <th className="px-4 py-3">Beschreibung</th>
                        <th className="px-4 py-3 w-32 text-right">Menge</th>
                        <th className="px-4 py-3 w-24 text-right">Einh.</th>
                        <th className="px-4 py-3 w-32 text-right bg-red-50/30 text-red-400 border-l border-slate-100">EK (Stk)</th>
                        <th className="px-4 py-3 w-32 text-right bg-emerald-50/30 text-emerald-600 border-l border-slate-100">VK (Stk)</th>
                        <th className="px-4 py-3 w-28 text-right font-semibold text-slate-700 bg-emerald-50/30 border-l border-slate-100">Gesamt</th>
                        <th className="px-2 py-3 w-10 text-center"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {positions.map((pos, index) => (
                        <tr key={pos.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-center text-slate-400 font-medium">{index + 1}</td>
                            <td className="px-4 py-3">
                                <input
                                    type="text"
                                    placeholder="Bezeichnung..."
                                    className="w-full bg-transparent outline-none font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-1 -mx-1"
                                    value={pos.description}
                                    onChange={e => update(index, { description: e.target.value })}
                                />
                            </td>
                            <td className="px-4 py-3 text-right">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="w-full text-right bg-transparent outline-none font-mono focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-1 -mx-1"
                                    value={pos.amount}
                                    onChange={e => update(index, { amount: e.target.value })}
                                    onBlur={e => update(index, { amount: Math.max(0, parseFloat(e.target.value) || 0).toFixed(2) })}
                                />
                            </td>
                            <td className="px-4 py-3 text-right">
                                <select
                                    className="w-full bg-transparent text-right outline-none text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700"
                                    value={pos.unit}
                                    onChange={e => update(index, { unit: e.target.value })}
                                >
                                    <option value="Wörter">Wörter</option>
                                    <option value="Normzeile">Normzeile</option>
                                    <option value="Seiten">Seiten</option>
                                    <option value="Stunden">Stunden</option>
                                    <option value="Pauschal">Pauschal</option>
                                </select>
                            </td>
                            <td className="px-4 py-3 text-right border-l border-slate-100 bg-red-50/5 group-hover:bg-red-50/20 transition-colors">
                                <div className="flex items-center justify-end gap-1">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-20 text-right bg-transparent outline-none font-mono text-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 rounded px-1"
                                        value={pos.partnerRate}
                                        onChange={e => update(index, { partnerRate: e.target.value })}
                                        onBlur={e => update(index, { partnerRate: Math.max(0, parseFloat(e.target.value) || 0).toFixed(2) })}
                                    />
                                    <select
                                        className="w-4 bg-transparent text-xs text-slate-400 outline-none"
                                        value={pos.partnerMode}
                                        onChange={e => update(index, { partnerMode: e.target.value })}
                                        title="Berechnung: Rate oder Pauschal"
                                    >
                                        <option value="unit">€/Eh.</option>
                                        <option value="flat">Fix</option>
                                    </select>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right border-l border-slate-100 bg-emerald-50/5 group-hover:bg-emerald-50/20 transition-colors">
                                <div className="flex items-center justify-end gap-1">
                                    {pos.customerMode === 'flat' || pos.customerMode === 'rate' ? (
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="w-20 text-right bg-transparent outline-none font-mono text-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded px-1"
                                            value={pos.customerRate}
                                            onChange={e => update(index, { customerRate: e.target.value })}
                                            onBlur={e => update(index, { customerRate: Math.max(0, parseFloat(e.target.value) || 0).toFixed(2) })}
                                        />
                                    ) : (
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-20 text-right bg-transparent outline-none font-mono text-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded px-1"
                                            value={pos.marginPercent}
                                            onChange={e => update(index, { marginPercent: e.target.value })}
                                            onBlur={e => update(index, { marginPercent: Math.max(0, parseFloat(e.target.value) || 0).toFixed(2) })}
                                        />
                                    )}
                                    <select
                                        className="w-4 bg-transparent text-xs text-slate-400 outline-none"
                                        value={pos.customerMode === 'flat' ? 'flat' : (pos.customerMode === 'rate' ? 'rate' : pos.marginType)}
                                        onChange={e => {
                                            const v = e.target.value;
                                            if (v === 'flat') update(index, { customerMode: 'flat', marginType: 'markup' });
                                            else if (v === 'rate') update(index, { customerMode: 'rate', marginType: 'markup' });
                                            else update(index, { customerMode: 'unit', marginType: v });
                                        }}
                                        title="Berechnung: Rate, Aufschlag, etc."
                                    >
                                        <option value="rate">Rate</option>
                                        <option value="markup">Aufschl. %</option>
                                        <option value="flat">Fix</option>
                                    </select>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800 border-l border-slate-100 bg-emerald-50/10 group-hover:bg-emerald-50/30 transition-colors">
                                {pos.customerTotal} €
                            </td>
                            <td className="px-2 py-3 text-center">
                                {positions.length > 1 ? (
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
            <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-center">
                <button
                    onClick={() => setPositions([...positions, EMPTY_POSITION()])}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm"
                >
                    <FaPlus /> Position hinzufügen
                </button>
            </div>
        </div>
    );
};

export default ProjectPositionsTable;
