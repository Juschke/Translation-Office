import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const SettingRow = ({ label, description, children }: any) => (
    <div className="grid grid-cols-12 gap-6 py-6 border-b border-slate-100 last:border-0 items-start">
        <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
        </div>
        <div className="col-span-12 md:col-span-8">
            {children}
        </div>
    </div>
);

const ProfileTab = () => {
    const { t } = useTranslation();
    const { user } = useAuth();

    return (
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <FaUser className="text-slate-400 text-sm" />
                    <h2 className="text-sm font-semibold text-slate-800">Profil</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Persönliche Informationen für Ihren Account.</p>
            </div>

            {/* Rows */}
            <div className="px-6">
                <SettingRow
                    label="Benutzer"
                    description="Ihr Name und Ihre E-Mail-Adresse."
                >
                    <div className="text-sm text-slate-700 space-y-1">
                        <div><span className="font-medium">{(user as any)?.name ?? '–'}</span></div>
                        <div className="text-slate-500">{(user as any)?.email ?? '–'}</div>
                    </div>
                </SettingRow>
            </div>
        </div>
    );
};

export default ProfileTab;
