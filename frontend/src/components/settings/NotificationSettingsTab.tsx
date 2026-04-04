import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FaBell, FaEnvelope, FaDesktop, FaSave } from 'react-icons/fa';
import { settingsService } from '../../api/services';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';

interface NotifEntry {
    email: boolean;
    app: boolean;
    days_before?: number;
}

interface NotifSettings {
    project_created: NotifEntry;
    project_status_changed: NotifEntry;
    deadline_reminder: NotifEntry;
    document_uploaded: NotifEntry;
    invoice_due: NotifEntry;
    invoice_overdue: NotifEntry;
    payment_received: NotifEntry;
    new_mail: NotifEntry;
    partner_inquiry_replied: NotifEntry;
}

const getGroups = (t: any) => [
    {
        label: t('notifications.settings.groups.projects'),
        events: [
            { key: 'project_created', label: t('notifications.settings.events.project_created') },
            { key: 'project_status_changed', label: t('notifications.settings.events.project_status_changed') },
            { key: 'deadline_reminder', label: t('notifications.settings.events.deadline_reminder'), hasDays: true, daysLabel: t('notifications.settings.days_before') },
            { key: 'document_uploaded', label: t('notifications.settings.events.document_uploaded') },
        ],
    },
    {
        label: t('notifications.settings.groups.invoices'),
        events: [
            { key: 'invoice_due', label: t('notifications.settings.events.invoice_due'), hasDays: true, daysLabel: t('notifications.settings.days_before') },
            { key: 'invoice_overdue', label: t('notifications.settings.events.invoice_overdue') },
            { key: 'payment_received', label: t('notifications.settings.events.payment_received') },
        ],
    },
    {
        label: t('notifications.settings.groups.communication'),
        events: [
            { key: 'new_mail', label: t('notifications.settings.events.new_mail') },
            { key: 'partner_inquiry_replied', label: t('notifications.settings.events.partner_inquiry_replied') },
        ],
    },
];

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-brand-primary' : 'bg-slate-200'}`}
    >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
);

const NotificationSettingsTab = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const GROUPS = getGroups(t);
    const { data, isLoading } = useQuery<NotifSettings>({
        queryKey: ['settings', 'notifications'],
        queryFn: settingsService.getNotificationSettings,
    });

    const [settings, setSettings] = useState<NotifSettings | null>(null);

    useEffect(() => {
        if (data) setSettings(data);
    }, [data]);

    const mutation = useMutation({
        mutationFn: settingsService.updateNotificationSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
            toast.success(t('notifications.settings.save_success'));
        },
        onError: () => toast.error(t('notifications.settings.save_error')),
    });

    const setField = (key: string, field: 'email' | 'app' | 'days_before', value: boolean | number) => {
        setSettings(prev => prev ? { ...prev, [key]: { ...prev[key as keyof NotifSettings], [field]: value } } : prev);
    };

    if (isLoading || !settings) {
        return (
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-8 flex items-center justify-center">
                <span className="text-slate-400 text-sm">{t('notifications.settings.loading')}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fadeIn ">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaBell className="text-slate-500" />
                        <h3 className="text-sm font-medium text-slate-800">{t('notifications.settings.title')}</h3>
                        <p className="text-xs text-slate-400 italic ml-2 hidden sm:inline-block">{t('notifications.settings.subtitle')}</p>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => mutation.mutate(settings)}
                        disabled={mutation.isPending}
                        isLoading={mutation.isPending}
                        className="px-4 py-2 text-xs font-medium flex items-center gap-2 shrink-0"
                    >
                        <FaSave /> {mutation.isPending ? t('notifications.settings.saving') : t('notifications.settings.save')}
                    </Button>
                </div>

                <div className="divide-y divide-slate-100">
                    {/* Header row */}
                    <div className="grid grid-cols-[1fr_80px_80px_160px] gap-4 px-6 py-2.5 bg-slate-50 border-b border-slate-200">
                        <span className="text-xs font-medium text-slate-400">{t('notifications.settings.event')}</span>
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 justify-end"><FaEnvelope className="text-xs" /> {t('notifications.settings.email')}</span>
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 justify-end"><FaDesktop className="text-xs" /> {t('notifications.settings.app')}</span>
                        <span className="text-xs font-medium text-slate-400 text-right">{t('notifications.settings.lead_time')}</span>
                    </div>

                    {GROUPS.map(group => (
                        <div key={group.label}>
                            <div className="px-6 py-2 bg-slate-50/60">
                                <span className="text-[11px] font-semibold text-slate-500">{group.label}</span>
                            </div>
                            {group.events.map(event => {
                                const entry = settings[event.key as keyof NotifSettings];
                                return (
                                    <div key={event.key} className="grid grid-cols-[1fr_80px_80px_160px] gap-4 px-6 py-3.5 items-center hover:bg-slate-50/50 transition-colors">
                                        <span className="text-sm text-slate-700">{event.label}</span>
                                        <div className="flex justify-end">
                                            <Toggle value={entry.email} onChange={v => setField(event.key, 'email', v)} />
                                        </div>
                                        <div className="flex justify-end">
                                            <Toggle value={entry.app} onChange={v => setField(event.key, 'app', v)} />
                                        </div>
                                        <div className="flex justify-start">
                                            {event.hasDays ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={365}
                                                        className="w-14 h-7 px-2 border border-slate-200 rounded-sm text-xs text-center outline-none focus:border-slate-900"
                                                        value={entry.days_before ?? 3}
                                                        onChange={e => setField(event.key, 'days_before', parseInt(e.target.value) || 1)}
                                                    />
                                                    <span className="text-xs text-slate-400 whitespace-nowrap">{event.daysLabel}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 pr-4">–</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    variant="default"
                    onClick={() => mutation.mutate(settings)}
                    disabled={mutation.isPending}
                    isLoading={mutation.isPending}
                    className="px-6 py-2.5 text-xs font-medium flex items-center gap-2 mr-4 mb-8"
                >
                    <FaSave /> {mutation.isPending ? t('notifications.settings.saving') : t('notifications.settings.save')}
                </Button>
            </div>
        </div>
    );
};

export default NotificationSettingsTab;
