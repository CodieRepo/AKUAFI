'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, ScanLine, QrCode, LogOut, Menu, X, Users, Package, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { name: 'Dashboard',        href: '/admin/dashboard',       icon: LayoutDashboard },
  { name: 'Campaigns',        href: '/admin/campaigns',        icon: Megaphone },
  { name: 'Clients',          href: '/admin/clients',          icon: Users },
  { name: 'QR Generator',     href: '/admin/qr-generator',     icon: QrCode },
  { name: 'Redemptions',      href: '/admin/redemptions',      icon: ScanLine },
  { name: 'Inventory',        href: '/admin/inventory',        icon: Package },
  { name: 'Contact Queries',  href: '/admin/contact-queries',  icon: MessageSquare },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle resize to switch modes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsOpen(true); // Always open on desktop
      } else {
        setIsOpen(false); // Default closed on mobile
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace('/admin/login');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden",
          isOpen ? "block" : "hidden",
        )}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border border-gray-200 text-gray-700"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out transform",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0" // Always visible on desktop
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo Area */}
          <div className="flex h-20 items-center justify-between lg:justify-start px-6 border-b border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-2">
                <Image 
                    src="/logo/akuafi-logo.png" 
                    alt="Akuafi" 
                    width={120} 
                    height={32}
                    className="h-8 w-auto object-contain" 
                />
                <span className="text-[10px] font-bold tracking-wider uppercase bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-sm">Admin</span>
             </div>
             {/* Close button for mobile inside sidebar */}
             <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
               <X size={20} />
             </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Platform</p>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setIsOpen(false)}
                  className={cn(
                    "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/30"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Sign Out */}
          <div className="border-t border-gray-100 dark:border-gray-800 p-4">
            <div className="mb-4 flex items-center gap-3 px-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    AD
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Administrator</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@akuafi.com</p>
                </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="group flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
