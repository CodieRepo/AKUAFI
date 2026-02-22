"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  ScanLine,
  QrCode,
  LogOut,
  Menu,
  X,
  Users,
  Package,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
  { name: "Clients", href: "/admin/clients", icon: Users },
  { name: "QR Generator", href: "/admin/qr-generator", icon: QrCode },
  { name: "Redemptions", href: "/admin/redemptions", icon: ScanLine },
  { name: "Inventory", href: "/admin/inventory", icon: Package },
  {
    name: "Contact Queries",
    href: "/admin/contact-queries",
    icon: MessageSquare,
  },
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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/admin/login");
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-5 left-5 z-50 p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 h-full w-72 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/80 border-r border-gray-200/80 dark:border-white/10 backdrop-blur-xl transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          "lg:translate-x-0 lg:shadow-none", // Always visible on desktop
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo Area - Premium Header */}
          <div className="flex h-24 items-center justify-between lg:justify-start px-6 border-b border-gray-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Image
                src="/logo/akuafi-logo.png"
                alt="Akuafi"
                width={120}
                height={32}
                className="h-9 w-auto object-contain"
              />
              <span className="text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-1 rounded-md shadow-sm">
                ADMIN
              </span>
            </div>
            {/* Close button for mobile inside sidebar */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation - Premium Style */}
          <nav className="flex-1 space-y-1 px-4 py-8 overflow-y-auto">
            <p className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
              Navigation
            </p>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setIsOpen(false)}
                  className={cn(
                    "group relative flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white hover:shadow-sm",
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent animate-pulse" />
                  )}
                  <item.icon
                    className={cn(
                      "relative mr-3 h-5 w-5 flex-shrink-0 transition-all duration-200",
                      isActive
                        ? "text-white drop-shadow-sm"
                        : "text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="relative">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Sign Out - Premium Style */}
          <div className="border-t border-gray-200/60 dark:border-white/10 p-4 bg-gradient-to-br from-gray-50/50 to-transparent dark:from-white/5 dark:to-transparent">
            <div className="mb-4 flex items-center gap-3 px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  Administrator
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Super Admin
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <LogOut className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
