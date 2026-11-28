-- Make people hosts (admins). Copy this file to supabase/hosts.local.sql (git-ignored),
-- replace the names, and run it in the Supabase SQL editor after the migrations and seed.
-- An existing participant with the same name is promoted; otherwise a new profile is created.
-- Re-running is safe. Each row returns that host's sign-in ID.
select name, public.create_host('00000000-0000-0000-0000-000000000001', name) as sign_in_id
from (values
  ('Host One'),
  ('Host Two')
) as hosts(name);
