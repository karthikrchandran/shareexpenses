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

function getSettlementPaymentMethods(options = {}) {
  const venmoConfigured = options.venmoConfigured === true;

  return [
    outsideAppMethod,
    {
      id: 'venmo',
      label: 'Venmo',
      description: venmoConfigured
        ? 'Pay through Venmo.'
        : 'Set up Venmo later.',
      disabled: !venmoConfigured,
    },
  ];
}

function buildOutsideAppSettlementMessage({ recipientName, amount }) {
  return `Marked ${currencyFormatter.format(amount)} as settled outside the app with ${recipientName}.`;
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
  buildOutsideAppSettlementMessage,
  getSettlementPaymentMethods,
  normalizeSettlementStatus,
};
