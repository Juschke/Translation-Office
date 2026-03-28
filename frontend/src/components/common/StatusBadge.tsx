import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../../api/services';

/* ─── Typen ─── */
type StatusType = 'project' | 'customer' | 'partner';

interface StatusBadgeProps {
    status: string;
    type?: StatusType;
}

/* ─── Konfiguration ─── */
const PROJECT_CONFIG: Record<string, { style: string; label: string }> = {
    draft: { style: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Entwurf' },
    offer: { style: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Neu / Angebot' },
    pending: { style: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Ausstehend' },
    in_progress: { style: 'bg-blue-50 text-blue-700 border-blue-200', label: 'In Bearbeitung' },
    review: { style: 'bg-blue-50 text-blue-700 border-blue-200', label: 'In Prüfung' },
    ready_for_pickup: { style: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Abholbereit' },
    invoiced: { style: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Rechnung gestellt' },
    delivered: { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Geliefert' },
    completed: { style: 'bg-emerald-600 text-white border-emerald-700', label: 'Abgeschlossen' },
    cancelled: { style: 'bg-slate-100 text-slate-500 border-slate-300', label: 'Storniert' },
    archived: { style: 'bg-slate-800 text-white border-slate-700', label: 'Archiviert' },
    deleted: { style: 'bg-red-50 text-red-700 border-red-200', label: 'Gelöscht' },
};

const CUSTOMER_CONFIG: Record<string, { style: string; label: string }> = {
    active: { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Aktiv' },
    inactive: { style: 'bg-slate-50 text-slate-400 border-slate-200', label: 'Inaktiv' },
    deleted: { style: 'bg-red-50 text-red-700 border-red-200', label: 'Gelöscht' },
    archived: { style: 'bg-slate-800 text-white border-slate-700', label: 'Archiviert' },
};

const PARTNER_CONFIG: Record<string, { style: string; label: string }> = {
    verified: { style: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Aktiv' },
    active: { style: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Aktiv' },
    busy: { style: 'bg-orange-50 text-orange-600 border-orange-200', label: 'Ausgelastet' },
    vacation: { style: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Abwesend' },
    inactive: { style: 'bg-slate-50 text-slate-400 border-slate-200', label: 'Deaktiviert' },
};

const BASE_CLASS = 'inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-semibold border tracking-tight';
const FALLBACK_STYLE = 'bg-slate-50 text-slate-400 border-slate-200';

export function StatusBadge({ status, type = 'project' }: StatusBadgeProps): ReactNode {
    const { data: projectStatuses = [] } = useQuery<any[]>({
        queryKey: ['settings', 'projectStatuses'],
        queryFn: settingsService.getProjectStatuses,
        enabled: type === 'project',
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    // Normalisiere deutsche/englische Status-Strings
    const normalized = (status || '').toLowerCase()
        .replace('aktiv', 'active')
        .replace('inaktiv', 'inactive');

    // 1. Check if it's a project status and we have dynamic data
    if (type === 'project' && projectStatuses.length > 0) {
        const dynamicStatus = projectStatuses.find(s => s.name?.toLowerCase() === normalized);
        if (dynamicStatus) {
            return (
                <span className={`${BASE_CLASS} ${dynamicStatus.style || FALLBACK_STYLE}`}>
                    {dynamicStatus.label}
                </span>
            );
        }
    }

    const config =
        type === 'customer' ? CUSTOMER_CONFIG :
            type === 'partner' ? PARTNER_CONFIG :
                PROJECT_CONFIG;

    const entry = config[normalized] || { style: FALLBACK_STYLE, label: status || '—' };

    return (
        <span className={`${BASE_CLASS} ${entry.style}`}>
            {entry.label}
        </span>
    );
}

export default StatusBadge;
