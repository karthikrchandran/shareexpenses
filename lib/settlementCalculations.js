function addBalance(balances, userId, amount) {
  if (!userId) return;
  balances[userId] = (balances[userId] || 0) + Number(amount || 0);
}

function calculateSettlements(expenses = [], splits = [], settledPayments = []) {
  const balances = {};

  expenses.forEach((expense) => {
    addBalance(balances, expense.paid_by_user_id, 0);
  });
  splits.forEach((split) => {
    addBalance(balances, split.user_id, 0);
  });
  settledPayments.forEach((payment) => {
    addBalance(balances, payment.from_user_id || payment.from, 0);
    addBalance(balances, payment.to_user_id || payment.to, 0);
  });

  expenses.forEach((expense) => {
    addBalance(balances, expense.paid_by_user_id, expense.amount);
  });

  splits.forEach((split) => {
    addBalance(balances, split.user_id, -Number(split.amount || 0));
  });

  settledPayments.forEach((payment) => {
    if (payment.settled === false) return;

    const fromUserId = payment.from_user_id || payment.from;
    const toUserId = payment.to_user_id || payment.to;
    const amount = Number(payment.amount || 0);

    if (!fromUserId || !toUserId || amount <= 0) return;

    addBalance(balances, fromUserId, amount);
    addBalance(balances, toUserId, -amount);
  });

  return simplifySettlements(balances);
}

function simplifySettlements(balances) {
  const settlements = {};
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance < -0.01) {
      debtors.push([userId, -balance]);
    } else if (balance > 0.01) {
      creditors.push([userId, balance]);
    }
  });

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const [debtorId, debtAmount] = debtors[i];
    const [creditorId, creditAmount] = creditors[j];
    const amount = Math.min(debtAmount, creditAmount);

    if (!settlements[debtorId]) {
      settlements[debtorId] = {};
    }
    settlements[debtorId][creditorId] = Number(amount.toFixed(2));

    debtors[i][1] -= amount;
    creditors[j][1] -= amount;

    if (Math.abs(debtors[i][1]) < 0.01) i += 1;
    if (Math.abs(creditors[j][1]) < 0.01) j += 1;
  }

  return settlements;
}

module.exports = {
  calculateSettlements,
};
