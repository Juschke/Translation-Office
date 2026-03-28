import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBell, FaSignOutAlt, FaChevronDown, FaUser, FaCog, FaUsers, FaCreditCard, FaEnvelope, FaHome, FaLayerGroup, FaUserTie, FaFileInvoiceDollar, FaChartBar, FaCalendarAlt, FaCommentDots, FaCrown, FaBuilding, FaDatabase, FaHistory, FaFileInvoice, FaGlobe, FaFileAlt, FaTag, FaRuler, FaMoneyBillWave, FaHashtag } from 'react-icons/fa';

import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

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




const Navigation = () => {
    const { t, i18n } = useTranslation();
    const { user, logout, hasMinRole } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isContactsOpen, setIsContactsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const contactsRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);

    const SETTINGS_TABS = [
        { id: 'company', label: t('settings.tabs.company'), icon: FaBuilding },
        { id: 'objects', label: t('settings.tabs.number_circles'), icon: FaHashtag },
        { id: 'invoice', label: t('settings.tabs.document_layout'), icon: FaFileInvoice },
        { id: 'master_data', label: t('settings.tabs.master_data'), icon: FaDatabase },
        { id: 'notifications', label: t('settings.tabs.notifications'), icon: FaBell },
        { id: 'audit', label: t('settings.tabs.audit'), icon: FaHistory },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contactsRef.current && !contactsRef.current.contains(event.target as Node)) {
                setIsContactsOpen(false);
            }
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setIsLangOpen(false);
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
        setIsContactsOpen(false);
        setIsSettingsOpen(false);
        setIsLangOpen(false);
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

    const navLinkClass = (path: string, activeOverride?: boolean) => clsx(
        "px-2 sm:px-3 py-4 text-sm font-semibold border-b-2 transition h-full flex items-center gap-1.5",
        (activeOverride !== undefined ? activeOverride : isActive(path))
            ? "border-white text-white"
            : "border-transparent text-emerald-100/60 hover:text-white"
    );

    const NavBadge = ({ count, label, activeColor = "bg-rose-500", isPriority = false, isMobile = false }: { count: number | undefined, label: string, activeColor?: string, isPriority?: boolean, isMobile?: boolean }) => {
        const displayCount = count || 0;
        return (
            <div className="relative group ml-1.5 flex items-center">
                <span className={clsx(
                    "text-xs w-5 h-5 flex items-center justify-center rounded-full font-semibold shadow-sm transition-all duration-300",
                    displayCount === 0
                        ? (isMobile ? "bg-brand-primary text-white" : "bg-white/10 text-white/50 group-hover:bg-white/20 text-white")
                        : `${activeColor} text-white`,
                    isPriority && displayCount > 0 && "animate-pulse ring-2 ring-rose-500/20"
                )}>
                    {displayCount}
                </span>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-2.5 py-1.5 bg-brand-primary text-white text-sm rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-white/10 backdrop-blur-sm transform -translate-y-1 group-hover:translate-y-0 hidden sm:block">
                    <div className="font-semibold">{label}</div>
                    <div className="text-xs text-white/70 mt-0.5">{displayCount} insgesamt</div>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-brand-primary"></span>
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
        <nav ref={navRef} className="bg-[#003333] text-white border-b border-white/10 flex-none sticky top-0 z-30 transition-all shadow-md">
            <div className="w-full px-4 sm:px-6">
                <div className="flex items-center justify-between h-12">
                    {/* Left Side: Logo + Main Menu */}
                    <div className="flex items-center h-full gap-4 lg:gap-6">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
                            <div className="bg-white w-8 h-8 rounded-sm flex items-center justify-center font-bold text-[#003333] shadow-sm">TO</div>
                            <span className="font-bold text-lg tracking-tight hidden lg:inline text-white">Translator Office</span>
                        </Link>

                        {/* Main Menu - Only Desktop */}
                        <TooltipProvider delayDuration={0}>
                            <div className="hidden space-x-1 h-full xl:flex">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link to="/" className={navLinkClass("/")}>
                                            <FaHome className="text-base lg:hidden" />
                                            <span className="hidden lg:inline">{t('nav.dashboard')}</span>
                                            <NavBadge count={dashboardData?.stats?.deadlines_today} label={t('nav.calendar')} activeColor="bg-rose-500" />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
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
                                            <span className="hidden lg:inline">{t('nav.projects')}</span>
                                            <NavBadge count={dashboardData?.stats?.open_projects} label={t('nav.projects')} activeColor="bg-rose-500" />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
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
                                        <Link to="/documents" className={navLinkClass("/documents")}>
                                            <FaFileAlt className="text-base lg:hidden" />
                                            <span className="hidden lg:inline">Dateien</span>
                                            {dashboardData?.stats?.total_files > 0 && (
                                                <NavBadge count={dashboardData.stats.total_files} label="Dateien" activeColor="bg-brand-primary" />
                                            )}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                                        <span className="font-semibold text-sm">Dateien</span>
                                    </TooltipContent>
                                </Tooltip>

                                <div className="relative h-full" ref={contactsRef}>
                                    <button
                                        onClick={() => {
                                            setIsContactsOpen(!isContactsOpen);
                                            setIsProfileOpen(false);
                                            setIsNotifOpen(false);
                                        }}
                                        className={navLinkClass("", isContactsOpen || location.pathname.startsWith('/customers') || location.pathname.startsWith('/partners') || location.pathname.startsWith('/interpreting'))}
                                    >
                                        <FaUsers className="text-base lg:hidden" />
                                        <span className="hidden lg:inline">{t('nav.contacts')}</span>
                                        <FaChevronDown className={clsx("text-[10px] ml-1 transition-transform opacity-60", isContactsOpen && "rotate-180")} />
                                    </button>

                                    {isContactsOpen && (
                                        <div className="absolute left-0 mt-0 w-48 bg-white rounded-sm shadow-xl border border-slate-200 z-50 text-slate-800 animate-slideUp overflow-hidden">
                                            <div className="py-1">
                                                <Link
                                                    to="/customers"
                                                    className={clsx(
                                                        "px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors",
                                                        location.pathname === '/customers' ? "text-brand-primary bg-slate-50" : "text-slate-700"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FaUsers className="text-slate-400 w-3.5 h-3.5" />
                                                        <span>{t('nav.customers')}</span>
                                                    </div>
                                                    {dashboardData?.stats?.active_customers > 0 && (
                                                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                                            {dashboardData.stats.active_customers}
                                                        </span>
                                                    )}
                                                </Link>

                                                <Link
                                                    to="/partners"
                                                    className={clsx(
                                                        "px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors",
                                                        location.pathname === '/partners' ? "text-brand-primary bg-slate-50" : "text-slate-700"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FaUserTie className="text-slate-400 w-3.5 h-3.5" />
                                                        <span>{t('nav.partners')}</span>
                                                    </div>
                                                    {dashboardData?.stats?.active_partners > 0 && (
                                                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                                            {dashboardData.stats.active_partners}
                                                        </span>
                                                    )}
                                                </Link>

                                                <Link
                                                    to="/interpreting"
                                                    className={clsx(
                                                        "px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors border-t border-slate-50",
                                                        location.pathname === '/interpreting' ? "text-brand-primary bg-slate-50" : "text-slate-700"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FaCommentDots className="text-slate-400 w-3.5 h-3.5" />
                                                        <span>Dolmetscher</span>
                                                    </div>
                                                    {dashboardData?.stats?.active_interpreting > 0 && (
                                                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                                            {dashboardData.stats.active_interpreting}
                                                        </span>
                                                    )}
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {hasMinRole('manager') && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link to="/invoices" className={navLinkClass("/invoices")}>
                                                <FaFileInvoiceDollar className="text-base lg:hidden" />
                                                <span className="hidden lg:inline">{t('nav.invoices')}</span>
                                                <NavBadge
                                                    count={dashboardData?.stats?.unpaid_invoices}
                                                    label={t('nav.invoices')}
                                                    activeColor={dashboardData?.stats?.overdue_invoices > 0 ? "bg-rose-600" : "bg-rose-400"}
                                                />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-sm">Rechnungen</span>
                                                {dashboardData?.stats?.unpaid_invoices > 0 && (
                                                    <div className={clsx("flex items-center gap-2 text-xs", dashboardData?.stats?.overdue_invoices > 0 ? "text-rose-400" : "text-slate-400")}>
                                                        <div className={clsx("w-1.5 h-1.5 rounded-full", dashboardData?.stats?.overdue_invoices > 0 ? "bg-rose-500" : "bg-slate-500")}></div>
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
                                                <span className="hidden lg:inline">{t('nav.inbox')}</span>
                                                <NavBadge count={unreadEmails} label={t('nav.inbox')} activeColor="bg-rose-500" />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
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

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link to="/calendar" className={navLinkClass("/calendar")}>
                                            <FaCalendarAlt className="text-base lg:hidden" />
                                            <span className="hidden lg:inline">Kalender</span>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                                        <span className="font-semibold text-sm">Kalender</span>
                                    </TooltipContent>
                                </Tooltip>

                                {hasMinRole('manager') && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link to="/reports" className={navLinkClass("/reports")}>
                                                <FaChartBar className="text-base lg:hidden" />
                                                <span className="hidden lg:inline">Auswertung</span>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                                            <span className="font-semibold text-sm">Auswertung</span>
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {hasMinRole('manager') && (
                                    <div className="relative h-full" ref={settingsRef}>
                                        <button
                                            onClick={() => {
                                                setIsSettingsOpen(!isSettingsOpen);
                                                setIsContactsOpen(false);
                                                setIsProfileOpen(false);
                                                setIsNotifOpen(false);
                                            }}
                                            className={navLinkClass("", isSettingsOpen || location.pathname.startsWith('/settings'))}
                                        >
                                            <FaCog className="text-base lg:hidden" />
                                            <span className="hidden lg:inline">Einstellungen</span>
                                            <FaChevronDown className={clsx("text-[10px] ml-1 transition-transform opacity-60", isSettingsOpen && "rotate-180")} />
                                        </button>

                                        {isSettingsOpen && (
                                            <div className="absolute right-0 mt-0 w-52 bg-white rounded-sm shadow-xl border border-slate-200 z-50 text-slate-800 animate-slideUp overflow-visible">
                                                <div className="py-1">
                                                    {SETTINGS_TABS.map((tab, i) => (
                                                        <div key={tab.id} className="relative group/tab">
                                                            <button
                                                                onClick={() => { navigate(`/settings?tab=${tab.id}`); setIsSettingsOpen(false); }}
                                                                className={clsx(
                                                                    "w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors text-left",
                                                                    i > 0 && tab.id === 'audit' && "border-t border-slate-100 mt-1",
                                                                    location.pathname === '/settings' && new URLSearchParams(location.search).get('tab') === tab.id
                                                                        ? "text-brand-primary bg-slate-50"
                                                                        : "text-slate-700"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <tab.icon className="text-slate-400 w-3.5 h-3.5" />
                                                                    <span>{tab.label}</span>
                                                                </div>
                                                                {tab.id === 'master_data' && (
                                                                    <FaChevronDown className="text-[10px] -rotate-90 opacity-80 ml-2 text-slate-400 group-hover/tab:text-brand-primary transition-colors" />
                                                                )}
                                                            </button>

                                                            {/* Sub-menu for Master Data on hover */}
                                                            {tab.id === 'master_data' && (
                                                                <div className="absolute left-full top-0 ml-[1px] w-52 bg-white rounded-sm shadow-xl border border-slate-200 z-50 text-slate-800 opacity-0 invisible group-hover/tab:opacity-100 group-hover/tab:visible transition-all duration-200 transform translate-x-2 group-hover/tab:translate-x-0">
                                                                    <div className="py-1">
                                                                        <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                                                                            {t('settings.tabs.master_data')}
                                                                        </div>
                                                                        {[
                                                                            { id: 'languages', label: t('settings.tabs.languages'), icon: FaGlobe },
                                                                            { id: 'doc_types', label: t('settings.tabs.doc_types'), icon: FaFileAlt },
                                                                            { id: 'services', label: t('settings.tabs.services'), icon: FaLayerGroup },
                                                                            { id: 'email_templates', label: t('settings.tabs.email_templates'), icon: FaEnvelope },
                                                                            { id: 'specializations', label: t('settings.tabs.specializations'), icon: FaTag },
                                                                            { id: 'units', label: t('settings.tabs.units'), icon: FaRuler },
                                                                            { id: 'currencies', label: t('settings.tabs.currencies'), icon: FaMoneyBillWave },
                                                                        ].map((subItem) => (
                                                                            <button
                                                                                key={subItem.id}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigate(`/settings?tab=master_data&sub=${subItem.id}`);
                                                                                    setIsSettingsOpen(false);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-sm font-medium flex items-center gap-3 hover:bg-slate-50 text-slate-600 hover:text-brand-primary transition-colors text-left"
                                                                            >
                                                                                <subItem.icon className="text-slate-400 w-3 h-3 group-hover/tab:text-brand-primary" />
                                                                                <span>{subItem.label}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TooltipProvider>
                    </div>

                    {/* Right Side: Language Switcher, Notifications, Profile & Mobile Menu */}
                    <div className="flex items-center gap-3 relative">
                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                className="text-emerald-100/60 hover:text-white focus:outline-none cursor-pointer flex items-center transition-colors"
                                onClick={(e) => { e.stopPropagation(); setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                            >
                                <FaBell className="w-5 h-5" />
                                <div className="absolute -top-1.5 -right-1.5">
                                    <NavBadge count={pendingNotifications} label="Neue Benachrichtigungen" activeColor="bg-rose-500" />
                                </div>
                            </button>

                            {/* Notification Dropdown */}
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-sm border border-brand-primary/10 z-50 text-brand-text origin-top-right animate-slideUp">
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
                                            onClick={() => setIsNotifOpen(false)}
                                        >
                                            Alle anzeigen
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Language Switcher */}
                        <div className="hidden sm:flex items-center mr-1" ref={langRef}>
                            <button
                                onClick={() => {
                                    setIsLangOpen(!isLangOpen);
                                    setIsNotifOpen(false);
                                    setIsProfileOpen(false);
                                }}
                                className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                            >
                                <FaGlobe className="text-emerald-100/60 group-hover:text-white transition-colors text-lg" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/60 group-hover:text-emerald-100 transition-colors">
                                    {i18n.language === 'de' ? 'DE' : 'EN'}
                                </span>
                                <FaChevronDown className={clsx("text-[10px] text-emerald-100/40 transition-transform group-hover:text-emerald-100/60", isLangOpen && "rotate-180")} />
                            </button>

                            {/* Language Dropdown */}
                            {isLangOpen && (
                                <div className="absolute right-0 mt-2 top-full w-36 bg-white rounded-sm shadow-xl border border-slate-200 z-50 text-slate-800 animate-slideUp overflow-hidden origin-top-right">
                                    <div className="py-1">
                                        {[
                                            { code: 'de', label: 'Deutsch' },
                                            { code: 'en', label: 'Englisch' }
                                        ].map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    i18n.changeLanguage(lang.code);
                                                    localStorage.setItem('locale', lang.code);
                                                    setIsLangOpen(false);
                                                }}
                                                className={clsx(
                                                    "w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors text-left",
                                                    i18n.language === lang.code ? "text-brand-primary bg-slate-50 font-bold" : "text-slate-700"
                                                )}
                                            >
                                                <span>{lang.label}</span>
                                                {i18n.language === lang.code && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Menu */}
                        <div className="relative" ref={profileRef}>
                            <div
                                className="flex items-center gap-2 cursor-pointer focus:outline-none group"
                                onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                            >
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] border border-white/10 text-white font-bold uppercase shadow-sm group-hover:bg-emerald-400 group-hover:text-emerald-950 transition-all">
                                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                </div>
                                <FaChevronDown className={clsx("text-xs text-emerald-100/40 transition-transform", isProfileOpen && "rotate-180")} />
                            </div>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-sm shadow-sm border border-slate-200 z-50 text-slate-800 origin-top-right animate-slideUp">
                                    <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-sm uppercase">
                                            {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                        </div>
                                        <div className="overflow-hidden text-left">
                                            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'Benutzer'}</p>
                                            {user?.role && (
                                                <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full mt-1 uppercase tracking-wider">
                                                    {t(`settings.roles.${user.role}`) ?? user.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="py-1 font-normal text-left">
                                        <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                            <FaUser className="mr-3 text-slate-400 w-3.5 h-3.5" /> {t('nav.profile')}
                                        </Link>
                                        {hasMinRole('owner') && (
                                            <Link to="/team" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                                <FaUsers className="mr-3 text-slate-400 w-3.5 h-3.5" /> {t('nav.team')}
                                            </Link>
                                        )}
                                        {hasMinRole('owner') && (
                                            <Link to="/billing" className="block px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center" onClick={() => setIsProfileOpen(false)}>
                                                <FaCreditCard className="mr-3 text-slate-400 w-3.5 h-3.5" /> {t('nav.subscription')}
                                            </Link>
                                        )}
                                        {user?.is_admin && (
                                            <a href="/admin" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-amber-50 text-amber-700 flex items-center border-t border-slate-50 mt-1" onClick={() => setIsProfileOpen(false)}>
                                                <FaCrown className="mr-3 text-amber-500 w-3.5 h-3.5" /> Backend: Filament
                                            </a>
                                        )}
                                    </div>
                                    <div className="border-t border-slate-100 py-1 font-normal text-left">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center cursor-pointer"
                                        >
                                            <FaSignOutAlt className="mr-3" /> {t('nav.logout')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button — right side */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-white hover:text-emerald-400 xl:hidden"
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
                <div className="bg-white border-t border-brand-border animate-slideDown shadow-lg">
                    <div className="px-4 py-3 space-y-1">
                        {[
                            { path: '/', label: 'Dashboard', icon: <FaHome />, count: dashboardData?.stats?.deadlines_today, badgeLabel: "Termine Heute" },
                            { path: '/projects', label: 'Projekte', icon: <FaLayerGroup />, count: dashboardData?.stats?.open_projects, badgeLabel: "Offene Projekte" },
                            { path: '/documents', label: 'Dateien', icon: <FaFileAlt />, count: dashboardData?.stats?.total_files, badgeLabel: "Dateien Gesamt" },
                            { path: '/customers', label: 'Kunden', icon: <FaUsers />, count: dashboardData?.stats?.active_customers, badgeLabel: "Aktive Kunden", color: "bg-slate-500" },
                            { path: '/partners', label: 'Partner', icon: <FaUserTie />, count: dashboardData?.stats?.active_partners, badgeLabel: "Aktive Partner", color: "bg-slate-500" },
                            { path: '/interpreting', label: 'Dolmetscher', icon: <FaCommentDots />, count: dashboardData?.stats?.active_interpreting, badgeLabel: "Anstehende Einsätze", color: "bg-slate-500" },
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
                            { path: '/calendar', label: 'Kalender', icon: <FaCalendarAlt /> },
                            { path: '/reports', label: 'Auswertung', icon: <FaChartBar />, role: 'manager' },
                        ].map((item: any) => {
                            if (item.role && !hasMinRole(item.role)) return null;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx(
                                        "px-2.5 py-1.5 rounded-sm text-sm font-semibold flex items-center justify-between transition-colors",
                                        active
                                            ? "bg-brand-primary/5 text-brand-primary"
                                            : "text-brand-muted hover:bg-brand-bg hover:text-brand-primary"
                                    )}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={clsx("text-base", active ? "text-brand-primary" : "text-brand-muted")}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </div>
                                    {item.count !== undefined && (
                                        <NavBadge count={item.count} label={item.badgeLabel || ""} activeColor={item.color} isMobile={true} />
                                    )}
                                </Link>
                            );
                        })}

                        {/* Mobile Language Switcher */}
                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between px-2.5">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('profile.language')}</span>
                            <div className="flex gap-2">
                                {['de', 'en'].map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            i18n.changeLanguage(lang);
                                            localStorage.setItem('locale', lang);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={clsx(
                                            "flex items-center justify-center min-w-[3.5rem] py-2 rounded-sm border text-[10px] font-bold uppercase transition-all shadow-sm",
                                            i18n.language === lang
                                                ? "bg-brand-primary text-white border-brand-primary"
                                                : "bg-white text-slate-600 border-slate-200"
                                        )}
                                    >
                                        {lang === 'de' ? 'Deutsch' : 'Englisch'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>

    );
};

export default Navigation;
