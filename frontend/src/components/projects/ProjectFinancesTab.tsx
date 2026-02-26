import { useState, useMemo } from 'react';
import { FaPlus, FaCheckCircle, FaFileInvoiceDollar, FaTrashAlt, FaInfoCircle, FaCalculator, FaEuroSign, FaEllipsisV, FaArrowRight } from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import DataTable from '../common/DataTable';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

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
                    className={clsx("w-full bg-white border-2 border-brand-primary rounded px-2 py-1 outline-none text-xs font-bold shadow-md ring-2 ring-brand-primary/10", className)}
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
                    "px-2 py-1 rounded transition-all",
                    !disabled ? "cursor-pointer hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200" : "cursor-default text-slate-500",
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

    // DataTable columns for Payments
    const paymentColumns = useMemo(() => [
        {
            id: 'date',
            header: 'Datum',
            accessor: (payment: any) => (
                <span className="font-mono text-xs font-bold text-slate-500">
                    {new Date(payment.created_at || payment.date || new Date()).toLocaleDateString('de-DE')}
                </span>
            ),
            sortable: true,
        },
        {
            id: 'note',
            header: 'Beschreibung / Methode',
            accessor: (payment: any) => (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 text-xs">{payment.note || 'Zahlungseingang'}</span>
                    {payment.method && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase border border-slate-200">{payment.method}</span>}
                </div>
            ),
            sortable: true,
        },
        {
            id: 'amount',
            header: 'Betrag',
            accessor: (payment: any) => (
                <span className="font-black text-emerald-600 text-xs">
                    + {parseFloat(payment.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
            ),
            align: 'right' as const,
            sortable: true,
        },
        {
            id: 'actions',
            header: '',
            accessor: (_payment: any) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                                <FaEllipsisV className="text-[10px]" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem className="text-red-500 font-bold text-[11px] gap-2">
                                <FaTrashAlt /> Löschen
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
            align: 'right' as const,
        }
    ], []);

    return (
        <div className="flex flex-col gap-8 mb-10 animate-fadeIn h-full">
            {isLocked && (
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="w-10 h-10 rounded-full bg-white text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 shadow-inner">
                        <FaInfoCircle />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Kalkulation gesperrt</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            Da bereits eine aktive Rechnung ({activeInvoice.invoice_number}) existiert, kann die Kalkulation nicht mehr geändert werden.
                            Stornieren Sie die Rechnung, um Bearbeitungen vorzunehmen.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1">
                {/* Left Column: Calculation Table */}
                <div className="xl:col-span-8 space-y-8 flex flex-col">
                    {/* Positions Table */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <FaCalculator className="text-slate-600 text-sm" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-800">Positions-Kalkulation</h3>
                                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">Leistungen & Preise festlegen</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isLocked && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addPosition}
                                        className="h-8 bg-white text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white transition shadow-sm font-bold flex items-center gap-1.5"
                                    >
                                        <FaPlus className="text-[10px]" /> NEU
                                    </Button>
                                )}
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isPendingSave || isLocked}
                                    className="h-8 font-bold flex items-center gap-1.5 shadow-md shadow-brand-primary/10"
                                >
                                    <FaCheckCircle className="text-[10px]" /> {isLocked ? 'GESPERRT' : 'SPEICHERN'}
                                </Button>
                            </div>
                        </div>

                        <div className="px-6 py-4 flex-1">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10 text-center px-2">#</TableHead>
                                        <TableHead className="px-4">Beschreibung</TableHead>
                                        <TableHead className="w-24 text-right px-4">Menge</TableHead>
                                        <TableHead className="w-24 text-right px-4">Einh.</TableHead>
                                        <TableHead className="w-28 text-right px-4 bg-red-50/20 text-red-700/70 border-l border-slate-100 uppercase tracking-tighter text-[9px] font-black">EK (Partner)</TableHead>
                                        <TableHead className="w-28 text-right px-4 bg-emerald-50/20 text-emerald-700/70 border-l border-slate-100 uppercase tracking-tighter text-[9px] font-black">VK (Kunde)</TableHead>
                                        <TableHead className="w-32 text-right px-4 font-black uppercase text-[9px] tracking-tighter bg-emerald-50/30 border-l border-slate-100">Gesamt</TableHead>
                                        <TableHead className="w-10 text-center px-2"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {positions.map((pos: any, idx: number) => (
                                        <TableRow key={pos.id} className="group hover:bg-slate-50/50">
                                            <TableCell className="text-center text-slate-400 font-bold text-[10px] px-2">{idx + 1}</TableCell>
                                            <TableCell className="px-4">
                                                {renderEditableCell(pos.id, 'description', pos.description, 'text', 'font-bold text-slate-700 w-full', isLocked)}
                                            </TableCell>
                                            <TableCell className="text-right px-4">
                                                {renderEditableCell(pos.id, 'amount', pos.amount, 'number', 'text-right font-mono text-xs font-bold text-slate-600', isLocked)}
                                            </TableCell>
                                            <TableCell className="text-right px-4">
                                                <select
                                                    value={pos.unit}
                                                    disabled={isLocked}
                                                    onChange={(e) => handleCellUpdate(pos.id, 'unit', e.target.value)}
                                                    className={clsx(
                                                        "text-right text-[11px] font-bold bg-transparent outline-none w-full appearance-none",
                                                        !isLocked ? "text-slate-400 cursor-pointer hover:text-slate-700 transition-colors" : "text-slate-500 cursor-default"
                                                    )}
                                                >
                                                    <option value="Wörter">Wörter</option>
                                                    <option value="Zeilen">Zeilen</option>
                                                    <option value="Seiten">Seiten</option>
                                                    <option value="Stunden">Stunden</option>
                                                    <option value="Pauschal">Pauschal</option>
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-right px-4 border-l border-slate-100 bg-red-50/5 group-hover:bg-red-50/10 transition-colors">
                                                <div className="flex flex-col gap-0.5 items-end">
                                                    {renderEditableCell(pos.id, 'partnerRate', pos.partnerRate, 'number', 'text-right font-mono text-xs font-bold text-red-500', isLocked)}
                                                    <select
                                                        value={pos.partnerMode || 'unit'}
                                                        disabled={isLocked}
                                                        onChange={(e) => handleCellUpdate(pos.id, 'partnerMode', e.target.value)}
                                                        className={clsx(
                                                            "text-right text-[9px] font-black uppercase tracking-tighter bg-transparent outline-none appearance-none",
                                                            !isLocked ? "text-red-300 cursor-pointer hover:text-red-500 transition-colors" : "text-red-400/50 cursor-default"
                                                        )}
                                                    >
                                                        <option value="unit">/ Einheit</option>
                                                        <option value="fixed">Pauschal</option>
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-4 border-l border-slate-100 bg-emerald-50/5 group-hover:bg-emerald-50/10 transition-colors">
                                                <div className="flex flex-col gap-0.5 items-end">
                                                    {renderEditableCell(pos.id, 'customerRate', pos.customerRate, 'number', 'text-right font-mono text-xs font-bold text-emerald-600', isLocked)}
                                                    <select
                                                        value={pos.customerMode || 'unit'}
                                                        disabled={isLocked}
                                                        onChange={(e) => handleCellUpdate(pos.id, 'customerMode', e.target.value)}
                                                        className={clsx(
                                                            "text-right text-[9px] font-black uppercase tracking-tighter bg-transparent outline-none appearance-none",
                                                            !isLocked ? "text-emerald-400 cursor-pointer hover:text-emerald-600 transition-colors" : "text-emerald-500/50 cursor-default"
                                                        )}
                                                    >
                                                        <option value="unit">/ Einheit</option>
                                                        <option value="fixed">Pauschal</option>
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-4 font-black text-slate-800 border-l border-slate-100 bg-emerald-50/10 group-hover:bg-emerald-50/20 transition-colors text-xs whitespace-nowrap">
                                                {parseFloat(pos.customerTotal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                            </TableCell>
                                            <TableCell className="text-center px-2">
                                                {!isLocked && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deletePosition(pos.id)}
                                                        className="h-7 w-7 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Position löschen"
                                                    >
                                                        <FaTrashAlt className="text-xs" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {positions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="px-6 py-12 text-center text-slate-400 italic font-medium bg-slate-50/30">
                                                Keine Positionen vorhanden. Starten Sie mit "NEU".
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* Extra Costs Footer Body */}
                                    {(projectData.isCertified || projectData.hasApostille || projectData.isExpress || projectData.classification === 'ja' || projectData.copies > 0) && (
                                        <>
                                            <TableRow className="bg-slate-50/30">
                                                <TableCell colSpan={8} className="px-4 py-2 text-[9px] font-black uppercase text-slate-400 bg-slate-50/80 border-y border-slate-100 tracking-widest">Zusatzleistungen (Fixkosten)</TableCell>
                                            </TableRow>
                                            {projectData.isCertified && (
                                                <TableRow>
                                                    <TableCell className="px-2 text-center">-</TableCell>
                                                    <TableCell className="px-4 font-bold text-slate-600 text-[11px]">Beglaubigung</TableCell>
                                                    <TableCell className="px-4 text-right text-slate-400 font-mono text-xs">1</TableCell>
                                                    <TableCell className="px-4 text-right text-slate-400 text-[11px] font-bold">Fix</TableCell>
                                                    <TableCell className="px-4 border-l border-slate-100 text-right text-slate-300">-</TableCell>
                                                    <TableCell className="px-4 border-l border-slate-100 text-right text-slate-300">-</TableCell>
                                                    <TableCell className="px-4 text-right font-black text-slate-800 border-l border-slate-100 bg-emerald-50/10 text-xs text-nowrap">5,00 €</TableCell>
                                                    <TableCell className="px-2"></TableCell>
                                                </TableRow>
                                            )}
                                            {projectData.hasApostille && (
                                                <TableRow>
                                                    <TableCell className="px-2 text-center">-</TableCell>
                                                    <TableCell className="px-4 font-bold text-slate-600 text-[11px]">Apostille</TableCell>
                                                    <TableCell className="px-4 text-right text-slate-400 font-mono text-xs">1</TableCell>
                                                    <TableCell className="px-4 text-right text-slate-400 text-[11px] font-bold">Fix</TableCell>
                                                    <TableCell className="px-4 border-l border-slate-100 text-right text-slate-300">-</TableCell>
                                                    <TableCell className="px-4 border-l border-slate-100 text-right text-slate-300">-</TableCell>
                                                    <TableCell className="px-4 text-right font-black text-slate-800 border-l border-slate-100 bg-emerald-50/10 text-xs text-nowrap">15,00 €</TableCell>
                                                    <TableCell className="px-2"></TableCell>
                                                </TableRow>
                                            )}
                                            {projectData.isExpress && (
                                                <TableRow>
                                                    <TableCell className="px-2 text-center">-</TableCell>
                                                    <TableCell className="px-4 font-bold text-slate-600 text-[11px]">Express-Zuschlag</TableCell>
                                                    <TableCell className="px-4 text-right text-slate-400 font-mono text-xs">1</TableCell>
                                                    <TableCell className="px-4 text-right text-slate-400 text-[11px] font-bold">Fix</TableCell>
                                                    <TableCell className="px-4 border-l border-slate-100 text-right text-slate-300">-</TableCell>
                                                    <TableCell className="px-4 border-l border-slate-100 text-right text-slate-300">-</TableCell>
                                                    <TableCell className="px-4 text-right font-black text-slate-800 border-l border-slate-100 bg-emerald-50/10 text-xs text-nowrap">15,00 €</TableCell>
                                                    <TableCell className="px-2"></TableCell>
                                                </TableRow>
                                            )}
                                            {projectData.classification === 'ja' && (
                                                <TableRow>
                                                    <TableCell className="px-2 text-center">-</TableCell>
                                                    <TableCell className="px-4 font-bold text-slate-600 text-[11px]">Klassifizierung</TableCell>
                                                    <TableCell className="px-4 text-right text-slate-400 font-mono text-xs">1</TableCell>
                                                    <TableCell className="px-4 text-right text-slate-400 text-[11px] font-bold">Fix</TableCell>
                                                    <TableCell className="px-4 border-l border-slate-100 text-right text-slate-300">-</TableCell>
                                                    <TableCell className="px-4 border-l border-slate-100 text-right text-slate-300">-</TableCell>
                                                    <TableCell className="px-4 text-right font-black text-slate-800 border-l border-slate-100 bg-emerald-50/10 text-xs text-nowrap">15,00 €</TableCell>
                                                    <TableCell className="px-2"></TableCell>
                                                </TableRow>
                                            )}
                                            {projectData.copies > 0 && (
                                                <TableRow>
                                                    <TableCell className="px-2 text-center">-</TableCell>
                                                    <TableCell className="px-4 font-bold text-slate-600 text-[11px]">Kopien</TableCell>
                                                    <TableCell className="px-4 text-right text-slate-400 font-mono text-xs">{projectData.copies}</TableCell>
                                                    <TableCell className="px-4 text-right text-slate-400 text-[11px] font-bold">Stk</TableCell>
                                                    <TableCell className="px-4 border-l border-slate-100 text-right text-slate-300">-</TableCell>
                                                    <TableCell className="px-4 border-l border-slate-100 text-right text-slate-300">-</TableCell>
                                                    <TableCell className="px-4 text-right font-black text-slate-800 border-l border-slate-100 bg-emerald-50/10 text-xs text-nowrap">
                                                        {(projectData.copies * (projectData.copyPrice || 5)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                    </TableCell>
                                                    <TableCell className="px-2"></TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Summary Footer Inlined */}
                        <div className="bg-slate-50 border-t border-slate-200 p-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex gap-10">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Partner EK Netto</span>
                                        <span className="text-sm font-bold text-red-500">{financials.partnerTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kunden VK Netto</span>
                                        <span className="text-sm font-bold text-slate-800">{financials.netTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                    </div>
                                </div>
                                <div className="bg-emerald-100/50 border border-emerald-200 rounded px-6 py-3 flex items-center gap-6 shadow-inner">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-emerald-600/70 uppercase tracking-widest mb-0.5" title="Gewinn vor Steuern">Projekt-Marge (Netto)</span>
                                        <span className="text-base font-black text-emerald-700">{financials.margin.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                    </div>
                                    <div className="w-px h-8 bg-emerald-200/50"></div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[18px] font-black text-emerald-700 leading-none">{financials.marginPercent.toFixed(1)}%</span>
                                        <span className="text-[8px] font-black text-emerald-600/50 uppercase tracking-tighter">Gewinnspanne</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payments section with DataTable */}
                    <div className="flex flex-col gap-4">
                        <DataTable
                            data={projectData.payments || []}
                            columns={paymentColumns as any}
                            pageSize={10}
                            searchPlaceholder="Zahlungen durchsuchen..."
                            extraControls={
                                <div className="flex items-center gap-2">
                                    {!activeInvoice && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-[3px] text-amber-600 text-[10px] font-bold uppercase tracking-tight animate-in fade-in slide-in-from-right-2">
                                            <FaInfoCircle className="text-[10px]" /> Rechnung erforderlich
                                        </div>
                                    )}
                                    {activeInvoice && financials.open > 0 && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={onRecordPayment}
                                            className="h-8 md:h-9 px-4 font-bold shadow-sm flex items-center gap-2 text-[10px] tracking-widest"
                                        >
                                            <FaPlus /> ZAHLUNG ERFASSEN
                                        </Button>
                                    )}
                                    {activeInvoice && financials.open <= 0 && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-[3px] text-emerald-600 text-[10px] font-black uppercase tracking-widest animate-in zoom-in-95 duration-300">
                                            <FaCheckCircle className="text-emerald-500" /> VOLLSTÄNDIG BEZAHLT
                                        </div>
                                    )}
                                </div>
                            }
                            tabs={
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-[3px] shadow-sm shrink-0">
                                    <FaEuroSign className="text-slate-400 text-xs" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Zahlungseingänge</span>
                                </div>
                            }
                        />
                    </div>
                </div>

                {/* Right Column: Financial Summary Sidebar */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    <div className="bg-[#1B4D4F] rounded-sm p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <FaFileInvoiceDollar size={120} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Abrechnungs-Saldo</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-black tracking-tighter">{financials.grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-xl font-bold opacity-70">€</span>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center bg-black/10 rounded p-3 border border-white/5">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Status</span>
                                <span className={clsx(
                                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight",
                                    financials.open <= 0 ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                                )}>
                                    {financials.open <= 0 ? 'Bezahlt' : 'Zahlung fällig'}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="opacity-60 font-medium">Bereits bezahlt</span>
                                    <span className="font-bold">{financials.paid.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-white/10 mt-2">
                                    <span className="opacity-80 font-bold uppercase tracking-tighter text-[10px]">Noch offen (Brutto)</span>
                                    <span className={clsx("font-black", financials.open > 0 ? "text-amber-300" : "text-emerald-400")}>
                                        {financials.open.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex-1">
                        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-7 h-7 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                                <FaEuroSign className="text-xs" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Abrechnungs-Info</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-500">Netto-Summe (VK)</span>
                                    <span className="text-slate-800">{financials.netTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-500">MwSt. (19%)</span>
                                    <span className="text-slate-800">{financials.taxTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                </div>
                                <div className="h-px bg-slate-100"></div>
                                <div className="flex justify-between text-sm font-black">
                                    <span className="text-slate-900">BRUTTO-GESAMT</span>
                                    <span className="text-[#1B4D4F]">{financials.grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 mt-6">
                                {activeInvoice ? (
                                    <div className="rounded-sm border-2 border-slate-100 bg-white p-4 space-y-4 shadow-sm relative overflow-hidden">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <FaCheckCircle className="text-emerald-500" /> RECHNUNG AKTIV
                                            </span>
                                            <span className={clsx('text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-sm border', {
                                                'bg-slate-50 text-slate-500 border-slate-200': activeInvoice.status === 'draft',
                                                'bg-indigo-50 text-indigo-700 border-indigo-200': activeInvoice.status === 'issued',
                                                'bg-blue-50 text-blue-700 border-blue-200': activeInvoice.status === 'sent',
                                                'bg-emerald-50 text-emerald-700 border-emerald-200': activeInvoice.status === 'paid',
                                                'bg-red-50 text-red-700 border-red-200': activeInvoice.status === 'overdue',
                                            })}>
                                                {{ draft: 'Entwurf', issued: 'Ausgestellt', sent: 'Versendet', paid: 'Bezahlt', overdue: 'Überfällig' }[activeInvoice.status as string] ?? activeInvoice.status}
                                            </span>
                                        </div>
                                        <div className="py-1">
                                            <div className="text-sm font-black text-slate-900 tracking-tight">{activeInvoice.invoice_number}</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-1">
                                                {(activeInvoice.amount_gross / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                                {' · '}
                                                {activeInvoice.due_date ? `Fällig bis ${new Date(activeInvoice.due_date).toLocaleDateString('de-DE')}` : ''}
                                            </div>
                                        </div>
                                        <Button
                                            variant="default"
                                            onClick={onGoToInvoice}
                                            className="w-full py-5 flex items-center justify-center gap-2 font-black uppercase tracking-[0.15em] shadow-lg shadow-brand-primary/10 text-[10px]"
                                        >
                                            <FaArrowRight size={10} className="mb-0.5" /> DETAILS ANSEHEN
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-amber-50 rounded-sm border border-amber-100">
                                            <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tighter">
                                                Noch keine Rechnung erstellt. Sie können die Kalkulation abschließen und dann die Rechnung generieren.
                                            </p>
                                        </div>
                                        <Button
                                            variant="default"
                                            onClick={onCreateInvoice}
                                            className="w-full py-5 flex items-center justify-center gap-2 font-black uppercase tracking-[0.1em] text-[11px]"
                                        >
                                            <FaFileInvoiceDollar /> RECHNUNG ERSTELLEN
                                        </Button>
                                    </div>
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
