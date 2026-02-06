import Skeleton from './Skeleton';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

const TableSkeleton = ({ rows = 5, columns = 5 }: TableSkeletonProps) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                </div>
            </div>

            {/* Table Header */}
            <div className="border-b border-slate-200 bg-slate-50 grid gap-4 p-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                ))}
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="p-4 grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div key={colIndex} className="flex items-center gap-2">
                                {colIndex === 0 && <Skeleton variant="circular" width={24} height={24} className="shrink-0" />}
                                <div className="w-full space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    {colIndex === 1 && <Skeleton className="h-3 w-1/2" />}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/30">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            </div>
        </div>
    );
};

export default TableSkeleton;
