import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown, FaSearch, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';

interface SearchableSelectProps {
    options: { value: string; label: string; icon?: string; group?: string }[];
    value: string | string[];
    onChange: (value: any) => void;
    placeholder?: string;
    label?: string;
    error?: boolean;
    className?: string;
    isMulti?: boolean;
    onAddNew?: () => void;
    addNewLabel?: string;
    id?: string;
    preserveOrder?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options, value, onChange, placeholder = "Bitte wählen...", label, error, className = "",
    isMulti = false, onAddNew, addNewLabel = "Neu hinzufügen", id, preserveOrder = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
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

        const sortedGroups = Object.keys(groups).sort().map(groupName => ({
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
            list.push(...g.items);
        });
        list.push(...groupedOptions.noGroup);
        return list;
    }, [groupedOptions]);

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
        setActiveIndex(flatOptions.length > 0 ? 0 : -1);
    }, [search, isOpen, flatOptions.length]);

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
            className="fixed z-[9999] bg-white border border-slate-200 shadow-sm overflow-hidden animate-fadeIn searchable-select-dropdown flex flex-col"
            style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                maxHeight: '400px',
                pointerEvents: 'auto'
            }}
        >
            <div className="border-b border-slate-100 bg-white relative shrink-0">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                    type="text"
                    className="w-full pl-9 pr-8 py-2.5 border-none text-sm focus:outline-none"
                    placeholder="Suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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
                {flatOptions.length > 0 ? (
                    <>
                        {groupedOptions.sortedGroups.map(group => (
                            <div key={group.name}>
                                <div className="px-4 py-1.5 bg-white text-xs font-semibold text-slate-400 tracking-[0.15em] border-y border-slate-100/50">
                                    {group.name}
                                </div>
                                {group.items.map((opt) => {
                                    const index = flatOptions.indexOf(opt);
                                    const isSelected = values.includes(opt.value);
                                    return (
                                        <div
                                            key={opt.value}
                                            data-selected={isSelected}
                                            className={clsx(
                                                "px-4 py-2 text-sm cursor-pointer transition flex justify-between items-center",
                                                activeIndex === index ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50',
                                                isSelected ? 'font-semibold bg-slate-50/30' : ''
                                            )}
                                            onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isMulti && (
                                                    <div className={clsx(
                                                        "w-3.5 h-3.5 rounded-sm border transition-colors flex items-center justify-center mr-1",
                                                        isSelected ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300"
                                                    )}>
                                                        {isSelected && <FaCheck className="text-white text-[7px]" />}
                                                    </div>
                                                )}
                                                {opt.icon && <img src={opt.icon} className="w-5 h-3.5 object-cover shrink-0 shadow-sm" alt="" />}
                                                <span>{opt.label}</span>
                                            </div>
                                            {!isMulti && isSelected && <FaCheck className="text-xs shrink-0 text-slate-700" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        {groupedOptions.noGroup.length > 0 && (
                            <div>
                                {groupedOptions.sortedGroups.length > 0 && (
                                    <div className="px-4 py-1.5 bg-white text-xs font-semibold text-slate-400 tracking-[0.15em] border-y border-slate-100/50">
                                        Sonstiges
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
                                                "px-4 py-2 text-sm cursor-pointer transition flex justify-between items-center",
                                                activeIndex === index ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50',
                                                isSelected ? 'font-semibold bg-slate-50/30' : ''
                                            )}
                                            onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isMulti && (
                                                    <div className={clsx(
                                                        "w-3.5 h-3.5 rounded-sm border transition-colors flex items-center justify-center mr-1",
                                                        isSelected ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300"
                                                    )}>
                                                        {isSelected && <FaCheck className="text-white text-[7px]" />}
                                                    </div>
                                                )}
                                                {opt.icon && <img src={opt.icon} className="w-5 h-3.5 object-cover shrink-0 shadow-sm" alt="" />}
                                                <span>{opt.label}</span>
                                            </div>
                                            {!isMulti && isSelected && <FaCheck className="text-xs shrink-0 text-slate-700" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="px-4 py-8 text-sm text-slate-400 text-center italic">Keine Ergebnisse</div>
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
                        <FaPlus className="text-xs" /> {addNewLabel}
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <div className="relative w-full" ref={wrapperRef} data-error={error}>
            {label && <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">{label}</label>}
            <div
                id={id}
                className={clsx(
                    "w-full border px-3 py-1 text-sm bg-white flex justify-between items-center cursor-pointer transition h-9",
                    error ? "border-red-700 ring-2 ring-red-700/10" : "border-slate-300 hover:border-slate-400",
                    isOpen ? "border-slate-900 ring-2 ring-slate-950/10 shadow-sm" : "shadow-sm",
                    className
                )}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                <div className="flex flex-wrap items-center gap-1.5 overflow-hidden py-1">
                    {values.length > 0 ? (
                        values.map(v => {
                            const opt = options.find(o => o.value === v);
                            if (!opt) return null;
                            return (
                                <div key={v} className={clsx(
                                    "flex items-center gap-1",
                                    isMulti ? "bg-slate-100 border border-slate-200 pl-1.5 pr-1 py-0.5 rounded-sm text-sm font-medium text-slate-700" : "font-semibold text-slate-800"
                                )}>
                                    {opt.icon && <img src={opt.icon} className="w-4 h-3 object-cover shrink-0 shadow-sm" alt="" />}
                                    <span>{opt.label}</span>
                                    {isMulti && (
                                        <FaTimes
                                            className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); handleSelect(v); }}
                                        />
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <span className="text-slate-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {!isMulti && value && (
                        <FaTimes
                            className="text-slate-300 hover:text-red-500 cursor-pointer text-xs transition-colors"
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
