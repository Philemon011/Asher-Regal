-- Consultation des clients, réservée à l'admin.
-- L'email vit dans auth.users, illisible depuis le site : on passe par ces fonctions.

create function public.admin_customers(
  p_search text default '',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role public.app_role,
  created_at timestamptz,
  orders_count bigint,
  spent bigint,
  last_order_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_search text := left(trim(coalesce(p_search, '')), 60);
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_pattern text;
begin
  if not (select public.is_admin()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  -- Les caractères spéciaux de recherche (%, _, \) sont neutralisés.
  v_pattern := '%'
    || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_')
    || '%';

  return query
  select
    p.id,
    u.email::text,
    p.first_name,
    p.last_name,
    p.phone,
    p.role,
    p.created_at,
    coalesce(o.orders_count, 0)::bigint,
    coalesce(o.spent, 0)::bigint,
    o.last_order_at,
    count(*) over ()
  from public.profiles p
  join auth.users u on u.id = p.id
  left join lateral (
    select
      count(*) filter (where ord.status <> 'cancelled') as orders_count,
      sum(ord.total) filter (
        where ord.status in ('paid', 'preparing', 'ready', 'delivered')
      ) as spent,
      max(ord.created_at) as last_order_at
    from public.orders ord
    where ord.user_id = p.id
  ) o on true
  where v_search = ''
     or u.email ilike v_pattern escape '\'
     or p.first_name ilike v_pattern escape '\'
     or p.last_name ilike v_pattern escape '\'
     or p.phone ilike v_pattern escape '\'
     or (coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, ''))
        ilike v_pattern escape '\'
  order by p.created_at desc
  limit v_limit offset v_offset;
end;
$$;

revoke execute on function public.admin_customers(text, integer, integer)
  from public, anon;
grant execute on function public.admin_customers(text, integer, integer)
  to authenticated;

create function public.admin_customer(p_id uuid)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role public.app_role,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  providers jsonb,
  orders_count bigint,
  spent bigint,
  last_order_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not (select public.is_admin()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.first_name,
    p.last_name,
    p.phone,
    p.role,
    p.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.raw_app_meta_data -> 'providers',
    coalesce(o.orders_count, 0)::bigint,
    coalesce(o.spent, 0)::bigint,
    o.last_order_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join lateral (
    select
      count(*) filter (where ord.status <> 'cancelled') as orders_count,
      sum(ord.total) filter (
        where ord.status in ('paid', 'preparing', 'ready', 'delivered')
      ) as spent,
      max(ord.created_at) as last_order_at
    from public.orders ord
    where ord.user_id = p.id
  ) o on true
  where p.id = p_id;
end;
$$;

revoke execute on function public.admin_customer(uuid) from public, anon;
grant execute on function public.admin_customer(uuid) to authenticated;