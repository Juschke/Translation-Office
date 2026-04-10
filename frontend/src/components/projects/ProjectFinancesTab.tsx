import { useState, useMemo, useEffect } from 'react';
import { FaInfoCircle, FaPlus, FaMinus, FaSave, FaQuestionCircle } from 'react-icons/fa';
import clsx from 'clsx';
import ProjectPositionsTable from '../modals/ProjectPositionsTable';
import ProjectPaymentsTable from '../modals/ProjectPaymentsTable';
import ProjectFinancialSidebar from '../modals/ProjectFinancialSidebar';
import { type ProjectPosition } from '../modals/projectTypes';
import { Button } from '../ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

/* ─── Tooltip Helper ─── */
const FieldTip = ({ text }: { text: string }) => (
    <TooltipProvider delayDuration={200}>
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="text-slate-300 hover:text-slate-500 transition cursor-help">
                    <FaQuestionCircle className="text-[11px]" />
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs z-[200]">
                {text}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const SECTION_HEADER = 'flex items-center gap-3 pb-3 mb-1 border-b border-slate-200';
const SECTION_TITLE = 'text-sm font-semibold text-slate-800 tracking-tight';

interface ProjectFinancesTabProps {
    projectData: any;
    onSavePositions: (positions: any[], extras?: Record<string, any>) => void;
    onRecordPayment: () => void;
    onEditPayment?: (payment: any) => void;
    onDeletePayment?: (id: string) => void;
    isPendingSave: boolean;
    onCreateInvoice?: () => void;
    onPreviewInvoice?: (invoice: any) => void;
}

const ProjectFinancesTab = ({
    projectData,
    onSavePositions,
    onRecordPayment,
    onEditPayment,
    onDeletePayment,
    isPendingSave,
    onCreateInvoice,
    onPreviewInvoice,
}: ProjectFinancesTabProps) => {

    // Helper to check if a position list has a specific service
    const findService = (list: ProjectPosition[], term: string) =>
        list.find(p => p.description.toLowerCase().includes(term.toLowerCase()));

    const [positions, setPositions] = useState<ProjectPosition[]>(() => {
        let list: ProjectPosition[] = [];
        if (projectData.positions && Array.isArray(projectData.positions)) {
            list = projectData.positions.map((p: any) => ({
                id: (p.id || Date.now() + Math.random()).toString(),
                description: p.description || '',
                unit: p.unit || 'Normzeile',
                quantity: (p.quantity || p.amount || '1').toString(),
                amount: (p.amount || '1').toString(),
                partnerRate: (p.partnerRate || p.partner_rate || '0').toString(),
                partnerMode: p.partnerMode || p.partner_mode || 'unit',
                partnerTotal: (p.partnerTotal || p.partner_total || '0').toString(),
                customerRate: (p.customerRate || p.customer_rate || '0').toString(),
                customerMode: p.customerMode || p.customer_mode || 'unit',
                customerTotal: (p.customerTotal || p.customer_total || '0').toString(),
                marginType: p.marginType || p.margin_type || 'markup',
                marginPercent: (p.marginPercent || p.margin_percent || '0').toString(),
                taxRate: (p.taxRate || p.tax_rate || '19').toString(),
                discountPercent: (p.discountPercent || p.discount_percent || '0').toString(),
                discountMode: p.discountMode || p.discount_mode || 'percent',
            }));
        }

        // Migration Check: If legacy flags are true but not in list, add them
        const isCert = projectData.isCertified || !!projectData.is_certified;
        const hasApos = projectData.hasApostille || !!projectData.has_apostille;
        const isExp = projectData.isExpress || !!projectData.is_express;
        const isFS = projectData.classification === 'ja' || projectData.classification === true;

        if (isCert && !findService(list, 'Beglaubigung')) {
            list.push({
                id: 'cert-' + Date.now(), description: 'Beglaubigung', unit: projectData.certifiedUnit || 'Stk', quantity: (projectData.certified_count || 1).toString(), amount: '1',
                customerRate: (projectData.certifiedPrice || '5.00').toString(), customerTotal: (projectData.certifiedPrice || '5.00').toString(),
                partnerRate: '0.00', partnerMode: 'unit', partnerTotal: '0.00', customerMode: 'rate', marginType: 'markup', marginPercent: '0.00', taxRate: '19', discountPercent: '0', discountMode: 'percent'
            });
        }
        if (hasApos && !findService(list, 'Apostille')) {
            list.push({
                id: 'apos-' + Date.now(), description: 'Apostille', unit: projectData.apostilleUnit || 'Stk', quantity: (projectData.apostille_count || 1).toString(), amount: '1',
                customerRate: (projectData.apostillePrice || '25.00').toString(), customerTotal: (projectData.apostillePrice || '25.00').toString(),
                partnerRate: '0.00', partnerMode: 'unit', partnerTotal: '0.00', customerMode: 'rate', marginType: 'markup', marginPercent: '0.00', taxRate: '19', discountPercent: '0', discountMode: 'percent'
            });
        }
        if (isExp && !findService(list, 'Express')) {
            list.push({
                id: 'exp-' + Date.now(), description: 'Express-Zuschlag', unit: projectData.expressUnit || 'Stk', quantity: (projectData.express_count || 1).toString(), amount: '1',
                customerRate: (projectData.expressPrice || '15.00').toString(), customerTotal: (projectData.expressPrice || '15.00').toString(),
                partnerRate: '0.00', partnerMode: 'unit', partnerTotal: '0.00', customerMode: 'rate', marginType: 'markup', marginPercent: '0.00', taxRate: '19', discountPercent: '0', discountMode: 'percent'
            });
        }
        if (isFS && !findService(list, 'FS-Klassifizierung')) {
            list.push({
                id: 'fs-' + Date.now(), description: 'FS-Klassifizierung', unit: projectData.classificationUnit || 'Stk', quantity: (projectData.classification_count || 1).toString(), amount: '1',
                customerRate: (projectData.classificationPrice || '15.00').toString(), customerTotal: (projectData.classificationPrice || '15.00').toString(),
                partnerRate: '0.00', partnerMode: 'unit', partnerTotal: '0.00', customerMode: 'rate', marginType: 'markup', marginPercent: '0.00', taxRate: '19', discountPercent: '0', discountMode: 'percent'
            });
        }

        return list;
    });

    const [copyData, setCopyData] = useState({
        count: projectData.copies || projectData.copies_count || 0,
        price: parseFloat(projectData.copyPrice || '5')
    });

    const activeInvoice = projectData.invoices?.find((inv: any) => !['cancelled'].includes(inv.status));
    const isLocked = !!activeInvoice;

    // Calculation Logic
    useEffect(() => {
        if (isLocked) return;

        const updatedPositions = positions.map(pos => {
            const qty = parseFloat(pos.quantity) || 0;
            const pRate = parseFloat(pos.partnerRate) || 0;
            const pTotal = pos.partnerMode === 'unit' ? qty * pRate : pRate;

            let cTotal = 0;
            let cRate = (parseFloat(pos.customerRate) || 0);

            if (pos.customerMode === 'unit') {
                const margin = (parseFloat(pos.marginPercent) || 0) / 100;
                cTotal = pTotal * (pos.marginType === 'markup' ? (1 + margin) : (1 - margin));
                if (qty > 0) cRate = cTotal / qty;
            } else {
                cTotal = qty * cRate;
            }

            // Apply Discount
            const dVal = parseFloat(pos.discountPercent) || 0;
            if (pos.discountMode === 'fixed') {
                cTotal -= dVal;
            } else {
                cTotal = cTotal * (1 - dVal / 100);
            }

            return {
                ...pos,
                partnerTotal: pTotal.toFixed(2),
                customerRate: cRate.toFixed(2),
                customerTotal: cTotal.toFixed(2)
            };
        });

        if (JSON.stringify(updatedPositions) !== JSON.stringify(positions)) {
            setPositions(updatedPositions);
        }
    }, [positions, isLocked]);

    const financials = useMemo(() => {
        const extraNet = copyData.count * copyData.price;
        const positionsNet = positions.reduce((sum, p) => sum + (parseFloat(p.customerTotal) || 0), 0);
        const netTotal = positionsNet + extraNet;

        const taxTotal = positions.reduce((sum, p) => {
            const net = parseFloat(p.customerTotal) || 0;
            const rate = (parseFloat(p.taxRate) || 0) / 100;
            return sum + (net * rate);
        }, 0) + (extraNet * 0.19);

        const grossTotal = netTotal + taxTotal;
        const partnerTotal = positions.reduce((sum, p) => sum + (parseFloat(p.partnerTotal) || 0), 0);
        const marginTotal = netTotal - partnerTotal;
        const paid = (projectData.payments || []).reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

        return {
            baseNet: positionsNet,
            extraTotal: extraNet,
            netTotal,
            taxTotal,
            grossTotal,
            paid,
            open: grossTotal - paid,
            partnerTotal,
            margin: marginTotal,
            marginPercent: netTotal > 0 ? (marginTotal / netTotal) * 100 : 0
        };
    }, [positions, copyData, projectData.payments]);

    const handleSave = () => {
        const isCert = !!findService(positions, 'Beglaubigung');
        const isApos = !!findService(positions, 'Apostille');
        const isExp = !!findService(positions, 'Express');
        const isFS = !!findService(positions, 'FS-Klassifizierung');

        onSavePositions(
            positions.map(p => ({
                id: p.id,
                description: p.description,
                unit: p.unit,
                amount: parseFloat(p.quantity) || 1,
                quantity: parseFloat(p.quantity) || 1,
                partner_rate: p.partnerRate,
                partner_mode: p.partnerMode,
                partner_total: p.partnerTotal,
                customer_rate: p.customerRate,
                customer_mode: p.customerMode,
                customer_total: p.customerTotal,
                margin_type: p.marginType,
                margin_percent: p.marginPercent,
                tax_rate: p.taxRate,
                discount_percent: p.discountPercent,
                discount_mode: p.discountMode || 'percent'
            })),
            {
                is_certified: isCert,
                has_apostille: isApos,
                is_express: isExp,
                classification: isFS,
                copies_count: copyData.count,
                copy_price: copyData.price
            }
        );
    };

    const handleToggleService = (term: string, label: string, price: number) => {
        if (isLocked) return;
        const existing = findService(positions, term);
        if (existing) {
            setPositions(positions.filter(p => p.id !== existing.id));
        } else {
            setPositions([...positions, {
                id: Date.now().toString(),
                description: label,
                unit: 'Stk',
                quantity: '1.00',
                amount: '1',
                customerRate: price.toFixed(2),
                customerTotal: price.toFixed(2),
                partnerRate: '0.00', partnerMode: 'unit', partnerTotal: '0.00', customerMode: 'rate', marginType: 'markup', marginPercent: '0.00', taxRate: '19', discountPercent: '0', discountMode: 'percent'
            }]);
        }
    };

    // Flags for the Grid
    const certSvc = findService(positions, 'Beglaubigung');
    const aposSvc = findService(positions, 'Apostille');
    const expSvc = findService(positions, 'Express');
    const fsSvc = findService(positions, 'FS-Klassifizierung');

    return (
        <div className="flex flex-col gap-6 mb-10 animate-fadeIn h-full">
            <div className="flex flex-col xl:flex-row gap-8 flex-1">
                <div className="flex-1 space-y-12 flex flex-col">

                    {/* Section 05: Positionen */}
                    <section id="section-kalkulation" className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5 bg-white justify-between')}>
                            <div className="flex items-center gap-3">
                                <h3 className={SECTION_TITLE}>Positionen</h3>
                                {isLocked && (
                                    <button
                                        onClick={() => onPreviewInvoice ? onPreviewInvoice(activeInvoice) : onCreateInvoice?.()}
                                        className="flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-b from-amber-50 to-amber-100 border border-amber-200 rounded text-amber-700 hover:from-amber-100 hover:to-amber-200 transition shadow-sm group/lock ml-2"
                                    >
                                        <FaInfoCircle size={10} className="text-amber-500 group-hover/lock:text-amber-600 transition-colors" />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">Gesperrt</span>
                                        <span className="text-[10px] font-medium opacity-70">({activeInvoice.invoice_number})</span>
                                    </button>
                                )}
                            </div>

                            {!isLocked && (
                                <Button
                                    onClick={handleSave}
                                    disabled={isPendingSave}
                                    className="h-8 px-4 text-xs font-bold gap-2"
                                    variant="default"
                                >
                                    <FaSave className="text-[10px]" />
                                    {isPendingSave ? 'Speichern...' : 'Positionsänderungen speichern'}
                                </Button>
                            )}
                        </div>

                        <div className="p-4 flex-1">
                            <ProjectPositionsTable
                                positions={positions}
                                setPositions={setPositions}
                                disabled={isLocked}
                            />
                        </div>
                    </section>

                    {/* Section 06: Leistungen & Optionen */}
                    <section id="section-leistungen" className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5 bg-white justify-between')}>
                            <div className="flex items-center gap-3">
                                <h3 className={SECTION_TITLE}>Leistungen & Optionen</h3>
                                {isLocked && (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 uppercase tracking-tight">
                                        Schreibgeschützt
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-6 border-b border-slate-100">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { term: 'Beglaubigung', label: 'Beglaubigung', enabled: !!certSvc, price: parseFloat(certSvc?.customerRate || '5.00'), tip: 'Beglaubigte Übersetzung mit Stempel und Unterschrift.' },
                                    { term: 'Express', label: 'Express', enabled: !!expSvc, price: parseFloat(expSvc?.customerRate || '15.00'), tip: 'Eilzuschlag für schnelle Bearbeitung.' },
                                    { term: 'Apostille', label: 'Apostille', enabled: !!aposSvc, price: parseFloat(aposSvc?.customerRate || '25.00'), tip: 'Apostille-Beglaubigung für internationalen Gebrauch.' },
                                    { term: 'FS-Klassifizierung', label: 'Führerschein', enabled: !!fsSvc, price: parseFloat(fsSvc?.customerRate || '15.00'), tip: 'Führerschein-Klassifizierung.' },
                                ].map(opt => (
                                    <div key={opt.term} className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                                            {opt.label} <FieldTip text={opt.tip} />
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <div
                                                className={clsx(
                                                    'h-9 flex items-center gap-2',
                                                    isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'
                                                )}
                                                onClick={() => !isLocked && handleToggleService(opt.term, opt.term, opt.price)}
                                            >
                                                <div className={clsx(
                                                    'w-8 h-4 rounded-full relative transition-all duration-300',
                                                    opt.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                                                )}>
                                                    <div className={clsx(
                                                        'absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm',
                                                        opt.enabled ? 'left-4.5' : 'left-0.5'
                                                    )} />
                                                </div>
                                                <span className={clsx(
                                                    'text-[10px] font-bold',
                                                    opt.enabled ? 'text-emerald-600' : 'text-slate-400'
                                                )}>
                                                    {opt.enabled ? 'JA' : 'NEIN'}
                                                </span>
                                            </div>

                                            {opt.enabled && (
                                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <div className="flex gap-2 pt-3">
                                                        <div className="flex-1 relative">
                                                            <label className="absolute -top-1.5 left-1.5 px-1 bg-white text-[8px] font-bold text-slate-400 uppercase tracking-tight z-10 rounded-sm">Menge</label>
                                                            <div className="flex items-center h-8 border border-slate-200 rounded overflow-hidden bg-white shadow-xs focus-within:border-brand-primary/50 transition-colors">
                                                                <button 
                                                                    disabled={isLocked}
                                                                    onClick={() => {
                                                                        const current = parseInt(positions.find(p => p.description.includes(opt.term))?.quantity || '1');
                                                                        const newQty = Math.max(1, current - 1).toString();
                                                                        setPositions(prev => prev.map(p => p.description.includes(opt.term) ? { ...p, quantity: newQty } : p));
                                                                    }}
                                                                    className="px-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-r border-slate-100 h-full"
                                                                >
                                                                    <FaMinus className="text-[8px]" />
                                                                </button>
                                                                <input 
                                                                    type="text"
                                                                    readOnly={isLocked}
                                                                    value={parseInt(positions.find(p => p.description.includes(opt.term))?.quantity || '1')}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 1;
                                                                        setPositions(prev => prev.map(p => p.description.includes(opt.term) ? { ...p, quantity: val.toString() } : p));
                                                                    }}
                                                                    className="w-full text-center text-[10px] font-bold text-slate-700 outline-none bg-transparent"
                                                                />
                                                                <button 
                                                                    disabled={isLocked}
                                                                    onClick={() => {
                                                                        const current = parseInt(positions.find(p => p.description.includes(opt.term))?.quantity || '1');
                                                                        const newQty = (current + 1).toString();
                                                                        setPositions(prev => prev.map(p => p.description.includes(opt.term) ? { ...p, quantity: newQty } : p));
                                                                    }}
                                                                    className="px-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-l border-slate-100 h-full"
                                                                >
                                                                    <FaPlus className="text-[8px]" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <label className="absolute -top-1.5 left-1.5 px-1 bg-white text-[8px] font-bold text-slate-400 uppercase tracking-tight z-10 rounded-sm">Preis</label>
                                                            <div className="relative">
                                                                <input 
                                                                    type="text"
                                                                    readOnly={isLocked}
                                                                    value={opt.price}
                                                                    onChange={(e) => {
                                                                        const pVal = parseFloat(e.target.value) || 0;
                                                                        setPositions(prev => prev.map(p => p.description.includes(opt.term) ? { ...p, customerRate: pVal.toFixed(2) } : p));
                                                                    }}
                                                                    className="w-full h-8 px-2 pr-5 text-[10px] font-bold text-slate-700 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-brand-primary/30 shadow-xs"
                                                                />
                                                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300">€</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 px-1 flex justify-between items-center text-[9px] font-bold uppercase tracking-tight">
                                                        <span className="text-slate-300">Summe:</span>
                                                        <span className="text-slate-900">
                                                            {(opt.price * parseInt(positions.find(p => p.description.includes(opt.term))?.quantity || '1')).toFixed(2)} €
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Kopien Item */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                                        Kopien <FieldTip text="Anzahl der zusätzlich benötigten Papierkopien." />
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <div
                                            className={clsx(
                                                'h-9 flex items-center gap-2',
                                                isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'
                                            )}
                                            onClick={() => !isLocked && setCopyData(d => ({ ...d, count: d.count > 0 ? 0 : 1 }))}
                                        >
                                            <div className={clsx(
                                                'w-8 h-4 rounded-full relative transition-all duration-300',
                                                copyData.count > 0 ? 'bg-emerald-500' : 'bg-slate-300'
                                            )}>
                                                <div className={clsx(
                                                    'absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm',
                                                    copyData.count > 0 ? 'left-4.5' : 'left-0.5'
                                                )} />
                                            </div>
                                            <span className={clsx(
                                                'text-[10px] font-bold',
                                                copyData.count > 0 ? 'text-emerald-600' : 'text-slate-400'
                                            )}>
                                                {copyData.count > 0 ? 'JA' : 'NEIN'}
                                            </span>
                                        </div>

                                        {copyData.count > 0 && (
                                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="flex gap-2 pt-3">
                                                    <div className="flex-1 relative">
                                                        <label className="absolute -top-1.5 left-1.5 px-1 bg-white text-[8px] font-bold text-slate-400 uppercase tracking-tight z-10 rounded-sm">Menge</label>
                                                        <div className="flex items-center h-8 border border-slate-200 rounded overflow-hidden bg-white shadow-xs focus-within:border-brand-primary/50 transition-colors">
                                                            <button 
                                                                disabled={isLocked}
                                                                onClick={() => setCopyData(d => ({ ...d, count: Math.max(1, d.count - 1) }))}
                                                                className="px-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-r border-slate-100 h-full"
                                                            >
                                                                <FaMinus className="text-[8px]" />
                                                            </button>
                                                            <input 
                                                                type="text"
                                                                readOnly={isLocked}
                                                                value={copyData.count}
                                                                onChange={(e) => !isLocked && setCopyData(d => ({ ...d, count: Math.max(1, parseInt(e.target.value) || 1) }))}
                                                                className="w-full text-center text-[10px] font-bold text-slate-700 outline-none bg-transparent"
                                                            />
                                                            <button 
                                                                disabled={isLocked}
                                                                onClick={() => setCopyData(d => ({ ...d, count: d.count + 1 }))}
                                                                className="px-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-l border-slate-100 h-full"
                                                            >
                                                                <FaPlus className="text-[8px]" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 relative">
                                                        <label className="absolute -top-1.5 left-1.5 px-1 bg-white text-[8px] font-bold text-slate-400 uppercase tracking-tight z-10 rounded-sm">Preis</label>
                                                        <div className="relative">
                                                            <input 
                                                                type="text"
                                                                readOnly={isLocked}
                                                                value={copyData.price}
                                                                onChange={(e) => !isLocked && setCopyData(d => ({ ...d, price: parseFloat(e.target.value) || 0 }))}
                                                                className="w-full h-8 px-2 pr-5 text-[10px] font-bold text-slate-700 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-brand-primary/30 shadow-xs"
                                                            />
                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300">€</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 px-1 flex justify-between items-center text-[9px] font-bold uppercase tracking-tight">
                                                    <span className="text-slate-300">Summe:</span>
                                                    <span className="text-slate-900">
                                                        {(copyData.count * copyData.price).toFixed(2)} €
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>


                    {/* Section 09: Anzahlungen */}
                    <section id="section-zahlungen" className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5 flex justify-between items-center bg-white')}>
                            <div className="flex items-center gap-3">
                                <h3 className={SECTION_TITLE}>Anzahlungen</h3>
                            </div>
                            <Button
                                onClick={onRecordPayment}
                                disabled={financials.open <= 0.01}
                                className={clsx(
                                    "h-8 px-4 text-xs font-bold shadow-sm",
                                    financials.open <= 0.01 ? "opacity-50" : ""
                                )}
                            >
                                <FaPlus className="mr-1.5" />
                                {financials.open <= 0.01 ? 'Vollständig bezahlt' : 'Zahlung erfassen'}
                            </Button>
                        </div>
                        <div className="px-6 pb-6 pt-2">
                            <ProjectPaymentsTable
                                payments={projectData.payments || []}
                                onAddPayment={onRecordPayment}
                                onEditPayment={onEditPayment || (() => { })}
                                onDeletePayment={onDeletePayment || (() => { })}
                                disabledAdd={financials.open <= 0.01}
                                hideHeader
                            />
                        </div>
                    </section>
                </div>

                {/* Right Column: Financial Sidebar */}
                <ProjectFinancialSidebar
                    creationDate={projectData.createdAt || new Date(projectData.created_at || Date.now()).toLocaleDateString('de-DE')}
                    projectManager={projectData.pm || 'System'}
                    baseNet={financials.baseNet}
                    calcNet={financials.netTotal}
                    calcTax={financials.taxTotal}
                    calcGross={financials.grossTotal}
                    totalPaid={financials.paid}
                    remainingBalance={financials.open}
                    profit={financials.margin}
                    profitMargin={financials.marginPercent}
                    isCertified={!!certSvc}
                    certifiedQty={parseFloat(certSvc?.quantity || '1')}
                    hasApostille={!!aposSvc}
                    apostilleQty={parseFloat(aposSvc?.quantity || '1')}
                    isExpress={!!expSvc}
                    expressQty={parseFloat(expSvc?.quantity || '1')}
                    classification={!!fsSvc ? 'ja' : 'nein'}
                    classificationQty={parseFloat(fsSvc?.quantity || '1')}
                    copies={copyData.count}
                    copyPrice={copyData.price.toString()}
                    isLocked={isLocked}
                    onCreateInvoice={onCreateInvoice}
                    onPreviewInvoice={() => onPreviewInvoice?.(activeInvoice)}
                />
            </div>
        </div>
    );
};

export default ProjectFinancesTab;



