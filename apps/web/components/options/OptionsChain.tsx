'use client';

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

function deltaColor(delta: number) {
  const abs = Math.abs(delta);
  if (abs >= 0.7) return 'text-green-400';
  if (abs >= 0.4) return 'text-yellow-400';
  return 'text-muted-foreground';
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

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">{date}</span>
        <Badge variant="outline" className="text-xs">{dte} DTE</Badge>
        <Badge variant="outline" className={cn('text-xs', cfg.color)}>{cfg.label}</Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Strike</TableHead>
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
            {opts
              .sort((a, b) => a.strike - b.strike)
              .map((opt) => {
                const isATM = Math.abs(opt.strike - stockPrice) / stockPrice < 0.02;
                return (
                  <TableRow
                    key={opt.contractSymbol}
                    className={cn(
                      'text-sm cursor-pointer hover:bg-muted/60',
                      isATM && 'bg-primary/5 font-medium',
                      selectedContract === opt.contractSymbol && 'ring-1 ring-inset ring-primary bg-primary/10',
                    )}
                    onClick={() => onSelect?.(opt)}
                  >
                    <TableCell>
                      ${opt.strike.toFixed(0)}
                      {isATM && <Badge variant="outline" className="ml-1 text-[10px] py-0">ATM</Badge>}
                    </TableCell>
                    <TableCell>${opt.bid.toFixed(2)}</TableCell>
                    <TableCell>${opt.ask.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      ${opt.contractCost?.toFixed(0) ?? (opt.ask * 100).toFixed(0)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{(opt.impliedVolatility * 100).toFixed(0)}%</TableCell>
                    <TableCell className={cn('hidden sm:table-cell', deltaColor(opt.delta))}>
                      {opt.delta.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{opt.openInterest.toLocaleString()}</TableCell>
                    <TableCell className="hidden sm:table-cell">{opt.volume.toLocaleString()}</TableCell>
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
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No contracts match your filters.</p>;
  }

  // Group by category, then by expiration within each category
  const byCategory: Partial<Record<ExpiryCategory, Record<number, OptionContract[]>>> = {};
  for (const opt of options) {
    const cat = opt.expiryCategory ?? 'weekly';
    if (!byCategory[cat]) byCategory[cat] = {};
    if (!byCategory[cat]![opt.expiration]) byCategory[cat]![opt.expiration] = [];
    byCategory[cat]![opt.expiration].push(opt);
  }

  const activeCats = CATEGORY_ORDER.filter((c) => byCategory[c] && Object.keys(byCategory[c]!).length > 0);

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
  return (
    <Tabs defaultValue="calls">
      <TabsList>
        <TabsTrigger value="calls">Calls ({chain.calls.length})</TabsTrigger>
        <TabsTrigger value="puts">Puts ({chain.puts.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="calls" className="mt-4">
        <OptionTable
          options={chain.calls}
          stockPrice={stockPrice}
          onSelect={onSelectOption}
          selectedContract={selectedContract}
        />
      </TabsContent>
      <TabsContent value="puts" className="mt-4">
        <OptionTable
          options={chain.puts}
          stockPrice={stockPrice}
          onSelect={onSelectOption}
          selectedContract={selectedContract}
        />
      </TabsContent>
    </Tabs>
  );
}
