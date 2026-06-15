export interface TripCloseoutMember {
  id?: string;
  user_id?: string;
  name?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export interface TripCloseoutExpense {
  id: string;
  description: string;
  amount: number;
  category?: string;
  paid_by_user_id: string;
  created_at?: string;
}

export interface TripCloseoutSplit {
  expense_id: string;
  user_id: string;
  amount: number;
}

export interface TripCloseoutSettledPayment {
  from_user_id: string;
  to_user_id: string;
  amount: number;
  settled?: boolean;
}

export interface TripCloseoutSummary {
  version: number;
  expenseSetId: string;
  expenseSetName: string;
  generatedAt: string;
  totalAmount: number;
  expenseCount: number;
  memberCount: number;
  categoryTotals: Array<{
    category: string;
    label: string;
    total: number;
    expenseCount: number;
    percentage: number;
  }>;
  payerTotals: Array<{
    userId: string;
    name: string;
    totalPaid: number;
  }>;
  settlements: Array<{
    fromUserId: string;
    fromName: string;
    toUserId: string;
    toName: string;
    amount: number;
  }>;
  largestExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    categoryLabel: string;
    paidByName: string;
    createdAt?: string;
  }>;
  insights: string[];
  flags: string[];
  narrative: string;
  groupMessage: string;
}

export function buildTripCloseoutSummary(input: {
  expenseSet: { id: string; name: string };
  expenses: TripCloseoutExpense[];
  members: TripCloseoutMember[];
  splits: TripCloseoutSplit[];
  settledPayments?: TripCloseoutSettledPayment[];
  generatedAt?: string;
}): TripCloseoutSummary;

export function formatCurrency(value: number): string;
