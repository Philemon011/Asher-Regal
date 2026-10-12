-- Profils des utilisateurs + rôles + règles de sécurité.

-- 1. Rôles possibles
create type public.app_role as enum ('customer', 'admin');

-- 2. Table des profils : une ligne par compte de connexion
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'customer',
  first_name text check (first_name is null or char_length(first_name) <= 60),
  last_name text check (last_name is null or char_length(last_name) <= 60),
  phone text check (phone is null or char_length(phone) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Mise à jour automatique de updated_at
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4. Création automatique du profil à chaque inscription.
--    Le rôle est TOUJOURS « customer » : on ne lit jamais le rôle
--    dans les données envoyées par l'utilisateur.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'given_name', '')), 60), ''),
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'family_name', '')), 60), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 5. Les comptes déjà créés pendant nos tests reçoivent un profil
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- 6. Fonction « est-ce un admin ? » (utilisée par les règles de sécurité)
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 7. Sécurité : RLS activée
alter table public.profiles enable row level security;

create policy "Un client lit son profil"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Un admin lit tous les profils"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "Un client modifie son profil"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- 8. Droits : le strict minimum.
--    Aucune insertion ni suppression depuis l'application,
--    et seules ces trois colonnes sont modifiables (pas « role »).
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;