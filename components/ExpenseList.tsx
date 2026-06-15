'use client';

import { formatCurrency, formatDate } from '@/lib/utils';
import { Edit2, Trash2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: any[];
  onRefresh: () => void;
}

export default function ExpenseList({ expenses, onRefresh }: ExpenseListProps) {
  return (
    <div className="divide-y">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="p-4 hover:bg-gray-50 transition flex justify-between items-start"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{expense.description}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Paid by {expense.paid_by_user?.name} • {formatDate(expense.created_at)}
            </p>
          </div>

          <div className="text-right flex items-center gap-4">
            <div className="font-semibold text-lg text-primary">
              {formatCurrency(expense.amount)}
            </div>
            <div className="flex gap-2">
              <button
                className="p-2 text-gray-400 hover:text-gray-600 transition"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-red-600 transition"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
