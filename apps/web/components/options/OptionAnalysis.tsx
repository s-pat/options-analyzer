'use client';

import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OptionAnalysis } from '@/lib/types';

interface OptionAnalysisProps {
  analysis: OptionAnalysis;
  isLoading?: boolean;
}

// ---- Verdict badge ----
const verdictConfig = {
  'Strong Buy': { color: 'bg-green-600 text-white', icon: TrendingUp },
  'Buy':        { color: 'bg-green-500/90 text-white', icon: TrendingUp },
  'Speculative':{ color: 'bg-yellow-500 text-black', icon: AlertTriangle },
  'Pass':       { color: 'bg-red-600 text-white', icon: TrendingDown },
} as const;

// ---- Risk dots ----
function RiskMeter({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-2.5 w-2.5 rounded-full transition-colors',
            i < level
              ? level <= 2 ? 'bg-green-500' : level <= 3 ? 'bg-yellow-400' : 'bg-red-500'
              : 'bg-muted',
          )}
        />
      ))}
    </div>
  );
}

// ---- Signal row ----
function SignalRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
      <div className="mt-0.5 shrink-0">
        {positive
          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
          : <XCircle className="h-4 w-4 text-red-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}: </span>
        <span className="text-xs text-foreground">{value}</span>
      </div>
    </div>
  );
}

export function OptionAnalysisPanel({ analysis, isLoading }: OptionAnalysisProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground animate-pulse">
          Analyzing option…
        </CardContent>
      </Card>
    );
  }

  const verdict = analysis.verdict as keyof typeof verdictConfig;
  const cfg = verdictConfig[verdict] ?? verdictConfig['Pass'];
  const VerdictIcon = cfg.icon;

  const posSignals = analysis.signals.filter(s => s.positive).length;
  const totalSignals = analysis.signals.length;

  return (
    <div className="space-y-4">
      {/* ---- Verdict banner ---- */}
      <Card className="overflow-hidden">
        <div className={cn('px-5 py-4 flex items-center justify-between', cfg.color)}>
          <div className="flex items-center gap-3">
            <VerdictIcon className="h-6 w-6" />
            <div>
              <div className="text-xl font-bold tracking-tight">{analysis.verdict}</div>
              <div className="text-xs opacity-80">
                {analysis.optionType.toUpperCase()} · {analysis.confidence} Confidence · Score {analysis.score.toFixed(0)}/100
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Signals</div>
            <div className="text-2xl font-bold">{posSignals}/{totalSignals}</div>
          </div>
        </div>

        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Max Loss</div>
              <div className="text-base font-bold text-red-500">−{analysis.maxLossPct}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Max Gain</div>
              <div className="text-base font-bold text-green-500">+{analysis.maxGainPct}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Breakeven</div>
              <div className="text-base font-bold">${analysis.breakevenAt.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Risk Meter ---- */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Risk Assessment</span>
            </div>
            <div className="flex items-center gap-3">
              <RiskMeter level={analysis.riskFactor} />
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  analysis.riskFactor <= 2 && 'border-green-500 text-green-500',
                  analysis.riskFactor === 3 && 'border-yellow-400 text-yellow-400',
                  analysis.riskFactor >= 4 && 'border-red-500 text-red-500',
                )}
              >
                {analysis.riskLabel}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Signal Checklist ---- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Signal Checklist</CardTitle>
        </CardHeader>
        <CardContent className="pb-3 pt-0">
          {analysis.signals.map((sig) => (
            <SignalRow key={sig.label} label={sig.label} value={sig.value} positive={sig.positive} />
          ))}
        </CardContent>
      </Card>

      {/* ---- Thesis ---- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Why {analysis.verdict === 'Pass' ? 'We Pass' : 'Consider This Trade'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          <ul className="space-y-2">
            {analysis.thesis.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ---- Key Risks ---- */}
      <Card className="border-red-900/30 bg-red-950/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Key Risks
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          <ul className="space-y-2">
            {analysis.keyRisks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span className="text-muted-foreground leading-relaxed">{risk}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
