/**
 * Calculate splits for an expense
 */
export function calculateEvenSplit(amount: number, participantCount: number): number {
  return Number((amount / participantCount).toFixed(2));
}

/**
 * Calculate custom splits with remainder handling
 */
export function calculateCustomSplits(
  amount: number,
  splits: { userId: string; percentage?: number }[]
): Record<string, number> {
  const result: Record<string, number> = {};
  let totalAllocated = 0;

  splits.forEach((split, index) => {
    const percentage = split.percentage || 100 / splits.length;
    const splitAmount = Number((amount * (percentage / 100)).toFixed(2));
    result[split.userId] = splitAmount;
    totalAllocated += splitAmount;
  });

  // Handle rounding errors by adjusting the first participant
  const remainder = Number((amount - totalAllocated).toFixed(2));
  if (remainder !== 0 && splits.length > 0) {
    result[splits[0].userId] += remainder;
  }

  return result;
}

/**
 * Calculate who owes whom
 */
export function calculateSettlements(
  expenses: any[],
  splits: any[]
): Record<string, Record<string, number>> {
  const balances: Record<string, number> = {};

  // Initialize balances
  const allUsers = new Set<string>();
  expenses.forEach((exp) => {
    allUsers.add(exp.paid_by_user_id);
  });
  splits.forEach((split) => {
    allUsers.add(split.user_id);
  });
  allUsers.forEach((userId) => {
    balances[userId] = 0;
  });

  // Calculate balances (positive = owed money, negative = owes money)
  expenses.forEach((expense) => {
    balances[expense.paid_by_user_id] += expense.amount;
  });

  splits.forEach((split) => {
    balances[split.user_id] -= split.amount;
  });

  // Simplify settlements
  return simplifySettlements(balances);
}

/**
 * Simplify settlements using greedy algorithm
 */
function simplifySettlements(
  balances: Record<string, number>
): Record<string, Record<string, number>> {
  const settlements: Record<string, Record<string, number>> = {};

  const debtors: Array<[string, number]> = [];
  const creditors: Array<[string, number]> = [];

  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance < -0.01) {
      debtors.push([userId, -balance]);
    } else if (balance > 0.01) {
      creditors.push([userId, balance]);
    }
  });

  debtors.forEach(([debtorId]) => {
    if (!settlements[debtorId]) {
      settlements[debtorId] = {};
    }
  });

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const [debtorId, debtAmount] = debtors[i];
    const [creditorId, credAmount] = creditors[j];

    const settlement = Math.min(debtAmount, credAmount);
    settlements[debtorId][creditorId] = Number(settlement.toFixed(2));

    debtors[i][1] -= settlement;
    creditors[j][1] -= settlement;

    if (Math.abs(debtors[i][1]) < 0.01) i++;
    if (Math.abs(creditors[j][1]) < 0.01) j++;
  }

  return settlements;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}
