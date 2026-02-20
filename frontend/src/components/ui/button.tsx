import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950/10 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
 {
 variants: {
 variant: {
 default: "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950",
 secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300",
 destructive: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
 outline: "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700",
 ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
 link: "text-slate-900 underline-offset-4 hover:underline",
 },
 size: {
 default: "h-9 px-4 py-2",
 sm: "h-8 px-3 text-xs",
 lg: "h-10 px-6",
 icon: "h-9 w-9",
 },
 },
 defaultVariants: {
 variant: "default",
 size: "default",
 },
 }
)

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement>,
 VariantProps<typeof buttonVariants> {
 asChild?: boolean
 isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
 const Comp = asChild ? Slot : "button"
 return (
 <Comp
 className={cn(buttonVariants({ variant, size, className }))}
 ref={ref}
 disabled={disabled || isLoading}
 {...props}
 >
 {isLoading && (
 <div className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
 )}
 {children}
 </Comp>
 )
 }
)
Button.displayName = "Button"

export { Button, buttonVariants }
