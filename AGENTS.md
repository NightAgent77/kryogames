# KryoGames — Agent Handoff

> Living document for AI agent continuity. Updated automatically on file edits and substantively by agents after meaningful changes.

<!-- AUTO:LAST_UPDATED -->
**Last updated:** 2026-08-23 20:04 (auto)
<!-- /AUTO:LAST_UPDATED -->

---

## Project summary

**KryoGames** is a personal indie game studio website that hosts browser-based web games (with optional downloadable builds planned). The site is split into three routes: a public home (`/`), dedicated sign-up / log-in pages, and the signed-in app at `/play` (library dashboard), with full Supabase authentication.

| Item | Value |
|------|-------|
| **Live domain** | `https://kryogames.com` |
| **Hosting** | Vercel |
| **Auth** | Supabase (email + password) |
| **Supabase project** | `mkiychmgquaulezbebps` |

---

## Tech stack

- **Framework:** React 19 + TypeScript
- **Build tool:** Vite 8 (custom `preserveBackdropFilter` plugin — LightningCSS would otherwise drop unprefixed `backdrop-filter` and kill intro/auth frost on the live site)
- **Auth / backend:** Supabase (`@supabase/supabase-js`)
- **Routing:** `react-router-dom` (`/` home, `/login` `/signup` `/forgot`, `/play`)
- **Motion:** `motion` (React Bits–style Dock springs in the library sidebar / profile menu)
- **Public backdrop:** custom WebGL `ThinkingDots` on `/` and `/login` (same magenta dot grid; frames copy onto a 2D canvas so frost can sample them)
- **Home scroll:** custom `ScrollStack` (React Bits Pro–style pinned cards that stack / turn / dissolve; no Pro license dep)
- **Legacy helix backdrop:** custom WebGL `WarpTwister` still in repo, not mounted
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
    ├── tut-1.png            # Tutorial Game 1 cover art
    └── tut-2.png            # Tutorial Game 2 cover art
src/
├── main.tsx                 # App entry: BrowserRouter + ThemeProvider + AuthProvider
├── App.tsx                  # Routes + site-wide KryoCursor
├── App.css                  # Shared buttons + auth panel styles
├── index.css                # Global CSS variables & resets (dark + light themes)
├── vite-env.d.ts            # Vite env type definitions
├── components/
│   ├── KryoCursor.tsx       # Site-wide ice-shard pointer
│   ├── KryoCursor.css
│   ├── HomeView.tsx         # Public home — Thinking Dots + hero + Scroll Stack
│   ├── HomeView.css
│   ├── ScrollStack.tsx      # Pinned description cards that stack on scroll
│   ├── ScrollStack.css
│   ├── WarpTwister.tsx      # Unused helix / warp tube WebGL backdrop
│   ├── WarpTwister.css
│   ├── PublicHeader.tsx     # Home header (Home link; Enter library when signed in)
│   ├── PublicHeader.css
│   ├── AuthPage.tsx         # Unused helix auth page (IntroView is the live auth landing)
│   ├── AuthPage.css
│   ├── AuthForm.tsx         # Shared auth form used by AuthModal
│   ├── AuthModal.tsx        # Login / signup / forgot dialog on IntroView
│   ├── IntroView.tsx        # Auth landing — Thinking Dots + frost hero + AuthModal
│   ├── IntroView.css
│   ├── ThinkingDots.tsx     # Intro dot-matrix density cloud (WebGL)
│   ├── ThinkingDots.css
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
│       ├── FriendsView.tsx  # Friends search, requests, Online / Offline lists
│       ├── FriendToasts.tsx # Friend request / accept / came-online popups (under profile)
│       ├── NotificationBell.tsx # Inbox bell beside the profile pill
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
│   ├── presence.ts          # Supabase Realtime presence (who is signed in)
│   ├── notices.ts           # Session inbox + grouped online-friend greet
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

