'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ExpenseSet, User } from '@/lib/types';

interface CreateExpenseSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (expenseSet: ExpenseSet) => void;
  currentUserId: string;
}

export default function CreateExpenseSetModal({
  isOpen,
  onClose,
  onCreated,
  currentUserId,
}: CreateExpenseSetModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      if (!isOpen) return;

      const { data, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, phone, venmo_handle, avatar_url, created_at')
        .neq('id', currentUserId)
        .order('name', { ascending: true });

      if (usersError) {
        console.error('Failed to load users for Expense Set creation:', usersError);
        return;
      }

      setUsers(data || []);
    };

    loadUsers();
  }, [isOpen, currentUserId]);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setSelectedMemberIds([]);
      setError('');
    }
  }, [isOpen]);

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/expense-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          createdByUserId: currentUserId,
          memberIds: selectedMemberIds,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create Expense Set');
      }

      onCreated(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to create Expense Set');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Expense Set</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Summer Trip to New York"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional notes"
              className="input-field min-h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Members
            </label>
            <div className="space-y-2 max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {users.length === 0 ? (
                <p className="text-sm text-gray-500 p-2">No other registered users yet</p>
              ) : (
                users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(user.id)}
                      onChange={() => handleToggleMember(user.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">
                      {user.name} <span className="text-gray-400">{user.email}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Expense Set'}
          </button>
        </form>
      </div>
    </div>
  );
}
