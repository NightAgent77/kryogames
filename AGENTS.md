# KryoGames — Agent Handoff

> Living document for AI agent continuity. Updated automatically on file edits and substantively by agents after meaningful changes.

<!-- AUTO:LAST_UPDATED -->
**Last updated:** 2026-08-20 15:23 (auto)
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
- **Motion:** `motion` (React Bits–style Dock springs in the library sidebar / profile menu)
- **Intro backdrop:** custom WebGL `ThinkingDots` (React Bits Pro–style density cloud; no Pro license dep)
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
    ├── snake-run.png        # Snake Run cover art
    ├── fruit-rally.jpg      # Fruit Rally cover art
    └── tut-1.png            # Tutorial Game 1 cover art
src/
├── main.tsx                 # App entry, wraps ThemeProvider + AuthProvider
├── App.tsx                  # Auth gate: loading → IntroView | LibraryView
├── App.css                  # Shared buttons + auth modal styles
├── index.css                # Global CSS variables & resets (dark + light themes)
├── vite-env.d.ts            # Vite env type definitions
├── components/
│   ├── IntroView.tsx        # Signed-out signup landing (Thinking Dots backdrop)
│   ├── IntroView.css
│   ├── ThinkingDots.tsx     # Intro dot-matrix density cloud (WebGL)
│   ├── ThinkingDots.css
│   ├── AuthModal.tsx        # Login / signup / forgot-password modals
│   └── library/
│       ├── LibraryView.tsx  # Signed-in shell (sidebar + main)
│       ├── LibraryView.css
│       ├── LibrarySidebar.tsx
│       ├── Dock.tsx         # Vertical React Bits Dock (proximity springs)
│       ├── Dock.css
│       ├── LibraryTopBar.tsx
│       ├── LibraryGameGrid.tsx
│       ├── PlatformIcon.tsx # Web / Android / Windows / Mac / iOS icons
│       ├── GameDetail.tsx   # Expanded game view (blurred cover wash + desc + Play)
│       ├── FavoriteGemButton.tsx # Facet-diamond favorite toggle (animates red)
│       ├── FriendsView.tsx  # Friends search, requests, list
│       ├── FriendToasts.tsx # Friend request / accept popups (under profile)
│       ├── ActivityHeatmap.tsx # Monthly play-hours calendar heatmap
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
│   ├── playedGames.ts       # Distinct games played (Supabase + local migrate)
│   ├── playActivity.ts      # Daily play minutes (Supabase + session flush)
│   ├── friends.ts           # Profiles search + friendships helpers
│   ├── notificationSound.ts # Web Audio chime for friend toasts
│   └── userDisplay.ts       # Display name / initials / avatar helpers
└── supabase/
    ├── friends.sql          # profiles + friendships schema/RLS (run in SQL editor)
    ├── friends-realtime.sql # additive: enable Realtime on friendships (if friends.sql already ran)
    ├── play-stats.sql       # played_games + play_activity schema/RLS (run in SQL editor)
    └── backfill-profiles.sql # one-time: seed profiles + Auth display names for existing users
```

---

## Features implemented

### Dual auth views
- **Signed out (`IntroView`):** minimalist brand landing — KRYO GAMES, short lead, Sign up / Log in, placeholder tile teaser; full-bleed **Thinking Dots** WebGL backdrop (dense `#ff44af` grid + drifting density cloud; small-radius cursor highlight; pauses on `prefers-reduced-motion`); frosted hero / header chrome so type stays readable over the dots; header **theme toggle** (sun/moon) beside Log in / Sign up
- **Signed in (`LibraryView`):** library shell matching design mockup — sidebar, search, profile pill, game grid; shell is viewport-locked so only `.library-main` scrolls — desktop sidebar pill stays fully visible (narrow screens still use the existing collapse/hover drawer)
- **`App.tsx` gate:** `loading` → placeholder; `user` → library; else → intro (no React Router yet)

### Design system
- Slate template with **dark** (default) and **light** themes via `data-theme` on `<html>`
- Dark: near-black `#121212`, surfaces `#2a2d37`, active `#334756`
- Light: cool gray `#eef0f3` page, white surfaces, dark text `#12141a`
- Theme tokens live in `index.css`; preference persisted in `localStorage` (`kryogames-theme`)
- Rounded panels (~12px); Inter only (no Orbitron / neon cyber look)
- Auth modal restyled to the same surfaces
- Sign up / Log in / forgot modals use frosted glass panels (translucent fill + blur) in both light and dark; inputs match

