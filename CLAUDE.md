@AGENTS.md

# SAMPARK Web — Conventions

Admin/desktop portal for SP Bijapur. Read the root `../CLAUDE.md` for project-wide rules first.
**Heed `AGENTS.md` above: this is Next.js 16 — do not assume Next 14/15 behavior. Consult
`node_modules/next/dist/docs/` before writing framework code.** As of Phase 4 (SAMPARK Web /
B-Smart plan), **auth and the dashboard/records pages are wired to the real backend** via
`NEXT_PUBLIC_API_URL` (default `https://api.bsmart.net.in/api/v1`). The reporting-trend chart,
CSP rollup, recent-reports table, activity feed, officers/tracker/notifications/profile pages,
and the hierarchy drill-down remain **mock/unwired** — most have no backend endpoint yet
(activity feed, leaderboard, deeper analytics are out of Phase 1 backend scope).

## Stack (do not change without instruction)

- **Next.js 16.2.9 (App Router)**, React 19.2.4, TypeScript 5 (`strict: true`), Node 22.x.
- **Tailwind CSS v4, CSS-first** — configured via `@tailwindcss/postcss`; there is **no
  `tailwind.config.js`**. All tokens live in `app/globals.css`.
- Icons: `lucide-react` **v1.x** (note: not the common v0.x). Fonts via `next/font/google`.
- **No** state library, data-fetching library, `zod`, or `cn`/clsx/tailwind-merge helper.

## Design tokens — single source of truth: `app/globals.css`

- `@import "tailwindcss";` then an `@theme` block (`--font-sans`, `--color-brand: #0ea5c4`,
  `--color-navy`) plus a large `:root` block of CSS custom properties: brand cyan
  (`--brand`, `--brand-strong`, `--brand-soft`, `--brand-ring`), status colors
  (`--amber/-soft`, `--emerald/-soft`, `--violet/-soft`, `--rose/-soft`), surfaces, slate text
  hierarchy (never pure black), borders, 8pt spacing scale, radii, elevation, layout, motion.
- globals.css also defines the **type scale as utility classes** (`.t-h1`…`.t-h4`, `.t-body`,
  `.t-caption`, `.t-overline`) and **component primitive classes** (`.card`, `.btn`+modifiers,
  `.input`, `.badge`, `.nav-item`, `.stat-grid`, `.dash-card`, ...).

### Non-negotiables

1. **Consume tokens, never raw values.** Style with the primitive/semantic classes above and/or
   inline `style={{ ... }}` referencing `var(--token)`. Never hardcode hex/px in feature code.
2. **Legacy files vs new work.** `app/page.tsx` (landing) and `login/page.tsx` use hardcoded hex +
   inline `<style>` (an older "preserved palette"). **When editing those two files, preserve their
   existing style** — do not "modernize" them to tokens as a side effect. **Every new page/component
   uses the token system**, never the legacy hardcoded-hex pattern. Do not copy the legacy style into
   new files.
3. **Fonts are global.** Inter + Noto Sans Devanagari are loaded in `app/layout.tsx` as CSS
   variables and chained in `--font-sans`; `<html lang="hi">`. Never set font-family per element —
   Devanagari falls through automatically.

## Structure & components

- `app/` — App Router. `(dashboard)` route group gives authed routes a shared Sidebar shell with
  no URL prefix. `login/`, `page.tsx` (landing), `layout.tsx`, `globals.css`.
- `components/` — `ui/` primitives (`Button`, `Card`, `Badge`, `Text`, `Container` + `index.ts`
  barrel) consumed by feature folders `dashboard/`, `records/`, `profile/`, `landing/`, `layout/`.
- `lib/` — `constants.ts` (UPPER_SNAKE mock data, all Hindi) and `cadres.ts` (domain types +
  pure helpers like `applyFilter`, `formatDate`; **mirrored from the mobile app** so both platforms
  behave identically — keep them in sync).
- **Default to Server Components; add `"use client"` only where needed** (interactivity, hooks,
  browser APIs). Pure display pages/components stay server components.
- Function components. **Default export** for single-component files; **named exports** when a file
  exports several. Props typed with **`interface XxxProps`**; local unions use `type`; type-only
  imports use `import type`.
- **No `cn()` helper.** Compose classes manually: `[...].filter(Boolean).join(" ")` or template
  strings. Active state via `data-active={bool}` attribute selectors, not conditional class strings.
- Import alias **`@/` = project root** (tsconfig `"@/*": ["./*"]`); used for all internal imports
  (`@/components/...`, `@/lib/...`). Relative paths only inside a folder's own barrel.

## State, data, auth

- **No global store / Context.** Local `useState` / `useMemo` only; lift filter state and pass
  callbacks down as props (see `records/page.tsx`).
- **`lib/api.ts` is the one typed API client** — plain `fetch`, no React Query/axios. Every
  authenticated call goes through `apiFetch()`, which attaches the `Bearer` token and retries
  once through `POST /auth/refresh` on a 401 (single-flight, mirrors the mobile client's
  interceptor). Pages still not wired to the backend keep reading `lib/constants.ts` mock arrays.
- **Auth is real** (ADR-042 email+password, then TOTP for admin/super_admin — see `app/login/page.tsx`'s
  two-step form). Tokens live in plain (non-httpOnly) cookies — `proxy.ts` (Next 16's renamed
  `middleware.ts`) reads the access-token cookie server-side to gate every non-public route before
  the page renders. This is a real, server-enforced gate — a step up from the old sessionStorage
  flag — but the cookie is still readable by any script (no httpOnly), so it is not bank-grade
  security; per-role authorization stays the backend's job (API-enforced, never UI-only).

## Language

Hindi hardcoded in JSX and `lib/` mock data (labels, aria-labels, errors). No i18n library.
