import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    FaBuilding, FaDatabase, FaHistory, FaFileInvoice, FaBell, FaHashtag,
    FaLanguage, FaFileAlt, FaGlobe, FaEnvelopeOpenText, FaTag, FaRuler, FaMoneyBillWave, FaCheck
} from 'react-icons/fa';
import CompanySettingsTab from '../components/settings/CompanySettingsTab';
import InvoiceSettingsTab from '../components/settings/InvoiceSettingsTab';
import NumberCircleSettingsTab from '../components/settings/NumberCircleSettingsTab';
import MasterDataTab from '../components/settings/MasterDataTab';
import AuditLogsTab from '../components/settings/AuditLogsTab';
import NotificationSettingsTab from '../components/settings/NotificationSettingsTab';

const TAB_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
    company: { label: 'Unternehmen', icon: FaBuilding, description: 'Firmenangaben, Logo und E-Mail-Konten.' },
    objects: { label: 'Nummernkreise', icon: FaHashtag, description: 'ID-Präfixe und Startnummern.' },
    invoice: { label: 'Rechnungen', icon: FaFileInvoice, description: 'Layout, Texte und Steuern.' },
    master_data: { label: 'Stammdaten', icon: FaDatabase, description: 'Sprachen, Leistungen, Kategorien.' },
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

const Settings: React.FC = () => {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'company';
    const meta = TAB_META[activeTab] ?? TAB_META['company'];

    return (
        <div className="max-w-[1600px] mx-auto fade-in p-4 pb-20">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 shrink-0">
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden sticky top-20">
                        <nav className="flex flex-col">
                            {Object.entries(TAB_META).map(([id, item]) => {
                                const Icon = item.icon;
                                const isMasterData = id === 'master_data';
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
                                            <span>{item.label}</span>
                                        </Link>

                                        {/* Sub-items for Master Data */}
                                        {isMasterData && isActive && (
                                            <div className="bg-slate-50/50 py-1">
                                                {MASTER_DATA_SUBTABS.map(sub => (
                                                    <Link
                                                        key={sub.id}
                                                        to={`/settings?tab=master_data&sub=${sub.id}`}
                                                        className={clsx(
                                                            "flex items-center gap-3 pl-10 pr-4 py-2 text-[13px] font-medium transition-colors border-l-2",
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
                                    </React.Fragment>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                                            {/* Sub-items for Master Data */}
                                            {isMasterData && isActive && (
                                                <div className="bg-slate-50/50 py-1">
                                                    {MASTER_DATA_SUBTABS.map(sub => (
                                                        <Link
                                                            key={sub.id}
                                                            to={`/settings?tab=master_data&sub=${sub.id}`}
                                                            className={clsx(
                                                                "flex items-center gap-3 pl-10 pr-4 py-2 text-[13px] font-medium transition-colors border-l-2",
                                                                searchParams.get('sub') === sub.id || (!searchParams.get('sub') && sub.id === 'languages')
                                                                    ? "text-brand-primary border-brand-primary bg-brand-primary/5"
                                                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent"
                                                            )}
                                                        >
                                                            <div className="w-6 h-6 rounded-sm bg-slate-100 flex items-center justify-center shrink-0">
                                                                <sub.icon className={clsx("w-3.5 h-3.5", (searchParams.get('sub') === sub.id || (!searchParams.get('sub') && sub.id === 'languages')) ? "text-brand-primary" : "text-slate-400")} />
                                                            </div>
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
                    <main className="flex-1 min-w-0">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-sm bg-white border border-slate-200 shadow-sm flex items-center justify-center text-brand-primary text-xl shrink-0">
                                {React.createElement(meta.icon)}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 leading-tight">{meta.label}</h1>
                                <p className="text-slate-500 text-sm italic">{meta.description}</p>
                            </div>
                        </div>

                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm">
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
    );
};

export default Settings;
