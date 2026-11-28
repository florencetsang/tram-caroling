-- Participants sign in with a personal sign-in ID instead of email, profiles are
-- pre-populated from the registration form, and hosts pair up prayer partners.
--
-- Sign-in flow: the app signs the device in anonymously (Supabase Auth → Anonymous
-- sign-ins must be enabled), then calls claim_sign_in(code) which links that auth
-- user to the participant's profile in profile_logins. One profile can be used on
-- several devices.
--
-- This resets email-era profiles and host roles (pre-event test data). Recreate
-- hosts with: select public.create_host('<event id>', 'Your Name');

-- ---------------------------------------------------------------------------
-- Remove email-era wiring
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop policy if exists "profiles visible to signed-in users" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;

drop table if exists public.event_roles;

delete from public.profiles;
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();

-- ---------------------------------------------------------------------------
-- Participants (profiles) and sign-in
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column event_id uuid not null references public.events (id) on delete cascade,
  add column gender text check (char_length(gender) <= 40),
  add column day_off text check (char_length(day_off) <= 500),
  add column mbti text check (char_length(mbti) <= 20),
  -- Identifies the form response a profile was imported from, so re-imports skip it.
  add column form_key text,
  add constraint profiles_event_form_key unique (event_id, form_key);
create index profiles_event_idx on public.profiles (event_id, display_name);

create table public.sign_in_codes (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$')
);

create table public.profile_logins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index profile_logins_profile_idx on public.profile_logins (profile_id);

