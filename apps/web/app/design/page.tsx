'use client';

/**
 * OptionLabs Design Spec — /design
 *
 * Live visual reference for the OptionLabs OLED dark design system.
 * Use this page when building new features to ensure visual consistency.
 *
 * Key rules:
 *  - Background: #060608 (CSS var --background)
 *  - Surfaces: #0a0a11 (CSS var --card)
 *  - Primary accent: #3B82F6 blue-500 (CSS var --primary)
 *  - Borders: white/8 (CSS var --border)
 *  - Text: white with opacity (white/80 body, white/45 secondary, white/30 tertiary)
 *  - Success: green-400 / green-500
 *  - Danger: red-400 / red-500
 *  - Special: violet-400 (IV rank), amber (warnings)
 *  - Font: Geist Sans (heading) + Geist Mono (numbers/code)
 *  - Grid overlay: white/0.025, 80px
 *  - Ambient glows: blue-600/8 or violet-600/6, blur-[120-150px]
 */

import { Activity, ArrowUpRight, ArrowDownRight, Check, AlertTriangle, Info, Zap, Search, TrendingUp } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';

/* ── Section wrapper ──────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-6 pb-3 border-b border-white/[0.07]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">{children}</p>;
}

/* ── Color swatch ─────────────────────────────────────────────────────────── */
function Swatch({ bg, label, hex }: { bg: string; label: string; hex: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-12 rounded-xl border border-white/[0.08] ${bg}`} />
      <p className="text-xs text-white/70 font-medium">{label}</p>
      <p className="text-[10px] text-white/30 font-mono">{hex}</p>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function DesignPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-white px-6 py-12 overflow-x-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <span className="font-semibold text-lg tracking-tight">OptionLabs</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/[0.1] text-white/50 font-medium">Design System</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Design Spec</h1>
          <p className="text-white/45 text-sm leading-relaxed max-w-lg">
            The single source of truth for the OptionLabs OLED dark aesthetic.
            Reference this page when building new pages or components.
          </p>
        </div>

        {/* ── Colors ──────────────────────────────────────────────────────── */}
        <Section title="Color Palette">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Swatch bg="bg-[#060608]"              label="Background"   hex="#060608" />
            <Swatch bg="bg-[#080810]"              label="Sidebar"      hex="#080810" />
            <Swatch bg="bg-[#0a0a11]"              label="Card surface" hex="#0a0a11" />
            <Swatch bg="bg-[#0d0d15]"              label="Elevated"     hex="#0d0d15" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Swatch bg="bg-blue-500"               label="Primary"      hex="#3B82F6" />
            <Swatch bg="bg-blue-400"               label="Primary hover" hex="#60A5FA" />
            <Swatch bg="bg-green-400"              label="Success / up"  hex="#4ADE80" />
            <Swatch bg="bg-red-400"                label="Danger / down" hex="#F87171" />
            <Swatch bg="bg-violet-400"             label="IV / special"  hex="#A78BFA" />
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { opacity: '80', label: 'Text / primary' },
              { opacity: '45', label: 'Text / secondary' },
              { opacity: '30', label: 'Text / tertiary' },
              { opacity: '08', label: 'Border' },
            ].map((t) => (
              <div key={t.opacity} className="flex flex-col gap-1.5">
                <div
                  className="h-12 rounded-xl border border-white/[0.08]"
                  style={{ background: `rgba(255,255,255,0.${t.opacity})` }}
                />
                <p className="text-xs text-white/70 font-medium">{t.label}</p>
                <p className="text-[10px] text-white/30 font-mono">white/{t.opacity === '08' ? '8' : parseInt(t.opacity, 10)}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Typography ──────────────────────────────────────────────────── */}
        <Section title="Typography">
          <div className="space-y-4">
            <div><p className="text-5xl font-bold tracking-tight leading-none">Display 48</p><Label>font-bold text-5xl tracking-tight — page titles</Label></div>
            <div><p className="text-4xl font-bold tracking-tight">Heading 36</p><Label>font-bold text-4xl tracking-tight — section headings</Label></div>
            <div><p className="text-3xl font-bold">Heading 30</p><Label>font-bold text-3xl — sub-section headings</Label></div>
            <div><p className="text-xl font-semibold">Title 20</p><Label>font-semibold text-xl — card titles</Label></div>
            <div><p className="text-base font-medium">Body 16</p><Label>font-medium text-base — primary body text</Label></div>
            <div><p className="text-sm text-white/60">Secondary 14 — supporting text, descriptions</p><Label>text-sm text-white/60</Label></div>
            <div><p className="text-xs text-white/40 uppercase tracking-widest font-semibold">LABEL / CAPTION 12</p><Label>text-xs text-white/40 uppercase tracking-widest font-semibold — section labels</Label></div>
            <div><p className="font-mono text-2xl font-bold text-white tabular-nums">$587.42</p><Label>font-mono font-bold tabular-nums — prices, numbers</Label></div>
          </div>
        </Section>

        {/* ── Buttons ─────────────────────────────────────────────────────── */}
        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            {/* Primary */}
            <button className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer">
              Primary
            </button>
            {/* Secondary */}
            <button className="px-5 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-white/80 font-semibold text-sm transition-all duration-200 cursor-pointer">
              Secondary
            </button>
            {/* Ghost */}
            <button className="px-5 py-2.5 rounded-xl hover:bg-white/[0.06] text-white/60 hover:text-white font-medium text-sm transition-all duration-200 cursor-pointer">
              Ghost
            </button>
            {/* Danger */}
            <button className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-sm transition-all duration-200 cursor-pointer">
              Danger
            </button>
            {/* Success */}
            <button className="px-5 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-semibold text-sm transition-all duration-200 cursor-pointer">
              Success
            </button>
            {/* Icon + text */}
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition-all duration-200 cursor-pointer">
              <Zap className="h-4 w-4" />
              With icon
            </button>
            {/* Disabled */}
            <button disabled className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/20 font-semibold text-sm cursor-not-allowed">
              Disabled
            </button>
          </div>
        </Section>

        {/* ── Cards ───────────────────────────────────────────────────────── */}
        <Section title="Cards & Surfaces">
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Base card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1">Base card</p>
              <p className="text-xl font-bold text-white">$587.42</p>
              <p className="text-xs text-white/40 mt-1">bg-white/[0.03] · border-white/[0.08]</p>
            </div>
            {/* Elevated card */}
            <div className="rounded-2xl border border-white/[0.1] bg-[#0a0a11] p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1">Elevated card</p>
              <p className="text-xl font-bold text-white">SPY</p>
              <p className="text-xs text-white/40 mt-1">bg-[#0a0a11] · border-white/[0.1]</p>
            </div>
            {/* Blue accent card */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.07] p-5">
              <p className="text-xs text-blue-400/60 uppercase tracking-wider font-medium mb-1">Accent card</p>
              <p className="text-xl font-bold text-blue-400">Active state</p>
              <p className="text-xs text-blue-400/40 mt-1">bg-blue-500/[0.07] · border-blue-500/20</p>
            </div>
          </div>
        </Section>

        {/* ── Badges ──────────────────────────────────────────────────────── */}
        <Section title="Badges & Chips">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium">Bullish</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium">Bearish</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/50 font-medium">Neutral</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">LIVE</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 font-medium">IV Rank</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">Warning</span>
            <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium">
              <ArrowUpRight className="h-3 w-3" />
              +1.23%
            </span>
            <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
              <ArrowDownRight className="h-3 w-3" />
              −0.84%
            </span>
          </div>
        </Section>

        {/* ── Inputs ──────────────────────────────────────────────────────── */}
        <Section title="Form Inputs">
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-xs text-white/45 mb-1.5 font-medium">Text input</label>
              <input
                type="text"
                placeholder="Search symbol…"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-white/45 mb-1.5 font-medium">Search with icon</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
                <input
                  type="text"
                  placeholder="AAPL, SPY…"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Callouts ────────────────────────────────────────────────────── */}
        <Section title="Callouts & Alerts">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300/80 leading-relaxed">Info callout — use for tips and contextual notes.</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/[0.06] px-4 py-3">
              <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <p className="text-sm text-green-300/80 leading-relaxed">Success callout — use for confirmations.</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300/80 leading-relaxed">Warning callout — use for risk notices and caveats.</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300/80 leading-relaxed">Error callout — use for errors and destructive states.</p>
            </div>
          </div>
        </Section>

        {/* ── Tables ──────────────────────────────────────────────────────── */}
        <Section title="Data Table">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a11] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Symbol', 'Price', 'Change', 'IV Rank', 'Signal'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] text-white/30 uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { sym: 'SPY',  price: '$587.42', change: '+0.21%', up: true,  iv: '78th',  sig: 'Bullish' },
                  { sym: 'AAPL', price: '$224.18', change: '+1.56%', up: true,  iv: '62nd',  sig: 'Neutral' },
                  { sym: 'TSLA', price: '$281.33', change: '−1.48%', up: false, iv: '91st',  sig: 'Bearish' },
                ].map((row) => (
                  <tr key={row.sym} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-white/80">{row.sym}</td>
                    <td className="px-5 py-3.5 font-mono text-white/70">{row.price}</td>
                    <td className={`px-5 py-3.5 font-mono font-medium ${row.up ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="flex items-center gap-0.5">
                        {row.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {row.change}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-violet-400">{row.iv}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        row.sig === 'Bullish' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : row.sig === 'Bearish' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-white/5 text-white/40 border-white/10'}`}>
                        {row.sig}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Loading states ───────────────────────────────────────────────── */}
        <Section title="Loading States">
          <div className="grid sm:grid-cols-3 gap-8 items-start">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 flex items-center justify-center">
              <StockLoader size="md" />
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 flex items-center justify-center">
              <StockLoader size="sm" />
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 flex flex-col gap-4">
              {/* Skeleton rows */}
              {[80, 60, 90, 55].map((w, i) => (
                <div key={i} className="h-3 rounded bg-white/[0.06] animate-pulse" style={{ width: `${w}%` }} />
              ))}
              <Label>Skeleton rows (animate-pulse)</Label>
            </div>
          </div>
        </Section>

        {/* ── Animations ──────────────────────────────────────────────────── */}
        <Section title="Animation Tokens">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {['Name', 'Value', 'Used for'].map((h) => (
                    <th key={h} className="pb-3 text-left text-[10px] text-white/30 uppercase tracking-wider font-medium pr-8">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  { name: 'fade-in-up',      val: '0.6s ease both',        use: 'Page sections, hero content entrance' },
                  { name: 'ticker-scroll',   val: '40s linear infinite',   use: 'Horizontal marquee band' },
                  { name: 'float-y',         val: '4s ease-in-out infinite', use: 'Floating badges (hero)' },
                  { name: 'hero-dot-pulse',  val: '2s ease-in-out infinite', use: 'SVG chart endpoint dot' },
                  { name: 'stock-line',      val: '3s ease-in-out infinite', use: 'StockLoader chart line' },
                  { name: 'stock-dot',       val: '3s ease-in-out infinite', use: 'StockLoader chart dot' },
                  { name: 'spin',            val: '0.9s linear infinite',   use: 'Loading spinner ring' },
                  { name: 'animate-pulse',   val: 'Tailwind built-in',      use: 'Skeleton loading rows' },
                ].map((r) => (
                  <tr key={r.name} className="text-sm">
                    <td className="py-3 pr-8 font-mono text-blue-400">{r.name}</td>
                    <td className="py-3 pr-8 font-mono text-white/50 text-xs">{r.val}</td>
                    <td className="py-3 text-white/40 text-xs">{r.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Spacing ─────────────────────────────────────────────────────── */}
        <Section title="Spacing Scale">
          <div className="flex flex-wrap items-end gap-4">
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1.5">
                <div className="w-4 bg-blue-500/40 rounded" style={{ height: `${n * 4}px` }} />
                <p className="text-[10px] text-white/30 font-mono">{n}</p>
                <p className="text-[10px] text-white/20">{n * 4}px</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 mt-4">4px base unit · Use multiples of 4 for all spacing, padding, gaps.</p>
        </Section>

        {/* ── Design tokens (CSS vars) ─────────────────────────────────────── */}
        <Section title="CSS Variables Quick Reference">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a11] p-5 font-mono text-xs">
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-1.5">
              {[
                ['--background',        '#060608  /* OLED black */'],
                ['--card',              '#0a0a11  /* elevated surface */'],
                ['--primary',           '#3B82F6  /* blue-500 */'],
                ['--border',            'white/8'],
                ['--muted-foreground',  'white/45 /* secondary text */'],
                ['--ring',              '#3B82F6  /* focus ring */'],
                ['--destructive',       'red-500'],
                ['--sidebar',           '#080810'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-violet-400">{k}:</span>
                  <span className="text-white/40">{v};</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/30 mt-3">
            Use CSS vars (<code className="text-blue-400">var(--primary)</code>) or Tailwind tokens
            (<code className="text-blue-400">bg-primary</code>,{' '}
            <code className="text-blue-400">text-muted-foreground</code>) in components—never hardcode hex.
            Use hardcoded hex (<code className="text-blue-400">bg-[#060608]</code>) only in page backgrounds
            and surfaces where the token doesn&apos;t have a direct Tailwind mapping.
          </p>
        </Section>

        {/* ── New page checklist ───────────────────────────────────────────── */}
        <Section title="New Page Checklist">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-2.5">
            {[
              'Run /ui-ux-pro-max before starting design work',
              'Root background: bg-[#060608] or bg-background (same)',
              'Add CSS grid overlay (see landing page for snippet)',
              'Add ambient glow: bg-blue-600/8 blur-[120px] in key sections',
              'Use Header component with dark styling for page title + search',
              'Card surfaces: bg-white/[0.03] border border-white/[0.08] rounded-2xl',
              'Elevated surfaces (charts, tables): bg-[#0a0a11]',
              'All text uses white with opacity (white/80, white/45, white/30)',
              'Numbers use font-mono and tabular-nums',
              'Primary action buttons: bg-blue-500 hover:bg-blue-400',
              'Secondary buttons: bg-white/[0.07] border border-white/[0.1]',
              'Use StockLoader for data-loading states',
              'Use skeleton rows (animate-pulse bg-white/[0.06]) for table loading',
              'Respect prefers-reduced-motion for all animations',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                </div>
                <p className="text-sm text-white/60">{item}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <footer className="border-t border-white/[0.07] pt-8 flex items-center justify-between">
          <p className="text-xs text-white/25">OptionLabs Design System · v1.0</p>
          <div className="flex items-center gap-2 text-xs text-white/25">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Dark OLED · Blue-500 primary · Geist font</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
