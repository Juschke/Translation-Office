import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
 React.ComponentRef<typeof CheckboxPrimitive.Root>,
 React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
 <CheckboxPrimitive.Root
 ref={ref}
 className={cn(
 "peer h-4 w-4 shrink-0 rounded-[3px] border border-slate-300 transition-colors",
 "hover:border-[#1B4D4F]",
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D4F]/20 focus-visible:ring-offset-1",
 "disabled:cursor-not-allowed disabled:opacity-50",
 "data-[state=checked]:bg-[#1B4D4F] data-[state=checked]:border-[#1B4D4F] data-[state=checked]:text-white",
 "data-[state=indeterminate]:bg-[#1B4D4F] data-[state=indeterminate]:border-[#1B4D4F] data-[state=indeterminate]:text-white",
 className
 )}
 {...props}
 >
 <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
 <Check className="h-3 w-3" strokeWidth={2.5} />
 </CheckboxPrimitive.Indicator>
 </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
