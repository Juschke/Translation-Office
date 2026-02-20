import { useMemo } from 'react';
import { FaClock, FaArrowLeft, FaEye } from 'react-icons/fa';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../api/services';
import TableSkeleton from '../common/TableSkeleton';

const ATTRIBUTE_LABELS: Record<string, string> = {
 project_name: 'Projektname',
 project_number: 'Projektnummer',
 customer_id: 'Kunde',
 partner_id: 'Partner',
 source_lang_id: 'Quellsprache',
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
 tenant_id: 'Mandant',
};

const EVENT_LABELS: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
 created: { label: 'Erstellt', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
 updated: { label: 'Aktualisiert', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
 deleted: { label: 'Gelöscht', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
};

const formatFieldValue = (key: string, value: any): string => {
 if (value === null || value === undefined || value === '') {
 if (key === 'phone' || key?.includes('phone')) return 'keine Telefonnummer';
 return 'keine Angabe';
 }
 if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
 if (key === 'is_certified' || key === 'has_apostille' || key === 'is_express' || key === 'classification') {
 return value === true || value === 1 || value === '1' ? 'Ja' : 'Nein';
 }
 if (key === 'deadline' || key === 'down_payment_date' || key === 'created_at' || key === 'updated_at') {
 const d = new Date(value);
 if (!isNaN(d.getTime())) {
 const days = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
 const dayName = days[d.getDay()];
 const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
 const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
 return `${dayName}, ${dateStr} ${timeStr}`;
 }
 }
 if (key === 'price_total' || key === 'partner_cost_net' || key === 'down_payment' || key === 'copy_price') {
 return parseFloat(value).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
 }
 if (key === 'status') {
 const statusMap: Record<string, string> = {
 draft: 'Entwurf',
 offer: 'Angebot',
 pending: 'Angebot',
 in_progress: 'Bearbeitung',
 review: 'Bearbeitung',
 ready_for_pickup: 'Abholbereit',
 delivered: 'Geliefert',
 invoiced: 'Rechnung',
 completed: 'Abgeschlossen',
 cancelled: 'Storniert',
 archived: 'Archiviert',
 deleted: 'Gelöscht'
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
 historySearch: string;
 setHistorySearch: (s: string) => void;
 historySortKey: string;
 setHistorySortKey: (s: any) => void;
 historySortDir: string;
 setHistorySortDir: (s: any) => void;
}

const HistoryTab = ({ projectId, historySearch, setHistorySearch, historySortKey, setHistorySortKey, historySortDir, setHistorySortDir }: HistoryTabProps) => {
 const { data: activities = [], isLoading } = useQuery({
 queryKey: ['project-activities', projectId],
 queryFn: () => projectService.getActivities(projectId),
 enabled: !!projectId,
 });

 const filteredActivities = useMemo(() => {
 let filtered = activities;
 if (historySearch.trim()) {
 const search = historySearch.toLowerCase();
 filtered = activities.filter((a: any) =>
 (a.causer?.name || '').toLowerCase().includes(search) ||
 (a.event || '').toLowerCase().includes(search) ||
 (a.description || '').toLowerCase().includes(search) ||
 (a.subject_type || '').toLowerCase().includes(search) ||
 JSON.stringify(a.properties).toLowerCase().includes(search)
 );
 }

 return [...filtered].sort((a: any, b: any) => {
 let res = 0;
 if (historySortKey === 'date') {
 res = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
 } else if (historySortKey === 'user') {
 res = (a.causer?.name || '').localeCompare(b.causer?.name || '');
 } else if (historySortKey === 'action') {
 res = (a.event || '').localeCompare(b.event || '');
 }
 return historySortDir === 'asc' ? res : -res;
 });
 }, [activities, historySearch, historySortKey, historySortDir]);

 if (isLoading) {
 return <TableSkeleton rows={5} columns={4} />;
 }

 const renderChanges = (activity: any) => {
 const oldAttributes = activity.properties?.old || {};
 const newAttributes = activity.properties?.attributes || {};
 const changedKeys = Object.keys(newAttributes).filter(k => k !== 'updated_at' && k !== 'created_at');

 if (activity.event === 'created') return <span className="text-emerald-600 font-medium">Erstellt</span>;
 if (activity.event === 'deleted') return <span className="text-red-600 font-medium">Gelöscht</span>;

 if (changedKeys.length === 0) return <span className="text-slate-400 italic">-</span>;

 return (
 <div className="flex flex-col gap-1">
 {changedKeys.map(key => {
 const label = ATTRIBUTE_LABELS[key] || key;
 const oldVal = formatFieldValue(key, oldAttributes[key]);
 const newVal = formatFieldValue(key, newAttributes[key]);
 return (
 <div key={key} className="flex items-center gap-1.5 text-xs">
 <span className="font-semibold text-slate-600">{label}:</span>
 <span className="text-red-400 line-through text-xs decoration-slate-300 max-w-[100px] truncate">{oldVal}</span>
 <FaArrowLeft className="rotate-180 text-xs text-slate-300" />
 <span className="text-emerald-600 font-medium max-w-[150px] truncate">{newVal}</span>
 </div>
 );
 })}
 </div>
 );
 };

 return (
 <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden mb-10 h-full flex flex-col">
 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
 <div className="flex items-center gap-3">
 <h3 className="font-medium text-slate-700 flex items-center gap-2">
 <FaClock className="text-slate-600" /> Projekt-Historie
 </h3>
 <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium border border-slate-200">{filteredActivities.length}</span>
 </div>
 <div className="relative w-full sm:w-64">
 <input
 type="text"
 value={historySearch}
 onChange={(e) => setHistorySearch(e.target.value)}
 placeholder="Suche..."
 className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900 outline-none transition shadow-sm"
 />
 <FaEye className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
 </div>
 </div>

 <div className="overflow-y-auto flex-1 custom-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
 <tr>
 <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition" onClick={() => { setHistorySortKey('date'); setHistorySortDir(historySortDir === 'asc' ? 'desc' : 'asc'); }}>
 <div className="flex items-center gap-1">Datum {historySortKey === 'date' && (historySortDir === 'asc' ? '↑' : '↓')}</div>
 </th>
 <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition" onClick={() => { setHistorySortKey('user'); setHistorySortDir(historySortDir === 'asc' ? 'desc' : 'asc'); }}>
 <div className="flex items-center gap-1">Benutzer {historySortKey === 'user' && (historySortDir === 'asc' ? '↑' : '↓')}</div>
 </th>
 <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition" onClick={() => { setHistorySortKey('action'); setHistorySortDir(historySortDir === 'asc' ? 'desc' : 'asc'); }}>
 <div className="flex items-center gap-1">Aktion {historySortKey === 'action' && (historySortDir === 'asc' ? '↑' : '↓')}</div>
 </th>
 <th className="px-6 py-3 w-1/2">Details / Änderungen</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 text-xs bg-white">
 {filteredActivities.length === 0 ? (
 <tr>
 <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
 Keine Einträge gefunden.
 </td>
 </tr>
 ) : (
 filteredActivities.map((activity: any) => {
 const validDate = !isNaN(new Date(activity.created_at).getTime());
 return (
 <tr key={activity.id} className="hover:bg-slate-50 transition-colors group">
 <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono">
 {validDate ? new Date(activity.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
 <span className="text-slate-400 ml-2">{validDate ? new Date(activity.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center text-xs font-medium border border-slate-100">
 {(activity.causer?.name || '?')[0]}
 </div>
 <span className="font-medium text-slate-700">{activity.causer?.name || 'System'}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={clsx("px-2 py-0.5 rounded text-xs font-medium border",
 EVENT_LABELS[activity.event]?.color || 'text-slate-600',
 EVENT_LABELS[activity.event]?.bgColor || 'bg-slate-50',
 EVENT_LABELS[activity.event]?.borderColor || 'border-slate-200'
 )}>
 {EVENT_LABELS[activity.event]?.label || activity.event}
 </span>
 <div className="text-xs text-slate-400 mt-1">{activity.subject_type?.split('\\').pop() || 'Item'}</div>
 </td>
 <td className="px-6 py-4">
 {renderChanges(activity)}
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
};

export default HistoryTab;
