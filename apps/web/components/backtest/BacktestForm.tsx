'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BacktestRequest } from '@/lib/types';

interface BacktestFormProps {
  onSubmit: (req: BacktestRequest) => void;
  loading: boolean;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function oneYearAgoStr() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

const intervalDescriptions: Record<string, string> = {
  weekly:   '~every 5 trading days',
  biweekly: '~every 10 trading days',
  monthly:  '~every 21 trading days',
};

export function BacktestForm({ onSubmit, loading }: BacktestFormProps) {
  const [symbol,   setSymbol]   = useState('SPY');
  const [type,     setType]     = useState<'call' | 'put'>('call');
  const [startDate,setStartDate]= useState(oneYearAgoStr);
  const [endDate,  setEndDate]  = useState(todayStr);
  const [delta,    setDelta]    = useState('0.40');
  const [interval, setInterval] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      symbol: symbol.trim().toUpperCase(),
      type,
      startDate,
      endDate,
      deltaTarget: parseFloat(delta) || 0.40,
      interval,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configure Backtest</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. SPY"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Option Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'call' | 'put')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Long Call</SelectItem>
                <SelectItem value="put">Long Put</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Trade Interval</Label>
            <Select value={interval} onValueChange={(v) => setInterval(v as 'weekly' | 'biweekly' | 'monthly')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delta">Delta Target</Label>
            <Input
              id="delta"
              type="number"
              min="0.10"
              max="0.80"
              step="0.05"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="start">Start Date</Label>
            <Input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="end">End Date</Label>
            <Input
              id="end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Running…' : 'Run Backtest'}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-xs text-muted-foreground space-y-0.5">
          <div>Exit rules: +100% profit target · −50% stop loss · 21 DTE time exit</div>
          <div>Entry: ATM option, 45 DTE · new trade opened {intervalDescriptions[interval]}</div>
        </div>
      </CardContent>
    </Card>
  );
}
