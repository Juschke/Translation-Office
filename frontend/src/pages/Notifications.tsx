import { useState } from 'react';
import {
    FaBell,
    FaCheck,
    FaCheckDouble,
    FaTrash,
    FaCheckCircle,
    FaExclamationTriangle,
    FaTimesCircle,
    FaInfoCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../api/services';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface NotificationData {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    project_id?: number;
}

interface Notification {
    id: string;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
}

type FilterTab = 'all' | 'unread' | 'success' | 'warning' | 'info';

const TYPE_ICON: Record<NotificationData['type'], React.ReactNode> = {
    success: <FaCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />,
    warning: <FaExclamationTriangle className="text-amber-500 w-4 h-4 flex-shrink-0" />,
    error:   <FaTimesCircle className="text-red-500 w-4 h-4 flex-shrink-0" />,
    info:    <FaInfoCircle className="text-blue-500 w-4 h-4 flex-shrink-0" />,
};

function getDateGroup(dateStr: string): string {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Heute';
    if (isYesterday(date)) return 'Gestern';
    if (isThisWeek(date, { locale: de })) return 'Diese Woche';
    return 'Aelter';
}

const DATE_GROUP_ORDER = ['Heute', 'Gestern', 'Diese Woche', 'Aelter'];

const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',     label: 'Alle' },
    { key: 'unread',  label: 'Ungelesen' },
    { key: 'success', label: 'Erfolg' },
    { key: 'warning', label: 'Warnung' },
    { key: 'info',    label: 'Info' },
];

const Notifications = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationService.getAll,
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationService.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success(t('notifications.mark_all_as_read'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: notificationService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read_at) {
            markAsReadMutation.mutate(notification.id);
        }
        if (notification.data?.project_id) {
            navigate(`/projects/${notification.data.project_id}`);
        }
    };

    const filtered: Notification[] = (notifications as Notification[]).filter((n) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'unread') return !n.read_at;
        // 'error' notifications surface under 'info' tab since there's no dedicated error tab
        if (activeFilter === 'info') return n.data.type === 'info' || n.data.type === 'error';
        return n.data.type === activeFilter;
    });

    const unreadCount = (notifications as Notification[]).filter((n) => !n.read_at).length;

    // Group filtered notifications by date bucket, preserving display order
    const grouped: Record<string, Notification[]> = {};
    for (const n of filtered) {
        const group = getDateGroup(n.created_at);
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(n);
    }
    const presentGroups = DATE_GROUP_ORDER.filter((g) => grouped[g]?.length > 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h1 className="text-2xl font-medium text-slate-800">{t('notifications.title')}</h1>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        className="text-sm text-slate-700 hover:text-slate-900 font-medium flex items-center gap-2 hover:bg-slate-50 px-3 py-2 rounded-sm transition-colors disabled:opacity-50 self-start sm:self-auto"
                    >
                        <FaCheckDouble />
                        {t('notifications.mark_all_as_read')}
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-0">
                {FILTER_TABS.map((tab) => {
                    const isActive = activeFilter === tab.key;
                    const count =
                        tab.key === 'all'
                            ? (notifications as Notification[]).length
                            : tab.key === 'unread'
                            ? unreadCount
                            : tab.key === 'info'
                            ? (notifications as Notification[]).filter(
                                  (n) => n.data.type === 'info' || n.data.type === 'error'
                              ).length
                            : (notifications as Notification[]).filter((n) => n.data.type === tab.key).length;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                                isActive
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            )}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span
                                    className={clsx(
                                        'px-1.5 py-0.5 rounded-sm text-[10px] font-semibold min-w-[18px] text-center',
                                        isActive
                                            ? 'bg-[var(--color-primary)] text-white'
                                            : 'bg-slate-100 text-slate-500'
                                    )}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <FaBell className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">
                            Keine {t('notifications.title')}
                        </h3>
                        <p>{t('notifications.no_notifications_message')}</p>
                    </div>
                ) : (
                    <div>
                        {presentGroups.map((group) => (
                            <div key={group}>
                                {/* Date group header */}
                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {group}
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {grouped[group].map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={clsx(
                                                'p-4 hover:bg-slate-50 transition-colors flex gap-3 items-start group cursor-pointer border-l-2',
                                                !notification.read_at
                                                    ? 'bg-teal-50 border-l-[#1B4D4F]'
                                                    : 'border-l-transparent'
                                            )}
                                        >
                                            {/* Unread dot */}
                                            <div
                                                className={clsx(
                                                    'w-2 h-2 rounded-full mt-2.5 flex-shrink-0',
                                                    !notification.read_at
                                                        ? 'bg-[var(--color-primary)]'
                                                        : 'bg-transparent'
                                                )}
                                            />

                                            {/* Type icon */}
                                            <div className="mt-0.5">
                                                {TYPE_ICON[notification.data.type] ?? TYPE_ICON['info']}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-4">
                                                    <h4
                                                        className={clsx(
                                                            'text-sm font-semibold truncate',
                                                            !notification.read_at
                                                                ? 'text-slate-900'
                                                                : 'text-slate-700'
                                                        )}
                                                    >
                                                        {notification.data.title}
                                                    </h4>
                                                    <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                                                        {formatDistanceToNow(new Date(notification.created_at), {
                                                            addSuffix: true,
                                                            locale: de,
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-0.5">
                                                    {notification.data.message}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                {!notification.read_at && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsReadMutation.mutate(notification.id);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
                                                        title={t('notifications.mark_as_read')}
                                                    >
                                                        <FaCheck className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteMutation.mutate(notification.id);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                    title={t('actions.delete')}
                                                >
                                                    <FaTrash className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
