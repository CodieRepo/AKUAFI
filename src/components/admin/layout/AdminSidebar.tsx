'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, QrCode, ClipboardList, LogOut } from 'lucide-react';
import { cn } from '@/components/ui/Button';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
  { name: 'QR Generator', href: '/admin/qr-generator', icon: QrCode },
  { name: 'Redemptions', href: '/admin/redemptions', icon: ClipboardList },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-full w-64 border-r border-border bg-white/80 backdrop-blur-xl text-foreground">
      <div className="flex h-full flex-col">
        {/* Logo Area */}
        <div className="flex h-20 items-center justify-center border-b border-border px-6">
           <span className="text-xl font-bold tracking-tight text-primary">AKUAFI ADMIN</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-text-muted hover:bg-surface hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-text-muted group-hover:text-foreground"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border p-4">
          <button className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-red-50 hover:text-red-600">
            <LogOut className="mr-3 h-5 w-5 group-hover:text-red-600" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
