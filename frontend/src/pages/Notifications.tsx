import { useState } from 'react';
import { FaBell, FaCheck, FaCheckDouble, FaTrash } from 'react-icons/fa';
import clsx from 'clsx';

// Mock data (should match what's in Navigation for consistency in a real app, 
// but for now we'll just duplicate or use a shared state management solution if we had one.
// Since we don't have a global store set up, I'll just create a standalone page layout.)

interface Notification {
    id: number;
    title: string;
    message: string;
    date: string;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
}

const initialNotifications: Notification[] = [
    { id: 1, title: 'Neue Rechnung bezahlt', message: 'Rechnung #2024-005 wurde von Kunde XY beglichen.', date: 'Vor 5 Min', read: false, type: 'success' },
    { id: 2, title: 'Übersetzung geliefert', message: 'Partner S. Müller hat Dateien für P-2024-1002 hochgeladen.', date: 'Vor 2 Std', read: false, type: 'info' },
    { id: 3, title: 'Neues Projekt erstellt', message: 'Projekt P-2024-1005 wurde erfolgreich angelegt.', date: 'Gestern', read: true, type: 'success' },
    { id: 4, title: 'Deadline nähert sich', message: 'Projekt P-2024-098 ist fällig in 2 Tagen.', date: 'Gestern', read: true, type: 'warning' },
    { id: 5, title: 'Systemwartung', message: 'Am Samstag findet eine geplante Wartung statt.', date: 'Vor 3 Tagen', read: true, type: 'info' },
];

const Notifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: number) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Benachrichtigungen</h1>
                <button
                    onClick={markAllAsRead}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-2 hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors"
                >
                    <FaCheckDouble /> Alle als gelesen markieren
                </button>
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
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={clsx(
                                    "p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start group",
                                    !notification.read ? "bg-brand-50/30" : ""
                                )}
                            >
                                <div className={clsx(
                                    "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                    !notification.read ? "bg-brand-500" : "bg-transparent"
                                )} />

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={clsx("text-sm font-semibold", !notification.read ? "text-slate-900" : "text-slate-700")}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">{notification.date}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full"
                                            title="Als gelesen markieren"
                                        >
                                            <FaCheck className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
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
