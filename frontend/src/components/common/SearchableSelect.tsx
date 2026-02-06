import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
import clsx from 'clsx';

interface SearchableSelectProps {
    options: { value: string; label: string; icon?: string }[];
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
            // We use fixed positioning, so we just need the viewport coordinates
            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            });
        }
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        setActiveIndex(filteredOptions.length > 0 ? 0 : -1);
    }, [search, isOpen]);

    useLayoutEffect(() => {
        if (isOpen) {
            updateCoords();

            // Add scroll and resize listeners to keep the dropdown attached to the input
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
            setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
                onChange(filteredOptions[activeIndex].value);
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
                // Also check if the click was inside the portal content
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
            className="fixed z-[9999] bg-white border border-slate-200 shadow-xl overflow-hidden animate-fadeIn searchable-select-dropdown"
            style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                maxHeight: '300px'
            }}
        >
            <div className="border-b border-slate-100 bg-white relative">
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
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt, index) => (
                        <div
                            key={opt.value}
                            className={`px-4 py-2.5 text-sm cursor-pointer transition flex justify-between items-center ${activeIndex === index ? 'bg-slate-50 text-brand-700' : ''
                                } ${opt.value === value ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                                setSearch('');
                            }}
                            ref={el => {
                                if (activeIndex === index && el) {
                                    el.scrollIntoView({ block: 'nearest' });
                                }
                            }}
                        >
                            <div className="flex items-center gap-3">
                                {opt.icon && (
                                    <img src={opt.icon} className="w-5 h-3.5 object-cover shrink-0 shadow-sm" alt="" />
                                )}
                                <span className="truncate">{opt.label}</span>
                            </div>
                            {opt.value === value && <FaCheck className="text-[10px] shrink-0 text-brand-600" />}
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">Keine Ergebnisse</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="relative w-full" ref={wrapperRef} data-error={error}>
            {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</label>}
            <div
                className={clsx(
                    "w-full border px-3 py-2 text-sm bg-white flex justify-between items-center cursor-pointer transition",
                    error ? "border-red-500 ring-2 ring-red-500/10" : "border-slate-300 hover:border-brand-500 focus:border-brand-500",
                    isOpen ? "border-brand-500 ring-4 ring-brand-500/5 shadow-sm" : "shadow-sm",
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
                    <span className={clsx("truncate", selectedOption ? 'text-slate-800 font-medium' : 'text-slate-400')}>
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
