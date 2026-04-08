import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown, FaSearch, FaCheck, FaTimes, FaPlus, FaEdit } from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';

interface SearchableSelectProps {
    options: { value: string; label: string; icon?: React.ReactNode; group?: string }[];
    value: string | string[];
    onChange: (value: any) => void;
    placeholder?: string;
    label?: string;
    error?: boolean;
    className?: string;
    isMulti?: boolean;
    onAddNew?: () => void;
    onSearch?: (search: string) => void;
    id?: string;
    preserveOrder?: boolean;
    maxVisibleItems?: number;
    roundedSide?: 'left' | 'right' | 'both' | 'none';
    disabled?: boolean;
    isClearable?: boolean;
    onEdit?: () => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options, value, onChange, placeholder = "Bitte wählen...", label, error, className = "",
    isMulti = false, onAddNew, onSearch, id, preserveOrder = false,
    maxVisibleItems = 2, roundedSide = 'both', disabled = false, isClearable = true, onEdit
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [activeIndex, setActiveIndex] = useState(-1);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const updateCoords = useCallback(() => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            });
        }
    }, []);

    const filteredOptions = useMemo(() => {
        return options.filter(opt =>
            (opt.label && opt.label.toLowerCase().includes(search.toLowerCase())) ||
            (opt.group && opt.group.toLowerCase().includes(search.toLowerCase()))
        );
    }, [options, search]);

    const groupedOptions = useMemo(() => {
        const groups: Record<string, typeof options> = {};
        const noGroup: typeof options = [];

        filteredOptions.forEach(opt => {
            if (opt.group) {
                if (!groups[opt.group]) groups[opt.group] = [];
                groups[opt.group].push(opt);
            } else {
                noGroup.push(opt);
            }
        });

        const sortedGroups = Object.keys(groups).sort((a, b) => {
            if (search) {
                const aMatches = groups[a].some(i => i.label.toLowerCase().includes(search.toLowerCase()));
                const bMatches = groups[b].some(i => i.label.toLowerCase().includes(search.toLowerCase()));
                if (aMatches && !bMatches) return -1;
                if (!aMatches && bMatches) return 1;
            }
            return a.localeCompare(b);
        }).map(groupName => ({
            name: groupName,
            items: preserveOrder ? groups[groupName] : groups[groupName].sort((a, b) => (a.label || '').localeCompare(b.label || ''))
        }));

        return {
            sortedGroups,
            noGroup: preserveOrder ? noGroup : noGroup.sort((a, b) => (a.label || '').localeCompare(b.label || ''))
        };
    }, [filteredOptions, preserveOrder]);

    // Flat list for keyboard navigation
    const flatOptions = useMemo(() => {
        const list: typeof options = [];
        groupedOptions.sortedGroups.forEach(g => {
            if (!collapsedGroups.has(g.name) || search) {
                list.push(...g.items);
            }
        });
        list.push(...groupedOptions.noGroup);
        return list;
    }, [groupedOptions, collapsedGroups, search]);

    const values = useMemo(() => Array.isArray(value) ? value : [value].filter(Boolean), [value]);

    const handleSelect = (val: string) => {
        if (isMulti) {
            const newValues = values.includes(val)
                ? values.filter(v => v !== val)
                : [...values, val];
            onChange(newValues);
        } else {
            onChange(val);
            setIsOpen(false);
            setSearch('');
        }
    };

    useEffect(() => {
        setActiveIndex(-1);
    }, [search, isOpen]);

    useLayoutEffect(() => {
        if (isOpen) {
            updateCoords();
            const closeOnScroll = (e: Event) => {
                if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
                    return;
                }
                setIsOpen(false);
            };
            window.addEventListener('scroll', closeOnScroll, true);
            window.addEventListener('resize', updateCoords);
            return () => {
                window.removeEventListener('scroll', closeOnScroll, true);
                window.removeEventListener('resize', updateCoords);
            };
        }
    }, [isOpen, updateCoords]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < flatOptions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < flatOptions.length) {
                handleSelect(flatOptions[activeIndex].value);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const toggleGroup = (e: React.MouseEvent, groupName: string) => {
        e.stopPropagation();
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) next.delete(groupName);
            else next.add(groupName);
            return next;
        });
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                const portalElement = document.querySelector('.searchable-select-dropdown');
                if (portalElement && portalElement.contains(event.target as Node)) {
                    return;
                }
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const dropdownContent = (
        <div
            ref={dropdownRef}
            className="text-sm text-brand-text border border-brand-border hover:border-brand-primary placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium fixed z-[9999] bg-white border border-slate-200 shadow-sm overflow-hidden searchable-select-dropdown flex flex-col"
            style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                maxHeight: '400px',
                pointerEvents: 'auto'
            }}
            onWheel={(e) => e.stopPropagation()}
        >
            <div className="border-b border-slate-100 bg-white relative shrink-0">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                    type="text"
                    className="w-full pl-9 pr-8 py-2.5 border-none text-sm focus:outline-none"
                    placeholder={t('search.placeholder')}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        onSearch?.(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    autoComplete="off"
                />
                {search && (
                    <FaTimes
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 cursor-pointer text-xs"
                        onClick={() => setSearch('')}
                    />
                )}
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1" ref={(el) => {
                if (el && isOpen && !search) {
                    // Try to scroll to selected item on open
                    const selectedEl = el.querySelector('[data-selected="true"]');
                    if (selectedEl) {
                        requestAnimationFrame(() => {
                            selectedEl.scrollIntoView({ block: 'nearest' });
                        });
                    }
                }
            }}>
                {filteredOptions.length > 0 ? (
                    <>
                        {groupedOptions.sortedGroups.map(group => {
                            // Automatically expand groups during search
                            const isCollapsed = collapsedGroups.has(group.name) && !search;
                            return (
                                <div key={group.name} className="flex flex-col">
                                    <div
                                        className="px-4 py-2 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-y border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors group/header"
                                        onClick={(e) => toggleGroup(e, group.name)}
                                    >
                                        <span>{group.name}</span>
                                        <FaChevronDown className={clsx("text-[8px] transition-transform", isCollapsed ? "-rotate-90" : "rotate-0")} />
                                    </div>
                                    {!isCollapsed && group.items.map((opt) => {
                                        const index = flatOptions.indexOf(opt);
                                        const isSelected = values.includes(opt.value);
                                        return (
                                            <div
                                                key={opt.value}
                                                data-selected={isSelected}
                                                className={clsx(
                                                    "px-4 py-2.5 text-sm cursor-pointer transition flex justify-between items-center",
                                                    activeIndex === index ? 'bg-brand-primary text-white' : 'text-slate-700 hover:bg-slate-50',
                                                    isSelected ? 'bg-slate-50/80' : ''
                                                )}
                                                onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    {isMulti && (
                                                        <div className={clsx(
                                                            "w-4 h-4 rounded-[3px] border transition-all flex items-center justify-center mr-0.5",
                                                            isSelected ? "bg-brand-primary border-brand-primary shadow-sm" : "bg-white border-slate-300 hover:border-slate-400"
                                                        )}>
                                                            {isSelected && <FaCheck className="text-white text-[9px]" />}
                                                        </div>
                                                    )}
                                                    {opt.icon && <span className="shrink-0 text-slate-400">{opt.icon}</span>}
                                                    <span className={clsx(isSelected && !isMulti && "font-semibold text-brand-primary")}>
                                                        {opt.label}
                                                    </span>
                                                </div>
                                                {!isMulti && isSelected && <FaCheck className="text-xs shrink-0 text-brand-primary" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                        {groupedOptions.noGroup.length > 0 && (
                            <div>
                                {groupedOptions.sortedGroups.length > 0 && (
                                    <div className="px-4 py-1.5 bg-white text-xs font-semibold text-slate-400 tracking-[0.15em] border-y border-slate-100/50">
                                        {t('select.misc')}
                                    </div>
                                )}
                                {groupedOptions.noGroup.map((opt) => {
                                    const index = flatOptions.indexOf(opt);
                                    const isSelected = values.includes(opt.value);
                                    return (
                                        <div
                                            key={opt.value}
                                            data-selected={isSelected}
                                            className={clsx(
                                                "px-4 py-2.5 text-sm cursor-pointer transition flex justify-between items-center",
                                                activeIndex === index ? 'bg-brand-primary text-white' : 'text-slate-700 hover:bg-slate-50',
                                                isSelected ? 'bg-slate-50/80' : ''
                                            )}
                                            onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {isMulti && (
                                                    <div className={clsx(
                                                        "w-4 h-4 rounded-[3px] border transition-all flex items-center justify-center mr-0.5",
                                                        isSelected ? "bg-brand-primary border-brand-primary shadow-sm" : "bg-white border-slate-300 hover:border-slate-400"
                                                    )}>
                                                        {isSelected && <FaCheck className="text-white text-[9px]" />}
                                                    </div>
                                                )}
                                                {opt.icon && <span className="shrink-0 text-slate-400">{opt.icon}</span>}
                                                <span className={clsx(isSelected && !isMulti && "font-semibold text-brand-primary")}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                            {!isMulti && isSelected && <FaCheck className="text-xs shrink-0 text-brand-primary" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="px-4 py-8 text-sm text-slate-400 text-center italic">{t('empty.noResults')}</div>
                )}
            </div>
            {onAddNew && (
                <div
                    className="p-2 border-t border-slate-100 bg-white shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            onAddNew();
                            setIsOpen(false);
                        }}
                        className="w-full"
                    >
                        <FaPlus className="text-xs text-brand-primary" />
                        {t('select.add_new')}
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <div className="relative w-full" ref={wrapperRef} data-error={error}>
            {label && <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">{label}</label>}
            <div
                id={id}
                className={clsx(
                    "w-full border px-3 py-1 text-sm text-brand-text flex justify-between items-center cursor-pointer transition-all h-9",
                    roundedSide === 'both' && "rounded-sm",
                    roundedSide === 'left' && "rounded-l-sm",
                    roundedSide === 'right' && "rounded-r-sm",
                    roundedSide === 'none' && "rounded-none",
                    isOpen ? "border-[rgb(18,58,60)] ring-2 ring-[rgba(18,58,60,0.1)] outline-none" : "border-brand-border hover:border-brand-primary shadow-sm",
                    error && "border-red-500 ring-red-500/10",
                    disabled ? "bg-slate-50 border-brand-border/50 cursor-not-allowed opacity-60" : "bg-white",
                    className
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                tabIndex={disabled ? -1 : 0}
            >
                <div className="flex flex-wrap items-center gap-1.5 overflow-hidden py-1 max-w-[calc(100%-40px)]">
                    {values.length > 0 ? (
                        <>
                            {values.slice(0, maxVisibleItems).map(v => {
                                const opt = options.find(o => o.value === v);
                                if (!opt) return null;
                                return (
                                    <div key={v} className={clsx(
                                        "flex items-center gap-1",
                                        isMulti ? "bg-brand-accent/10 border border-brand-accent/20 pl-1.5 pr-1 py-0.5 rounded-sm text-sm font-medium text-brand-text whitespace-nowrap" : "text-brand-text font-normal"
                                    )}>
                                        {opt.icon && <span className="shrink-0 text-slate-400">{opt.icon}</span>}
                                        <span className="truncate">{opt.label}</span>
                                        {isMulti && (
                                            <FaTimes
                                                className="ml-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                                                onClick={(e) => { e.stopPropagation(); handleSelect(v); }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                            {isMulti && values.length > maxVisibleItems && (
                                <div className="bg-brand-accent/10 border border-brand-accent/20 px-1.5 py-0.5 rounded-sm text-xs font-medium text-brand-text whitespace-nowrap">
                                    + {values.length - maxVisibleItems} {t('select.more')}
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="text-brand-muted">{placeholder ?? t('select.choose')}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {onEdit && (
                        <FaEdit
                            className="text-slate-400 hover:text-brand-primary cursor-pointer text-xs transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                        />
                    )}
                    {!isMulti && value && !disabled && isClearable && (
                        <FaTimes
                            className="text-slate-400 hover:text-red-500 cursor-pointer text-xs transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect('');
                            }}
                        />
                    )}
                    <FaChevronDown className={clsx("text-slate-400 text-xs transition-transform", isOpen ? 'rotate-180' : '')} />
                </div>
            </div>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div >
    );
};

export default SearchableSelect;
