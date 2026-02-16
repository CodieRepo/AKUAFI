'use client';

import { useEffect, useState } from 'react';
import { 
  LucideIcon, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye, 
  QrCode, 
  Percent, 
  CheckCircle, 
  IndianRupee 
} from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export type StatIconType = 'impressions' | 'scans' | 'conversion' | 'redemption' | 'revenue';

const iconMap: Record<StatIconType, LucideIcon> = {
  impressions: Eye,
  scans: QrCode,
  conversion: Percent,
  redemption: CheckCircle,
  revenue: IndianRupee
};

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  iconType: StatIconType;
  description?: string;
  trend?: string;
  trendValue?: number; // >0 positive, <0 negative, 0 neutral
  type?: 'default' | 'revenue';
  delay?: number; // animation delay
}

export default function PremiumStatCard({
  title,
  value,
  iconType,
  description,
  trend,
  trendValue,
  type = 'default',
  delay = 0,
}: PremiumStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Animated Counter Effect
  useEffect(() => {
    setMounted(true);
    
    // Parse numeric value for animation
    const numericValue = typeof value === 'number' 
      ? value 
      : parseFloat(value.toString().replace(/[^0-9.-]+/g, '')); // Strip currency symbols etc for counting

    if (isNaN(numericValue)) {
        // If not a number, just show it immediately or don't animate
        return;
    }

    let start = 0;
    const end = numericValue;
    const duration = 1500; // 1.5s
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out

      const current = start + (end - start) * easeOut;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    // Start animation after small delay
    const timer = setTimeout(() => {
        requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const isRevenue = type === 'revenue';
  const Icon = iconMap[iconType] || Eye;

  const formattedDisplay = typeof value === 'string' && isNaN(parseFloat(value)) 
      ? value // Non-numeric string, just return it
      : typeof value === 'string' && value.includes('₹') // Crude currency check
        ? `₹${displayValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
        : value.toString().includes('%') 
            ? `${displayValue.toFixed(1)}%` // Percent check
            : Math.floor(displayValue).toLocaleString(); // Default Integer

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group opacity-0 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards",
        isRevenue 
          ? "bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-900 text-white shadow-lg border border-white/10"
          : "bg-white dark:bg-slate-900/80 backdrop-blur-md border border-gray-100 dark:border-white/10 shadow-sm hover:border-blue-500/20 dark:hover:border-blue-400/20"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Background Decor */}
      <div className={cn(
        "absolute -right-6 -top-6 h-32 w-32 rounded-full transition-transform duration-500 group-hover:scale-110",
        isRevenue ? "bg-white/10" : "bg-blue-500/5 dark:bg-blue-400/5"
      )} />

      <div className="relative z-10 flex justify-between items-start">
        <div>
           {/* Title */}
           <p className={cn(
             "text-sm font-medium mb-1",
             isRevenue ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
           )}>
             {title}
           </p>

           {/* Value */}
           <h3 className={cn(
             "font-bold tracking-tight",
             isRevenue ? "text-3xl text-white" : "text-2xl text-gray-900 dark:text-white"
           )}>
             {formattedDisplay}
           </h3>
           
           {/* Description / Subtext */}
           {(description || trend) && (
             <div className="mt-2 flex items-center gap-2 text-xs">
                {trendValue !== undefined && (
                   <span className={cn(
                     "flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-full",
                     trendValue > 0 
                        ? (isRevenue ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400")
                        : trendValue < 0 
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                   )}>
                      {trendValue > 0 ? <TrendingUp className="h-3 w-3" /> : trendValue < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {trend}
                   </span>
                )}
                <span className={isRevenue ? "text-blue-200" : "text-gray-400 dark:text-gray-500"}>
                     {description}
                </span>
             </div>
           )}
        </div>

        {/* Icon */}
        <div className={cn(
          "p-3 rounded-xl transition-colors",
          isRevenue 
            ? "bg-white/20 text-white" 
            : "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-slate-700"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
