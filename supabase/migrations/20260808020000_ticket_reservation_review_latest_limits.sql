alter table public.ticket_reservations
  drop constraint if exists ticket_reservations_customer_name_length_check;

alter table public.ticket_reservations
  add constraint ticket_reservations_customer_name_length_check
  check (char_length(customer_name) <= 200)
  not valid;

alter table public.ticket_reservations
  drop constraint if exists ticket_reservations_customer_email_length_check;

alter table public.ticket_reservations
  add constraint ticket_reservations_customer_email_length_check
  check (char_length(customer_email) <= 320)
  not valid;

alter table public.ticket_reservations
  drop constraint if exists ticket_reservations_note_length_check;

alter table public.ticket_reservations
  add constraint ticket_reservations_note_length_check
  check (note is null or char_length(note) <= 2000)
  not valid;

drop function if exists public.get_ticket_window_reservation_totals();

create or replace function public.get_ticket_window_reservation_totals()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_totals jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.admin_users au
    where au.uuid = (select auth.uid())
  ) then
    raise exception 'Ticket reservation totals require an administrator'
      using errcode = '42501';
  end if;

  select coalesce(
    jsonb_object_agg(t.window_id::text, t.reserved_quantity),
    '{}'::jsonb
  )
  into v_totals
  from (
    select
      r.window_id,
      coalesce(sum(r.quantity), 0::bigint) as reserved_quantity
    from public.ticket_reservations r
    where r.window_id is not null
      and r.deleted_at is null
      and r.status = 'reserved'
    group by r.window_id
  ) t;

  return v_totals;
end;
$$;

revoke all on function public.get_ticket_window_reservation_totals() from public, anon, authenticated;
grant execute on function public.get_ticket_window_reservation_totals() to authenticated;
