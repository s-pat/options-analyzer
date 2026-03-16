'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

const NO_SHELL_ROUTES = ['/gate', '/landing', '/design', '/sign-in', '/sign-up', '/waitlist', '/auth-loading'];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  // Suppress the slide-in transition on first render so the sidebar starts
  // off-screen instantly rather than animating in from the left on page load.
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const ctxValue = useMemo(
    () => ({ open: () => setIsOpen(true), close: () => setIsOpen(false) }),
    [],
  );

  useEffect(() => { setMounted(true); }, []);

  // Close the sidebar whenever the route changes (navigation or initial load).
  useEffect(() => { setIsOpen(false); }, [pathname]);

  if (NO_SHELL_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return <>{children}</>;
  }

  return (
    <SidebarCtx.Provider value={{ open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      <div className="flex min-h-screen bg-background">

        {/* Backdrop — sits above bottom nav (z-[55]) so it dims the whole screen */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[55] bg-black/60 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Sidebar — z-[60] so it layers above both backdrop and bottom nav */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-[60]',
            // Only enable transition after first mount so the sidebar doesn't
            // animate in on the initial render (avoids the "open on load" flash).
            mounted && 'transition-transform duration-300 ease-in-out',
            'md:static md:inset-y-auto md:z-auto md:transition-none',
            isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
        >
          <Sidebar onClose={() => setIsOpen(false)} />
        </div>

        {/* Main content */}
        <main className={cn(
          'flex-1 flex flex-col min-h-screen overflow-auto min-w-0',
          'pb-safe-nav md:pb-0',
        )}>
          {children}
        </main>

      </div>

      {/* iOS-style bottom tab bar — only on mobile (z-50, below open sidebar) */}
      <BottomNav />
    </SidebarCtx.Provider>
  );
}
