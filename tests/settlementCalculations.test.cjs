const assert = require('node:assert/strict');
const test = require('node:test');

let settlementCalculations = {};
try {
  settlementCalculations = require('../lib/settlementCalculations.js');
} catch {
  settlementCalculations = {};
}

const { calculateSettlements } = settlementCalculations;

test('a settled transfer clears the matching outstanding balance', () => {
  assert.equal(typeof calculateSettlements, 'function');

  const expenses = [
    { id: 'expense-1', paid_by_user_id: 'alice', amount: 100 },
  ];
  const splits = [
    { expense_id: 'expense-1', user_id: 'alice', amount: 50 },
    { expense_id: 'expense-1', user_id: 'bob', amount: 50 },
  ];
  const settledPayments = [
    {
      from_user_id: 'bob',
      to_user_id: 'alice',
      amount: 50,
      settled: true,
    },
  ];

  assert.deepEqual(calculateSettlements(expenses, splits, settledPayments), {});
});

test('a partial settled transfer leaves only the remaining balance', () => {
  assert.equal(typeof calculateSettlements, 'function');

  const expenses = [
    { id: 'expense-1', paid_by_user_id: 'alice', amount: 100 },
  ];
  const splits = [
    { expense_id: 'expense-1', user_id: 'alice', amount: 50 },
    { expense_id: 'expense-1', user_id: 'bob', amount: 50 },
  ];
  const settledPayments = [
    {
      from_user_id: 'bob',
      to_user_id: 'alice',
      amount: 20,
      settled: true,
    },
  ];

  assert.deepEqual(calculateSettlements(expenses, splits, settledPayments), {
    bob: { alice: 30 },
  });
});
