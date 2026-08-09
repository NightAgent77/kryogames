# KryoGames — Agent Handoff

> Living document for AI agent continuity. Updated automatically on file edits and substantively by agents after meaningful changes.

<!-- AUTO:LAST_UPDATED -->
**Last updated:** 2026-08-09 05:17 (auto)
<!-- /AUTO:LAST_UPDATED -->

---

## Project summary

**KryoGames** is a personal indie game studio website that hosts browser-based web games (with optional downloadable builds planned). Currently a marketing/landing page with placeholder game cards and full Supabase authentication.

| Item | Value |
|------|-------|
| **Live domain** | `https://kryogames.com` |
| **Hosting** | Vercel |
| **Auth** | Supabase (email + password) |
| **Supabase project** | `mkiychmgquaulezbebps` |

---

## Tech stack

- **Framework:** React 19 + TypeScript
- **Build tool:** Vite 8
- **Auth / backend:** Supabase (`@supabase/supabase-js`)
- **Linting:** oxlint
- **Fonts:** Orbitron (display), Inter (body) via Google Fonts
- **Deployment:** Vercel (`vercel.json` SPA rewrites)

---

## Commands

```bash
npm install          # install dependencies
npm run dev          # local dev server (NOT npx run dev)
npm run build        # production build → dist/
npm run preview      # preview production build
npm run lint         # oxlint
```

---

## Environment variables

Copy `.env.example` → `.env.local` for local dev. Set the same vars in **Vercel → Settings → Environment Variables** for production (redeploy after adding).

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_SITE_URL` | Live site URL for auth redirects (`https://kryogames.com`) |

**Local credentials** are in `.env.local` (gitignored via `*.local`).

---

## Architecture

```
src/
├── main.tsx                 # App entry, wraps AuthProvider
├── App.tsx                  # Page layout (Header + sections + Footer)
├── App.css                  # Component styles
├── index.css                # Global CSS variables & resets
├── vite-env.d.ts            # Vite env type definitions
├── components/
│   ├── Header.tsx           # Nav, auth buttons, logged-in user display
│   ├── AuthModal.tsx        # Login / signup / forgot-password modals
│   ├── Hero.tsx             # Landing hero with animated cube
│   ├── GamesSection.tsx     # Game catalog grid
│   ├── GameCard.tsx         # Individual game card
│   ├── AboutSection.tsx     # Studio about section
│   ├── DownloadsSection.tsx # Placeholder downloads panel
│   └── Footer.tsx
├── contexts/
│   └── AuthContext.tsx      # Supabase auth state & methods
├── data/
│   └── games.ts             # Placeholder game catalog data
└── lib/
    ├── supabase.ts          # Supabase client init
    └── siteUrl.ts           # Site URL helper (VITE_SITE_URL fallback)
```

---

## Features implemented

### Landing page (markup)
- Dark icy/cyber aesthetic (cyan `#3de8ff` + purple `#8b5cf6` accents)
- Sticky header with logo and anchor nav (Games, About, Downloads)
- Hero section with CTA buttons and CSS 3D cube animation
- Games grid with 3 placeholder cards (`src/data/games.ts`)
- About section with feature highlights
- Downloads placeholder section
- Footer

### Authentication (Supabase)
- **Sign up:** email, password, username → stored in `user_metadata.username`
- **Log in:** email + password via `signInWithPassword`
- **Log out:** clears session, header updates
- **Forgot password:** sends reset email, redirects to `VITE_SITE_URL`
- **Session persistence:** `onAuthStateChange` listener in `AuthContext`
- **Header states:** loading / guest (Log in + Sign up) / authenticated (username + Log out)
- **Error handling:** friendly messages for common auth errors
- **Email confirmation:** if enabled in Supabase, signup shows "check your email" message

### Deployment config
- `vercel.json` — SPA rewrite so client routes work when added later
- `VITE_SITE_URL=https://kryogames.com` for production auth redirects

### Agent handoff
- `AGENTS.md` — living handoff doc (architecture, features, env, deployment, pending work)
- `agent.md` — pointer to `AGENTS.md`
- `.cursor/rules/agent-handoff.mdc` — always-on rule: agents must update `AGENTS.md` after edits
- `.cursor/hooks.json` — auto-updates `AGENTS.md` on file edits:
  - `afterFileEdit` → refreshes **Last updated** + **Recent edits** log
  - `postToolUse` (Write/StrReplace/Delete) → reminds agent to update substantive sections

---

## Supabase dashboard config (required)

**Authentication → URL Configuration:**

| Setting | Value |
|---------|-------|
| Site URL | `https://kryogames.com` |
| Redirect URLs | `https://kryogames.com/**` |
| | `http://localhost:5173/**` |
| | `https://*.vercel.app/**` (optional, preview deploys) |

**Authentication → Providers → Email** must be enabled.

---

## Vercel deployment checklist

- [ ] Repo connected to Vercel
- [ ] Build: `npm run build`, Output: `dist`
- [ ] Env vars set (all 3 `VITE_*` vars) for Production
- [ ] Domain `kryogames.com` added in Vercel Domains
- [ ] DNS pointed to Vercel
- [ ] Redeploy after env vars added

---

## Not yet implemented

- Real games (only placeholder cards in `games.ts`)
- Game routes/pages (e.g. `/games/:id`)
- React Router
- `profiles` table in Supabase (username only in `user_metadata` for now)
- Password reset landing page (reset links go to `/` on live domain)
- Downloadable game builds
- Production deploy verification on `kryogames.com`

---

## Key conventions

- Minimize scope — focused diffs, match existing patterns
- Username display: `user_metadata.username` → fallback to email prefix
- Auth modals use native `<dialog>` element
- Game statuses: `'playable' | 'coming-soon' | 'downloadable'`
- Do **not** commit `.env.local` or service role keys

---

## Agent instructions

When making changes to this project:

1. **After every edit**, ensure this file reflects what changed (architecture, features, env, deployment, pending work).
2. Update the **Features implemented** and **Not yet implemented** sections as work progresses.
3. Update **Architecture** if files are added, removed, or reorganized.
4. Keep **Recent edits** accurate — the hook appends mechanical entries; agents should add meaningful summaries.
5. Never commit secrets. Anon key in `.env.local` is client-safe; service role key must never be added.
6. Local dev: `npm run dev` (not `npx run dev`).

---

## Recent edits (auto)

<!-- AUTO:RECENT_EDITS -->
- `2026-08-09` — Brand rename: Kyro → Kryo across UI copy, page title/meta, package name (`kryogames`), and AGENTS.md (domain was already `kryogames.com`)
- `2026-08-08 02:24` — `src/components/Header.tsx`
- `2026-08-08` — Initial agent handoff doc created (project bootstrap through Supabase auth + Vercel config)
<!-- /AUTO:RECENT_EDITS -->
