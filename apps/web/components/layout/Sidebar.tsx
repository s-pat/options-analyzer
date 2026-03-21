'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { BarChart3, TrendingUp, Search, FlaskConical, Activity, Zap, BookOpen, Target, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',           label: 'Dashboard',    icon: BarChart3 },
  { href: '/today',      label: "Today's Picks", icon: Zap },
  { href: '/portfolio',  label: 'Portfolio',    icon: Briefcase },
  { href: '/screener',   label: 'Screener',     icon: Search },
  { href: '/options',    label: 'Options',      icon: TrendingUp },
  { href: '/backtest',   label: 'Backtest',     icon: FlaskConical },
  { href: '/learn',      label: 'Learn Options', icon: BookOpen },
  { href: '/strategies', label: 'Strategies',   icon: Target },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="relative w-64 shrink-0 flex flex-col h-full md:h-screen md:sticky md:top-0 overflow-hidden border-r border-white/[0.07] bg-[#060608]">

      {/* Subtle CSS grid overlay — same as landing page */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.018) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient blue glow — top area */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.07]">
        <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
          <Activity className="h-4 w-4 text-blue-400" />
        </div>
        <span className="font-semibold text-base tracking-tight text-white">OptionLabs</span>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-blue-500/[0.12] text-blue-400 border border-blue-500/[0.2]'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/[0.05]',
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', active ? 'text-blue-400' : 'text-white/40')}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — pb accounts for iPhone home indicator when sidebar overlays bottom nav */}
      <div className="relative px-5 pt-4 pb-safe border-t border-white/[0.07] space-y-3" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
        <div>
          <p className="text-[11px] text-white/25 font-medium">Data: Yahoo Finance</p>
          <p className="text-[11px] text-white/20">30s auto-refresh</p>
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-7 h-7',
            },
          }}
        />
      </div>
    </aside>
  );
}
