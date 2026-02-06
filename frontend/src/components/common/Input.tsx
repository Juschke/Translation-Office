import React, { type ReactNode } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
    label?: string;
    error?: boolean;
    helperText?: string;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    onEndIconClick?: () => void;
    containerClassName?: string;
    isTextArea?: boolean;
    isSelect?: boolean;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    startIcon,
    endIcon,
    onEndIconClick,
    className,
    containerClassName,
    isTextArea,
    isSelect,
    children,
    ...props
}) => {
    const inputClasses = clsx(
        "w-full px-3 transition-all outline-none border shadow-sm bg-white",
        "focus:ring-2 focus:ring-brand-500/10",
        error ? "border-red-500 bg-red-50/10 focus:border-red-500" : "border-slate-200 focus:border-brand-500 hover:border-slate-300",
        startIcon ? "pl-9" : "pl-3",
        endIcon ? "pr-9" : "pr-3",
        isTextArea ? "py-2 min-h-[100px] resize-none" : "h-11",
        "text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal",
        "rounded-none", // Keeping consistency with the current clean, angular design
        className
    );

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <div className={clsx("w-full transition-all animate-fadeIn", containerClassName)}>
            {label && <label className={labelClasses}>{label}</label>}
            <div className="relative group">
                {startIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors z-10 text-xs">
                        {startIcon}
                    </div>
                )}

                {isTextArea ? (
                    <textarea
                        className={inputClasses}
                        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    />
                ) : isSelect ? (
                    <div className="relative">
                        <select
                            className={clsx(inputClasses, "appearance-none")}
                            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
                        >
                            {children}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                ) : (
                    <input
                        className={inputClasses}
                        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                    />
                )}

                {endIcon && (
                    <div
                        onClick={onEndIconClick}
                        className={clsx(
                            "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors z-10 text-xs text-right",
                            onEndIconClick ? "cursor-pointer hover:text-brand-600" : "pointer-events-none"
                        )}
                    >
                        {endIcon}
                    </div>
                )}
            </div>
            {helperText && (
                <p className={clsx("mt-1.5 text-[10px] font-medium ml-1", error ? "text-red-500" : "text-slate-400")}>
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default Input;
