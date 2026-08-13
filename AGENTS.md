# KryoGames — Agent Handoff

> Living document for AI agent continuity. Updated automatically on file edits and substantively by agents after meaningful changes.

<!-- AUTO:LAST_UPDATED -->
**Last updated:** 2026-08-13 17:32 (auto)
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
│       ├── GameDetail.tsx   # Expanded game view (blurred cover wash + desc + Play)
│       ├── FavoriteGemButton.tsx # Facet-diamond favorite toggle (animates red)
│       ├── FriendsView.tsx  # Friends search, requests, list
│       └── ProfileView.tsx  # Profile template (avatar + username)
├── contexts/
│   ├── AuthContext.tsx      # Supabase auth state & methods
│   └── ThemeContext.tsx     # Dark / light theme (localStorage `kryogames-theme`)
├── data/
│   └── games.ts             # Catalog (platform, playUrl, coverImage)
├── lib/
│   ├── supabase.ts          # Supabase client init
│   ├── siteUrl.ts           # Site URL helper (VITE_SITE_URL fallback)
│   ├── favorites.ts         # Per-user favorite game IDs (localStorage)
│   ├── friends.ts           # Profiles search + friendships helpers
│   └── userDisplay.ts       # Display name / initials / avatar helpers
└── supabase/
    └── friends.sql          # profiles + friendships schema/RLS (run in SQL editor)
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
- Sidebar: **Games** + **Favorites** + **Friends** (Android / platform submenu removed for now — web only)
- Search filters current tab by title (client-side) on Games / Favorites
- Games tab lists `platform: 'web'` titles from `games.ts`
- **Friends:** top-bar search switches to “Search usernames” (games search hidden); send friend requests, accept/decline incoming, friends list + remove; data in Supabase `profiles` + `friendships` (see `supabase/friends.sql`)
- Each game card has a bottom meta bar: title + platform icon (`PlatformIcon`)
- Clicking a game card expands to **GameDetail** (cover, description, tags, Play / Coming soon, favorite gem)
- GameDetail **art wash (locked, both themes):** full-library `.library-wash` blurred cover behind the sidebar pill **and** search / profile / nav; sharp cover in the media slot; light-on-dark type (white title/description/tags/Back; white Play with dark label). Frost widgets: light = white glass; dark = deeper bluish glass (`--wash-frost*`). Light theme uses almost no veil so cover color still reads — never dark ink or a milky white overlay on the wash. Leaving GameDetail **fades the wash and widget colors** (~420ms) instead of a hard cut.
- **Favorites:** facet-diamond gem beside Play on GameDetail; toggle persists per signed-in user in `localStorage` (`kryogames-favorites:<userId>`); Favorites sidebar tab lists favorited games (search works); empty state when none. On wash: white glass outline → red + pop/burst when favorited, soft spin-out when removed.
- Mobile / narrow: small hamburger stays visible; hovering it reveals the floating nav pill (hides on leave); tap still pins it open on touch
- Profile pill: initials or uploaded avatar + username; dropdown with View profile, Appearance → Dark/Light, Settings (placeholder), Log out
- Profile page (`ProfileView`): change photo (compressed into `user_metadata.avatar`) and username via Supabase `updateUser`; top-bar game search hidden while open; content sits higher under a compact top bar

### Games catalog
- **Snake Run** (`snake-run`) — sole catalog title for now; Web, `status: playable`, Cloudflare R2: `https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/snake-run/index.html`
- Cover art: `public/games/snake-run.png` via optional `coverImage` (CSS `object-fit: cover` on grid card + detail)
- Optional `playUrl` on `Game` opens in a new tab from the Play button
- No filler/empty placeholder cards in the library grid

### Authentication (Supabase)
- **Sign up:** email, password, username → stored in `user_metadata.username` (+ trigger/`upsertProfileFromUser` into `profiles` when session exists)
- **Profile edits:** username + avatar via `updateUser` (`user_metadata`; avatar is a compressed data URL for now) and synced to `profiles`
- **Log in:** email + password via `signInWithPassword`
- **Log out:** clears session → returns to intro
- **Forgot password:** sends reset email, redirects to `VITE_SITE_URL`
- **Session persistence:** `onAuthStateChange` listener in `AuthContext`
- **Error handling:** friendly messages for common auth errors
- **Email confirmation:** if enabled in Supabase, signup shows "check your email" message
- **Profiles / friends:** searchable `profiles` + `friendships` tables (RLS); library mount bootstraps current user into `profiles` for existing accounts

