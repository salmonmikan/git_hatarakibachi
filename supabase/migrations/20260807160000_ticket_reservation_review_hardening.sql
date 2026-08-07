create or replace function private.validate_ticket_reservation_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.ticket_events%rowtype;
  v_now timestamptz;
begin
  select e.*
  into v_event
  from public.ticket_events e
  where e.id = new.event_id;

  if not found
    or v_event.deleted_at is not null
    or v_event.status <> 'published'
  then
    raise exception 'Ticket event is not accepting reservations' using errcode = 'P0001';
  end if;

  v_now := clock_timestamp();

  if v_event.opens_at is not null and v_event.opens_at > v_now then
    raise exception 'Ticket reservation is not open' using errcode = 'P0001';
  end if;

  if v_event.closes_at is not null and v_event.closes_at < v_now then
    raise exception 'Ticket reservation is closed' using errcode = 'P0001';
  end if;

  if new.window_id is null then
    if exists (
      select 1
      from public.ticket_windows w
      where w.event_id = new.event_id
    ) then
      raise exception 'A ticket window is required' using errcode = 'P0001';
    end if;
  elsif not exists (
    select 1
    from public.ticket_windows w
    where w.id = new.window_id
      and w.event_id = new.event_id
      and w.deleted_at is null
  ) then
    raise exception 'Ticket window is unavailable' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_ticket_reservation_request() from public, anon, authenticated;

drop trigger if exists ticket_reservations_acceptance_guard on public.ticket_reservations;

create trigger ticket_reservations_acceptance_guard
before insert or update of event_id, window_id on public.ticket_reservations
for each row
execute function private.validate_ticket_reservation_request();

create or replace function private.create_ticket_reservation(
  p_event_id bigint,
  p_window_id bigint,
  p_customer_name text,
  p_customer_email text,
  p_quantity integer,
  p_note text default null
)
returns table (reservation_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.ticket_events%rowtype;
  v_window public.ticket_windows%rowtype;
  v_reserved_quantity bigint;
  v_reservation_code text;
  v_now timestamptz;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 10 then
    raise exception 'Ticket quantity must be between 1 and 10' using errcode = 'P0001';
  end if;

  if nullif(btrim(p_customer_name), '') is null then
    raise exception 'Customer name is required' using errcode = 'P0001';
  end if;

  if nullif(btrim(p_customer_email), '') is null then
    raise exception 'Customer email is required' using errcode = 'P0001';
  end if;

  select e.*
  into v_event
  from public.ticket_events e
  where e.id = p_event_id
  for update;

  if not found
    or v_event.deleted_at is not null
    or v_event.status <> 'published'
  then
    raise exception 'Ticket event is not accepting reservations' using errcode = 'P0001';
  end if;

  v_now := clock_timestamp();

  if v_event.opens_at is not null and v_event.opens_at > v_now then
    raise exception 'Ticket reservation is not open' using errcode = 'P0001';
  end if;

  if v_event.closes_at is not null and v_event.closes_at < v_now then
    raise exception 'Ticket reservation is closed' using errcode = 'P0001';
  end if;

  if p_window_id is null then
    if exists (
      select 1
      from public.ticket_windows w
      where w.event_id = p_event_id
    ) then
      raise exception 'A ticket window is required' using errcode = 'P0001';
    end if;
  else
    select w.*
    into v_window
    from public.ticket_windows w
    where w.id = p_window_id
      and w.event_id = p_event_id
      and w.deleted_at is null
    for update;

    if not found then
      raise exception 'Ticket window is unavailable' using errcode = 'P0001';
    end if;

    if v_window.capacity > 0 then
      select coalesce(sum(r.quantity), 0)
      into v_reserved_quantity
      from public.ticket_reservations r
      where r.window_id = p_window_id
        and r.deleted_at is null
        and r.status = 'reserved';

      if v_reserved_quantity + p_quantity > v_window.capacity then
        raise exception 'Ticket window does not have enough capacity' using errcode = 'P0001';
      end if;
    end if;
  end if;

  insert into public.ticket_reservations (
    event_id,
    window_id,
    customer_name,
    customer_email,
    quantity,
    note
  ) values (
    p_event_id,
    p_window_id,
    btrim(p_customer_name),
    btrim(p_customer_email),
    p_quantity,
    nullif(btrim(p_note), '')
  )
  returning public.ticket_reservations.reservation_code into v_reservation_code;

  return query select v_reservation_code;
end;
$$;

revoke all on function private.create_ticket_reservation(bigint, bigint, text, text, integer, text)
  from public, anon, authenticated;

create or replace function public.get_ticket_window_reservation_totals()
returns table (
  window_id bigint,
  reserved_quantity bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.admin_users au
    where au.uuid = (select auth.uid())
  ) then
    raise exception 'Ticket reservation totals require an administrator'
      using errcode = '42501';
  end if;

  return query
  select
    r.window_id,
    coalesce(sum(r.quantity), 0::bigint) as reserved_quantity
  from public.ticket_reservations r
  where r.window_id is not null
    and r.deleted_at is null
    and r.status = 'reserved'
  group by r.window_id;
end;
$$;

revoke all on function public.get_ticket_window_reservation_totals() from public, anon, authenticated;
grant execute on function public.get_ticket_window_reservation_totals() to authenticated;
