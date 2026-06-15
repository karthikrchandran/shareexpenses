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

function validateSplitTotal(splits, amount) {
  const splitTotal = splits.reduce((sum, split) => sum + Number(split.amount || 0), 0);

  if (Math.abs(splitTotal - Number(amount)) > 0.01) {
    throw new Error('Split total must equal expense amount');
  }
}

function ensureExpenseSetMember(actorUserId, memberIds, action) {
  if (!memberIds.includes(actorUserId)) {
    throw new Error(`Only Expense Set members can ${action}`);
  }
}

function ensureActorCanMutateExpense(expense, actorUserId, action) {
  if (expense.paid_by_user_id !== actorUserId) {
    throw new Error(`Only the expense payer can ${action} this expense`);
  }
}

module.exports = {
  ensureActorCanMutateExpense,
  ensureExpenseSetMember,
  validateExpenseSetId,
  validateSplitTotal,
  validateSplitParticipants,
};
