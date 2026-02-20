import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBell, FaSignOutAlt, FaChevronDown, FaUser, FaCog, FaUsers, FaCreditCard, FaEnvelope, FaHome, FaLayerGroup, FaUserTie, FaFileInvoiceDollar, FaChartBar } from 'react-icons/fa';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, notificationService } from '../api/services';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";

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
    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
            // Close mobile menu when clicking outside the whole navigation bar
            if (isMobileMenuOpen && navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    // Close all menus when navigation occurs
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
        setIsNotifOpen(false);
    }, [location]);

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
        "px-2 sm:px-3 py-4 text-sm font-medium border-b-2 transition h-full flex items-center gap-2",
        isActive(path)
            ? "border-white text-white"
            : "border-transparent text-slate-400 hover:text-white"
    );

    const NavBadge = ({ count, label, activeColor = "bg-rose-500", isPriority = false }: { count: number | undefined, label: string, activeColor?: string, isPriority?: boolean }) => {
        const displayCount = count || 0;
        return (
            <div className="relative group ml-1.5 flex items-center">
                <span className={clsx(
                    "text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-semibold shadow-sm transition-all duration-300",
                    displayCount === 0 ? "bg-slate-700/50 text-slate-400 group-hover:bg-slate-600" : activeColor,
                    isPriority && displayCount > 0 && "animate-pulse ring-2 ring-rose-500/20"
                )}>
                    {displayCount}
                </span>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-2.5 py-1.5 bg-slate-900/95 text-white text-sm rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm border border-slate-700/50 backdrop-blur-sm transform -translate-y-1 group-hover:translate-y-0">
                    <div className="font-semibold">{label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{displayCount} insgesamt</div>
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
        <nav ref={navRef} className="bg-slate-900 text-white shadow-sm z-30 flex-none relative">
            <div className="w-full px-4 sm:px-6">
                <div className="flex items-center justify-between h-12">
                    {/* Left Side: Logo + Main Menu */}
                    <div className="flex items-center h-full gap-4 lg:gap-6">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
                            <div className="bg-slate-700 w-8 h-8 rounded-sm flex items-center justify-center font-semibold text-white">TO</div>
                            <span className="font-semibold text-lg tracking-tight hidden lg:inline">Translator Office</span>
                        </Link>

                        {/* Main Menu - Only Desktop */}
                        <TooltipProvider delayDuration={0}>
                            <div className="hidden lg:flex space-x-1 h-full">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link to="/" className={navLinkClass("/")}>
                                            <FaHome className="text-base lg:hidden" />
                                            <span className="hidden lg:inline">Dashboard</span>
                                            <NavBadge count={dashboardData?.stats?.deadlines_today} label="Termine Heute" activeColor="bg-rose-500" />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[100] bg-slate-900 text-white border-slate-700 shadow-xl lg:hidden">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-sm">Dashboard</span>
                                            {dashboardData?.stats?.deadlines_today > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-rose-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                                    {dashboardData?.stats?.deadlines_today} Termine Heute
                                                </div>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link to="/projects" className={navLinkClass("/projects")}>
                                            <FaLayerGroup className="text-base lg:hidden" />
                                            <span className="hidden lg:inline">Projekte</span>
                                            <NavBadge count={dashboardData?.stats?.open_projects} label="Offene Projekte" activeColor="bg-rose-500" />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[100] bg-slate-900 text-white border-slate-700 shadow-xl lg:hidden">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-sm">Projekte</span>
                                            {dashboardData?.stats?.open_projects > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                                    {dashboardData?.stats?.open_projects} offene Projekte
                                                </div>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link to="/customers" className={navLinkClass("/customers")}>
                                            <FaUsers className="text-base lg:hidden" />
                                            <span className="hidden lg:inline">Kunden</span>
                                            <NavBadge count={dashboardData?.stats?.active_customers} label="Aktive Kunden" activeColor="bg-slate-500" />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[100] bg-slate-900 text-white border-slate-700 shadow-xl lg:hidden">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-sm">Kunden</span>
                                            {dashboardData?.stats?.active_customers > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                                    {dashboardData?.stats?.active_customers} aktive Kunden
                                                </div>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link to="/partners" className={navLinkClass("/partners")}>
                                            <FaUserTie className="text-base lg:hidden" />
                                            <span className="hidden lg:inline">Partner</span>
                                            <NavBadge count={dashboardData?.stats?.active_partners} label="Aktive Partner" activeColor="bg-slate-500" />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[100] bg-slate-900 text-white border-slate-700 shadow-xl lg:hidden">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-sm">Partner</span>
                                            {dashboardData?.stats?.active_partners > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                                    {dashboardData?.stats?.active_partners} aktive Partner
                                                </div>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>

                                {hasMinRole('manager') && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link to="/invoices" className={navLinkClass("/invoices")}>
                                                <FaFileInvoiceDollar className="text-base lg:hidden" />
                                                <span className="hidden lg:inline">Rechnungen</span>
                                                <NavBadge
                                                    count={dashboardData?.stats?.unpaid_invoices}
                                                    label="Offene Rechnungen"
                                                    activeColor={dashboardData?.stats?.overdue_invoices > 0 ? "bg-rose-600" : "bg-rose-400"}
                                                    isPriority={dashboardData?.stats?.overdue_invoices > 0}
                                                />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent className="z-[100] bg-slate-900 text-white border-slate-700 shadow-xl lg:hidden">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-sm">Rechnungen</span>
                                                {dashboardData?.stats?.unpaid_invoices > 0 && (
                                                    <div className={clsx("flex items-center gap-2 text-xs", dashboardData?.stats?.overdue_invoices > 0 ? "text-rose-400" : "text-slate-400")}>
                                                        <div className={clsx("w-1.5 h-1.5 rounded-full", dashboardData?.stats?.overdue_invoices > 0 ? "bg-rose-500 animate-pulse" : "bg-slate-500")}></div>
                                                        {dashboardData?.stats?.unpaid_invoices} offene Rechnungen
                                                        {dashboardData?.stats?.overdue_invoices > 0 && ` (${dashboardData.stats.overdue_invoices} überfällig)`}
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {hasMinRole('manager') && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link to="/inbox" className={navLinkClass("/inbox")}>
                                                <FaEnvelope className="text-base lg:hidden" />
                                                <span className="hidden lg:inline">Email</span>
                                                <NavBadge count={unreadEmails} label="Ungelesene E-Mails" activeColor="bg-rose-500" />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent className="z-[100] bg-slate-900 text-white border-slate-700 shadow-xl lg:hidden">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-sm">Email</span>
                                                {unreadEmails > 0 && (
                                                    <div className="flex items-center gap-2 text-xs text-rose-400">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                                        {unreadEmails} ungelesene Emails
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {hasMinRole('manager') && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link to="/reports" className={navLinkClass("/reports")}>
                                                <FaChartBar className="text-base lg:hidden" />
                                                <span className="hidden lg:inline">Auswertung</span>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent className="z-[100] bg-slate-900 text-white border-slate-700 shadow-xl lg:hidden">
                                            <span className="font-semibold text-sm">Auswertung</span>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </TooltipProvider>
                    </div>

                    {/* Right Side: Notifications, Profile & Mobile Menu */}
                    <div className="flex items-center gap-3 relative">
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
                                                    onClick={() => handleNotificationClick(n)}
                                                    className={clsx("block p-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer text-left", !n.read_at ? "bg-transparent" : "")}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="text-xs text-slate-400">
                                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                                                        </div>
                                                        {!n.read_at && <div className="w-2 h-2 rounded-full bg-slate-700"></div>}
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
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[11px] border border-slate-700 text-white font-bold uppercase shadow-sm">
                                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                </div>
                                <FaChevronDown className={clsx("text-xs text-slate-500 transition-transform", isProfileOpen && "rotate-180")} />
                            </div>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-sm shadow-sm border border-slate-200 z-50 text-slate-800 origin-top-right animate-slideUp">
                                    <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-sm uppercase">
                                            {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                        </div>
                                        <div className="overflow-hidden text-left">
                                            <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Benutzer'}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <FaEnvelope className="text-[10px] text-slate-400 shrink-0" />
                                                <p className="text-[10px] text-slate-500 truncate leading-tight">{user?.email || 'admin@translator.office'}</p>
                                            </div>
                                            {user?.role && (
                                                <span className="inline-block px-1.5 py-0 px-1.5 py-0 bg-slate-200 text-slate-700 text-[9px] font-bold rounded-full mt-1.5 uppercase tracking-wider">
                                                    {ROLE_LABELS[user.role] ?? user.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="py-1 font-normal text-left">
                                        <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                            <FaUser className="mr-3 text-slate-400 w-3.5 h-3.5" /> Profil
                                        </Link>
                                        {hasMinRole('owner') && (
                                            <Link to="/team" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                                <FaUsers className="mr-3 text-slate-400 w-3.5 h-3.5" /> Mitarbeiter
                                            </Link>
                                        )}
                                        {hasMinRole('owner') && (
                                            <Link to="/billing" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                                <FaCreditCard className="mr-3 text-slate-400 w-3.5 h-3.5" /> Abonnement
                                            </Link>
                                        )}
                                        {hasMinRole('manager') && (
                                            <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center border-t border-slate-50 mt-1" onClick={() => setIsProfileOpen(false)}>
                                                <FaCog className="mr-3 text-slate-400 w-3.5 h-3.5" /> Einstellungen
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

                        {/* Mobile Menu Button — right side */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 lg:hidden text-slate-400 hover:text-white"
                        >
                            <div className="w-5 h-4 flex flex-col justify-between">
                                <span className={clsx("h-0.5 bg-current transition-all", isMobileMenuOpen ? "rotate-45 translate-y-1.5" : "")}></span>
                                <span className={clsx("h-0.5 bg-current transition-all", isMobileMenuOpen ? "opacity-0" : "")}></span>
                                <span className={clsx("h-0.5 bg-current transition-all", isMobileMenuOpen ? "-rotate-45 -translate-y-2" : "")}></span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-slate-900 border-t border-slate-800 animate-slideDown">
                    <div className="px-4 py-3 space-y-1">
                        {[
                            { path: '/', label: 'Dashboard', icon: <FaHome />, count: dashboardData?.stats?.deadlines_today, badgeLabel: "Termine Heute" },
                            { path: '/projects', label: 'Projekte', icon: <FaLayerGroup />, count: dashboardData?.stats?.open_projects, badgeLabel: "Offene Projekte" },
                            { path: '/customers', label: 'Kunden', icon: <FaUsers />, count: dashboardData?.stats?.active_customers, badgeLabel: "Aktive Kunden", color: "bg-slate-500" },
                            { path: '/partners', label: 'Partner', icon: <FaUserTie />, count: dashboardData?.stats?.active_partners, badgeLabel: "Aktive Partner", color: "bg-slate-500" },
                            {
                                path: '/invoices',
                                label: 'Rechnungen',
                                icon: <FaFileInvoiceDollar />,
                                role: 'manager',
                                count: dashboardData?.stats?.unpaid_invoices,
                                badgeLabel: "Offene Rechnungen",
                                color: dashboardData?.stats?.overdue_invoices > 0 ? "bg-rose-600" : "bg-rose-400"
                            },
                            { path: '/inbox', label: 'Email', icon: <FaEnvelope />, role: 'manager', count: unreadEmails, badgeLabel: "Ungelesene E-Mails" },
                            { path: '/reports', label: 'Auswertung', icon: <FaChartBar />, role: 'manager' },
                        ].map((item) => {
                            if (item.role && !hasMinRole(item.role)) return null;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx(
                                        "px-3 py-2.5 rounded-sm text-base font-medium flex items-center justify-between transition-colors",
                                        active
                                            ? "bg-slate-800 text-white border-l-2 border-white pl-2.5"
                                            : "text-slate-400 hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent"
                                    )}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={clsx("text-lg", active ? "text-white" : "text-slate-500")}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </div>
                                    {item.count !== undefined && (
                                        <NavBadge count={item.count} label={item.badgeLabel || ""} activeColor={item.color} />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navigation;
