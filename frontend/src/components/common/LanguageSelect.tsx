import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaChevronDown, FaTimes, FaSearch, FaPlus, FaCheck } from 'react-icons/fa';
import { getFlagUrl } from '../../utils/flags';
import clsx from 'clsx';

import NewMasterDataModal from '../modals/NewMasterDataModal';

interface LanguageOption {
    code: string;
    name: string;
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
    { code: 'af', name: 'Afrikaans (Afrikaans)' },
    { code: 'sq', name: 'Albanisch (Shqip)' },
    { code: 'am', name: 'Amharisch (አማርኛ)' },
    { code: 'ar', name: 'Arabisch (العربية)' },
    { code: 'hy', name: 'Armenisch (Հայերեն)' },
    { code: 'az', name: 'Aserbaidschanisch (Azərbaycanca)' },
    { code: 'eu', name: 'Baskisch (Euskara)' },
    { code: 'be', name: 'Belarussisch (Беларуская)' },
    { code: 'bn', name: 'Bengalisch (বাংলা)' },
    { code: 'bs', name: 'Bosnisch (Bosanski)' },
    { code: 'bg', name: 'Bulgarisch (Български)' },
    { code: 'my', name: 'Burmesisch (မြန်မာစာ)' },
    { code: 'ceb', name: 'Cebuano (Cebuano)' },
    { code: 'zh', name: 'Chinesisch (中文)' },
    { code: 'da', name: 'Dänisch (Dansk)' },
    { code: 'prs', name: 'Dari (دری)' },
    { code: 'de', name: 'Deutsch (Deutsch)' },
    { code: 'en', name: 'Englisch (English)' },
    { code: 'eo', name: 'Esperanto (Esperanto)' },
    { code: 'et', name: 'Estnisch (Eesti)' },
    { code: 'fa', name: 'Farsi/Persisch (فارسی)' },
    { code: 'fi', name: 'Finnisch (Suomi)' },
    { code: 'fr', name: 'Französisch (Français)' },
    { code: 'gl', name: 'Galicisch (Galego)' },
    { code: 'ka', name: 'Georgisch (ქართული)' },
    { code: 'el', name: 'Griechisch (Ελληνικά)' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
    { code: 'ht', name: 'Haitisch (Kreyòl ayisyen)' },
    { code: 'ha', name: 'Hausa (هَوُسَ)' },
    { code: 'he', name: 'Hebräisch (עברית)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'id', name: 'Indonesisch (Bahasa Indonesia)' },
    { code: 'ga', name: 'Irisch (Gaeilge)' },
    { code: 'is', name: 'Isländisch (Íslenska)' },
    { code: 'it', name: 'Italienisch (Italiano)' },
    { code: 'ja', name: 'Japanisch (日本語)' },
    { code: 'jv', name: 'Javanisch (Basa Jawa)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'kk', name: 'Kasachisch (Қазақша)' },
    { code: 'ca', name: 'Katalanisch (Català)' },
    { code: 'km', name: 'Khmer (ភាសាខ្មဲរ)' },
    { code: 'ky', name: 'Kirgisisch (Кыргызча)' },
    { code: 'ko', name: 'Koreanisch (한국어)' },
    { code: 'hr', name: 'Kroatisch (Hrvatski)' },
    { code: 'ku', name: 'Kurdisch (Kurdî)' },
    { code: 'la', name: 'Latein (Latina)' },
    { code: 'lv', name: 'Lettisch (Latviešu)' },
    { code: 'lt', name: 'Litauisch (Lietuvių)' },
    { code: 'ms', name: 'Malaiisch (Bahasa Melayu)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'mt', name: 'Maltesisch (Malti)' },
    { code: 'mr', name: 'Marathi (मराठी)' },
    { code: 'mk', name: 'Mazedonisch (Македонски)' },
    { code: 'mn', name: 'Mongolisch (Монгол хэл)' },
    { code: 'ne', name: 'Nepalesisch (नेपाली)' },
    { code: 'nl', name: 'Niederländisch (Nederlands)' },
    { code: 'no', name: 'Norwegisch (Norsk)' },
    { code: 'ps', name: 'Paschtu (پښتو)' },
    { code: 'pl', name: 'Polnisch (Polski)' },
    { code: 'pt', name: 'Portugiesisch (Português)' },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'qu', name: 'Quechua (Runa Simi)' },
    { code: 'ro', name: 'Rumänisch (Română)' },
    { code: 'ru', name: 'Russisch (Русский)' },
    { code: 'sv', name: 'Schwedisch (Svenska)' },
    { code: 'sr', name: 'Serbisch (Српски)' },
    { code: 'si', name: 'Sinhala (සිංහල)' },
    { code: 'sk', name: 'Slowakisch (Slovenčina)' },
    { code: 'sl', name: 'Slowenisch (Slovenščina)' },
    { code: 'so', name: 'Somali (Af-Soomaali)' },
    { code: 'es', name: 'Spanisch (Español)' },
    { code: 'sw', name: 'Suaheli (Kiswahili)' },
    { code: 'tg', name: 'Tadschikisch (Тоҷикӣ)' },
    { code: 'tl', name: 'Tagalog (Filipino) (Tagalog)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'th', name: 'Thailändisch (ไทย)' },
    { code: 'ti', name: 'Tigrinya (ትግርኛ)' },
    { code: 'cs', name: 'Tschechisch (Čeština)' },
    { code: 'tr', name: 'Türkisch (Türkçe)' },
    { code: 'tk', name: 'Turkmenisch (Türkmençe)' },
    { code: 'uk', name: 'Ukrainisch (Українська)' },
    { code: 'hu', name: 'Ungarisch (Magyar)' },
    { code: 'ur', name: 'Urdu (اردو)' },
    { code: 'uz', name: 'Usbechisch (Oʻzbekcha)' },
    { code: 'vi', name: 'Vietnamesisch (Tiếng Việt)' },
    { code: 'cy', name: 'Walisisch (Cymraeg)' },
    { code: 'wo', name: 'Wolof (Wolof)' },
    { code: 'xh', name: 'Xhosa (isiXhosa)' },
    { code: 'yi', name: 'Yiddisch (ייִዲש)' },
    { code: 'yo', name: 'Yoruba (Yorùbá)' },
    { code: 'zu', name: 'Zulu (isiZulu)' },
];

interface LanguageSelectProps {
    label?: string;
    value: string | string[];
    onChange: (value: any) => void;
    isMulti?: boolean;
    placeholder?: string;
    className?: string;
}

const LanguageSelect: React.FC<LanguageSelectProps> = ({
    label,
    value,
    onChange,
    isMulti = false,
    placeholder = 'Sprache wählen...',
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const [customLanguages, setCustomLanguages] = useState<LanguageOption[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const languages = useMemo(() => {
        const all = [...DEFAULT_LANGUAGES, ...customLanguages];
        const unique = Array.from(new Map(all.map(item => [item.code, item])).values());
        return unique.sort((a, b) => a.name.localeCompare(b.name));
    }, [customLanguages]);

    const filteredOptions = languages.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase()) ||
        opt.code.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        setActiveIndex(filteredOptions.length > 0 ? 0 : -1);
    }, [search, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                setIsOpen(true);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
                handleSelect(filteredOptions[activeIndex].code);
            } else if (filteredOptions.length === 0 && search) {
                addCustomLanguage();
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const values = Array.isArray(value) ? value : [value].filter(Boolean);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code: string) => {
        if (isMulti) {
            const newValue = values.includes(code)
                ? values.filter(v => v !== code)
                : [...values, code];
            onChange(newValue);
        } else {
            onChange(code);
            setIsOpen(false);
        }
        setSearch('');
    };

    const addCustomLanguage = () => {
        if (!search) return;
        setIsModalOpen(true);
    };

    const handleModalSubmit = (data: any) => {
        const newLang = { code: data.code || data.flagCode || search.toLowerCase().slice(0, 2), name: data.name };
        setCustomLanguages(prev => [...prev, newLang]);
        handleSelect(newLang.code);
        setIsModalOpen(false);
    };

    const getLangLabel = (code: string) => {
        const lang = languages.find(l => l.code === code);
        return lang ? lang.name : code;
    };

    return (
        <div className={clsx("relative w-full", className)} ref={containerRef}>
            {label && <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>}

            <div
                className={clsx(
                    "w-full px-3 bg-white cursor-pointer flex flex-wrap gap-2 items-center transition shadow-sm h-11 border border-slate-200",
                    isOpen ? "ring-2 ring-brand-500/20 border-brand-500" : "hover:border-slate-400"
                )}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                <div className="flex-1 flex flex-wrap gap-1.5 overflow-hidden">
                    {values.length > 0 ? (
                        values.map(v => (
                            <div key={v} className={clsx(
                                "flex items-center gap-1.5",
                                isMulti ? "bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700" : "text-sm font-bold text-slate-800"
                            )}>
                                <img src={getFlagUrl(v)} className="w-6 h-4.5 object-cover shadow-sm shrink-0" alt="" />
                                <span className="truncate">{getLangLabel(v)}</span>
                                {isMulti && (
                                    <FaTimes
                                        className="ml-1 text-slate-300 hover:text-red-500 cursor-pointer text-[10px]"
                                        onClick={(e) => { e.stopPropagation(); handleSelect(v); }}
                                    />
                                )}
                            </div>
                        ))
                    ) : (
                        <span className="text-slate-400 text-sm">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                    {values.length > 0 && (
                        <FaTimes
                            className="text-slate-300 hover:text-red-500 cursor-pointer text-xs transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(isMulti ? [] : '');
                            }}
                        />
                    )}
                    <FaChevronDown className={clsx("text-slate-300 text-[10px] transition-transform", isOpen ? "rotate-180" : "")} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full bg-white border border-slate-200 shadow-2xl mt-1 overflow-hidden animate-fadeInUp flex flex-col max-h-[400px]">
                    <div className="sticky top-0 bg-white border-b border-slate-100 p-2 z-10">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-all"
                                placeholder="Sprache oder Land suchen..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1 py-1" ref={listRef}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, index) => (
                                <div
                                    key={opt.code}
                                    className={clsx(
                                        "px-4 py-2.5 text-sm cursor-pointer transition flex items-center justify-between",
                                        activeIndex === index ? "bg-slate-50 text-brand-700" : "",
                                        values.includes(opt.code) ? "bg-brand-50/50 text-brand-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                                    )}
                                    onClick={(e) => { e.stopPropagation(); handleSelect(opt.code); }}
                                    ref={el => {
                                        if (activeIndex === index && el) {
                                            el.scrollIntoView({ block: 'nearest' });
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 py-0.5 flex items-center justify-center shrink-0">
                                            <img src={getFlagUrl(opt.code)} className="w-7 h-5 object-cover shadow-sm" alt="" />
                                        </div>
                                        <span>{opt.name}</span>
                                        <span className="text-[10px] uppercase text-slate-300 font-mono tracking-tighter">{opt.code}</span>
                                    </div>
                                    {values.includes(opt.code) && <FaCheck className="text-brand-500 text-xs" />}
                                </div>
                            ))
                        ) : search && (
                            <div
                                className="px-4 py-4 text-center cursor-pointer hover:bg-slate-50 group border-t border-slate-50"
                                onClick={(e) => { e.stopPropagation(); addCustomLanguage(); }}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all">
                                        <FaPlus size={12} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 italic">"{search}" nicht gefunden</p>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Als neue Sprache hinzufügen</p>
                                </div>
                            </div>
                        )}
                        {filteredOptions.length === 0 && !search && (
                            <div className="px-4 py-10 text-center text-slate-400">
                                <p className="text-sm italic">Keine Sprachen verfügbar</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isModalOpen && (
                <NewMasterDataModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    type="languages"
                    initialData={{ name: search }}
                />
            )}
        </div>
    );
};

export default LanguageSelect;
