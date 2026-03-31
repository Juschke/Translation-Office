import { useState, useMemo, useEffect } from 'react';
import { FaInfoCircle, FaCalculator } from 'react-icons/fa';
import ProjectPositionsTable from '../modals/ProjectPositionsTable';
import type { ExtraServiceRow } from '../modals/ProjectPositionsTable';
import ProjectPaymentsTable from '../modals/ProjectPaymentsTable';
import ProjectFinancialSidebar from '../modals/ProjectFinancialSidebar';
import type { ProjectPosition } from '../modals/projectType';

interface ProjectFinancesTabProps {
    projectData: any;
    onSavePositions: (positions: any[], extras?: Record<string, any>) => void;
    onRecordPayment: () => void;
    onEditPayment?: (payment: any) => void;
    onDeletePayment?: (id: string) => void;
    isPendingSave: boolean;
    onCreateInvoice?: () => void;
}

const ProjectFinancesTab = ({
    projectData,
    onSavePositions,
    onRecordPayment,
    onEditPayment,
    onDeletePayment,
    isPendingSave,
    onCreateInvoice,
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

    const extraRows = useMemo((): ExtraServiceRow[] => {
        const rows: ExtraServiceRow[] = [];
        if (extras.isCertified) rows.push({ key: 'isCertified', description: 'Beglaubigung', quantity: extras.certifiedQty, unit: 'Stk', unitPrice: 5, total: 5 * extras.certifiedQty });
        if (extras.hasApostille) rows.push({ key: 'hasApostille', description: 'Apostille', quantity: extras.apostilleQty, unit: 'Stk', unitPrice: 15, total: 15 * extras.apostilleQty });
        if (extras.isExpress) rows.push({ key: 'isExpress', description: 'Express-Zuschlag', quantity: extras.expressQty, unit: 'Stk', unitPrice: 15, total: 15 * extras.expressQty });
        if (extras.classification) rows.push({ key: 'classification', description: 'FS-Klassifizierung', quantity: extras.classificationQty, unit: 'Stk', unitPrice: 15, total: 15 * extras.classificationQty });
        if (extras.copies > 0) rows.push({ key: 'copies', description: 'Zusatzkopien', quantity: extras.copies, unit: 'Stk', unitPrice: extras.copyPrice, total: extras.copies * extras.copyPrice });
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
        <div className="flex flex-col gap-6 mb-10 animate-fadeIn h-full">
            <div className="flex flex-col xl:flex-row gap-8 flex-1">
                {/* Left Column: Calculation & Payments */}
                <div className="flex-1 space-y-6 flex flex-col">
                    {/* Positions Table Container */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <FaCalculator className="text-slate-400 text-sm" />
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Leistungs-Kalkulation</h3>
                                    {isLocked && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded text-amber-600">
                                            <FaInfoCircle size={10} />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">Gesperrt</span>
                                            <span className="text-[10px] font-medium opacity-70">({activeInvoice.invoice_number})</span>
                                        </div>
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
                                onSave={isLocked ? undefined : handleSave}
                                isSaving={isPendingSave}
                            />
                        </div>
                    </div>

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
