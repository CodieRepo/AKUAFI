import { LucideIcon } from "lucide-react";

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 shadow-sm animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-3 w-full">
          <div className="h-3 w-24 bg-gray-200/70 dark:bg-slate-700/60 rounded"></div>
          <div className="h-9 w-20 bg-gray-300/70 dark:bg-slate-600/60 rounded"></div>
          <div className="h-3 w-32 bg-gray-100/70 dark:bg-slate-800/50 rounded"></div>
        </div>
        <div className="h-11 w-11 bg-gray-100/70 dark:bg-slate-700/50 rounded-xl"></div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30 dark:from-black dark:via-slate-950 dark:to-slate-900">
      <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto">
        {/* Top Section Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-gray-200/70 dark:bg-slate-700/60 rounded animate-pulse"></div>
            <div className="h-10 w-64 bg-gray-300/70 dark:bg-slate-600/60 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200/70 dark:bg-slate-700/60 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {[0, 100, 200, 300, 400].map((delay, i) => (
            <SkeletonCard key={i} delay={delay} />
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-7 mt-4">
          {/* Left Column Skeleton */}
          <div className="xl:col-span-2 space-y-7">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200/70 dark:bg-slate-700/60 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-100 dark:bg-slate-900 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-white/10 p-7 space-y-5">
              {[1, 2, 3].map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-4 border-b border-gray-200/50 dark:border-white/5 last:border-0"
                >
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-gray-200/70 dark:bg-slate-700/60 rounded"></div>
                    <div className="h-3 w-24 bg-gray-100/70 dark:bg-slate-800/50 rounded"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200/70 dark:bg-slate-700/60 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 w-32 bg-gray-200/70 dark:bg-slate-700/60 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-100/70 dark:bg-slate-800/50 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-white/10 p-7 space-y-5 h-64">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-11 w-11 bg-gray-200/70 dark:bg-slate-700/60 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-gray-200/70 dark:bg-slate-700/60 rounded"></div>
                    <div className="h-3 w-2/3 bg-gray-100/70 dark:bg-slate-800/50 rounded"></div>
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
