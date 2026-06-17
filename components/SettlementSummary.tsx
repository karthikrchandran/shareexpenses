'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateSettlements, formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  buildPaymentHandoffMessage,
  buildOutsideAppSettlementMessage,
  getSettlementPaymentMethods,
  type SettlementPaymentMethodId,
} from '@/lib/settlementPaymentMethods';

interface SettlementSummaryProps {
  expenses: any[];
  currentUserId: string;
  expenseSetId: string;
  onSettlementChanged?: () => void;
}

type SettlementRow = { from: string; to: string; amount: number };
type SettledPayment = {
  id?: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  settled: boolean;
  settled_at?: string;
  payment_method?: string;
  payment_status?: 'pending' | 'paid' | 'confirmed';
};

export default function SettlementSummary({
  expenses,
  currentUserId,
  expenseSetId,
  onSettlementChanged,
}: SettlementSummaryProps) {
  const [splits, setSplits] = useState<any[]>([]);
  const [usersById, setUsersById] = useState<Record<string, string>>({});
  const [settledPayments, setSettledPayments] = useState<SettledPayment[]>([]);
  const [settlingKey, setSettlingKey] = useState<string | null>(null);
  const [activePaymentKey, setActivePaymentKey] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, 'pending' | 'paid' | 'confirmed'>>({});
  const [statusMessage, setStatusMessage] = useState<string>('');
  const paymentMethods = getSettlementPaymentMethods();

  useEffect(() => {
    const loadSettlementData = async () => {
      if (!currentUserId || !expenseSetId || expenses.length === 0) {
        setSplits([]);
        setUsersById({});
        setSettledPayments([]);
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

      const settlementsResponse = await fetch(
        `/api/settlements?userId=${encodeURIComponent(currentUserId)}&groupId=${encodeURIComponent(expenseSetId)}`
      );
      const settlementsPayload = await settlementsResponse.json();
      if (!settlementsResponse.ok) {
        throw new Error(settlementsPayload?.error || 'Failed to load settlements');
      }

      setSettledPayments(settlementsPayload || []);
    };

    loadSettlementData().catch((error) => {
      console.error('Failed to load settlement data:', error);
    });
  }, [currentUserId, expenseSetId, expenses]);

  // Calculate total and current user's balance
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Simplified balance for current user
  const amountPaid = expenses
    .filter((exp) => exp.paid_by_user_id === currentUserId)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const settlementRows = useMemo(() => {
    const matrix = calculateSettlements(expenses, splits, settledPayments);
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
  }, [expenses, splits, settledPayments]);

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

  const getSelectedStatus = (row: SettlementRow) => {
    return selectedStatuses[getSettlementKey(row)] || 'paid';
  };

  const recordSettlement = async (
    row: SettlementRow,
    paymentMethod: SettlementPaymentMethodId,
    paymentStatus: 'pending' | 'paid' | 'confirmed'
  ) => {
    const response = await fetch('/api/settlements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actor_user_id: currentUserId,
        from_user_id: row.from,
        to_user_id: row.to,
        group_id: expenseSetId,
        amount: row.amount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to record settlement');
    }

    setSettledPayments((currentPayments) => [...currentPayments, payload]);
    onSettlementChanged?.();
    return payload as SettledPayment;
  };

  const handleOutsideAppSettlement = async (row: SettlementRow) => {
    const key = getSettlementKey(row);
    const paymentStatus = getSelectedStatus(row);
    setSettlingKey(key);
    setActivePaymentKey(null);
    setStatusMessage('');

    try {
      await recordSettlement(row, 'outside-app', paymentStatus);
      setStatusMessage(
        paymentStatus === 'pending'
          ? `Marked ${formatCurrency(row.amount)} as pending with ${getCounterpartyName(row)}.`
          : buildOutsideAppSettlementMessage({
              recipientName: getCounterpartyName(row),
              amount: row.amount,
            })
      );
    } catch (error: any) {
      setStatusMessage(error?.message || 'Failed to record settlement');
    } finally {
      setSettlingKey(null);
    }
  };

  const handlePaymentHandoffSettlement = async (
    row: SettlementRow,
    method: { id: SettlementPaymentMethodId; label: string }
  ) => {
    const key = getSettlementKey(row);
    const paymentStatus = getSelectedStatus(row);
    setSettlingKey(key);
    setStatusMessage('');
    setActivePaymentKey(null);

    try {
      await recordSettlement(row, method.id, paymentStatus);
      setStatusMessage(
        buildPaymentHandoffMessage({
          methodLabel: method.label,
          recipientName: getCounterpartyName(row),
          amount: row.amount,
          paymentStatus,
        })
      );
    } catch (error: any) {
      setStatusMessage(error?.message || `Failed to record ${method.label} settlement`);
    } finally {
      setSettlingKey(null);
    }
  };

  const handlePaymentMethod = (methodId: SettlementPaymentMethodId, row: SettlementRow) => {
    if (methodId === 'outside-app') {
      handleOutsideAppSettlement(row);
      return;
    }

    const method = paymentMethods.find((candidate) => candidate.id === methodId);
    handlePaymentHandoffSettlement(row, method || { id: methodId, label: methodId });
  };

  const renderSettlementAction = (row: SettlementRow) => {
    const key = getSettlementKey(row);
    const isSettling = settlingKey === key;
    const isSelectingPayment = activePaymentKey === key;
    const selectedStatus = selectedStatuses[key] || 'paid';

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
            <label className="mb-2 block text-xs font-semibold text-gray-700">
              Payment status
            </label>
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatuses((current) => ({
                  ...current,
                  [key]: event.target.value as 'pending' | 'paid' | 'confirmed',
                }))
              }
              className="mb-2 w-full rounded-md border border-gray-200 px-2 py-1 text-xs"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
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

  const formatSettlementStatus = (payment: SettledPayment) => {
    const status = payment.payment_status || (payment.settled ? 'paid' : 'pending');
    return status.charAt(0).toUpperCase() + status.slice(1);
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

        {settledPayments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
            <div className="space-y-3">
              {settledPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id || `${payment.from_user_id}-${payment.to_user_id}-${payment.amount}`}
                  className="rounded-lg border border-gray-200 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900">
                      {usersById[payment.from_user_id] || 'Friend'} to {usersById[payment.to_user_id] || 'Friend'}
                    </p>
                    <span className={payment.settled ? 'text-green-700' : 'text-amber-700'}>
                      {formatSettlementStatus(payment)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatCurrency(payment.amount)} via {payment.payment_method || 'outside app'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </>
  );
}
