import { useState, useMemo, useEffect } from 'react';
import { FaCheckCircle, FaFileInvoiceDollar, FaInfoCircle, FaCalculator, FaEuroSign, FaArrowRight } from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';
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
    onCreateInvoice: () => void;
    onGoToInvoice: () => void;
    isPendingSave: boolean;
}

const ProjectFinancesTab = ({
    projectData,
    onSavePositions,
    onRecordPayment,
    onEditPayment,
    onDeletePayment,
    onCreateInvoice,
    onGoToInvoice,
    isPendingSave,
}: ProjectFinancesTabProps) => {
    const [positions, setPositions] = useState<ProjectPosition[]>(() => {
        if (projectData.positions && Array.isArray(projectData.positions)) {
            return projectData.positions.map((p: any) => ({
                id: p.id.toString(),
                description: p.description || '',
                unit: p.unit || 'Normzeile',
                quantity: (p.quantity || p.amount || '1').toString(),
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
        copyPrice: parseFloat(projectData.copyPrice || projectData.copy_price || '5'),
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
            (extras.isCertified ? 5 * extras.certifiedQty : 0) +
            (extras.hasApostille ? 15 * extras.apostilleQty : 0) +
            (extras.isExpress ? 15 * extras.expressQty : 0) +
            (extras.classification ? 15 * extras.classificationQty : 0) +
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

    // Build extra rows for the positions table
    const extraRows = useMemo((): ExtraServiceRow[] => {
        const rows: ExtraServiceRow[] = [];
        if (extras.isCertified)    rows.push({ key: 'isCertified',    description: 'Beglaubigung',       quantity: extras.certifiedQty,      unit: 'Stk', unitPrice: 5,               total: 5 * extras.certifiedQty });
        if (extras.hasApostille)   rows.push({ key: 'hasApostille',   description: 'Apostille',           quantity: extras.apostilleQty,      unit: 'Stk', unitPrice: 15,              total: 15 * extras.apostilleQty });
        if (extras.isExpress)      rows.push({ key: 'isExpress',      description: 'Express-Zuschlag',   quantity: extras.expressQty,        unit: 'Stk', unitPrice: 15,              total: 15 * extras.expressQty });
        if (extras.classification) rows.push({ key: 'classification', description: 'FS-Klassifizierung', quantity: extras.classificationQty, unit: 'Stk', unitPrice: 15,              total: 15 * extras.classificationQty });
        if (extras.copies > 0)     rows.push({ key: 'copies',         description: 'Zusatzkopien',       quantity: extras.copies,            unit: 'Stk', unitPrice: extras.copyPrice, total: extras.copies * extras.copyPrice });
        return rows;
    }, [extras]);

    const handleToggleExtra = (key: string) => {
        setExtras(prev => {
            if (key === 'isCertified')    return { ...prev, isCertified: false };
            if (key === 'hasApostille')   return { ...prev, hasApostille: false };
            if (key === 'isExpress')      return { ...prev, isExpress: false };
            if (key === 'classification') return { ...prev, classification: false };
            if (key === 'copies')         return { ...prev, copies: 0 };
            return prev;
        });
    };

    const handleUpdateExtraQty = (key: string, qty: number) => {
        setExtras(prev => {
            if (key === 'isCertified')    return { ...prev, certifiedQty: qty };
            if (key === 'hasApostille')   return { ...prev, apostilleQty: qty };
            if (key === 'isExpress')      return { ...prev, expressQty: qty };
            if (key === 'classification') return { ...prev, classificationQty: qty };
            if (key === 'copies')         return { ...prev, copies: qty };
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
                classification: extras.classification ? 'ja' : 'nein',
                classification_count: extras.classificationQty,
                copies_count: extras.copies,
            }
        );
    };

    return (
        <div className="flex flex-col gap-8 mb-10 animate-fadeIn h-full">
            {isLocked && (
                <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
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

            <div className="flex flex-col xl:flex-row gap-8 flex-1">
                {/* Left Column: Calculation & Payments */}
                <div className="flex-1 space-y-8 flex flex-col">
                    {/* Positions Table Container */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <FaCalculator className="text-slate-600 text-sm" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-800">Positions-Kalkulation</h3>
                                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">Leistungen & Preise festlegen</p>
                                </div>
                            </div>
                            {!isLocked && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isPendingSave}
                                    className="h-8 font-bold flex items-center gap-1.5 shadow-md shadow-brand-primary/10"
                                >
                                    <FaCheckCircle className="text-[10px]" /> SPEICHERN
                                </Button>
                            )}
                        </div>

                        <div className="p-4 flex-1">
                            <ProjectPositionsTable
                                positions={positions}
                                setPositions={setPositions}
                                disabled={isLocked}
                                extraRows={extraRows}
                                onToggleExtra={handleToggleExtra}
                                onUpdateExtraQty={handleUpdateExtraQty}
                            />
                        </div>
                    </div>

                    {/* Payments section */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 overflow-hidden">
                        <ProjectPaymentsTable
                            payments={projectData.payments || []}
                            onAddPayment={onRecordPayment}
                            onEditPayment={onEditPayment || (() => { })}
                            onDeletePayment={onDeletePayment || (() => { })}
                        />

                        {activeInvoice && financials.open <= 0 && (
                            <div className="mt-4 flex items-center justify-center gap-2 px-3 py-3 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-600 text-[11px] font-black uppercase tracking-widest animate-in zoom-in-95">
                                <FaCheckCircle className="text-emerald-500" /> VOLLSTÄNDIG BEZAHLT
                            </div>
                        )}
                        {!activeInvoice && (
                            <div className="mt-4 flex items-center justify-center gap-1.5 px-3 py-3 bg-amber-50 border border-amber-200 rounded-sm text-amber-600 text-[10px] font-bold uppercase tracking-tight">
                                <FaInfoCircle className="text-[10px]" /> Rechnung erforderlich, um Zahlungen zu erfassen
                            </div>
                        )}
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
                    />

                    {/* Invoice Status Card */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-7 h-7 rounded-sm bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                                <FaEuroSign className="text-xs" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Abrechnung</h3>
                        </div>
                        <div className="p-6">
                            {activeInvoice ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
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
                                    <div className="py-2">
                                        <div className="text-sm font-black text-slate-900 tracking-tight">{activeInvoice.invoice_number}</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1">
                                            {(activeInvoice.amount_gross / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={onGoToInvoice}
                                        className="w-full h-9 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9px] border-slate-200"
                                    >
                                        DETAILS ANSEHEN <FaArrowRight size={8} />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="default"
                                    onClick={onCreateInvoice}
                                    className="w-full h-11 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]"
                                >
                                    <FaFileInvoiceDollar /> RECHNUNG ERSTELLEN
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectFinancesTab;
