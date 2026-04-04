import Skeleton from './Skeleton';
import clsx from 'clsx';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

const TableSkeleton = ({ rows = 8, columns = 6 }: TableSkeletonProps) => {
    return (
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-250px)]">
            {/* Header / Controls Bar */}
            <div className="px-4 py-2.5 border-b border-[#D1D9D8] flex justify-between items-center bg-gradient-to-b from-white to-[#f0f0f0]">
                <div className="flex gap-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-48 rounded" />
                    <Skeleton className="h-8 w-10 rounded" />
                </div>
            </div>

            {/* Table Header Wrapper */}
            <div className="border-b border-[#c8c8c8] bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] grid gap-4 px-4 py-3" style={{ gridTemplateColumns: `40px repeat(${columns - 1}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-3/4 opacity-60" />
                ))}
            </div>

            {/* Table Rows Wrapper */}
            <div className="flex-1 divide-y divide-slate-100 overflow-hidden">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className={clsx("px-4 py-4 grid gap-4 items-center", rowIndex % 2 !== 0 ? "bg-[#f9f9f9]" : "bg-white")} style={{ gridTemplateColumns: `40px repeat(${columns - 1}, 1fr)` }}>
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div key={colIndex} className="flex items-center gap-3">
                                {colIndex === 1 ? (
                                    <Skeleton variant="circular" width={32} height={32} className="shrink-0 opacity-40 brand" />
                                ) : colIndex === 0 ? (
                                    <Skeleton className="h-4 w-4 rounded-sm opacity-30" />
                                ) : null}
                                <div className="w-full space-y-2">
                                    <Skeleton className={clsx("h-3", colIndex === columns - 1 ? "w-1/2 ml-auto" : "w-3/4")} />
                                    {colIndex === 1 && <Skeleton className="h-2 w-1/2 opacity-50" />}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#D1D9D8] flex justify-between items-center bg-gradient-to-b from-[#f5f5f5] to-white">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-1">
                    <Skeleton className="h-7 w-7 rounded-[3px]" />
                    <Skeleton className="h-7 w-20 rounded-[3px]" />
                    <Skeleton className="h-7 w-7 rounded-[3px]" />
                </div>
            </div>
        </div>
    );
};

export default TableSkeleton;
