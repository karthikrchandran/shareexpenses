import { calculateSettlements as calculateSettlementsFromPayments } from './settlementCalculations';

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

export const calculateSettlements = calculateSettlementsFromPayments;

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
