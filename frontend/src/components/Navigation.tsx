import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBell, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, notificationService } from '../api/services';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const ROLE_LABELS: Record<string, string> = {
    owner: 'Inhaber',
    manager: 'Manager',
    employee: 'Mitarbeiter',
};

const Navigation = () => {
    const { user, logout, hasMinRole } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { data: dashboardData } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: dashboardService.getStats,
        refetchInterval: 10000, // Refetch every 10 seconds for live updates
    });

    const unreadEmails = dashboardData?.stats?.unread_emails || 0;

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationService.getAll,
        refetchInterval: 10000, // Refetch every 10 seconds for "dynamic" feel
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationService.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const handleNotificationClick = (notification: any) => {
        if (!notification.read_at) {
            markAsReadMutation.mutate(notification.id);
        }

        if (notification.data?.project_id) {
            navigate(`/projects/${notification.data.project_id}`);
            setIsNotifOpen(false);
        }
    };

    const pendingNotifications = notifications.filter((n: any) => !n.read_at).length;

    const isActive = (path: string) => location.pathname === path;

    const navLinkClass = (path: string) => clsx(
        "px-3 py-4 text-sm font-medium border-b-2 transition h-full flex items-center",
        isActive(path)
            ? "border-brand-500 text-white bg-brand-800/50"
            : "border-transparent text-slate-200 hover:bg-brand-800 hover:text-white"
    );

    const NavBadge = ({ count, label, activeColor = "bg-rose-500", isPriority = false }: { count: number | undefined, label: string, activeColor?: string, isPriority?: boolean }) => {
        const displayCount = count || 0;
        return (
            <div className="relative group ml-1.5 flex items-center">
                <span className={clsx(
                    "text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-semibold shadow-sm transition-all duration-300",
                    displayCount === 0 ? "bg-slate-700/50 text-slate-400 group-hover:bg-slate-600" : activeColor,
                    isPriority && displayCount > 0 && "animate-pulse ring-2 ring-rose-500/20"
                )}>
                    {displayCount}
                </span>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-2.5 py-1.5 bg-slate-900/95 text-white text-[11px] rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm border border-slate-700/50 backdrop-blur-sm transform -translate-y-1 group-hover:translate-y-0">
                    <div className="font-semibold">{label}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{displayCount} insgesamt</div>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-slate-900/95"></span>
                </div>
            </div>
        );
    };

    const handleMarkAllRead = () => {
        markAllAsReadMutation.mutate();
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="bg-brand-900 text-white shadow-sm z-30 flex-none relative">
            <div className="w-full px-4 sm:px-6">
                <div className="flex items-center justify-between h-14">
                    {/* Left Side: Logo + Main Menu */}
                    <div className="flex items-center h-full gap-4 lg:gap-8">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 xl:hidden text-slate-300 hover:text-white"
                        >
                            <div className="w-5 h-4 flex flex-col justify-between">
                                <span className={clsx("h-0.5 bg-current transition-all", isMobileMenuOpen ? "rotate-45 translate-y-1.5" : "")}></span>
                                <span className={clsx("h-0.5 bg-current transition-all", isMobileMenuOpen ? "opacity-0" : "")}></span>
                                <span className={clsx("h-0.5 bg-current transition-all", isMobileMenuOpen ? "-rotate-45 -translate-y-2" : "")}></span>
                            </div>
                        </button>
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
                            <div className="bg-brand-500 w-8 h-8 rounded-sm flex items-center justify-center font-semibold text-white">TO</div>
                            <span className="font-semibold text-lg tracking-tight">Translator Office</span>
                        </Link>

                        {/* Main Menu */}
                        <div className="hidden xl:flex space-x-1 h-full">
                            <Link to="/" className={navLinkClass("/")}>
                                Dashboard
                                <NavBadge count={dashboardData?.stats?.deadlines_today} label="Termine Heute" activeColor="bg-rose-500" />
                            </Link>

                            <Link to="/projects" className={navLinkClass("/projects")}>
                                Projekte
                                <NavBadge count={dashboardData?.stats?.open_projects} label="Offene Projekte" activeColor="bg-rose-500" />
                            </Link>

                            <Link to="/customers" className={navLinkClass("/customers")}>
                                Kunden
                                <NavBadge count={dashboardData?.stats?.active_customers} label="Aktive Kunden" activeColor="bg-brand-400" />
                            </Link>

                            <Link to="/partners" className={navLinkClass("/partners")}>
                                Partner
                                <NavBadge count={dashboardData?.stats?.active_partners} label="Aktive Partner" activeColor="bg-brand-400" />
                            </Link>

                            {hasMinRole('manager') && (
                                <Link to="/invoices" className={navLinkClass("/invoices")}>
                                    Rechnungen
                                    <NavBadge
                                        count={dashboardData?.stats?.unpaid_invoices}
                                        label="Offene Rechnungen"
                                        activeColor={dashboardData?.stats?.overdue_invoices > 0 ? "bg-rose-600" : "bg-rose-400"}
                                        isPriority={dashboardData?.stats?.overdue_invoices > 0}
                                    />
                                </Link>
                            )}

                            {hasMinRole('manager') && (
                                <Link to="/inbox" className={navLinkClass("/inbox")}>
                                    Email
                                    <NavBadge count={unreadEmails} label="Ungelesene E-Mails" activeColor="bg-rose-500" />
                                </Link>
                            )}

                            {hasMinRole('manager') && (
                                <Link to="/reports" className={navLinkClass("/reports")}>Auswertung</Link>
                            )}
                        </div>
                    </div>

                    {/* User Profile & Notifications */}
                    <div className="flex items-center gap-4 relative">
                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                className="text-slate-300 hover:text-white focus:outline-none cursor-pointer flex items-center"
                                onClick={(e) => { e.stopPropagation(); setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                            >
                                <FaBell className="w-5 h-5" />
                                <div className="absolute -top-1.5 -right-1.5">
                                    <NavBadge count={pendingNotifications} label="Neue Benachrichtigungen" activeColor="bg-rose-500" />
                                </div>
                            </button>

                            {/* Notification Dropdown */}
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-sm shadow-sm border border-slate-200 z-50 text-slate-800 origin-top-right animate-slideUp">
                                    <div className="p-3 border-b border-slate-100 font-semibold text-sm flex justify-between">
                                        <span>Benachrichtigungen</span>
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs text-brand-600 hover:underline disabled:text-slate-400 cursor-pointer font-medium"
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
                                                    onClick={() => handleNotificationClick(n)}
                                                    className={clsx("block p-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer text-left", !n.read_at ? "bg-brand-50/50" : "")}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="text-xs text-slate-400">
                                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                                                        </div>
                                                        {!n.read_at && <div className="w-2 h-2 rounded-full bg-brand-500"></div>}
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
                                            className="text-xs font-medium text-brand-700 hover:underline block w-full"
                                            onClick={() => setIsNotifOpen(false)}
                                        >
                                            Alle anzeigen
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Menu */}
                        <div className="relative" ref={profileRef}>
                            <div
                                className="flex items-center gap-2 cursor-pointer focus:outline-none"
                                onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                            >
                                <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs border border-brand-500 text-white font-semibold">
                                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                                </div>
                                <div className="hidden lg:block text-left">
                                    <span className="text-sm text-slate-200 block leading-tight">{user?.name || 'Benutzer'}</span>
                                    {user?.role && (
                                        <span className="text-[10px] text-slate-400 leading-tight block">
                                            {ROLE_LABELS[user.role] ?? user.role}
                                        </span>
                                    )}
                                </div>
                                <FaChevronDown className={clsx("text-xs text-slate-400 transition-transform", isProfileOpen && "rotate-180")} />
                            </div>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl border border-slate-200 z-50 text-slate-800 origin-top-right animate-slideUp">
                                    <div className="p-3 border-b border-slate-100 font-normal text-left">
                                        <p className="text-sm font-semibold">{user?.name || 'Benutzer'}</p>
                                        <p className="text-xs text-slate-500">{user?.email || 'admin@translator.office'}</p>
                                        {user?.role && (
                                            <p className="text-[11px] text-brand-600 font-medium mt-0.5">{ROLE_LABELS[user.role] ?? user.role}</p>
                                        )}
                                    </div>
                                    <div className="py-1 font-normal text-left">
                                        <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                            Profil
                                        </Link>
                                        {hasMinRole('manager') && (
                                            <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                                Einstellungen
                                            </Link>
                                        )}
                                        {hasMinRole('owner') && (
                                            <Link to="/team" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                                Mitarbeiter
                                            </Link>
                                        )}
                                        {hasMinRole('owner') && (
                                            <Link to="/billing" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                                Abonnement
                                            </Link>
                                        )}
                                    </div>
                                    <div className="border-t border-slate-100 py-1 font-normal text-left">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center cursor-pointer"
                                        >
                                            <FaSignOutAlt className="mr-3" /> Log out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="xl:hidden bg-brand-900 border-t border-brand-800">
                    <div className="px-4 py-3 space-y-1">
                        <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-brand-800 hover:text-white flex items-center justify-between" onClick={() => setIsMobileMenuOpen(false)}>
                            Dashboard
                            <NavBadge count={dashboardData?.stats?.deadlines_today} label="Termine Heute" activeColor="bg-rose-500" />
                        </Link>
                        <Link to="/projects" className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-brand-800 hover:text-white flex items-center justify-between" onClick={() => setIsMobileMenuOpen(false)}>
                            Projekte
                            <NavBadge count={dashboardData?.stats?.open_projects} label="Offene Projekte" activeColor="bg-rose-500" />
                        </Link>
                        <Link to="/customers" className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-brand-800 hover:text-white flex items-center justify-between" onClick={() => setIsMobileMenuOpen(false)}>
                            Kunden
                            <NavBadge count={dashboardData?.stats?.active_customers} label="Aktive Kunden" activeColor="bg-brand-400" />
                        </Link>
                        <Link to="/partners" className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-brand-800 hover:text-white flex items-center justify-between" onClick={() => setIsMobileMenuOpen(false)}>
                            Partner
                            <NavBadge count={dashboardData?.stats?.active_partners} label="Aktive Partner" activeColor="bg-brand-400" />
                        </Link>
                        {hasMinRole('manager') && (
                            <Link to="/invoices" className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-brand-800 hover:text-white flex items-center justify-between" onClick={() => setIsMobileMenuOpen(false)}>
                                Rechnungen
                                <NavBadge
                                    count={dashboardData?.stats?.unpaid_invoices}
                                    label="Offene Rechnungen"
                                    activeColor={dashboardData?.stats?.overdue_invoices > 0 ? "bg-rose-600" : "bg-rose-400"}
                                    isPriority={dashboardData?.stats?.overdue_invoices > 0}
                                />
                            </Link>
                        )}
                        {hasMinRole('manager') && (
                            <Link to="/inbox" className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-brand-800 hover:text-white flex items-center justify-between" onClick={() => setIsMobileMenuOpen(false)}>
                                Email
                                <NavBadge count={unreadEmails} label="Ungelesene E-Mails" activeColor="bg-rose-500" />
                            </Link>
                        )}
                        {hasMinRole('manager') && (
                            <Link to="/reports" className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-brand-800 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>Auswertung</Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navigation;
