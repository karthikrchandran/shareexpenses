'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateSettlements, formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  buildOutsideAppSettlementMessage,
  getSettlementPaymentMethods,
  type SettlementPaymentMethodId,
} from '@/lib/settlementPaymentMethods';

interface SettlementSummaryProps {
  expenses: any[];
  currentUserId: string;
}

type SettlementRow = { from: string; to: string; amount: number };

export default function SettlementSummary({
  expenses,
  currentUserId,
}: SettlementSummaryProps) {
  const [splits, setSplits] = useState<any[]>([]);
  const [usersById, setUsersById] = useState<Record<string, string>>({});
  const [settlingKey, setSettlingKey] = useState<string | null>(null);
  const [activePaymentKey, setActivePaymentKey] = useState<string | null>(null);
  const [settledOutsideAppKeys, setSettledOutsideAppKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [statusMessage, setStatusMessage] = useState<string>('');
  const venmoConfigured = process.env.NEXT_PUBLIC_VENMO_ENABLED === 'true';
  const paymentMethods = getSettlementPaymentMethods({ venmoConfigured });

  useEffect(() => {
    const loadSettlementData = async () => {
      if (expenses.length === 0) {
        setSplits([]);
        setUsersById({});
        return;
      }

      const expenseIds = expenses.map((expense) => expense.id);

      const { data: splitsData, error: splitsError } = await supabase
        .from('expense_splits')
        .select('expense_id, user_id, amount')
        .in('expense_id', expenseIds);

      if (splitsError) {
        console.error('Failed to load splits for settlements:', splitsError);
        return;
      }

      setSplits(splitsData || []);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name');

      if (usersError) {
        console.error('Failed to load users for settlements:', usersError);
        return;
      }

      const mappedUsers = (usersData || []).reduce((acc: Record<string, string>, user: any) => {
        acc[user.id] = user.name;
        return acc;
      }, {});
      setUsersById(mappedUsers);
    };

    loadSettlementData();
  }, [expenses]);

  // Calculate total and current user's balance
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Simplified balance for current user
  const amountPaid = expenses
    .filter((exp) => exp.paid_by_user_id === currentUserId)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const settlementRows = useMemo(() => {
    const matrix = calculateSettlements(expenses, splits);
    const rows: SettlementRow[] = [];

    Object.entries(matrix).forEach(([fromUserId, creditors]) => {
      Object.entries(creditors).forEach(([toUserId, amount]) => {
        rows.push({
          from: fromUserId,
          to: toUserId,
          amount: amount as number,
        });
      });
    });

    return rows;
  }, [expenses, splits]);

  const youOwe = settlementRows.filter((row) => row.from === currentUserId);
  const owedToYou = settlementRows.filter((row) => row.to === currentUserId);

  const netBalance = owedToYou.reduce((sum, row) => sum + row.amount, 0)
    - youOwe.reduce((sum, row) => sum + row.amount, 0);

  const getSettlementKey = (row: SettlementRow) => `${row.from}-${row.to}-${row.amount}`;

  const getCounterpartyName = (row: SettlementRow) => {
    const counterpartyId = row.from === currentUserId ? row.to : row.from;
    return usersById[counterpartyId] || 'Friend';
  };

  const handleSettleUp = (row: SettlementRow) => {
    const key = getSettlementKey(row);
    setStatusMessage('');
    setActivePaymentKey((currentKey) => (currentKey === key ? null : key));
  };

  const handleOutsideAppSettlement = (row: SettlementRow) => {
    const key = getSettlementKey(row);
    setSettledOutsideAppKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      nextKeys.add(key);
      return nextKeys;
    });
    setActivePaymentKey(null);
    setStatusMessage(
      buildOutsideAppSettlementMessage({
        recipientName: getCounterpartyName(row),
        amount: row.amount,
      })
    );
  };

  const handleVenmoSettlement = async (row: SettlementRow) => {
    const key = getSettlementKey(row);
    setSettlingKey(key);
    setStatusMessage('');
    setActivePaymentKey(null);

    try {
      const response = await fetch('/api/venmo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_user_id: row.from,
          to_user_id: row.to,
          amount: row.amount,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to settle with Venmo');
      }

      setStatusMessage('Venmo payment initiated successfully.');
    } catch (error: any) {
      setStatusMessage(error?.message || 'Failed to settle with Venmo');
    } finally {
      setSettlingKey(null);
    }
  };

  const handlePaymentMethod = (methodId: SettlementPaymentMethodId, row: SettlementRow) => {
    if (methodId === 'outside-app') {
      handleOutsideAppSettlement(row);
      return;
    }

    handleVenmoSettlement(row);
  };

  const renderSettlementAction = (row: SettlementRow) => {
    const key = getSettlementKey(row);
    const isSettling = settlingKey === key;
    const isSelectingPayment = activePaymentKey === key;
    const isSettledOutsideApp = settledOutsideAppKeys.has(key);

    if (isSettledOutsideApp) {
      return (
        <p className="text-xs text-gray-600 mt-1">Settled outside app</p>
      );
    }

    return (
      <div className="relative mt-1">
        <button
          type="button"
          onClick={() => handleSettleUp(row)}
          disabled={isSettling}
          aria-expanded={isSelectingPayment}
          className="text-xs text-primary hover:underline disabled:opacity-50"
        >
          {isSettling ? 'Settling...' : 'Settle Up'}
        </button>

        {isSelectingPayment && (
          <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-2 text-left shadow-lg">
            <div className="space-y-1">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => handlePaymentMethod(method.id, row)}
                  disabled={method.disabled}
                  className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="block font-semibold text-gray-900">
                    {method.label}
                  </span>
                  <span className="block text-gray-500">
                    {method.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
              <p className="text-sm text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netBalance))}
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
            <li>Settle up using cash, an outside app, or Venmo later</li>
          </ol>
        </div>

        {/* Settlements */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Settlements</h3>

          {statusMessage && (
            <p className="text-xs text-gray-600 mb-3">{statusMessage}</p>
          )}

          {settlementRows.length === 0 ? (
            <div className="text-center text-gray-500">
              <p className="text-sm">Add expenses with splits to see settlements</p>
            </div>
          ) : (
            <div className="space-y-4">
              {youOwe.map((row, index) => (
                <div key={`owe-${index}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="text-sm">
                    <p className="text-gray-700">You owe</p>
                    <p className="font-semibold text-gray-900">{usersById[row.to] || 'Friend'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{formatCurrency(row.amount)}</p>
                    {renderSettlementAction(row)}
                  </div>
                </div>
              ))}

              {owedToYou.map((row, index) => (
                <div key={`owed-${index}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="text-sm">
                    <p className="text-gray-700">{usersById[row.from] || 'Friend'} owes you</p>
                    <p className="font-semibold text-gray-900">Incoming</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(row.amount)}</p>
                    {renderSettlementAction(row)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </>
  );
}
