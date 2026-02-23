import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaGlobe } from 'react-icons/fa';
import clsx from 'clsx';
import { authService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import i18n from '../../i18n';

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

const LOCALES = [
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
];

const ProfileTab = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedLocale, setSelectedLocale] = useState<string>(
        (user as any)?.locale ?? localStorage.getItem('locale') ?? 'de'
    );

    const localeMutation = useMutation({
        mutationFn: (locale: string) => authService.updateLocale(locale),
        onSuccess: (_data, locale) => {
            localStorage.setItem('locale', locale);
            i18n.changeLanguage(locale);
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            toast.success('Sprache gespeichert');
        },
        onError: () => {
            toast.error('Fehler beim Speichern der Sprache');
        },
    });

    const handleLocaleChange = (locale: string) => {
        setSelectedLocale(locale);
        localeMutation.mutate(locale);
    };

    return (
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <FaGlobe className="text-slate-400 text-sm" />
                    <h2 className="text-sm font-semibold text-slate-800">Profil & Sprache</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Persönliche Einstellungen für Ihren Account.</p>
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

                <SettingRow
                    label="Sprache"
                    description="Legt die Sprache der Benutzeroberfläche fest. Die Einstellung gilt nur für Ihren Account."
                >
                    <div className="flex gap-2">
                        {LOCALES.map((loc) => (
                            <button
                                key={loc.value}
                                onClick={() => handleLocaleChange(loc.value)}
                                disabled={localeMutation.isPending}
                                className={clsx(
                                    'flex items-center gap-2 px-4 py-2.5 text-sm border transition-all rounded-sm font-medium',
                                    selectedLocale === loc.value
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800'
                                )}
                            >
                                <span>{loc.flag}</span>
                                <span>{loc.label}</span>
                            </button>
                        ))}
                    </div>
                </SettingRow>
            </div>
        </div>
    );
};

export default ProfileTab;
