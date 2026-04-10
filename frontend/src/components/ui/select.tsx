import * as React from "react"
import { cn } from "@/lib/utils"
import { FaInfoCircle } from "react-icons/fa"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"
import { SELECT_CLASSES, LABEL_CLASSES } from "@/constants/designTokens"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    tooltip?: string
    error?: boolean
    helperText?: string
    containerClassName?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, tooltip, error, helperText, containerClassName, children, ...props }, ref) => {
        return (
            <div className={cn("w-full", containerClassName)}>
                {label && (
                    <label className={cn("flex items-center gap-1", LABEL_CLASSES.default)}>
                        {label}
                        {props.required && <span className="text-red-500 ml-0.5">*</span>}
                        {tooltip && (
                            <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-slate-300 hover:text-slate-500 transition cursor-help">
                                            <FaInfoCircle className="text-[10px]" />
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
                <div className="relative">
                    <select
                        className={cn(
                            error ? SELECT_CLASSES.error : SELECT_CLASSES.standard,
                            className
                        )}
                        ref={ref}
                        {...props}
                    >
                        {children}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
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
Select.displayName = "Select"

export { Select }