create table public.event_roles (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('admin', 'participant')),
  primary key (event_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Prayer partners
-- ---------------------------------------------------------------------------

-- Only the owner, hosts and (while the session is on) the owner's partners can read these.
create table public.prayer_cards (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  conversation_starter text check (char_length(conversation_starter) <= 1000),
  prayer_request text check (char_length(prayer_request) <= 2000),
  updated_at timestamptz not null default now()
);

-- Participants with the same group_no are prayer partners (pairs, or a trio).
create table public.prayer_partners (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  group_no int not null
);
create index prayer_partners_group_idx on public.prayer_partners (event_id, group_no);

alter table public.event_state add column prayer_partners_on boolean not null default false;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select profile_id from public.profile_logins where user_id = auth.uid();
$$;

create or replace function public.is_event_admin(eid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_roles
    where event_id = eid and profile_id = public.current_profile_id() and role = 'admin'
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
    select 1 from public.event_roles
    where profile_id = public.current_profile_id() and role = 'admin'
  );
$$;

-- Is the signed-in participant a host of the event that profile pid belongs to?
create or replace function public.is_profile_admin(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_event_admin((select event_id from public.profiles where id = pid));
$$;

create or replace function public.prayer_session_on(eid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select prayer_partners_on from public.event_state where event_id = eid), false);
$$;

-- True when pid is in the signed-in participant's prayer group and the session is on.
create or replace function public.is_my_prayer_partner(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prayer_partners me
    join public.prayer_partners them
      on them.event_id = me.event_id and them.group_no = me.group_no and them.profile_id <> me.profile_id
    join public.event_state s on s.event_id = me.event_id and s.prayer_partners_on
    where me.profile_id = public.current_profile_id() and them.profile_id = pid
  );
$$;

-- 8 characters from an alphabet without look-alikes (no I, O, 0, 1).
create or replace function public.generate_sign_in_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  -- Bytes of a v4 UUID whose low 5 bits are fully random (skips version/variant bits).
  positions constant int[] := array[0, 1, 2, 3, 4, 5, 7, 9];
  bytes bytea;
  candidate text;
  pos int;
begin
  loop
    bytes := uuid_send(gen_random_uuid());
    candidate := '';
    foreach pos in array positions loop
      candidate := candidate || substr(alphabet, 1 + (get_byte(bytes, pos) % 32), 1);
    end loop;
    exit when not exists (select 1 from public.sign_in_codes where code = candidate);
  end loop;
  return candidate;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Link the current (anonymous) auth user to the participant with this sign-in ID.
create or replace function public.claim_sign_in(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  pid uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select profile_id into pid from public.sign_in_codes where code = normalized;
  if pid is null then
    raise exception 'That sign-in ID was not recognised. Please check it and try again.';
  end if;
  insert into public.profile_logins (user_id, profile_id)
  values (auth.uid(), pid)
  on conflict (user_id) do update set profile_id = excluded.profile_id, created_at = now();
  return pid;
end;
$$;

-- Hosts add participants (form responses or manual entries). Each row:
-- { form_key, display_name, gender, day_off, mbti, conversation_starter, prayer_request }.
-- Rows whose form_key was already imported are skipped, so re-uploading the whole
-- spreadsheet only adds new responses and never overwrites participants' edits.
-- A response whose name matches a participant added without a form response (e.g. a
-- host) fills in that profile's blank fields instead of creating a duplicate.
create or replace function public.admin_import_participants(p_event uuid, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb;
  pid uuid;
  v_name text;
  v_key text;
  added int := 0;
  merged int := 0;
  skipped int := 0;
begin
  if not public.is_event_admin(p_event) then
    raise exception 'Only hosts can add participants.';
  end if;
  for r in select value from jsonb_array_elements(p_rows) loop
    v_name := left(btrim(coalesce(r ->> 'display_name', '')), 60);
    v_key := nullif(btrim(coalesce(r ->> 'form_key', '')), '');
    if v_name = '' or (v_key is not null and exists (
      select 1 from public.profiles where event_id = p_event and form_key = v_key
    )) then
      skipped := skipped + 1;
      continue;
    end if;
    pid := null;
    if v_key is not null then
      select id into pid from public.profiles
      where event_id = p_event and form_key is null and lower(display_name) = lower(v_name)
      limit 1;
    end if;
    if pid is not null then
      update public.profiles set
        form_key = v_key,
        gender = coalesce(gender, left(nullif(btrim(r ->> 'gender'), ''), 40)),
        day_off = coalesce(day_off, left(nullif(btrim(r ->> 'day_off'), ''), 500)),
        mbti = coalesce(mbti, left(nullif(btrim(r ->> 'mbti'), ''), 20))
      where id = pid;
      insert into public.prayer_cards (profile_id, conversation_starter, prayer_request)
      values (
        pid,
        left(nullif(btrim(r ->> 'conversation_starter'), ''), 1000),
        left(nullif(btrim(r ->> 'prayer_request'), ''), 2000)
      )
      on conflict (profile_id) do update set
        conversation_starter = coalesce(prayer_cards.conversation_starter, excluded.conversation_starter),
        prayer_request = coalesce(prayer_cards.prayer_request, excluded.prayer_request);
      merged := merged + 1;
      continue;
    end if;
    insert into public.profiles (event_id, display_name, gender, day_off, mbti, form_key)
    values (
      p_event,
      v_name,
      left(nullif(btrim(r ->> 'gender'), ''), 40),
      left(nullif(btrim(r ->> 'day_off'), ''), 500),
      left(nullif(btrim(r ->> 'mbti'), ''), 20),
      v_key
    )
    returning id into pid;
    insert into public.prayer_cards (profile_id, conversation_starter, prayer_request)
    values (
      pid,
      left(nullif(btrim(r ->> 'conversation_starter'), ''), 1000),
      left(nullif(btrim(r ->> 'prayer_request'), ''), 2000)
    );
    insert into public.sign_in_codes (profile_id, code) values (pid, public.generate_sign_in_code());
    added := added + 1;
  end loop;
  return jsonb_build_object('added', added, 'merged', merged, 'skipped', skipped);
end;
$$;

-- Make someone a host (run from the SQL editor); returns their sign-in ID.
-- Promotes an existing participant with the same name, otherwise creates one.
create or replace function public.create_host(p_event uuid, p_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
  v_code text;
begin
  select id into pid from public.profiles
  where event_id = p_event and lower(btrim(display_name)) = lower(btrim(p_name))
  order by form_key nulls last
  limit 1;
  if pid is null then
    insert into public.profiles (event_id, display_name) values (p_event, left(btrim(p_name), 60))
    returning id into pid;
  end if;
  insert into public.prayer_cards (profile_id) values (pid) on conflict do nothing;
  select code into v_code from public.sign_in_codes where profile_id = pid;
  if v_code is null then
    v_code := public.generate_sign_in_code();
    insert into public.sign_in_codes (profile_id, code) values (pid, v_code);
  end if;
  insert into public.event_roles (event_id, profile_id, role) values (p_event, pid, 'admin')
  on conflict (event_id, profile_id) do update set role = 'admin';
  return v_code;
end;
$$;

revoke all on function public.generate_sign_in_code() from public, anon, authenticated;
revoke all on function public.create_host(uuid, text) from public, anon, authenticated;
revoke all on function public.claim_sign_in(text) from public, anon;
revoke all on function public.admin_import_participants(uuid, jsonb) from public, anon;
grant execute on function public.claim_sign_in(text) to authenticated;
grant execute on function public.admin_import_participants(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.sign_in_codes enable row level security;
alter table public.profile_logins enable row level security;
alter table public.event_roles enable row level security;
alter table public.prayer_cards enable row level security;
alter table public.prayer_partners enable row level security;

-- Participants: readable by signed-in participants (visible ones + own); prayer partners
-- and hosts can see everyone. Participants edit only their own profile fields.
create policy "profiles readable by participants" on public.profiles for select to authenticated
  using (
    (visible and public.current_profile_id() is not null)
    or id = public.current_profile_id()
    or public.is_event_admin(event_id)
    or public.is_my_prayer_partner(id)
  );
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = public.current_profile_id()) with check (id = public.current_profile_id());
create policy "profiles admin delete" on public.profiles for delete to authenticated
  using (public.is_event_admin(event_id));

revoke insert, update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url, bio, church, socials, visible, gender, day_off, mbti, updated_at)
  on public.profiles to authenticated;

create policy "sign-in codes readable by hosts" on public.sign_in_codes for select to authenticated
  using (public.is_profile_admin(profile_id));

create policy "logins readable by self" on public.profile_logins for select to authenticated
  using (user_id = auth.uid());

create policy "roles readable by self or admins" on public.event_roles for select to authenticated
  using (profile_id = public.current_profile_id() or public.is_event_admin(event_id));
create policy "roles managed by admins" on public.event_roles for all to authenticated
  using (public.is_event_admin(event_id)) with check (public.is_event_admin(event_id));

create policy "prayer cards readable by owner, partners and hosts" on public.prayer_cards for select to authenticated
  using (
    profile_id = public.current_profile_id()
    or public.is_my_prayer_partner(profile_id)
    or public.is_profile_admin(profile_id)
  );
create policy "prayer cards insert own" on public.prayer_cards for insert to authenticated
  with check (profile_id = public.current_profile_id());
create policy "prayer cards update own" on public.prayer_cards for update to authenticated
  using (profile_id = public.current_profile_id()) with check (profile_id = public.current_profile_id());

-- Participants see their own group only while the host has started the session.
create policy "prayer partners readable" on public.prayer_partners for select to authenticated
  using (
    public.is_event_admin(event_id)
    or (
      public.prayer_session_on(event_id)
      and (profile_id = public.current_profile_id() or public.is_my_prayer_partner(profile_id))
    )
  );
create policy "prayer partners managed by admins" on public.prayer_partners for all to authenticated
  using (public.is_event_admin(event_id)) with check (public.is_event_admin(event_id));

-- Hosts are created with public.create_host(...) from a local, git-ignored script
-- (see supabase/hosts.example.sql) so no names are committed to this repository.
