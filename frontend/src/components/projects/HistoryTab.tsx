import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../api/services';
import TableSkeleton from '../common/TableSkeleton';
import DataTable, { type FilterDef } from '../common/DataTable';
import { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const ATTRIBUTE_LABELS: Record<string, string> = {
    project_name: 'Projektname',
    project_number: 'Projektnummer',
    customer_id: 'Kunde',
    partner_id: 'Partner',
    source_lang_id: 'Eingangssprache',
    target_lang_id: 'Zielsprache',
    document_type_id: 'Dokumentenart',
    additional_doc_types: 'Weitere Dokumentenarten',
    status: 'Status',
    priority: 'Priorität',
    word_count: 'Wortanzahl',
    line_count: 'Zeilenanzahl',
    price_total: 'Gesamtpreis',
    partner_cost_net: 'Partner-Kosten (Netto)',
    down_payment: 'Anzahlung',
    down_payment_date: 'Anzahlungsdatum',
    down_payment_note: 'Anzahlungsnotiz',
    currency: 'Währung',
    deadline: 'Liefertermin',
    is_certified: 'Beglaubigung',
    has_apostille: 'Apostille',
    is_express: 'Express',
    classification: 'Klassifizierung',
    copies_count: 'Kopien-Anzahl',
    copy_price: 'Kopie-Preis',
    notes: 'Notizen',
    created_at: 'Erstellt am',
    updated_at: 'Aktualisiert am',
};

const EVENT_LABELS: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    created: { label: 'Erstellt', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    updated: { label: 'Aktualisiert', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    deleted: { label: 'Gelöscht', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
};

const formatFieldValue = (key: string, value: any): string => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
    if (key === 'is_certified' || key === 'has_apostille' || key === 'is_express' || key === 'classification') {
        return value === true || value === 1 || value === '1' ? 'Ja' : 'Nein';
    }
    if (key === 'deadline' || key === 'down_payment_date' || key === 'created_at' || key === 'updated_at') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    }
    if (key === 'price_total' || key === 'partner_cost_net' || key === 'down_payment' || key === 'copy_price') {
        return parseFloat(value).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    }
    if (key === 'status') {
        const statusMap: Record<string, string> = {
            draft: 'Entwurf', offer: 'Angebot', pending: 'Angebot', in_progress: 'Bearbeitung',
            review: 'Bearbeitung', ready_for_pickup: 'Abholbereit', delivered: 'Geliefert',
            invoiced: 'Rechnung', completed: 'Abgeschlossen', cancelled: 'Storniert',
            archived: 'Archiviert', deleted: 'Gelöscht'
        };
        return statusMap[value] || value;
    }
    if (key === 'priority') {
        const pMap: Record<string, string> = { low: 'Normal', medium: 'Normal', high: 'Dringend', express: 'Express' };
        return pMap[value] || value;
    }
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
};

interface HistoryTabProps {
    projectId: string;
}

const HistoryTab = ({ projectId }: HistoryTabProps) => {
    const { data: activities = [], isLoading } = useQuery({
        queryKey: ['project-activities', projectId],
        queryFn: () => projectService.getActivities(projectId),
        enabled: !!projectId,
    });

    // Flatten activities into individual changes for better table display
    const flattenedChanges = useMemo(() => {
        const result: any[] = [];

        activities.forEach((activity: any) => {
            const eventInfo = EVENT_LABELS[activity.event] || { label: activity.event, color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' };
            const subject = activity.subject_type?.split('\\').pop() || 'Objekt';
            const baseInfo = {
                id: activity.id,
                date: activity.created_at,
                user: activity.causer?.name || 'System',
                event: activity.event,
                eventLabel: eventInfo.label,
                eventColor: eventInfo.color,
                eventBg: eventInfo.bgColor,
                eventBorder: eventInfo.borderColor,
                subjectType: subject,
            };

            if (activity.event === 'updated') {
                const oldAttributes = activity.properties?.old || {};
                const newAttributes = activity.properties?.attributes || {};
                const changedKeys = Object.keys(newAttributes).filter(k => k !== 'updated_at' && k !== 'created_at');

                if (changedKeys.length > 0) {
                    result.push({
                        ...baseInfo,
                        id: activity.id,
                        changes: changedKeys.map(key => ({
                            field: ATTRIBUTE_LABELS[key] || key,
                            oldValue: formatFieldValue(key, oldAttributes[key]),
                            newValue: formatFieldValue(key, newAttributes[key])
                        }))
                    });
                } else {
                    result.push({
                        ...baseInfo,
                        id: activity.id,
                        changes: [{
                            field: 'System-Update',
                            oldValue: '-',
                            newValue: 'Metadaten aktualisiert'
                        }]
                    });
                }
            } else {
                // For created/deleted
                result.push({
                    ...baseInfo,
                    id: activity.id,
                    changes: [{
                        field: subject,
                        oldValue: activity.event === 'created' ? '-' : 'Vorhanden',
                        newValue: activity.event === 'created' ? 'Neu angelegt' : 'Gelöscht'
                    }]
                });
            }
        });

        // Sort by date descending
        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activities]);

    const [eventType, setEventType] = useState('all');
    const [userFilter, setUserFilter] = useState('all');

    const filteredChanges = useMemo(() => {
        return flattenedChanges.filter(change => {
            if (eventType !== 'all' && change.event !== eventType) return false;
            if (userFilter !== 'all' && change.user !== userFilter) return false;
            return true;
        });
    }, [flattenedChanges, eventType, userFilter]);

    const users = useMemo(() => {
        const set = new Set<string>();
        flattenedChanges.forEach(c => set.add(c.user));
        return Array.from(set).sort();
    }, [flattenedChanges]);

    const tableFilters: FilterDef[] = [
        {
            id: 'eventType',
            label: 'Aktionstyp',
            type: 'select',
            value: eventType,
            onChange: setEventType,
            options: [
                { value: 'all', label: 'Alle Aktionen' },
                { value: 'created', label: 'Erstellt' },
                { value: 'updated', label: 'Aktualisiert' },
                { value: 'deleted', label: 'Gelöscht' },
            ]
        },
        {
            id: 'userFilter',
            label: 'Benutzer',
            type: 'select',
            value: userFilter,
            onChange: setUserFilter,
            options: [
                { value: 'all', label: 'Alle Benutzer' },
                ...users.map(u => ({ value: u, label: u }))
            ]
        }
    ];

    const activeFilterCount = (eventType !== 'all' ? 1 : 0) + (userFilter !== 'all' ? 1 : 0);

    const columns = useMemo(() => [
        {
            id: 'date',
            header: 'Datum / Zeit',
            accessor: (change: any) => {
                const d = new Date(change.date);
                return (
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-700 text-xs">
                                {format(d, 'EEEE, dd.MM.yyyy', { locale: de })}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold italic">
                                ({formatDistanceToNow(d, { addSuffix: true, locale: de })})
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold">{format(d, 'HH:mm', { locale: de })} Uhr</span>
                    </div>
                );
            },
            sortable: true,
            sortKey: 'date',
        },
        {
            id: 'user',
            header: 'Benutzer',
            accessor: (change: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shadow-inner uppercase">
                        {change.user[0]}
                    </div>
                    <span className="font-bold text-slate-600 text-[11px]">{change.user}</span>
                </div>
            ),
            sortable: true,
            sortKey: 'user',
        },
        {
            id: 'action',
            header: 'Aktion',
            accessor: (change: any) => (
                <span className={clsx("px-2 py-0.5 rounded-sm text-xs font-bold uppercase tracking-tight border shadow-sm w-fit block",
                    change.eventColor, change.eventBg, change.eventBorder
                )}>
                    {change.eventLabel}
                </span>
            ),
            sortable: true,
            sortKey: 'event',
        },
        {
            id: 'model',
            header: 'Modell',
            accessor: (change: any) => (
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{change.subjectType}</span>
            ),
            sortable: true,
            sortKey: 'subjectType',
        },
        {
            id: 'object',
            header: 'Objekt / Feld',
            accessor: (change: any) => (
                <div className="flex flex-col gap-1.5 py-1">
                    {change.changes.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-tighter whitespace-nowrap">{item.field}</span>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            id: 'old',
            header: 'Alt',
            accessor: (change: any) => (
                <div className="flex flex-col gap-1.5 py-1">
                    {change.changes.map((item: any, idx: number) => (
                        <div key={idx} className="max-w-[150px] truncate h-5 flex items-center">
                            <span className="text-red-400 text-xs font-medium bg-red-50/30 px-1.5 py-0.5 rounded-sm border border-red-100/30">{item.oldValue}</span>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            id: 'new',
            header: 'Neu',
            accessor: (change: any) => (
                <div className="flex flex-col gap-1.5 py-1">
                    {change.changes.map((item: any, idx: number) => (
                        <div key={idx} className="max-w-[150px] truncate h-5 flex items-center">
                            <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-100">{item.newValue}</span>
                        </div>
                    ))}
                </div>
            ),
        },
    ], []);

    if (isLoading) return <TableSkeleton rows={8} columns={6} />;

    return (
        <div className="flex flex-col gap-4 animate-fadeIn pb-10">
            <DataTable
                data={filteredChanges}
                columns={columns as any}
                pageSize={15}
                searchPlaceholder="Historie filtern..."
                showSettings={true}
                filters={tableFilters}
                activeFilterCount={activeFilterCount}
                onResetFilters={() => {
                    setEventType('all');
                    setUserFilter('all');
                }}
            />
        </div>
    );
};

export default HistoryTab;
