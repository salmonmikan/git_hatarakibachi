-- Keep the registration capability token out of HTTP query strings and logs.
-- The Pages Function calls this RPC with the token in the JSON request body.
create or replace function public.get_member_fee_registration(p_token uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'id', b.id,
    'member_id', b.member_id,
    'billing_email', b.billing_email,
    'registration_attempt_token', b.registration_attempt_token,
    'square_subscription_id', b.square_subscription_id,
    'square_payment_link_id', b.square_payment_link_id,
    'subscription_status', b.subscription_status,
    'member', pg_catalog.jsonb_build_object(
      'id', m.id,
      'name', m.name,
      'deleted_at', m.deleted_at
    )
  )
  from public.member_billing b
  join public.members m on m.id = b.member_id
  where b.registration_token = p_token
  limit 1;
$$;

revoke execute on function public.get_member_fee_registration(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.get_member_fee_registration(uuid)
  to service_role;
