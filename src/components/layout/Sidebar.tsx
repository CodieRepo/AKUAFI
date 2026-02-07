'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, Users, UserCircle, LogOut, Settings, Ticket } from 'lucide-react';
import { cn } from '@/components/ui/Button';

const navItems = [
  { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/client/campaigns', icon: Megaphone },
  { name: 'Coupons', href: '/client/coupons', icon: Ticket },
  { name: 'Analytics', href: '/client/analytics', icon: Users },
  { name: 'Profile', href: '/client/profile', icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-full w-64 border-r border-border bg-white/80 backdrop-blur-xl text-foreground">
      <div className="flex h-full flex-col">
        {/* Logo Area */}
        <div className="flex h-20 items-center border-b border-border px-6">
           <Image 
              src="/logo/akuafi-logo.png" 
              alt="Akuafi" 
              width={120}
              height={40}
              className="h-8 w-auto object-contain" 
           />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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
