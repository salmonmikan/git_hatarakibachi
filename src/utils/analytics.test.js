import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePageType } from './analytics.js';

test('チケット予約ページを予約ページとして分類する', () => {
  assert.equal(resolvePageType('/tickets/summer-2026'), 'ticket_reservation');
});
