import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: boolean
    helperText?: string
    startIcon?: React.ReactNode
    endIcon?: React.ReactNode
    onEndIconClick?: () => void
    containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, helperText, startIcon, endIcon, onEndIconClick, containerClassName, ...props }, ref) => {
        return (
            <div className={cn("w-full", containerClassName)}>
                {label && <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-0.5">{label}</label>}
                <div className="relative group">
                    {startIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors z-10 text-xs">
                            {startIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-9 w-full rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition-all",
                            "border border-slate-200 hover:border-slate-300",
                            "placeholder:text-slate-400 placeholder:font-normal",
                            "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                            error && "border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10",
                            startIcon && "pl-9",
                            endIcon && "pr-9",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {endIcon && (
                        <div
                            onClick={onEndIconClick}
                            className={cn(
                                "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors z-10 text-xs",
                                onEndIconClick ? "cursor-pointer hover:text-brand-600" : "pointer-events-none"
                            )}
                        >
                            {endIcon}
                        </div>
                    )}
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
Input.displayName = "Input"

export { Input }
