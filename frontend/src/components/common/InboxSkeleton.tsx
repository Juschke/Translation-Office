import Skeleton from './Skeleton';

const InboxSkeleton = () => {
    return (
        <div className="flex flex-col h-full gap-6 fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-9 w-32 rounded" />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                {/* Sidebar (Folders) */}
                <div className="w-60 bg-slate-50 border-r border-slate-200 p-3 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded" />
                    ))}
                </div>

                {/* Mail List */}
                <div className="w-80 border-r border-slate-200 flex flex-col">
                    <div className="p-3 border-b border-slate-100">
                        <Skeleton className="h-8 w-full rounded" />
                    </div>
                    <div className="p-0">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-4 border-b border-slate-50 space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-2 w-10" />
                                </div>
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mail Detail View */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-64" />
                            <div className="flex gap-2 items-center">
                                <Skeleton variant="circular" width={20} height={20} />
                                <Skeleton className="h-3 w-40" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex justify-end">
                            <Skeleton className="h-16 w-1/3 rounded-lg rounded-tr-none" />
                        </div>
                        <div className="flex gap-4">
                            <Skeleton variant="circular" width={32} height={32} className="shrink-0" />
                            <div className="space-y-2 w-2/3">
                                <Skeleton className="h-32 w-full rounded-lg rounded-tl-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InboxSkeleton;
