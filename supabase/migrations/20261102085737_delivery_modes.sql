-- Modes de réception : livraison par zone (prix payé en espèces au livreur)
-- ou retrait sur place. Le prix de livraison n'entre JAMAIS dans le total payé en ligne.

-- 1. Réglages de la boutique (une seule ligne)
create table public.shop_settings (
  id boolean primary key default true check (id),
  pickup_enabled boolean not null default false,
  pickup_instructions text not null default ''
    check (char_length(pickup_instructions) <= 300),
  updated_at timestamptz not null default now()
);

insert into public.shop_settings (id) values (true);

create trigger shop_settings_set_updated_at
  before update on public.shop_settings
  for each row execute function public.set_updated_at();

alter table public.shop_settings enable row level security;

-- Les clients ne voient les réglages que si le retrait est activé
create policy "Réglages lisibles si le retrait est activé"
  on public.shop_settings for select
  to authenticated
  using (pickup_enabled or (select public.is_admin()));

create policy "Admin modifie les réglages"
  on public.shop_settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on public.shop_settings from anon, authenticated;
grant select on public.shop_settings to authenticated;
grant update (pickup_enabled, pickup_instructions)
  on public.shop_settings to authenticated;

-- 2. La commande retient son mode de réception
alter table public.orders
  add column fulfillment text not null default 'delivery'
    check (fulfillment in ('delivery', 'pickup')),
  add column delivery_zone_id uuid
    references public.delivery_zones (id) on delete set null,
  add column delivery_zone_name text
    check (delivery_zone_name is null or char_length(delivery_zone_name) <= 60),
  add column delivery_fee_due integer not null default 0
    check (delivery_fee_due >= 0 and delivery_fee_due <= 1000000);

-- Les commandes de test déjà créées n'ont pas de zone
update public.orders
set delivery_zone_name = 'Non précisée'
where delivery_zone_name is null;

-- Le total ne contient plus de frais : seulement les gâteaux (moins une réduction éventuelle)
alter table public.orders drop constraint orders_total_consistent;
alter table public.orders drop column delivery_fee;
alter table public.orders
  add constraint orders_total_consistent check (total = subtotal - discount);

-- L'adresse n'est obligatoire que pour une livraison
alter table public.orders drop constraint orders_address_check;
alter table public.orders
  add constraint orders_address_valid check (
    char_length(address) <= 300
    and (fulfillment = 'pickup' or char_length(address) >= 8)
  );

alter table public.orders
  add constraint orders_pickup_consistent check (
    fulfillment = 'delivery'
    or (delivery_zone_id is null
        and delivery_zone_name is null
        and delivery_fee_due = 0)
  ),
  add constraint orders_delivery_has_zone check (
    fulfillment = 'pickup' or delivery_zone_name is not null
  );

-- 3. Nouvelle version de la création de commande
drop function public.create_order(
  jsonb, text, text, text, text, text, boolean, text, timestamptz
);

