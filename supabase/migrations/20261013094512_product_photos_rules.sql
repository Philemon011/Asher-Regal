-- Règles pour les photos des produits.

-- 1. Un produit ne peut être publié que s'il a au moins une photo
create function public.enforce_product_photo_to_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published
     and (tg_op = 'INSERT' or old.is_published is distinct from new.is_published)
     and not exists (
       select 1 from public.product_images where product_id = new.id
     ) then
    raise exception 'photo_required';
  end if;
  return new;
end;
$$;

create trigger products_require_photo_to_publish
  before insert or update of is_published on public.products
  for each row execute function public.enforce_product_photo_to_publish();

-- 2. On ne supprime pas la dernière photo d'un produit publié
create function public.protect_last_product_photo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
       select 1 from public.products p
       where p.id = old.product_id and p.is_published
     )
     and not exists (
       select 1 from public.product_images i
       where i.product_id = old.product_id and i.id <> old.id
     ) then
    raise exception 'last_photo';
  end if;
  return old;
end;
$$;

create trigger product_images_protect_last
  before delete on public.product_images
  for each row execute function public.protect_last_product_photo();

-- 3. Réorganisation atomique des photos
create function public.reorder_product_images(
  p_product_id uuid,
  p_image_ids uuid[]
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(array_length(p_image_ids, 1), 0) = 0
     or (select count(*) from public.product_images where product_id = p_product_id)
        <> array_length(p_image_ids, 1)
     or (select count(distinct x) from unnest(p_image_ids) as x)
        <> array_length(p_image_ids, 1)
     or exists (
       select 1
       from unnest(p_image_ids) as x(id)
       where not exists (
         select 1 from public.product_images i
         where i.id = x.id and i.product_id = p_product_id
       )
     ) then
    raise exception 'invalid_order';
  end if;

  update public.product_images i
  set position = o.ord - 1
  from unnest(p_image_ids) with ordinality as o(id, ord)
  where i.id = o.id and i.product_id = p_product_id;
end;
$$;

revoke execute on function public.reorder_product_images(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_product_images(uuid, uuid[]) to authenticated;