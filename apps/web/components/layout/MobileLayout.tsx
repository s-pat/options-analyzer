'use client';

import { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface SidebarContextValue {
  open: () => void;
  close: () => void;
}

const SidebarCtx = createContext<SidebarContextValue>({ open: () => {}, close: () => {} });

export function useSidebar() {
  return useContext(SidebarCtx);
}

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/gate') {
    return <>{children}</>;
  }

  return (
    <SidebarCtx.Provider value={{ open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      <div className="flex min-h-screen bg-background">

        {/* Backdrop — mobile only, closes sidebar on tap */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Sidebar wrapper — fixed drawer on mobile, static in flow on md+ */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
            'md:static md:inset-y-auto md:transition-none',
            isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
        >
          <Sidebar onClose={() => setIsOpen(false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-screen overflow-auto min-w-0">
          {children}
        </main>

      </div>
    </SidebarCtx.Provider>
  );
}