### Library (signed-in)
- Sidebar: **Home** (web catalog) + **Game library** (nested **My Games**, **Favorites**) + **Friends**
- Sidebar nav uses a **vertical Dock** adaptation (`Dock.tsx` + `motion`): mouse-Y proximity springs grow row height; hover tooltips sit to the right of the pill; sliding active indicator and Game library submenu unchanged; theme tokens + game-wash frost (no dark `#120F17` dock chrome); `prefers-reduced-motion` disables springs
- Profile dropdown (View profile / Appearance / Settings / Log out + theme radios) uses the same Dock springs inside the existing panel (`dock-panel--menu`); no side tooltips (labels already visible); wash frost styles target dock rows
- Search filters current tab by title (client-side) on Home / Favorites
- Home tab lists `platform: 'web'` titles from `games.ts`
- My Games: empty placeholder for now
- **Friends:** top-bar search switches to “Search usernames” (games search hidden); send friend requests, accept/decline incoming (section only when pending); **Online** / **All** filter tabs (presence not wired — Online empty for now); remove from All; data in Supabase `profiles` + `friendships` (see `supabase/friends.sql`). **Toasts** (`FriendToasts`) appear upper-right under the profile pill on every library view: incoming request (Accept / Decline) and “accepted your friend request”; auto-dismiss after 6s with a short Web Audio chime; Supabase Realtime plus an 8s poll fallback
- Each game card has a bottom meta bar: title + platform icon (`PlatformIcon`)
- Clicking a game card expands to **GameDetail** (cover, description, tags, Play / Coming soon, favorite gem)
- GameDetail **art wash (locked, both themes):** full-library `.library-wash` blurred cover behind the sidebar pill **and** search / profile / nav; sharp cover in the media slot; light-on-dark type (white title/description/tags/Back; white Play with dark label). Frost widgets: light = white glass; dark = deeper bluish glass (`--wash-frost*`). Light theme uses almost no veil so cover color still reads — never dark ink or a milky white overlay on the wash. Leaving GameDetail **fades the wash and widget colors** (~420ms) instead of a hard cut.
- **Favorites:** facet-diamond gem beside Play on GameDetail; toggle persists per signed-in user in `localStorage` (`kryogames-favorites:<userId>`); Favorites sidebar tab lists favorited games (search works); empty state when none. On wash: white glass outline → red + pop/burst when favorited, soft spin-out when removed.
- Mobile / narrow: small hamburger stays visible; hovering it reveals the floating nav pill (hides on leave); tap still pins it open on touch
- Profile pill: initials or uploaded avatar + username; dropdown with View profile, Appearance → Dark/Light, Settings (placeholder), Log out
- Profile page (`ProfileView`): gamer-style banner header aligned with the sidebar pill top — cover art fills the whole card; avatar, username, and About me overlay the bottom of the art (light-on-dark); frosted profile pill overlays the banner top-right (no Back, search hidden). Stats bar under banner: long horizontal surface holding compact sub-chips (**Friends**, **Games played**) with cyan numbers. Below that: **Activity heatmap** (`ActivityHeatmap`) — month calendar of daily play hours with blue intensity (0h / >2h / >4h / >8h), month picker. **Edit profile** switches into edit mode (live banner/avatar preview + form); **Apply changes** saves via `updateUser` (`avatar`, `banner`, `bio`, `username`) and returns to view mode; Cancel discards the draft
- **Games played tracker:** Supabase `played_games` (distinct `game_id` per user); recorded when Play is clicked; one-time migrate from legacy `localStorage` (`kryogames-played:<userId>`)
- **Play activity tracker:** Supabase `play_activity` (minutes per day) via `add_play_minutes` RPC; Play starts a `sessionStorage` timer, minutes flush when returning to the tab (capped); one-time migrate from legacy `localStorage` (`kryogames-play-activity:<userId>`)
- Run [`supabase/play-stats.sql`](supabase/play-stats.sql) once in the Supabase SQL editor (after `friends.sql`) so Games played + heatmap persist across devices

