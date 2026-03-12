<!--
  Thanks for opening a PR! Fill in the sections below and delete anything that isn't relevant.
  Tip: keep the title short and follow conventional commits → feat(web): ..., fix(api): ...
-->

Closes # <!-- issue or ticket number, e.g. Closes #42 -->

---

## 🎯 Summary

<!-- What does this PR do and why? 2–4 sentences max. -->



---

## 🔖 Type of change

<!-- Check all that apply -->

- [ ] ✨ New feature
- [ ] 🐛 Bug fix
- [ ] 🎨 UI / design change
- [ ] ♻️ Refactor (no behaviour change)
- [ ] ⚡ Performance improvement
- [ ] 🧪 Tests only
- [ ] 📝 Docs / comments only
- [ ] 🔧 Config / CI / tooling
- [ ] 💥 Breaking change

---

## 📦 Scope

<!-- Which part(s) of the monorepo does this touch? -->

- [ ] 🖥️ `apps/web` — Next.js frontend
- [ ] ⚙️ `apps/api` — Go backend
- [ ] 🔗 Both
- [ ] 🏗️ Root / shared config

---

## 🧩 What changed

<!--
  Bullet-point summary of the key changes. Be specific — reviewers shouldn't need to read every file.
  Example:
  - Added `/landing` route with dark OLED theme and animated hero chart
  - Updated middleware to redirect unauthenticated users to `/landing`
  - Installed `resend` package in apps/web
-->

-
-
-

---

## 🧪 How to test

<!--
  Steps a reviewer can follow to verify this works end-to-end.
  Include env vars needed, seed data, or any setup steps.
-->

1.
2.
3.

**E2E tests:**
```bash
cd e2e && npx playwright test
```

---

## 📸 Screenshots / recordings

<!-- Required for any UI change. Include before/after if it's a change to existing UI. -->

| Before | After |
|--------|-------|
| &nbsp; | &nbsp; |

> _Delete this section if there are no visual changes._

---

## ✅ Checklist

**General**
- [ ] Self-reviewed the diff before opening
- [ ] No `console.log`, debug code, or commented-out blocks left in
- [ ] No hardcoded secrets, credentials, or API keys
- [ ] TypeScript compiles: `npx tsc --noEmit` passes

**Frontend (`apps/web`)**
- [ ] Tested on mobile viewport (375px)
- [ ] Tested unauthenticated flow (no beta token)
- [ ] New public routes added to middleware allowlist
- [ ] Accessible — interactive elements have labels, focus states visible

**Backend (`apps/api`)**
- [ ] New endpoints documented (route, method, request/response shape)
- [ ] Error cases handled and return appropriate HTTP status codes
- [ ] No N+1 queries or unguarded external calls introduced

**Tests**
- [ ] E2E tests added or updated for new/changed behaviour
- [ ] Selectors use role/label/text — not brittle CSS class selectors
