const DEFAULT_EXPENSE_CATEGORY = 'miscellaneous';

const EXPENSE_CATEGORIES = Object.freeze([
  Object.freeze({
    value: 'lodging',
    label: 'VRBO / Airbnb',
    description: 'Trip lodging, vacation rentals, deposits, and host fees.',
  }),
  Object.freeze({
    value: 'food',
    label: 'Food',
    description: 'Restaurants, takeout, coffee, snacks, and shared meals.',
  }),
  Object.freeze({
    value: 'groceries',
    label: 'Groceries',
    description: 'Shared grocery runs, supplies, and pantry items.',
  }),
  Object.freeze({
    value: 'fuel',
    label: 'Fuel',
    description: 'Gas, charging, tolls, parking, and driving costs.',
  }),
  Object.freeze({
    value: 'miscellaneous',
    label: 'Miscellaneous',
    description: 'Everything else that does not fit a trip category.',
  }),
]);

const CATEGORY_VALUES = new Set(EXPENSE_CATEGORIES.map((category) => category.value));

function normalizeExpenseCategory(category) {
  if (!category || String(category).trim().length === 0) {
    return DEFAULT_EXPENSE_CATEGORY;
  }

  const normalized = String(category).trim().toLowerCase();

  if (!CATEGORY_VALUES.has(normalized)) {
    throw new Error('Expense category is not supported');
  }

  return normalized;
}

function getExpenseCategoryLabel(category) {
  try {
    const normalized = normalizeExpenseCategory(category);
    return EXPENSE_CATEGORIES.find((item) => item.value === normalized)?.label || 'Miscellaneous';
  } catch {
    return 'Miscellaneous';
  }
}

module.exports = {
  DEFAULT_EXPENSE_CATEGORY,
  EXPENSE_CATEGORIES,
  getExpenseCategoryLabel,
  normalizeExpenseCategory,
};
