import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
import clsx from 'clsx';

interface SearchableSelectProps {
    options: { value: string; label: string; icon?: string; group?: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: boolean;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Bitte wählen...", label, error, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);

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
            opt.label.toLowerCase().includes(search.toLowerCase()) ||
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
            items: groups[groupName].sort((a, b) => a.label.localeCompare(b.label))
        }));

        return { sortedGroups, noGroup: noGroup.sort((a, b) => a.label.localeCompare(b.label)) };
    }, [filteredOptions]);

    // Flat list for keyboard navigation
    const flatOptions = useMemo(() => {
        const list: typeof options = [];
        groupedOptions.sortedGroups.forEach(g => {
            list.push(...g.items);
        });
        list.push(...groupedOptions.noGroup);
        return list;
    }, [groupedOptions]);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        setActiveIndex(flatOptions.length > 0 ? 0 : -1);
    }, [search, isOpen, flatOptions.length]);

    useLayoutEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
            return () => {
                window.removeEventListener('scroll', updateCoords, true);
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
                onChange(flatOptions[activeIndex].value);
                setIsOpen(false);
                setSearch('');
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
            className="fixed z-[9999] bg-white border border-slate-200 shadow-xl overflow-hidden animate-fadeIn searchable-select-dropdown flex flex-col"
            style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                maxHeight: '400px'
            }}
        >
            <div className="border-b border-slate-100 bg-white relative shrink-0">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2.5 border-none text-sm focus:outline-none"
                    placeholder="Suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1">
                {flatOptions.length > 0 ? (
                    <>
                        {groupedOptions.sortedGroups.map(group => (
                            <div key={group.name}>
                                <div className="px-4 py-1.5 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] border-y border-slate-100/50">
                                    {group.name}
                                </div>
                                {group.items.map((opt) => {
                                    const index = flatOptions.indexOf(opt);
                                    return (
                                        <div
                                            key={opt.value}
                                            className={clsx(
                                                "px-6 py-2.5 text-sm cursor-pointer transition flex justify-between items-center",
                                                activeIndex === index ? 'bg-brand-50/50 text-brand-700' : 'text-slate-700 hover:bg-slate-50',
                                                opt.value === value ? 'font-bold bg-brand-50/30' : ''
                                            )}
                                            onClick={() => {
                                                onChange(opt.value);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                {opt.icon && <img src={opt.icon} className="w-5 h-3.5 object-cover shrink-0 shadow-sm" alt="" />}
                                                <span className="truncate">{opt.label}</span>
                                            </div>
                                            {opt.value === value && <FaCheck className="text-[10px] shrink-0 text-brand-600" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        {groupedOptions.noGroup.length > 0 && (
                            <div>
                                {groupedOptions.sortedGroups.length > 0 && (
                                    <div className="px-4 py-1.5 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] border-y border-slate-100/50">
                                        Sonstiges
                                    </div>
                                )}
                                {groupedOptions.noGroup.map((opt) => {
                                    const index = flatOptions.indexOf(opt);
                                    return (
                                        <div
                                            key={opt.value}
                                            className={clsx(
                                                "px-4 py-2.5 text-sm cursor-pointer transition flex justify-between items-center",
                                                activeIndex === index ? 'bg-brand-50/50 text-brand-700' : 'text-slate-700 hover:bg-slate-50',
                                                opt.value === value ? 'font-bold bg-brand-50/30' : ''
                                            )}
                                            onClick={() => {
                                                onChange(opt.value);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                {opt.icon && <img src={opt.icon} className="w-5 h-3.5 object-cover shrink-0 shadow-sm" alt="" />}
                                                <span className="truncate">{opt.label}</span>
                                            </div>
                                            {opt.value === value && <FaCheck className="text-[10px] shrink-0 text-brand-600" />}
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
        </div>
    );

    return (
        <div className="relative w-full" ref={wrapperRef} data-error={error}>
            {label && <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">{label}</label>}
            <div
                className={clsx(
                    "w-full border px-3 py-2 text-sm bg-white flex justify-between items-center cursor-pointer transition h-10",
                    error ? "border-red-500 ring-2 ring-red-500/10" : "border-slate-300 hover:border-slate-400",
                    isOpen ? "border-brand-500 ring-2 ring-brand-500/10 shadow-sm" : "shadow-sm",
                    className
                )}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedOption?.icon && (
                        <img src={selectedOption.icon} className="w-4 h-3 object-cover shrink-0 shadow-sm" alt="" />
                    )}
                    <span className={clsx("truncate", selectedOption ? 'text-slate-800 font-bold' : 'text-slate-400')}>
                        {selectedOption?.label || placeholder}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {value && (
                        <FaTimes
                            className="text-slate-300 hover:text-red-500 cursor-pointer text-[10px] transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                        />
                    )}
                    <FaChevronDown className={clsx("text-slate-400 text-[10px] transition-transform", isOpen ? 'rotate-180' : '')} />
                </div>
            </div>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default SearchableSelect;
