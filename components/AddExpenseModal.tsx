'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, AlertCircle } from 'lucide-react';
import { ExpenseSetMember } from '@/lib/types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
  currentUserId: string;
  expenseSetId: string;
  members: ExpenseSetMember[];
  existingExpense?: any | null;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onExpenseAdded,
  currentUserId,
  expenseSetId,
  members,
  existingExpense,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState<'even' | 'custom' | 'shares'>('even');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([currentUserId]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const hydrateModal = async () => {
      if (!isOpen) return;

      if (!existingExpense) {
        setDescription('');
        setAmount('');
        setSplitType('even');
        setSelectedUsers([currentUserId]);
        setCustomAmounts({});
        setCustomShares({});
        return;
      }

      setDescription(existingExpense.description || '');
      setAmount(String(existingExpense.amount || ''));

      const { data: existingSplits, error: splitError } = await supabase
        .from('expense_splits')
        .select('user_id, amount, percentage, is_itemized')
        .eq('expense_id', existingExpense.id);

      if (splitError) {
        console.error('Failed to load existing expense splits:', splitError);
        return;
      }

      const participants = [...new Set([...(existingSplits || []).map((split: any) => split.user_id), currentUserId])];
      setSelectedUsers(participants);

      const amountMap: Record<string, string> = {};
      const sharesMap: Record<string, string> = {};
      (existingSplits || []).forEach((split: any) => {
        amountMap[split.user_id] = Number(split.amount).toFixed(2);
        if (split.percentage !== null && split.percentage !== undefined) {
          // Shares are ratios, so existing percentages can be re-used as proportional shares.
          sharesMap[split.user_id] = Number(split.percentage).toFixed(2);
        }
      });

      setCustomAmounts(amountMap);
      setCustomShares(sharesMap);

      const hasPercentage = (existingSplits || []).some((split: any) => split.percentage !== null && split.percentage !== undefined);
      const hasItemized = (existingSplits || []).some((split: any) => split.is_itemized);
      if (hasPercentage) {
        setSplitType('shares');
      } else if (hasItemized) {
        setSplitType('custom');
      } else {
        setSplitType('even');
      }
    };

    hydrateModal();
  }, [isOpen, existingExpense, currentUserId]);

  useEffect(() => {
    if (!isOpen || splitType !== 'custom') return;

    const participants = [...new Set([...selectedUsers, currentUserId])];
    if (participants.length === 0) return;

    const amountNum = Number.parseFloat(amount);
    const evenAmount = Number.isFinite(amountNum) && amountNum > 0
      ? (amountNum / participants.length).toFixed(2)
      : '';

    setCustomAmounts((prev) => {
      const next: Record<string, string> = {};
      participants.forEach((id) => {
        next[id] = prev[id] ?? evenAmount;
      });
      return next;
    });
  }, [isOpen, splitType, selectedUsers, currentUserId, amount]);

  useEffect(() => {
    if (!isOpen || splitType !== 'shares') return;

    const participants = [...new Set([...selectedUsers, currentUserId])];
    if (participants.length === 0) return;

    setCustomShares((prev) => {
      const next: Record<string, string> = {};
      participants.forEach((id) => {
        if (prev[id] !== undefined) {
          next[id] = prev[id];
          return;
        }

        next[id] = '1';
      });
      return next;
    });
  }, [isOpen, splitType, selectedUsers, currentUserId]);

  const memberUsers = members.map((member) => ({
    id: member.user_id,
    name: member.user?.name || 'Member',
    email: member.user?.email,
  }));

  const findMemberName = (userId: string) => {
    const member = memberUsers.find((user) => user.id === userId);
    return member?.name || 'Member';
  };

  const handleToggleUser = (userId: string) => {
    if (userId === currentUserId) return; // Always include current user
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        setCustomAmounts((amounts) => {
          const next = { ...amounts };
          delete next[userId];
          return next;
        });
        setCustomShares((shares) => {
          const next = { ...shares };
          delete next[userId];
          return next;
        });
        return prev.filter((id) => id !== userId);
      }

      return [...prev, userId];
    });
  };

  const handleCustomAmountChange = (userId: string, value: string) => {
    setCustomAmounts((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handleCustomSharesChange = (userId: string, value: string) => {
    setCustomShares((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!description || !amount) {
        throw new Error('Description and amount are required');
      }

      const amountNum = parseFloat(amount);
      if (amountNum <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Include current user in the split
      const participants = [...new Set([...selectedUsers, currentUserId])];

      let splits: any[] = [];

      if (splitType === 'even') {
        const splitAmount = Number((amountNum / participants.length).toFixed(2));
        let allocated = splitAmount * participants.length;

        splits = participants.map((userId, index) => {
          let finalAmount = splitAmount;
          if (index === 0) {
            finalAmount = Number((splitAmount + (amountNum - allocated)).toFixed(2));
          }

          return {
            user_id: userId,
            amount: finalAmount,
            is_itemized: false,
          };
        });
      }

      if (splitType === 'custom') {
        const parsed = participants.map((userId) => ({
          user_id: userId,
          amount: Number.parseFloat(customAmounts[userId] || '0'),
        }));

        if (parsed.some((entry) => !Number.isFinite(entry.amount) || entry.amount < 0)) {
          throw new Error('Custom split amounts must be valid numbers greater than or equal to 0');
        }

        const totalCustom = parsed.reduce((sum, entry) => sum + entry.amount, 0);
        if (Math.abs(totalCustom - amountNum) > 0.01) {
          throw new Error(`Custom split total (${totalCustom.toFixed(2)}) must equal expense amount (${amountNum.toFixed(2)})`);
        }

        splits = parsed.map((entry) => ({
          user_id: entry.user_id,
          amount: Number(entry.amount.toFixed(2)),
          percentage: Number(((entry.amount / amountNum) * 100).toFixed(2)),
          is_itemized: true,
        }));
      }

      if (splitType === 'shares') {
        const parsed = participants.map((userId) => ({
          user_id: userId,
          share: Number.parseFloat(customShares[userId] || '0'),
        }));

        if (parsed.some((entry) => !Number.isFinite(entry.share) || entry.share <= 0)) {
          throw new Error('Shares must be valid numbers greater than 0');
        }

        const totalShares = parsed.reduce((sum, entry) => sum + entry.share, 0);
        if (totalShares <= 0) {
          throw new Error('Total shares must be greater than 0');
        }

        const preliminarySplits = parsed.map((entry) => {
          const percentage = (entry.share / totalShares) * 100;
          const splitAmount = Number((amountNum * (percentage / 100)).toFixed(2));

          return {
            user_id: entry.user_id,
            amount: splitAmount,
            percentage: Number(percentage.toFixed(2)),
            is_itemized: true,
          };
        });

        const preliminaryTotal = preliminarySplits.reduce((sum, split) => sum + split.amount, 0);
        const remainder = Number((amountNum - preliminaryTotal).toFixed(2));
        if (preliminarySplits.length > 0 && remainder !== 0) {
          preliminarySplits[0].amount = Number((preliminarySplits[0].amount + remainder).toFixed(2));
        }

        splits = preliminarySplits;
      }

      if (existingExpense) {
        const response = await fetch(`/api/expenses/${existingExpense.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paidByUserId: currentUserId,
            description,
            amount: amountNum,
            splits,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to update expense');
        }
      } else {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description,
            amount: amountNum,
            paid_by_user_id: currentUserId,
            group_id: expenseSetId,
            splits,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to add expense');
        }
      }

      onExpenseAdded();
      setDescription('');
      setAmount('');
      setSplitType('even');
      setSelectedUsers([currentUserId]);
      setCustomAmounts({});
      setCustomShares({});
    } catch (err: any) {
      setError(err.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{existingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleAddExpense} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner at restaurant"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Type
            </label>
            <select
              value={splitType}
              onChange={(e) => setSplitType(e.target.value as 'even' | 'custom' | 'shares')}
              className="input-field"
            >
              <option value="even">Even Split</option>
              <option value="custom">Custom Amount Split</option>
              <option value="shares">Shares Split</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Among
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {memberUsers.map((user) => (
                <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                    disabled={user.id === currentUserId}
                    className="rounded"
                      />
                  <span className={user.id === currentUserId ? 'font-semibold' : ''}>
                    {user.name}
                    {user.id === currentUserId && ' (You)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {splitType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Amounts
              </label>
              <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                {[...new Set([...selectedUsers, currentUserId])].map((userId) => {
                  return (
                    <div key={userId} className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 flex-1">
                        {findMemberName(userId)}
                        {userId === currentUserId && ' (You)'}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customAmounts[userId] || ''}
                        onChange={(e) => handleCustomAmountChange(userId, e.target.value)}
                        className="input-field w-32"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total custom amounts must exactly match the expense amount.
              </p>
            </div>
          )}

          {splitType === 'shares' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Shares
              </label>
              <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                {[...new Set([...selectedUsers, currentUserId])].map((userId) => {
                  return (
                    <div key={userId} className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 flex-1">
                        {findMemberName(userId)}
                        {userId === currentUserId && ' (You)'}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={customShares[userId] || ''}
                        onChange={(e) => handleCustomSharesChange(userId, e.target.value)}
                        className="input-field w-32"
                        placeholder="1"
                        required
                      />
                      <span className="text-sm text-gray-500">share</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Shares are ratios. Example for 6 parties where one pays half of others: 2,2,2,2,2,1.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6 disabled:opacity-50"
          >
            {loading ? (existingExpense ? 'Saving...' : 'Adding...') : (existingExpense ? 'Save Expense' : 'Add Expense')}
          </button>
        </form>
      </div>
    </div>
  );
}
