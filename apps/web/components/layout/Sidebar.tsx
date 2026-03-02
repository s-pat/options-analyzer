'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, TrendingUp, Search, FlaskConical, Activity, Zap, BookOpen, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/today', label: "Today's Picks", icon: Zap },
  { href: '/screener', label: 'Screener', icon: Search },
  { href: '/options', label: 'Options', icon: TrendingUp },
  { href: '/backtest', label: 'Backtest', icon: FlaskConical },
  { href: '/learn', label: 'Learn Options', icon: BookOpen },
  { href: '/strategies', label: 'Strategies', icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Activity className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg tracking-tight">OptionsLab</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Data: Yahoo Finance</p>
        <p className="text-xs text-muted-foreground">30s auto-refresh</p>
      </div>
    </aside>
  );
}
