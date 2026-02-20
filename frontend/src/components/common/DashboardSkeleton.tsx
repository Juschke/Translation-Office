import Skeleton from './Skeleton';

const DashboardSkeleton = () => {
 return (
 <div className="flex flex-col h-full gap-6 fade-in">
 {/* Header */}
 <div className="flex justify-between items-center">
 <Skeleton className="h-8 w-48" />
 <Skeleton className="h-10 w-32 rounded" />
 </div>

 {/* KPI Cards Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="bg-white p-5 rounded-sm shadow-sm border border-slate-200 space-y-4">
 <div className="flex justify-between items-start">
 <div className="space-y-2">
 <Skeleton className="h-3 w-20" />
 <Skeleton className="h-8 w-16" />
 </div>
 <Skeleton variant="circular" width={40} height={40} />
 </div>
 <Skeleton className="h-4 w-24" />
 </div>
 ))}
 </div>

 {/* Recent Projects / Content Area */}
 <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden flex-1">
 <div className="p-5 border-b border-slate-200">
 <Skeleton className="h-6 w-40" />
 </div>
 <div className="p-5 space-y-4">
 {Array.from({ length: 5 }).map((_, i) => (
 <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
 <div className="flex items-center gap-4 w-1/3">
 <Skeleton className="h-10 w-10 rounded" />
 <div className="space-y-2 w-full">
 <Skeleton className="h-4 w-3/4" />
 <Skeleton className="h-3 w-1/2" />
 </div>
 </div>
 <Skeleton className="h-4 w-24 hidden md:block" />
 <Skeleton className="h-6 w-20 rounded-full" />
 <Skeleton className="h-4 w-16 text-right" />
 </div>
 ))}
 </div>
 </div>
 </div>
 );
};

export default DashboardSkeleton;
