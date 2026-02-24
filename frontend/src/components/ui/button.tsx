import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950/10 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-white text-slate-700 border border-slate-300 shadow-sm hover:border-slate-400 hover:bg-slate-50 transition-colors",
                primary: "bg-[linear-gradient(180deg,hsl(174_100%_15%)_0%,hsl(174_100%_8%)_100%)] text-white border border-teal-950 shadow-desktop-raised hover:brightness-110 active:scale-95",
                dark: "bg-[linear-gradient(180deg,#2d3436_0%,#000000_100%)] text-white border border-black shadow-desktop-raised hover:brightness-125 active:scale-95",
                success: "bg-[linear-gradient(180deg,#1b4332_0%,#081c15_100%)] text-white border border-teal-950 shadow-desktop-raised hover:brightness-110 active:scale-95",
                danger: "bg-[linear-gradient(180deg,#c92a2a_0%,#a61e1e_100%)] text-white border border-red-950 shadow-desktop-raised hover:brightness-110 active:scale-95",
                secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300 shadow-sm transition-colors",
                outline: "border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 shadow-sm transition-colors",
                ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600 transition-colors",
                link: "text-slate-900 underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 px-3 text-xs",
                lg: "h-10 px-6",
                icon: "h-9 w-9",
                compact: "h-7 px-2 text-[11px] font-semibold uppercase tracking-wider",
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
