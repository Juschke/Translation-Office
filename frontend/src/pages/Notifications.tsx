import { FaBell, FaCheck, FaCheckDouble, FaTrash } from 'react-icons/fa';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../api/services';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface NotificationData {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

interface Notification {
    id: string;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
}

const Notifications = () => {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationService.getAll
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationService.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Alle Benachrichtigungen wurden als gelesen markiert.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: notificationService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Benachrichtigungen</h1>
                {notifications.length > 0 && notifications.some((n: Notification) => !n.read_at) && (
                    <button
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-2 hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <FaCheckDouble /> Alle als gelesen markieren
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <FaBell className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Keine Benachrichtigungen</h3>
                        <p>Sie sind auf dem neuesten Stand!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notification: Notification) => (
                            <div
                                key={notification.id}
                                className={clsx(
                                    "p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start group",
                                    !notification.read_at ? "bg-brand-50/30" : ""
                                )}
                            >
                                <div className={clsx(
                                    "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                    !notification.read_at ? "bg-brand-500" : "bg-transparent"
                                )} />

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={clsx("text-sm font-semibold", !notification.read_at ? "text-slate-900" : "text-slate-700")}>
                                            {notification.data.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: de })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{notification.data.message}</p>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notification.read_at && (
                                        <button
                                            onClick={() => markAsReadMutation.mutate(notification.id)}
                                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full"
                                            title="Als gelesen markieren"
                                        >
                                            <FaCheck className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteMutation.mutate(notification.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                        title="Löschen"
                                    >
                                        <FaTrash className="w-3.5 h-3.5" />
                                    </button>
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
