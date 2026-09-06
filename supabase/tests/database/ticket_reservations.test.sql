begin;

create extension if not exists pgtap with schema extensions;

select plan(80);

insert into public.admin_users (id, uuid, name)
values (930001, '00000000-0000-0000-0000-000000000001', 'Ticket test admin');

insert into public.ticket_events (
  id, slug, title, opens_at, closes_at, status, deleted_at, sanity_performance_id
) values
  (910001, 'ticket-test-active', 'Active', now() - interval '1 hour', now() + interval '1 hour', 'published', null, 'sanity-performance-active'),
  (910002, 'ticket-test-draft', 'Draft', null, null, 'draft', null, null),
  (910003, 'ticket-test-closed', 'Closed', null, null, 'closed', null, 'sanity-performance-closed'),
  (910004, 'ticket-test-deleted', 'Deleted', null, null, 'published', now(), 'sanity-performance-deleted'),
  (910005, 'ticket-test-future', 'Future', now() + interval '1 hour', null, 'published', null, 'sanity-performance-future'),
  (910006, 'ticket-test-past', 'Past', null, now() - interval '1 hour', 'published', null, 'sanity-performance-past'),
  (910007, 'ticket-test-other', 'Other', null, null, 'published', null, 'sanity-performance-other'),
  (910008, 'ticket-test-free', 'Free seating', null, null, 'published', null, 'sanity-performance-free'),
  (910009, 'ticket-test-started-window', 'Started window', null, null, 'published', null, 'sanity-performance-started-window');

insert into public.ticket_windows (id, event_id, label, capacity, deleted_at)
values
  (920001, 910001, 'Capacity two', 2, null),
  (920002, 910007, 'Other event window', 10, null),
  (920003, 910001, 'Deleted window', 10, now()),
  (920004, 910009, 'Started window', 10, null);

update public.ticket_windows
set starts_at = now() - interval '1 hour'
where id = 920004;

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
  has_function_privilege(
    'anon',
    'public.create_ticket_reservation(bigint,bigint,text,text,integer,text,uuid)',
    'EXECUTE'
  ),
  'anon can execute the idempotent public reservation RPC'
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
  not has_table_privilege('authenticated', 'public.ticket_windows', 'DELETE'),
  'authenticated users cannot physically delete ticket windows'
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

select ok(
  has_function_privilege(
    'anon',
    'public.get_ticket_event_window_history(bigint)',
    'EXECUTE'
  ),
  'anon can read whether a published event has reservation window history'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.get_ticket_window_reservation_totals()',
    'EXECUTE'
  ),
  'anon cannot execute admin reservation totals'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.get_ticket_window_reservation_totals()',
    'EXECUTE'
  ),
  'authenticated users reach the admin-checked reservation totals RPC'
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

select results_eq(
  $$
    select count(*)
    from public.create_ticket_reservation(
      910008, null, 'Idempotent customer', 'idempotent@example.com', 1, null,
      '00000000-0000-0000-0000-000000000101'::uuid
    )
  $$,
  array[1::bigint],
  'a reservation request with an ID succeeds'
);

select results_eq(
  $$
    select first.reservation_code = retry.reservation_code
    from public.create_ticket_reservation(
      910008, null, 'First customer', 'first@example.com', 1, null,
      '00000000-0000-0000-0000-000000000101'::uuid
    ) first
    cross join public.create_ticket_reservation(
      910008, null, 'Changed customer', 'changed@example.com', 1, null,
      '00000000-0000-0000-0000-000000000101'::uuid
    ) retry
  $$,
  $$values (true)$$,
  'repeating a reservation request ID returns the existing reservation code'
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
  $$select * from public.create_ticket_reservation(910009, 920004, 'Test', 'test@example.com', 1, null)$$,
  'P0001',
  'Ticket window has already started',
  'a reservation cannot target a window that has already started'
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

select throws_ok(
  $$select * from public.create_ticket_reservation(910008, null, repeat('N', 201), 'test@example.com', 1, null)$$,
  '23514',
  'new row for relation "ticket_reservations" violates check constraint "ticket_reservations_customer_name_length_check"',
  'customer names are length-limited in the database'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910008, null, 'Test', repeat('e', 321) || '@example.com', 1, null)$$,
  '23514',
  'new row for relation "ticket_reservations" violates check constraint "ticket_reservations_customer_email_length_check"',
  'customer email addresses are length-limited in the database'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910008, null, 'Test', 'test@example.com', 1, repeat('N', 2001))$$,
  '23514',
  'new row for relation "ticket_reservations" violates check constraint "ticket_reservations_note_length_check"',
  'reservation notes are length-limited in the database'
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
  $$select count(*) from public.ticket_events where id = 910003$$,
  array[1::bigint],
  'a non-admin authenticated user can read a manually closed ticket page'
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

select throws_ok(
  $$delete from public.ticket_windows where id = 920001 returning id$$,
  '42501',
  'permission denied for table ticket_windows',
  'a non-admin authenticated user cannot physically delete ticket windows'
);

