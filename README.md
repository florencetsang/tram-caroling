# Tram Caroling 🚋🎄

A mobile-first PWA for a Hong Kong Island tram caroling event: participants ride a 2-hour tram loop from
the Whitty Street Tram Depot to Causeway Bay, round Happy Valley and back to Whitty Street while singing
carols and praying for each district they pass.

## Features

| Tab | What it does |
| --- | --- |
| **Route** (`/ride`) | Leaflet + OpenStreetMap map of the tram line, split into districts. Each phone uses its own GPS, snaps to the tram line and shows the **current district and its prayer items**, plus a preview of the next one. A host "district override" wins over GPS. A **Simulate** mode lets you scrub/play along the route for testing. |
| **Songs** | Song list and song pages with lyrics + chords (ChordPro), show/hide chords, transpose, adjustable text size and optional score (PDF/image). The **current song and section** chosen by the host is pinned in a live banner on every screen and highlighted in the lyrics. |
| **People** | Participant list (signed-in users only) and profile pages (gender, ideal day off, MBTI, opt-in social links). Shows your prayer partner once the session has started. |
| **Me** | Sign in with a personal **sign-in ID** (e.g. `ABCD-EFGH`, sent to each participant before the event) and profile editing: name, photo, church/group, gender, ideal day off, MBTI, bio, social accounts, visibility, plus your private prayer-partner card (conversation starter + prayer request). |
| **Admin** | Host controls (visible to admins): set current song + section, override the district for everyone, broadcast an announcement; import form responses (.xlsx/.csv) or add participants manually, copy/download sign-in IDs; pair prayer partners and **start the prayer partner session**. |

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
sample districts, carols and participants are bundled, the roster and your profile are stored in `localStorage`,
and host changes sync live between tabs of the same browser (open `/admin` in one tab and
`/songs` in another). Sign in on **Me** with one of the demo sign-in IDs shown there, and use
**Admin → Enable host mode (demo)** to try admin features.

## Supabase setup

1. Create a project at https://supabase.com (free tier is fine).
2. Apply the schema and seed data — either:
   - **Dashboard:** open *SQL Editor*, paste and run each file in
     [`supabase/migrations/`](supabase/migrations) in filename order,
     then [`supabase/seed.sql`](supabase/seed.sql); or
   - **CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push` and run
     `seed.sql` in the SQL editor (or `npx supabase db reset` against a local stack, which applies both).

   > The `…_participants.sql` migration replaces email sign-in with sign-in IDs and **resets all
   > existing profiles and host roles**.
3. **Auth → Providers → Anonymous sign-ins:** enable it. Each device signs in anonymously and is then
   linked to a participant by their sign-in ID (email sign-in is not used).
4. Copy `.env.example` to `.env.local` and fill in *Project Settings → API*:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_EVENT_ID=00000000-0000-0000-0000-000000000001
   ```
5. Hosts: copy [`supabase/hosts.example.sql`](supabase/hosts.example.sql) to `supabase/hosts.local.sql`
   (git-ignored, so names stay out of this public repo), fill in the hosts' names and run it in the SQL
   editor; it returns each host's sign-in ID. Look them up again later with
   ```sql
   select p.display_name, c.code from public.event_roles r
   join public.profiles p on p.id = r.profile_id
   join public.sign_in_codes c on c.profile_id = p.id
   where r.role = 'admin';
   ```
   To add another host: `select public.create_host('00000000-0000-0000-0000-000000000001', 'Their Name');`
   (promotes an existing participant with that name, or creates one; returns their sign-in ID).
6. Sign in on **Me** with a host's ID, open **Admin**, and upload the Google Form responses (.xlsx or .csv
   export). Each participant gets a profile pre-filled from *Your name*, *Gender*, *ideal day off*, *MBTI* and
   their prayer-partner answers, plus a unique sign-in ID to send them. Re-upload the latest file any time:
   responses already imported are skipped, and a response whose name matches a participant without form
   data (e.g. a host) fills in that profile.

### Data model

| Table | Purpose | Access (RLS) |
| --- | --- | --- |
| `events` | Event name/date | read: everyone · write: event admins |
| `districts` | Name, Chinese name, order, start point on the tram line | read: everyone · write: admins |
| `prayer_items` | Prayer items per district | read: everyone · write: admins |
| `songs` | Title, author, key, ChordPro text, score URL | read: everyone · write: admins |
| `event_state` | Live state: current song/section, district override, announcement, `prayer_partners_on` (Realtime) | read: everyone · write: admins |
| `profiles` | Participant: display name, avatar, bio, church, gender, day off, MBTI, `socials` JSON, `visible`, `form_key` (import dedupe) | read: signed-in participants (visible + own + partners) · write: own row (hosts add/remove via RPC) |
| `sign_in_codes` | One sign-in ID per participant | read: admins only |
| `profile_logins` | Which auth user (device) is signed in as which participant | read: self · write: `claim_sign_in` RPC |
| `event_roles` | `admin` / `participant` per participant per event | read: self/admins · write: admins |
| `prayer_cards` | Conversation starter + prayer request | read: owner, admins, and prayer partners while the session is on · write: owner |
| `prayer_partners` | Group number per participant (same number = partners; pairs or a trio) | read: admins; own group while the session is on · write: admins |

Storage buckets: `avatars` (users write to `<their-auth-user-id>/…`) and `scores` (admins only); both are public-read.

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