### Three-route site
- **`/` Home (`HomeView`):** GLAIST-style hero over the same **Thinking Dots** grid as `/login` (fixed full-bleed). Title + Get started sit high on first paint (not bottom-locked). No side lead / star marks, theme toggle, or game widgets. **Get started** → `/login`. Below the hero, a **Scroll Stack** of frost modal cards (Studio / Play / Library / Friends / Kryo Play): each card slides up from below over its own scroll window, then peeks/scales/blurs behind as the next takes over. Signed-in header CTA is **Enter library** → `/play`. Dots pause on `prefers-reduced-motion`; stack falls back to a static list
- **`/login` `/signup` `/forgot` (`IntroView`):** Thinking Dots WebGL, frost hero with center Sign up / Log in (`AuthModal`), teaser tiles. Header is **Home** only — links back to `/`. No theme toggle or header Log in / Sign up. Signed-in visitors redirect to `/play`
- **`/play` (`LibraryView`):** signed-in Kryo Play app — library shell matching design mockup — sidebar, search, profile pill, game grid; shell is viewport-locked so only `.library-main` scrolls — desktop sidebar pill stays fully visible (narrow screens still use the existing collapse/hover drawer). Unauthenticated `/play` redirects to `/login`. Log out returns to `/`
- **`App.tsx`:** React Router routes above; `RequireAuth` wraps `/play`; loading placeholder while the session resolves
- **`AuthPage`:** leftover helix-styled auth page; not mounted (IntroView is the live auth landing)

### Design system
- Slate template with **dark** (default) and **light** themes via `data-theme` on `<html>`
- Dark: near-black `#121212`, surfaces `#2a2d37`, active `#334756`
- Light: cool gray `#eef0f3` page, white surfaces, dark text `#12141a`
- Theme tokens live in `index.css`; preference persisted in `localStorage` (`kryogames-theme`)
- Rounded panels (~12px); Inter only (no Orbitron / neon cyber look)
- Auth modal restyled to the same surfaces; browser saved-login autofill uses the same slate fill/text as the fields (no default harsh green)
- Sign up / Log in / forgot `<dialog>` panels use frosted glass (`backdrop-filter` on `.auth-modal-shell` plus dim `::backdrop`) in light and dark, matching the intro title widget
- **KryoCursor** (site-wide, `App.tsx`): custom ice-shard pointer that tracks the mouse 1:1 (no name tag). Aims fully in the move direction (down looks down, etc.), then eases back to an upward-diagonal rest. Yellow facet in dark (`#ffd23a`); black in light. Native cursor hidden on fine pointers; restored over text fields; skipped on touch. Portals into an open `dialog:modal` (Log in / Sign up) so it paints above the top-layer popup. Not the React Bits Pro User Cursor package.

