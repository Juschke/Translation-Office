import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: boolean
    helperText?: string
    containerClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, helperText, containerClassName, ...props }, ref) => {
        const labelClasses = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-0.5"

        return (
            <div className={cn("w-full", containerClassName)}>
                {label && <label className={labelClasses}>{label}</label>}
                <textarea
                    className={cn(
                        "flex min-h-[100px] w-full rounded-sm bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all resize-none",
                        "border border-slate-200 hover:border-slate-300",
                        "placeholder:text-slate-400 placeholder:font-normal",
                        "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {helperText && (
                    <p className={cn("mt-1 text-[11px] font-medium ml-0.5", error ? "text-red-600" : "text-slate-400")}>
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
