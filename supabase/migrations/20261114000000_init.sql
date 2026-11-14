-- Tram Caroling: schema, row-level security, realtime and storage.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.districts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  name_zh text,
  description text,
  sort_order int not null default 0,
  -- Point on/near the tram line where this district's stretch begins.
  start_lat double precision not null,
  start_lng double precision not null
);
create index districts_event_idx on public.districts (event_id, sort_order);

create table public.prayer_items (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts (id) on delete cascade,
  title text not null,
  body text not null default '',
  sort_order int not null default 0
);
create index prayer_items_district_idx on public.prayer_items (district_id, sort_order);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,
  author text,
  song_key text,
  chordpro text not null default '',
  score_url text,
  sort_order int not null default 0
);
create index songs_event_idx on public.songs (event_id, sort_order);

create table public.event_state (
  event_id uuid primary key references public.events (id) on delete cascade,
  current_song_id uuid references public.songs (id) on delete set null,
  current_section text,
  district_override_id uuid references public.districts (id) on delete set null,
  announcement text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Participant' check (char_length(display_name) <= 60),
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  church text check (char_length(church) <= 80),
  socials jsonb not null default '{}'::jsonb check (jsonb_typeof(socials) = 'object'),
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.event_roles (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'participant')),
  primary key (event_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_event_admin(eid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_roles
    where event_id = eid and user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_any_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_roles where user_id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(split_part(new.email, '@', 1), ''), 'Participant'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;
alter table public.districts enable row level security;
alter table public.prayer_items enable row level security;
alter table public.songs enable row level security;
alter table public.event_state enable row level security;
alter table public.profiles enable row level security;
alter table public.event_roles enable row level security;

-- Event content (route, prayers, songs, live state) is readable by everyone so it
-- can be shown and cached before sign-in. Only event admins can change it.
create policy "events readable" on public.events for select using (true);
create policy "events admin write" on public.events for all to authenticated
  using (public.is_event_admin(id)) with check (public.is_event_admin(id));

create policy "districts readable" on public.districts for select using (true);
create policy "districts admin write" on public.districts for all to authenticated
  using (public.is_event_admin(event_id)) with check (public.is_event_admin(event_id));

create policy "prayer items readable" on public.prayer_items for select using (true);
create policy "prayer items admin write" on public.prayer_items for all to authenticated
  using (public.is_event_admin((select d.event_id from public.districts d where d.id = district_id)))
  with check (public.is_event_admin((select d.event_id from public.districts d where d.id = district_id)));

create policy "songs readable" on public.songs for select using (true);
create policy "songs admin write" on public.songs for all to authenticated
  using (public.is_event_admin(event_id)) with check (public.is_event_admin(event_id));

create policy "event state readable" on public.event_state for select using (true);
create policy "event state admin insert" on public.event_state for insert to authenticated
  with check (public.is_event_admin(event_id));
create policy "event state admin update" on public.event_state for update to authenticated
  using (public.is_event_admin(event_id)) with check (public.is_event_admin(event_id));

-- Participant list: signed-in users only, and only profiles that opted in.
create policy "profiles visible to signed-in users" on public.profiles for select to authenticated
  using (visible or id = auth.uid());
create policy "profiles insert own" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "roles readable by self or admins" on public.event_roles for select to authenticated
  using (user_id = auth.uid() or public.is_event_admin(event_id));
create policy "roles managed by admins" on public.event_roles for all to authenticated
  using (public.is_event_admin(event_id)) with check (public.is_event_admin(event_id));

-- ---------------------------------------------------------------------------
-- Realtime: broadcast changes to the live event state.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.event_state;

-- ---------------------------------------------------------------------------
-- Storage: public buckets for avatars and song scores.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('scores', 'scores', true)
on conflict (id) do nothing;

-- Avatars: each user writes only inside a folder named after their user id.
create policy "avatars insert own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Scores: admins only.
create policy "scores admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'scores' and public.is_any_admin());
create policy "scores admin update" on storage.objects for update to authenticated
  using (bucket_id = 'scores' and public.is_any_admin());
create policy "scores admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'scores' and public.is_any_admin());
