-- Zones de livraison. Le prix d'une zone n'entre JAMAIS dans le total payé en ligne :
-- le client le remet en espèces au livreur.

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  fee integer not null check (fee >= 0 and fee <= 1000000),
  position integer not null default 0 check (position between 0 and 999),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deux zones ne peuvent pas porter le même nom (majuscules ignorées)
create unique index delivery_zones_name_key
  on public.delivery_zones (lower(name));

create index delivery_zones_listing_idx
  on public.delivery_zones (is_active, position);

create trigger delivery_zones_set_updated_at
  before update on public.delivery_zones
  for each row execute function public.set_updated_at();

alter table public.delivery_zones enable row level security;

-- Les clients ne voient que les zones actives
create policy "Zones actives visibles par tous"
  on public.delivery_zones for select
  to anon, authenticated
  using (is_active);

-- Seul l'admin gère les zones (et voit aussi les zones désactivées)
create policy "Admin gère les zones de livraison"
  on public.delivery_zones for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on public.delivery_zones from anon, authenticated;
grant select on public.delivery_zones to anon, authenticated;
grant insert, update, delete on public.delivery_zones to authenticated;