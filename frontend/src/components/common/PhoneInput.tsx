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
    const labelClasses = "block text-xs font-semibold text-slate-600 mb-1";

    return (
        <div className="w-full transition-all animate-fadeIn">
            {label && <label className={labelClasses}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
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
                        "flex w-full px-3 py-1 h-9 text-sm items-center border rounded-[3px]",
                        "bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
                        "outline-none transition-colors border-[#ccc]",
                        "focus-within:border-[#1B4D4F] focus-within:ring-1 focus-within:ring-[#1B4D4F]/20",
                        error ? "border-red-400 bg-red-50 focus-within:border-red-500 focus-within:ring-red-400/20" : ""
                    )}
                />
            </div>
            {helperText && (
                <p className={clsx("mt-1 text-sm font-medium ml-0.5", error ? "text-red-500" : "text-slate-400")}>
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
