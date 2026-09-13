create or replace function public.get_admin_ticket_events()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.admin_users au
    where au.uuid = (select auth.uid())
  ) then
    raise exception 'Ticket administration requires an administrator'
      using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      to_jsonb(e) || jsonb_build_object(
        'windows', coalesce((
          select jsonb_agg(
            to_jsonb(w) || jsonb_build_object(
              'reserved_quantity', coalesce(stats.reserved_quantity, 0::bigint),
              'remaining_quantity', case
                when w.capacity > 0 then greatest(w.capacity::bigint - coalesce(stats.reserved_quantity, 0::bigint), 0::bigint)
                else null::bigint
              end
            )
            order by w.sort_order, w.id
          )
          from public.ticket_windows w
          left join lateral (
            select coalesce(sum(r.quantity), 0::bigint) as reserved_quantity
            from public.ticket_reservations r
            where r.window_id = w.id
              and r.deleted_at is null
              and r.status = 'reserved'
          ) stats on true
          where w.event_id = e.id
        ), '[]'::jsonb)
      )
      order by e.created_at desc, e.id desc
    ),
    '[]'::jsonb
  )
  into result
  from public.ticket_events e
  where e.deleted_at is null;

  return result;
end;
$$;

revoke execute on function public.get_admin_ticket_events()
  from public, anon, authenticated;
grant execute on function public.get_admin_ticket_events()
  to authenticated;
