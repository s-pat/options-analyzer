'use client';

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { OptionsChain as OptionsChainType, OptionContract, ExpiryCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

interface OptionsChainProps {
  chain: OptionsChainType;
  stockPrice: number;
  onSelectOption?: (opt: OptionContract) => void;
  selectedContract?: string | null;
}

// Category display config
const CATEGORY_CONFIG: Record<ExpiryCategory, { label: string; color: string }> = {
  weekly:    { label: 'Weekly',    color: 'text-blue-400 border-blue-400/40' },
  monthly:   { label: 'Monthly',  color: 'text-green-400 border-green-400/40' },
  quarterly: { label: 'Quarterly', color: 'text-purple-400 border-purple-400/40' },
  leaps:     { label: 'LEAPS',    color: 'text-orange-400 border-orange-400/40' },
};

const CATEGORY_ORDER: ExpiryCategory[] = ['weekly', 'monthly', 'quarterly', 'leaps'];

// Priority tiers for retail buyers.
// "prime"  → sweet-spot contracts most retail buyers should consider
// "good"   → reasonable but not ideal
// "normal" → fine, just not optimal
// "dim"    → far OTM lottery tickets; shown but de-emphasised
type Priority = 'prime' | 'good' | 'normal' | 'dim';

function getPriority(opt: OptionContract): Priority {
  const abs = Math.abs(opt.delta);
  if (abs < 0.15) return 'dim';
  if (
    abs >= 0.30 && abs <= 0.65 &&
    opt.dte >= 21 && opt.dte <= 75 &&
    opt.openInterest >= 100 &&
    opt.isFeasible
  ) return 'prime';
  if (abs >= 0.20 && abs <= 0.75 && opt.openInterest >= 50) return 'good';
  return 'normal';
}

// Moneyness label relative to stock price
function getMoneyness(opt: OptionContract, stockPrice: number): 'ITM' | 'ATM' | 'OTM' {
  const dist = Math.abs(opt.strike - stockPrice) / stockPrice;
  if (dist < 0.02) return 'ATM';
  const isCall = opt.optionType === 'call';
  const isITM = isCall ? opt.strike < stockPrice : opt.strike > stockPrice;
  return isITM ? 'ITM' : 'OTM';
}

function deltaColor(delta: number) {
  const abs = Math.abs(delta);
  if (abs >= 0.7) return 'text-green-400';
  if (abs >= 0.4) return 'text-yellow-400';
  return 'text-muted-foreground';
}

function PrimeDot() {
  return (
    <span
      title="Prime: ideal strike & expiry for retail buyers"
      className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
    />
  );
}

function ExpiryGroup({
  exp,
  opts,
  stockPrice,
  onSelect,
  selectedContract,
}: {
  exp: number;
  opts: OptionContract[];
  stockPrice: number;
  onSelect?: (opt: OptionContract) => void;
  selectedContract?: string | null;
}) {
  const date = new Date(exp * 1000).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const dte = opts[0]?.dte ?? 0;
  const cat = opts[0]?.expiryCategory ?? 'weekly';
  const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.weekly;

  const primeCount = useMemo(
    () => opts.filter((o) => getPriority(o) === 'prime').length,
    [opts],
  );

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">{date}</span>
        <Badge variant="outline" className="text-xs">{dte} DTE</Badge>
        <Badge variant="outline" className={cn('text-xs', cfg.color)}>{cfg.label}</Badge>
        {primeCount > 0 && (
          <span className="text-[10px] text-blue-400/70 font-medium">
            {primeCount} prime contract{primeCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-[110px]">Strike</TableHead>
              <TableHead>Bid</TableHead>
              <TableHead>Ask</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="hidden md:table-cell">IV</TableHead>
              <TableHead className="hidden sm:table-cell">Delta</TableHead>
              <TableHead className="hidden sm:table-cell">OI</TableHead>
              <TableHead className="hidden sm:table-cell">Vol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...opts]
              .sort((a, b) => a.strike - b.strike)
              .map((opt) => {
                const priority = getPriority(opt);
                const moneyness = getMoneyness(opt, stockPrice);
                const isATM = moneyness === 'ATM';
                const isSelected = selectedContract === opt.contractSymbol;

                return (
                  <TableRow
                    key={opt.contractSymbol}
                    onClick={() => onSelect?.(opt)}
                    className={cn(
                      'text-sm cursor-pointer transition-colors',
                      // Priority-based left-accent via inset box-shadow (works on <tr>)
                      isATM && 'shadow-[inset_3px_0_0_rgb(96_165_250)] bg-blue-500/[0.08] font-medium hover:bg-blue-500/[0.12]',
                      !isATM && priority === 'prime' && 'shadow-[inset_3px_0_0_rgb(59_130_246_/_0.45)] bg-blue-500/[0.04] hover:bg-blue-500/[0.07]',
                      !isATM && priority === 'good' && 'hover:bg-white/[0.04]',
                      !isATM && priority === 'normal' && 'hover:bg-white/[0.03]',
                      !isATM && priority === 'dim' && 'opacity-45 hover:opacity-65',
                      isSelected && '!bg-primary/10 shadow-[inset_3px_0_0_rgb(59_130_246)]',
                    )}
                  >
                    {/* Strike + moneyness badge */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono">${opt.strike.toFixed(0)}</span>
                        {isATM && (
                          <Badge className="text-[9px] py-0 px-1.5 h-4 bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                            ATM
                          </Badge>
                        )}
                        {moneyness === 'ITM' && (
                          <Badge className="text-[9px] py-0 px-1.5 h-4 bg-green-500/15 text-green-400 border border-green-500/25">
                            ITM
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono">${opt.bid.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">${opt.ask.toFixed(2)}</TableCell>
                    <TableCell className="font-mono font-medium">
                      ${opt.contractCost?.toFixed(0) ?? (opt.ask * 100).toFixed(0)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono">
                      {(opt.impliedVolatility * 100).toFixed(0)}%
                    </TableCell>

                    {/* Delta — with prime dot indicator */}
                    <TableCell className={cn('hidden sm:table-cell font-mono', deltaColor(opt.delta))}>
                      <div className="flex items-center gap-1.5">
                        {priority === 'prime' && <PrimeDot />}
                        {opt.delta.toFixed(2)}
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell font-mono">
                      {opt.openInterest.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono">
                      {opt.volume.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function OptionTable({
  options,
  stockPrice,
  onSelect,
  selectedContract,
}: {
  options: OptionContract[];
  stockPrice: number;
  onSelect?: (opt: OptionContract) => void;
  selectedContract?: string | null;
}) {
  const { byCategory, activeCats } = useMemo(() => {
    const grouped: Partial<Record<ExpiryCategory, Record<number, OptionContract[]>>> = {};
    for (const opt of options) {
      const cat = opt.expiryCategory ?? 'weekly';
      if (!grouped[cat]) grouped[cat] = {};
      if (!grouped[cat]![opt.expiration]) grouped[cat]![opt.expiration] = [];
      grouped[cat]![opt.expiration].push(opt);
    }
    const cats = CATEGORY_ORDER.filter((c) => grouped[c] && Object.keys(grouped[c]!).length > 0);
    return { byCategory: grouped, activeCats: cats };
  }, [options]);

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No contracts match your filters.</p>;
  }

  if (activeCats.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No contracts available.</p>;
  }

  // If only one category, render flat (no inner tabs)
  if (activeCats.length === 1) {
    const cat = activeCats[0];
    const expirations = Object.keys(byCategory[cat]!).map(Number).sort();
    return (
      <div>
        {expirations.map((exp) => (
          <ExpiryGroup
            key={exp}
            exp={exp}
            opts={byCategory[cat]![exp]}
            stockPrice={stockPrice}
            onSelect={onSelect}
            selectedContract={selectedContract}
          />
        ))}
      </div>
    );
  }

  // Multiple categories — use inner tabs
  return (
    <Tabs defaultValue={activeCats[0]}>
      <TabsList className="mb-4">
        {activeCats.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const count = Object.values(byCategory[cat]!).flat().length;
          return (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {cfg.label}
              <span className="ml-1 text-muted-foreground">({count})</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {activeCats.map((cat) => {
        const expirations = Object.keys(byCategory[cat]!).map(Number).sort();
        return (
          <TabsContent key={cat} value={cat}>
            {expirations.map((exp) => (
              <ExpiryGroup
                key={exp}
                exp={exp}
                opts={byCategory[cat]![exp]}
                stockPrice={stockPrice}
                onSelect={onSelect}
                selectedContract={selectedContract}
              />
            ))}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

export function OptionsChain({ chain, stockPrice, onSelectOption, selectedContract }: OptionsChainProps) {
  const calls = chain.calls ?? [];
  const puts = chain.puts ?? [];
  const defaultTab = calls.length > 0 ? 'calls' : 'puts';
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="calls">Calls ({calls.length})</TabsTrigger>
        <TabsTrigger value="puts">Puts ({puts.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="calls" className="mt-4">
        <OptionTable
          options={calls}
          stockPrice={stockPrice}
          onSelect={onSelectOption}
          selectedContract={selectedContract}
        />
      </TabsContent>
      <TabsContent value="puts" className="mt-4">
        <OptionTable
          options={puts}
          stockPrice={stockPrice}
          onSelect={onSelectOption}
          selectedContract={selectedContract}
        />
      </TabsContent>
    </Tabs>
  );
}
