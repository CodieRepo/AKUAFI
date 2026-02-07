'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, Users, UserCircle, LogOut, Settings, Ticket, QrCode, ScanLine } from 'lucide-react';
import { cn } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
  { name: 'QR Generator', href: '/admin/qr-generator', icon: QrCode },
  { name: 'Redemptions', href: '/admin/redemptions', icon: ScanLine },
  // { name: 'Analytics', href: '/admin/analytics', icon: Users }, // Future
  // { name: 'Settings', href: '/admin/settings', icon: Settings }, // Future
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace('/admin/login');
  };

  return (
    <aside className="h-full w-64 border-r border-border bg-white/80 backdrop-blur-xl text-foreground">
      <div className="flex h-full flex-col">
        {/* Logo Area */}
        <div className="flex h-20 items-center border-b border-border px-6">
           <Image 
              src="/logo/akuafi-logo.png" 
              alt="Akuafi" 
              width={150}
              height={48}
              className="h-10 w-auto mr-2 object-contain" 
           />
           <span className="text-xs font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">ADMIN</span>
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
          <button 
            onClick={handleSignOut}
            className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="mr-3 h-5 w-5 group-hover:text-red-600" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
