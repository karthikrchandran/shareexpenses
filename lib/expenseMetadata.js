const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeExpenseDate(value, now = () => new Date()) {
  if (value === undefined || value === null || value === '') {
    return now().toISOString().slice(0, 10);
  }

  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new Error('Expense date must use YYYY-MM-DD');
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error('Expense date must use YYYY-MM-DD');
  }

  return value;
}

function normalizeExpenseNotes(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

module.exports = {
  normalizeExpenseDate,
  normalizeExpenseNotes,
};
