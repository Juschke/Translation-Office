import { Link } from 'react-router-dom';
import {
    FaHome, FaLayerGroup, FaFileAlt, FaUsers, FaUserTie,
    FaCommentDots, FaFileInvoiceDollar, FaEnvelope, FaCalendarAlt, FaChartBar
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import NavBadge from './NavBadge';

import type { UserRole } from '../../context/AuthContext';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    isActive: (path: string) => boolean;
    hasMinRole: (role: UserRole) => boolean;
    dashboardData: any;
    unreadEmails: number;
}

const MobileMenu = ({
    isOpen,
    onClose,
    isActive,
    hasMinRole,
    dashboardData,
    unreadEmails
}: MobileMenuProps) => {
    const { t, i18n } = useTranslation();

    if (!isOpen) return null;

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: <FaHome />, count: dashboardData?.stats?.deadlines_today, badgeLabel: "Termine Heute" },
        { path: '/projects', label: 'Projekte', icon: <FaLayerGroup />, count: dashboardData?.stats?.open_projects, badgeLabel: "Offene Projekte" },
        { path: '/documents', label: 'Dokumente', icon: <FaFileAlt />, count: dashboardData?.stats?.total_files, badgeLabel: "Dokumente Gesamt" },
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
    ];

    return (
        <div className="bg-white border-t border-brand-border animate-slideDown shadow-lg xl:hidden">
            <div className="px-4 py-3 space-y-1">
                {menuItems.map((item: any) => {
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
                            onClick={onClose}
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
                                    onClose();
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
    );
};

export default MobileMenu;
