import { LucideIcon } from 'lucide-react';

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-slate-900/80 border border-gray-100 dark:border-white/5 shadow-sm animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-3 w-full">
            <div className="h-4 w-24 bg-gray-200 dark:bg-slate-800 rounded"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-32 bg-gray-100 dark:bg-slate-800/50 rounded"></div>
        </div>
        <div className="h-10 w-10 bg-gray-100 dark:bg-slate-800 rounded-xl"></div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black/95">
        <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto">
        
        {/* Top Section Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-10 w-64 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-48 bg-gray-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {[0, 100, 200, 300, 400].map((delay, i) => (
                <SkeletonCard key={i} delay={delay} />
            ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-4">
            
            {/* Left Column Skeleton */}
            <div className="xl:col-span-2 space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-100 dark:bg-slate-900 rounded animate-pulse"></div>
                    </div>
                 </div>
                 
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 space-y-4">
                     {[1, 2, 3].map((_, i) => (
                         <div key={i} className="flex justify-between items-center py-4 border-b border-gray-50 dark:border-slate-800 last:border-0">
                             <div className="space-y-2">
                                 <div className="h-5 w-48 bg-gray-200 dark:bg-slate-800 rounded"></div>
                                 <div className="h-3 w-24 bg-gray-100 dark:bg-slate-900 rounded"></div>
                             </div>
                             <div className="h-6 w-20 bg-gray-200 dark:bg-slate-800 rounded-full"></div>
                         </div>
                     ))}
                 </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-100 dark:bg-slate-900 rounded animate-pulse"></div>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 space-y-4 h-64">
                    {[1, 2, 3].map((_, i) => (
                         <div key={i} className="flex items-center gap-4">
                             <div className="h-10 w-10 bg-gray-200 dark:bg-slate-800 rounded-full"></div>
                             <div className="flex-1 space-y-2">
                                 <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded"></div>
                                 <div className="h-3 w-2/3 bg-gray-100 dark:bg-slate-900 rounded"></div>
                             </div>
                         </div>
                    ))}
                </div>
            </div>

        </div>
        </div>
    </div>
  );
}
