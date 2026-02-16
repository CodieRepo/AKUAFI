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
  IndianRupee,
  Users
} from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export type StatIconType = 'impressions' | 'scans' | 'conversion' | 'redemption' | 'revenue' | 'users';

const iconMap: Record<StatIconType, LucideIcon> = {
  impressions: Eye,
  scans: QrCode,
  conversion: Percent,
  redemption: CheckCircle,
  revenue: IndianRupee,
  users: Users
};

const colorMap: Record<StatIconType, string> = {
  impressions: 'text-slate-400',
  scans: 'text-blue-400',
  conversion: 'text-purple-400',
  redemption: 'text-cyan-400',
  revenue: 'text-emerald-400',
  users: 'text-indigo-400'
};

const bgMap: Record<StatIconType, string> = {
  impressions: 'bg-slate-500',
  scans: 'bg-blue-500',
  conversion: 'bg-purple-500',
  redemption: 'bg-cyan-500',
  revenue: 'bg-emerald-500',
  users: 'bg-indigo-500'
};

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  iconType: StatIconType;
  description?: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral'; // Explicit trend type
  type?: 'default' | 'revenue';
  delay?: number; // animation delay
  sparklineData?: number[]; // For revenue sparkline
}

export default function PremiumStatCard({
  title,
  value,
  iconType,
  description,
  trend,
  trendType,
  type = 'default',
  delay = 0,
  sparklineData
}: PremiumStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Animated Counter Effect - Runs only once
  useEffect(() => {
    // Parse numeric value for animation
    const numericValue = typeof value === 'number' 
      ? value 
      : parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));

    if (isNaN(numericValue)) return;

    let start = 0;
    const end = numericValue;
    const duration = 800; // 800ms as requested
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
    
    // Small delay to ensure smooth start after mount
    const timer = setTimeout(() => {
        requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]); // Added simple dependency check

  const Icon = iconMap[iconType] || Eye;
  const accentColor = colorMap[iconType];
  const accentBg = bgMap[iconType];
  const isRevenue = type === 'revenue';

  const formattedDisplay = typeof value === 'string' && isNaN(parseFloat(value)) 
      ? value 
      : typeof value === 'string' && value.includes('₹')
        ? `₹${displayValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
        : value.toString().includes('%') 
            ? `${displayValue.toFixed(1)}%`
            : Math.floor(displayValue).toLocaleString();
            
  // Sparkline SVG Logic
  const renderSparkline = () => {
      if (!sparklineData || sparklineData.length < 2) return null;
      
      const height = 40;
      const width = 120;
      const max = Math.max(...sparklineData, 1);
      const min = Math.min(...sparklineData);
      const range = max - min || 1;
      
      const points = sparklineData.map((d, i) => {
          const x = (i / (sparklineData.length - 1)) * width;
          const y = height - ((d - min) / range) * height;
          return `${x},${y}`;
      }).join(' ');

      return (
          <div className="absolute bottom-4 right-4 opacity-50 pointer-events-none">
              <svg width={width} height={height} className="overflow-visible">
                  <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.5"/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path 
                    d={`M0,${height} ${points} L${width},${height} Z`} 
                    fill="url(#gradient)" 
                    stroke="none"
                  />
                  <polyline 
                    points={points} 
                    fill="none" 
                    stroke="#34d399" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                  />
              </svg>
          </div>
      );
  };

  // Determine trend color
  const trendColor = trendType === 'up' ? "text-emerald-400" 
      : trendType === 'down' ? "text-red-400"
      : "text-yellow-400"; // Neutral

  const TrendIcon = trendType === 'up' ? TrendingUp 
      : trendType === 'down' ? TrendingDown 
      : Minus;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group",
        "bg-slate-900/70 backdrop-blur-md border border-white/5 shadow-xl",
        "opacity-0 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Top Accent Line */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 rounded-t-2xl", accentBg)} />
      
      {/* Background Glow */}
      <div className={cn(
        "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-3xl opacity-10 transition-transform duration-500 group-hover:scale-125",
        accentBg
      )} />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Icon className={cn("h-5 w-5", accentColor)} />
          </div>
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
        </div>

        <div>
           <h3 className="text-3xl font-bold text-white tracking-tight mb-1">
             {formattedDisplay}
           </h3>
           
           {(description || trend) && (
             <div className="flex items-center gap-2 text-xs relative z-20">
                {trend && (
                   <span className={cn(
                     "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50",
                     trendColor
                   )}>
                      <TrendIcon className="h-3 w-3" />
                      <span className="font-medium">{trend}</span>
                   </span>
                )}
                {description && (
                    <span className="text-slate-500 font-medium">
                        {description}
                    </span>
                )}
             </div>
           )}
        </div>
      </div>
      
      {/* Sparkline for Revenue */}
      {isRevenue && sparklineData && renderSparkline()}
    </div>
  );
}


