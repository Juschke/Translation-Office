import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaTimes, FaSearch } from 'react-icons/fa';

interface Option {
 value: string;
 label: string;
}

interface MultiSelectProps {
 label: string;
 options: Option[];
 value: string[];
 onChange: (value: string[]) => void;
 placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, value, onChange, placeholder = 'Wählen...' }) => {
 const [isOpen, setIsOpen] = useState(false);
 const [search, setSearch] = useState('');
 const [activeIndex, setActiveIndex] = useState(-1);
 const containerRef = useRef<HTMLDivElement>(null);

 const filteredOptions = options.filter(opt =>
 opt.label.toLowerCase().includes(search.toLowerCase())
 );

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
 toggleOption(filteredOptions[activeIndex].value);
 // Keep open for multi select or close? Usually keep open for multi select.
 // But user might want to select multiple.
 // Standard behavior for multi select enter is just toggle.
 }
 } else if (e.key === 'Escape') {
 setIsOpen(false);
 }
 };

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
 setIsOpen(false);
 }
 };

 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const toggleOption = (optionValue: string) => {
 const newValue = value.includes(optionValue)
 ? value.filter(v => v !== optionValue)
 : [...value, optionValue];
 onChange(newValue);
 };

 const removeValue = (e: React.MouseEvent, optionValue: string) => {
 e.stopPropagation();
 onChange(value.filter(v => v !== optionValue));
 };

 return (
 <div className="relative" ref={containerRef}>
 <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">{label}</label>
 <div
 className={`w-full border rounded-sm px-3 py-2 min-h-[42px] bg-white cursor-pointer flex flex-wrap gap-2 items-center transition shadow-sm ${isOpen ? 'border-slate-900 ring-2 ring-slate-950/10' : 'border-slate-300 hover:border-slate-400'}`}
 onClick={() => setIsOpen(!isOpen)}
 onKeyDown={handleKeyDown}
 tabIndex={0}
 >
 {value.length > 0 ? (
 value.map(v => {
 const option = options.find(o => o.value === v);
 return (
 <span key={v} className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-sm flex items-center gap-1 border border-slate-200">
 {option?.label || v}
 <FaTimes
 className="text-slate-400 hover:text-red-500 cursor-pointer"
 onClick={(e) => removeValue(e, v)}
 />
 </span>
 );
 })
 ) : (
 <span className="text-slate-400 text-sm">{placeholder}</span>
 )}
 <div className="ml-auto flex items-center gap-2">
 {value.length > 0 && (
 <FaTimes
 className="text-slate-300 hover:text-red-500 cursor-pointer text-xs transition-colors"
 onClick={(e) => {
 e.stopPropagation();
 onChange([]);
 }}
 />
 )}
 <FaChevronDown className={`text-slate-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} />
 </div>
 </div>

 {isOpen && (
 <div className="absolute z-50 w-full rounded-sm bg-white border border-slate-200 max-h-60 overflow-hidden flex flex-col shadow-sm">
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
 <div className="overflow-y-auto custom-scrollbar flex-1">
 {filteredOptions.map((option, index) => (
 <div
 key={option.value}
 className={`px-4 py-2.5 text-sm cursor-pointer transition flex items-center gap-2 ${activeIndex === index ? 'bg-slate-50 text-slate-900' : ''
 } ${value.includes(option.value) ? 'bg-slate-50 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'
 }`}
 onClick={() => toggleOption(option.value)}
 ref={el => {
 if (activeIndex === index && el) {
 el.scrollIntoView({ block: 'nearest' });
 }
 }}
 >
 <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition ${value.includes(option.value) ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}>
 {value.includes(option.value) && <span className="text-white text-xs">✓</span>}
 </div>
 {option.label}
 </div>
 ))}
 {filteredOptions.length === 0 && (
 <div className="px-4 py-3 text-sm text-slate-400 italic text-center">Keine Ergebnisse</div>
 )}
 </div>
 </div>
 )}
 </div>
 );
};

export default MultiSelect;
