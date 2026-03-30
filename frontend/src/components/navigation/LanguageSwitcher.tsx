import { FaChevronDown } from 'react-icons/fa';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
    isOpen: boolean;
    onToggle: () => void;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
}

const LanguageSwitcher = ({
    isOpen,
    onToggle,
    dropdownRef
}: LanguageSwitcherProps) => {
    const { i18n } = useTranslation();

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        localStorage.setItem('locale', code);
        onToggle();
    };

    return (
        <div className="hidden sm:flex items-center mr-1" ref={dropdownRef}>
            <button
                onClick={onToggle}
                className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
            >
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-100/60 group-hover:text-emerald-100 transition-colors">
                    {i18n.language.toUpperCase().substring(0, 2)}
                </span>
                <FaChevronDown className={clsx("text-[10px] text-emerald-100/40 transition-transform group-hover:text-emerald-100/60", isOpen && "rotate-180")} />
            </button>

            {/* Language Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 top-full w-36 bg-white rounded-sm shadow-xl border border-slate-200 z-[9999] text-slate-800 animate-slideUp overflow-hidden origin-top-right">
                    <div className="py-1">
                        {[
                            { code: 'de', label: 'Deutsch' },
                            { code: 'en', label: 'Englisch' }
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={clsx(
                                    "w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors text-left",
                                    i18n.language === lang.code ? "text-brand-primary bg-slate-50 font-bold" : "text-slate-700"
                                )}
                            >
                                <span>{lang.label}</span>
                                {i18n.language === lang.code && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
