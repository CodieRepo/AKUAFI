'use client';

import { Sparkles, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface AISummaryCardProps {
  conversionRate: number;
  revenueTrend: 'up' | 'down' | 'stable';
  scansTrend: 'up' | 'down' | 'stable';
  redemptionRate: number;
}

export default function AISummaryCard({ 
  conversionRate, 
  revenueTrend, 
  scansTrend, 
  redemptionRate 
}: AISummaryCardProps) {

  // Logic to generate smart message
  let message = "Campaign performance is steady.";
  let Icon = CheckCircle;
  let color = "text-blue-400";

  if (conversionRate < 4 && conversionRate > 0) {
      message = "Conversion rate has room for growth. Consider increasing offer value to boost scans.";
      Icon = AlertTriangle;
      color = "text-amber-400";
  } else if (revenueTrend === 'up') {
      message = "Revenue is trending upward today. Keep the momentum going!";
      Icon = TrendingUp;
      color = "text-emerald-400";
  } else if (scansTrend === 'up' && redemptionRate < 5) {
      message = "High engagement detected. Optimize coupon terms to convert more scans to redemptions.";
      Icon = AlertTriangle;
      color = "text-orange-400";
  } else if (conversionRate > 15) {
      message = "Excellent conversion rate! Your campaigns are resonating well with your audience.";
      Icon = Sparkles;
      color = "text-purple-400";
  } else {
      message = "Campaign performance is stable. Continue monitoring for new opportunities."
      Icon = CheckCircle;
      color = "text-blue-400";
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/30 p-5 shadow-sm relative overflow-hidden">
      {/* Background decoration - subtle */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-indigo-100 uppercase tracking-wider">Smart Insight</h3>
          </div>
          
          <div className="flex gap-4 items-start">
             <div className={`p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 ${color.replace('text-', 'text-')}`}>
                 <Icon className="h-5 w-5" />
             </div>
             <div>
                 <p className="text-gray-700 dark:text-gray-300 font-medium text-sm leading-relaxed">
                     {message}
                 </p>
             </div>
          </div>
      </div>
    </div>
  );
}
