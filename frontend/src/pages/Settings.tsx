import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaBuilding, FaDatabase, FaHistory, FaFileInvoice, FaUser, FaCrown, FaBell } from 'react-icons/fa';
import CompanySettingsTab from '../components/settings/CompanySettingsTab';
import InvoiceSettingsTab from '../components/settings/InvoiceSettingsTab';
import MasterDataTab from '../components/settings/MasterDataTab';
import AuditLogsTab from '../components/settings/AuditLogsTab';
import ProfileTab from '../components/settings/ProfileTab';
import SubscriptionTab from '../components/settings/SubscriptionTab';
import NotificationSettingsTab from '../components/settings/NotificationSettingsTab';
import LanguageSettingsTab from '../components/settings/LanguageSettingsTab';
import { FaGlobe } from 'react-icons/fa';

const TAB_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
    profile: { label: 'Profil', icon: FaUser, description: 'Persönliche Daten und Passwort.' },
    language: { label: 'Sprache', icon: FaGlobe, description: 'Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche.' },
    company: { label: 'Unternehmen', icon: FaBuilding, description: 'Firmenangaben, Logo und E-Mail-Konten.' },
    subscription: { label: 'Abonnement', icon: FaCrown, description: 'Plan und Abrechnung verwalten.' },
    invoice: { label: 'Rechnung & Angebot', icon: FaFileInvoice, description: 'Nummernkreise, Steuersätze und Layout.' },
    master_data: { label: 'Stammdaten', icon: FaDatabase, description: 'Sprachen, Dokumentarten, Leistungen u. m.' },
    notifications: { label: 'Benachrichtigungen', icon: FaBell, description: 'Steuern, wann und wie Sie benachrichtigt werden.' },
    audit: { label: 'Audit Logs', icon: FaHistory, description: 'Protokoll aller Systemaktivitäten.' },
};

const Settings: React.FC = () => {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'company';
    const meta = TAB_META[activeTab] ?? TAB_META['company'];
    const Icon = meta.icon;

    return (
        <div className="max-w-7xl mx-auto fade-in flex flex-col gap-4 p-4 pb-20">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 shrink-0">
                    <Icon />
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-slate-800 leading-tight">{meta.label}</h1>
                    <p className="text-slate-400 text-xs">{meta.description}</p>
                </div>
            </div>

            <div className="flex-1 min-w-0">
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'language' && <LanguageSettingsTab />}
                {activeTab === 'company' && <CompanySettingsTab />}
                {activeTab === 'subscription' && <SubscriptionTab />}
                {activeTab === 'invoice' && <InvoiceSettingsTab />}
                {activeTab === 'master_data' && <MasterDataTab />}
                {activeTab === 'notifications' && <NotificationSettingsTab />}
                {activeTab === 'audit' && <AuditLogsTab />}
            </div>
        </div>
    );
};

export default Settings;
