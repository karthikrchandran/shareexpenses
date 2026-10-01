'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Link as LinkIcon, ShieldCheck, UserPlus, X } from 'lucide-react';
import { ExpenseSet, ExpenseSetMember } from '@/lib/types';

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
  const [memberEmail, setMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinLinkLoading, setJoinLinkLoading] = useState(false);
  const [joinLink, setJoinLink] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setMemberEmail('');
      setJoinLink('');
      setCopyMessage('');
      setError('');
      setSuccessMessage('');
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
    setCopyMessage('Join link copied to clipboard.');
  };

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = memberEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`/api/expense-sets/${expenseSet.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actorUserId: currentUserId,
          email: cleanEmail,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to add member');
      }

      setMemberEmail('');
      setSuccessMessage(`Member (${cleanEmail}) added successfully.`);
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

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded flex gap-2">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-green-700 text-sm">{successMessage}</span>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-1">Expense Set</p>
            <p className="font-semibold text-gray-900">{expenseSet.name}</p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <LinkIcon size={18} className="mt-0.5 text-blue-700" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-950">Friend join link</p>
                <p className="mt-1 text-xs text-blue-800">
                  Send this link to friends. After login or signup, they will join this Expense Set automatically.
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
            <p className="text-sm font-medium text-gray-700 mb-2">Current Members ({members.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {members.map((member) => (
                <div key={member.id} className="p-2 rounded bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.user?.name || 'Member'}
                      {member.user_id === currentUserId && ' (You)'}
                    </p>
                    <p className="text-xs text-gray-500">{member.user?.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddMember} className="space-y-3 pt-1">
            <label className="block text-sm font-medium text-gray-700">
              Add Member by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={memberEmail}
                onChange={(event) => {
                  setMemberEmail(event.target.value);
                  if (error) setError('');
                }}
                placeholder="friend@example.com"
                className="input-field text-sm"
                required
              />
              <button
                type="submit"
                disabled={loading || !memberEmail.trim()}
                className="btn-primary px-4 py-2 shrink-0 disabled:opacity-50 inline-flex items-center gap-1.5 text-sm"
              >
                <UserPlus size={16} />
                <span>{loading ? 'Adding...' : 'Add'}</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>User privacy is protected. Users are never listed in a public directory.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
