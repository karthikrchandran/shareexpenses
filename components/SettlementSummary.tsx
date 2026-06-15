'use client';

import { useState } from 'react';
import { calculateSettlements, formatCurrency } from '@/lib/utils';
import { ArrowRight, Send } from 'lucide-react';

interface SettlementSummaryProps {
  expenses: any[];
  currentUserId: string;
}

export default function SettlementSummary({
  expenses,
  currentUserId,
}: SettlementSummaryProps) {
  const [showVenmoModal, setShowVenmoModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);

  // Calculate total and current user's balance
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Simplified balance for current user
  const amountPaid = expenses
    .filter((exp) => exp.paid_by_user_id === currentUserId)
    .reduce((sum, exp) => sum + exp.amount, 0);

  // In a full implementation, you'd calculate the share
  const estimatedShare = totalExpenses / 2; // Placeholder

  return (
    <>
      <div className="space-y-4">
        {/* Balance Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Balance</h3>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Total Amount Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(amountPaid)}
              </p>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Settlement Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Add expenses with your friends</li>
            <li>Choose who the expense is split between</li>
            <li>ShareExpenses calculates who owes what</li>
            <li>Settle up using Venmo</li>
          </ol>
        </div>

        {/* Settlements */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Settlements</h3>

          <div className="text-center text-gray-500">
            <p className="text-sm">Add more expenses to see settlements</p>
          </div>
        </div>
      </div>

      {/* Venmo Modal Placeholder */}
      {showVenmoModal && selectedSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">
              Pay via Venmo
            </h3>
            <p className="text-gray-600 mb-4">
              Amount: <span className="font-semibold">{formatCurrency(selectedSettlement.amount)}</span>
            </p>
            <button
              onClick={() => setShowVenmoModal(false)}
              className="btn-primary w-full"
            >
              Complete Settlement
            </button>
          </div>
        </div>
      )}
    </>
  );
}
