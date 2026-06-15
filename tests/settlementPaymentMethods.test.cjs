const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getSettlementPaymentMethods,
  buildOutsideAppSettlementMessage,
  normalizeSettlementStatus,
} = require('../lib/settlementPaymentMethods.js');

test('cash outside app is available before Venmo is configured', () => {
  const methods = getSettlementPaymentMethods({ venmoConfigured: false });

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
        disabled: true,
      },
    ]
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