select throws_ok(
  $$select public.delete_ticket_window(920001)$$,
  '42501',
  'Ticket window deletion requires an administrator',
  'a non-admin authenticated user cannot soft-delete ticket windows'
);

select throws_ok(
  $$select * from public.get_ticket_window_reservation_totals()$$,
  '42501',
  'Ticket reservation totals require an administrator',
  'a non-admin authenticated user cannot read reservation totals'
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
  array[5::bigint],
  'an admin can read reservations and personal information'
);

select results_eq(
  $$select (public.get_ticket_window_reservation_totals() ->> '920001')::bigint$$,
  array[2::bigint],
  'an admin receives database-aggregated reservation totals'
);

select throws_ok(
  $$insert into public.ticket_windows (event_id, label, capacity) values (910008, 'Late window', 10)$$,
  'P0001',
  'Cannot add ticket windows after free-seating reservations',
  'free-seating events with reservations cannot add ticket windows'
);

select throws_ok(
  $$update public.ticket_windows set event_id = 910007 where id = 920001$$,
  'P0001',
  'Ticket windows with reservations cannot change events',
  'a ticket window with reservation history cannot move to another event'
);

select throws_ok(
  $$insert into public.ticket_events (slug, title, status) values ('ticket-test-unlinked-published', 'Unlinked published', 'published')$$,
  '23514',
  'new row for relation "ticket_events" violates check constraint "ticket_events_published_sanity_check"',
  'published ticket events require a Sanity performance link'
);

select throws_ok(
  $$insert into public.ticket_events (slug, title, status) values ('ticket-test-unlinked-closed', 'Unlinked closed', 'closed')$$,
  '23514',
  'new row for relation "ticket_events" violates check constraint "ticket_events_published_sanity_check"',
  'closed ticket events require a Sanity performance link'
);

select throws_ok(
  $$insert into public.ticket_events (slug, title, opens_at, closes_at) values ('ticket-test-invalid-time', 'Invalid time', now(), now() - interval '1 minute')$$,
  '23514',
  'new row for relation "ticket_events" violates check constraint "ticket_events_time_order_check"',
  'ticket event受付日時 cannot end before it starts'
);

select throws_ok(
  $$insert into public.ticket_events (slug, title) values ('ticket-test-blank-title', '   ')$$,
  '23514',
  'new row for relation "ticket_events" violates check constraint "ticket_events_title_check"',
  'blank ticket event titles are rejected'
);

select throws_ok(
  $$update public.ticket_windows set capacity = 1 where id = 920001$$,
  'P0001',
  'Ticket window capacity cannot be lower than active reservations',
  'ticket window capacity cannot be reduced below active reservations'
);

select throws_ok(
  $$insert into public.ticket_windows (event_id, label, capacity) values (910001, '   ', 1)$$,
  '23514',
  'new row for relation "ticket_windows" violates check constraint "ticket_windows_label_check"',
  'blank ticket window labels are rejected'
);

select throws_ok(
  $$update public.ticket_windows set label = '   ' where id = 920001$$,
  '23514',
  'new row for relation "ticket_windows" violates check constraint "ticket_windows_label_check"',
  'blank ticket window label updates are rejected'
);

select results_eq(
  $$
    with previous as (
      select updated_at
      from public.ticket_windows
      where id = 920001
    )
    update public.ticket_windows
    set label = 'Updated capacity window'
    where id = 920001
    returning (updated_at > (select updated_at from previous))::integer
  $$,
  array[1::integer],
  'updating a ticket window refreshes updated_at'
);

select lives_ok(
  $$select public.delete_ticket_window(920001)$$,
  'an admin can soft-delete a ticket window'
);

select throws_ok(
  $$select * from public.create_ticket_reservation(910001, null, 'No window', 'no-window@example.com', 1, null)$$,
  'P0001',
  'A ticket window is required',
  'deleting all windows does not silently convert a windowed event to free seating'
);

select results_eq(
  $$select (deleted_at is not null)::integer from public.ticket_windows where id = 920001$$,
  array[1::integer],
  'soft-deleting a ticket window marks it deleted'
);

select results_eq(
  $$select count(*) from public.ticket_reservations where window_id = 920001$$,
  array[1::bigint],
  'soft-deleting a ticket window preserves reservation history'
);

select results_eq(
  $$select public.get_ticket_event_window_history(910001), public.get_ticket_event_window_history(910008)$$,
  $$values (true, false)$$,
  'public window history distinguishes windowed and free-seating events'
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

select results_eq(
  $$
    with previous as (
      select updated_at
      from public.ticket_events
      where id = 910002
    )
    update public.ticket_events
    set title = 'Admin updated'
    where id = 910002
    returning (updated_at > (select updated_at from previous))::integer
  $$,
  array[1::integer],
  'updating a ticket event refreshes updated_at'
);

select results_eq(
  $$select title from public.ticket_events where id = 910002$$,
  array['Admin updated'::text],
  'the admin update is persisted'
);

select * from finish();
rollback;
