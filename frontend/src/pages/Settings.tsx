import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    FaBuilding, FaDatabase, FaHistory, FaFileInvoice, FaBell, FaHashtag,
    FaLanguage, FaFileAlt, FaGlobe, FaEnvelopeOpenText, FaTag, FaRuler, FaMoneyBillWave, FaCheck, FaChevronDown
} from 'react-icons/fa';
import CompanySettingsTab from '../components/settings/CompanySettingsTab';
import InvoiceSettingsTab from '../components/settings/InvoiceSettingsTab';
import NumberCircleSettingsTab from '../components/settings/NumberCircleSettingsTab';
import MasterDataTab from '../components/settings/MasterDataTab';
import AuditLogsTab from '../components/settings/AuditLogsTab';
import NotificationSettingsTab from '../components/settings/NotificationSettingsTab';

const TAB_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
    master_data: { label: 'Stammdaten', icon: FaDatabase, description: 'Sprachen, Leistungen, Kategorien.' },
    company: { label: 'Unternehmen', icon: FaBuilding, description: 'Firmenangaben, Logo und E-Mail-Konten.' },
    objects: { label: 'Nummernkreise', icon: FaHashtag, description: 'ID-Präfixe und Startnummern.' },
    invoice: { label: 'Rechnungen', icon: FaFileInvoice, description: 'Layout, Texte und Steuern.' },
    notifications: { label: 'Benachrichtigungen', icon: FaBell, description: 'Steuerung der System-E-Mails.' },
    audit: { label: 'Aktivitäten', icon: FaHistory, description: 'Systemaktivitäten & Änderungen.' },
};

const MASTER_DATA_SUBTABS = [
    { id: 'languages', label: 'Sprachen', icon: FaLanguage },
    { id: 'doc_types', label: 'Dokumententypen', icon: FaFileAlt },
    { id: 'services', label: 'Leistungen', icon: FaGlobe },
    { id: 'email_templates', label: 'E-Mail-Vorlagen', icon: FaEnvelopeOpenText },
    { id: 'specializations', label: 'Fachgebiete', icon: FaTag },
    { id: 'units', label: 'Einheiten', icon: FaRuler },
    { id: 'currencies', label: 'Währungen', icon: FaMoneyBillWave },
    { id: 'project_statuses', label: 'Projekt-Status', icon: FaCheck },
];

import { Link } from 'react-router-dom';
import clsx from 'clsx';

const COMPANY_SUBTABS = [
    { id: 'basis', label: 'Basisinformationen' },
    { id: 'location', label: 'Standort & Adresse' },
    { id: 'bank', label: 'Bankverbindung' },
    { id: 'tax', label: 'Steuern & Identifikation' },
    { id: 'logo', label: 'Firmenlogo' },
];

const Settings: React.FC = () => {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'master_data';
    const meta = TAB_META[activeTab] ?? TAB_META['master_data'];

    return (
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-16 py-6 md:py-8">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0 fade-in">
                <div className="mb-6 flex items-center gap-4 shrink-0">
                    <div className="w-12 h-12 rounded-sm bg-white border border-slate-200 shadow-sm flex items-center justify-center text-brand-primary text-xl shrink-0">
                        {React.createElement(meta.icon)}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">{meta.label}</h1>
                        <p className="text-slate-500 text-sm italic">{meta.description}</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:w-64 shrink-0 flex flex-col min-h-0 h-full">
                        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-y-auto custom-scrollbar flex-1">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Einstellungen</h2>
                            </div>
                            <nav className="flex flex-col">
                                {Object.entries(TAB_META).map(([id, item]) => {
                                    const Icon = item.icon;
                                    const isMasterData = id === 'master_data';
                                    const isCompany = id === 'company';
                                    const isActive = activeTab === id;

                                    return (
                                        <React.Fragment key={id}>
                                            <Link
                                                to={`/settings?tab=${id}`}
                                                className={clsx(
                                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2",
                                                    isActive
                                                        ? "bg-brand-primary/5 text-brand-primary border-brand-primary"
                                                        : "text-slate-600 hover:bg-slate-50 border-transparent"
                                                )}
                                            >
                                                <Icon className={clsx("w-4 h-4", isActive ? "text-brand-primary" : "text-slate-400")} />
                                                <span className="flex-1">{item.label}</span>
                                                {(isMasterData || isCompany) && (
                                                    <FaChevronDown className={clsx("w-3 h-3 text-slate-400 transition-transform duration-300", isActive && "rotate-180")} />
                                                )}
                                            </Link>

                                            {isMasterData && (
                                                <div 
                                                    className={clsx(
                                                        "bg-slate-50/50 overflow-hidden transition-all duration-300 ease-in-out",
                                                        isActive ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0 py-0"
                                                    )}
                                                >
                                                    {MASTER_DATA_SUBTABS.map(sub => (
                                                        <Link
                                                            key={sub.id}
                                                            to={`/settings?tab=master_data&sub=${sub.id}`}
                                                            className={clsx(
                                                                "flex items-center gap-3 pl-12 pr-4 py-2 text-[13px] font-medium transition-colors border-l-2",
                                                                searchParams.get('sub') === sub.id || (!searchParams.get('sub') && sub.id === 'languages')
                                                                    ? "text-brand-primary border-brand-primary bg-brand-primary/5"
                                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent"
                                                            )}
                                                        >
                                                            <span>{sub.label}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {isCompany && (
                                                <div 
                                                    className={clsx(
                                                        "bg-slate-50/50 overflow-hidden transition-all duration-300 ease-in-out",
                                                        isActive ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0 py-0"
                                                    )}
                                                >
                                                    {COMPANY_SUBTABS.map(sub => (
                                                        <Link
                                                            key={sub.id}
                                                            to={`/settings?tab=company&section=${sub.id}`}
                                                            className={clsx(
                                                                "flex items-center gap-3 pl-12 pr-4 py-2 text-[13px] font-medium transition-colors border-l-2",
                                                                searchParams.get('section') === sub.id || (!searchParams.get('section') && sub.id === 'basis')
                                                                    ? "text-brand-primary border-brand-primary bg-brand-primary/5"
                                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent"
                                                            )}
                                                        >
                                                            <span>{sub.label}</span>
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
                            {activeTab === 'audit' && <AuditLogsTab />}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Settings;
