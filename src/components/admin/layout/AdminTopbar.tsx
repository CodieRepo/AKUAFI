'use client';

import { Menu, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-border bg-white/80 px-6 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-4">
         <button onClick={onMenuClick} className="lg:hidden p-2 text-text-muted hover:bg-surface rounded-md">
            <Menu className="h-6 w-6" />
         </button>
         <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground hidden sm:block">Administration</span>
         </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-surface transition-colors pr-3">
            <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-medium text-sm shadow-md">
                AD
            </div>
            <div className="hidden md:block text-sm">
                <p className="font-medium text-foreground">Admin User</p>
                <p className="text-xs text-text-muted">Super Admin</p>
            </div>
        </div>
      </div>
    </header>
  );
}
