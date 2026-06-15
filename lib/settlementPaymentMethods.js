const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const outsideAppMethod = {
  id: 'outside-app',
  label: 'Cash / outside app',
  description: 'Record that this settlement happened outside ShareExpenses.',
  disabled: false,
};

function getSettlementPaymentMethods() {
  return [
    outsideAppMethod,
    {
      id: 'venmo',
      label: 'Venmo',
      description: 'Open Venmo or copy details, then record the result.',
      disabled: false,
    },
    {
      id: 'cash-app',
      label: 'Cash App',
      description: 'Open Cash App or copy details, then record the result.',
      disabled: false,
    },
  ];
}

function buildOutsideAppSettlementMessage({ recipientName, amount }) {
  return `Marked ${currencyFormatter.format(amount)} as settled outside the app with ${recipientName}.`;
}

function buildPaymentHandoffMessage({ methodLabel, recipientName, amount, paymentStatus }) {
  return `Marked ${currencyFormatter.format(amount)} as ${paymentStatus} via ${methodLabel} with ${recipientName}. Complete or confirm the payment outside ShareExpenses.`;
}

function normalizeSettlementStatus(status) {
  if (status === undefined || status === null || status === '') {
    return 'paid';
  }

  if (status === 'pending' || status === 'paid' || status === 'confirmed') {
    return status;
  }

  throw new Error('Unsupported settlement status');
}

module.exports = {
  buildPaymentHandoffMessage,
  buildOutsideAppSettlementMessage,
  getSettlementPaymentMethods,
  normalizeSettlementStatus,
};
