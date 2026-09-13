create extension if not exists pgtap with schema extensions;

select plan(3);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_ticket_reservation(bigint,bigint,text,text,integer,text,uuid)',
    'EXECUTE'
  ),
  'anon cannot execute the reservation RPC directly before test-only setup'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.create_ticket_reservation(bigint,bigint,text,text,integer,text,uuid)',
    'EXECUTE'
  ),
  'authenticated cannot execute the reservation RPC directly before test-only setup'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.create_ticket_reservation(bigint,bigint,text,text,integer,text,uuid)',
    'EXECUTE'
  ),
  'service role can execute the server-only reservation RPC'
);

select * from finish();

-- 既存の予約ドメインテストはanon/authenticatedとしてRPC本体を検証するため、
-- このローカルテストDB内だけ一時的に実行権限を付与する。zzzテストで必ず戻す。
grant execute on function public.create_ticket_reservation(
  bigint, bigint, text, text, integer, text, uuid
) to anon, authenticated;
