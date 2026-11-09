-- La base refuse toute commande dont la réception ne respecte pas les horaires.
-- Fuseau de la boutique : Africa/Porto-Novo (UTC+1, sans heure d'été).

create function public.enforce_order_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  s public.shop_schedule%rowtype;
  v_local timestamp;
  v_minutes integer;
begin
  select * into s from public.shop_schedule where id;
  if not found then
    return new;
  end if;

  -- Un délai minimum rend la date de réception obligatoire
  if new.scheduled_for is null then
    if s.min_lead_hours > 0 then
      raise exception 'schedule_required';
    end if;
    return new;
  end if;

  -- Trop proche ?
  if new.scheduled_for < now() + make_interval(hours => s.min_lead_hours) then
    raise exception 'schedule_too_soon';
  end if;

  v_local := new.scheduled_for at time zone 'Africa/Porto-Novo';

  -- Jour fermé ?
  if extract(isodow from v_local)::smallint = any (s.closed_weekdays) then
    raise exception 'schedule_closed_day';
  end if;

  -- Est-ce bien un créneau (première heure, dernière heure, pas) ?
  v_minutes := extract(hour from v_local)::integer * 60
             + extract(minute from v_local)::integer;

  if v_minutes < s.slot_first_hour * 60
     or v_minutes > s.slot_last_hour * 60
     or (v_minutes - s.slot_first_hour * 60) % s.slot_step_minutes <> 0
     or extract(second from v_local) <> 0 then
    raise exception 'schedule_invalid_slot';
  end if;

  return new;
end;
$$;

create trigger orders_enforce_schedule
  before insert on public.orders
  for each row execute function public.enforce_order_schedule();