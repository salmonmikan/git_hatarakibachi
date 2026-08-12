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
      and e.status = 'published'
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
