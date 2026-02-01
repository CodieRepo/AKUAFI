'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '../ui/Button';

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-border bg-white/80 px-6 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-4">
         <button onClick={onMenuClick} className="lg:hidden p-2 text-text-muted hover:bg-surface rounded-md">
            <Menu className="h-6 w-6" />
         </button>
         {/* Breadcrumb Placeholder */}
         <h1 className="text-lg font-semibold text-foreground hidden sm:block">Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search - Hidden on mobile for now */}
        <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input 
                type="text" 
                placeholder="Search campaigns..." 
                className="h-10 w-64 rounded-full border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
        </div>

        <Button variant="ghost" size="icon" className="relative text-text-muted hover:text-primary">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </Button>

        <div className="h-8 w-px bg-border mx-2"></div>

        <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-surface transition-colors pr-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-white font-medium text-sm shadow-md">
                AK
            </div>
            <div className="hidden md:block text-sm">
                <p className="font-medium text-foreground">Acme Corp</p>
                <p className="text-xs text-text-muted">Pro Plan</p>
            </div>
        </div>
      </div>
    </header>
  );
}
