import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import { fromDatetimeLocal, toDatetimeLocal } from './datetimeLocal.js';

process.env.TZ = 'Asia/Tokyo';

test('UTCの日時をローカル日時としてdatetime-local向けに表示する', () => {
  assert.equal(toDatetimeLocal('2026-08-06T10:00:00.000Z'), '2026-08-06T19:00');
});

test('datetime-localのローカル日時をUTCへ変換する', () => {
  assert.equal(fromDatetimeLocal('2026-08-06T19:00'), '2026-08-06T10:00:00.000Z');
});

test('表示した日時を変更せず保存しても時刻がずれない', () => {
  const stored = '2026-08-06T10:00:30.123Z';
  assert.equal(fromDatetimeLocal(toDatetimeLocal(stored), stored), stored);
});

test('UTCからローカル日時への変換で日付を正しく繰り上げる', () => {
  assert.equal(toDatetimeLocal('2026-08-06T18:30:00.000Z'), '2026-08-07T03:30');
});
