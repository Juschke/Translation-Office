import { useState, useMemo } from 'react';
import { FaPlus, FaCheckCircle, FaFileInvoiceDollar, FaTrashAlt, FaClock, FaInfoCircle } from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';

interface ProjectPosition {
    id: string;
    description: string;
    amount: string;
    unit: string;
    quantity: string;
    partnerRate: string;
    partnerMode: string;
    partnerTotal: string;
    customerRate: string;
    customerTotal: string;
    customerMode: string;
    marginType: string;
    marginPercent: string;
}

interface ProjectFinancesTabProps {
    projectData: any;
    onSavePositions: (positions: any[]) => void;
    onRecordPayment: () => void;
    onCreateInvoice: () => void;
    onGoToInvoice: () => void;
    isPendingSave: boolean;
}

const ProjectFinancesTab = ({
    projectData,
    onSavePositions,
    onRecordPayment,
    onCreateInvoice,
    onGoToInvoice,
    isPendingSave,
}: ProjectFinancesTabProps) => {
    const [positions, setPositions] = useState<ProjectPosition[]>(projectData.positions || []);
    const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

    const financials = useMemo(() => {
        const payments = projectData.payments || [];

        const extraNet = (projectData.isCertified ? 5 : 0) +
            (projectData.hasApostille ? 15 : 0) +
            (projectData.isExpress ? 15 : 0) +
            (projectData.classification === 'ja' ? 15 : 0) +
            ((projectData.copies || 0) * (Number(projectData.copyPrice) || 5));

        const positionsNet = positions.reduce((sum: number, pos: any) => sum + (parseFloat(pos.customerTotal) || 0), 0);
        const netTotal = positionsNet + extraNet;
        const taxTotal = netTotal * 0.19;
        const grossTotal = netTotal + taxTotal;

        const partnerTotal = positions.reduce((sum: number, pos: any) => {
            const amount = parseFloat(pos.amount) || 0;
            const rate = parseFloat(pos.partnerRate) || 0;
            return sum + (amount * rate);
        }, 0);

        const margin = netTotal - partnerTotal;
        const marginPercent = netTotal > 0 ? (margin / netTotal) * 100 : 0;
        const paid = payments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
        const open = grossTotal - paid;

        return { netTotal, taxTotal, grossTotal, partnerTotal, margin, marginPercent, paid, open, extraTotal: extraNet };
    }, [positions, projectData]);

    const handleCellUpdate = (id: string, field: string, value: string) => {
        setPositions(prev => prev.map((p: any) => {
            if (p.id !== id) return p;
            const updated = { ...p, [field]: value };
            if (['amount', 'partnerRate', 'customerRate', 'quantity', 'partnerMode', 'customerMode'].includes(field)) {
                const amount = parseFloat(updated.amount) || 0;
                const qty = parseFloat(updated.quantity) || 1;
                const pRate = parseFloat(updated.partnerRate) || 0;
                const cRate = parseFloat(updated.customerRate) || 0;
                updated.partnerTotal = updated.partnerMode === 'fixed'
                    ? (pRate * qty).toFixed(2)
                    : (amount * qty * pRate).toFixed(2);
                updated.customerTotal = updated.customerMode === 'fixed'
                    ? (cRate * qty).toFixed(2)
                    : (amount * qty * cRate).toFixed(2);
            }
            return updated;
        }));
    };

    const addPosition = () => {
        setPositions(prev => [...prev, {
            id: Date.now().toString(),
            description: 'Neue Position',
            amount: '1',
            unit: 'Wörter',
            quantity: '1',
            partnerRate: '0.00',
            partnerMode: 'unit',
            partnerTotal: '0.00',
            customerRate: '0.00',
            customerTotal: '0.00',
            customerMode: 'unit',
            marginType: 'markup',
            marginPercent: '0',
        }]);
    };

    const deletePosition = (id: string) => {
        setPositions(prev => prev.filter(p => p.id !== id));
    };

    const handleSave = () => {
        onSavePositions(positions.map(p => ({
            id: p.id,
            description: p.description,
            unit: p.unit,
            amount: parseFloat(p.amount) || 0,
            quantity: parseFloat(p.quantity) || 0,
            partner_rate: parseFloat(p.partnerRate) || 0,
            partner_mode: p.partnerMode,
            partner_total: parseFloat(p.partnerTotal) || 0,
            customer_rate: parseFloat(p.customerRate) || 0,
            customer_mode: p.customerMode,
            customer_total: parseFloat(p.customerTotal) || 0,
            margin_type: p.marginType,
            margin_percent: parseFloat(p.marginPercent) || 0,
        })));
    };

    const renderEditableCell = (id: string, field: string, value: string, type: 'text' | 'number' = 'text', className: string = '', disabled: boolean = false) => {
        const isEditing = !disabled && editingCell?.id === id && editingCell?.field === field;

        if (isEditing) {
            return (
                <input
                    autoFocus
                    type={type}
                    defaultValue={value}
                    className={clsx("w-full bg-white border-2 border-slate-900 rounded px-2 py-1 outline-none text-xs font-medium shadow-sm", className)}
                    onBlur={(e) => {
                        handleCellUpdate(id, field, e.target.value);
                        setEditingCell(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleCellUpdate(id, field, (e.target as HTMLInputElement).value);
                            setEditingCell(null);
                        }
                        if (e.key === 'Escape') setEditingCell(null);
                    }}
                />
            );
        }

        return (
            <div
                onClick={() => !disabled && setEditingCell({ id, field })}
                className={clsx(
                    "px-2 py-1 rounded transition",
                    !disabled ? "cursor-pointer hover:bg-slate-50 hover:text-slate-900" : "cursor-default text-slate-500",
                    className
                )}
                title={disabled ? undefined : "Klicken zum Bearbeiten"}
            >
                {value || '-'}
            </div>
        );
    };

    const activeInvoice = projectData.invoices?.find((inv: any) => !['cancelled'].includes(inv.status));
    const isLocked = !!activeInvoice;

    return (
        <div className="flex flex-col gap-6 mb-10 animate-fadeIn">
            {isLocked && (
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <FaInfoCircle />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Kalkulation gesperrt</h4>
                        <p className="text-xs text-slate-500 mt-1">
                            Da bereits eine aktive Rechnung ({activeInvoice.invoice_number}) existiert, kann die Kalkulation nicht mehr geändert werden.
                            Stornieren Sie die Rechnung, um Bearbeitungen vorzunehmen.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Calculation Table */}
                <div className="xl:col-span-8 space-y-6">
                    {/* Positions Table */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                                    <FaFileInvoiceDollar />
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-800">Kalkulation</h3>
                                    <p className="text-xs text-slate-400 font-medium">Positionen & Preise</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isLocked && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addPosition}
                                        className="h-8 bg-white text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white transition shadow-sm flex items-center gap-1.5"
                                    >
                                        <FaPlus className="mb-0.5" /> Neu
                                    </Button>
                                )}
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isPendingSave || isLocked}
                                    className="h-8 flex items-center gap-1.5"
                                >
                                    <FaCheckCircle /> {isLocked ? 'Gesperrt' : 'Speichern'}
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 w-10 text-center">#</th>
                                        <th className="px-4 py-3">Beschreibung</th>
                                        <th className="px-4 py-3 w-28 text-right">Menge</th>
                                        <th className="px-4 py-3 w-24 text-right">Einh.</th>
                                        <th className="px-4 py-3 w-32 text-right bg-red-50/30 text-red-400 border-l border-slate-100">EK</th>
                                        <th className="px-4 py-3 w-32 text-right bg-emerald-50/30 text-emerald-600 border-l border-slate-100">VK</th>
                                        <th className="px-4 py-3 w-28 text-right font-semibold text-slate-700 bg-emerald-50/30 border-l border-slate-100">Gesamt</th>
                                        <th className="px-2 py-3 w-10 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {positions.map((pos: any, idx: number) => (
                                        <tr key={pos.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                {renderEditableCell(pos.id, 'description', pos.description, 'text', 'font-medium text-slate-700 w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-1 -mx-1', isLocked)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {renderEditableCell(pos.id, 'amount', pos.amount, 'number', 'text-right font-mono text-slate-600 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-1 -mx-1', isLocked)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <select
                                                    value={pos.unit}
                                                    disabled={isLocked}
                                                    onChange={(e) => handleCellUpdate(pos.id, 'unit', e.target.value)}
                                                    className={clsx(
                                                        "text-right text-xs font-medium bg-transparent outline-none w-full appearance-none",
                                                        !isLocked ? "text-slate-400 cursor-pointer hover:text-slate-700 transition-colors" : "text-slate-500 cursor-default"
                                                    )}
                                                >
                                                    <option value="Wörter">Wörter</option>
                                                    <option value="Zeilen">Zeilen</option>
                                                    <option value="Seiten">Seiten</option>
                                                    <option value="Stunden">Stunden</option>
                                                    <option value="Pauschal">Pauschal</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-400 font-medium border-l border-slate-100 bg-red-50/5 group-hover:bg-red-50/20 transition-colors">
                                                <div className="flex flex-col gap-0.5 items-end">
                                                    {renderEditableCell(pos.id, 'partnerRate', pos.partnerRate, 'number', 'text-right font-mono bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-red-100 rounded px-1 -mx-1', isLocked)}
                                                    <select
                                                        value={pos.partnerMode || 'unit'}
                                                        disabled={isLocked}
                                                        onChange={(e) => handleCellUpdate(pos.id, 'partnerMode', e.target.value)}
                                                        className={clsx(
                                                            "text-right text-xs font-medium bg-transparent outline-none appearance-none",
                                                            !isLocked ? "text-red-300 cursor-pointer hover:text-red-500 transition-colors" : "text-red-400/50 cursor-default"
                                                        )}
                                                    >
                                                        <option value="unit">/ Einheit</option>
                                                        <option value="fixed">Pauschal</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-emerald-600 font-medium border-l border-slate-100 bg-emerald-50/5 group-hover:bg-emerald-50/20 transition-colors">
                                                <div className="flex flex-col gap-0.5 items-end">
                                                    {renderEditableCell(pos.id, 'customerRate', pos.customerRate, 'number', 'text-right font-mono bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded px-1 -mx-1', isLocked)}
                                                    <select
                                                        value={pos.customerMode || 'unit'}
                                                        disabled={isLocked}
                                                        onChange={(e) => handleCellUpdate(pos.id, 'customerMode', e.target.value)}
                                                        className={clsx(
                                                            "text-right text-xs font-medium bg-transparent outline-none appearance-none",
                                                            !isLocked ? "text-emerald-400 cursor-pointer hover:text-emerald-600 transition-colors" : "text-emerald-500/50 cursor-default"
                                                        )}
                                                    >
                                                        <option value="unit">/ Einheit</option>
                                                        <option value="fixed">Pauschal</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-800 border-l border-slate-100 bg-emerald-50/10 group-hover:bg-emerald-50/30 transition-colors">
                                                {parseFloat(pos.customerTotal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                {!isLocked && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deletePosition(pos.id)}
                                                        className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Position löschen"
                                                    >
                                                        <FaTrashAlt className="text-xs" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {positions.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/30">
                                                Keine Positionen vorhanden. Starten Sie mit "Neu".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {/* Extra Costs Section */}
                                {(projectData.isCertified || projectData.hasApostille || projectData.isExpress || projectData.classification === 'ja' || projectData.copies > 0) && (
                                    <tbody className="divide-y divide-slate-100 text-xs border-t-2 border-slate-100">
                                        {projectData.isCertified && (
                                            <tr className="bg-transparent">
                                                <td className="px-4 py-3 text-center text-slate-400 font-medium">-</td>
                                                <td className="px-4 py-3 font-medium text-slate-600">Beglaubigung</td>
                                                <td className="px-4 py-3 text-right text-slate-500">1</td>
                                                <td className="px-4 py-3 text-right text-slate-500">Pauschal</td>
                                                <td className="px-4 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-4 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-800 border-l border-slate-100 bg-emerald-50/10">5,00 €</td>
                                                <td className="px-2 py-3"></td>
                                            </tr>
                                        )}
                                        {projectData.hasApostille && (
                                            <tr className="bg-transparent">
                                                <td className="px-4 py-3 text-center text-slate-400 font-medium">-</td>
                                                <td className="px-4 py-3 font-medium text-slate-600">Apostille</td>
                                                <td className="px-4 py-3 text-right text-slate-500">1</td>
                                                <td className="px-4 py-3 text-right text-slate-500">Pauschal</td>
                                                <td className="px-4 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-4 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-800 border-l border-slate-100 bg-emerald-50/10">15,00 €</td>
                                                <td className="px-2 py-3"></td>
                                            </tr>
                                        )}
                                        {projectData.isExpress && (
                                            <tr className="bg-transparent">
                                                <td className="px-4 py-3 text-center text-slate-400 font-medium">-</td>
                                                <td className="px-4 py-3 font-medium text-slate-600">Express-Zuschlag</td>
                                                <td className="px-4 py-3 text-right text-slate-500">1</td>
                                                <td className="px-4 py-3 text-right text-slate-500">Pauschal</td>
                                                <td className="px-4 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-4 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-800 border-l border-slate-100 bg-emerald-50/10">15,00 €</td>
                                                <td className="px-2 py-3"></td>
                                            </tr>
                                        )}
                                        {projectData.classification === 'ja' && (
                                            <tr className="bg-transparent">
                                                <td className="px-4 py-3 text-center text-slate-400 font-medium">-</td>
                                                <td className="px-4 py-3 font-medium text-slate-600">Klassifizierung</td>
                                                <td className="px-4 py-3 text-right text-slate-500">1</td>
                                                <td className="px-4 py-3 text-right text-slate-500">Pauschal</td>
                                                <td className="px-4 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-4 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-800 border-l border-slate-100 bg-emerald-50/10">15,00 €</td>
                                                <td className="px-2 py-3"></td>
                                            </tr>
                                        )}
                                        {projectData.copies > 0 && (
                                            <tr className="bg-transparent">
                                                <td className="px-4 py-3 text-center text-slate-400 font-medium">-</td>
                                                <td className="px-4 py-3 font-medium text-slate-600">Kopien</td>
                                                <td className="px-4 py-3 text-right text-slate-500">{projectData.copies}</td>
                                                <td className="px-4 py-3 text-right text-slate-500">Stk</td>
                                                <td className="px-4 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-4 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-800 border-l border-slate-100 bg-emerald-50/10">
                                                    {(projectData.copies * (projectData.copyPrice || 5)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                </td>
                                                <td className="px-2 py-3"></td>
                                            </tr>
                                        )}
                                    </tbody>
                                )}
                                <tfoot className="bg-slate-50/80 font-bold text-slate-900 border-t-2 border-slate-200">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-4 text-right uppercase tracking-[0.1em] text-[10px] text-slate-500">Gesamt Netto (EK & VK)</td>
                                        <td colSpan={2} className="px-4 py-4"></td>
                                        <td className="px-4 py-4 text-right text-red-500 border-l border-slate-100 bg-red-50/30">
                                            {financials.partnerTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </td>
                                        <td className="px-4 py-4 border-l border-slate-100 bg-emerald-50/10"></td>
                                        <td className="px-4 py-4 text-right text-slate-900 bg-emerald-50/30 border-l border-slate-100">
                                            {financials.netTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </td>
                                        <td className="px-2 py-4"></td>
                                    </tr>
                                    <tr className="border-t border-slate-200">
                                        <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-[0.1em] text-[10px] text-slate-500">Marge (Gewinn)</td>
                                        <td colSpan={4} className="px-4 py-3 border-l border-slate-100"></td>
                                        <td className="px-4 py-3 text-right text-emerald-600 border-l border-slate-100 bg-emerald-50/20">
                                            <div className="flex flex-col">
                                                <span>{financials.margin.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                                <span className="text-[9px] opacity-70">({financials.marginPercent.toFixed(1)}%)</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-3"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="bg-slate-50 p-3 border-t border-slate-200 text-center">
                            <p className="text-xs text-slate-400 italic">Alle Preise in Euro inkl. gesetzlicher MwSt. falls nicht anders angegeben.</p>
                        </div>
                    </div>

                    {/* Payments Section */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                                    <FaFileInvoiceDollar />
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-800">Zahlungen</h3>
                                    <p className="text-xs text-slate-400 font-medium">Eingänge & Gutschriften</p>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onRecordPayment}
                                className="h-8 flex items-center gap-2"
                            >
                                <FaPlus className="mb-0.5" /> Zahlung erfassen
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 w-32">Datum</th>
                                        <th className="px-6 py-3">Beschreibung / Methode</th>
                                        <th className="px-6 py-3 text-right">Betrag</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {(projectData.payments || []).length > 0 ? (
                                        projectData.payments.map((payment: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-3 font-mono text-slate-600">
                                                    {new Date(payment.created_at || payment.date || new Date()).toLocaleDateString('de-DE')}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-slate-700">
                                                    {payment.note || 'Zahlungseingang'}
                                                    {payment.method && <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{payment.method}</span>}
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-emerald-600">
                                                    + {parseFloat(payment.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <FaTrashAlt className="text-xs" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic bg-slate-50/30">
                                                Noch keine Zahlungen verbucht.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Financial Summary Sidebar */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                        <div className="p-5 border-b border-slate-100 bg-transparent">
                            <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                                <FaClock className="text-slate-600" /> Finanz-Status
                            </h3>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Main Total Display */}
                            <div className="text-center pb-6 border-b border-slate-100 border-dashed">
                                <p className="text-xs font-medium text-slate-400 mb-1">Gesamtbetrag (Brutto)</p>
                                <div className="text-4xl font-semibold text-slate-800 tracking-tight">
                                    {financials.grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl text-slate-400 font-medium">€</span>
                                </div>
                                <div className="mt-2 flex justify-center gap-2">
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded text-xs font-medium border",
                                        financials.open <= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                    )}>
                                        {financials.open <= 0 ? 'Bezahlt' : 'Offen'}
                                    </span>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Gesamt Netto VK Kunde</span>
                                    <span className="font-medium text-slate-700">{financials.netTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                        MwSt. (19%)
                                        <FaInfoCircle className="text-slate-300 text-xs" title="Standardsteuersatz Deutschland" />
                                    </span>
                                    <span className="font-medium text-slate-700">{financials.taxTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="font-medium text-slate-800">Gesamtbetrag (Brutto)</span>
                                    <span className="font-medium text-slate-800">{financials.grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                </div>
                                <div className="h-px bg-slate-100 my-2"></div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Gesamt Netto EK Partner</span>
                                    <span className="font-medium text-red-400">- {financials.partnerTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                </div>
                                <div className="bg-slate-50/50 rounded-sm p-3 border border-slate-100 mt-4">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-medium text-slate-500">Marge (Gewinn)</span>
                                        <span className="text-lg font-semibold text-slate-800">{financials.margin.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                    </div>
                                    <div className="w-full bg-emerald-200/50 rounded-full h-1.5 mb-1">
                                        <div
                                            className={clsx("h-1.5 rounded-full transition-all duration-500",
                                                financials.marginPercent > 30 ? "bg-emerald-500" :
                                                    financials.marginPercent > 10 ? "bg-amber-500" : "bg-red-500"
                                            )}
                                            style={{ width: `${Math.min(100, Math.max(0, financials.marginPercent))}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-slate-400">
                                        <span>{financials.marginPercent.toFixed(1)}% Marge</span>
                                        <span>Ziel: {'>'}30%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                {activeInvoice ? (
                                    <div className="rounded-sm border border-slate-200 bg-white p-4 space-y-3 shadow-sm relative overflow-hidden text-slate-800">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <FaCheckCircle className="text-emerald-500" /> Rechnung verknüpft
                                            </span>
                                            <span className={clsx('text-[10px] font-black uppercase tracking-tight px-2 py-0.5 rounded-sm border', {
                                                'bg-slate-50 text-slate-500 border-slate-200': activeInvoice.status === 'draft',
                                                'bg-indigo-50 text-indigo-700 border-indigo-100': activeInvoice.status === 'issued',
                                                'bg-blue-50 text-blue-700 border-blue-100': activeInvoice.status === 'sent',
                                                'bg-emerald-50 text-emerald-700 border-emerald-100': activeInvoice.status === 'paid',
                                                'bg-red-50 text-red-700 border-red-100': activeInvoice.status === 'overdue',
                                            })}>
                                                {{ draft: 'Entwurf', issued: 'Ausgestellt', sent: 'Versendet', paid: 'Bezahlt', overdue: 'Überfällig' }[activeInvoice.status as string] ?? activeInvoice.status}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 tracking-tight">{activeInvoice.invoice_number}</div>
                                            <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                                                {(activeInvoice.amount_gross / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                                {' · '}
                                                {activeInvoice.due_date ? `Fällig ${new Date(activeInvoice.due_date).toLocaleDateString('de-DE')}` : ''}
                                            </div>
                                        </div>
                                        <Button
                                            variant="default"
                                            onClick={onGoToInvoice}
                                            className="w-full py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest shadow-lg shadow-brand-primary/10"
                                        >
                                            <FaFileInvoiceDollar size={12} /> ZUR RECHNUNG
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="default"
                                        onClick={onCreateInvoice}
                                        className="w-full py-2.5 flex items-center justify-center gap-2"
                                    >
                                        <FaFileInvoiceDollar /> Rechnung erstellen
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectFinancesTab;
