import { Link } from 'react-router-dom';
import {
    FaHome, FaLayerGroup, FaUsers, FaUserTie,
    FaCommentDots, FaFileInvoiceDollar, FaEnvelope, FaCalendarAlt,
    FaChartBar, FaCog, FaChevronDown, FaBuilding, FaHashtag,
    FaFileInvoice, FaDatabase, FaBell, FaHistory,
    FaInbox, FaFileContract, FaAddressBook
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";
import NavBadge from './NavBadge';

import type { UserRole } from '../../context/AuthContext';

interface DesktopLinksProps {
    location: any;
    dashboardData: any;
    unreadEmails: number;
    hasMinRole: (role: UserRole) => boolean;
    isContactsOpen: boolean;
    setIsContactsOpen: (open: boolean) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (open: boolean) => void;
    contactsRef: React.RefObject<HTMLDivElement | null>;
    settingsRef: React.RefObject<HTMLDivElement | null>;
    navigate: (path: string) => void;
    setIsProfileOpen: (open: boolean) => void;
    setIsNotifOpen: (open: boolean) => void;
}

const DesktopLinks = ({
    location,
    dashboardData,
    unreadEmails,
    hasMinRole,
    isContactsOpen,
    setIsContactsOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    contactsRef,
    settingsRef,
    navigate,
    setIsProfileOpen,
    setIsNotifOpen
}: DesktopLinksProps) => {
    const { t } = useTranslation();

    const isActive = (path: string) => location.pathname === path;
    const isStartsWith = (path: string) => location.pathname.startsWith(path);

    const navLinkClass = (path: string, activeOverride?: boolean) => clsx(
        "px-2 sm:px-2.5 py-4 text-[13px] font-semibold border-b-2 transition h-full flex items-center gap-1.5",
        (activeOverride !== undefined ? activeOverride : isActive(path))
            ? "border-white text-white"
            : "border-transparent text-emerald-100/60 hover:text-white"
    );

    const closeAllDropdowns = () => {
        setIsContactsOpen(false);
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        setIsNotifOpen(false);
    };

    const SETTINGS_TABS = [
        { id: 'company', label: t('settings.tabs.company'), icon: FaBuilding },
        { id: 'objects', label: t('settings.tabs.number_circles'), icon: FaHashtag },
        { id: 'invoice', label: t('settings.tabs.document_layout'), icon: FaFileInvoice },
        { id: 'master_data', label: t('settings.tabs.master_data'), icon: FaDatabase },
        { id: 'notifications', label: t('settings.tabs.notifications'), icon: FaBell },
        { id: 'audit', label: t('settings.tabs.audit'), icon: FaHistory },
    ];

    const isContactsActive = isStartsWith('/customers') || isStartsWith('/partners') || isStartsWith('/interpreting');

    return (
        <TooltipProvider delayDuration={0}>
            <div className="hidden space-x-1 h-full xl:flex">

                {/* Dashboard */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link to="/" className={navLinkClass("/")}>
                            <FaHome className="text-base lg:hidden" />
                            <span className="hidden lg:inline">{t('nav.dashboard')}</span>
                            <NavBadge count={dashboardData?.stats?.deadlines_today} label="Termine Heute" activeColor="bg-rose-500" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                        <span className="font-semibold text-sm">Dashboard</span>
                    </TooltipContent>
                </Tooltip>

                {/* Anfragen */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link to="/requests" className={navLinkClass("/requests")}>
                            <FaInbox className="text-base lg:hidden" />
                            <span className="hidden lg:inline">{t('nav.requests')}</span>
                            <NavBadge count={dashboardData?.stats?.open_requests} label="Offene Anfragen" activeColor="bg-white/25" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                        <span className="font-semibold text-sm">Anfragen</span>
                    </TooltipContent>
                </Tooltip>

                {/* Angebote */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link to="/quotes" className={navLinkClass("/quotes")}>
                            <FaFileContract className="text-base lg:hidden" />
                            <span className="hidden lg:inline">{t('nav.quotes')}</span>
                            <NavBadge count={dashboardData?.stats?.open_quotes} label="Offene Angebote" activeColor="bg-white/25" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                        <span className="font-semibold text-sm">Angebote</span>
                    </TooltipContent>
                </Tooltip>

                {/* Aufträge */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link to="/projects" className={navLinkClass("/projects", isStartsWith('/projects'))}>
                            <FaLayerGroup className="text-base lg:hidden" />
                            <span className="hidden lg:inline">{t('nav.orders')}</span>
                            <NavBadge count={dashboardData?.stats?.open_projects} label="Offene Projekte" activeColor="bg-white/25" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                        <span className="font-semibold text-sm">Projekte</span>
                    </TooltipContent>
                </Tooltip>

                {/* Rechnungen */}
                {hasMinRole('manager') && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link to="/invoices" className={navLinkClass("/invoices")}>
                                <FaFileInvoiceDollar className="text-base lg:hidden" />
                                <span className="hidden lg:inline">{t('nav.invoices')}</span>
                                <NavBadge
                                    count={dashboardData?.stats?.unpaid_invoices}
                                    label="Offene Rechnungen"
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

                {/* Kontakte Dropdown */}
                <div className="relative h-full" ref={contactsRef}>
                    <button
                        onClick={() => {
                            const next = !isContactsOpen;
                            closeAllDropdowns();
                            setIsContactsOpen(next);
                        }}
                        className={navLinkClass("", isContactsOpen || isContactsActive)}
                    >
                        <FaAddressBook className="text-base lg:hidden" />
                        <span className="hidden lg:inline">{t('nav.contacts')}</span>
                        <FaChevronDown className={clsx("text-[10px] ml-1 transition-transform opacity-60", isContactsOpen && "rotate-180")} />
                    </button>

                    {isContactsOpen && (
                        <div className="absolute left-0 mt-0 w-52 bg-white rounded-sm shadow-xl border border-slate-200 z-[9999] text-slate-800 animate-slideUp overflow-hidden">
                            <div className="py-1">
                                <Link
                                    to="/customers"
                                    className={clsx(
                                        "px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors",
                                        isStartsWith('/customers') ? "text-brand-primary bg-slate-50" : "text-slate-700"
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
                                        "px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors border-t border-slate-50",
                                        isStartsWith('/partners') ? "text-brand-primary bg-slate-50" : "text-slate-700"
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
                                        isStartsWith('/interpreting') ? "text-brand-primary bg-slate-50" : "text-slate-700"
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

                {/* E-Mail */}
                {hasMinRole('manager') && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link to="/inbox" className={navLinkClass("/inbox")}>
                                <FaEnvelope className="text-base lg:hidden" />
                                <span className="hidden lg:inline">{t('nav.inbox')}</span>
                                <NavBadge count={unreadEmails} label="Ungelesene E-Mails" activeColor="bg-rose-500" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold text-sm">E-Mail</span>
                                {unreadEmails > 0 && (
                                    <div className="flex items-center gap-2 text-xs text-rose-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                        {unreadEmails} ungelesene E-Mails
                                    </div>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Kalender */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link to="/calendar" className={navLinkClass("/calendar")}>
                            <FaCalendarAlt className="text-base lg:hidden" />
                            <span className="hidden lg:inline">{t('nav.calendar')}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                        <span className="font-semibold text-sm">{t('nav.calendar')}</span>
                    </TooltipContent>
                </Tooltip>

                {/* Auswertung */}
                {hasMinRole('manager') && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link to="/reports" className={navLinkClass("/reports")}>
                                <FaChartBar className="text-base lg:hidden" />
                                <span className="hidden lg:inline">{t('nav.reports')}</span>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                            <span className="font-semibold text-sm">{t('nav.reports')}</span>
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Einstellungen Dropdown */}
                {hasMinRole('manager') && (
                    <div className="relative h-full" ref={settingsRef}>
                        <button
                            onClick={() => {
                                setIsSettingsOpen(!isSettingsOpen);
                                setIsContactsOpen(false);
                                setIsProfileOpen(false);
                                setIsNotifOpen(false);
                            }}
                            className={navLinkClass("", isSettingsOpen || isStartsWith('/settings'))}
                        >
                            <FaCog className="text-base lg:hidden" />
                            <span className="hidden lg:inline">{t('nav.settings')}</span>
                            <FaChevronDown className={clsx("text-[10px] ml-1 transition-transform opacity-60", isSettingsOpen && "rotate-180")} />
                        </button>

                        {isSettingsOpen && (
                            <div className="absolute right-0 mt-0 w-52 bg-white rounded-sm shadow-xl border border-slate-200 z-[9999] text-slate-800 animate-slideUp overflow-visible">
                                <div className="py-1">
                                    {SETTINGS_TABS.map((tab) => (
                                        <div key={tab.id} className="relative group/tab">
                                            <button
                                                onClick={() => { navigate(`/settings?tab=${tab.id}`); setIsSettingsOpen(false); }}
                                                className={clsx(
                                                    "w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors text-left",
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
                                                <div className="absolute left-full top-0 ml-[1px] w-52 bg-white rounded-sm shadow-xl border border-slate-200 z-[9999] text-slate-800 opacity-0 invisible group-hover/tab:opacity-100 group-hover/tab:visible transition-all duration-200 transform translate-x-2 group-hover/tab:translate-x-0">
                                                    <div className="py-1">
                                                        {[
                                                            { id: 'languages', label: t('settings.tabs.languages') },
                                                            { id: 'doc_types', label: t('settings.tabs.doc_types') },
                                                            { id: 'services', label: t('settings.tabs.services') },
                                                            { id: 'email_templates', label: t('settings.tabs.email_templates') },
                                                            { id: 'specializations', label: t('settings.tabs.specializations') },
                                                            { id: 'units', label: t('settings.tabs.units') },
                                                            { id: 'currencies', label: t('settings.tabs.currencies') },
                                                        ].map((subItem) => (
                                                            <button
                                                                key={subItem.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/settings?tab=master_data&sub=${subItem.id}`);
                                                                    setIsSettingsOpen(false);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-sm font-medium flex items-center hover:bg-slate-50 text-slate-600 hover:text-brand-primary transition-colors text-left"
                                                            >
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
    );
};

export default DesktopLinks;
