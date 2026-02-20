import React from 'react';
import { FaFileAlt, FaStamp, FaCheckCircle, FaExclamationTriangle, FaBan, FaArchive, FaTrashAlt, FaBell } from 'react-icons/fa';

interface InvoiceStatusBadgeProps {
    status: string;
    reminderLevel?: number;
    type?: string; // 'invoice' or 'credit_note'
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status, reminderLevel = 0, type }) => {
    const statusLower = (status || 'draft').toLowerCase();

    // Normalisierung
    let normalizedStatus = statusLower;
    if (['entwurf', 'draft'].includes(statusLower)) normalizedStatus = 'draft';
    if (['ausgestellt', 'issued'].includes(statusLower)) normalizedStatus = 'issued';
    if (['bezahlt', 'paid'].includes(statusLower)) normalizedStatus = 'paid';
    if (['offen', 'pending'].includes(statusLower)) normalizedStatus = 'pending';
    if (['überfällig', 'overdue'].includes(statusLower)) normalizedStatus = 'overdue';
    if (['storniert', 'cancelled'].includes(statusLower)) normalizedStatus = 'cancelled';
    if (['gelöscht', 'deleted'].includes(statusLower)) normalizedStatus = 'deleted';
    if (['archiviert', 'archived'].includes(statusLower)) normalizedStatus = 'archived';

    // Mahnungs-Umschreibung falls reminderLevel > 0
    if (reminderLevel > 0 && normalizedStatus !== 'paid' && normalizedStatus !== 'cancelled') {
        normalizedStatus = 'reminder';
    }

    const config: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
        'draft': { bg: 'bg-slate-50 text-slate-600 border-slate-200', icon: <FaFileAlt className="text-[8px]" />, label: 'Entwurf' },
        'issued': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <FaStamp className="text-[8px]" />, label: 'Ausgestellt' },
        'paid': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <FaCheckCircle className="text-[8px]" />, label: 'Bezahlt' },
        'overdue': { bg: 'bg-red-50 text-red-700 border-red-200', icon: <FaExclamationTriangle className="text-[8px]" />, label: 'Überfällig' },
        'pending': { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <FaFileAlt className="text-[8px]" />, label: 'Offen' },
        'cancelled': { bg: 'bg-slate-100 text-slate-600 border-slate-300', icon: <FaBan className="text-[8px]" />, label: 'Storniert' },
        'deleted': { bg: 'bg-slate-50 text-slate-500 border-slate-200', icon: <FaTrashAlt className="text-[8px]" />, label: 'Gelöscht' },
        'archived': { bg: 'bg-slate-800 text-white border-slate-700', icon: <FaArchive className="text-[8px]" />, label: 'Archiviert' },
        'reminder': { bg: 'bg-orange-50 text-orange-800 border-orange-200 shadow-sm animate-pulse-subtle', icon: <FaBell className="text-[8px]" />, label: 'Mahnung' },
    };

    const getLabel = () => {
        if (type === 'credit_note') return 'Gutschrift';
        if (reminderLevel > 0 && normalizedStatus === 'reminder') {
            if (reminderLevel === 1) return 'Zahlungserinnerung';
            return `${reminderLevel}. Mahnung`;
        }
        return config[normalizedStatus]?.label || status;
    };

    const entry = config[normalizedStatus] || config['draft'];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border tracking-tight transition-all ${entry.bg}`}>
            {entry.icon}
            {getLabel()}
        </span>
    );
};

export default InvoiceStatusBadge;
