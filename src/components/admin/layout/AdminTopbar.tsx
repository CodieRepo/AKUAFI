"use client";

import { Moon, Sun, Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminTopbar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or system preference on mount
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const shouldUseDark = saved === "dark" || (!saved && prefersDark);
    if (shouldUseDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const timer = setTimeout(() => {
      setIsDark(shouldUseDark);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-200/60 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-6 lg:px-8 transition-all duration-200">
      <div className="flex items-center gap-6 flex-1">
        {/* Search Bar - Premium */}
        <div className="hidden md:flex items-center gap-3 max-w-md w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onMenuClick ? (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label="Open sidebar menu"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
          </button>
        ) : null}

        {/* Dark Mode Toggle - Premium */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 hover:-translate-y-0.5"
          title="Toggle Dark Mode"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications - Premium */}
        <button className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 relative hover:-translate-y-0.5">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse"></span>
        </button>

        {/* Profile - Premium */}
        <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-gray-200/60 dark:border-white/10">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Admin User
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Super Admin
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
