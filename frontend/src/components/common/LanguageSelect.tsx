import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown, FaTimes, FaSearch, FaCheck, FaPlus } from 'react-icons/fa';
import { getFlagUrl } from '../../utils/flags';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../../api/services';
import { Button } from '../ui/button';


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
    addNewLabel?: string;
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
    addNewLabel = "Sprache hinzufügen",
    id
}) => {
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
                name: l.name_internal || l.name,
                flagCode: l.flag_icon
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }, [serverLanguages]);

    const filteredOptions = languages.filter((opt: LanguageOption) =>
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
        } else {
            onChange(code);
            setIsOpen(false);
        }
        setSearch('');
    };

    const getLangLabel = (code: string) => {
        let lang = languages.find((l: LanguageOption) => l.code === code);
        if (!lang && code.includes('-')) {
            const baseCode = code.split('-')[0];
            lang = languages.find((l: LanguageOption) => l.code === baseCode);
        }
        return lang ? lang.name : code;
    };

    return (
        <div id={id} className={clsx("relative w-full", className)} ref={containerRef} data-error={error}>
            {label && <label className="block text-sm font-medium text-slate-500 mb-1.5 ml-1">{label}</label>}

            <div
                className={clsx(
                    "w-full px-3 bg-white cursor-pointer flex flex-wrap gap-2 items-center transition shadow-sm h-10 border",
                    error ? "border-red-700 ring-2 ring-red-700/10" : (isOpen ? "ring-2 ring-slate-950/10 border-slate-900 shadow-sm" : "border-slate-300 hover:border-slate-400 shadow-sm")
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
                                    isMulti ? "bg-white border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700" : "text-sm font-medium text-slate-800"
                                )}>
                                    <img src={getFlagUrl(v.includes('-') ? v : (languages.find((l: LanguageOption) => l.code === v)?.flagCode || v))} className="w-6 h-4.5 object-cover shadow-sm shrink-0" alt="" />
                                    <span className="truncate">{getLangLabel(v)}</span>
                                    {isMulti && (
                                        <FaTimes
                                            className="ml-1 text-slate-300 hover:text-red-500 cursor-pointer text-xs"
                                            onClick={(e) => { e.stopPropagation(); handleSelect(v); }}
                                        />
                                    )}
                                </div>
                            ))}
                            {isMulti && values.length >= 4 && (
                                <div className="bg-white border border-slate-100 px-2 py-0.5 text-xs font-medium text-slate-900">
                                    + {values.length - 3} weitere
                                </div>
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
                        top: coords.top + 4,
                        left: coords.left,
                        width: coords.width
                    }}
                >
                    <div className="sticky top-0 bg-white border-b border-slate-100 p-0 z-10">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2.5 bg-white border-none text-sm focus:outline-none transition-all"
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
                            filteredOptions.map((opt: LanguageOption, index: number) => (
                                <div
                                    key={opt.code}
                                    className={clsx(
                                        "px-4 py-2.5 text-sm cursor-pointer transition flex items-center justify-between",
                                        activeIndex === index ? "bg-transparent text-slate-900" : "",
                                        values.includes(opt.code) ? "bg-white/30 text-slate-900 font-medium" : "text-slate-700 hover:bg-white"
                                    )}
                                    onClick={(e) => { e.stopPropagation(); handleSelect(opt.code); }}
                                >
                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                        {isMulti && (
                                            <div className={clsx(
                                                "w-4 h-4 border rounded flex items-center justify-center transition-all shrink-0",
                                                values.includes(opt.code) ? "bg-brand-primary border-brand-primary" : "border-slate-300 bg-white"
                                            )}>
                                                {values.includes(opt.code) && <FaCheck className="text-white text-xs" />}
                                            </div>
                                        )}
                                        <div className="w-8 py-0.5 flex items-center justify-center shrink-0">
                                            <img src={getFlagUrl(opt.flagCode || opt.code)} className="w-7 h-5 object-cover shadow-sm" alt="" />
                                        </div>
                                        <span className="truncate flex-1">{opt.name}</span>
                                        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-1 rounded shrink-0">{opt.code}</span>
                                    </div>
                                    {!isMulti && values.includes(opt.code) && <FaCheck className="text-slate-700 text-xs shrink-0 ml-2" />}
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
                                variant="secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddNew();
                                    setIsOpen(false);
                                }}
                                className="w-full py-2 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
                            >
                                <FaPlus className="text-[10px]" /> {addNewLabel}
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
