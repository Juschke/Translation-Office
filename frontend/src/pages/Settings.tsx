import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaBuilding, FaDatabase, FaHistory, FaFileInvoice, FaBell, FaListOl } from 'react-icons/fa';
import CompanySettingsTab from '../components/settings/CompanySettingsTab';
import InvoiceSettingsTab from '../components/settings/InvoiceSettingsTab';
import NumberCircleSettingsTab from '../components/settings/NumberCircleSettingsTab';
import MasterDataTab from '../components/settings/MasterDataTab';
import AuditLogsTab from '../components/settings/AuditLogsTab';
import NotificationSettingsTab from '../components/settings/NotificationSettingsTab';

const TAB_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
    company: { label: 'Unternehmen', icon: FaBuilding, description: 'Firmenangaben, Logo und E-Mail-Konten.' },
    objects: { label: 'Nummernkreise', icon: FaListOl, description: 'ID-Präfixe und Startnummern.' },
    invoice: { label: 'Rechnungen', icon: FaFileInvoice, description: 'Layout, Texte und Steuern.' },
    master_data: { label: 'Stammdaten', icon: FaDatabase, description: 'Sprachen, Leistungen, Kategorien.' },
    notifications: { label: 'Benachrichtigungen', icon: FaBell, description: 'Steuerung der System-E-Mails.' },
    audit: { label: 'Protokoll', icon: FaHistory, description: 'Systemaktivitäten & Änderungen.' },
};

import { Link } from 'react-router-dom';
import clsx from 'clsx';

const Settings: React.FC = () => {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'company';
    const meta = TAB_META[activeTab] ?? TAB_META['company'];

    return (
        <div className="max-w-7xl mx-auto fade-in p-4 pb-20">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 shrink-0">
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden sticky top-20">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Einstellungen</h2>
                        </div>
                        <nav className="flex flex-col">
                            {Object.entries(TAB_META).map(([id, item]) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={id}
                                        to={`/settings?tab=${id}`}
                                        className={clsx(
                                            "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2",
                                            activeTab === id
                                                ? "bg-brand-primary/5 text-brand-primary border-brand-primary"
                                                : "text-slate-600 hover:bg-slate-50 border-transparent"
                                        )}
                                    >
                                        <Icon className={clsx("w-4 h-4", activeTab === id ? "text-brand-primary" : "text-slate-400")} />
                                        <span>{item.label}</span>
                                    </Link>
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

                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm min-h-[500px]">
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
