const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getSettlementPaymentMethods,
  buildOutsideAppSettlementMessage,
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
