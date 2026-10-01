'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Plus, ShieldCheck, X } from 'lucide-react';
import { ExpenseSet } from '@/lib/types';

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
  const [inviteEmail, setInviteEmail] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setInviteEmail('');
      setMemberEmails([]);
      setError('');
    }
  }, [isOpen]);

  const handleAddEmail = () => {
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    if (memberEmails.includes(trimmed)) {
      setInviteEmail('');
      return;
    }
    setMemberEmails((prev) => [...prev, trimmed]);
    setInviteEmail('');
    setError('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setMemberEmails((prev) => prev.filter((e) => e !== emailToRemove));
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
          memberEmails,
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite Members by Email <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
                placeholder="friend@example.com"
                className="input-field text-sm"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition shrink-0"
              >
                Add
              </button>
            </div>

            {memberEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {memberEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>User privacy is protected. Users are never listed publicly. You can also share a private join link after creating.</span>
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
