import React from 'react';
import SearchableSelect from './SearchableSelect';
import { countries } from '../../utils/countries';
import { getFlagUrl } from '../../utils/flags';

interface CountrySelectProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    error?: boolean;
    required?: boolean;
    className?: string;
    placeholder?: string;
    helperText?: string;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
    value,
    onChange,
    label = "Land",
    error,
    required,
    className,
    placeholder = "Land auswählen...",
    helperText
}) => {
    const options = countries.map(c => ({
        value: c.name,
        label: c.name,
        icon: <img src={getFlagUrl(c.code)} className="w-5 h-3.5 object-cover shadow-sm" alt="" />
    }));

    return (
        <div className="w-full">
            {label && (
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <SearchableSelect
                options={options}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                error={error}
                className={className}
            />
            {helperText && (
                <p className={`mt-1 text-xs font-medium ml-1 ${error ? "text-red-500" : "text-slate-400"}`}>
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default CountrySelect;
