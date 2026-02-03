'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseclient';
import { 
  LayoutDashboard, 
  Ticket, 
  QrCode, 
  MonitorPlay, 
  LogOut, 
  Menu,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth Check (BYPASSED FOR PREVIEW)
  /*
  useEffect(() => {
    const checkUser = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);
  */
  
  // Set loading false immediately
  useEffect(() => setLoading(false), []);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/admin/campaigns', icon: Ticket },
    { name: 'QR Generator', href: '/admin/qr-generator', icon: QrCode },
    { name: 'Redemptions', href: '/admin/redemptions', icon: MonitorPlay },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 z-30 w-64 h-screen bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              AKUAFI Admin
            </span>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 flex items-center px-4 bg-white border-b border-gray-200 sticky top-0 z-10">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-3 font-semibold text-gray-900">Admin Panel</span>
        </div>

        {/* Admin Flow Indicator (Global Context) */}
        <div className="bg-white border-b border-gray-100 px-8 py-3 hidden lg:flex items-center gap-2 text-xs font-medium text-gray-500">
             <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${pathname?.includes('campaigns') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>1</div>
                <span className={pathname?.includes('campaigns') ? 'text-blue-900' : ''}>Create Campaign</span>
             </div>
             <div className="h-px w-8 bg-gray-200 mx-2"></div>
             <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${pathname?.includes('qr-generator') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>2</div>
                <span className={pathname?.includes('qr-generator') ? 'text-blue-900' : ''}>Generate QR</span>
             </div>
             <div className="h-px w-8 bg-gray-200 mx-2"></div>
             <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${pathname?.includes('redemptions') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>3</div>
                <span className={pathname?.includes('redemptions') ? 'text-blue-900' : ''}>Monitor Redemptions</span>
             </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
