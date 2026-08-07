begin;

create extension if not exists pgtap with schema extensions;

select plan(50);

insert into public.admin_users (id, uuid, name)
values (930001, '00000000-0000-0000-0000-000000000001', 'Ticket test admin');

insert into public.ticket_events (
  id, slug, title, opens_at, closes_at, status, deleted_at
) values
  (910001, 'ticket-test-active', 'Active', now() - interval '1 hour', now() + interval '1 hour', 'published', null),
  (910002, 'ticket-test-draft', 'Draft', null, null, 'draft', null),
  (910003, 'ticket-test-closed', 'Closed', null, null, 'closed', null),
  (910004, 'ticket-test-deleted', 'Deleted', null, null, 'published', now()),
  (910005, 'ticket-test-future', 'Future', now() + interval '1 hour', null, 'published', null),
  (910006, 'ticket-test-past', 'Past', null, now() - interval '1 hour', 'published', null),
  (910007, 'ticket-test-other', 'Other', null, null, 'published', null),
  (910008, 'ticket-test-free', 'Free seating', null, null, 'published', null);

insert into public.ticket_windows (id, event_id, label, capacity, deleted_at)
values
  (920001, 910001, 'Capacity two', 2, null),
  (920002, 910007, 'Other event window', 10, null),
  (920003, 910001, 'Deleted window', 10, now());

insert into public.ticket_reservations (
  id, event_id, customer_name, customer_email, quantity
) values (
  940001, 910008, 'Legacy customer', 'legacy@example.com', 11
);

select ok(
  has_function_privilege(
    'anon',
    'public.create_ticket_reservation(bigint,bigint,text,text,integer,text)',
    'EXECUTE'
  ),
  'anon can execute only the public reservation RPC'
);

select ok(
  not has_table_privilege('anon', 'public.ticket_reservations', 'SELECT'),
  'anon has no reservation table SELECT privilege'
);

select ok(
  not has_schema_privilege('anon', 'private', 'USAGE'),
  'anon cannot access the private schema'
);

select ok(
  not has_function_privilege(
    'anon',
    'private.create_ticket_reservation(bigint,bigint,text,text,integer,text)',
    'EXECUTE'
  ),
  'anon cannot execute the private reservation function directly'
);

select ok(
  not has_function_privilege('anon', 'public.cancel_ticket_reservation(bigint)', 'EXECUTE'),
  'anon cannot execute the cancellation RPC'
);

select ok(
  has_function_privilege('authenticated', 'public.cancel_ticket_reservation(bigint)', 'EXECUTE'),
  'authenticated users can reach the admin-checked cancellation RPC'
);

select ok(
  not has_table_privilege('authenticated', 'public.ticket_reservations', 'INSERT'),
  'authenticated users have no direct reservation INSERT privilege'
);

select ok(
  not has_table_privilege('authenticated', 'public.ticket_reservations', 'UPDATE'),
  'authenticated users have no direct reservation UPDATE privilege'
);

select ok(
  not has_table_privilege('authenticated', 'public.ticket_reservations', 'DELETE'),
  'authenticated users have no direct reservation DELETE privilege'
);

select ok(
  not has_sequence_privilege('authenticated', 'public.ticket_reservations_id_seq', 'USAGE'),
  'authenticated users cannot allocate reservation IDs directly'
);

select ok(
  has_function_privilege(
    'anon',
    'public.get_ticket_window_availability(bigint)',
    'EXECUTE'
  ),
  'anon can read aggregate ticket window availability'
);

set local role anon;

select results_eq(
  $$
    select count(*)
    from public.create_ticket_reservation(
      910008, null, 'Anonymous customer', 'anon@example.com', 1, null
    )
    where reservation_code ~ '^[A-Z0-9]{10}$'
  $$,
  array[1::bigint],
  'anon reservation succeeds and returns only a reservation code'
);

select throws_ok(
  $$select * from public.ticket_reservations$$,
  '42501',
  'permission denied for table ticket_reservations',
  'anon cannot list reservations or personal information'
);

select throws_ok(
  $$
    insert into public.ticket_reservations (
      event_id, customer_name, customer_email, quantity
    ) values (910008, 'Direct', 'direct@example.com', 1)
  $$,
  '42501',
  'permission denied for table ticket_reservations',
  'anon cannot bypass the RPC with a direct insert'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910002, null, 'Test', 'test@example.com', 1, null)$$,
  'P0001',
  'Ticket event is not accepting reservations',
  'draft events reject reservations'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910003, null, 'Test', 'test@example.com', 1, null)$$,
  'P0001',
  'Ticket event is not accepting reservations',
  'closed events reject reservations'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910004, null, 'Test', 'test@example.com', 1, null)$$,
  'P0001',
  'Ticket event is not accepting reservations',
  'deleted events reject reservations'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910005, null, 'Test', 'test@example.com', 1, null)$$,
  'P0001',
  'Ticket reservation is not open',
  'events before their opening time reject reservations'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910006, null, 'Test', 'test@example.com', 1, null)$$,
  'P0001',
  'Ticket reservation is closed',
  'events after their closing time reject reservations'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910001, null, 'Test', 'test@example.com', 1, null)$$,
  'P0001',
  'A ticket window is required',
  'events with active windows require a window'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910001, 920002, 'Test', 'test@example.com', 1, null)$$,
  'P0001',
  'Ticket window is unavailable',
  'a window from another event is rejected'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910001, 920003, 'Test', 'test@example.com', 1, null)$$,
  'P0001',
  'Ticket window is unavailable',
  'a deleted window is rejected'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910008, null, 'Test', 'test@example.com', 0, null)$$,
  'P0001',
  'Ticket quantity must be between 1 and 10',
  'zero quantity is rejected in the database'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910008, null, 'Test', 'test@example.com', 11, null)$$,
  'P0001',
  'Ticket quantity must be between 1 and 10',
  'quantity above the UI maximum is rejected in the database'
);

