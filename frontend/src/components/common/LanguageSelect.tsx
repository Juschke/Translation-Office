import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown, FaTimes, FaSearch, FaCheck, FaPlus, FaMinus } from 'react-icons/fa';
import { getFlagUrl, getLanguageName } from '../../utils/flags';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../../api/services';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';


import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';


interface LanguageOption {
    code: string;
    name: string;
    flagCode?: string;
}


interface LanguageSelectProps {
    label?: string;
    value: string | string[];
    onChange: (value: any) => void;
    isMulti?: boolean;
    placeholder?: string;
    error?: boolean;
    className?: string;
    onAddNew?: () => void;
    id?: string;
}

const LanguageSelect: React.FC<LanguageSelectProps> = ({
    label,
    value,
    onChange,
    isMulti = false,
    placeholder = 'Sprache wählen...',
    error,
    className = "",
    onAddNew,
    id
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            const handleScroll = (e: Event) => {
                if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
                    return;
                }
                setIsOpen(false);
            };
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', updateCoords);
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', updateCoords);
            };
        }
    }, [isOpen]);

    const { data: serverLanguages = [] } = useQuery({
        queryKey: ['settings', 'languages'],
        queryFn: settingsService.getLanguages
    });

    const languages = useMemo(() => {
        return serverLanguages
            .map((l: any) => ({
                code: l.iso_code,
                name: getLanguageName(l.iso_code),
                flagCode: l.flag_icon
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }, [serverLanguages]);

    const filteredOptions = languages.filter((opt: LanguageOption) =>
        opt.name.toLowerCase().includes(search.toLowerCase()) ||
        opt.code.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        setActiveIndex(-1);
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
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const values = Array.isArray(value) ? value : [value].filter(Boolean);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // If the target is inside the portal, don't close
                const portal = document.querySelector('.language-select-portal');
                if (portal && portal.contains(event.target as Node)) return;

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
            // Don't clear search or close for multi-select to allow multiple selections
        } else {
            onChange(code);
            setIsOpen(false);
            setSearch('');
        }
    };

    const getLangLabel = (code: string) => {
        if (!code) return '';

        // 1. Exact match
        let lang = languages.find((l: LanguageOption) => l.code === code);

        // 2. Base code match (e.g. searching 'de-DE' finds 'de')
        if (!lang && code.includes('-')) {
            const baseCode = code.split('-')[0];
            lang = languages.find((l: LanguageOption) => l.code === baseCode);
        }

        // 3. Extended code match (e.g. searching 'de' finds 'de-DE')
        if (!lang) {
            lang = languages.find((l: LanguageOption) => l.code.startsWith(code + '-'));
        }

        return lang ? lang.name : code;
    };

    return (
        <div id={id} className={clsx("relative w-full", className)} ref={containerRef} data-error={error}>
            {label && <label className="block text-sm font-medium text-slate-500 mb-1.5 ml-1">{label}</label>}

            <div
                className={clsx(
                    "w-full px-3 bg-white cursor-pointer flex flex-wrap gap-2 items-center transition h-10 border rounded-sm",
                    error ? "border-red-500 ring-2 ring-red-500/10" : (isOpen ? "ring-2 ring-brand-primary/10 border-brand-primary" : "border-brand-border hover:border-brand-primary shadow-sm")
                )}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                <div className="flex-1 flex flex-wrap gap-1.5 overflow-hidden">
                    {values.length > 0 ? (
                        <>
                            {(isMulti && values.length >= 4 ? values.slice(0, 3) : values).map(v => (
                                <div key={v} className={clsx(
                                    "flex items-center gap-1.5",
                                    isMulti ? "text-sm font-medium text-slate-800" : "text-sm font-medium text-slate-800"
                                )}>
                                    <img src={getFlagUrl(v.includes('-') ? v : (languages.find((l: LanguageOption) => l.code === v)?.flagCode || v))} className="w-6 h-4.5 object-cover shadow-sm shrink-0" alt="" />
                                    <span>{getLangLabel(v)}</span>
                                    {isMulti && (
                                        <FaTimes
                                            className="ml-1 text-slate-300 hover:text-red-500 cursor-pointer text-xs"
                                            onClick={(e) => { e.stopPropagation(); handleSelect(v); }}
                                        />
                                    )}
                                </div>
                            ))}
                            {isMulti && values.length >= 4 && (
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500 rounded-sm cursor-help hover:bg-slate-200 transition-colors">
                                                + {values.length - 3} weitere
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-900 text-white font-medium">
                                            <div className="flex flex-col gap-1">
                                                {values.slice(3).map(v => (
                                                    <div key={v} className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0" />
                                                        <span>{getLangLabel(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </>
                    ) : (
                        <span className="text-slate-400 text-sm">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                    <FaChevronDown className={clsx("text-slate-400 text-xs transition-transform", isOpen ? "rotate-180" : "")} />
                </div>
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed z-[9999] bg-white border border-slate-200 shadow-sm overflow-hidden animate-fadeIn fadeInUp flex flex-col max-h-[400px] language-select-portal"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: coords.width
                    }}
                >
                    <div className="sticky top-0 bg-white px-4 py-2 z-10">
                        <div className="flex items-center gap-3">
                            {isMulti && filteredOptions.length > 0 && (
                                <div className="flex items-center cursor-pointer group shrink-0"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onMouseUp={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const allFilteredCodes = filteredOptions.map((o: LanguageOption) => o.code);
                                        const allVisibleSelected = allFilteredCodes.every((code: string) => values.includes(code));
                                        
                                        if (allVisibleSelected) {
                                            onChange(values.filter(v => !allFilteredCodes.includes(v)));
                                        } else {
                                            const nextValue = [...new Set([...values, ...allFilteredCodes])];
                                            onChange(nextValue);
                                        }
                                    }}
                                >
                                    <div className={clsx(
                                        "w-4 h-4 border rounded-[3px] flex items-center justify-center transition-all",
                                        filteredOptions.some((o: LanguageOption) => values.includes(o.code)) 
                                            ? "bg-brand-primary border-brand-primary text-white" 
                                            : "border-slate-300 bg-white shadow-xs"
                                    )}>
                                        {filteredOptions.every((o: LanguageOption) => values.includes(o.code)) ? (
                                            <FaCheck className="text-[9px]" />
                                        ) : filteredOptions.some((o: LanguageOption) => values.includes(o.code)) ? (
                                            <FaMinus className="text-[8px]" />
                                        ) : null}
                                    </div>
                                </div>
                            )}
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]" />
                                <input
                                    type="text"
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border-none text-sm focus:outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Sprache suchen..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1 py-1" ref={listRef}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt: LanguageOption, index: number) => (
                                <div
                                    key={opt.code}
                                    className={clsx(
                                        "px-4 py-2.5 text-sm cursor-pointer transition flex items-center justify-between",
                                        activeIndex === index ? "bg-brand-primary text-white" : "text-slate-700 hover:bg-slate-50",
                                        values.includes(opt.code) ? "bg-slate-50/80 text-slate-900 font-medium" : ""
                                    )}
                                    onClick={(e) => { e.stopPropagation(); handleSelect(opt.code); }}
                                >
                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                        {isMulti && (
                                            <div className={clsx(
                                                "w-4 h-4 border rounded-[3px] flex items-center justify-center transition-all shrink-0",
                                                values.includes(opt.code) ? "bg-brand-primary border-brand-primary" : "border-slate-300 bg-white shadow-sm"
                                            )}>
                                                {values.includes(opt.code) && <FaCheck className="text-white text-[9px]" />}
                                            </div>
                                        )}
                                        <div className="w-8 py-0.5 flex items-center justify-center shrink-0">
                                            <img src={getFlagUrl(opt.flagCode || opt.code)} className="w-7 h-5 object-cover shadow-sm" alt="" />
                                        </div>
                                        <span className="flex-1">{opt.name}</span>
                                    </div>
                                    {!isMulti && values.includes(opt.code) && <FaCheck className="text-brand-primary text-xs shrink-0 ml-2" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-10 text-center text-slate-400">
                                <p className="text-sm italic">Keine Sprachen gefunden</p>
                            </div>
                        )}
                    </div>

                    {onAddNew && (
                        <div className="p-2 border-t border-slate-100 bg-white shrink-0">
                            <Button
                                variant="default"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddNew();
                                    setIsOpen(false);
                                }}
                                className="w-full h-9 text-xs font-bold gap-2"
                            >
                                <FaPlus className="text-[10px] text-white" />
                                {t('select.add_new_language', 'Neue Sprache anlegen')}
                            </Button>
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default LanguageSelect;
