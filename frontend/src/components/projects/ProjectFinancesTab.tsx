import { useState, useMemo, useEffect } from 'react';
import { FaInfoCircle, FaPlus, FaMinus, FaSave } from 'react-icons/fa';
import clsx from 'clsx';
import ProjectPositionsTable from '../modals/ProjectPositionsTable';
import ProjectPaymentsTable from '../modals/ProjectPaymentsTable';
import ProjectFinancialSidebar from '../modals/ProjectFinancialSidebar';
import { type ProjectPosition } from '../modals/projectTypes';
import { Button } from '../ui/button';

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
                        <div className="px-6 py-6">
                            <div className="grid grid-cols-1 gap-8 pb-6 border-b border-slate-100">
                                {[
                                    { term: 'Beglaubigung', label: 'Beglaubigung', enabled: !!certSvc, price: parseFloat(certSvc?.customerRate || '5.00'), tip: 'Beglaubigte Übersetzung mit Stempel und Unterschrift.' },
                                    { term: 'Express', label: 'Express', enabled: !!expSvc, price: parseFloat(expSvc?.customerRate || '15.00'), tip: 'Eilzuschlag für schnelle Bearbeitung.' },
                                    { term: 'Apostille', label: 'Apostille', enabled: !!aposSvc, price: parseFloat(aposSvc?.customerRate || '25.00'), tip: 'Apostille-Beglaubigung für internationalen Gebrauch.' },
                                    { term: 'FS-Klassifizierung', label: 'FS-Klassifizierung', enabled: !!fsSvc, price: parseFloat(fsSvc?.customerRate || '15.00'), tip: 'Führerschein-Klassifizierung.' },
                                ].map(opt => (
                                    <div key={opt.term} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                                                {opt.label} Anzeigen
                                                <FaInfoCircle className="text-slate-200 text-[10px]" title={opt.tip} />
                                            </label>
                                            <div
                                                className={clsx(
                                                    'h-10 flex items-center gap-2.5',
                                                    isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group/toggle'
                                                )}
                                                onClick={() => !isLocked && handleToggleService(opt.term, opt.term, opt.price)}
                                            >
                                                <div className={clsx(
                                                    'w-10 h-5 rounded-full relative transition-all duration-300',
                                                    opt.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                                                )}>
                                                    <div className={clsx(
                                                        'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm',
                                                        opt.enabled ? 'left-5.5' : 'left-0.5'
                                                    )} />
                                                </div>
                                                <span className={clsx(
                                                    'text-[10px] font-bold tracking-widest transition-colors',
                                                    opt.enabled ? 'text-emerald-600' : 'text-slate-400'
                                                )}>
                                                    {opt.enabled ? 'AKTIV' : 'INAKTIV'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={clsx("space-y-2", !opt.enabled && "opacity-30 pointer-events-none")}>
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Preis</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    disabled={isLocked || !opt.enabled}
                                                    value={opt.price}
                                                    onChange={(e) => {
                                                        const newPrice = parseFloat(e.target.value) || 0;
                                                        setPositions(prev => prev.map(p => p.description.includes(opt.term) ? { ...p, customerRate: newPrice.toFixed(2) } : p));
                                                    }}
                                                    className="w-full h-10 px-4 text-sm font-bold text-slate-700 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition-all bg-white pr-8 shadow-sm"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-300">€</span>
                                            </div>
                                        </div>

                                        <div className={clsx("space-y-2", !opt.enabled && "opacity-30 pointer-events-none")}>
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Anzahl</label>
                                            <div className="flex items-center h-10 border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
                                                <button
                                                    disabled={isLocked || !opt.enabled}
                                                    onClick={() => {
                                                        const current = parseInt(positions.find(p => p.description.includes(opt.term))?.quantity || '1');
                                                        const newQty = Math.max(1, current - 1).toString();
                                                        setPositions(prev => prev.map(p => p.description.includes(opt.term) ? { ...p, quantity: newQty } : p));
                                                    }}
                                                    className="h-full px-4 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-r border-slate-100 disabled:cursor-not-allowed"
                                                >
                                                    <FaMinus className="text-xs" />
                                                </button>
                                                <input
                                                    type="number"
                                                    disabled={isLocked || !opt.enabled}
                                                    value={parseInt(positions.find(p => p.description.includes(opt.term))?.quantity || '1')}
                                                    onChange={(e) => {
                                                        const newQty = Math.max(1, parseInt(e.target.value) || 1).toString();
                                                        setPositions(prev => prev.map(p => p.description.includes(opt.term) ? { ...p, quantity: newQty } : p));
                                                    }}
                                                    className="flex-1 w-full h-full text-center text-sm font-bold text-slate-700 outline-none bg-transparent"
                                                />
                                                <button
                                                    disabled={isLocked || !opt.enabled}
                                                    onClick={() => {
                                                        const current = parseInt(positions.find(p => p.description.includes(opt.term))?.quantity || '1');
                                                        const newQty = (current + 1).toString();
                                                        setPositions(prev => prev.map(p => p.description.includes(opt.term) ? { ...p, quantity: newQty } : p));
                                                    }}
                                                    className="h-full px-4 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-l border-slate-100 disabled:cursor-not-allowed"
                                                >
                                                    <FaPlus className="text-xs" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className={clsx("space-y-2", !opt.enabled && "opacity-30")}>
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Gesamt (Netto)</label>
                                            <div className="h-10 flex items-center px-4 bg-slate-50 border border-slate-100 rounded-md text-sm font-bold text-slate-500">
                                                {(opt.price * parseInt(positions.find(p => p.description.includes(opt.term))?.quantity || (opt.enabled ? '1' : '0'))).toFixed(2)} €
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Anzahl Kopien</label>
                                    <div className={clsx(
                                        "flex items-center h-10 border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm ring-1 ring-slate-100/50",
                                        isLocked && "opacity-60"
                                    )}>
                                        <button disabled={isLocked} onClick={() => setCopyData(d => ({ ...d, count: Math.max(0, d.count - 1) }))} className="h-full px-4 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-r border-slate-100 disabled:cursor-not-allowed"><FaMinus className="text-xs" /></button>
                                        <input type="number" value={copyData.count} readOnly={isLocked} onChange={(e) => !isLocked && setCopyData(d => ({ ...d, count: Math.max(0, parseInt(e.target.value) || 0) }))} className="flex-1 w-full h-full text-center text-sm font-bold text-slate-700 outline-none bg-transparent read-only:cursor-not-allowed" />
                                        <button disabled={isLocked} onClick={() => setCopyData(d => ({ ...d, count: d.count + 1 }))} className="h-full px-4 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-l border-slate-100 disabled:cursor-not-allowed"><FaPlus className="text-xs" /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Preis pro Kopie</label>
                                    <div className="relative">
                                        <input type="number" step="0.01" value={copyData.price} readOnly={isLocked} onChange={(e) => !isLocked && setCopyData(d => ({ ...d, price: parseFloat(e.target.value) || 0 }))} className={clsx("w-full h-10 px-4 text-sm font-bold text-slate-700 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition-all bg-white pr-8 shadow-sm", isLocked && "opacity-60 cursor-not-allowed")} />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-300">€</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 07: Marge (nur wenn Rechnung vorhanden) */}
                    {isLocked && (
                        <section id="section-marge" className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className={clsx(SECTION_HEADER, 'px-6 pt-5 bg-white')}>
                                <h3 className={SECTION_TITLE}>Projektmarge</h3>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 rounded-md border border-slate-100 p-3 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Netto (Kunde)</p>
                                        <p className="text-sm font-bold text-slate-800">{financials.netTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-md border border-slate-100 p-3 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner-Kosten</p>
                                        <p className="text-sm font-bold text-rose-600">{financials.partnerTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-md border border-slate-100 p-3 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marge (€)</p>
                                        <p className={clsx("text-sm font-bold", financials.margin >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                            {financials.margin.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 rounded-md border border-slate-100 p-3 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marge (%)</p>
                                        <p className={clsx("text-sm font-bold", financials.marginPercent >= 20 ? "text-emerald-600" : financials.marginPercent >= 0 ? "text-amber-600" : "text-rose-600")}>
                                            {financials.marginPercent.toFixed(1)} %
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={clsx(
                                            'h-full transition-all duration-700',
                                            financials.marginPercent > 40 ? 'bg-emerald-500' : financials.marginPercent > 20 ? 'bg-slate-500' : 'bg-amber-400'
                                        )}
                                        style={{ width: `${Math.min(100, Math.max(0, financials.marginPercent))}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400">
                                    Rechnung <span className="font-semibold text-slate-600">{activeInvoice?.invoice_number}</span> – Positionen und Leistungen sind gesperrt.
                                </p>
                            </div>
                        </section>
                    )}

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
                />
            </div>
        </div>
    );
};

export default ProjectFinancesTab;



