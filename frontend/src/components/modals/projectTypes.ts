export interface ProjectPosition {
    id: string;
    description: string;
    unit: string;
    amount: string;             // Wort/Zeilenanzahl (Menge 1)
    quantity: string;           // Anzahl der Dokumente (Menge 2)
    partnerRate: string;
    partnerMode: string;       // 'unit' | 'flat'
    partnerTotal: string;
    customerRate: string;
    customerTotal: string;
    customerMode: string;      // 'rate' | 'flat' | 'unit' (margin-based)
    marginType: string;        // 'markup' | 'markdown'
    marginPercent: string;
    taxRate: string;
    discountPercent: string;
    discountMode?: 'percent' | 'fixed';
}
