'use client';

import { Moon, Sun, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button'; // Keeping Button if needed, or removing if not used. simpler to just use button element for toggles
import { cn } from '@/lib/utils';

export default function AdminTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or system preference on mount
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (saved === 'dark' || (!saved && prefersDark)) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setIsDark(false);
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 lg:px-8 transition-colors">
      <div className="flex items-center gap-4">
          {/* Breadcrumbs or Title could go here */}
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white hidden sm:block">
              Overview
          </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Dark Mode"
        >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications (Dummy) */}
        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
        </button>

         {/* Profile is now in Sidebar (Desktop) or Sidebar (Mobile) for cleaner topbar, but user asked for Profile dropdown. 
             I'll add a minimal visual profile here as requested in constraints, or keep it simple since sidebar has it.
             User request 2) Top navbar with Admin profile dropdown
             Let's add it back.
         */}
        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md cursor-pointer">
                AD
            </div>
        </div>
      </div>
    </header>
  );
}
