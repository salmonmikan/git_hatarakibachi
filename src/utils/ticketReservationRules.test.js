import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextTicketEventBoundary,
  getTicketReservationMaxQuantity,
  MAX_TICKET_QUANTITY,
} from './ticketReservationRules.js';

test('returns the next event受付 boundary and ignores past boundaries', () => {
  const now = Date.parse('2026-08-07T00:00:00.000Z');
  assert.equal(
    getNextTicketEventBoundary({
      opens_at: '2026-08-07T01:00:00.000Z',
      closes_at: '2026-08-07T02:00:00.000Z',
    }, now),
    Date.parse('2026-08-07T01:00:00.000Z')
  );
  assert.equal(
    getNextTicketEventBoundary({
      opens_at: '2026-08-06T23:00:00.000Z',
      closes_at: '2026-08-06T23:30:00.000Z',
    }, now),
    null
  );
});

test('free-seating and unlimited windows keep the public quantity limit', () => {
  assert.equal(getTicketReservationMaxQuantity(null), MAX_TICKET_QUANTITY);
  assert.equal(getTicketReservationMaxQuantity({ capacity: 0 }), MAX_TICKET_QUANTITY);
});

test('finite windows limit quantity by remaining seats and the public maximum', () => {
  assert.equal(getTicketReservationMaxQuantity({ capacity: 10, remaining_quantity: 3 }), 3);
  assert.equal(getTicketReservationMaxQuantity({ capacity: 20, remaining_quantity: 12 }), 10);
  assert.equal(getTicketReservationMaxQuantity({ capacity: 10, remaining_quantity: 0 }), 0);
});
