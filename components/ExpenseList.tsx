'use client';

import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getExpenseCategoryLabel } from '@/lib/expenseCategories';
import { Edit2, Trash2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: any[];
  onRefresh: () => void;
  currentUserId: string;
  onEditExpense: (expense: any) => void;
}

export default function ExpenseList({ expenses, onRefresh, currentUserId, onEditExpense }: ExpenseListProps) {
  const [busyExpenseId, setBusyExpenseId] = useState<string | null>(null);

  const deleteExpense = async (expenseId: string) => {
    const confirmed = window.confirm('Delete this expense? This will also remove its split records.');
    if (!confirmed) return;

    setBusyExpenseId(expenseId);
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paidByUserId: currentUserId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete expense');
      }

      onRefresh();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    } finally {
      setBusyExpenseId(null);
    }
  };

  return (
    <div className="divide-y">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="p-4 hover:bg-gray-50 transition flex justify-between items-start"
        >
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">{expense.description}</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {getExpenseCategoryLabel(expense.category)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Paid by {expense.paid_by_user?.name} • {formatDate(expense.expense_date || expense.created_at)}
            </p>
            {expense.notes && (
              <p className="mt-2 max-w-2xl text-sm text-gray-600">{expense.notes}</p>
            )}
          </div>

          <div className="text-right flex items-center gap-4">
            <div className="font-semibold text-lg text-primary">
              {formatCurrency(expense.amount)}
            </div>
            {expense.paid_by_user_id === currentUserId && (
              <div className="flex gap-2">
                <button
                  onClick={() => onEditExpense(expense)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  disabled={busyExpenseId === expense.id}
                  className="p-2 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
