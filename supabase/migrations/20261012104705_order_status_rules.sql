-- Règles de statut, historique et compteurs pour l'admin.

-- 1. Règles de passage d'un statut à un autre
create function public.enforce_order_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if not (
    (old.status = 'pending_payment' and new.status in ('paid', 'cancelled'))
    or (old.status = 'paid' and new.status in ('preparing', 'cancelled'))
    or (old.status = 'preparing' and new.status in ('ready', 'cancelled'))
    or (old.status = 'ready' and new.status in ('delivered', 'cancelled'))
  ) then
    raise exception 'invalid_status_transition';
  end if;

  -- « Payée » est réservé au système de paiement (rôle service) ou à la base elle-même.
  -- Un administrateur connecté depuis le site ne peut pas le définir.
  if new.status = 'paid'
     and coalesce((select auth.jwt() ->> 'role'), '') = 'authenticated' then
    raise exception 'payment_required';
  end if;

  if new.status = 'paid' then
    new.paid_at = now();
  end if;

  return new;
end;
$$;

create trigger orders_enforce_status_transition
  before update of status on public.orders
  for each row execute function public.enforce_order_status_transition();

-- 2. Historique des statuts (on ne fait qu'ajouter, jamais modifier)
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_status_history_order_idx
  on public.order_status_history (order_id, created_at);

create function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, (select auth.uid()));
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return null;
end;
$$;

revoke execute on function public.log_order_status() from public, anon, authenticated;

create trigger orders_log_status_insert
  after insert on public.orders
  for each row execute function public.log_order_status();

create trigger orders_log_status_update
  after update of status on public.orders
  for each row execute function public.log_order_status();

-- Les commandes déjà créées pendant nos tests reçoivent leur première ligne d'historique
insert into public.order_status_history (order_id, from_status, to_status, changed_by, created_at)
select id, null, status, user_id, created_at
from public.orders;

alter table public.order_status_history enable row level security;

create policy "Lecture de l'historique des commandes visibles"
  on public.order_status_history for select
  to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

revoke all on public.order_status_history from anon, authenticated;
grant select on public.order_status_history to authenticated;

-- 3. Nombre de commandes par statut (pour les onglets de l'admin)
create function public.admin_order_counts()
returns table (status public.order_status, total bigint)
language sql
stable
set search_path = ''
as $$
  select o.status, count(*) as total
  from public.orders o
  group by o.status;
$$;

revoke execute on function public.admin_order_counts() from public, anon;
grant execute on function public.admin_order_counts() to authenticated;