### Library (signed-in)
- Sidebar: **Home** (web catalog) + **Game library** (nested **My Games**, **Favorites**) + **Friends**
- Sidebar nav uses a **vertical Dock** adaptation (`Dock.tsx` + `motion`): mouse-Y proximity springs grow row height; hover tooltips sit to the right of the pill; sliding active indicator and Game library submenu unchanged; theme tokens + game-wash frost (no dark `#120F17` dock chrome); `prefers-reduced-motion` disables springs
- Profile dropdown (View profile / Appearance / Settings / Log out + theme radios) uses the same Dock springs inside the existing panel (`dock-panel--menu`); no side tooltips (labels already visible); wash frost styles target dock rows
- Search filters current tab by title (client-side) on Home / Favorites; Friends uses the same top search for usernames. The library search input is marked non-auth (`data-1p-ignore` / `autocomplete=off`) so password managers don’t treat tab switches as login prompts
- Home tab lists `platform: 'web'` titles from `games.ts`
- My Games: empty placeholder for now
- **Friends:** top-bar search switches to “Search usernames” (games search hidden); send friend requests, accept/decline incoming (section only when pending); **Online** section only when someone is present (neon green status dot on the Online header + live presence via Supabase Realtime `lib/presence.ts`), then **Offline** for everyone else; each friend row uses a ⋮ menu with **Invite to** (placeholder) and **Remove**; data in Supabase `profiles` + `friendships` (see `supabase/friends.sql`). **Presence** starts when the library mounts for a signed-in user and clears on logout / leave. **Toasts** (`FriendToasts`) appear upper-right under the profile pill: incoming request (Accept / Decline), “accepted your friend request”, and online-now. Fresh sign-in waits ~1.6s, then one **grouped** “A, B and N others are online” toast (not one per friend); later joins debounce ~480ms into the same grouped toast. Pending requests land in the inbox after that greet (no burst of request toasts). Auto-dismiss after 6s with a short Web Audio chime; Supabase Realtime plus an 8s poll fallback. **Notification bell** (`NotificationBell`) sits beside the profile pill — unread badge + dropdown of friend requests and other notices (`lib/notices.ts`, `sessionStorage` `kryogames-notices:<userId>`); Accept / Decline from the inbox. Opening the panel marks items read. Logout clears the session greet so the next sign-in greets again.
- Each game card has a bottom meta bar: title + platform icon (`PlatformIcon`)
- Clicking a game card expands to **GameDetail** (cover, description, tags, Play / Coming soon, favorite gem)
- GameDetail **art wash (locked, both themes):** full-library `.library-wash` blurred cover behind the sidebar pill **and** search / profile / nav; sharp cover in the media slot; light-on-dark type (white title/description/tags/Back; white Play with dark label). Frost widgets: light = white glass; dark = deeper bluish glass (`--wash-frost*`). Light theme uses almost no veil so cover color still reads — never dark ink or a milky white overlay on the wash. Leaving GameDetail **fades the wash and widget colors** (~420ms) instead of a hard cut.
- **Favorites:** facet-diamond gem beside Play on GameDetail; toggle persists per signed-in user in `localStorage` (`kryogames-favorites:<userId>`); Favorites sidebar tab lists favorited games (search works); empty state when none. On wash: white glass outline → red + pop/burst when favorited, soft spin-out when removed.
- Mobile / narrow: small hamburger stays visible; hovering it reveals the floating nav pill (hides on leave); tap still pins it open on touch
- Profile pill: initials or uploaded avatar + username; dropdown with View profile, Appearance → Dark/Light, Settings (placeholder), Log out. Notification bell sits immediately to the left of the pill (frost + white type on GameDetail / profile wash).
- Profile page (`ProfileView`): gamer-style banner header aligned with the sidebar pill top — cover art fills the whole card; avatar, username, and About me overlay the bottom of the art (light-on-dark); frosted profile pill overlays the banner top-right (no Back, search hidden). Stats bar under banner: long horizontal surface holding compact sub-chips (**Friends**, **Games played**) with cyan numbers. Below that: **Activity heatmap** (`ActivityHeatmap`) — month calendar of daily play hours with blue intensity (0h / >2h / >4h / >8h), month picker. **Edit profile** switches into edit mode (live banner/avatar preview + form); **Apply changes** saves via `updateUser` (`avatar`, `banner`, `bio`, `username`) and returns to view mode; Cancel discards the draft
- **Games played tracker:** Supabase `played_games` (distinct `game_id` per user); recorded when Play is clicked; one-time migrate from legacy `localStorage` (`kryogames-played:<userId>`)
- **Play activity tracker:** Supabase `play_activity` (minutes per day) via `add_play_minutes` RPC; Play starts a `sessionStorage` timer, minutes flush when returning to the tab (capped); one-time migrate from legacy `localStorage` (`kryogames-play-activity:<userId>`)
- Run [`supabase/play-stats.sql`](supabase/play-stats.sql) once in the Supabase SQL editor (after `friends.sql`) so Games played + heatmap persist across devices

### Games catalog
- **Snake Run** (`snake-run`) — Web, `status: playable`, Cloudflare R2: `https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/snake-run/index.html`
- **Fruit Rally** (`fruit-rally`) — comic-book arcade racer; Web, `status: playable`, Cloudflare R2: `https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/fruit-rally/index.html`
- **Tutorial Game 1** (`tut-1`) — q5play platformer; Web, `status: playable`, Cloudflare R2: `https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/tut-1/index.html`
- **Tutorial Game 2** (`tut-2`) — q5play maze (“Escape the MAZE”); Web, `status: playable`, Cloudflare R2: `https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/tut-2/index.html`
- Cover art: `public/games/tut-1.png` — 874×575 geometric title card (red player, grey steps, gold finish) matching Fruit Rally’s ratio
- Cover art: `public/games/tut-2.png` — 874×575 maze title card (blue player, red wall tiles) matching Fruit Rally’s ratio
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
- **Forgot password:** sends reset email, redirects to `VITE_SITE_URL/login`
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
- `vite.config.ts` `preserveBackdropFilter` plugin re-emits unprefixed `backdrop-filter` after LightningCSS minify so Chromium/Firefox frost works on Vercel; intro frost also copies Thinking Dots onto a 2D canvas because raw WebGL is not sampled

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
- Additional games beyond Snake Run, Fruit Rally, Tutorial Game 1, and Tutorial Game 2
- Per-game routes (e.g. `/play/games/:id`)
- Favorites sync across devices (currently localStorage only)
- Played-games list UI (count + tracker exist in Supabase)
- Settings panel (profile menu item is a placeholder)
- Supabase Storage for avatars (currently compressed data URL in `user_metadata` + `profiles.avatar`)
- Friend activity / chat / game invites
- Password reset landing page (reset links go to `/login` on live domain)
- Downloadable game builds
- Production deploy verification on `kryogames.com`

