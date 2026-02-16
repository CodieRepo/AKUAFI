'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils'; // Ensure this exists or use local
import SignOutButton from '@/components/dashboard/SignOutButton';

interface ClientNavbarProps {
  clientName: string;
}

export default function ClientNavbar({ clientName }: ClientNavbarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/client/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/client/dashboard'
    },
    {
      label: 'Settings',
      href: '/client/settings',
      icon: Settings,
      active: pathname === '/client/settings'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2">
                <div className="bg-blue-600 rounded-lg p-1.5">
                   <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">Akuafi</span>
           </div>

           {/* Navigation Links */}
           <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    item.active 
                      ? "bg-gray-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", item.active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")} />
                  {item.label}
                </Link>
              ))}
           </nav>
        </div>

        {/* Right Action */}
        <SignOutButton clientName={clientName} />
      </div>
    </div>
  );
}
