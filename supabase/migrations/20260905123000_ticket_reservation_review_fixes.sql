create or replace function private.generate_ticket_reservation_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_code, 0));

    if not exists (
      select 1
      from public.ticket_reservations r
      where r.reservation_code = v_code
    ) then
      return v_code;
    end if;
  end loop;
end;
$$;

revoke all on function private.generate_ticket_reservation_code()
  from public, anon, authenticated;

alter table public.ticket_reservations
  alter column reservation_code
  set default private.generate_ticket_reservation_code();

create or replace function private.prevent_ticket_window_mode_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id bigint;
begin
  if tg_op = 'UPDATE' and new.event_id is not distinct from old.event_id then
    return new;
  end if;

  select e.id
  into v_event_id
  from public.ticket_events e
  where e.id = new.event_id
  for update;

  if not found then
    return new;
  end if;

  if exists (
    select 1
    from public.ticket_reservations r
    where r.event_id = v_event_id
      and r.window_id is null
      and r.deleted_at is null
      and r.status = 'reserved'
  ) then
    raise exception 'Cannot add ticket windows after free-seating reservations'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_ticket_window_mode_change()
  from public, anon, authenticated;

create or replace function public.create_ticket_reservation(
  p_event_id bigint,
  p_window_id bigint,
  p_customer_name text,
  p_customer_email text,
  p_quantity integer,
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
    null::text,
    p_request_id
  );
$$;

revoke all on function public.create_ticket_reservation(
  bigint, bigint, text, text, integer, uuid
) from public;
grant execute on function public.create_ticket_reservation(
  bigint, bigint, text, text, integer, uuid
) to anon, authenticated;
