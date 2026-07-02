# Sampark — Web

Police workflow platform for **SP Bijapur, Chhattisgarh**. Admin/desktop web app
for tracking surrendered-cadre reporting, performance analytics, and officer
records. Hindi-first UI.

Currently runs on **mock data** — no backend or environment variables required.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (CSS-first, tokens in `app/globals.css`)
- **lucide-react** icons · **Inter** + **Noto Sans Devanagari** via `next/font`

## Requirements

- **Node.js 22.x** (pinned in `.nvmrc` / `package.json` → `engines`)
- npm (repo uses `package-lock.json`)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. Demo login: `admin@bijapur.cg.gov.in` / `Admin@1234`.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Deploy to Vercel

Vercel auto-detects Next.js — no special configuration needed. This folder is its
own git repo (`Sampark-Web`), so deploy it directly.

1. **Commit & push** (the repo has no commits yet):
   ```bash
   git add .
   git commit -m "Initial Sampark web app"
   git push -u origin master
   ```
2. On **vercel.com → Add New → Project**, import the `Sampark-Web` repo.
3. Vercel detects the **Next.js** framework and `engines.node` (22.x) automatically.
   - **Root Directory**: leave as `./` (repo root).
   - **Build Command / Install Command**: defaults are correct (also pinned in
     `vercel.json`).
4. **Deploy.** No environment variables are needed today.

> If you deploy the parent `g:\Sampark` repo instead of this one, set the Vercel
> project's **Root Directory** to `Sampark Web Application`.

### Region (optional)

The app builds fully static, so assets serve from Vercel's global CDN and region
barely matters. For dynamic/SSR routes later, set the function region to **Mumbai
(`bom1`)** in Project → Settings → Functions for lowest latency in India.

## Environment variables

None required now. See [`.env.example`](./.env.example) — when the Node.js backend
lands, add `NEXT_PUBLIC_API_URL` in Vercel → Settings → Environment Variables.

## Project layout

```
app/                 App Router routes
  (dashboard)/       Authenticated shell (dashboard, records, profile, …)
  login/  page.tsx   Public landing + login
  globals.css        Design tokens + primitives (single source of truth)
components/          ui/ primitives, layout, and feature components
lib/                 Mock data (constants.ts, cadres.ts)
```
