import * as React from "react"
import { cn } from "@/lib/utils"
import { FaInfoCircle } from "react-icons/fa"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"
import { INPUT_CLASSES, LABEL_CLASSES } from "@/constants/designTokens"

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
                <div className="relative group">
                    {startIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors z-10 text-sm">
                            {startIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            error ? INPUT_CLASSES.error : INPUT_CLASSES.standard,
                            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
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
                    <p className={cn("mt-1 text-xs", error ? "text-red-500" : "text-slate-500")}>
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
