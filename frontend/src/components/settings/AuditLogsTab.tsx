import { useQuery } from '@tanstack/react-query';
import { FaUserShield } from 'react-icons/fa';
import clsx from 'clsx';
import { settingsService } from '../../api/services';
import DataTable from '../common/DataTable';
import TableSkeleton from '../common/TableSkeleton';

const AuditLogsTab = () => {
    const { data: activities = [], isLoading } = useQuery<any[]>({
        queryKey: ['activities'],
        queryFn: settingsService.getActivities
    });

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold border border-brand-100 rounded"><FaUserShield /></div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Audit Logs / Aktivitätsverlauf</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Vollständige Historie aller Systemänderungen</p>
                    </div>
                </div>
                <div className="flex-1 min-h-[500px]">
                    {isLoading ? <TableSkeleton rows={10} columns={5} /> : (
                        <DataTable
                            isLoading={isLoading}
                            data={activities}
                            columns={[
                                { id: 'time', header: 'Zeitpunkt', accessor: (a: any) => <span className="text-slate-500 text-[10px] font-bold">{new Date(a.created_at).toLocaleString('de-DE')}</span>, className: 'w-40' },
                                { id: 'user', header: 'Benutzer', accessor: (a: any) => <span className="font-bold text-slate-800">{a.causer?.name || 'System'}</span> },
                                { id: 'action', header: 'Aktion', accessor: (a: any) => <span className={clsx('px-2 py-0.5 text-[10px] font-bold uppercase border tracking-tight rounded-[4px]', a.description === 'created' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : a.description === 'updated' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200')}>{a.description}</span>, align: 'center' },
                                { id: 'model', header: 'Modell', accessor: (a: any) => <span className="text-xs text-slate-400 italic">{a.subject_type.split('\\').pop()}</span> },
                                { id: 'details', header: 'Details', accessor: (a: any) => <div className="max-w-xs truncate text-[10px] text-slate-500 font-brand bg-slate-50 p-1">{JSON.stringify(a.properties)}</div> }
                            ]}
                            pageSize={15}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogsTab;
