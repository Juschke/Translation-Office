import React from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import clsx from 'clsx';

interface PhoneInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    helperText?: string;
    required?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
    label,
    value,
    onChange,
    error,
    helperText,
    required
}) => {
    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <div className="w-full transition-all animate-fadeIn">
            {label && <label className={labelClasses}>{label}{required && ' *'}</label>}
            <div className={clsx(
                "phone-input-container",
                error && "phone-input-error"
            )}>
                <PhoneInputWithCountry
                    international
                    defaultCountry="DE"
                    value={value}
                    onChange={(val) => onChange(val || '')}
                    className={clsx(
                        "flex w-full px-3 transition-all outline-none border shadow-sm bg-white h-9 text-sm font-medium items-center",
                        "focus-within:ring-2 focus-within:ring-brand-500/10",
                        error ? "border-red-500 bg-red-50/10 focus-within:border-red-500" : "border-slate-200 focus-within:border-brand-500 hover:border-slate-300",
                        "rounded-none"
                    )}
                />
            </div>
            {helperText && (
                <p className={clsx("mt-1.5 text-[10px] font-medium ml-1", error ? "text-red-500" : "text-slate-400")}>
                    {helperText}
                </p>
            )}

            <style>{`
                .PhoneInputInput {
                    border: none !important;
                    outline: none !important;
                    height: 100% !important;
                    padding-left: 10px !important;
                    font-size: 0.875rem !important;
                    font-family: inherit !important;
                    color: #1e293b !important;
                }
                .PhoneInputCountry {
                    margin-right: 12px !important;
                }
                .PhoneInputCountrySelectArrow {
                    margin-left: 6px !important;
                    opacity: 0.5 !important;
                }
            `}</style>
        </div>
    );
};

export default PhoneInput;
