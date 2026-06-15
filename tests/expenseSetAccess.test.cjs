const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ensureActorCanMutateExpense,
  ensureSettlementActorCanRecord,
  ensureExpenseSetMember,
  validateSettlementParticipants,
  validateExpenseSetId,
  validateSplitTotal,
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

test('requires the actor to be an Expense Set member', () => {
  assert.doesNotThrow(() =>
    ensureExpenseSetMember('alice', ['alice', 'bob'], 'add expenses')
  );

  assert.throws(
    () => ensureExpenseSetMember('mallory', ['alice', 'bob'], 'add expenses'),
    /Only Expense Set members can add expenses/
  );
});

test('requires split totals to match the expense amount', () => {
  assert.doesNotThrow(() =>
    validateSplitTotal(
      [{ user_id: 'alice', amount: 12.5 }, { user_id: 'bob', amount: 7.5 }],
      20
    )
  );

  assert.throws(
    () =>
      validateSplitTotal(
        [{ user_id: 'alice', amount: 12.5 }, { user_id: 'bob', amount: 6 }],
        20
      ),
    /Split total must equal expense amount/
  );
});

test('requires settlement participants to belong to the Expense Set', () => {
  assert.doesNotThrow(() =>
    validateSettlementParticipants('bob', 'alice', ['alice', 'bob'])
  );

  assert.throws(
    () => validateSettlementParticipants('mallory', 'alice', ['alice', 'bob']),
    /Settlement participants must be members of this Expense Set/
  );
});

test('allows only settlement parties to record a settlement', () => {
  assert.doesNotThrow(() =>
    ensureSettlementActorCanRecord('bob', 'bob', 'alice')
  );
  assert.doesNotThrow(() =>
    ensureSettlementActorCanRecord('alice', 'bob', 'alice')
  );

  assert.throws(
    () => ensureSettlementActorCanRecord('chris', 'bob', 'alice'),
    /Only settlement participants can record this settlement/
  );
});
