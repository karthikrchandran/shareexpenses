import type { ExpenseCategoryValue } from './expenseCategories';

// Database Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  venmo_handle?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  group_id?: string;
  description: string;
  amount: number;
  category?: ExpenseCategoryValue;
  expense_date?: string;
  notes?: string | null;
  paid_by_user_id: string;
  paid_by_user?: User;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  user?: User;
  amount: number;
  percentage?: number;
  is_itemized: boolean; // true for custom, false for even split
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  from_user?: User;
  to_user?: User;
  amount: number;
  settled: boolean;
  settled_at?: string;
  payment_method?: 'outside-app' | 'venmo';
  payment_status?: 'pending' | 'paid' | 'confirmed';
  venmo_transaction_id?: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  join_token?: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface ExpenseSet extends Group {}

export interface ExpenseSetMember extends GroupMember {
  user?: User;
}
