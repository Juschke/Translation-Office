import { Link } from 'react-router-dom';
import {
    FaHome, FaLayerGroup, FaFileAlt, FaUsers, FaUserTie,
    FaFileInvoiceDollar, FaEnvelope, FaCalendarAlt,
    FaChartBar, FaCog, FaChevronDown, FaBuilding, FaHashtag,
    FaFileInvoice, FaDatabase, FaBell, FaHistory, FaGlobe, FaTag, FaRuler, FaMoneyBillWave
} from 'react-icons/fa';
import React from 'react';
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
    isProjectsOpen: boolean;
    setIsProjectsOpen: (open: boolean) => void;
    isCustomersOpen: boolean;
    setIsCustomersOpen: (open: boolean) => void;
    isPartnersOpen: boolean;
    setIsPartnersOpen: (open: boolean) => void;
    isInvoicesOpen: boolean;
    setIsInvoicesOpen: (open: boolean) => void;
    isCalendarOpen: boolean;
    setIsCalendarOpen: (open: boolean) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (open: boolean) => void;
    projectsRef: React.RefObject<HTMLDivElement | null>;
    customersRef: React.RefObject<HTMLDivElement | null>;
    partnersRef: React.RefObject<HTMLDivElement | null>;
    invoicesRef: React.RefObject<HTMLDivElement | null>;
    calendarRef: React.RefObject<HTMLDivElement | null>;
    settingsRef: React.RefObject<HTMLDivElement | null>;
    navigate: (path: string) => void;
    closeAllDropdowns: () => void;
    onNewProject: () => void;
    onNewCustomer: () => void;
    onNewPartner: () => void;
    onNewAppointment: () => void;
}

