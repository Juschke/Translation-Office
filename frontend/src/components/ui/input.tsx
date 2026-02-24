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
                {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
                <div className="relative group">
                    {startIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors z-10 text-sm">
                            {startIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-9 w-full rounded-[var(--radius-sm)] bg-white px-3 py-1 text-sm text-brand-text transition-all",
                            "border border-brand-border hover:border-brand-primary",
                            "placeholder:text-brand-muted",
                            "focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
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
                                "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors z-10 text-sm",
                                onEndIconClick ? "cursor-pointer hover:text-slate-700" : "pointer-events-none"
                            )}
                        >
                            {endIcon}
                        </div>
                    )}
                </div>
                {helperText && (
                    <p className={cn("mt-1.5 text-xs", error ? "text-red-500" : "text-slate-500")}>
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
