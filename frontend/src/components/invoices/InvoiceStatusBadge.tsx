import React from 'react';

interface InvoiceStatusBadgeProps {
    status: string;
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status }) => {
    const statusLower = (status || 'pending').toLowerCase();

    // Normalize logic
    let normalizedStatus = statusLower;
    if (['bezahlt', 'paid'].includes(statusLower)) normalizedStatus = 'paid';
    if (['offen', 'pending'].includes(statusLower)) normalizedStatus = 'pending';
    if (['überfällig', 'overdue'].includes(statusLower)) normalizedStatus = 'overdue';
    if (['gesendet', 'sent'].includes(statusLower)) normalizedStatus = 'sent';
    if (['storniert', 'cancelled'].includes(statusLower)) normalizedStatus = 'cancelled';
    if (['gelöscht', 'deleted'].includes(statusLower)) normalizedStatus = 'deleted';
    if (['archiviert', 'archived'].includes(statusLower)) normalizedStatus = 'archived';

    const styles: { [key: string]: string } = {
        'paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'overdue': 'bg-red-50 text-red-700 border-red-200',
        'pending': 'bg-amber-50 text-amber-700 border-amber-200',
        'sent': 'bg-blue-50 text-blue-700 border-blue-200',
        'cancelled': 'bg-slate-100 text-slate-600 border-slate-300',
        'deleted': 'bg-slate-50 text-slate-500 border-slate-200',
        'archived': 'bg-slate-800 text-white border-slate-700'
    };

    const labels: { [key: string]: string } = {
        'paid': 'Bezahlt',
        'overdue': 'Überfällig',
        'pending': 'Offen',
        'sent': 'Gesendet',
        'cancelled': 'Storniert',
        'deleted': 'Gelöscht',
        'archived': 'Archiviert'
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border tracking-tight ${styles[normalizedStatus] || styles['pending']}`}>
            {labels[normalizedStatus] || status}
        </span>
    );
};

export default InvoiceStatusBadge;
