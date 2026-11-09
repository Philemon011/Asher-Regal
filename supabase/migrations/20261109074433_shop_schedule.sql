-- Horaires de la boutique : créneaux, délai minimum, jours fermés (une seule ligne).

create table public.shop_schedule (
  id boolean primary key default true check (id),
  slot_first_hour smallint not null default 8
    check (slot_first_hour between 0 and 23),
  slot_last_hour smallint not null default 22
    check (slot_last_hour between 0 and 23),
  slot_step_minutes smallint not null default 30
    check (slot_step_minutes in (15, 30, 60)),
  min_lead_hours smallint not null default 0
    check (min_lead_hours between 0 and 720),
  -- 1 = lundi … 7 = dimanche ; on ne peut pas fermer les 7 jours
  closed_weekdays smallint[] not null default '{}'
    check (
      closed_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
      and cardinality(closed_weekdays) <= 6
    ),
  updated_at timestamptz not null default now(),
  constraint shop_schedule_hours_order
    check (slot_first_hour <= slot_last_hour)
);

insert into public.shop_schedule (id) values (true);

create trigger shop_schedule_set_updated_at
  before update on public.shop_schedule
  for each row execute function public.set_updated_at();

alter table public.shop_schedule enable row level security;

-- Les horaires ne sont pas secrets : tout le monde peut les lire
create policy "Horaires lisibles par tous"
  on public.shop_schedule for select
  to anon, authenticated
  using (true);

create policy "Admin modifie les horaires"
  on public.shop_schedule for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on public.shop_schedule from anon, authenticated;
grant select on public.shop_schedule to anon, authenticated;
grant update (
  slot_first_hour,
  slot_last_hour,
  slot_step_minutes,
  min_lead_hours,
  closed_weekdays
) on public.shop_schedule to authenticated;