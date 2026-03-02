'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal } from 'lucide-react';
import type { OptionsFilter } from '@/lib/types';

interface FilterPanelProps {
  filter: OptionsFilter;
  onChange: (f: OptionsFilter) => void;
}

const CAPITAL_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '≤ $100', value: 100 },
  { label: '≤ $500', value: 500 },
  { label: '≤ $1,500', value: 1500 },
  { label: '≤ $5,000', value: 5000 },
];

const RISK_OPTIONS = [
  {
    value: 0,
    label: 'All',
    desc: 'No filter applied',
  },
  {
    value: 1,
    label: 'Conservative',
    desc: '30–60 DTE · Δ 0.40–0.55 · OI ≥ 500 · spread < 6%',
  },
  {
    value: 2,
    label: 'Moderate',
    desc: '21–90 DTE · Δ 0.30–0.60 · OI ≥ 200 · spread < 12%',
  },
  {
    value: 3,
    label: 'Aggressive',
    desc: '7–180 DTE · any Δ · OI ≥ 50 · spread < 20%',
  },
];

const TYPE_OPTIONS = [
  { label: 'Calls & Puts', onlyCall: false, onlyPut: false },
  { label: 'Calls Only', onlyCall: true, onlyPut: false },
  { label: 'Puts Only', onlyCall: false, onlyPut: true },
];

export function FilterPanel({ filter, onChange }: FilterPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filter Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capital budget */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Max Cost / Contract
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CAPITAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...filter, maxCapital: opt.value })}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  filter.maxCapital === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Risk level */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Risk Level
          </p>
          <div className="space-y-1.5">
            {RISK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...filter, riskLevel: opt.value })}
                className={`w-full text-left px-3 py-2 rounded border text-xs transition-colors ${
                  filter.riskLevel === opt.value
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/30'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="block text-[10px] mt-0.5 opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Option Type
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map((opt) => {
              const active =
                filter.onlyCall === opt.onlyCall && filter.onlyPut === opt.onlyPut;
              return (
                <button
                  key={opt.label}
                  onClick={() =>
                    onChange({ ...filter, onlyCall: opt.onlyCall, onlyPut: opt.onlyPut })
                  }
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground/40'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active filter summary */}
        {(filter.maxCapital > 0 || filter.riskLevel > 0) && (
          <div className="pt-1 flex flex-wrap gap-1">
            {filter.maxCapital > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                ≤ ${filter.maxCapital.toLocaleString()}
              </Badge>
            )}
            {filter.riskLevel > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {RISK_OPTIONS[filter.riskLevel].label}
              </Badge>
            )}
            <button
              className="text-[10px] text-muted-foreground underline ml-1"
              onClick={() => onChange({ maxCapital: 0, riskLevel: 0, onlyCall: false, onlyPut: false })}
            >
              Clear
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
