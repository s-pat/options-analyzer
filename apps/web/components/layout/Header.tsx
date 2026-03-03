'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSidebar } from './MobileLayout';

export function Header({ title }: { title: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { open } = useSidebar();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = query.trim().toUpperCase();
    if (sym) {
      router.push(`/options?symbol=${sym}`);
      setQuery('');
    }
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center gap-3 px-4 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={open}
        className="md:hidden p-2 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-base font-semibold flex-1 truncate">{title}</h1>

      <form onSubmit={handleSearch} className="flex items-center gap-2 w-36 sm:w-64">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol…"
            className="pl-8 h-9 text-sm"
          />
        </div>
      </form>
    </header>
  );
}
