'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { BarChart3, Zap, Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const BOTTOM_NAV = [
  { href: '/',          label: 'Dashboard', icon: BarChart3 },
  { href: '/today',     label: 'Today',     icon: Zap },
  { href: '/screener',  label: 'Screener',  icon: Search },
  { href: '/options',   label: 'Options',   icon: TrendingUp },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 md:hidden',
        'bg-[#060608]/95 backdrop-blur-xl',
        'border-t border-white/[0.07]',
        'bottom-nav-pad',
      )}
    >
      <div className="flex items-stretch h-16">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1',
                'min-h-[44px] touch-manipulation select-none',
                'transition-all duration-150 active:scale-95',
                active ? 'text-blue-400' : 'text-white/30 active:text-white/60',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-all duration-150',
                  active && 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
                )}
              />
              <span className={cn(
                'text-[10px] font-medium',
                active ? 'text-blue-400' : 'text-white/30',
              )}>
                {label}
              </span>
            </Link>
          );
        })}
        <div className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-6 h-6',
              },
            }}
          />
          <span className="text-[10px] font-medium text-white/30">Account</span>
        </div>
      </div>
    </nav>
  );
}
