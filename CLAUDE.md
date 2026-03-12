# OptionsLab — Claude Code Guidelines

## Project Overview
OptionsLab is a full-stack options trading analysis platform.
- **Frontend:** Next.js 16 App Router (`apps/web`) — Tailwind CSS v4, shadcn/ui, SWR
- **Backend:** Go API (`apps/api`) hitting Yahoo Finance
- **Monorepo:** Turborepo

## Design System
The UI follows a strict **dark OLED** theme established in the landing page (`/landing`).
- Primary reference: **`/design` route** — live visual design spec showing all tokens, components, patterns
- Skill reference: **`.claude/skills/new-page.md`** — step-by-step guide for adding new pages

### Key Design Rules
- Background: `#060608` (`bg-background`)
- Card surfaces: `bg-white/[0.03] border border-white/[0.08] rounded-2xl`
- Primary: `#3B82F6` blue-500
- Font: Geist Sans (UI) + Geist Mono (numbers)
- **Always run `/ui-ux-pro-max` before any UI design work**

## Skills
Use these skills for common tasks:

| Task | Skill |
|------|-------|
| Add a new page | `/new-page` (`.claude/skills/new-page.md`) |
| Design decisions, component styling, UX review | `/ui-ux-pro-max` |

## Key File Locations
| What | Path |
|------|------|
| Pages | `apps/web/app/<name>/page.tsx` |
| Layout components | `apps/web/components/layout/` |
| UI components | `apps/web/components/ui/` |
| Global CSS + keyframes | `apps/web/app/globals.css` |
| Auth middleware | `apps/web/middleware.ts` |
| SWR hooks | `apps/web/hooks/useMarketData.ts` |
| API client | `apps/web/lib/api.ts` |
| E2E tests | `e2e/tests/` |

## Architecture Notes
- Unauthenticated users → redirect to `/landing` (not `/gate`)
- `/gate` = password entry; `/landing` = public marketing page; `/design` = design spec
- SWR cache key `'stocks'` is shared between dashboard and landing page (60s dedup on landing)
- `MobileLayout` bypasses sidebar for `/gate`, `/landing`, `/design`
- Middleware `ALLOWED_PREFIXES` must include any new public routes

## Dev Commands
```bash
# Start dev server (from repo root)
npm run dev

# Run E2E tests
cd e2e && npx playwright test

# Go API
cd apps/api && go run .
```
