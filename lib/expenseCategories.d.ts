export type ExpenseCategoryValue =
  | 'lodging'
  | 'food'
  | 'groceries'
  | 'fuel'
  | 'miscellaneous';

export interface ExpenseCategory {
  value: ExpenseCategoryValue;
  label: string;
  description: string;
}

export const DEFAULT_EXPENSE_CATEGORY: ExpenseCategoryValue;
export const EXPENSE_CATEGORIES: readonly ExpenseCategory[];

export function normalizeExpenseCategory(
  category: string | null | undefined
): ExpenseCategoryValue;

export function getExpenseCategoryLabel(
  category: string | null | undefined
): string;
