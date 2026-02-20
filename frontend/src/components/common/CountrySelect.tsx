import React from 'react';
import SearchableSelect from './SearchableSelect';
import { countries } from '../../utils/countries';
import { getFlagUrl } from '../../utils/flags';

interface CountrySelectProps {
 value: string;
 onChange: (value: string) => void;
 label?: string;
 error?: boolean;
 className?: string;
 placeholder?: string;
 helperText?: string;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
 value,
 onChange,
 label = "Land",
 error,
 className,
 placeholder = "Land auswählen...",
 helperText
}) => {
 const options = countries.map(c => ({
 value: c.name,
 label: c.name,
 icon: getFlagUrl(c.code)
 }));

 return (
 <div className={className}>
 {label && (
 <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
 {label}
 </label>
 )}
 <SearchableSelect
 options={options}
 value={value}
 onChange={onChange}
 placeholder={placeholder}
 error={error}
 className="h-11"
 />
 {helperText && (
 <p className={`mt-1.5 text-xs font-medium ml-1 ${error ? "text-red-500" : "text-slate-400"}`}>
 {helperText}
 </p>
 )}
 </div>
 );
};

export default CountrySelect;
