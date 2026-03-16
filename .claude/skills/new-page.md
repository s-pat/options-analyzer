# OptionLabs — New Page Skill

> Use this skill when adding any new page or major component to the OptionLabs app.
> Trigger: user says "add a page", "create a new route", "build a new screen", or similar.

---

## Mandatory First Steps

1. **Run `/ui-ux-pro-max`** before writing any design code.
   The UI/UX Pro Max skill is the source of truth for visual standards, accessibility rules,
   and component patterns. Always invoke it first for any design task.

2. **Read the live design spec** at `/design` (route: `http://localhost:3000/design`).
   This page shows all colors, typography, buttons, cards, badges, and animations
   in their rendered form. Reference it when making visual decisions.

---

## OptionLabs Design System — Key Rules

### Theme
- **Style:** Dark OLED — deep black, glassmorphism cards, blue-500 primary
- **Background:** `bg-[#060608]` (or `bg-background` — same value in dark mode)
- **Card surfaces:** `bg-white/[0.03] border border-white/[0.08] rounded-2xl`
- **Elevated surfaces** (tables, charts): `bg-[#0a0a11]`
- **Sidebar:** `bg-[#080810]`
- **Font:** Geist Sans (headings), Geist Mono (prices/numbers/code)

### Colors — Never hardcode. Use these values:
| Role            | Tailwind / CSS var              | Hex approx |
|-----------------|----------------------------------|------------|
| Background      | `bg-background` / `bg-[#060608]` | #060608    |
| Card            | `bg-card` / `bg-[#0a0a11]`       | #0a0a11    |
| Primary (blue)  | `bg-primary` / `bg-blue-500`     | #3B82F6    |
| Border          | `border-border` / `border-white/[0.08]` | —  |
| Text primary    | `text-white` / `text-white/80`   | —          |
| Text secondary  | `text-muted-foreground` / `text-white/45` | —  |
| Text tertiary   | `text-white/30`                  | —          |
| Success         | `text-green-400`, `bg-green-500/10 border-green-500/20` | — |
| Danger          | `text-red-400`, `bg-red-500/10 border-red-500/20`      | — |
| IV / special    | `text-violet-400`                | —          |

### Layout Pattern
Every authenticated page follows this structure:

```tsx
// apps/web/app/my-page/page.tsx
import { Header } from '@/components/layout/Header';

export default function MyPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="My Page" />
      <main className="flex-1 px-4 sm:px-6 py-6 overflow-auto">
        {/* page content */}
      </main>
    </div>
  );
}
```

For full-screen public pages (no sidebar), use the landing page pattern:

```tsx
// apps/web/app/my-public-page/page.tsx
'use client';

export default function MyPublicPage() {
  return (
    <div className="min-h-dvh bg-[#060608] text-white">
      {/* CSS grid overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),' +
          'linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />
      {/* Content */}
    </div>
  );
}
```

Also add the route to the middleware allowlist if it's a public page:
```ts
// apps/web/middleware.ts
const ALLOWED_PREFIXES = ['/landing', '/gate', '/design', '/my-public-page', ...];
```

### Component Patterns

**Cards:**
```tsx
<div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
  {/* base card */}
</div>

<div className="rounded-2xl border border-white/[0.08] bg-[#0a0a11] p-6">
  {/* elevated card — for data tables, charts */}
</div>

<div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.07] p-6">
  {/* accent/active card */}
</div>
```

**Buttons:**
```tsx
{/* Primary */}
<button className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer">
  Action
</button>

{/* Secondary */}
<button className="px-5 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-white/80 font-semibold text-sm transition-all duration-200 cursor-pointer">
  Cancel
</button>
```

**Section headings:**
```tsx
<h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-6 pb-3 border-b border-white/[0.07]">
  Section Title
</h2>
```

**Badges:**
```tsx
{/* Status badges — always icon + text, never color only */}
<span className="text-[10px] px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium">Bullish</span>
<span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium">Bearish</span>
<span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">LIVE</span>
```

**Form inputs:**
```tsx
<input
  type="text"
  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
/>
```

**Loading state:**
```tsx
import { StockLoader } from '@/components/ui/StockLoader';

// Centered column (default)
<StockLoader message="Loading your data…" />

// Inline row
<StockLoader size="sm" />

// Skeleton rows for tables
{Array.from({ length: 5 }).map((_, i) => (
  <tr key={i}>
    <td><div className="h-3 w-20 rounded bg-white/[0.06] animate-pulse" /></td>
  </tr>
))}
```

**Callouts:**
```tsx
{/* Info */}
<div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3">
  <InfoIcon className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
  <p className="text-sm text-blue-300/80 leading-relaxed">Tip text here.</p>
</div>

{/* Warning */}
<div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
  <p className="text-sm text-amber-300/80 leading-relaxed">Warning text here.</p>
</div>
```

### Animations
Use these keyframes (already in `globals.css`):
- `fade-in-up 0.6s ease both` — page sections entrance
- `float-y 4s ease-in-out infinite` — floating decorative elements
- `ticker-scroll 40s linear infinite` — horizontal marquees (apply via ref, not inline style)
- `hero-dot-pulse 2s ease-in-out infinite` — SVG endpoint dots
- `spin 0.9s linear infinite` — loading spinners
- `animate-pulse` (Tailwind) — skeleton loading rows

Always add `@media (prefers-reduced-motion: reduce)` overrides for non-essential animations.

### Accessibility Rules (Non-negotiable)
- Every interactive element needs `cursor-pointer`
- Icon-only buttons need `aria-label`
- Color is never the sole indicator — always add icon or text
- Focus states must be visible: `focus:ring-1 focus:ring-blue-500/30`
- Form inputs need visible `<label>` elements
- Minimum touch target: 44×44px

---

## File Locations
| What | Path |
|------|------|
| Pages | `apps/web/app/<name>/page.tsx` |
| Shared layouts | `apps/web/components/layout/` |
| UI components | `apps/web/components/ui/` |
| Global styles + keyframes | `apps/web/app/globals.css` |
| Design spec (live) | `/design` route |
| Auth middleware | `apps/web/middleware.ts` |
| Hooks (SWR data) | `apps/web/hooks/useMarketData.ts` |

---

## Checklist Before Committing
- [ ] Ran `/ui-ux-pro-max` for design guidance
- [ ] Background is `#060608` / `bg-background`
- [ ] All colors use CSS vars or Tailwind tokens (no raw hex in components)
- [ ] Cards use `rounded-2xl border border-white/[0.08]`
- [ ] Numbers/prices use `font-mono tabular-nums`
- [ ] Loading state uses `<StockLoader>` or skeleton rows
- [ ] Every interactive element has `cursor-pointer`
- [ ] `aria-label` on icon-only buttons
- [ ] Focus ring visible (`focus:ring-1 focus:ring-blue-500/30`)
- [ ] Mobile-responsive (`px-4 sm:px-6`, `grid-cols-1 sm:grid-cols-2`)
- [ ] Added to `ALLOWED_PREFIXES` in middleware if public route
- [ ] Added to `MobileLayout` bypass list if no sidebar needed
