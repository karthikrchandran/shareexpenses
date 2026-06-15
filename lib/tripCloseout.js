const { getExpenseCategoryLabel, EXPENSE_CATEGORIES } = require('./expenseCategories.js');
const { calculateSettlements } = require('./settlementCalculations.js');

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function formatCurrency(value) {
  return currencyFormatter.format(roundMoney(value));
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function buildUserNameMap(members = []) {
  return members.reduce((acc, member) => {
    const userId = member.user_id || member.id;
    acc[userId] = member.user?.name || member.name || member.user?.email || 'Member';
    return acc;
  }, {});
}

function getExpenseSplits(expenseId, splits = []) {
  return splits.filter((split) => split.expense_id === expenseId);
}

function buildCategoryTotals(expenses = []) {
  const totalsByCategory = EXPENSE_CATEGORIES.reduce((acc, category) => {
    acc[category.value] = {
      category: category.value,
      label: category.label,
      total: 0,
      expenseCount: 0,
      percentage: 0,
    };
    return acc;
  }, {});

  expenses.forEach((expense) => {
    const category = totalsByCategory[expense.category]
      ? expense.category
      : 'miscellaneous';
    totalsByCategory[category].total = roundMoney(totalsByCategory[category].total + Number(expense.amount || 0));
    totalsByCategory[category].expenseCount += 1;
  });

  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  return Object.values(totalsByCategory)
    .map((category) => ({
      ...category,
      total: roundMoney(category.total),
      percentage: totalAmount > 0 ? roundMoney((category.total / totalAmount) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

function buildPayerTotals(expenses = [], usersById = {}) {
  const totals = {};

  expenses.forEach((expense) => {
    const payerId = expense.paid_by_user_id;
    totals[payerId] = roundMoney((totals[payerId] || 0) + Number(expense.amount || 0));
  });

  return Object.entries(totals)
    .map(([userId, totalPaid]) => ({
      userId,
      name: usersById[userId] || 'Member',
      totalPaid,
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid || a.name.localeCompare(b.name));
}

function buildSettlementRows(expenses = [], splits = [], settledPayments = [], usersById = {}) {
  const matrix = calculateSettlements(expenses, splits, settledPayments);
  const rows = [];

  Object.entries(matrix).forEach(([fromUserId, creditors]) => {
    Object.entries(creditors).forEach(([toUserId, amount]) => {
      rows.push({
        fromUserId,
        fromName: usersById[fromUserId] || 'Member',
        toUserId,
        toName: usersById[toUserId] || 'Member',
        amount: roundMoney(amount),
      });
    });
  });

  return rows.sort((a, b) => b.amount - a.amount || a.fromName.localeCompare(b.fromName));
}

function buildLargestExpenses(expenses = [], usersById = {}) {
  return [...expenses]
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, 3)
    .map((expense) => ({
      id: expense.id,
      description: expense.description,
      amount: roundMoney(expense.amount),
      category: expense.category || 'miscellaneous',
      categoryLabel: getExpenseCategoryLabel(expense.category),
      paidByName: usersById[expense.paid_by_user_id] || 'Member',
      createdAt: expense.created_at,
    }));
}

function buildDuplicateFlags(expenses = []) {
  const grouped = {};

  expenses.forEach((expense) => {
    const key = `${normalizeText(expense.description)}::${roundMoney(expense.amount)}`;
    grouped[key] = grouped[key] || [];
    grouped[key].push(expense);
  });

  return Object.values(grouped)
    .filter((items) => items.length > 1)
    .map((items) => {
      const first = items[0];
      return `Possible duplicate: "${first.description}" appears ${items.length} times for ${formatCurrency(first.amount)}.`;
    });
}

function buildSplitFlags(expenses = [], splits = [], members = []) {
  const memberCount = members.length;
  if (memberCount <= 1) return [];

  return expenses
    .filter((expense) => {
      const splitCount = new Set(getExpenseSplits(expense.id, splits).map((split) => split.user_id)).size;
      return splitCount > 0 && splitCount < memberCount;
    })
    .map((expense) => {
      const splitCount = new Set(getExpenseSplits(expense.id, splits).map((split) => split.user_id)).size;
      return `${expense.description} was split with ${splitCount} of ${memberCount} members.`;
    });
}

function buildInsights({ categoryTotals, payerTotals, largestExpenses, settlements }) {
  const insights = [];
  const topCategory = categoryTotals.find((category) => category.total > 0);
  const topPayer = payerTotals[0];
  const largestExpense = largestExpenses[0];

  if (topCategory) {
    insights.push(`${topCategory.label} was the largest category at ${formatCurrency(topCategory.total)}.`);
  }

  if (topPayer) {
    insights.push(`${topPayer.name} paid the most upfront: ${formatCurrency(topPayer.totalPaid)}.`);
  }

  if (largestExpense) {
    insights.push(`Largest single expense: ${largestExpense.description} at ${formatCurrency(largestExpense.amount)}.`);
  }

  if (settlements.length === 0) {
    insights.push('Everyone is settled up based on the recorded expenses and payments.');
  } else {
    insights.push(`${settlements.length} settlement ${settlements.length === 1 ? 'payment is' : 'payments are'} needed to close the trip.`);
  }

  return insights;
}

function buildGroupMessage(expenseSetName, totalAmount, categoryTotals, settlements) {
  const activeCategories = categoryTotals
    .filter((category) => category.total > 0)
    .slice(0, 4)
    .map((category) => `${category.label}: ${formatCurrency(category.total)}`);

  const settlementLines = settlements.length > 0
    ? settlements.map((row) => `${row.fromName} pays ${row.toName} ${formatCurrency(row.amount)}`)
    : ['No outstanding payments based on the current ledger.'];

  return [
    `${expenseSetName} closeout`,
    `Total shared spend: ${formatCurrency(totalAmount)}`,
    activeCategories.length > 0 ? `Category totals: ${activeCategories.join('; ')}` : 'No category totals yet.',
    `Settlements: ${settlementLines.join('; ')}`,
  ].join('\n');
}

function buildTripCloseoutSummary({
  expenseSet,
  expenses = [],
  members = [],
  splits = [],
  settledPayments = [],
  generatedAt = new Date().toISOString(),
}) {
  if (!expenseSet?.id) {
    throw new Error('Expense Set is required');
  }

  if (expenses.length === 0) {
    throw new Error('Add expenses before generating a closeout');
  }

  const usersById = buildUserNameMap(members);
  const totalAmount = roundMoney(expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0));
  const categoryTotals = buildCategoryTotals(expenses);
  const payerTotals = buildPayerTotals(expenses, usersById);
  const settlements = buildSettlementRows(expenses, splits, settledPayments, usersById);
  const largestExpenses = buildLargestExpenses(expenses, usersById);
  const flags = [
    ...buildDuplicateFlags(expenses),
    ...buildSplitFlags(expenses, splits, members),
  ];
  const insights = buildInsights({
    categoryTotals,
    payerTotals,
    largestExpenses,
    settlements,
  });
  const narrative = `${expenseSet.name} has ${expenses.length} expenses totaling ${formatCurrency(totalAmount)}. ${insights.join(' ')}`;

  return {
    version: 1,
    expenseSetId: expenseSet.id,
    expenseSetName: expenseSet.name,
    generatedAt,
    totalAmount,
    expenseCount: expenses.length,
    memberCount: members.length,
    categoryTotals,
    payerTotals,
    settlements,
    largestExpenses,
    insights,
    flags,
    narrative,
    groupMessage: buildGroupMessage(expenseSet.name, totalAmount, categoryTotals, settlements),
  };
}

module.exports = {
  buildTripCloseoutSummary,
  formatCurrency,
};
