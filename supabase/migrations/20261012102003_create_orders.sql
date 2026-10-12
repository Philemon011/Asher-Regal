-- Commandes, lignes de commande et fonction de création sécurisée.

-- 1. Statuts possibles
create type public.order_status as enum (
  'pending_payment', 'paid', 'preparing', 'ready', 'delivered', 'cancelled'
);

-- 2. Commandes (montants en FCFA, nombres entiers)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer generated always as identity (start with 1001) unique,
  user_id uuid not null references public.profiles (id) on delete restrict,
  status public.order_status not null default 'pending_payment',
  first_name text not null check (char_length(first_name) between 2 and 60),
  last_name text not null check (char_length(last_name) between 2 and 60),
  phone text not null check (char_length(phone) between 8 and 20),
  address text not null check (char_length(address) between 8 and 300),
  notes text not null default '' check (char_length(notes) <= 500),
  is_gift boolean not null default false,
  gift_message text not null default '' check (char_length(gift_message) <= 60),
  scheduled_for timestamptz,
  subtotal integer not null default 0 check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  total integer not null default 0 check (total >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_consistent
    check (total = subtotal - discount + delivery_fee),
  constraint orders_gift_message_required
    check (not is_gift or char_length(gift_message) > 0)
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- 3. Lignes de commande : on garde le nom et le prix du jour de l'achat
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price integer not null check (unit_price > 0),
  quantity integer not null check (quantity between 1 and 20),
  line_total integer generated always as (unit_price * quantity) stored,
  unique (order_id, product_id)
);

create index order_items_order_idx on public.order_items (order_id);

-- 4. Sécurité : RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Un client lit ses commandes"
  on public.orders for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Un admin lit toutes les commandes"
  on public.orders for select
  to authenticated
  using ((select public.is_admin()));

create policy "Un admin change le statut des commandes"
  on public.orders for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Les lignes sont visibles si la commande l'est (les règles de orders s'appliquent)
create policy "Lecture des lignes de commandes visibles"
  on public.order_items for select
  to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

-- 5. Droits : lecture seule, et pour l'admin uniquement le statut
revoke all on public.orders, public.order_items from anon, authenticated;
grant select on public.orders, public.order_items to authenticated;
grant update (status) on public.orders to authenticated;

-- 6. Création d'une commande : tout se passe ici, en une seule transaction.
--    Le navigateur n'envoie que des identifiants et des quantités.
create function public.create_order(
  p_items jsonb,
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
     or char_length(v_address) not between 8 and 300
     or char_length(v_notes) > 500
     or regexp_replace(v_phone, '[^0-9]', '', 'g') !~ '^[0-9]{8,15}$'
     or v_phone !~ '^\+?[0-9 ]{8,20}$' then
    raise exception 'invalid_customer';
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
    user_id, first_name, last_name, phone, address, notes,
    is_gift, gift_message, scheduled_for
  )
  values (
    v_user, v_first, v_last, v_phone, v_address, v_notes,
    v_gift, v_gift_message, p_scheduled_for
  )
  returning id, order_number into v_order_id, v_order_number;

  -- Lignes : nom et prix lus dans la base, jamais dans la requête.
  -- Seuls les produits publiés ET disponibles sont acceptés.
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

  -- Si un produit manque, n'existe plus ou est indisponible : tout est annulé
  if v_inserted <> v_distinct then
    raise exception 'unavailable_items';
  end if;

  select sum(line_total) into v_total
  from public.order_items
  where order_id = v_order_id;

  if v_total > 100000000 then
    raise exception 'invalid_items';
  end if;

  update public.orders
  set subtotal = v_total, total = v_total
  where id = v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'total', v_total
  );
end;
$$;

revoke execute on function public.create_order(
  jsonb, text, text, text, text, text, boolean, text, timestamptz
) from public, anon;

grant execute on function public.create_order(
  jsonb, text, text, text, text, text, boolean, text, timestamptz
) to authenticated;