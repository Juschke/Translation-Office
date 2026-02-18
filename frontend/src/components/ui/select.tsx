import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: boolean
    helperText?: string
    containerClassName?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, helperText, containerClassName, children, ...props }, ref) => {
        return (
            <div className={cn("w-full", containerClassName)}>
                {label && <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-0.5">{label}</label>}
                <div className="relative">
                    <select
                        className={cn(
                            "flex h-9 w-full appearance-none rounded-sm bg-white px-3 py-1.5 pr-8 text-sm font-semibold text-slate-800 shadow-sm transition-all",
                            "border border-slate-200 hover:border-slate-300",
                            "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10",
                            className
                        )}
                        ref={ref}
                        {...props}
                    >
                        {children}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                {helperText && (
                    <p className={cn("mt-1 text-[11px] font-medium ml-0.5", error ? "text-red-600" : "text-slate-400")}>
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)
Select.displayName = "Select"

export { Select }
