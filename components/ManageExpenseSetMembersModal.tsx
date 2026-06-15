'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Copy, Link as LinkIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ExpenseSet, ExpenseSetMember, User } from '@/lib/types';

interface ManageExpenseSetMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMembersChanged: () => void;
  expenseSet: ExpenseSet;
  members: ExpenseSetMember[];
  currentUserId: string;
}

export default function ManageExpenseSetMembersModal({
  isOpen,
  onClose,
  onMembersChanged,
  expenseSet,
  members,
  currentUserId,
}: ManageExpenseSetMembersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinLinkLoading, setJoinLinkLoading] = useState(false);
  const [joinLink, setJoinLink] = useState('');
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  const memberIds = useMemo(
    () => new Set(members.map((member) => member.user_id)),
    [members]
  );

  const availableUsers = users.filter((user) => !memberIds.has(user.id));

  useEffect(() => {
    const loadUsers = async () => {
      if (!isOpen) return;

      const { data, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, phone, venmo_handle, avatar_url, created_at')
        .order('name', { ascending: true });

      if (usersError) {
        console.error('Failed to load users for member management:', usersError);
        return;
      }

      setUsers(data || []);
    };

    loadUsers();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId('');
      setJoinLink('');
      setCopyMessage('');
      setError('');
    }
  }, [isOpen]);

  const handleCreateJoinLink = async () => {
    setError('');
    setCopyMessage('');
    setJoinLinkLoading(true);

    try {
      const response = await fetch(`/api/expense-sets/${expenseSet.id}/join-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorUserId: currentUserId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create join link');
      }

      setJoinLink(payload.joinUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to create join link');
    } finally {
      setJoinLinkLoading(false);
    }
  };

  const handleCopyJoinLink = async () => {
    if (!joinLink) return;
    await navigator.clipboard.writeText(joinLink);
    setCopyMessage('Join link copied.');
  };

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/expense-sets/${expenseSet.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actorUserId: currentUserId,
          userId: selectedUserId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to add member');
      }

      setSelectedUserId('');
      onMembersChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Manage Members</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-2">Expense Set</p>
            <p className="font-semibold text-gray-900">{expenseSet.name}</p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <LinkIcon size={18} className="mt-0.5 text-blue-700" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-950">Friend join link</p>
                <p className="mt-1 text-xs text-blue-800">
                  Send this to friends. After login or signup, they will join this Expense Set automatically.
                </p>
                {joinLink && (
                  <input
                    readOnly
                    value={joinLink}
                    className="mt-3 w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-xs text-gray-700"
                  />
                )}
                {copyMessage && <p className="mt-2 text-xs text-blue-800">{copyMessage}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateJoinLink}
                    disabled={joinLinkLoading}
                    className="rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {joinLinkLoading ? 'Creating...' : joinLink ? 'Refresh link' : 'Create link'}
                  </button>
                  {joinLink && (
                    <button
                      type="button"
                      onClick={handleCopyJoinLink}
                      className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                    >
                      <Copy size={13} />
                      Copy
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Current Members</p>
            <div className="space-y-2 border border-gray-200 rounded-lg p-2">
              {members.map((member) => (
                <div key={member.id} className="p-2 rounded bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">
                    {member.user?.name || 'Member'}
                    {member.user_id === currentUserId && ' (You)'}
                  </p>
                  <p className="text-xs text-gray-500">{member.user?.email}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddMember} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Add registered user
            </label>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="input-field"
              disabled={availableUsers.length === 0}
            >
              <option value="">
                {availableUsers.length === 0 ? 'No users available' : 'Select a user'}
              </option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={loading || !selectedUserId}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
