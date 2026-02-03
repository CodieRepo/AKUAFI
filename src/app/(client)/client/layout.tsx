'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useState } from 'react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container - Fixed on Desktop, Slide-over on Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 h-full transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar />
      </div>

      {/* Main Content Area - Offset by sidebar width on desktop */}
      <div className="flex flex-1 flex-col w-full min-h-screen lg:pl-64 transition-all duration-300">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
           <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
}
