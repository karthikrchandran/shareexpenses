const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEFAULT_EXPENSE_CATEGORY,
  EXPENSE_CATEGORIES,
  getExpenseCategoryLabel,
  normalizeExpenseCategory,
} = require('../lib/expenseCategories.js');

test('defines trip-ready expense categories', () => {
  assert.deepEqual(
    EXPENSE_CATEGORIES.map((category) => category.value),
    ['lodging', 'food', 'groceries', 'fuel', 'miscellaneous']
  );
});

test('defaults missing expense categories to miscellaneous', () => {
  assert.equal(DEFAULT_EXPENSE_CATEGORY, 'miscellaneous');
  assert.equal(normalizeExpenseCategory(undefined), 'miscellaneous');
  assert.equal(normalizeExpenseCategory(''), 'miscellaneous');
});

test('normalizes supported expense category values', () => {
  assert.equal(normalizeExpenseCategory(' Lodging '), 'lodging');
  assert.equal(normalizeExpenseCategory('FUEL'), 'fuel');
});

test('rejects unsupported expense categories', () => {
  assert.throws(
    () => normalizeExpenseCategory('car-rental'),
    /Expense category is not supported/
  );
});

test('returns user-facing labels for expense categories', () => {
  assert.equal(getExpenseCategoryLabel('lodging'), 'VRBO / Airbnb');
  assert.equal(getExpenseCategoryLabel('unknown'), 'Miscellaneous');
});
