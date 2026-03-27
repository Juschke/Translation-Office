export interface ProjectPosition {
    id: string;
    description: string;
    unit: string;
    quantity: string;          // Menge (einziges Mengenfeld)
    partnerRate: string;
    partnerMode: string;       // 'unit' | 'flat'
    partnerTotal: string;
    customerRate: string;
    customerTotal: string;
    customerMode: string;      // 'rate' | 'flat' | 'unit' (margin-based)
    marginType: string;        // 'markup' | 'markdown'
    marginPercent: string;
}
