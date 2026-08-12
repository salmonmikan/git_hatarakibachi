alter table public.ticket_events
  add column if not exists sanity_performance_id text;

create index if not exists ticket_events_sanity_performance_idx
  on public.ticket_events (sanity_performance_id)
  where deleted_at is null;

alter table public.ticket_events
  drop constraint if exists ticket_events_published_sanity_check;

alter table public.ticket_events
  add constraint ticket_events_published_sanity_check
  check (status <> 'published' or nullif(btrim(sanity_performance_id), '') is not null)
  not valid;

alter table public.ticket_events
  drop constraint if exists ticket_events_time_order_check;

alter table public.ticket_events
  add constraint ticket_events_time_order_check
  check (closes_at is null or opens_at is null or closes_at >= opens_at)
  not valid;

create or replace function private.validate_ticket_window_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reserved_quantity bigint;
begin
  if new.capacity > 0 then
    select coalesce(sum(r.quantity), 0::bigint)
    into v_reserved_quantity
    from public.ticket_reservations r
    where r.window_id = old.id
      and r.deleted_at is null
      and r.status = 'reserved';

    if v_reserved_quantity > new.capacity then
      raise exception 'Ticket window capacity cannot be lower than active reservations'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists ticket_windows_capacity_guard on public.ticket_windows;

create trigger ticket_windows_capacity_guard
before update of capacity on public.ticket_windows
for each row
execute function private.validate_ticket_window_capacity();

create or replace function private.delete_ticket_window(p_window_id bigint)
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
    raise exception 'Ticket window deletion requires an administrator'
      using errcode = '42501';
  end if;

  update public.ticket_windows
  set deleted_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_window_id
    and deleted_at is null;

  if not found then
    raise exception 'Ticket window is unavailable' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function private.delete_ticket_window(bigint) from public, anon, authenticated;

create or replace function public.delete_ticket_window(p_window_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  select private.delete_ticket_window(p_window_id);
$$;

revoke all on function public.delete_ticket_window(bigint) from public, anon;
grant execute on function public.delete_ticket_window(bigint) to authenticated;

revoke delete on table public.ticket_windows from authenticated;
