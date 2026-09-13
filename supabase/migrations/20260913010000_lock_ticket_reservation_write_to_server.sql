-- Fresh environments already get this final permission state from the initial
-- ticket migration. Keep this forward migration as well so environments that
-- recorded the earlier ticket migration before this hardening are corrected.
revoke all on function public.create_ticket_reservation(
  bigint, bigint, text, text, integer, text, uuid
) from public, anon, authenticated;

grant execute on function public.create_ticket_reservation(
  bigint, bigint, text, text, integer, text, uuid
) to service_role;
