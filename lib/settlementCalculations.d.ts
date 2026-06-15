export interface SettlementCalculationExpense {
  paid_by_user_id: string;
  amount: number;
}

export interface SettlementCalculationSplit {
  user_id: string;
  amount: number;
}

export interface SettledPayment {
  from_user_id?: string;
  to_user_id?: string;
  from?: string;
  to?: string;
  amount: number;
  settled?: boolean;
}

export function calculateSettlements(
  expenses: SettlementCalculationExpense[],
  splits: SettlementCalculationSplit[],
  settledPayments?: SettledPayment[]
): Record<string, Record<string, number>>;
