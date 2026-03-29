import { Link } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import NavBadge from './NavBadge';

interface NotificationDropdownProps {
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    notifications: any[];
    pendingNotifications: number;
    onMarkAllRead: () => void;
    onNotificationClick: (n: any) => void;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
}

const NotificationDropdown = ({
    isOpen,
    onToggle,
    notifications,
    pendingNotifications,
    onMarkAllRead,
    onNotificationClick,
    dropdownRef
}: NotificationDropdownProps) => {
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="text-emerald-100/60 hover:text-white focus:outline-none cursor-pointer flex items-center transition-colors"
                onClick={onToggle}
            >
                <FaBell className="w-5 h-5" />
                <div className="absolute -top-1.5 -right-1.5">
                    <NavBadge count={pendingNotifications} label="Neue Benachrichtigungen" activeColor="bg-rose-500" />
                </div>
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-sm border border-brand-primary/10 z-50 text-brand-text origin-top-right animate-slideUp">
                    <div className="p-3 border-b border-slate-100 font-semibold text-sm flex justify-between">
                        <span>Benachrichtigungen</span>
                        <button
                            onClick={onMarkAllRead}
                            className="text-xs text-slate-700 hover:underline disabled:text-slate-400 cursor-pointer font-medium"
                            disabled={pendingNotifications === 0}
                        >
                            Alle als gelesen
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar font-normal">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">Keine Benachrichtigungen</div>
                        ) : (
                            notifications.map((n: any) => (
                                <div
                                    key={n.id}
                                    onClick={() => onNotificationClick(n)}
                                    className={clsx("block p-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer text-left", !n.read_at ? "bg-transparent" : "")}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-xs text-slate-400">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                                        </div>
                                        {!n.read_at && <div className="w-2 h-2 rounded-full bg-brand-primary"></div>}
                                    </div>
                                    <p className={clsx("text-sm", !n.read_at ? "font-semibold" : "font-medium")}>{n.data.title}</p>
                                    <p className="text-xs text-slate-500 line-clamp-2">{n.data.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-2 text-center border-t border-slate-100">
                        <Link
                            to="/notifications"
                            className="text-xs font-medium text-slate-900 hover:underline block w-full"
                        >
                            Alle anzeigen
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
