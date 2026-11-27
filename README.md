# Tram Caroling 🚋🎄

A mobile-first PWA for a Hong Kong Island tram caroling event: participants ride a 2-hour tram loop from
the Whitty Street Tram Depot to Causeway Bay, round Happy Valley and back to Whitty Street while singing
carols and praying for each district they pass.

## Features

| Tab | What it does |
| --- | --- |
| **Route** (`/ride`) | Leaflet + OpenStreetMap map of the tram line, split into districts. Each phone uses its own GPS, snaps to the tram line and shows the **current district and its prayer items**, plus a preview of the next one. A host "district override" wins over GPS. A **Simulate** mode lets you scrub/play along the route for testing. |
| **Songs** | Song list and song pages with lyrics + chords (ChordPro), show/hide chords, transpose, adjustable text size and optional score (PDF/image). The **current song and section** chosen by the host is pinned in a live banner on every screen and highlighted in the lyrics. |
| **People** | Participant list (signed-in users only) and profile pages with opt-in social links. |
| **Me** | Passwordless sign-in (email link or one-time code) and profile editing: name, photo, church/group, bio, social accounts, visibility. |
| **Admin** | Host controls (visible to admins): set current song + section, override the district for everyone, broadcast an announcement. |

Also: dark mode, large readable text, "Keep screen on" (Screen Wake Lock), installable PWA with a
service worker for the app shell, and last-loaded songs/prayer items cached on the device for
patchy mobile reception.

**Stack:** Next.js 14 (App Router, TypeScript) · Tailwind CSS · Leaflet · Supabase (Auth, Postgres + RLS, Realtime, Storage) · Vercel.

Lyrics/chords are rendered by a small built-in ChordPro parser (`src/lib/chordpro.ts`) supporting
`{title}`, `{subtitle}`, `{key}`, `{comment}`, `{start_of_verse|chorus|bridge: Label}` / `{end_of_…}`
and inline `[Chord]` markers.

## Quick start (demo mode — no backend needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Supabase environment variables the app runs in **demo mode**:
sample districts, carols and participants are bundled, your profile is stored in `localStorage`,
and host changes sync live between tabs of the same browser (open `/admin` in one tab and
`/songs` in another). Use **Me → Host controls → Enable host mode (demo)** to try admin features.

## Supabase setup

1. Create a project at https://supabase.com (free tier is fine).
2. Apply the schema and seed data — either:
   - **Dashboard:** open *SQL Editor*, paste and run
     [`supabase/migrations/20261114000000_init.sql`](supabase/migrations/20261114000000_init.sql),
     then [`supabase/seed.sql`](supabase/seed.sql); or
   - **CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push` and run
     `seed.sql` in the SQL editor (or `npx supabase db reset` against a local stack, which applies both).
3. **Auth → Providers → Email:** keep Email enabled (magic link / OTP).
   To let people type the 6-digit code as well as tap the link, edit **Auth → Email Templates →
   Magic Link** to include `{{ .Token }}`.
4. **Auth → URL Configuration:** set *Site URL* to your deployed URL and add
   `http://localhost:3000/**` and `https://<your-app>.vercel.app/**` to *Redirect URLs*.
5. Copy `.env.example` to `.env.local` and fill in *Project Settings → API*:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_EVENT_ID=00000000-0000-0000-0000-000000000001
   ```
6. Sign in once through the app, then make yourself a host in the SQL editor:
   ```sql
   insert into public.event_roles (event_id, user_id, role)
   select '00000000-0000-0000-0000-000000000001', id, 'admin'
   from auth.users where email = 'you@example.com'
   on conflict (event_id, user_id) do update set role = 'admin';
   ```
   Reload the app — the **Admin** tab appears.

### Data model

| Table | Purpose | Access (RLS) |
| --- | --- | --- |
| `events` | Event name/date | read: everyone · write: event admins |
| `districts` | Name, Chinese name, order, start point on the tram line | read: everyone · write: admins |
| `prayer_items` | Prayer items per district | read: everyone · write: admins |
| `songs` | Title, author, key, ChordPro text, score URL | read: everyone · write: admins |
| `event_state` | Live state: current song/section, district override, announcement (Realtime) | read: everyone · write: admins |
| `profiles` | Display name, avatar, bio, church, `socials` JSON, `visible` | read: signed-in users (visible profiles + own) · write: own row |
| `event_roles` | `admin` / `participant` per user per event | read: self/admins · write: admins |

Storage buckets: `avatars` (users write to `<their-user-id>/…`) and `scores` (admins only); both are public-read.

### Editing content

For the MVP, edit districts, prayer items and songs in the Supabase **Table Editor**:

- **Prayer items:** add rows to `prayer_items` with the district's `id` and a `sort_order`.
- **Districts:** `start_lat`/`start_lng` is where the district's stretch of the line begins; the app
  snaps it to the route and a district runs until the next one starts. The route is a loop that
  passes the same streets twice, so districts are placed in `sort_order`, each at or after the
  previous one (a return-leg district can reuse an outbound street's coordinates).
- **Songs:** paste ChordPro into `chordpro`. For a score, upload a PDF/image to the `scores` bucket
  and paste its public URL into `score_url`.
- **Route geometry:** `src/data/route.ts` (approximate tram centre-line; refine if needed).

## Deploy to Vercel

1. Push this repo to GitHub and **Import** it in Vercel (framework preset: Next.js).
2. Add the three `NEXT_PUBLIC_*` environment variables (Production + Preview).
3. Deploy, then add the Vercel URL to Supabase *Auth → URL Configuration* (step 4 above).

Leave the Supabase variables unset on a Preview deployment to get a shareable demo-mode build.

## Notes & limitations

- GPS on a moving tram can be noisy; fixes more than ~400 m from the line are ignored and the
  host override is the reliable fallback. Hosts can switch back to "Automatic" at any time.
- Realtime can pause while a phone is locked; the app refetches state when it becomes visible again.
- Map tiles come from OpenStreetMap and need a connection; songs and prayer items stay available
  offline once loaded.
- Bundled carols are public-domain texts; chord arrangements are simple and original to this project.

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # TypeScript only
```
