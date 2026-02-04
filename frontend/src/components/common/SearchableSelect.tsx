import { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
import clsx from 'clsx';

interface SearchableSelectProps {
    options: { value: string; label: string; icon?: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Bitte wählen...", label, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        setActiveIndex(filteredOptions.length > 0 ? 0 : -1);
    }, [search, isOpen]);

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
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {label && <label className="block text-xs font-medium text-slate-500 uppercase mb-1">{label}</label>}
            <div
                className={`w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white flex justify-between items-center cursor-pointer hover:border-brand-500 transition ${className}`}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedOption?.icon && (
                        <img src={selectedOption.icon} className="w-4 h-3 object-cover rounded-sm shrink-0" alt="" />
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

            {isOpen && (
                <div className="absolute z-50 w-full bg-white border border-slate-200   overflow-hidden animate-fadeIn">
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
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, index) => (
                                <div
                                    key={opt.value}
                                    className={`px-4 py-2 text-sm cursor-pointer transition flex justify-between items-center ${activeIndex === index ? 'bg-slate-50 text-brand-700' : ''
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
                                    <div className="flex items-center gap-2">
                                        {opt.icon && (
                                            <img src={opt.icon} className="w-4 h-3 object-cover rounded-sm shrink-0" alt="" />
                                        )}
                                        <span className="truncate">{opt.label}</span>
                                    </div>
                                    {opt.value === value && <FaCheck className="text-[10px] shrink-0" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center">Keine Ergebnisse</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