---

## Key conventions

- Minimize scope — focused diffs, match existing patterns
- Username display: `user_metadata.username` → fallback to email prefix; searchable copy lives in `profiles`
- Auth landing is `IntroView` at `/login` (same page for `/signup` `/forgot`): Thinking Dots + center Sign up / Log in + `AuthModal`; header **Home** returns to `/`
- Home header has no Log in / Sign up — only **Get started** → `/login`
- Public chrome (`PublicHeader`) is **Home** on `/` and `/login` (Enter library when signed in); no theme toggle on those pages
- Game statuses: `'playable' | 'coming-soon' | 'downloadable'`
- Game platforms: `'web' | 'android' | 'windows' | 'mac' | 'ios'` (library UI is web-only for now; Android tab hidden)
- Game cards show a bottom meta bar: title + platform icon
- **GameDetail wash (locked):** full-library blurred cover; light-on-dark type in both themes. Frost: light = white glass; dark = bluish glass. White Play button. No dark text or milky overlay on the wash. Favorite gem on wash stays white when off and red when on.
- Favorites: per-user `localStorage` via `lib/favorites.ts`; UI toggle is `FavoriteGemButton`
- Games played: Supabase `played_games` via `lib/playedGames.ts`; recorded on Play click
- Play activity: Supabase `play_activity` via `lib/playActivity.ts`; heatmap on profile; requires `supabase/play-stats.sql`
- Friends: `lib/friends.ts` + `FriendsView` + `FriendToasts` + `NotificationBell`; requires `supabase/friends.sql` applied (and `friends-realtime.sql` if that schema was already live)
- Presence / online status: `lib/presence.ts` (Supabase Realtime Presence channel `kryogames-online`); no extra SQL — friends Online/Offline + grouped “are online now” toasts use it
- Notices: `lib/notices.ts` session inbox (`kryogames-notices:<userId>`) + once-per-tab greet flag (`kryogames-online-greet:<userId>`)
- Custom pointer: `KryoCursor` mounted in `App.tsx` (home, login, play). Do not add the React Bits Pro User Cursor / shadcn package — this repo has no Tailwind or Pro license
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
- `2026-08-23 20:04` — `src/components/KryoCursor.tsx`
- `2026-08-23 20:04` — `src/components/AuthModal.tsx`
- `2026-08-23 19:56` — `src/components/AuthModal.tsx`
- `2026-08-23 19:55` — `src/components/KryoCursor.tsx`
- `2026-08-23 19:54` — `src/components/KryoCursor.tsx`
- `2026-08-23 19:54` — `src/components/AuthModal.tsx`
- `2026-08-23 19:40` — `src/components/KryoCursor.css`
- `2026-08-23 19:39` — `src/components/KryoCursor.css`
- `2026-08-23 19:38` — `src/components/KryoCursor.css`
- `2026-08-23 19:37` — `src/components/KryoCursor.css`
- `2026-08-23 19:35` — `src/components/KryoCursor.css`
- `2026-08-23 19:33` — `src/components/KryoCursor.css`
- `2026-08-23 19:32` — `src/components/KryoCursor.tsx`
- `2026-08-23 19:29` — `src/components/KryoCursor.tsx`
- `2026-08-23 19:27` — `src/components/KryoCursor.tsx`
- `2026-08-23 19:23` — `src/components/KryoCursor.css`
- `2026-08-23 19:23` — `src/components/KryoCursor.tsx`
- `2026-08-23 19:20` — `src/components/KryoCursor.css`
- `2026-08-23 19:20` — `src/App.tsx`
- `2026-08-23 19:20` — `src/components/KryoCursor.tsx`
- `2026-08-23 19:13` — `src/components/library/LibraryView.css`
- `2026-08-23 19:13` — `src/components/library/FriendsView.tsx`
- `2026-08-23 19:12` — `src/components/library/FriendsView.tsx`
- `2026-08-23 05:24` — `src/components/HomeView.css`
- `2026-08-23 05:24` — `src/components/HomeView.tsx`
- `2026-08-23 05:05` — `src/components/library/LibraryView.css`
- `2026-08-23 05:05` — `src/components/library/FriendToasts.tsx`
- `2026-08-23 05:04` — `src/components/library/FriendToasts.tsx`
- `2026-08-23 05:04` — `src/components/library/NotificationBell.tsx`
- `2026-08-23 05:04` — `src/components/library/LibraryTopBar.tsx`
<!-- /AUTO:RECENT_EDITS -->
-->
-->
