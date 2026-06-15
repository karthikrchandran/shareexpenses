const assert = require('node:assert/strict');
const test = require('node:test');

const { buildTripCloseoutSummary } = require('../lib/tripCloseout.js');
const { polishTripCloseoutWithAI } = require('../lib/openaiCloseout.js');

const members = [
  { user_id: 'alice', user: { name: 'Alice' } },
  { user_id: 'bob', user: { name: 'Bob' } },
  { user_id: 'chris', user: { name: 'Chris' } },
];

const expenses = [
  {
    id: 'lodging-1',
    description: 'VRBO deposit',
    amount: 600,
    category: 'lodging',
    paid_by_user_id: 'alice',
    created_at: '2026-07-01T10:00:00Z',
  },
  {
    id: 'food-1',
    description: 'Dinner downtown',
    amount: 120,
    category: 'food',
    paid_by_user_id: 'bob',
    created_at: '2026-07-02T18:00:00Z',
  },
  {
    id: 'food-2',
    description: 'Dinner downtown',
    amount: 120,
    category: 'food',
    paid_by_user_id: 'chris',
    created_at: '2026-07-02T18:30:00Z',
  },
  {
    id: 'fuel-1',
    description: 'Gas stop',
    amount: 90,
    category: 'fuel',
    paid_by_user_id: 'chris',
    created_at: '2026-07-03T12:00:00Z',
  },
];

const splits = [
  { expense_id: 'lodging-1', user_id: 'alice', amount: 300 },
  { expense_id: 'lodging-1', user_id: 'bob', amount: 300 },
  { expense_id: 'food-1', user_id: 'alice', amount: 40 },
  { expense_id: 'food-1', user_id: 'bob', amount: 40 },
  { expense_id: 'food-1', user_id: 'chris', amount: 40 },
  { expense_id: 'food-2', user_id: 'alice', amount: 40 },
  { expense_id: 'food-2', user_id: 'bob', amount: 40 },
  { expense_id: 'food-2', user_id: 'chris', amount: 40 },
  { expense_id: 'fuel-1', user_id: 'alice', amount: 30 },
  { expense_id: 'fuel-1', user_id: 'bob', amount: 30 },
  { expense_id: 'fuel-1', user_id: 'chris', amount: 30 },
];

test('builds category totals and payer totals for a trip closeout', () => {
  const summary = buildTripCloseoutSummary({
    expenseSet: { id: 'set-1', name: 'Lake Trip' },
    expenses,
    members,
    splits,
    settledPayments: [],
  });

  assert.equal(summary.totalAmount, 930);
  assert.equal(summary.expenseCount, 4);
  assert.deepEqual(
    summary.categoryTotals.map((category) => [category.category, category.total]),
    [
      ['lodging', 600],
      ['food', 240],
      ['fuel', 90],
      ['groceries', 0],
      ['miscellaneous', 0],
    ]
  );
  assert.deepEqual(
    summary.payerTotals.map((payer) => [payer.name, payer.totalPaid]),
    [
      ['Alice', 600],
      ['Chris', 210],
      ['Bob', 120],
    ]
  );
});

test('builds settlement rows and copy-ready group message', () => {
  const summary = buildTripCloseoutSummary({
    expenseSet: { id: 'set-1', name: 'Lake Trip' },
    expenses,
    members,
    splits,
    settledPayments: [],
  });

  assert.deepEqual(
    summary.settlements.map((row) => [row.fromName, row.toName, row.amount]),
    [
      ['Bob', 'Alice', 190],
      ['Bob', 'Chris', 100],
    ]
  );
  assert.match(summary.groupMessage, /Lake Trip closeout/);
  assert.match(summary.groupMessage, /Bob pays Alice \$190\.00/);
  assert.match(summary.groupMessage, /Bob pays Chris \$100\.00/);
});

test('flags duplicate-looking expenses and unusual partial splits', () => {
  const summary = buildTripCloseoutSummary({
    expenseSet: { id: 'set-1', name: 'Lake Trip' },
    expenses,
    members,
    splits,
    settledPayments: [],
  });

  assert(
    summary.flags.some((flag) =>
      flag.includes('Possible duplicate: "Dinner downtown" appears 2 times for $120.00')
    )
  );
  assert(
    summary.flags.some((flag) =>
      flag.includes('VRBO deposit was split with 2 of 3 members')
    )
  );
});

test('returns deterministic AI fallback when no OpenAI key is configured', async () => {
  const summary = buildTripCloseoutSummary({
    expenseSet: { id: 'set-1', name: 'Lake Trip' },
    expenses,
    members,
    splits,
    settledPayments: [],
  });

  const result = await polishTripCloseoutWithAI(summary, { apiKey: '' });

  assert.equal(result.aiGenerated, false);
  assert.equal(result.aiModel, null);
  assert.equal(result.summary.narrative, summary.narrative);
});