create function public.create_order(
  p_items jsonb,
  p_fulfillment text,
  p_zone_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_address text,
  p_notes text,
  p_is_gift boolean,
  p_gift_message text,
  p_scheduled_for timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_order_id uuid;
  v_order_number integer;
  v_distinct integer;
  v_inserted integer;
  v_total integer;
  v_fulfillment text := coalesce(p_fulfillment, '');
  v_zone_name text;
  v_fee_due integer := 0;
  v_first text := trim(coalesce(p_first_name, ''));
  v_last text := trim(coalesce(p_last_name, ''));
  v_phone text := trim(coalesce(p_phone, ''));
  v_address text := trim(coalesce(p_address, ''));
  v_notes text := trim(coalesce(p_notes, ''));
  v_gift boolean := coalesce(p_is_gift, false);
  v_gift_message text := trim(coalesce(p_gift_message, ''));
begin
  -- Utilisateur connecté obligatoire
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Panier : une liste de 1 à 30 lignes bien formées
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'invalid_items';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as i
    where jsonb_typeof(i) <> 'object'
       or coalesce(i ->> 'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(i ->> 'quantity', '') !~ '^[0-9]{1,2}$'
       or (i ->> 'quantity')::integer not between 1 and 20
  ) then
    raise exception 'invalid_items';
  end if;

  -- Informations du client
  if char_length(v_first) not between 2 and 60
     or char_length(v_last) not between 2 and 60
     or char_length(v_notes) > 500
     or regexp_replace(v_phone, '[^0-9]', '', 'g') !~ '^[0-9]{8,15}$'
     or v_phone !~ '^\+?[0-9 ]{8,20}$' then
    raise exception 'invalid_customer';
  end if;

  -- Mode de réception : le prix vient toujours de la base
  if v_fulfillment not in ('delivery', 'pickup') then
    raise exception 'invalid_fulfillment';
  end if;

  if v_fulfillment = 'delivery' then
    if char_length(v_address) not between 8 and 300 then
      raise exception 'invalid_customer';
    end if;

    select z.name, z.fee
    into v_zone_name, v_fee_due
    from public.delivery_zones z
    where z.id = p_zone_id and z.is_active;

    if v_zone_name is null then
      raise exception 'invalid_zone';
    end if;
  else
    if not coalesce(
      (select s.pickup_enabled from public.shop_settings s where s.id),
      false
    ) then
      raise exception 'pickup_unavailable';
    end if;
    v_address := '';
  end if;

  if v_gift and char_length(v_gift_message) not between 1 and 60 then
    raise exception 'invalid_gift_message';
  end if;
  if not v_gift then
    v_gift_message := '';
  end if;

  if p_scheduled_for is not null
     and (p_scheduled_for < now() or p_scheduled_for > now() + interval '1 year') then
    raise exception 'invalid_date';
  end if;

  -- Limite anti-abus : pas plus de 5 commandes en attente de paiement par jour
  if (
    select count(*)
    from public.orders
    where user_id = v_user
      and status = 'pending_payment'
      and created_at > now() - interval '1 day'
  ) >= 5 then
    raise exception 'too_many_pending';
  end if;

  -- Création de la commande (montants à 0 pour l'instant)
  insert into public.orders (
    user_id, fulfillment, delivery_zone_id, delivery_zone_name, delivery_fee_due,
    first_name, last_name, phone, address, notes,
    is_gift, gift_message, scheduled_for
  )
  values (
    v_user,
    v_fulfillment,
    case when v_fulfillment = 'delivery' then p_zone_id end,
    v_zone_name,
    v_fee_due,
    v_first, v_last, v_phone, v_address, v_notes,
    v_gift, v_gift_message, p_scheduled_for
  )
  returning id, order_number into v_order_id, v_order_number;

  -- Lignes : nom et prix lus dans la base, jamais dans la requête.
  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
  select v_order_id, p.id, p.name, p.price, r.quantity
  from (
    select (i ->> 'product_id')::uuid as product_id,
           sum((i ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as i
    group by 1
  ) as r
  join public.products p on p.id = r.product_id
  where p.is_published and p.is_available;

  get diagnostics v_inserted = row_count;

  select count(distinct (i ->> 'product_id')::uuid)
  into v_distinct
  from jsonb_array_elements(p_items) as i;

  if v_inserted <> v_distinct then
    raise exception 'unavailable_items';
  end if;

  select sum(line_total) into v_total
  from public.order_items
  where order_id = v_order_id;

  if v_total > 100000000 then
    raise exception 'invalid_items';
  end if;

  -- Le total payé en ligne = les gâteaux seulement. La livraison reste à part.
  update public.orders
  set subtotal = v_total, total = v_total
  where id = v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'total', v_total,
    'delivery_fee_due', v_fee_due
  );
end;
$$;

revoke execute on function public.create_order(
  jsonb, text, uuid, text, text, text, text, text, boolean, text, timestamptz
) from public, anon;

grant execute on function public.create_order(
  jsonb, text, uuid, text, text, text, text, text, boolean, text, timestamptz
) to authenticated;