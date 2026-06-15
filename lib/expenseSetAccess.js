function validateExpenseSetId(expenseSetId) {
  if (!expenseSetId || expenseSetId.trim().length === 0) {
    throw new Error('Expense Set is required');
  }

  return expenseSetId;
}

function validateSplitParticipants(splits, memberIds) {
  const memberSet = new Set(memberIds);
  const hasInvalidParticipant = splits.some((split) => !memberSet.has(split.user_id));

  if (hasInvalidParticipant) {
    throw new Error('Split participants must be members of this Expense Set');
  }
}

function ensureActorCanMutateExpense(expense, actorUserId, action) {
  if (expense.paid_by_user_id !== actorUserId) {
    throw new Error(`Only the expense payer can ${action} this expense`);
  }
}

module.exports = {
  ensureActorCanMutateExpense,
  validateExpenseSetId,
  validateSplitParticipants,
};
