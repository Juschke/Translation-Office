import Skeleton from './Skeleton';

const ReportsSkeleton = () => {
 return (
 <div className="flex flex-col gap-6 h-full fade-in">
 {/* Header */}
 <div className="flex justify-between items-center">
 <div className="space-y-2">
 <Skeleton className="h-8 w-48" />
 <Skeleton className="h-4 w-64" />
 </div>
 <div className="flex gap-2">
 <Skeleton className="h-9 w-32 rounded" />
 <Skeleton className="h-9 w-32 rounded" />
 </div>
 </div>

 {/* KPI Grid */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="bg-white p-5 rounded-sm shadow-sm border border-slate-200 space-y-4">
 <div className="flex justify-between items-start">
 <div className="space-y-2">
 <Skeleton className="h-3 w-20" />
 <Skeleton className="h-8 w-16" />
 </div>
 <Skeleton variant="circular" width={40} height={40} />
 </div>
 </div>
 ))}
 </div>

 {/* Charts Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 flex flex-col gap-6">
 {/* Revenue Chart */}
 <div className="bg-white p-6 rounded-sm shadow-sm border border-slate-200 space-y-6">
 <div className="flex justify-between items-center">
 <Skeleton className="h-4 w-32" />
 <Skeleton className="h-3 w-24" />
 </div>
 <Skeleton className="h-[300px] w-full rounded-sm" />
 </div>

 {/* Profit Chart */}
 <div className="bg-white p-6 rounded-sm shadow-sm border border-slate-200 space-y-6">
 <div className="flex justify-between items-center">
 <Skeleton className="h-4 w-40" />
 <Skeleton className="h-3 w-32" />
 </div>
 <Skeleton className="h-[200px] w-full rounded-sm" />
 </div>
 </div>

 {/* Language Distribution */}
 <div className="lg:col-span-1">
 <div className="bg-white p-6 rounded-sm shadow-sm border border-slate-200 h-full space-y-8">
 <Skeleton className="h-4 w-36" />
 <div className="flex flex-col items-center space-y-8">
 <Skeleton variant="circular" width={200} height={200} />
 <div className="w-full space-y-4">
 {Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="flex justify-between">
 <Skeleton className="h-4 w-24" />
 <Skeleton className="h-4 w-12" />
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default ReportsSkeleton;