### Supabase SQL (friends)
- Run [`supabase/friends.sql`](supabase/friends.sql) once in the Supabase SQL editor before using Friends

### Deployment config
- `vercel.json` — SPA rewrite so client routes work when added later
- `VITE_SITE_URL=https://kryogames.com` for production auth redirects

### Agent handoff
- `AGENTS.md` — living handoff doc (architecture, features, env, deployment, pending work)
- `agent.md` — pointer to `AGENTS.md`
- `.cursor/rules/agent-handoff.mdc` — always-on rule: agents must update `AGENTS.md` after edits
- `.cursor/rules/game-detail-wash.mdc` — locked GameDetail art-wash look (both themes)
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
- Favorites sync across devices (currently localStorage only)
- Settings panel (profile menu item is a placeholder)
- Supabase Storage for avatars (currently compressed data URL in `user_metadata` + `profiles.avatar`)
- Friend activity / chat / game invites
- Password reset landing page (reset links go to `/` on live domain)
- Downloadable game builds
- Production deploy verification on `kryogames.com`

---

## Key conventions

- Minimize scope — focused diffs, match existing patterns
- Username display: `user_metadata.username` → fallback to email prefix; searchable copy lives in `profiles`
- Auth modals use native `<dialog>` element
- Game statuses: `'playable' | 'coming-soon' | 'downloadable'`
- Game platforms: `'web' | 'android' | 'windows' | 'mac' | 'ios'` (library UI is web-only for now; Android tab hidden)
- Game cards show a bottom meta bar: title + platform icon
- **GameDetail wash (locked):** full-library blurred cover; light-on-dark type in both themes. Frost: light = white glass; dark = bluish glass. White Play button. No dark text or milky overlay on the wash. Favorite gem on wash stays white when off and red when on.
- Favorites: per-user `localStorage` via `lib/favorites.ts`; UI toggle is `FavoriteGemButton`
- Friends: `lib/friends.ts` + `FriendsView`; requires `supabase/friends.sql` applied
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
- `2026-08-13 17:32` — `src/components/library/LibraryView.css`
- `2026-08-13 17:31` — `src/components/library/LibraryView.css`
- `2026-08-13 17:31` — `src/components/library/LibraryView.tsx`
- `2026-08-13 17:31` — `src/components/library/LibraryTopBar.tsx`
- `2026-08-13 17:28` — `src/components/library/LibraryView.css`
- `2026-08-13 17:28` — `src/components/library/FriendsView.tsx`
- `2026-08-13 17:28` — `src/components/library/LibraryView.tsx`
- `2026-08-13 17:28` — `src/components/library/LibraryTopBar.tsx`
- `2026-08-13 17:24` — `src/lib/friends.ts`
- `2026-08-13 17:24` — `src/components/library/FriendsView.tsx`
- `2026-08-13 17:24` — `src/components/library/LibraryView.css`
- `2026-08-13 17:23` — `src/components/library/FriendsView.tsx`
- `2026-08-13 17:23` — `src/components/library/LibraryView.tsx`
- `2026-08-13 17:23` — `src/components/library/LibraryGameGrid.tsx`
- `2026-08-13 17:23` — `src/components/library/LibrarySidebar.tsx`
- `2026-08-13 17:23` — `src/contexts/AuthContext.tsx`
- `2026-08-13 17:23` — `src/lib/friends.ts`
- `2026-08-13 17:22` — `supabase/friends.sql`
- `2026-08-13 17:15` — `src/components/library/LibraryView.css`
- `2026-08-13 17:14` — `src/components/library/LibraryView.css`
- `2026-08-13 17:13` — `src/components/library/LibraryGameGrid.tsx`
- `2026-08-13 17:13` — `src/components/library/LibrarySidebar.tsx`
- `2026-08-13 17:11` — `src/components/library/LibraryView.css`
- `2026-08-13 17:06` — `src/components/library/LibraryView.css`
- `2026-08-13 17:04` — `src/components/library/LibraryView.css`
- `2026-08-13 17:03` — `src/components/library/LibraryView.css`
- `2026-08-13 17:03` — `.cursor/rules/game-detail-wash.mdc`
- `2026-08-13 16:59` — `.cursor/rules/game-detail-wash.mdc`
- `2026-08-13 16:59` — `src/components/library/LibraryView.css`
- `2026-08-13 16:59` — `src/components/library/LibraryView.tsx`
<!-- /AUTO:RECENT_EDITS -->
-->
