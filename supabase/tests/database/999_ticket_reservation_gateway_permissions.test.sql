create extension if not exists pgtap with schema extensions;

revoke all on function public.create_ticket_reservation(
  bigint, bigint, text, text, integer, text, uuid
) from public, anon, authenticated;

grant execute on function public.create_ticket_reservation(
  bigint, bigint, text, text, integer, text, uuid
) to service_role;

select plan(3);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_ticket_reservation(bigint,bigint,text,text,integer,text,uuid)',
    'EXECUTE'
  ),
  'anon remains unable to execute the reservation RPC after domain tests'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.create_ticket_reservation(bigint,bigint,text,text,integer,text,uuid)',
    'EXECUTE'
  ),
  'authenticated remains unable to execute the reservation RPC after domain tests'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.create_ticket_reservation(bigint,bigint,text,text,integer,text,uuid)',
    'EXECUTE'
  ),
  'service role retains reservation RPC execution after domain tests'
);

select * from finish();
