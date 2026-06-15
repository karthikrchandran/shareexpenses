const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeExpenseDate,
  normalizeExpenseNotes,
} = require('../lib/expenseMetadata.js');

test('normalizes a valid expense date to YYYY-MM-DD', () => {
  assert.equal(normalizeExpenseDate('2026-07-04'), '2026-07-04');
});

test('defaults missing expense date to today from the supplied clock', () => {
  assert.equal(
    normalizeExpenseDate(undefined, () => new Date('2026-06-15T15:30:00.000Z')),
    '2026-06-15'
  );
});

test('rejects malformed expense dates', () => {
  assert.throws(() => normalizeExpenseDate('07/04/2026'), /Expense date must use YYYY-MM-DD/);
});

test('trims notes and stores empty notes as null', () => {
  assert.equal(normalizeExpenseNotes('  grocery run for dinner  '), 'grocery run for dinner');
  assert.equal(normalizeExpenseNotes('   '), null);
});
