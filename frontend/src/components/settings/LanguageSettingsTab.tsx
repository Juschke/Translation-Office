import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe, FaCheck } from 'react-icons/fa';
import clsx from 'clsx';

const LanguageSettingsTab: React.FC = () => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('locale', lng);
    };

    return (
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-brand-primary flex items-center justify-center border border-slate-100 shadow-sm mb-6">
                <FaGlobe className="text-2xl" />
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('profile.language')}</h3>
            <p className="text-sm text-slate-400 text-center max-w-md mb-8">
                Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche aus.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                <button
                    onClick={() => changeLanguage('de')}
                    className={clsx(
                        "p-6 rounded-sm border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden",
                        i18n.language === 'de'
                            ? "border-brand-primary bg-emerald-50/30"
                            : "border-slate-100 hover:border-slate-200 bg-white"
                    )}
                >
                    {i18n.language === 'de' && (
                        <div className="absolute top-0 right-0 p-1.5 bg-brand-primary text-white rounded-bl-sm">
                            <FaCheck className="text-2xs" />
                        </div>
                    )}
                    <div className="w-12 h-8 bg-slate-100 rounded-sm shadow-sm border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-400">DE</div>
                    <span className={clsx("font-bold text-sm", i18n.language === 'de' ? "text-brand-primary" : "text-slate-700")}>Deutsch</span>
                    <span className="text-2xs text-slate-400 font-semibold">Standard</span>
                </button>

                <button
                    onClick={() => changeLanguage('en')}
                    className={clsx(
                        "p-6 rounded-sm border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden",
                        i18n.language === 'en'
                            ? "border-brand-primary bg-emerald-50/30"
                            : "border-slate-100 hover:border-slate-200 bg-white"
                    )}
                >
                    {i18n.language === 'en' && (
                        <div className="absolute top-0 right-0 p-1.5 bg-brand-primary text-white rounded-bl-sm">
                            <FaCheck className="text-2xs" />
                        </div>
                    )}
                    <div className="w-12 h-8 bg-slate-100 rounded-sm shadow-sm border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-400">EN</div>
                    <span className={clsx("font-bold text-sm", i18n.language === 'en' ? "text-brand-primary" : "text-slate-700")}>English</span>
                    <span className="text-2xs text-slate-400 font-semibold">International</span>
                </button>
            </div>
        </div>
    );
};

export default LanguageSettingsTab;
