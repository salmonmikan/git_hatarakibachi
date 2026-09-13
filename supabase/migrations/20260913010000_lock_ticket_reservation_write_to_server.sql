revoke all on function public.create_ticket_reservation(
  bigint, bigint, text, text, integer, text, uuid
) from public, anon, authenticated;

grant execute on function public.create_ticket_reservation(
  bigint, bigint, text, text, integer, text, uuid
) to service_role;
