'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, AlertCircle } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
  currentUserId: string;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onExpenseAdded,
  currentUserId,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState<'even' | 'custom'>('even');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([currentUserId]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setAllUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleToggleUser = (userId: string) => {
    if (userId === currentUserId) return; // Always include current user
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
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

      // Create expense
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          description,
          amount: amountNum,
          paid_by_user_id: currentUserId,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Create splits
      if (splitType === 'even') {
        const splitAmount = amountNum / participants.length;
        const splits = participants.map((userId) => ({
          expense_id: expenseData.id,
          user_id: userId,
          amount: Number(splitAmount.toFixed(2)),
          is_itemized: false,
        }));

        const { error: splitsError } = await supabase.from('expense_splits').insert(splits);
        if (splitsError) throw splitsError;
      }

      onExpenseAdded();
      setDescription('');
      setAmount('');
      setSplitType('even');
      setSelectedUsers([currentUserId]);
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
          <h2 className="text-2xl font-bold">Add Expense</h2>
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
              onChange={(e) => setSplitType(e.target.value as 'even' | 'custom')}
              className="input-field"
            >
              <option value="even">Even Split</option>
              <option value="custom">Custom Split (Coming Soon)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Among
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {allUsers.map((user) => (
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
