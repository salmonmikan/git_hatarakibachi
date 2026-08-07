alter table public.ticket_reservations
  add column if not exists request_id uuid;

create unique index if not exists ticket_reservations_request_id_idx
  on public.ticket_reservations (request_id)
  where request_id is not null;

create or replace function private.set_ticket_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

revoke all on function private.set_ticket_updated_at() from public, anon, authenticated;

drop trigger if exists ticket_events_updated_at on public.ticket_events;

create trigger ticket_events_updated_at
before update on public.ticket_events
for each row
execute function private.set_ticket_updated_at();

drop trigger if exists ticket_windows_updated_at on public.ticket_windows;

create trigger ticket_windows_updated_at
before update on public.ticket_windows
for each row
execute function private.set_ticket_updated_at();

create or replace function private.prevent_ticket_window_event_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_id is distinct from old.event_id
    and exists (
      select 1
      from public.ticket_reservations r
      where r.window_id = old.id
    )
  then
    raise exception 'Ticket windows with reservations cannot change events'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_ticket_window_event_change() from public, anon, authenticated;

drop trigger if exists ticket_windows_event_change_guard on public.ticket_windows;

create trigger ticket_windows_event_change_guard
before update of event_id on public.ticket_windows
for each row
execute function private.prevent_ticket_window_event_change();

create or replace function private.create_ticket_reservation(
  p_event_id bigint,
  p_window_id bigint,
  p_customer_name text,
  p_customer_email text,
  p_quantity integer,
  p_note text,
  p_request_id uuid
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
  if p_request_id is null then
    raise exception 'Ticket reservation request ID is required' using errcode = 'P0001';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 10 then
    raise exception 'Ticket quantity must be between 1 and 10' using errcode = 'P0001';
  end if;

  if nullif(btrim(p_customer_name), '') is null then
    raise exception 'Customer name is required' using errcode = 'P0001';
  end if;

  if nullif(btrim(p_customer_email), '') is null then
    raise exception 'Customer email is required' using errcode = 'P0001';
  end if;

  select r.reservation_code
  into v_reservation_code
  from public.ticket_reservations r
  where r.request_id = p_request_id;

  if found then
    return query select v_reservation_code;
    return;
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

  select r.reservation_code
  into v_reservation_code
  from public.ticket_reservations r
  where r.request_id = p_request_id;

  if found then
    return query select v_reservation_code;
    return;
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

    if v_window.starts_at is not null and v_window.starts_at <= v_now then
      raise exception 'Ticket window has already started' using errcode = 'P0001';
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
    note,
    request_id
  ) values (
    p_event_id,
    p_window_id,
    btrim(p_customer_name),
    btrim(p_customer_email),
    p_quantity,
    nullif(btrim(p_note), ''),
    p_request_id
  )
  on conflict (request_id) where request_id is not null do nothing
  returning public.ticket_reservations.reservation_code into v_reservation_code;

  if not found then
    select r.reservation_code
    into v_reservation_code
    from public.ticket_reservations r
    where r.request_id = p_request_id;
  end if;

  return query select v_reservation_code;
end;
$$;

revoke all on function private.create_ticket_reservation(bigint, bigint, text, text, integer, text, uuid)
  from public, anon, authenticated;

create or replace function private.create_ticket_reservation(
  p_event_id bigint,
  p_window_id bigint,
  p_customer_name text,
  p_customer_email text,
  p_quantity integer,
  p_note text default null
)
returns table (reservation_code text)
language sql
security definer
set search_path = ''
as $$
  select *
  from private.create_ticket_reservation(
    p_event_id,
    p_window_id,
    p_customer_name,
    p_customer_email,
    p_quantity,
    p_note,
    gen_random_uuid()
  );
$$;

revoke all on function private.create_ticket_reservation(bigint, bigint, text, text, integer, text)
  from public, anon, authenticated;

create or replace function public.create_ticket_reservation(
  p_event_id bigint,
  p_window_id bigint,
  p_customer_name text,
  p_customer_email text,
  p_quantity integer,
  p_note text,
  p_request_id uuid
)
returns table (reservation_code text)
language sql
security definer
set search_path = ''
as $$
  select *
  from private.create_ticket_reservation(
    p_event_id,
    p_window_id,
    p_customer_name,
    p_customer_email,
    p_quantity,
    p_note,
    p_request_id
  );
$$;

revoke all on function public.create_ticket_reservation(bigint, bigint, text, text, integer, text, uuid)
  from public;
grant execute on function public.create_ticket_reservation(bigint, bigint, text, text, integer, text, uuid)
  to anon, authenticated;

create or replace function public.create_ticket_reservation(
  p_event_id bigint,
  p_window_id bigint,
  p_customer_name text,
  p_customer_email text,
  p_quantity integer,
  p_note text default null
)
returns table (reservation_code text)
language sql
security definer
set search_path = ''
as $$
  select *
  from private.create_ticket_reservation(
    p_event_id,
    p_window_id,
    p_customer_name,
    p_customer_email,
    p_quantity,
    p_note,
    gen_random_uuid()
  );
$$;

revoke all on function public.create_ticket_reservation(bigint, bigint, text, text, integer, text)
  from public;
grant execute on function public.create_ticket_reservation(bigint, bigint, text, text, integer, text)
  to anon, authenticated;
