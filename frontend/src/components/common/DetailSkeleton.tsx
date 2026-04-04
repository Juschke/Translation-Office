import Skeleton from './Skeleton';

const DetailSkeleton = () => {
    return (
        <div className="flex flex-col gap-6 fade-in pb-10">
            {/* Header Card */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 md:p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Back Button */}
                        <Skeleton variant="circular" width={36} height={36} className="shrink-0" />

                        {/* Avatar */}
                        <Skeleton variant="rectangular" width={64} height={64} className="rounded-sm shrink-0" />

                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Skeleton className="h-7 w-64" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap ml-0 md:ml-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                        <Skeleton className="h-9 w-24 rounded" />
                        <Skeleton className="h-9 w-28 rounded" />
                        <Skeleton className="h-9 w-24 rounded" />
                    </div>

                    {/* Meta Info Bar */}
                    <div className="flex items-center gap-6 border-t border-slate-100 pt-3 mt-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-slate-200">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <Skeleton className="h-5 w-40" />
                        </div>
                        <div className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-32 mb-4" />
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex justify-between gap-4">
                                            <Skeleton className="h-3 w-20" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-32 mb-4" />
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex justify-between gap-4">
                                            <Skeleton className="h-3 w-20" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Card */}
                    <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <Skeleton className="h-5 w-40" />
                        </div>
                        <div className="p-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                    <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6 space-y-4">
                        <Skeleton className="h-5 w-32 mb-4" />
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6 space-y-4">
                        <Skeleton className="h-5 w-32 mb-4" />
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-6 w-20 rounded" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailSkeleton;
