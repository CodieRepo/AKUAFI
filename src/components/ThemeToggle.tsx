'use client'

import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 
                 bg-white dark:bg-slate-900 
                 hover:bg-gray-100 dark:hover:bg-slate-800 
                 transition"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-yellow-500" />
      ) : (
        <Moon className="w-4 h-4 text-gray-700" />
      )}
    </button>
  )
}
