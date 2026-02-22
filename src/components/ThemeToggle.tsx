"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative p-2.5 rounded-xl border border-gray-200/80 dark:border-slate-700/80 
                 bg-white dark:bg-slate-800 
                 hover:bg-gray-50 dark:hover:bg-slate-700 
                 hover:border-gray-300 dark:hover:border-slate-600
                 shadow-sm hover:shadow-md
                 transition-all duration-300 
                 active:scale-95"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-500 transition-transform duration-500 rotate-0 hover:rotate-180" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300 transition-transform duration-500" />
      )}
    </button>
  );
}
