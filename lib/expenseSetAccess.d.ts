export interface ExpenseSplitInput {
  user_id: string;
  amount: number;
  percentage?: number;
  is_itemized?: boolean;
}

export interface MutableExpense {
  paid_by_user_id: string;
}

export function validateExpenseSetId(
  expenseSetId: string | null | undefined
): string;

export function validateSplitParticipants(
  splits: ExpenseSplitInput[],
  memberIds: string[]
): void;

export function validateSplitTotal(
  splits: ExpenseSplitInput[],
  amount: number
): void;

export function ensureExpenseSetMember(
  actorUserId: string,
  memberIds: string[],
  action: string
): void;

export function validateSettlementParticipants(
  fromUserId: string,
  toUserId: string,
  memberIds: string[]
): void;

export function ensureSettlementActorCanRecord(
  actorUserId: string,
  fromUserId: string,
  toUserId: string
): void;

export function ensureActorCanMutateExpense(
  expense: MutableExpense,
  actorUserId: string,
  action: 'edit' | 'delete'
): void;
