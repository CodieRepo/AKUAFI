import StatCard from '@/components/dashboard/StatCard';
import ChartCard from '@/components/dashboard/ChartCard';
import { QrCode, Users, Trophy, Target, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-text-muted">Welcome back, Acme Corp. Here's what's happening today.</p>
         </div>
         <div className="flex gap-3">
             <button className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-surface transition-colors">
                Last 30 Days
             </button>
             <button className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-soft-sm transition-colors">
                Export Report
             </button>
         </div>
      </div>

      {/* Quick Actions & Alerts Row */}
      <div className="grid gap-6 md:grid-cols-3">
         {/* Quick Actions */}
         <div className="md:col-span-2 rounded-xl border border-border bg-white p-6 shadow-soft-sm">
             <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
             <div className="flex flex-wrap gap-4">
                 <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground hover:bg-gray-100 transition-colors">
                     <QrCode className="h-4 w-4" />
                     Download QR Assets
                 </button>
                 <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground hover:bg-gray-100 transition-colors">
                     <ArrowUpRight className="h-4 w-4" />
                     View Analytics
                 </button>
             </div>
         </div>

         {/* Insights / Alerts */}
         <div className="rounded-xl border border-border bg-accent-cyan/10 p-6 shadow-soft-sm">
             <div className="flex items-center gap-2 mb-3">
                 <div className="h-2 w-2 rounded-full bg-accent-cyan animate-pulse"></div>
                 <h3 className="text-sm font-bold uppercase tracking-wider text-accent-cyan">Insights</h3>
             </div>
             <div className="space-y-3">
                 <div className="flex items-start gap-3">
                     <Trophy className="h-4 w-4 text-accent-cyan mt-1 shrink-0" />
                     <div>
                         <p className="text-sm font-medium text-foreground">Top City: Mumbai</p>
                         <p className="text-xs text-text-muted">+15% scans this week</p>
                     </div>
                 </div>
                 <div className="flex items-start gap-3">
                     <Target className="h-4 w-4 text-orange-500 mt-1 shrink-0" />
                     <div>
                         <p className="text-sm font-medium text-foreground">Campaign Ending</p>
                         <p className="text-xs text-text-muted">'Summer Hydration' ends in 3 days</p>
                     </div>
                 </div>
             </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Bottles"
          value="124,500"
          icon={Trophy}
          trend="+12%"
          trendUp={true}
          description="vs last month"
        />
        <StatCard
          title="Active Campaigns"
          value="8"
          icon={Target}
          description="3 ending soon"
        />
        <StatCard
          title="Total Scans"
          value="45,231"
          icon={QrCode}
          trend="+28%"
          trendUp={true}
          description="vs last month"
        />
        <StatCard
          title="Leads Generated"
          value="3,842"
          icon={Users}
          trend="+5%"
          trendUp={true}
          description="vs last month"
        />
      </div>

      {/* Charts Area */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Main Chart (Bar Chart Placeholder) */}
        <ChartCard 
            title="Scan Performance" 
            subtitle="Daily scan volume over the last 30 days" 
            className="lg:col-span-4"
        >
            <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-8 px-2">
                {/* Dummy Bars */}
                {[30, 45, 25, 60, 75, 50, 80, 40, 55, 90, 65, 45, 70, 85, 60].map((h, i) => (
                    <div key={i} className="group relative w-full rounded-t-lg bg-primary/10 hover:bg-primary/80 transition-all duration-300" style={{ height: `${h}%` }}>
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {h * 120}
                         </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-between text-xs text-text-muted">
                <span>01 Jan</span>
                <span>08 Jan</span>
                <span>15 Jan</span>
                <span>22 Jan</span>
                <span>29 Jan</span>
            </div>
        </ChartCard>

        {/* Secondary Chart (Line/Area Chart Placeholder) */}
        <ChartCard 
            title="User Engagement" 
            subtitle="Average time spent on landing page"
            className="lg:col-span-3"
        >
             <div className="h-[300px] w-full flex items-center justify-center relative overflow-hidden rounded-xl bg-gradient-to-b from-surface to-white border border-border/50">
                {/* Simple SVG Line Chart */}
                <svg viewBox="0 0 300 150" className="w-full h-full text-accent-cyan overflow-visible">
                     <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                     </defs>
                     <path d="M0,150 L0,100 C20,90 40,110 60,80 C80,50 100,70 120,60 C140,50 160,30 180,40 C200,50 220,20 240,30 C260,40 280,10 300,50 L300,150 Z" fill="url(#gradient)" />
                     <path d="M0,100 C20,90 40,110 60,80 C80,50 100,70 120,60 C140,50 160,30 180,40 C200,50 220,20 240,30 C260,40 280,10 300,50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="absolute top-4 right-4 flex items-center text-sm font-bold text-accent-cyan">
                    <ArrowUpRight className="mr-1 h-4 w-4" />
                    2m 45s
                </div>
             </div>
        </ChartCard>
      </div>

    </div>
  );
}
