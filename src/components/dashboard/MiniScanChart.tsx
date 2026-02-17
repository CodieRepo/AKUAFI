'use client';

import { useEffect, useState } from 'react';

interface MiniScanChartProps {
  data: number[]; // Array of 7 numbers (last 7 days)
  labels: string[]; // Array of 7 strings (e.g. "Mon", "Tue")
}

export default function MiniScanChart({ data, labels }: MiniScanChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const maxValue = Math.max(...data, 1); 

  return (
    <div className="relative h-24 w-full">
         {/* Background Grid */}
         <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
            <div className="w-full h-px bg-gray-200 dark:bg-slate-800/50 border-t border-dashed border-gray-300 dark:border-slate-800" />
            <div className="w-full h-px bg-gray-200 dark:bg-slate-800/50 border-t border-dashed border-gray-300 dark:border-slate-800" />
            <div className="w-full h-px bg-gray-200 dark:bg-slate-800/50 border-t border-dashed border-gray-300 dark:border-slate-800" />
         </div>

         <div className="flex items-end gap-2 h-full pb-6">
          {data.map((value, index) => {
            const heightPercentage = (value / maxValue) * 100;
            
            return (
              <div key={index} className="relative flex-1 group flex flex-col justify-end h-full">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg border border-gray-700 dark:border-slate-700">
                  {value} scans
                </div>
                
                {/* Bar */}
                <div className="relative w-full h-full flex items-end">
                    <div 
                    className={`rounded-t-sm w-full min-w-[4px] mx-auto transition-all duration-500 ${value === 0 ? 'bg-gray-200 dark:bg-slate-800/50' : 'bg-blue-600/80 dark:bg-blue-500/70 hover:bg-blue-500 dark:hover:bg-blue-400'}`}
                    style={{ 
                        height: mounted ? `${value === 0 ? 4 : heightPercentage}%` : '4%', // Always show at least a tiny bar
                    }}
                    />
                </div>
                
                {/* Label */}
                <div className="absolute top-full mt-2 left-0 right-0 text-center">
                    <span className="text-[10px] text-gray-500 dark:text-slate-500 font-medium uppercase">{labels[index]}</span>
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}
