import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
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
                quantity: (p.quantity || p.amount || '0.00').toString(),
                amount: (p.amount || '0.00').toString(),
                partnerRate: (p.partnerRate || p.partner_rate || '0.00').toString(),
                partnerMode: p.partnerMode || p.partner_mode || 'unit',
                partnerTotal: (p.partnerTotal || p.partner_total || '0.00').toString(),
                customerRate: (p.customerRate || p.customer_rate || '0.00').toString(),
                customerMode: p.customerMode || p.customer_mode || 'unit',
                customerTotal: (p.customerTotal || p.customer_total || '0.00').toString(),
                marginType: p.marginType || p.margin_type || 'markup',
                marginPercent: (p.marginPercent || p.margin_percent || '0.00').toString(),
            }));
        }
        return [];
    });

    const [extras, setExtras] = useState({
        isCertified: projectData.isCertified || !!projectData.is_certified,
        certifiedQty: projectData.certified_count || 1,
        certifiedDesc: 'Beglaubigung',
        certifiedPrice: 5,
        certifiedTax: '19.00',
        certifiedUnit: 'Stk',

        hasApostille: projectData.hasApostille || !!projectData.has_apostille,
        apostilleQty: projectData.apostille_count || 1,
        apostilleDesc: 'Apostille',
        apostillePrice: 15,
        apostilleTax: '19.00',
        apostilleUnit: 'Stk',

        isExpress: projectData.isExpress || !!projectData.is_express,
        expressQty: projectData.express_count || 1,
        expressDesc: 'Express-Zuschlag',
        expressPrice: 15,
        expressTax: '19.00',
        expressUnit: 'Stk',

        classification: projectData.classification === 'ja' || projectData.classification === true,
        classificationQty: projectData.classification_count || 1,
        classificationDesc: 'FS-Klassifizierung',
        classificationPrice: 15,
        classificationTax: '19.00',
        classificationUnit: 'Stk',

        copies: projectData.copies || projectData.copies_count || 0,
        copyPrice: parseFloat(projectData.copyPrice || projectData.copy_price || '5'),
        copyDesc: 'Zusatzkopien',
        copyTax: '19.00',
        copyUnit: 'Stk',
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

        const extraList = [
            { enabled: extras.isCertified, qty: extras.certifiedQty, price: extras.certifiedPrice, tax: extras.certifiedTax },
            { enabled: extras.hasApostille, qty: extras.apostilleQty, price: extras.apostillePrice, tax: extras.apostilleTax },
            { enabled: extras.isExpress, qty: extras.expressQty, price: extras.expressPrice, tax: extras.expressTax },
            { enabled: extras.classification, qty: extras.classificationQty, price: extras.classificationPrice, tax: extras.classificationTax },
            { enabled: extras.copies > 0, qty: extras.copies, price: extras.copyPrice, tax: extras.copyTax },
        ];

        let extraNet = 0;
        let extraTax = 0;
        extraList.forEach(ex => {
            if (ex.enabled) {
                const net = ex.qty * ex.price;
                extraNet += net;
                extraTax += net * (parseFloat(ex.tax) / 100);
            }
        });

        let positionsNet = 0;
        let positionsTax = 0;
        positions.forEach(pos => {
            const net = parseFloat(pos.customerTotal) || 0;
            positionsNet += net;
            positionsTax += net * (parseFloat(pos.taxRate || '19.00') / 100);
        });

        const partnerTotal = positions.reduce((sum: number, pos: any) => sum + (parseFloat(pos.partnerTotal) || 0), 0);

        const netTotal = positionsNet + extraNet;
        const taxTotal = positionsTax + extraTax;
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
        if (extras.isCertified) rows.push({ key: 'isCertified', description: extras.certifiedDesc, quantity: extras.certifiedQty, unit: extras.certifiedUnit, unitPrice: extras.certifiedPrice, total: extras.certifiedPrice * extras.certifiedQty, taxRate: extras.certifiedTax });
        if (extras.hasApostille) rows.push({ key: 'hasApostille', description: extras.apostilleDesc, quantity: extras.apostilleQty, unit: extras.apostilleUnit, unitPrice: extras.apostillePrice, total: extras.apostillePrice * extras.apostilleQty, taxRate: extras.apostilleTax });
        if (extras.isExpress) rows.push({ key: 'isExpress', description: extras.expressDesc, quantity: extras.expressQty, unit: extras.expressUnit, unitPrice: extras.expressPrice, total: extras.expressPrice * extras.expressQty, taxRate: extras.expressTax });
        if (extras.classification) rows.push({ key: 'classification', description: extras.classificationDesc, quantity: extras.classificationQty, unit: extras.classificationUnit, unitPrice: extras.classificationPrice, total: extras.classificationPrice * extras.classificationQty, taxRate: extras.classificationTax });
        if (extras.copies > 0) rows.push({ key: 'copies', description: extras.copyDesc, quantity: extras.copies, unit: extras.copyUnit, unitPrice: extras.copyPrice, total: extras.copies * extras.copyPrice, taxRate: extras.copyTax });
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

    const handleUpdateExtra = (key: string, patch: any) => {
        setExtras(prev => {
            const updates: any = {};
            if (key === 'isCertified') {
                if (patch.description !== undefined) updates.certifiedDesc = patch.description;
                if (patch.quantity !== undefined) updates.certifiedQty = patch.quantity;
                if (patch.unitPrice !== undefined) updates.certifiedPrice = patch.unitPrice;
                if (patch.taxRate !== undefined) updates.certifiedTax = patch.taxRate;
                if (patch.unit !== undefined) updates.certifiedUnit = patch.unit;
            } else if (key === 'hasApostille') {
                if (patch.description !== undefined) updates.apostilleDesc = patch.description;
                if (patch.quantity !== undefined) updates.apostilleQty = patch.quantity;
                if (patch.unitPrice !== undefined) updates.apostillePrice = patch.unitPrice;
                if (patch.taxRate !== undefined) updates.apostilleTax = patch.taxRate;
                if (patch.unit !== undefined) updates.apostilleUnit = patch.unit;
            } else if (key === 'isExpress') {
                if (patch.description !== undefined) updates.expressDesc = patch.description;
                if (patch.quantity !== undefined) updates.expressQty = patch.quantity;
                if (patch.unitPrice !== undefined) updates.expressPrice = patch.unitPrice;
                if (patch.taxRate !== undefined) updates.expressTax = patch.taxRate;
                if (patch.unit !== undefined) updates.expressUnit = patch.unit;
            } else if (key === 'classification') {
                if (patch.description !== undefined) updates.classificationDesc = patch.description;
                if (patch.quantity !== undefined) updates.classificationQty = patch.quantity;
                if (patch.unitPrice !== undefined) updates.classificationPrice = patch.unitPrice;
                if (patch.taxRate !== undefined) updates.classificationTax = patch.taxRate;
                if (patch.unit !== undefined) updates.classificationUnit = patch.unit;
            } else if (key === 'copies') {
                if (patch.description !== undefined) updates.copyDesc = patch.description;
                if (patch.quantity !== undefined) updates.copies = patch.quantity;
                if (patch.unitPrice !== undefined) updates.copyPrice = patch.unitPrice;
                if (patch.taxRate !== undefined) updates.copyTax = patch.taxRate;
                if (patch.unit !== undefined) updates.copyUnit = patch.unit;
            }
            return { ...prev, ...updates };
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
                                            <span className="text-2xs font-bold uppercase tracking-tight">Gesperrt</span>
                                            <span className="text-2xs font-medium opacity-70">({activeInvoice.invoice_number})</span>
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
                                onUpdateExtra={handleUpdateExtra}
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
                        creationDate={format(new Date(projectData.created_at || projectData.createdAtRaw || Date.now()), 'dd.MM.yyyy', { locale: de })}
                        projectManager={projectData.creator?.name || projectData.pm || 'System'}
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
