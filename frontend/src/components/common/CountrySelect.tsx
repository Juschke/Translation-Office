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
}

const CountrySelect: React.FC<CountrySelectProps> = ({
    value,
    onChange,
    label = "Land",
    error,
    className,
    placeholder = "Land auswählen..."
}) => {
    const options = countries.map(c => ({
        value: c.name,
        label: c.name,
        icon: getFlagUrl(c.code)
    }));

    return (
        <div className={className}>
            {label && (
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
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
        </div>
    );
};

export default CountrySelect;