select results_eq(
  $$
    select count(*)
    from public.create_ticket_reservation(
      910001, 920001, 'Capacity customer', 'capacity@example.com', 2, null
    )
  $$,
  array[1::bigint],
  'a reservation can fill the remaining capacity exactly'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910001, 920001, 'Overflow', 'overflow@example.com', 1, null)$$,
  'P0001',
  'Ticket window does not have enough capacity',
  'a reservation cannot exceed remaining capacity'
);

select results_eq(
  $$
    select window_id, capacity, reserved_quantity, remaining_quantity
    from public.get_ticket_window_availability(910001)
  $$,
  $$values (920001::bigint, 2, 2::bigint, 0::bigint)$$,
  'public availability returns remaining capacity without reservation details'
);

reset role;

select results_eq(
  $$
    select count(*)
    from public.ticket_reservations
    where window_id = 920001 and status = 'reserved' and deleted_at is null
  $$,
  array[1::bigint],
  'capacity rejection does not create a reservation'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);

select results_eq(
  $$select count(*) from public.ticket_events where id = 910001$$,
  array[1::bigint],
  'a non-admin authenticated user can read published event information'
);

select results_eq(
  $$select count(*) from public.ticket_windows where id in (920001, 920002, 920003)$$,
  array[2::bigint],
  'anon and authenticated users see only active windows of published events'
);

select results_eq(
  $$select count(*) from public.ticket_events where id = 910002$$,
  array[0::bigint],
  'a non-admin authenticated user cannot read a draft event'
);

select results_eq(
  $$select count(*) from public.ticket_reservations where event_id between 910001 and 910008$$,
  array[0::bigint],
  'a non-admin authenticated user cannot read reservations'
);

select results_eq(
  $$
    select count(*)
    from public.create_ticket_reservation(
      910008, null, 'Authenticated customer', 'authenticated@example.com', 1, null
    )
  $$,
  array[1::bigint],
  'a non-admin authenticated user can use the public reservation RPC'
);

select throws_ok(
  $$insert into public.ticket_events (slug, title) values ('ticket-test-unauthorized', 'Unauthorized')$$,
  '42501',
  'new row violates row-level security policy for table "ticket_events"',
  'a non-admin authenticated user cannot insert ticket events'
);

select is_empty(
  $$update public.ticket_events set title = 'Unauthorized' where id = 910002 returning id$$,
  'a non-admin authenticated user cannot update a draft event'
);

select is_empty(
  $$delete from public.ticket_events where id = 910001 returning id$$,
  'a non-admin authenticated user cannot delete ticket events'
);

select throws_ok(
  $$insert into public.ticket_windows (event_id, label, capacity) values (910001, 'Unauthorized', 1)$$,
  '42501',
  'new row violates row-level security policy for table "ticket_windows"',
  'a non-admin authenticated user cannot insert ticket windows'
);

select is_empty(
  $$update public.ticket_windows set label = 'Unauthorized' where id = 920001 returning id$$,
  'a non-admin authenticated user cannot update ticket windows'
);

select is_empty(
  $$delete from public.ticket_windows where id = 920001 returning id$$,
  'a non-admin authenticated user cannot delete ticket windows'
);

select throws_ok(
  $$
    insert into public.ticket_reservations (
      event_id, customer_name, customer_email, quantity
    ) values (910008, 'Unauthorized', 'unauthorized@example.com', 1)
  $$,
  '42501',
  'permission denied for table ticket_reservations',
  'a non-admin authenticated user cannot insert reservations directly'
);

select throws_ok(
  $$update public.ticket_reservations set status = 'cancelled' where id = 940001$$,
  '42501',
  'permission denied for table ticket_reservations',
  'a non-admin authenticated user cannot update reservations directly'
);

select throws_ok(
  $$delete from public.ticket_reservations where id = 940001$$,
  '42501',
  'permission denied for table ticket_reservations',
  'a non-admin authenticated user cannot delete reservations directly'
);

select throws_ok(
  $$select public.cancel_ticket_reservation(940001)$$,
  '42501',
  'Ticket reservation cancellation requires an administrator',
  'the cancellation RPC rejects a non-admin authenticated user'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select count(*) from public.ticket_events where id = 910002$$,
  array[1::bigint],
  'an admin can read draft events'
);

select results_eq(
  $$select count(*) from public.ticket_reservations where event_id between 910001 and 910008$$,
  array[4::bigint],
  'an admin can read reservations and personal information'
);

select throws_ok(
  $$insert into public.ticket_events (slug, title) values ('ticket-test/invalid', 'Invalid slug')$$,
  '23514',
  'new row for relation "ticket_events" violates check constraint "ticket_events_slug_path_segment_check"',
  'ticket slugs must be a single safe URL path segment'
);

select lives_ok(
  $$select public.cancel_ticket_reservation(940001)$$,
  'an admin can cancel a legacy reservation whose quantity exceeds the new public limit'
);

select results_eq(
  $$select status from public.ticket_reservations where id = 940001$$,
  array['cancelled'::text],
  'legacy reservation cancellation is persisted without rewriting its quantity'
);

select lives_ok(
  $$update public.ticket_events set title = 'Admin updated' where id = 910002$$,
  'an admin can update ticket events'
);

select results_eq(
  $$select title from public.ticket_events where id = 910002$$,
  array['Admin updated'::text],
  'the admin update is persisted'
);

select * from finish();
rollback;
