import * as React from "react"
import { cn } from "@/lib/utils"
import { FaInfoCircle } from "react-icons/fa"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"
import { TEXTAREA_CLASSES, LABEL_CLASSES } from "@/constants/designTokens"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
 label?: string
 tooltip?: string
 error?: boolean
 helperText?: string
 containerClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
 ({ className, label, tooltip, error, helperText, containerClassName, ...props }, ref) => {
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
 <textarea
 className={cn(
 error ? TEXTAREA_CLASSES.error : TEXTAREA_CLASSES.standard,
 className
 )}
 ref={ref}
 {...props}
 />
 {helperText && (
 <p className={cn("mt-1.5 text-xs", error ? "text-red-500" : "text-slate-500")}>
 {helperText}
 </p>
 )}
 </div>
 )
 }
)
Textarea.displayName = "Textarea"

export { Textarea }
