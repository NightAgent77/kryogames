# KryoGames — Agent Handoff

> Living document for AI agent continuity. Updated automatically on file edits and substantively by agents after meaningful changes.

<!-- AUTO:LAST_UPDATED -->
**Last updated:** 2026-08-13 06:34 (auto)
<!-- /AUTO:LAST_UPDATED -->

---

## Project summary

**KryoGames** is a personal indie game studio website that hosts browser-based web games (with optional downloadable builds planned). The UI splits by auth: a minimalist signed-out intro and a signed-in library dashboard (sidebar + game grid), with full Supabase authentication.

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
- **Fonts:** Inter via Google Fonts
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
public/
└── games/
    └── snake-run.png        # Snake Run cover art
src/
├── main.tsx                 # App entry, wraps ThemeProvider + AuthProvider
├── App.tsx                  # Auth gate: loading → IntroView | LibraryView
├── App.css                  # Shared buttons + auth modal styles
├── index.css                # Global CSS variables & resets (dark + light themes)
├── vite-env.d.ts            # Vite env type definitions
├── components/
│   ├── IntroView.tsx        # Signed-out minimalist landing
│   ├── IntroView.css
│   ├── AuthModal.tsx        # Login / signup / forgot-password modals
│   └── library/
│       ├── LibraryView.tsx  # Signed-in shell (sidebar + main)
│       ├── LibraryView.css
│       ├── LibrarySidebar.tsx
│       ├── LibraryTopBar.tsx
│       ├── LibraryGameGrid.tsx
│       ├── PlatformIcon.tsx # Web / Android / Windows / Mac / iOS icons
│       ├── GameDetail.tsx   # Expanded game view (desc + Play link)
│       └── ProfileView.tsx  # Profile template (avatar + username)
├── contexts/
│   ├── AuthContext.tsx      # Supabase auth state & methods
│   └── ThemeContext.tsx     # Dark / light theme (localStorage `kryogames-theme`)
├── data/
│   └── games.ts             # Catalog (platform, playUrl, coverImage)
└── lib/
    ├── supabase.ts          # Supabase client init
    ├── siteUrl.ts           # Site URL helper (VITE_SITE_URL fallback)
    └── userDisplay.ts       # Display name / initials / avatar helpers
```

---

## Features implemented

### Dual auth views
- **Signed out (`IntroView`):** minimalist brand landing — KRYO GAMES, short lead, Sign up / Log in, placeholder tile teaser
- **Signed in (`LibraryView`):** library shell matching design mockup — sidebar, search, profile pill, game grid
- **`App.tsx` gate:** `loading` → placeholder; `user` → library; else → intro (no React Router yet)

### Design system
- Slate template with **dark** (default) and **light** themes via `data-theme` on `<html>`
- Dark: near-black `#121212`, surfaces `#2a2d37`, active `#334756`
- Light: cool gray `#eef0f3` page, white surfaces, dark text `#12141a`
- Theme tokens live in `index.css`; preference persisted in `localStorage` (`kryogames-theme`)
- Rounded panels (~12px); Inter only (no Orbitron / neon cyber look)
- Auth modal restyled to the same surfaces

### Library (signed-in)
- Sidebar: **Games** → nested **Web** / **Android**, plus **Favorites**
- Search filters current tab by title (client-side)
- Web / Android filter via `game.platform` in `games.ts`
- Each game card has a bottom meta bar: title + platform icon (`PlatformIcon`)
- Clicking a game card expands to **GameDetail** (cover, description, tags, Play / Coming soon)
- Favorites: empty state only (not persisted)
- Mobile / narrow: small hamburger stays visible; hovering it reveals the floating nav pill (hides on leave); tap still pins it open on touch
- Profile pill: initials or uploaded avatar + username; dropdown with View profile, Appearance → Dark/Light, Settings (placeholder), Log out
- Profile page (`ProfileView`): change photo (compressed into `user_metadata.avatar`) and username via Supabase `updateUser`

### Games catalog
- **Snake Run** (`snake-run`) — sole catalog title for now; Web, `status: playable`, Cloudflare R2: `https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/snake-run/index.html`
- Cover art: `public/games/snake-run.png` via optional `coverImage` (CSS `object-fit: cover` on grid card + detail)
- Optional `playUrl` on `Game` opens in a new tab from the Play button
- No filler/empty placeholder cards in the library grid

