'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Search, FlaskConical, Activity, Zap, BookOpen, Target, LogOut } from 'lucide-react';
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

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/gate');
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar flex flex-col h-full md:h-screen md:sticky md:top-0">
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
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
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
      <div className="px-6 py-4 border-t border-border space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Data: Yahoo Finance</p>
          <p className="text-xs text-muted-foreground">30s auto-refresh</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <LogOut className="h-3.5 w-3.5" />
          Leave preview
        </button>
      </div>
    </aside>
  );
}
