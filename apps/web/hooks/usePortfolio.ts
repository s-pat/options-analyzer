'use client';
import { useState, useEffect, useCallback } from 'react';
import type { PortfolioPosition } from '@/lib/types';

const STORAGE_KEY = 'optionlabs_portfolio_v1';

export function usePortfolio() {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPositions(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [positions, loaded]);

  const addPosition = useCallback((pos: Omit<PortfolioPosition, 'id' | 'status'>) => {
    const newPos: PortfolioPosition = {
      ...pos,
      id: crypto.randomUUID(),
      status: 'open',
    };
    setPositions(prev => [newPos, ...prev]);
    return newPos;
  }, []);

  const closePosition = useCallback((id: string, closedPrice: number) => {
    setPositions(prev => prev.map(p =>
      p.id === id
        ? { ...p, status: 'closed', closedPrice, closedDate: new Date().toISOString().slice(0, 10) }
        : p
    ));
  }, []);

  const deletePosition = useCallback((id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  }, []);

  const openPositions = positions.filter(p => p.status === 'open');
  const closedPositions = positions.filter(p => p.status === 'closed');

  return { positions, openPositions, closedPositions, addPosition, closePosition, deletePosition, loaded };
}
