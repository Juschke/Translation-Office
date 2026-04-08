import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    FaBuilding, FaDatabase, FaShieldAlt, FaFileInvoice, FaBell, FaListOl, FaChevronDown, FaGavel, FaCog
} from 'react-icons/fa';
import clsx from 'clsx';
import CompanySettingsTab from '../components/settings/CompanySettingsTab';
import InvoiceSettingsTab from '../components/settings/InvoiceSettingsTab';
import NumberCircleSettingsTab from '../components/settings/NumberCircleSettingsTab';
import MasterDataTab from '../components/settings/MasterDataTab';
import AuditLogsTab from '../components/settings/AuditLogsTab';
import NotificationSettingsTab from '../components/settings/NotificationSettingsTab';
import DunningSettingsTab from '../components/settings/DunningSettingsTab';
import ComplianceSettingsTab from '@/components/settings/ComplianceSettingsTab';

const Settings: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'master_data';

    // Manage expanded state as a single active ID to ensure only one is open at a time
    const [expandedTab, setExpandedTab] = useState<string | null>(activeTab);

    // Sync when tab changes via URL (e.g. from outside or initial load)
    useEffect(() => {
        setExpandedTab(activeTab);
    }, [activeTab]);

    const toggleTab = (id: string, e: React.MouseEvent) => {
        const hasSubtabs = ['master_data', 'company', 'invoice', 'objects'].includes(id);

        if (id === activeTab && hasSubtabs) {
            // Toggle currently active tab (collapse/expand)
            e.preventDefault();
            setExpandedTab(expandedTab === id ? null : id);
        } else {
            // If clicking a new tab, it will become active and expanded via useEffect
            setExpandedTab(id);
        }
    };

    const TAB_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
        master_data: { label: t('settings.tabs.master_data'), icon: FaDatabase, description: t('settings.tabs.master_data_desc') },
        company: { label: t('settings.tabs.company'), icon: FaBuilding, description: t('settings.tabs.company_desc') },
        objects: { label: t('settings.tabs.numbering'), icon: FaListOl, description: t('settings.tabs.numbering_desc') },
        invoice: { label: t('settings.tabs.invoices'), icon: FaFileInvoice, description: t('settings.tabs.invoices_desc') },
        notifications: { label: t('settings.tabs.notifications'), icon: FaBell, description: t('settings.tabs.notifications_desc') },
        dunning: { label: 'Mahnwesen', icon: FaGavel, description: 'Automatisierte Zahlungserinnerungen und Mahngebühren.' },
        compliance: { label: 'Compliance & Sicherheit', icon: FaShieldAlt, description: 'GoBD, DSGVO und Sicherheits-Monitoring.' },
        audit: { label: t('settings.tabs.audit'), icon: FaListOl, description: t('settings.tabs.audit_log_desc') },
    };

    const MASTER_DATA_SUBTABS = [
        { id: 'languages', label: t('settings.tabs.languages') },
        { id: 'doc_types', label: t('settings.tabs.doc_types') },
        { id: 'services', label: t('settings.tabs.services') },
        { id: 'email_templates', label: t('settings.tabs.email_templates') },
        { id: 'specializations', label: t('settings.tabs.specializations') },
        { id: 'units', label: t('settings.tabs.units') },
        { id: 'currencies', label: t('settings.tabs.currencies') },
        { id: 'project_statuses', label: t('settings.tabs.project_statuses') },
    ];

    const COMPANY_SUBTABS = [
        { id: 'basis', label: t('settings.tabs.company_basis') },
        { id: 'location', label: t('settings.tabs.company_location') },
        { id: 'bank', label: t('settings.tabs.company_bank') },
        { id: 'tax', label: t('settings.tabs.company_tax') },
        { id: 'logo', label: t('settings.tabs.company_logo') },
    ];

    const INVOICE_SUBTABS = [
        { id: 'payment', label: t('settings.tabs.invoice_payment') },
        { id: 'tax', label: t('settings.tabs.invoice_tax') },
        { id: 'texts', label: t('settings.tabs.invoice_texts') },
        { id: 'layout', label: t('settings.tabs.invoice_layout') },
        { id: 'design', label: t('settings.tabs.invoice_design') },
    ];

    const OBJECTS_SUBTABS = [
        { id: 'master_data', label: t('settings.tabs.objects_master_data') },
        { id: 'projects', label: t('settings.tabs.objects_projects') },
        { id: 'finance', label: t('settings.tabs.objects_finance') },
    ];

    return (
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-16 py-6 md:py-8">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0 fade-in">
                <div className="mb-6 flex items-center gap-3 shrink-0">
                    <FaCog className="text-brand-primary text-xl" />
                    <h1 className="text-xl font-bold text-slate-900 leading-tight">Einstellungen</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:w-64 shrink-0 flex flex-col min-h-0 h-full">
                        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-y-auto custom-scrollbar flex-1">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.title')}</h2>
                            </div>
                            <nav className="flex flex-col">
                                {Object.entries(TAB_META).map(([id, item]) => {
                                    const Icon = item.icon;
                                    const isMasterData = id === 'master_data';
                                    const isCompany = id === 'company';
                                    const isInvoice = id === 'invoice';
                                    const isObjects = id === 'objects';
                                    const isActive = activeTab === id;
                                    const isExpanded = expandedTab === id;

                                    return (
                                        <React.Fragment key={id}>
                                            <Link
                                                to={`/settings?tab=${id}`}
                                                onClick={(e) => toggleTab(id, e)}
                                                className={clsx(
                                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2",
                                                    isActive
                                                        ? "bg-brand-primary/5 text-brand-primary border-brand-primary"
                                                        : "text-slate-600 hover:bg-slate-50 border-transparent"
                                                )}
                                            >
                                                <Icon className={clsx("w-4 h-4", isActive ? "text-brand-primary" : "text-slate-400")} />
                                                <span className="flex-1">{item.label}</span>
                                                {(isMasterData || isCompany || isInvoice || isObjects) && (
                                                    <FaChevronDown className={clsx("w-3 h-3 text-slate-400 transition-transform duration-300", isExpanded && "rotate-180")} />
                                                )}
                                            </Link>

                                            {isMasterData && (
                                                <div className={clsx(
                                                    "bg-slate-50/50 overflow-hidden transition-all duration-300 ease-in-out",
                                                    isExpanded ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0 py-0"
                                                )}>
                                                    {MASTER_DATA_SUBTABS.map(sub => (
                                                        <Link
                                                            key={sub.id}
                                                            to={`/settings?tab=master_data&sub=${sub.id}`}
                                                            className={clsx(
                                                                "flex items-center pl-12 pr-4 py-2 text-[13px] font-medium transition-colors border-l-2",
                                                                searchParams.get('sub') === sub.id || (!searchParams.get('sub') && sub.id === 'languages')
                                                                    ? "text-brand-primary border-brand-primary bg-brand-primary/5"
                                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent"
                                                            )}
                                                        >
                                                            {sub.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {isCompany && (
                                                <div className={clsx(
                                                    "bg-slate-50/50 overflow-hidden transition-all duration-300 ease-in-out",
                                                    isExpanded ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0 py-0"
                                                )}>
                                                    {COMPANY_SUBTABS.map(sub => (
                                                        <Link
                                                            key={sub.id}
                                                            to={`/settings?tab=company&section=${sub.id}`}
                                                            className={clsx(
                                                                "flex items-center pl-12 pr-4 py-2 text-[13px] font-medium transition-colors border-l-2",
                                                                searchParams.get('section') === sub.id || (!searchParams.get('section') && sub.id === 'basis')
                                                                    ? "text-brand-primary border-brand-primary bg-brand-primary/5"
                                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent"
                                                            )}
                                                        >
                                                            {sub.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {isInvoice && (
                                                <div className={clsx(
                                                    "bg-slate-50/50 overflow-hidden transition-all duration-300 ease-in-out",
                                                    isExpanded ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0 py-0"
                                                )}>
                                                    {INVOICE_SUBTABS.map(sub => (
                                                        <Link
                                                            key={sub.id}
                                                            to={`/settings?tab=invoice&section=${sub.id}`}
                                                            className={clsx(
                                                                "flex items-center pl-12 pr-4 py-2 text-[13px] font-medium transition-colors border-l-2",
                                                                searchParams.get('section') === sub.id || (!searchParams.get('section') && sub.id === 'payment')
                                                                    ? "text-brand-primary border-brand-primary bg-brand-primary/5"
                                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent"
                                                            )}
                                                        >
                                                            {sub.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {isObjects && (
                                                <div className={clsx(
                                                    "bg-slate-50/50 overflow-hidden transition-all duration-300 ease-in-out",
                                                    isExpanded ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0 py-0"
                                                )}>
                                                    {OBJECTS_SUBTABS.map(sub => (
                                                        <Link
                                                            key={sub.id}
                                                            to={`/settings?tab=objects&section=${sub.id}`}
                                                            className={clsx(
                                                                "flex items-center pl-12 pr-4 py-1.5 text-[13px] font-medium transition-colors border-l-2",
                                                                searchParams.get('section') === sub.id || (!searchParams.get('section') && sub.id === 'master_data')
                                                                    ? "text-brand-primary border-brand-primary bg-brand-primary/5"
                                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent"
                                                            )}
                                                        >
                                                            {sub.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0 flex flex-col min-h-0 w-full">
                        <div className="flex-1 min-h-0 flex flex-col w-full">
                            {activeTab === 'company' && <CompanySettingsTab />}
                            {activeTab === 'objects' && <NumberCircleSettingsTab />}
                            {activeTab === 'invoice' && <InvoiceSettingsTab />}
                            {activeTab === 'master_data' && <MasterDataTab />}
                            {activeTab === 'notifications' && <NotificationSettingsTab />}
                            {activeTab === 'dunning' && <DunningSettingsTab />}
                            {activeTab === 'compliance' && <ComplianceSettingsTab />}
                            {activeTab === 'audit' && <AuditLogsTab />}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Settings;
