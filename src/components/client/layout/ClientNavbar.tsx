'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import SignOutButton from '@/components/dashboard/SignOutButton';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';

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
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
           <Link href="/client/dashboard" className="flex items-center gap-2 relative h-8 w-32">
                <Image 
                    src="/logo/akuafi-logo.png" 
                    alt="Akuafi" 
                    fill
                    className="object-contain object-left"
                    priority
                />
           </Link>

           {/* Navigation Links */}
           <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    item.active 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm" 
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
        <div className="flex items-center gap-3">
             <ThemeToggle />
             <SignOutButton clientName={clientName} />
        </div>
      </div>
    </div>
  );
}
