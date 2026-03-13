'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Menu } from 'lucide-react';
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
    <header className="h-14 border-b border-white/[0.07] bg-[#060608]/90 backdrop-blur-xl flex items-center gap-3 px-4 shrink-0 sticky top-0 z-30">
      {/* Hamburger — mobile only */}
      <button
        onClick={open}
        className="md:hidden p-2 -ml-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-sm font-semibold flex-1 truncate text-white/80">{title}</h1>

      <form onSubmit={handleSearch} className="flex items-center w-36 sm:w-60">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol…"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
            style={{ fontSize: '16px' }}  /* prevent iOS auto-zoom on focus */
          />
        </div>
      </form>
    </header>
  );
}
