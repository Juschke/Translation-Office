import { useState, useMemo, useEffect } from 'react';
import { FaInfoCircle, FaCalculator, FaPlus, FaMinus } from 'react-icons/fa';
import clsx from 'clsx';
import ProjectPositionsTable from '../modals/ProjectPositionsTable';
import type { ExtraServiceRow } from '../modals/ProjectPositionsTable';
import ProjectPaymentsTable from '../modals/ProjectPaymentsTable';
import ProjectFinancialSidebar from '../modals/ProjectFinancialSidebar';
import type { ProjectPosition } from '../modals/projectTypes';

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
    const [positions, setPositions] = useState<ProjectPosition[]>(() => {
        if (projectData.positions && Array.isArray(projectData.positions)) {
            return projectData.positions.map((p: any) => ({
                id: p.id.toString(),
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
            }));
        }
        return [];
    });

    const [extras, setExtras] = useState({
        isCertified: projectData.isCertified || !!projectData.is_certified,
        certifiedQty: projectData.certified_count || 1,
        hasApostille: projectData.hasApostille || !!projectData.has_apostille,
        apostilleQty: projectData.apostille_count || 1,
        isExpress: projectData.isExpress || !!projectData.is_express,
        expressQty: projectData.express_count || 1,
        classification: projectData.classification === 'ja' || projectData.classification === true,
        classificationQty: projectData.classification_count || 1,
        copies: projectData.copies || projectData.copies_count || 0,
        copyPrice: parseFloat(projectData.copyPrice || '5'),
        // Dynamic prices for other extras
        certifiedPrice: parseFloat(projectData.certifiedPrice || '5'),
        apostillePrice: parseFloat(projectData.apostillePrice || '15'),
        expressPrice: parseFloat(projectData.expressPrice || '15'),
        classificationPrice: parseFloat(projectData.classificationPrice || '15'),
        // Dynamic units
        certifiedUnit: projectData.certifiedUnit || 'Stk',
        apostilleUnit: projectData.apostilleUnit || 'Stk',
        expressUnit: projectData.expressUnit || 'Stk',
        classificationUnit: projectData.classificationUnit || 'Stk',
        copiesUnit: projectData.copiesUnit || 'Stk',
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
            let cRate = 0;

            if (pos.customerMode === 'unit') {
                const margin = (parseFloat(pos.marginPercent) || 0) / 100;
                cTotal = pTotal * (pos.marginType === 'markup' ? (1 + margin) : (1 - margin));
                if (qty > 0) cRate = cTotal / qty;
            } else if (pos.customerMode === 'rate') {
                cRate = parseFloat(pos.customerRate) || 0;
                cTotal = qty * cRate;
            } else {
                cTotal = parseFloat(pos.customerRate) || 0;
            }

            return {
                ...pos,
                partnerTotal: pTotal.toFixed(2),
                customerTotal: cTotal.toFixed(2),
                customerRate: pos.customerMode === 'unit' ? cRate.toFixed(2) : pos.customerRate,
            };
        });

        const isContentChanged = JSON.stringify(updatedPositions) !== JSON.stringify(positions);
        if (isContentChanged) {
            setPositions(updatedPositions);
        }
    }, [positions, isLocked]);

    const financials = useMemo(() => {
        const payments = projectData.payments || [];
        const extraNet =
            (extras.isCertified ? extras.certifiedPrice * extras.certifiedQty : 0) +
            (extras.hasApostille ? extras.apostillePrice * extras.apostilleQty : 0) +
            (extras.isExpress ? extras.expressPrice * extras.expressQty : 0) +
            (extras.classification ? extras.classificationPrice * extras.classificationQty : 0) +
            (extras.copies * extras.copyPrice);

        const positionsNet = positions.reduce((sum: number, pos: any) => sum + (parseFloat(pos.customerTotal) || 0), 0);
        const partnerTotal = positions.reduce((sum: number, pos: any) => sum + (parseFloat(pos.partnerTotal) || 0), 0);

        const netTotal = positionsNet + extraNet;
        const taxTotal = netTotal * 0.19;
        const grossTotal = netTotal + taxTotal;

        const margin = netTotal - partnerTotal;
        const marginPercent = netTotal > 0 ? (margin / netTotal) * 100 : 0;
        const paid = payments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
        const open = grossTotal - paid;

        return {
            netTotal,
            taxTotal,
            grossTotal,
            partnerTotal,
            margin,
            marginPercent,
            paid,
            open,
            extraTotal: extraNet,
            baseNet: positionsNet,
        };
    }, [positions, extras, projectData]);

    const extraRows = useMemo((): ExtraServiceRow[] => {
        const rows: ExtraServiceRow[] = [];
        if (extras.isCertified) rows.push({ key: 'isCertified', description: 'Beglaubigung', quantity: extras.certifiedQty, unit: extras.certifiedUnit, unitPrice: extras.certifiedPrice, total: extras.certifiedPrice * extras.certifiedQty });
        if (extras.hasApostille) rows.push({ key: 'hasApostille', description: 'Apostille', quantity: extras.apostilleQty, unit: extras.apostilleUnit, unitPrice: extras.apostillePrice, total: extras.apostillePrice * extras.apostilleQty });
        if (extras.isExpress) rows.push({ key: 'isExpress', description: 'Express-Zuschlag', quantity: extras.expressQty, unit: extras.expressUnit, unitPrice: extras.expressPrice, total: extras.expressPrice * extras.expressQty });
        if (extras.classification) rows.push({ key: 'classification', description: 'FS-Klassifizierung', quantity: extras.classificationQty, unit: extras.classificationUnit, unitPrice: extras.classificationPrice, total: extras.classificationPrice * extras.classificationQty });
        if (extras.copies > 0) rows.push({ key: 'copies', description: 'Zusatzkopien', quantity: extras.copies, unit: extras.copiesUnit, unitPrice: extras.copyPrice, total: extras.copies * extras.copyPrice });
        return rows;
    }, [extras]);

    const handleToggleExtra = (key: string) => {
        setExtras(prev => {
            if (key === 'isCertified') return { ...prev, isCertified: false };
            if (key === 'hasApostille') return { ...prev, hasApostille: false };
            if (key === 'isExpress') return { ...prev, isExpress: false };
            if (key === 'classification') return { ...prev, classification: false };
            if (key === 'copies') return { ...prev, copies: 0 };
            return prev;
        });
    };

    const handleUpdateExtraQty = (key: string, qty: number) => {
        setExtras(prev => {
            if (key === 'isCertified') return { ...prev, certifiedQty: qty };
            if (key === 'hasApostille') return { ...prev, apostilleQty: qty };
            if (key === 'isExpress') return { ...prev, expressQty: qty };
            if (key === 'classification') return { ...prev, classificationQty: qty };
            if (key === 'copies') return { ...prev, copies: qty };
            return prev;
        });
    };

    const handleUpdateExtraPrice = (key: string, price: number) => {
        setExtras(prev => {
            if (key === 'isCertified') return { ...prev, certifiedPrice: price };
            if (key === 'hasApostille') return { ...prev, apostillePrice: price };
            if (key === 'isExpress') return { ...prev, expressPrice: price };
            if (key === 'classification') return { ...prev, classificationPrice: price };
            if (key === 'copies') return { ...prev, copyPrice: price };
            return prev;
        });
    };

    const handleUpdateExtraUnit = (key: string, unit: string) => {
        setExtras(prev => {
            if (key === 'isCertified') return { ...prev, certifiedUnit: unit };
            if (key === 'hasApostille') return { ...prev, apostilleUnit: unit };
            if (key === 'isExpress') return { ...prev, expressUnit: unit };
            if (key === 'classification') return { ...prev, classificationUnit: unit };
            if (key === 'copies') return { ...prev, copiesUnit: unit };
            return prev;
        });
    };

    const handleSave = () => {
        onSavePositions(
            positions.map(p => ({
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
            })),
            {
                is_certified: extras.isCertified,
                certified_count: extras.certifiedQty,
                has_apostille: extras.hasApostille,
                apostille_count: extras.apostilleQty,
                is_express: extras.isExpress,
                express_count: extras.expressQty,
                classification: extras.classification,
                classification_count: extras.classificationQty,
                copies_count: extras.copies,
                // Saving custom prices and units
                certified_price: extras.certifiedPrice,
                apostille_price: extras.apostillePrice,
                express_price: extras.expressPrice,
                classification_price: extras.classificationPrice,
                copy_price: extras.copyPrice,
                certified_unit: extras.certifiedUnit,
                apostille_unit: extras.apostilleUnit,
                express_unit: extras.expressUnit,
                classification_unit: extras.classificationUnit,
                copies_unit: extras.copiesUnit,
            }
        );
    };

    return (
        <div className="flex flex-col gap-6 mb-10 animate-fadeIn h-full">
            <div className="flex flex-col xl:flex-row gap-8 flex-1">
                {/* Left Column: Calculation & Payments */}
                <div className="flex-1 space-y-6 flex flex-col">
                    {/* Positions Table Container */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <FaCalculator className="text-brand-primary text-sm" />
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Positionen</h3>
                                    {isLocked && (
                                        <button 
                                            onClick={() => onPreviewInvoice ? onPreviewInvoice(activeInvoice) : onCreateInvoice?.()}
                                            className="flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-b from-amber-50 to-amber-100 border border-amber-200 rounded text-amber-700 hover:from-amber-100 hover:to-amber-200 transition shadow-sm group/lock"
                                        >
                                            <FaInfoCircle size={10} className="text-amber-500 group-hover/lock:text-amber-600 transition-colors" />
                                            <span className="text-xs font-bold uppercase tracking-tight">Gesperrt</span>
                                            <span className="text-xs font-medium opacity-70">({activeInvoice.invoice_number})</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 flex-1">
                            <ProjectPositionsTable
                                positions={positions}
                                setPositions={setPositions}
                                disabled={isLocked}
                                extraRows={extraRows}
                                onToggleExtra={handleToggleExtra}
                                onUpdateExtraQty={handleUpdateExtraQty}
                                onUpdateExtraPrice={handleUpdateExtraPrice}
                                onUpdateExtraUnit={handleUpdateExtraUnit}
                                onSave={isLocked ? undefined : handleSave}
                                isSaving={isPendingSave}
                            />
                        </div>
                    </div>

                    {/* Leistungen & Optionen in own section */}
                    {!isLocked && (
                        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <FaPlus className="text-brand-primary text-xs" />
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Leistungen & Optionen</h3>
                                </div>
                            </div>
                            <div className="px-6 py-5 bg-slate-50/10">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-slate-100">
                                    {[
                                        { key: 'isCertified', label: 'Beglaubigung (5€)', enabled: extras.isCertified, qty: extras.certifiedQty, tip: 'Beglaubigte Übersetzung mit Stempel und Unterschrift.' },
                                        { key: 'isExpress', label: 'Express (15€)', enabled: extras.isExpress, qty: extras.expressQty, tip: 'Eilzuschlag für schnelle Bearbeitung.' },
                                        { key: 'hasApostille', label: 'Apostille (25€)', enabled: extras.hasApostille, qty: extras.apostilleQty, tip: 'Apostille-Beglaubigung für internationalen Gebrauch.' },
                                        { key: 'classification', label: 'FS-Klassifizierung (15€)', enabled: extras.classification, qty: extras.classificationQty, tip: 'Führerschein-Klassifizierung.' },
                                    ].map(opt => (
                                        <div key={opt.label} className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                                                {opt.label}
                                                <FaInfoCircle className="text-slate-300 text-[10px]" title={opt.tip} />
                                            </label>
                                            <div className="flex flex-col gap-3">
                                                <div 
                                                    className="h-8 flex items-center gap-2.5 cursor-pointer group/toggle" 
                                                    onClick={() => {
                                                        setExtras(prev => {
                                                            const k = opt.key as keyof typeof prev;
                                                            return { ...prev, [k]: !prev[k] };
                                                        });
                                                    }}
                                                >
                                                    <div className={clsx(
                                                        'w-9 h-4.5 rounded-full relative transition-all duration-300 shadow-inner',
                                                        opt.enabled ? 'bg-emerald-500 shadow-emerald-600/20' : 'bg-slate-300'
                                                    )}>
                                                        <div className={clsx(
                                                            'absolute top-0.75 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm',
                                                            opt.enabled ? 'left-5' : 'left-1'
                                                        )} />
                                                    </div>
                                                    <span className={clsx(
                                                        'text-[10px] font-bold tracking-widest transition-colors',
                                                        opt.enabled ? 'text-emerald-600' : 'text-slate-400 group-hover/toggle:text-slate-500'
                                                    )}>
                                                        {opt.enabled ? 'AKTIV' : 'AUS'}
                                                    </span>
                                                </div>
                                                {opt.enabled && (
                                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-200">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Menge:</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={opt.qty}
                                                            onChange={e => handleUpdateExtraQty(opt.key, Math.max(1, parseInt(e.target.value) || 1))}
                                                            className="w-12 h-7 text-center text-xs font-bold text-slate-700 border border-slate-200 rounded-sm outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition-all bg-white"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Copies & Custom Extra Price inputs matching NewProject style */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Anzahl Kopien</label>
                                        <div className="flex items-center h-9 border border-slate-200 rounded-sm overflow-hidden bg-white shadow-sm ring-1 ring-slate-100/50">
                                            <button 
                                                onClick={() => handleUpdateExtraQty('copies', Math.max(0, extras.copies - 1))} 
                                                className="h-full px-3 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-r border-slate-100"
                                            >
                                                <FaMinus className="text-[10px]" />
                                            </button>
                                            <input 
                                                type="number" 
                                                value={extras.copies} 
                                                onChange={e => handleUpdateExtraQty('copies', Math.max(0, parseInt(e.target.value) || 0))} 
                                                className="flex-1 w-full h-full text-center text-xs font-bold text-slate-700 outline-none bg-transparent" 
                                            />
                                            <button 
                                                onClick={() => handleUpdateExtraQty('copies', extras.copies + 1)} 
                                                className="h-full px-3 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-l border-slate-100"
                                            >
                                                <FaPlus className="text-[10px]" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Preis pro Kopie</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                value={extras.copyPrice} 
                                                onChange={e => handleUpdateExtraPrice('copies', parseFloat(e.target.value) || 0)} 
                                                className="w-full h-9 px-3 text-xs font-bold text-slate-700 border border-slate-200 rounded-sm outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary transition-all bg-white pr-8 shadow-sm" 
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">€</span>
                                        </div>
                                    </div>
                                    <div className="flex items-end pb-2">
                                        <div className="bg-slate-100/50 px-3 py-2 rounded-sm border border-slate-200/60 w-full">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Summe Kopien</span>
                                            <span className="text-sm font-bold text-slate-800 tabular-nums">{(extras.copies * extras.copyPrice).toFixed(2)} €</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payments section */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-4 overflow-hidden">
                        <ProjectPaymentsTable
                            payments={projectData.payments || []}
                            onAddPayment={onRecordPayment}
                            onEditPayment={onEditPayment || (() => { })}
                            onDeletePayment={onDeletePayment || (() => { })}
                            disabledAdd={financials.open <= 0.01}
                        />
                    </div>
                </div>

                {/* Right Column: Financial Summary Sidebar */}
                <div className="xl:w-80 flex flex-col gap-6">
                    <ProjectFinancialSidebar
                        creationDate={projectData.createdAt || new Date(projectData.created_at || Date.now()).toLocaleDateString('de-DE')}
                        projectManager={projectData.pm || 'System'}
                        baseNet={financials.baseNet}
                        extraCosts={financials.extraTotal}
                        calcNet={financials.netTotal}
                        calcTax={financials.taxTotal}
                        calcGross={financials.grossTotal}
                        totalPaid={financials.paid}
                        remainingBalance={financials.open}
                        profit={financials.margin}
                        profitMargin={financials.marginPercent}
                        isCertified={extras.isCertified}
                        hasApostille={extras.hasApostille}
                        isExpress={extras.isExpress}
                        classification={extras.classification ? 'ja' : 'nein'}
                        copies={extras.copies}
                        copyPrice={extras.copyPrice.toString()}
                        isLocked={isLocked}
                        onCreateInvoice={onCreateInvoice}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectFinancesTab;
