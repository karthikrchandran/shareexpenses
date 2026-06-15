const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ensureActorCanMutateExpense,
  validateExpenseSetId,
  validateSplitParticipants,
} = require('../lib/expenseSetAccess.js');

test('requires every expense to belong to an Expense Set', () => {
  assert.throws(() => validateExpenseSetId(undefined), /Expense Set is required/);
  assert.throws(() => validateExpenseSetId(''), /Expense Set is required/);
  assert.equal(validateExpenseSetId('set-1'), 'set-1');
});

test('allows splits among current members of the selected Expense Set', () => {
  assert.doesNotThrow(() =>
    validateSplitParticipants(
      [{ user_id: 'alice', amount: 12 }, { user_id: 'bob', amount: 8 }],
      ['alice', 'bob', 'chris']
    )
  );
});

test('rejects split participants outside the selected Expense Set', () => {
  assert.throws(
    () =>
      validateSplitParticipants(
        [{ user_id: 'alice', amount: 12 }, { user_id: 'mallory', amount: 8 }],
        ['alice', 'bob']
      ),
    /Split participants must be members of this Expense Set/
  );
});

test('allows only the payer to edit or delete their expense', () => {
  assert.doesNotThrow(() =>
    ensureActorCanMutateExpense({ paid_by_user_id: 'alice' }, 'alice', 'edit')
  );

  assert.throws(
    () => ensureActorCanMutateExpense({ paid_by_user_id: 'alice' }, 'bob', 'delete'),
    /Only the expense payer can delete this expense/
  );
});
