import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../api/services';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import DataTable from '../common/DataTable';
import clsx from 'clsx';

interface HistoryTabProps {
    projectId: string;
}



const HistoryTab = ({ projectId }: HistoryTabProps) => {
    const { t } = useTranslation();

    const EVENT_LABELS: Record<string, { label: string; color: string; bgColor: string; textColor: string }> = {
        created: { label: t('history.event_created'), color: 'bg-emerald-100', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
        updated: { label: t('history.event_updated'), color: 'bg-blue-100', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
        deleted: { label: t('history.event_deleted'), color: 'bg-red-100', bgColor: 'bg-red-50', textColor: 'text-red-700' },
    };

    const ATTRIBUTE_LABELS: Record<string, string> = {
        project_name: t('common.project_name'),
        status: t('common.status'),
        priority: t('projects.filters.priority.label'),
        deadline: t('fields.due_date'),
        customer_id: t('projects.filters.customers.label'),
        source_lang_id: t('projects.filters.languages.source'),
        target_lang_id: t('projects.filters.languages.target'),
        price_total: t('common.total_price'),
        partner_id: t('projects.filters.partners.label'),
        notes: t('fields.notes'),
        is_certified: t('projects.filters.certified'),
        has_apostille: t('projects.filters.apostille'),
        is_express: t('projects.filters.priority.express'),
    };

    const formatFieldValue = (key: string, value: any) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
        if (key === 'status') {
            const statuses: Record<string, string> = {
                offer: t('projects.status.offer'),
                in_progress: t('projects.status.in_progress'),
                ready_for_pickup: t('projects.status.ready_for_pickup'),
                delivered: t('projects.status.delivered'),
                invoiced: t('projects.status.invoiced'),
                completed: t('projects.status.completed')
            };
            return statuses[value] || value;
        }
        if (key === 'price_total' || key === 'partner_rate') return `${parseFloat(value).toFixed(2)} €`;
        if (key === 'deadline') return format(new Date(value), 'dd.MM.yyyy HH:mm', { locale: de });
        return String(value);
    };

    const RELEVANT_ATTRIBUTES = new Set(Object.keys(ATTRIBUTE_LABELS));

    const { data: activitiesData, isLoading } = useQuery({
        queryKey: ['project-activities', projectId],
        queryFn: () => projectService.getActivities(projectId),
        enabled: !!projectId,
    });

    const activities = Array.isArray(activitiesData) ? activitiesData : [];

    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
    const [eventType, setEventType] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Erstelle einzelne Einträge für jede relevante Änderung
    const historyEntries = useMemo(() => {
        const result: any[] = [];

        activities.forEach((activity: any) => {
            const eventInfo = EVENT_LABELS[activity.event] || { label: activity.event, color: 'bg-slate-100', bgColor: 'bg-slate-50', textColor: 'text-slate-600' };
            const user = activity.causer?.name || 'System';

            if (activity.event === 'created') {
                result.push({
                    id: `${activity.id}-created`,
                    date: activity.created_at,
                    user,
                    event: 'created',
                    eventLabel: eventInfo.label,
                    eventColor: eventInfo.color,
                    eventText: eventInfo.textColor,
                    field: '-',
                    oldValue: '-',
                    newValue: t('history.project_created_info'),
                    description: t('history.project_created'),
                });
            } else if (activity.event === 'updated') {
                const oldAttributes = activity.properties?.old || {};
                const newAttributes = activity.properties?.attributes || {};
                const changedKeys = Object.keys(newAttributes).filter(
                    k => RELEVANT_ATTRIBUTES.has(k) && oldAttributes[k] !== newAttributes[k]
                );

                if (changedKeys.length > 0) {
                    changedKeys.forEach((key, idx) => {
                        result.push({
                            id: `${activity.id}-${key}-${idx}`,
                            date: activity.created_at,
                            user,
                            event: 'updated',
                            eventLabel: eventInfo.label,
                            eventColor: eventInfo.color,
                            eventText: eventInfo.textColor,
                            field: ATTRIBUTE_LABELS[key] || key,
                            oldValue: formatFieldValue(key, oldAttributes[key]),
                            newValue: formatFieldValue(key, newAttributes[key]),
                            description: `${ATTRIBUTE_LABELS[key] || key} geändert`,
                        });
                    });
                }
            } else if (activity.event === 'deleted') {
                result.push({
                    id: `${activity.id}-deleted`,
                    date: activity.created_at,
                    user,
                    event: 'deleted',
                    eventLabel: eventInfo.label,
                    eventColor: eventInfo.color,
                    eventText: eventInfo.textColor,
                    field: '-',
                    oldValue: t('common.project'),
                    newValue: t('history.event_deleted'),
                    description: t('history.project_deleted'),
                });
            }
        });

        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activities]);

    const users = useMemo(() => {
        const uniqueUsers = new Set(historyEntries.map(e => e.user));
        return Array.from(uniqueUsers).sort();
    }, [historyEntries]);

    const filteredEntries = useMemo(() => {
        return historyEntries.filter(entry => {
            if (eventType !== 'all' && entry.event !== eventType) return false;
            if (userFilter !== 'all' && entry.user !== userFilter) return false;
            
            if (dateFrom) {
                const d = new Date(entry.date);
                const from = new Date(dateFrom);
                from.setHours(0, 0, 0, 0);
                if (d < from) return false;
            }
            if (dateTo) {
                const d = new Date(entry.date);
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (d > to) return false;
            }

            return true;
        });
    }, [historyEntries, eventType, userFilter, dateFrom, dateTo]);

    const filterDefs = useMemo<any[]>(() => [
        {
            id: 'eventType',
            label: t('history.action'),
            type: 'select',
            options: [
                { value: 'all', label: t('projects.filters.status_tabs.all') },
                { value: 'created', label: t('history.event_created') },
                { value: 'updated', label: t('history.event_updated') },
                { value: 'deleted', label: t('history.event_deleted') },
            ],
            value: eventType,
            onChange: (val: string) => setEventType(val),
        },
        {
            id: 'user',
            label: t('history.user'),
            type: 'searchableSelect',
            options: [
                { value: 'all', label: t('projects.filters.customers.all') },
                ...users.map(u => ({ value: u, label: u })),
            ],
            value: userFilter,
            onChange: (val: string) => setUserFilter(val),
        },
        {
            id: 'dateFrom',
            label: t('common.from'),
            type: 'date',
            value: dateFrom,
            onChange: (val: string) => setDateFrom(val),
        },
        {
            id: 'dateTo',
            label: t('common.to'),
            type: 'date',
            value: dateTo,
            onChange: (val: string) => setDateTo(val),
        },
    ], [eventType, userFilter, users, dateFrom, dateTo, t]);

    const activeFilterCount = (eventType !== 'all' ? 1 : 0) + (userFilter !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

    const columns = useMemo(() => [
        {
            id: 'date',
            header: t('history.date_time'),
            accessor: (entry: any) => {
                const date = new Date(entry.date);
                const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: de });
                return (
                    <div className="flex flex-col gap-0.5 min-w-[120px]">
                        <span className="text-xs font-medium text-slate-700">
                            {format(date, 'dd.MM.yyyy HH:mm', { locale: de })}
                        </span>
                        <span className="text-[11px] text-slate-400 italic">{timeAgo}</span>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'date',
        },
        {
            id: 'user',
            header: t('history.user'),
            accessor: (entry: any) => (
                <div className="flex items-center gap-2 min-w-[100px]">
                    <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase shrink-0">
                        {entry.user?.[0] || 'U'}
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate">{entry.user}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'user',
        },
        {
            id: 'action',
            header: t('history.action'),
            accessor: (entry: any) => (
                <span className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap inline-block",
                    entry.eventColor,
                    entry.eventText
                )}>
                    {entry.eventLabel}
                </span>
            ),
        },
        {
            id: 'field',
            header: t('history.field'),
            accessor: (entry: any) => (
                <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 whitespace-nowrap">
                    {entry.field || '-'}
                </span>
            ),
        },
        {
            id: 'oldValue',
            header: t('history.old_value'),
            accessor: (entry: any) => (
                <div className="max-w-[180px] truncate text-xs text-rose-600 line-through opacity-70" title={String(entry.oldValue)}>
                    {entry.oldValue || '-'}
                </div>
            ),
        },
        {
            id: 'newValue',
            header: t('history.new_value'),
            accessor: (entry: any) => (
                <div className="max-w-[180px] truncate text-xs text-emerald-700 font-bold" title={String(entry.newValue)}>
                    {entry.newValue || '-'}
                </div>
            ),
        },
    ], [t]);

    return (
        <div className="flex flex-col h-full animate-fadeIn">
            <DataTable
                data={filteredEntries}
                columns={columns as any}
                pageSize={20}
                searchPlaceholder="Historie durchsuchen..."
                showSettings={true}
                isLoading={isLoading}
                filterLayout="drawer"
                onFilterToggle={() => setIsFilterSidebarOpen(v => !v)}
                isFilterOpen_external={isFilterSidebarOpen}
                filters={filterDefs}
                activeFilterCount={activeFilterCount}
                onResetFilters={() => { 
                    setEventType('all'); 
                    setUserFilter('all'); 
                    setDateFrom('');
                    setDateTo('');
                }}
            />
        </div>
    );
};

export default HistoryTab;
