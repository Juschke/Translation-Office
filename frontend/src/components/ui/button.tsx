import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    [
        "inline-flex items-center justify-center gap-2 whitespace-nowrap",
        "rounded-[3px] text-sm font-medium",
        "transition-all duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D4F]/30 focus-visible:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        "select-none cursor-pointer",
    ].join(" "),
    {
        variants: {
            variant: {
                default: [
                    "bg-gradient-to-b from-[#2a7073] via-[#235e62] to-[#1B4D4F]",
                    "text-white border border-[#123a3c]",
                    "[text-shadow:0_-1px_0_rgba(0,0,0,0.28)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.14)]",
                    "hover:from-[#348388] hover:via-[#2a7073] hover:to-[#235e62]",
                    "active:from-[#1B4D4F] active:via-[#235e62] active:to-[#2a7073] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.15)]",
                ].join(" "),
                secondary: [
                    "bg-gradient-to-b from-[#fdfdfd] to-[#ebebeb]",
                    "text-slate-600 border border-[#cccccc]",
                    "[text-shadow:0_1px_1px_rgba(255,255,255,0.75)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.08)]",
                    "hover:from-white hover:to-[#e0e0e0] hover:border-[#adadad] hover:text-slate-800",
                    "active:from-[#ebebeb] active:to-[#fdfdfd] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.1)]",
                ].join(" "),
                destructive: [
                    "bg-gradient-to-b from-[#e05050] to-[#c9302c]",
                    "text-white border border-[#9c2320]",
                    "[text-shadow:0_-1px_0_rgba(0,0,0,0.28)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.14)]",
                    "hover:from-[#e85555] hover:to-[#d4302c]",
                    "active:from-[#c9302c] active:to-[#e05050] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.15)]",
                ].join(" "),
                warning: [
                    "bg-gradient-to-b from-[#f5b85a] to-[#ec971f]",
                    "text-white border border-[#d58512]",
                    "[text-shadow:0_-1px_0_rgba(0,0,0,0.22)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.12)]",
                    "hover:from-[#f7c168] hover:to-[#f0a32a]",
                    "active:from-[#ec971f] active:to-[#f5b85a] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.15)]",
                ].join(" "),
                success: [
                    "bg-gradient-to-b from-[#62bb62] to-[#449d44]",
                    "text-white border border-[#398439]",
                    "[text-shadow:0_-1px_0_rgba(0,0,0,0.22)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.12)]",
                    "hover:from-[#6ec86e] hover:to-[#4caf4c]",
                    "active:from-[#449d44] active:to-[#62bb62] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.15)]",
                ].join(" "),
                outline: [
                    "bg-gradient-to-b from-[#eff7f6] to-[#d7ebe9]",
                    "text-[#1B4D4F] border border-[#8fb4b1]",
                    "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_2px_rgba(0,0,0,0.06)]",
                    "hover:from-[#2a7073] hover:to-[#235e62] hover:text-white hover:border-[#123a3c]",
                    "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]",
                ].join(" "),
                ghost: [
                    "text-slate-600",
                    "hover:bg-slate-100 hover:text-slate-900",
                    "active:bg-slate-200",
                ].join(" "),
                link: "text-[#1B4D4F] underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-7 px-3 text-xs",
                lg: "h-10 px-6",
                icon: "h-9 w-9 p-0",
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
