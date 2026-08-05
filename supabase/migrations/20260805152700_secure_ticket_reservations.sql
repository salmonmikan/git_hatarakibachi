create index if not exists admin_users_uuid_idx
  on public.admin_users (uuid);

create index if not exists ticket_reservations_window_active_idx
  on public.ticket_reservations (window_id)
  where deleted_at is null and status = 'reserved';

drop policy if exists "Public can read published ticket events" on public.ticket_events;
create policy "Public can read published ticket events"
  on public.ticket_events for select
  to anon, authenticated
  using (deleted_at is null and status = 'published');

drop policy if exists "Public can read ticket windows" on public.ticket_windows;
create policy "Public can read ticket windows"
  on public.ticket_windows for select
  to anon, authenticated
  using (deleted_at is null and exists (
    select 1 from public.ticket_events e
    where e.id = ticket_windows.event_id
      and e.deleted_at is null
      and e.status = 'published'
  ));

drop policy if exists "Public can create ticket reservations" on public.ticket_reservations;

drop policy if exists "Authenticated can manage ticket events" on public.ticket_events;
create policy "Authenticated can manage ticket events"
  on public.ticket_events for all
  to authenticated
  using (exists (
    select 1 from public.admin_users au
    where au.uuid = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.admin_users au
    where au.uuid = (select auth.uid())
  ));

drop policy if exists "Authenticated can manage ticket windows" on public.ticket_windows;
create policy "Authenticated can manage ticket windows"
  on public.ticket_windows for all
  to authenticated
  using (exists (
    select 1 from public.admin_users au
    where au.uuid = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.admin_users au
    where au.uuid = (select auth.uid())
  ));

drop policy if exists "Authenticated can manage ticket reservations" on public.ticket_reservations;
drop policy if exists "Authenticated admins can read ticket reservations" on public.ticket_reservations;
create policy "Authenticated admins can read ticket reservations"
  on public.ticket_reservations for select
  to authenticated
  using (exists (
    select 1 from public.admin_users au
    where au.uuid = (select auth.uid())
  ));

revoke all on table public.ticket_events from anon, authenticated;
grant select on table public.ticket_events to anon;
grant select, insert, update, delete on table public.ticket_events to authenticated;

revoke all on table public.ticket_windows from anon, authenticated;
grant select on table public.ticket_windows to anon;
grant select, insert, update, delete on table public.ticket_windows to authenticated;

revoke all on table public.ticket_reservations from anon, authenticated;
grant select on table public.ticket_reservations to authenticated;

revoke all on sequence public.ticket_events_id_seq from anon, authenticated;
revoke all on sequence public.ticket_windows_id_seq from anon, authenticated;
revoke all on sequence public.ticket_reservations_id_seq from anon, authenticated;
grant usage, select on sequence public.ticket_events_id_seq to authenticated;
grant usage, select on sequence public.ticket_windows_id_seq to authenticated;

create schema if not exists private;

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
        and w.deleted_at is null
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
revoke all on schema private from public, anon, authenticated;

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
    p_note
  );
$$;

revoke all on function public.create_ticket_reservation(bigint, bigint, text, text, integer, text) from public;
grant execute on function public.create_ticket_reservation(bigint, bigint, text, text, integer, text)
  to anon, authenticated;

create or replace function private.cancel_ticket_reservation(p_reservation_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.admin_users au
    where au.uuid = (select auth.uid())
  ) then
    raise exception 'Ticket reservation cancellation requires an administrator'
      using errcode = '42501';
  end if;

  update public.ticket_reservations
  set status = 'cancelled',
      cancelled_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_reservation_id
    and deleted_at is null
    and status = 'reserved';

  if not found then
    raise exception 'Ticket reservation is unavailable' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function private.cancel_ticket_reservation(bigint)
  from public, anon, authenticated;

create or replace function public.cancel_ticket_reservation(p_reservation_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  select private.cancel_ticket_reservation(p_reservation_id);
$$;

revoke all on function public.cancel_ticket_reservation(bigint) from public, anon;
grant execute on function public.cancel_ticket_reservation(bigint) to authenticated;
