import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaChevronDown, FaTimes, FaSearch, FaCheck } from 'react-icons/fa';
import { getFlagUrl } from '../../utils/flags';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../../api/services';


interface LanguageOption {
    code: string;
    name: string;
    flagCode?: string;
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
    { code: 'af', name: 'Afrikaans (Afrikaans)' },
    { code: 'sq', name: 'Albanisch (Shqip)' },
    { code: 'ar', name: 'Arabisch (العربية)' },
    { code: 'de', name: 'Deutsch (Deutsch)' },
    { code: 'en', name: 'Englisch (English)' },
    { code: 'fr', name: 'Französisch (Français)' },
    { code: 'es', name: 'Spanisch (Español)' },
    { code: 'it', name: 'Italienisch (Italiano)' },
    { code: 'ru', name: 'Russisch (Русский)' },
    { code: 'tr', name: 'Türkisch (Türkçe)' },
];

interface LanguageSelectProps {
    label?: string;
    value: string | string[];
    onChange: (value: any) => void;
    isMulti?: boolean;
    placeholder?: string;
    error?: boolean;
    className?: string;
}

const LanguageSelect: React.FC<LanguageSelectProps> = ({
    label,
    value,
    onChange,
    isMulti = false,
    placeholder = 'Sprache wählen...',
    error,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const { data: serverLanguages = [] } = useQuery({
        queryKey: ['settings', 'languages'],
        queryFn: settingsService.getLanguages
    });

    const languages = useMemo(() => {
        const mappedServer = serverLanguages.map((l: any) => ({
            code: l.iso_code,
            name: l.name_internal || l.name,
            flagCode: l.flag_icon
        }));
        const all = [...DEFAULT_LANGUAGES, ...mappedServer];
        const unique = Array.from(new Map(all.map(item => [item.code, item])).values());
        return unique.sort((a, b) => a.name.localeCompare(b.name));
    }, [serverLanguages]);

    const filteredOptions = languages.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase()) ||
        opt.code.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        setActiveIndex(filteredOptions.length > 0 ? 0 : -1);
    }, [search, isOpen, filteredOptions.length]);

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

    const getLangLabel = (code: string) => {
        const lang = languages.find(l => l.code === code);
        return lang ? lang.name : code;
    };

    return (
        <div className={clsx("relative w-full", className)} ref={containerRef} data-error={error}>
            {label && <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>}

            <div
                className={clsx(
                    "w-full px-3 bg-white cursor-pointer flex flex-wrap gap-2 items-center transition shadow-sm h-11 border",
                    error ? "border-red-500 ring-2 ring-red-500/10" : (isOpen ? "ring-2 ring-brand-500/20 border-brand-500" : "border-slate-200 hover:border-slate-400")
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
                                <img src={getFlagUrl(v.includes('-') ? v : (languages.find(l => l.code === v)?.flagCode || v))} className="w-6 h-4.5 object-cover shadow-sm shrink-0" alt="" />
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
                                placeholder="Sprache suchen..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 py-0.5 flex items-center justify-center shrink-0">
                                            <img src={getFlagUrl(opt.flagCode || opt.code)} className="w-7 h-5 object-cover shadow-sm" alt="" />
                                        </div>
                                        <span>{opt.name}</span>
                                        <span className="text-[10px] uppercase text-slate-300  tracking-tighter">{opt.code}</span>
                                    </div>
                                    {values.includes(opt.code) && <FaCheck className="text-brand-500 text-xs" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-10 text-center text-slate-400">
                                <p className="text-sm italic">Keine Sprachen gefunden</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelect;
