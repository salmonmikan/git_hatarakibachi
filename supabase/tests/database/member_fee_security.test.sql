begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

select ok(
  not has_function_privilege('anon', 'public.claim_square_webhook_event(text,text)', 'EXECUTE'),
  'anon cannot claim Square webhook events'
);
select ok(
  not has_function_privilege('authenticated', 'public.claim_square_webhook_event(text,text)', 'EXECUTE'),
  'authenticated cannot claim Square webhook events'
);
select ok(
  has_function_privilege('service_role', 'public.claim_square_webhook_event(text,text)', 'EXECUTE'),
  'service role can claim Square webhook events'
);

select ok(
  not has_function_privilege('anon', 'public.claim_member_fee_registration_attempt(bigint,text)', 'EXECUTE'),
  'anon cannot claim member fee registration attempts'
);
select ok(
  not has_function_privilege('authenticated', 'public.claim_member_fee_registration_attempt(bigint,text)', 'EXECUTE'),
  'authenticated cannot claim member fee registration attempts'
);
select ok(
  has_function_privilege('service_role', 'public.claim_member_fee_registration_attempt(bigint,text)', 'EXECUTE'),
  'service role can claim member fee registration attempts'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.apply_member_fee_invoice_projection(bigint,date,integer,text,text,integer,text,timestamp with time zone)',
    'EXECUTE'
  ),
  'anon cannot apply invoice projections'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.apply_member_fee_invoice_projection(bigint,date,integer,text,text,integer,text,timestamp with time zone)',
    'EXECUTE'
  ),
  'authenticated cannot apply invoice projections'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.apply_member_fee_invoice_projection(bigint,date,integer,text,text,integer,text,timestamp with time zone)',
    'EXECUTE'
  ),
  'service role can apply invoice projections'
);
select ok(
  not has_function_privilege('anon', 'public.ensure_member_billing_row()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.ensure_member_billing_row()', 'EXECUTE')
  and not has_function_privilege('service_role', 'public.ensure_member_billing_row()', 'EXECUTE'),
  'trigger helper is not exposed through the Data API roles'
);

insert into public.members (name, hurigana, affiliation_code)
values ('member-fee-pgtap', 'member-fee-pgtap', 'associate');

select ok(
  public.apply_member_fee_invoice_projection(
    currval('public.members_id_seq'),
    date '2026-09-01',
    1000,
    'JPY',
    'invoice-pgtap-version',
    2,
    'PAID',
    timestamptz '2026-09-13 12:00:00+00'
  ),
  'newer invoice projection is applied'
);

select ok(
  not public.apply_member_fee_invoice_projection(
    currval('public.members_id_seq'),
    date '2026-09-01',
    500,
    'JPY',
    'invoice-pgtap-version',
    1,
    'PARTIAL',
    timestamptz '2026-09-13 11:00:00+00'
  ),
  'older invoice projection is rejected'
);

select is(
  (
    select concat(square_invoice_version, ':', status, ':', amount)
    from public.member_fee_payments
    where square_invoice_id = 'invoice-pgtap-version'
  ),
  '2:PAID:1000',
  'older invoice version cannot regress the stored projection'
);

select * from finish();
rollback;
