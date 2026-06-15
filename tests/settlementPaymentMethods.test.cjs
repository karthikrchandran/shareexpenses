const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getSettlementPaymentMethods,
  buildPaymentHandoffMessage,
  buildOutsideAppSettlementMessage,
  normalizeSettlementStatus,
} = require('../lib/settlementPaymentMethods.js');

test('friend payment handoff methods are available without provider credentials', () => {
  const methods = getSettlementPaymentMethods();

  assert.deepEqual(
    methods.map((method) => ({
      id: method.id,
      label: method.label,
      disabled: method.disabled,
    })),
    [
      {
        id: 'outside-app',
        label: 'Cash / outside app',
        disabled: false,
      },
      {
        id: 'venmo',
        label: 'Venmo',
        disabled: false,
      },
      {
        id: 'cash-app',
        label: 'Cash App',
        disabled: false,
      },
    ]
  );
});

test('payment handoff message is clear that payment happened outside the app', () => {
  assert.equal(
    buildPaymentHandoffMessage({
      methodLabel: 'Venmo',
      recipientName: 'Alice',
      amount: 12.5,
      paymentStatus: 'pending',
    }),
    'Marked $12.50 as pending via Venmo with Alice. Complete or confirm the payment outside ShareExpenses.'
  );
});

test('outside app settlement message names the recipient and amount', () => {
  assert.equal(
    buildOutsideAppSettlementMessage({ recipientName: 'Alice', amount: 12.5 }),
    'Marked $12.50 as settled outside the app with Alice.'
  );
});

test('settlement status defaults to paid and accepts pending', () => {
  assert.equal(normalizeSettlementStatus(undefined), 'paid');
  assert.equal(normalizeSettlementStatus('pending'), 'pending');
});

test('settlement status rejects unsupported values', () => {
  assert.throws(() => normalizeSettlementStatus('maybe'), /Unsupported settlement status/);
});
