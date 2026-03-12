'use client';

import { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

interface SidebarContextValue {
  open: () => void;
  close: () => void;
}

const SidebarCtx = createContext<SidebarContextValue>({ open: () => {}, close: () => {} });

export function useSidebar() {
  return useContext(SidebarCtx);
}

const NO_SHELL_ROUTES = ['/gate', '/landing', '/design'];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (NO_SHELL_ROUTES.includes(pathname)) {
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

        {/* Sidebar — fixed drawer on mobile, static on md+ */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
            'md:static md:inset-y-auto md:transition-none',
            isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
        >
          <Sidebar onClose={() => setIsOpen(false)} />
        </div>

        {/* Main content — extra bottom padding on mobile so BottomNav doesn't cover content */}
        <main className={cn(
          'flex-1 flex flex-col min-h-screen overflow-auto min-w-0',
          'pb-safe-nav md:pb-0',
        )}>
          {children}
        </main>

      </div>

      {/* iOS-style bottom tab bar — only on mobile */}
      <BottomNav />
    </SidebarCtx.Provider>
  );
}
