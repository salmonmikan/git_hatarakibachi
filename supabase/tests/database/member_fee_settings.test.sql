begin;

create extension if not exists pgtap with schema extensions;
select plan(29);

select is((select count(*) from public.member_fee_settings), 0::bigint, 'migration leaves settings absent');
select ok((select relrowsecurity from pg_class where oid = 'public.member_fee_settings'::regclass), 'RLS is enabled');
insert into public.member_fee_settings (square_environment, square_location_id, square_plan_variation_id)
values ('sandbox', 'synthetic-location', 'synthetic-plan');
select is((select id::integer from public.member_fee_settings), 1, 'id defaults to singleton');
select throws_ok($$insert into public.member_fee_settings values (2, 'sandbox', 'x', 'y')$$, '23514', null, 'other id rejected');
select throws_ok($$insert into public.member_fee_settings values (1, 'sandbox', 'x', 'y')$$, '23505', null, 'duplicate singleton rejected');
select throws_ok($$update public.member_fee_settings set square_environment = 'invalid'$$, '23514', null, 'invalid environment rejected');
select throws_ok($$update public.member_fee_settings set square_environment = null$$, '23502', null, 'square_environment null rejected');
select throws_ok($$update public.member_fee_settings set square_location_id = null$$, '23502', null, 'square_location_id null rejected');
select throws_ok($$update public.member_fee_settings set square_plan_variation_id = null$$, '23502', null, 'square_plan_variation_id null rejected');
select throws_ok($$update public.member_fee_settings set square_location_id = ''$$, '23514', null, 'square_location_id empty rejected');
select throws_ok($$update public.member_fee_settings set square_location_id = E' \t\n'$$, '23514', null, 'square_location_id whitespace rejected');
select throws_ok($$update public.member_fee_settings set square_plan_variation_id = ''$$, '23514', null, 'square_plan_variation_id empty rejected');
select throws_ok($$update public.member_fee_settings set square_plan_variation_id = E' \t\n'$$, '23514', null, 'square_plan_variation_id whitespace rejected');
select lives_ok($$update public.member_fee_settings set square_environment = 'production'$$, 'production is accepted');

set local role anon;
select throws_ok($$select * from public.member_fee_settings$$, '42501', null, 'anon cannot read');
select throws_ok($$insert into public.member_fee_settings values (1, 'sandbox', 'x', 'y')$$, '42501', null, 'anon cannot insert');
select throws_ok($$update public.member_fee_settings set square_location_id = 'x'$$, '42501', null, 'anon cannot update');
select throws_ok($$delete from public.member_fee_settings$$, '42501', null, 'anon cannot delete');
select throws_ok($$truncate public.member_fee_settings$$, '42501', null, 'anon cannot truncate');
reset role;

set local role authenticated;
select throws_ok($$select * from public.member_fee_settings$$, '42501', null, 'authenticated cannot read');
select throws_ok($$insert into public.member_fee_settings values (1, 'sandbox', 'x', 'y')$$, '42501', null, 'authenticated cannot insert');
select throws_ok($$update public.member_fee_settings set square_location_id = 'x'$$, '42501', null, 'authenticated cannot update');
select throws_ok($$delete from public.member_fee_settings$$, '42501', null, 'authenticated cannot delete');
select throws_ok($$truncate public.member_fee_settings$$, '42501', null, 'authenticated cannot truncate');
reset role;

set local role service_role;
select is((select count(*) from public.member_fee_settings), 1::bigint, 'service_role reads singleton');
select throws_ok($$insert into public.member_fee_settings values (1, 'sandbox', 'x', 'y')$$, '42501', null, 'service_role cannot insert');
select throws_ok($$update public.member_fee_settings set square_location_id = 'x'$$, '42501', null, 'service_role cannot update');
select throws_ok($$delete from public.member_fee_settings$$, '42501', null, 'service_role cannot delete');
select throws_ok($$truncate public.member_fee_settings$$, '42501', null, 'service_role cannot truncate');
reset role;

select * from finish();
rollback;
