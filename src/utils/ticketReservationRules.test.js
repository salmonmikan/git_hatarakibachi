import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTicketReservationMaxQuantity,
  MAX_TICKET_QUANTITY,
} from './ticketReservationRules.js';

test('free-seating and unlimited windows keep the public quantity limit', () => {
  assert.equal(getTicketReservationMaxQuantity(null), MAX_TICKET_QUANTITY);
  assert.equal(getTicketReservationMaxQuantity({ capacity: 0 }), MAX_TICKET_QUANTITY);
});

test('finite windows limit quantity by remaining seats and the public maximum', () => {
  assert.equal(getTicketReservationMaxQuantity({ capacity: 10, remaining_quantity: 3 }), 3);
  assert.equal(getTicketReservationMaxQuantity({ capacity: 20, remaining_quantity: 12 }), 10);
  assert.equal(getTicketReservationMaxQuantity({ capacity: 10, remaining_quantity: 0 }), 0);
});
