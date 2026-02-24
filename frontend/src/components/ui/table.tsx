import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
    ({ className, ...props }, ref) => (
        <div className="relative w-full overflow-auto rounded-sm border border-slate-300 shadow-sm">
            <table ref={ref} className={cn("w-full caption-bottom text-sm border-collapse", className)} {...props} />
        </div>
    )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <thead ref={ref} className={cn("bg-[linear-gradient(180deg,#ffffff_0%,#f1f3f5_100%)] border-b border-slate-300", className)} {...props} />
    )
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tbody ref={ref} className={cn("[&_tr:last-child]:border-0 bg-white", className)} {...props} />
    )
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tfoot ref={ref} className={cn("border-t bg-slate-50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
    )
)
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn(
                "border-b border-slate-200 transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-100/80",
                className
            )}
            {...props}
        />
    )
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <th
            ref={ref}
            className={cn(
                "h-9 px-4 text-left align-middle text-[11px] font-bold text-slate-600 uppercase tracking-tight border-r border-slate-200/50 last:border-r-0 [&:has([role=checkbox])]:pr-0",
                className
            )}
            {...props}
        />
    )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <td
            ref={ref}
            className={cn(
                "px-4 py-2 align-middle text-sm border-r border-slate-100/50 last:border-r-0 [&:has([role=checkbox])]:pr-0",
                className
            )}
            {...props}
        />
    )
)
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
    ({ className, ...props }, ref) => (
        <caption ref={ref} className={cn("mt-4 text-sm text-slate-500", className)} {...props} />
    )
)
TableCaption.displayName = "TableCaption"

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
