'use client';

import { useEffect, useState } from 'react';

interface MiniScanChartProps {
  data: number[]; // Array of 7 numbers (last 7 days)
}

export default function MiniScanChart({ data }: MiniScanChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const maxValue = Math.max(...data, 1); // Avoid div by zero

  if (data.every(v => v === 0)) {
      return (
          <div className="h-20 flex items-center justify-center text-xs text-slate-500 italic">
              No scan activity this week
          </div>
      )
  }

  return (
    <div className="flex items-end gap-2 h-20 w-full">
      {data.map((value, index) => {
        const heightPercentage = (value / maxValue) * 100;
        
        return (
          <div key={index} className="relative flex-1 group flex flex-col justify-end h-full">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
              {value} scans
            </div>
            
            {/* Bar */}
            <div 
              className="bg-blue-500/70 hover:bg-blue-400 transition-all duration-500 rounded-t-sm w-full min-w-[4px]"
              style={{ 
                  height: mounted ? `${heightPercentage}%` : '0%',
                  minHeight: value > 0 ? '4px' : '0' 
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
