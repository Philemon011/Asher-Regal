-- Catalogue : catégories, produits, images + stockage des photos.

-- 1. Catégories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Produits (prix en FCFA, nombre entier)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  description text not null default '' check (char_length(description) <= 1000),
  price integer not null check (price > 0 and price <= 10000000),
  tint text not null default 'rose'
    check (tint in ('rose', 'peach', 'lavender', 'sage', 'vanilla')),
  is_published boolean not null default false,
  is_available boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_listing_idx on public.products (is_published, position);

-- 3. Images des produits (le fichier est dans le stockage, ici on garde son chemin)
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null check (char_length(storage_path) between 3 and 300),
  alt text not null default '' check (char_length(alt) <= 200),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx
  on public.product_images (product_id, position);

-- 4. Mise à jour automatique de updated_at
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- 5. Sécurité : RLS activée
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

-- Lecture publique : uniquement ce qui est publié
create policy "Catégories actives visibles par tous"
  on public.categories for select
  to anon, authenticated
  using (is_active);

create policy "Produits publiés visibles par tous"
  on public.products for select
  to anon, authenticated
  using (is_published);

create policy "Images des produits publiés visibles par tous"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published
    )
  );

-- Gestion : réservée à l'admin (voit aussi les brouillons)
create policy "Admin gère les catégories"
  on public.categories for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin gère les produits"
  on public.products for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin gère les images"
  on public.product_images for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 6. Droits : lecture pour tous, écriture pour les connectés
--    (et les règles RLS ci-dessus réservent l'écriture à l'admin)
revoke all on public.categories, public.products, public.product_images
  from anon, authenticated;

grant select on public.categories, public.products, public.product_images
  to anon, authenticated;

grant insert, update, delete
  on public.categories, public.products, public.product_images
  to authenticated;

-- 7. Stockage des photos : 3 Mo max, images uniquement (pas de SVG)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "Admin ajoute des photos produit"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admin modifie des photos produit"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admin supprime des photos produit"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));