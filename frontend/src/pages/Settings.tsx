import React, { useState } from 'react';
import { FaBuilding, FaDatabase, FaHistory } from 'react-icons/fa';
import clsx from 'clsx';
import CompanySettingsTab from '../components/settings/CompanySettingsTab';
import MasterDataTab from '../components/settings/MasterDataTab';
import AuditLogsTab from '../components/settings/AuditLogsTab';

const tabs = [
    { id: 'company', label: 'Unternehmen', icon: FaBuilding },
    { id: 'master_data', label: 'Stammdaten', icon: FaDatabase },
    { id: 'audit', label: 'Audit Logs', icon: FaHistory },
];

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('company');

    return (
        <div className="max-w-7xl mx-auto fade-in flex flex-col gap-6 p-4">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">System Einstellungen</h1>
                    <p className="text-slate-500 text-sm">Zentrale Konfiguration für Ihr Translation Office.</p>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                <div className="lg:w-64 flex-none">
                    <div className="bg-white shadow-sm border border-slate-200 overflow-hidden p-2 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 block">Konfiguration</label>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    'w-full flex items-center gap-3 px-3 py-2.5 text-xs transition-all duration-200 group',
                                    activeTab === tab.id
                                        ? 'bg-brand-900 text-white shadow-md font-bold'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-brand-700 font-medium uppercase tracking-wide'
                                )}
                            >
                                <tab.icon className={clsx('text-sm shrink-0', activeTab === tab.id ? 'text-brand-300' : 'text-slate-400')} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 min-w-0 pb-20">
                    {activeTab === 'company' && <CompanySettingsTab />}
                    {activeTab === 'master_data' && <MasterDataTab />}
                    {activeTab === 'audit' && <AuditLogsTab />}
                </div>
            </div>
        </div>
    );
};

export default Settings;
