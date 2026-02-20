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
 return (
 <div className={cn("w-full", containerClassName)}>
 {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
 <textarea
 className={cn(
 "flex min-h-[80px] w-full rounded-sm bg-transparent px-3 py-2 text-sm text-slate-900 transition-colors resize-none",
 "border border-slate-200 hover:border-slate-300",
 "placeholder:text-slate-400",
 "focus:outline-none focus:ring-1 focus:ring-slate-950/10 focus:border-slate-400",
 "disabled:cursor-not-allowed disabled:opacity-50",
 error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
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