### Authentication (Supabase)
- **Sign up:** email, password, username → stored in `user_metadata.username`
- **Profile edits:** username + avatar via `updateUser` (`user_metadata`; avatar is a compressed data URL for now)
- **Log in:** email + password via `signInWithPassword`
- **Log out:** clears session → returns to intro
- **Forgot password:** sends reset email, redirects to `VITE_SITE_URL`
- **Session persistence:** `onAuthStateChange` listener in `AuthContext`
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

- In-page game embed (Play currently opens hosted URL in a new tab)
- Additional games beyond Snake Run
- Game routes/pages (e.g. `/games/:id`) / React Router
- Favorites persistence (UI empty state only)
- Settings panel (profile menu item is a placeholder)
- Supabase Storage for avatars (currently compressed data URL in `user_metadata`)
- `profiles` table in Supabase (username/avatar only in `user_metadata` for now)
- Password reset landing page (reset links go to `/` on live domain)
- Downloadable game builds
- Production deploy verification on `kryogames.com`

---

## Key conventions

- Minimize scope — focused diffs, match existing patterns
- Username display: `user_metadata.username` → fallback to email prefix
- Auth modals use native `<dialog>` element
- Game statuses: `'playable' | 'coming-soon' | 'downloadable'`
- Game platforms: `'web' | 'android' | 'windows' | 'mac' | 'ios'` (library tabs currently filter Web / Android)
- Game cards show a bottom meta bar: title + platform icon
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
- `2026-08-13 06:34` — `src/components/library/LibraryView.css`
- `2026-08-13 06:32` — `src/components/library/LibraryView.css`
- `2026-08-13 06:31` — `src/components/library/LibraryView.css`
- `2026-08-13 06:30` — `src/components/library/LibraryView.css`
- `2026-08-13 06:27` — `src/index.css`
- `2026-08-13 06:26` — `src/index.css`
- `2026-08-13 06:25` — `src/index.css`
- `2026-08-13 06:24` — `src/components/library/LibraryView.css`
- `2026-08-13 06:23` — `src/components/library/LibraryView.css`
- `2026-08-13 06:23` — `src/components/library/LibraryGameGrid.tsx`
- `2026-08-13 06:23` — `src/data/games.ts`
- `2026-08-13 06:22` — `src/components/library/LibraryView.css`
- `2026-08-13 06:21` — `src/components/library/LibraryView.css`
- `2026-08-13 06:20` — `src/components/library/LibraryView.css`
- `2026-08-13 06:19` — `src/data/games.ts`
- `2026-08-13 06:19` — `src/components/library/LibraryView.css`
- `2026-08-13 06:19` — `src/components/library/LibraryGameGrid.tsx`
- `2026-08-13 06:18` — `src/components/library/PlatformIcon.tsx`
- `2026-08-13 06:18` — `src/data/games.ts`
- `2026-08-13 06:18` — `../../../../../../Users/elmopr77/.cursor/projects/Volumes-REDDRIVE-App-Portfolio-Development-Builds-Personal-website-portfolio-KryoGames/assets/Screenshot_2026-08-13_at_2.15.21_AM__2_-fbc242c5-a6fc-428a-b0d5-47fcd1cc042f.png`
- `2026-08-13 06:12` — `src/index.css`
- `2026-08-13 06:11` — `src/index.css`
- `2026-08-13 06:10` — `src/index.css`
- `2026-08-13 06:00` — `src/components/library/LibraryView.css`
- `2026-08-13 06:00` — `src/components/library/LibraryGameGrid.tsx`
- `2026-08-13 06:00` — `src/components/library/GameDetail.tsx`
- `2026-08-13 06:00` — `src/data/games.ts`
- `2026-08-13 05:59` — `../../../../../../Users/elmopr77/.cursor/projects/Volumes-REDDRIVE-App-Portfolio-Development-Builds-Personal-website-portfolio-KryoGames/assets/snake-run-2d73cd49-4eeb-4802-aac2-8bbaaa9ffbfd.png`
- `2026-08-12 19:49` — `src/components/library/LibraryView.css`
- `2026-08-12 19:48` — `src/components/library/LibraryView.tsx`
<!-- /AUTO:RECENT_EDITS -->