### Games catalog
- **Snake Run** (`snake-run`) — Web, `status: playable`, Cloudflare R2: `https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/snake-run/index.html`
- **Fruit Rally** (`fruit-rally`) — comic-book arcade racer; Web, `status: playable`, Cloudflare R2: `https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/fruit-rally/index.html`
- **Tutorial Game 1** (`tut-1`) — q5play platformer; Web, `status: playable`, Cloudflare R2: `https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/tut-1/index.html`
- Cover art: `public/games/tut-1.png` — 874×575 geometric title card (red player, grey steps, gold finish) matching Fruit Rally’s ratio
- Cover art: `public/games/fruit-rally.jpg` — comic hero cropped to 874×575 (`874 / 575` ≈ Snake Run's 1.52) so the card matches Snake Run's shape; source screenshot's white side bars are cropped off, art bleeds edge to edge. Full parity with Snake Run (grid cover, GameDetail media slot, blurred wash, light + dark chrome)
- Grid cards use `align-items: start` so each card keeps its cover's native height — mixed cover ratios must never be stretched (bands black space above the meta bar) or cropped
- Cover art: `public/games/snake-run.png` (magenta title hero) via optional `coverImage` + `coverAspectRatio` — grid cards size to the image’s native ratio; GameDetail media slot matches so art scales bigger/smaller with no crop and no letterbox bars
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
- Run [`supabase/friends-realtime.sql`](supabase/friends-realtime.sql) once if `friends.sql` was applied before Realtime was added (new installs get it from `friends.sql`)
- Run [`supabase/backfill-profiles.sql`](supabase/backfill-profiles.sql) once so existing users appear in username search (and Auth Display name is filled from username)
- Friend search uses `public.profiles`, not the Auth Users list; Auth “Display name” is `full_name` / `name` metadata (synced from username on signup/profile edit)
- Friend toasts need `friendships` in the `supabase_realtime` publication (Dashboard → Database → Publications, or the SQL above)

### Supabase SQL (play stats)
- Run [`supabase/play-stats.sql`](supabase/play-stats.sql) once after friends schema exists
- Tables: `played_games` (user_id + game_id), `play_activity` (user_id + day + minutes)
- RLS: any authenticated user can **read** (future public profiles / friends); only the owner can write
- RPC: `add_play_minutes(p_day, p_minutes)` atomically increments the signed-in user’s day

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
- Additional games beyond Snake Run, Fruit Rally, and Tutorial Game 1
- Game routes/pages (e.g. `/games/:id`) / React Router
- Favorites sync across devices (currently localStorage only)
- Played-games list UI (count + tracker exist in Supabase)
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
- Games played: Supabase `played_games` via `lib/playedGames.ts`; recorded on Play click
- Play activity: Supabase `play_activity` via `lib/playActivity.ts`; heatmap on profile; requires `supabase/play-stats.sql`
- Friends: `lib/friends.ts` + `FriendsView` + `FriendToasts`; requires `supabase/friends.sql` applied (and `friends-realtime.sql` if that schema was already live)
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
- `2026-08-20 15:23` — `src/App.css`
- `2026-08-20 15:16` — `src/components/ThinkingDots.tsx`
- `2026-08-20 15:15` — `src/components/ThinkingDots.tsx`
- `2026-08-20 15:08` — `src/components/IntroView.css`
- `2026-08-20 15:07` — `src/components/IntroView.css`
- `2026-08-20 15:04` — `src/components/IntroView.css`
- `2026-08-20 15:03` — `src/components/IntroView.css`
- `2026-08-20 15:02` — `src/components/IntroView.css`
- `2026-08-20 15:01` — `src/components/IntroView.css`
- `2026-08-20 15:00` — `src/components/IntroView.css`
- `2026-08-20 14:59` — `src/components/IntroView.css`
- `2026-08-20 14:58` — `src/components/IntroView.css`
- `2026-08-20 14:56` — `src/components/IntroView.css`
- `2026-08-20 14:53` — `src/components/ThinkingDots.tsx`
- `2026-08-20 14:51` — `src/components/ThinkingDots.tsx`
- `2026-08-20 14:48` — `src/components/IntroView.tsx`
- `2026-08-20 14:45` — `../../../../../../Users/elmopr77/.cursor/projects/Volumes-REDDRIVE-App-Portfolio-Development-Builds-Personal-website-portfolio-KryoGames/agent-tools/4ee79a12-031c-4e18-ab44-7e37d310af5a.txt`
- `2026-08-20 14:45` — `../../../../../../Users/elmopr77/.cursor/projects/Volumes-REDDRIVE-App-Portfolio-Development-Builds-Personal-website-portfolio-KryoGames/agent-tools/105900c9-e236-4232-9443-c8cce55e1af0.txt`
- `2026-08-20 14:45` — `../../../../../../Users/elmopr77/.cursor/projects/Volumes-REDDRIVE-App-Portfolio-Development-Builds-Personal-website-portfolio-KryoGames/agent-tools/01110b17-4f03-480c-900a-fc6354e1160f.txt`
- `2026-08-20 14:45` — `../../../../../../Users/elmopr77/.cursor/projects/Volumes-REDDRIVE-App-Portfolio-Development-Builds-Personal-website-portfolio-KryoGames/agent-tools/dfafa39b-dd77-4141-8a5d-d18f7ebbfe8b.txt`
- `2026-08-19 16:09` — `src/components/library/FriendToasts.tsx`
- `2026-08-19 16:09` — `src/lib/notificationSound.ts`
- `2026-08-19 16:02` — `src/components/library/LibraryView.css`
- `2026-08-19 16:02` — `src/components/library/LibraryView.tsx`
- `2026-08-19 16:01` — `src/components/library/FriendToasts.tsx`
- `2026-08-19 16:00` — `supabase/friends.sql`
- `2026-08-19 16:00` — `supabase/friends-realtime.sql`
- `2026-08-19 16:00` — `src/components/library/LibraryView.css`
- `2026-08-19 15:59` — `src/components/library/LibraryView.css`
- `2026-08-19 15:59` — `src/components/library/ProfileView.tsx`
<!-- /AUTO:RECENT_EDITS -->
-->
