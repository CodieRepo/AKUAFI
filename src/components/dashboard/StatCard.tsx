import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/components/ui/Button';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  description?: string;
}

export default function StatCard({ title, value, trend, trendUp, icon: Icon, description }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-soft-sm transition-all hover:shadow-soft-md hover:-translate-y-1">
      <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-110"></div>
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-foreground">{value}</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {(trend || description) && (
        <div className="mt-4 flex items-center text-sm">
          {trend && (
            <span
              className={cn(
                "flex items-center font-medium",
                trendUp ? "text-success" : "text-red-500"
              )}
            >
              {trendUp ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
              {trend}
            </span>
          )}
          {description && (
            <span className="ml-2 text-text-muted">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
