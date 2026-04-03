import Skeleton from './Skeleton';

const MailSkeleton = () => {
    return (
        <div className="flex flex-col gap-6 fade-in h-full">
            {/* Header */}
            <div className="flex justify-between items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 px-0" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-32 rounded" />
                    <Skeleton className="h-9 w-32 rounded" />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-col bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden flex-1" style={{ minHeight: '500px' }}>
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-slate-100 bg-slate-50/30 p-4 space-y-6 shrink-0">
                        <div className="space-y-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded" />
                            ))}
                        </div>
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <Skeleton className="h-4 w-20" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full rounded" />
                            ))}
                        </div>
                    </div>

                    {/* Mail List */}
                    <div className="w-[350px] border-r border-slate-100 flex flex-col shrink-0">
                        <div className="p-4 border-b border-slate-100">
                            <Skeleton className="h-9 w-full rounded" />
                        </div>
                        <div className="flex-1 overflow-hidden p-0">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="p-4 border-b border-slate-50 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mail Content */}
                    <div className="flex-1 bg-white p-8 space-y-8 overflow-hidden">
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-2/3" />
                            <div className="flex items-center gap-4">
                                <Skeleton variant="circular" width={40} height={40} />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-8 w-24 rounded" />
                            </div>
                        </div>
                        <div className="space-y-4 pt-8 border-t border-slate-50">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-[90%]' : 'w-[80%]'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MailSkeleton;
