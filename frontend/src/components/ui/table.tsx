import * as React from "react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────
   Bootstrap Skeuomorphism table components
   Brand teal: #1B4D4F  |  border: #D1D9D8  |  bg-app: #F4F7F6
   ────────────────────────────────────────────────────────── */

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
    ({ className, ...props }, ref) => (
        <div className="relative w-full overflow-hidden rounded-[3px] border border-[#ddd] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]">
            <table
                ref={ref}
                className={cn("w-full caption-bottom text-sm border-separate border-spacing-0", className)}
                {...props}
            />
        </div>
    )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(
    ({ className, ...props }, ref) => (
        <thead
            ref={ref}
            className={cn(
                "bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] border-b-2 border-[#c8c8c8]",
                className
            )}
            {...props}
        />
    )
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(
    ({ className, ...props }, ref) => (
        <tbody
            ref={ref}
            className={cn("[&_tr:last-child]:border-0 bg-white", className)}
            {...props}
        />
    )
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(
    ({ className, ...props }, ref) => (
        <tfoot
            ref={ref}
            className={cn(
                "border-t-2 border-[#c8c8c8] bg-gradient-to-b from-[#f5f5f5] to-[#ececec] font-semibold text-[#1B4D4F]",
                className
            )}
            {...props}
        />
    )
)
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn(
                "border-b border-[#e8e8e8] transition-colors duration-100",
                "hover:bg-[#f0f0f0]",
                "data-[state=selected]:bg-[#dff0ef]",
                className
            )}
            {...props}
        />
    )
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(
    ({ className, ...props }, ref) => (
        <th
            ref={ref}
            className={cn(
                "h-10 px-3 text-left align-middle",
                "text-[11px] font-bold text-[#1B4D4F] uppercase tracking-[0.06em]",
                "[text-shadow:0_1px_0_rgba(255,255,255,0.75)]",
                "whitespace-nowrap",
                className
            )}
            {...props}
        />
    )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(
    ({ className, ...props }, ref) => (
        <td
            ref={ref}
            className={cn(
                "px-3 py-2.5 align-middle text-sm text-[#333]",
                "border-b border-[#e8e8e8] group-last:border-b-0",
                className
            )}
            {...props}
        />
    )
)
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
    HTMLTableCaptionElement,
    React.HTMLAttributes<HTMLTableCaptionElement>
>(
    ({ className, ...props }, ref) => (
        <caption
            ref={ref}
            className={cn("mt-3 text-xs text-slate-500 italic", className)}
            {...props}
        />
    )
)
TableCaption.displayName = "TableCaption"

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
}
