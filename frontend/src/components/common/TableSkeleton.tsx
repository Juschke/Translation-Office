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
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex gap-4">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-7 w-24" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-48 rounded" />
                    <Skeleton className="h-9 w-10 rounded" />
                </div>
            </div>

            {/* Table Header Wrapper */}
            <div className="border-b border-slate-100 bg-slate-50 grid gap-4 px-4 py-3" style={{ gridTemplateColumns: `40px repeat(${columns - 1}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-3.5 w-3/4 opacity-70" />
                ))}
            </div>

            {/* Table Rows Wrapper */}
            <div className="flex-1 divide-y divide-slate-100 overflow-hidden bg-white">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="px-4 py-4 grid gap-4 items-center hover:bg-slate-50/50 transition-colors" style={{ gridTemplateColumns: `40px repeat(${columns - 1}, 1fr)` }}>
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div key={colIndex} className="flex items-center gap-3 w-full">
                                {colIndex === 1 && (
                                    <Skeleton variant="circular" width={32} height={32} className="shrink-0 opacity-40 brand" />
                                )}
                                {colIndex === 0 && (
                                    <Skeleton className="h-4 w-4 rounded-sm opacity-30" />
                                )}
                                <div className="flex-1 space-y-2">
                                    <Skeleton className={clsx("h-3", colIndex === columns - 1 ? "w-1/2 ml-auto" : "w-3/4")} />
                                    {colIndex === 1 && <Skeleton className="h-2.5 w-1/2 opacity-50" />}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 flex justify-between items-center bg-white">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-1.5">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            </div>
        </div>
    );
};

export default TableSkeleton;
