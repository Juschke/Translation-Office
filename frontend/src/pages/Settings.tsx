import React, { useState } from 'react';
import { FaBuilding, FaDatabase, FaHistory, FaFileInvoiceDollar } from 'react-icons/fa';
import clsx from 'clsx';
import CompanySettingsTab from '../components/settings/CompanySettingsTab';
import InvoiceSettingsTab from '../components/settings/InvoiceSettingsTab';
import MasterDataTab from '../components/settings/MasterDataTab';
import AuditLogsTab from '../components/settings/AuditLogsTab';

const tabs = [
    { id: 'company', label: 'Unternehmen', icon: FaBuilding },
    { id: 'invoice', label: 'Rechnung & Angebot', icon: FaFileInvoiceDollar },
    { id: 'master_data', label: 'Stammdaten', icon: FaDatabase },
    { id: 'audit', label: 'Audit Logs', icon: FaHistory },
];

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('company');

    return (
        <div className="max-w-7xl mx-auto fade-in flex flex-col gap-6 p-4">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-medium text-slate-800">System Einstellungen</h1>
                    <p className="text-slate-500 text-sm">Zentrale Konfiguration für Ihr Translation Office.</p>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Sidebar — vertical on lg+, horizontal scrollable on smaller screens */}
                <div className="lg:w-64 flex-none">
                    <div className="bg-white shadow-sm border border-slate-200 overflow-hidden p-2">
                        <label className="text-xs font-medium text-slate-400 px-3 mb-2 block hidden lg:block">Konfiguration</label>
                        {/* Horizontal scroll on small, vertical list on lg */}
                        <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        'flex items-center gap-2 px-3 py-2.5 text-xs transition-all duration-200 group shrink-0 whitespace-nowrap lg:w-full',
                                        activeTab === tab.id
                                            ? 'bg-slate-900 text-white shadow-sm font-medium rounded'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium rounded'
                                    )}
                                >
                                    <tab.icon className={clsx('text-sm shrink-0', activeTab === tab.id ? 'text-brand-300' : 'text-slate-400')} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex-1 min-w-0 pb-20 flex flex-col">
                    {activeTab === 'company' && <CompanySettingsTab />}
                    {activeTab === 'invoice' && <InvoiceSettingsTab />}
                    {activeTab === 'master_data' && <MasterDataTab />}
                    {activeTab === 'audit' && <AuditLogsTab />}
                </div>
            </div>
        </div>
    );
};

export default Settings;
