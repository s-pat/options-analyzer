'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Header({ title }: { title: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = query.trim().toUpperCase();
    if (sym) {
      router.push(`/options?symbol=${sym}`);
      setQuery('');
    }
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-semibold">{title}</h1>
      <form onSubmit={handleSearch} className="flex items-center gap-2 w-72">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol (e.g. AAPL)…"
            className="pl-8 h-9 text-sm"
          />
        </div>
      </form>
    </header>
  );
}
