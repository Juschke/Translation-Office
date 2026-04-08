import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FaUserShield } from 'react-icons/fa';
import clsx from 'clsx';
import { settingsService } from '../../api/services';
import DataTable from '../common/DataTable';
import TableSkeleton from '../common/TableSkeleton';

const AuditLogsTab = () => {
    const { t } = useTranslation();
    const { data: activities = [], isLoading } = useQuery<any[]>({
        queryKey: ['activities'],
        queryFn: settingsService.getActivities
    });

    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-hidden flex flex-col flex-1 min-h-0 animate-fadeIn">
            <div className="p-4 bg-slate-50 flex items-center justify-between border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                    <FaUserShield className="text-brand-primary" />
                    <h3 className="text-sm font-medium text-slate-800">{t('settings.tabs.audit')}</h3>
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {isLoading ? <TableSkeleton rows={10} columns={5} /> : (
                    <DataTable
                        isLoading={isLoading}
                        data={activities}
                        columns={[
                            { id: 'time', header: t('settings.audit.col_time'), accessor: (a: any) => <span className="text-slate-500 text-xs font-medium">{new Date(a.created_at).toLocaleString('de-DE')}</span>, className: 'w-40' },
                            { id: 'user', header: t('settings.audit.col_user'), accessor: (a: any) => <span className="font-medium text-slate-800">{a.causer?.name || t('settings.audit.system_user')}</span> },
                            { id: 'action', header: t('settings.audit.col_action'), accessor: (a: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', a.description === 'created' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : a.description === 'updated' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200')}>{a.description}</span>, align: 'center' },
                            { id: 'model', header: t('settings.audit.col_model'), accessor: (a: any) => <span className="text-xs text-slate-400 italic">{a.subject_type.split('\\').pop()}</span> },
                            { id: 'details', header: t('settings.audit.col_details'), accessor: (a: any) => <div className="max-w-xs truncate text-xs text-slate-500 font-brand bg-slate-50 p-1">{JSON.stringify(a.properties)}</div> }
                        ]}
                        pageSize={15}
                    />
                )}
            </div>
        </div>
    );
};

export default AuditLogsTab;
