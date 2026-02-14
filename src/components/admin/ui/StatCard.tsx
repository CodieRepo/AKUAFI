'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Assuming this exists, otherwise I'll need to check or create it.

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  loading?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon, trend, loading = false, className }: StatCardProps) {
  return (
    <div className={cn("bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2"></div>
          ) : (
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {(value ?? 0).toLocaleString()}
            </h3>
          )}
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
          {icon}
        </div>
      </div>
      
      {trend && !loading && (
        <div className="mt-4 flex items-center text-sm">
          <span 
            className={cn(
              "font-medium",
              trend.direction === 'up' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {trend.direction === 'up' ? '+' : '-'}{trend.value}
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-2">from last month</span>
        </div>
      )}
    </div>
  );
}