const DesktopLinks = ({
    location,
    dashboardData,
    unreadEmails,
    hasMinRole,
    isProjectsOpen,
    setIsProjectsOpen,
    isCustomersOpen,
    setIsCustomersOpen,
    isPartnersOpen,
    setIsPartnersOpen,
    isInvoicesOpen,
    setIsInvoicesOpen,
    isCalendarOpen,
    setIsCalendarOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    projectsRef,
    customersRef,
    partnersRef,
    invoicesRef,
    calendarRef,
    settingsRef,
    navigate,
    closeAllDropdowns,
    onNewProject,
    onNewCustomer,
    onNewPartner,
    onNewAppointment,
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

    const dropdownMenuClass = "absolute left-0 mt-0 w-52 bg-white rounded-sm shadow-xl border border-slate-200 z-[9999] text-slate-800 animate-slideUp overflow-hidden";

    const dropdownHeader = (_label: string) => null;

    const dropdownPageLink = (to: string, icon: React.ReactNode, label: string, badge?: number) => (
        <Link
            to={to}
            className={clsx(
                "px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors",
                location.pathname === to ? "text-brand-primary bg-slate-50" : "text-slate-700"
            )}
        >
            <div className="flex items-center gap-3">
                {icon && icon}
                <span>{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-2xs font-bold">{badge}</span>
            )}
        </Link>
    );

    const dropdownAction = (onClick: () => void, icon: React.ReactNode, label: string) => (
        <button
            onClick={onClick}
            className="w-full px-4 py-2.5 text-sm font-medium flex items-center gap-3 hover:bg-teal-50 hover:text-brand-primary text-slate-600 transition-colors text-left"
        >
            {icon && icon}
            <span>{label}</span>
        </button>
    );

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

                {/* Projekte Dropdown */}
                <div className="relative h-full" ref={projectsRef}>
                    <button
                        onClick={() => { const next = !isProjectsOpen; closeAllDropdowns(); setIsProjectsOpen(next); }}
                        className={navLinkClass("", isProjectsOpen || location.pathname.startsWith('/projects'))}
                        aria-haspopup="true"
                        aria-expanded={isProjectsOpen}
                    >
                        <FaLayerGroup className="text-base lg:hidden" />
                        <span className="hidden lg:inline">{t('nav.projects')}</span>
                        <NavBadge count={dashboardData?.stats?.open_projects} label={t('nav.projects')} activeColor="bg-rose-500" />
                        <FaChevronDown className={clsx("text-2xs ml-1 transition-transform opacity-60", isProjectsOpen && "rotate-180")} />
                    </button>
                    {isProjectsOpen && (
                        <div className={dropdownMenuClass}>
                            {dropdownHeader('Projekte')}
                            <div className="py-1">
                                {dropdownPageLink('/projects', null, 'Alle Projekte', dashboardData?.stats?.open_projects)}
                                <div className="border-t border-slate-50 mt-1 pt-1">
                                    {dropdownAction(onNewProject, null, 'Projekt erstellen')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
                        onClick={() => { closeAllDropdowns(); setIsCustomersOpen(!isCustomersOpen); }}
                        className={navLinkClass("", isCustomersOpen || location.pathname.startsWith('/customers'))}
                        aria-haspopup="true"
                        aria-expanded={isCustomersOpen}
                    >
                        <FaUsers className="text-base lg:hidden" />
                        <span className="hidden lg:inline">{t('nav.customers')}</span>
                        <FaChevronDown className={clsx("text-2xs ml-1 transition-transform opacity-60", isCustomersOpen && "rotate-180")} />
                    </button>
                    {isCustomersOpen && (
                        <div className={dropdownMenuClass}>
                            {dropdownHeader('Kunden')}
                            <div className="py-1">
                                {dropdownPageLink('/customers', null, 'Alle Kunden', dashboardData?.stats?.active_customers)}
                                <div className="border-t border-slate-50 mt-1 pt-1">
                                    {dropdownAction(onNewCustomer, null, 'Kunden anlegen')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Partner Dropdown */}
                <div className="relative h-full" ref={partnersRef}>
                    <button
                        onClick={() => { closeAllDropdowns(); setIsPartnersOpen(!isPartnersOpen); }}
                        className={navLinkClass("", isPartnersOpen || location.pathname.startsWith('/partners') || location.pathname.startsWith('/interpreting'))}
                        aria-haspopup="true"
                        aria-expanded={isPartnersOpen}
                    >
                        <FaUserTie className="text-base lg:hidden" />
                        <span className="hidden lg:inline">{t('nav.partners')}</span>
                        <FaChevronDown className={clsx("text-2xs ml-1 transition-transform opacity-60", isPartnersOpen && "rotate-180")} />
                    </button>
                    {isPartnersOpen && (
                        <div className={dropdownMenuClass}>
                            {dropdownHeader('Partner')}
                            <div className="py-1">
                                {dropdownPageLink('/partners', null, 'Alle Partner', dashboardData?.stats?.active_partners)}
                                {dropdownPageLink('/interpreting', null, 'Dolmetscher', dashboardData?.stats?.active_interpreting)}
                                <div className="border-t border-slate-50 mt-1 pt-1">
                                    {dropdownAction(onNewPartner, null, 'Partner anlegen')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Rechnungen Dropdown */}
                {hasMinRole('manager') && (
                    <div className="relative h-full" ref={invoicesRef}>
                        <button
                            onClick={() => { closeAllDropdowns(); setIsInvoicesOpen(!isInvoicesOpen); }}
                            className={navLinkClass("", isInvoicesOpen || location.pathname.startsWith('/invoices'))}
                            aria-haspopup="true"
                            aria-expanded={isInvoicesOpen}
                        >
                            <FaFileInvoiceDollar className="text-base lg:hidden" />
                            <span className="hidden lg:inline">{t('nav.invoices')}</span>
                            <NavBadge
                                count={dashboardData?.stats?.unpaid_invoices}
                                label={t('nav.invoices')}
                                activeColor={dashboardData?.stats?.overdue_invoices > 0 ? "bg-rose-600" : "bg-rose-400"}
                            />
                            <FaChevronDown className={clsx("text-2xs ml-1 transition-transform opacity-60", isInvoicesOpen && "rotate-180")} />
                        </button>
                        {isInvoicesOpen && (
                            <div className={dropdownMenuClass}>
                                {dropdownHeader('Rechnungen')}
                                <div className="py-1">
                                    {dropdownPageLink('/invoices', null, 'Alle Rechnungen', dashboardData?.stats?.unpaid_invoices)}
                                    <div className="border-t border-slate-50 mt-1 pt-1">
                                        {dropdownAction(() => { closeAllDropdowns(); navigate('/invoices/new'); }, null, 'Rechnung erstellen')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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

                {/* Kalender Dropdown */}
                <div className="relative h-full" ref={calendarRef}>
                    <button
                        onClick={() => { closeAllDropdowns(); setIsCalendarOpen(!isCalendarOpen); }}
                        className={navLinkClass("", isCalendarOpen || location.pathname === '/calendar')}
                        aria-haspopup="true"
                        aria-expanded={isCalendarOpen}
                    >
                        <FaCalendarAlt className="text-base lg:hidden" />
                        <span className="hidden lg:inline">{t('nav.calendar')}</span>
                        <FaChevronDown className={clsx("text-2xs ml-1 transition-transform opacity-60", isCalendarOpen && "rotate-180")} />
                    </button>
                    {isCalendarOpen && (
                        <div className={dropdownMenuClass}>
                            {dropdownHeader('Kalender')}
                            <div className="py-1">
                                {dropdownPageLink('/calendar', null, 'Kalenderansicht')}
                                <div className="border-t border-slate-50 mt-1 pt-1">
                                    {dropdownAction(onNewAppointment, null, 'Termin erstellen')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
                                const next = !isSettingsOpen;
                                closeAllDropdowns();
                                setIsSettingsOpen(next);
                            }}
                            className={navLinkClass("", isSettingsOpen || location.pathname.startsWith('/settings'))}
                            aria-haspopup="true"
                            aria-expanded={isSettingsOpen}
                        >
                            <FaCog className="text-base lg:hidden" />
                            <span className="hidden lg:inline">{t('nav.settings')}</span>
                            <FaChevronDown className={clsx("text-2xs ml-1 transition-transform opacity-60", isSettingsOpen && "rotate-180")} />
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
                                                    <FaChevronDown className="text-2xs -rotate-90 opacity-80 ml-2 text-slate-400 group-hover/tab:text-brand-primary transition-colors" />
                                                )}
                                            </button>

                                            {/* Sub-menu for Master Data on hover */}
                                            {tab.id === 'master_data' && (
                                                <div className="absolute left-full top-0 ml-[1px] w-52 bg-white rounded-sm shadow-xl border border-slate-200 z-[9999] text-slate-800 opacity-0 invisible group-hover/tab:opacity-100 group-hover/tab:visible transition-all duration-200 transform translate-x-2 group-hover/tab:translate-x-0">
                                                    <div className="py-1">
                                                        <div className="border-b border-slate-50 mb-1" />
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
