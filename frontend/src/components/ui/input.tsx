import * as React from "react"
import { cn } from "@/lib/utils"
import { FaInfoCircle } from "react-icons/fa"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    tooltip?: string
    error?: boolean
    helperText?: string
    startIcon?: React.ReactNode
    endIcon?: React.ReactNode
    onEndIconClick?: () => void
    containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, tooltip, error, helperText, startIcon, endIcon, onEndIconClick, containerClassName, ...props }, ref) => {
        const inputId = React.useId()
        const errorId = React.useId()
        const isRequired = props.required

        return (
            <div className={cn("w-full", containerClassName)}>
                {label && (
                    <label htmlFor={inputId} className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1 ml-1">
                        {label}
                        {isRequired && (
                            <span aria-hidden="true" className="text-red-500 ml-0.5">*</span>
                        )}
                        {tooltip && (
                            <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-slate-300 hover:text-slate-500 transition cursor-help">
                                            <FaInfoCircle className="text-2xs" />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs max-w-52">{tooltip}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </label>
                )}
                <div className="relative group">
                    {startIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors z-10 text-sm">
                            {startIcon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        type={type}
                        className={cn(
                            "flex h-9 w-full rounded-none bg-white px-3 py-1 text-sm text-brand-text transition-all",
                            "border border-slate-200 hover:border-brand-primary",
                            "placeholder:text-brand-muted",
                            "focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                            startIcon && "pl-9",
                            endIcon && "pr-9",
                            className
                        )}
                        aria-required={isRequired ? "true" : undefined}
                        aria-describedby={helperText ? errorId : undefined}
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
                    <p id={errorId} className={cn("mt-1 text-xs", error ? "text-red-500" : "text-slate-500")}>
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
