alter table public.ticket_events
  drop constraint if exists ticket_events_published_sanity_check;

alter table public.ticket_events
  add constraint ticket_events_published_sanity_check
  check (
    status not in ('published', 'closed')
    or nullif(btrim(sanity_performance_id), '') is not null
  )
  not valid;

drop policy if exists "Public can read published ticket events" on public.ticket_events;
create policy "Public can read published ticket events"
  on public.ticket_events for select
  to anon, authenticated
  using (
    deleted_at is null
    and status in ('published', 'closed')
    and nullif(btrim(sanity_performance_id), '') is not null
  );

drop policy if exists "Public can read ticket windows" on public.ticket_windows;
create policy "Public can read ticket windows"
  on public.ticket_windows for select
  to anon, authenticated
  using (deleted_at is null and exists (
    select 1 from public.ticket_events e
    where e.id = ticket_windows.event_id
      and e.deleted_at is null
      and e.status in ('published', 'closed')
      and nullif(btrim(e.sanity_performance_id), '') is not null
  ));

create or replace function public.get_ticket_window_availability(p_event_id bigint)
returns table (
  window_id bigint,
  capacity integer,
  reserved_quantity bigint,
  remaining_quantity bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.id,
    w.capacity,
    coalesce(sum(r.quantity), 0::bigint) as reserved_quantity,
    case
      when w.capacity > 0 then greatest(
        w.capacity::bigint - coalesce(sum(r.quantity), 0::bigint),
        0::bigint
      )
      else null::bigint
    end as remaining_quantity
  from public.ticket_windows w
  join public.ticket_events e
    on e.id = w.event_id
   and e.id = p_event_id
   and e.deleted_at is null
   and e.status in ('published', 'closed')
   and nullif(btrim(e.sanity_performance_id), '') is not null
  left join public.ticket_reservations r
    on r.window_id = w.id
   and r.deleted_at is null
   and r.status = 'reserved'
  where w.deleted_at is null
  group by w.id, w.capacity, w.sort_order
  order by w.sort_order, w.id;
$$;

revoke all on function public.get_ticket_window_availability(bigint)
  from public, anon, authenticated;
grant execute on function public.get_ticket_window_availability(bigint)
  to anon, authenticated;

create or replace function public.get_ticket_event_window_history(p_event_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.ticket_events e
    where e.id = p_event_id
      and e.deleted_at is null
      and e.status in ('published', 'closed')
      and nullif(btrim(e.sanity_performance_id), '') is not null
  )
  and exists (
    select 1
    from public.ticket_windows w
    where w.event_id = p_event_id
  );
$$;

revoke all on function public.get_ticket_event_window_history(bigint)
  from public, anon, authenticated;
grant execute on function public.get_ticket_event_window_history(bigint)
  to anon, authenticated;

create or replace function private.prevent_ticket_window_mode_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id bigint;
begin
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
