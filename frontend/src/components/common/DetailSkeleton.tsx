import Skeleton from './Skeleton';

const DetailSkeleton = () => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden animate-pulse bg-slate-50/20">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-16 py-8">
                {/* Header Skeleton */}
                <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 md:p-6 mb-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <Skeleton variant="circular" width={40} height={40} className="shrink-0" />
                            <Skeleton variant="rectangular" width={64} height={64} className="rounded-sm shrink-0 hidden md:block" />
                            <Skeleton variant="rectangular" width={48} height={48} className="rounded-sm shrink-0 md:hidden" />
                            <div className="flex-1 space-y-2 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Skeleton variant="text" width="40%" height={32} />
                                    <Skeleton variant="rounded" width={80} height={24} />
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <Skeleton variant="text" width={100} height={16} />
                                    <Skeleton variant="text" width={150} height={16} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap ml-0 md:ml-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                            <Skeleton variant="rounded" width={80} height={36} />
                            <Skeleton variant="rounded" width={100} height={36} />
                            <Skeleton variant="rounded" width={80} height={36} />
                        </div>

                        {/* Meta Info Bar Skeleton */}
                        <div className="flex items-center gap-6 border-t border-slate-100 pt-3 mt-1">
                            <Skeleton variant="text" width={120} height={14} />
                            <Skeleton variant="text" width={150} height={14} />
                            <Skeleton variant="text" width={180} height={14} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Main Column Skeleton */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <Skeleton variant="text" width={150} height={20} />
                            </div>
                            <div className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <Skeleton variant="text" width="60%" height={16} className="mb-4" />
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex gap-4">
                                                <Skeleton variant="text" width={80} height={14} />
                                                <Skeleton variant="text" width="100%" height={14} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <Skeleton variant="text" width="60%" height={16} className="mb-4" />
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="flex gap-4">
                                                <Skeleton variant="text" width={80} height={14} />
                                                <Skeleton variant="text" width="100%" height={14} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <Skeleton variant="text" width={120} height={20} />
                            </div>
                            <div className="p-0">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                                        <Skeleton variant="text" width="30%" height={16} />
                                        <Skeleton variant="text" width="10%" height={16} />
                                        <Skeleton variant="text" width="15%" height={16} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6 space-y-6">
                            <div className="flex justify-between items-center">
                                <Skeleton variant="text" width={100} height={16} />
                                <Skeleton variant="circular" width={20} height={20} />
                            </div>
                            <div className="space-y-2">
                                <Skeleton variant="text" width="40%" height={14} />
                                <Skeleton variant="text" width="80%" height={32} />
                            </div>
                            <div className="pt-4 border-t border-slate-50 flex gap-4">
                                <div className="flex-1 space-y-1">
                                    <Skeleton variant="text" width="60%" height={12} />
                                    <Skeleton variant="text" width="80%" height={16} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Skeleton variant="text" width="60%" height={12} />
                                    <Skeleton variant="text" width="80%" height={16} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6 space-y-4">
                            <Skeleton variant="text" width="50%" height={16} />
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} variant="text" width="100%" height={14} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailSkeleton;
