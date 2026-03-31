import { Link } from 'react-router-dom';
import {
    FaHome, FaLayerGroup, FaFileAlt, FaUsers, FaUserTie,
    FaCommentDots, FaFileInvoiceDollar, FaEnvelope, FaCalendarAlt,
    FaChartBar, FaCog, FaChevronDown, FaBuilding, FaHashtag,
    FaFileInvoice, FaDatabase, FaBell, FaHistory, FaGlobe, FaTag, FaRuler, FaMoneyBillWave
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
    isCustomersOpen: boolean;
    setIsCustomersOpen: (open: boolean) => void;
    isPartnersOpen: boolean;
    setIsPartnersOpen: (open: boolean) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (open: boolean) => void;
    customersRef: React.RefObject<HTMLDivElement | null>;
    partnersRef: React.RefObject<HTMLDivElement | null>;
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
    isCustomersOpen,
    setIsCustomersOpen,
    isPartnersOpen,
    setIsPartnersOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    customersRef,
    partnersRef,
    settingsRef,
    navigate,
    setIsProfileOpen,
    setIsNotifOpen
}: DesktopLinksProps) => {
    const { t } = useTranslation();

    const isActive = (path: string) => location.pathname === path;

    const navLinkClass = (path: string, activeOverride?: boolean) => clsx(
        "px-2 sm:px-2.5 py-4 text-[13px] font-semibold border-b-2 transition h-full flex items-center gap-1.5",
        (activeOverride !== undefined ? activeOverride : isActive(path))
            ? "border-white text-white"
            : "border-transparent text-emerald-100/60 hover:text-white"
    );

    const SETTINGS_TABS = [
        { id: 'company', label: t('settings.tabs.company'), icon: FaBuilding },
        { id: 'objects', label: t('settings.tabs.number_circles'), icon: FaHashtag },
        { id: 'invoice', label: t('settings.tabs.document_layout'), icon: FaFileInvoice },
        { id: 'master_data', label: t('settings.tabs.master_data'), icon: FaDatabase },
        { id: 'notifications', label: t('settings.tabs.notifications'), icon: FaBell },
        { id: 'audit', label: t('settings.tabs.audit'), icon: FaHistory },
    ];

    return (
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
                        <span className="font-semibold text-sm">Projekte</span>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link to="/documents" className={navLinkClass("/documents")}>
                            <FaFileAlt className="text-base lg:hidden" />
                            <span className="hidden lg:inline">{t('nav.documents')}</span>
                            {dashboardData?.stats?.total_files > 0 && (
                                <NavBadge count={dashboardData.stats.total_files} label="Dokumente" activeColor="bg-brand-primary" />
                            )}
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                        <span className="font-semibold text-sm">Dokumente</span>
                    </TooltipContent>
                </Tooltip>

                {/* Kunden Dropdown */}
                <div className="relative h-full" ref={customersRef}>
                    <button
                        onClick={() => {
                            setIsCustomersOpen(!isCustomersOpen);
                            setIsPartnersOpen(false);
                            setIsProfileOpen(false);
                            setIsNotifOpen(false);
                            setIsSettingsOpen(false);
                        }}
                        className={navLinkClass("", isCustomersOpen || location.pathname.startsWith('/customers'))}
                        aria-haspopup="true"
                        aria-expanded={isCustomersOpen}
                    >
                        <FaUsers className="text-base lg:hidden" />
                        <span className="hidden lg:inline">{t('nav.customers')}</span>
                        <FaChevronDown className={clsx("text-[10px] ml-1 transition-transform opacity-60", isCustomersOpen && "rotate-180")} />
                    </button>

                    {isCustomersOpen && (
                        <div className="absolute left-0 mt-0 w-48 bg-white rounded-sm shadow-xl border border-slate-200 z-[9999] text-slate-800 animate-slideUp overflow-hidden">
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
                            </div>
                        </div>
                    )}
                </div>

                {/* Partner Dropdown */}
                <div className="relative h-full" ref={partnersRef}>
                    <button
                        onClick={() => {
                            setIsPartnersOpen(!isPartnersOpen);
                            setIsCustomersOpen(false);
                            setIsProfileOpen(false);
                            setIsNotifOpen(false);
                            setIsSettingsOpen(false);
                        }}
                        className={navLinkClass("", isPartnersOpen || location.pathname.startsWith('/partners') || location.pathname.startsWith('/interpreting'))}
                        aria-haspopup="true"
                        aria-expanded={isPartnersOpen}
                    >
                        <FaUserTie className="text-base lg:hidden" />
                        <span className="hidden lg:inline">{t('nav.partners')}</span>
                        <FaChevronDown className={clsx("text-[10px] ml-1 transition-transform opacity-60", isPartnersOpen && "rotate-180")} />
                    </button>

                    {isPartnersOpen && (
                        <div className="absolute left-0 mt-0 w-48 bg-white rounded-sm shadow-xl border border-slate-200 z-[9999] text-slate-800 animate-slideUp overflow-hidden">
                            <div className="py-1">
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
                            <span className="hidden lg:inline">{t('nav.calendar')}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent className="z-[100] bg-brand-primary text-white border-white/10 shadow-xl lg:hidden">
                        <span className="font-semibold text-sm">{t('nav.calendar')}</span>
                    </TooltipContent>
                </Tooltip>

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

                {hasMinRole('manager') && (
                    <div className="relative h-full" ref={settingsRef}>
                        <button
                            onClick={() => {
                                setIsSettingsOpen(!isSettingsOpen);
                                setIsCustomersOpen(false);
                                setIsPartnersOpen(false);
                                setIsProfileOpen(false);
                                setIsNotifOpen(false);
                            }}
                            className={navLinkClass("", isSettingsOpen || location.pathname.startsWith('/settings'))}
                            aria-haspopup="true"
                            aria-expanded={isSettingsOpen}
                        >
                            <FaCog className="text-base lg:hidden" />
                            <span className="hidden lg:inline">{t('nav.settings')}</span>
                            <FaChevronDown className={clsx("text-[10px] ml-1 transition-transform opacity-60", isSettingsOpen && "rotate-180")} />
                        </button>

                        {isSettingsOpen && (
                            <div className="absolute right-0 mt-0 w-52 bg-white rounded-sm shadow-xl border border-slate-200 z-[9999] text-slate-800 animate-slideUp overflow-visible">
                                <div className="py-1">
                                    {SETTINGS_TABS.map((tab, i) => (
                                        <div key={tab.id} className="relative group/tab">
                                            <button
                                                onClick={() => { navigate(`/settings?tab=${tab.id}`); setIsSettingsOpen(false); }}
                                                className={clsx(
                                                    "w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors text-left",
                                                    i > 0 && tab.id === 'audit' && "mt-1",
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
                                                                className="w-full px-4 py-2 text-sm font-medium flex items-center gap-3 hover:bg-slate-100/50 text-slate-600 hover:text-brand-primary transition-colors text-left"
                                                            >
                                                                <div className="w-6 h-6 rounded-sm bg-slate-100 flex items-center justify-center shrink-0">
                                                                    <subItem.icon className="text-slate-400 w-3 h-3 group-hover/tab:text-brand-primary" />
                                                                </div>
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
