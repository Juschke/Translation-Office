import { useMemo } from 'react';

export const useProjectFinancials = (projectData: any) => {
    const financials = useMemo(() => {
        if (!projectData) return {
            netTotal: 0,
            taxTotal: 0,
            grossTotal: 0,
            partnerTotal: 0,
            margin: 0,
            marginPercent: 0,
            paid: 0,
            open: 0,
            extraTotal: 0
        };

        const positions = projectData.positions || [];
        const payments = projectData.payments || [];

        const extraNet = (projectData.isCertified ? 5 : 0) +
            (projectData.hasApostille ? 15 : 0) +
            (projectData.isExpress ? 15 : 0) +
            (projectData.classification === 'ja' || projectData.classification === (true as any) ? 15 : 0) +
            ((projectData.copies || 0) * (Number(projectData.copyPrice) || 5));

        const positionsNet = positions.reduce((sum: number, pos: any) => sum + (parseFloat(pos.customerTotal) || 0), 0);
        const netTotal = positionsNet + extraNet;
        const taxTotal = netTotal * 0.19;
        const grossTotal = netTotal + taxTotal;

        const partnerTotal = positions.reduce((sum: number, pos: any) => {
            const amount = parseFloat(pos.amount) || 0;
            const rate = parseFloat(pos.partnerRate) || 0;
            const qty = parseFloat(pos.quantity) || 1;
            return sum + (amount * rate * qty);
        }, 0);

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
            extraTotal: extraNet
        };
    }, [projectData]);

    return financials;
};
