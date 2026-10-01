'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { MobileGroup } from './mockData';

interface MobileAddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: MobileGroup | null;
  currentUserId: string;
  onMemberAdded: () => void;
  onCopyJoinLink: (url: string) => void;
  osTheme: 'ios' | 'android';
}

export default function MobileAddMemberModal({
  isOpen,
  onClose,
  group,
  currentUserId,
  onMemberAdded,
  onCopyJoinLink,
  osTheme,
}: MobileAddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !group) return null;

  const joinUrl = typeof window !== 'undefined' && group.join_token
    ? `${window.location.origin}/join/${group.join_token}`
    : '';

  const handleCopyLink = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      onCopyJoinLink(joinUrl);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy join link:', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/api/expense-sets/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorUserId: currentUserId,
          email: cleanEmail,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to add member');
      }

      setSuccess(`Added ${cleanEmail} to ${group.name}!`);
      setEmail('');
      onMemberAdded();
      setTimeout(() => {
        setSuccess('');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center select-none">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div
        className={`relative w-full max-w-[430px] bg-white p-5 flex flex-col z-10 shadow-2xl transition-all duration-300 max-h-[90vh] overflow-y-auto ${
          osTheme === 'ios'
            ? 'rounded-t-[32px] border-t border-slate-200'
            : 'rounded-t-[28px]'
        }`}
      >
        <div className="pt-0 pb-3 flex justify-center">
          <div className="w-10 h-1 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">Add to {group.name}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Option 1: Share Join Link */}
          {joinUrl && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-indigo-950">Private Invite Link</span>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                  Fastest
                </span>
              </div>
              <p className="text-[11px] text-indigo-900/80 mb-2.5 leading-relaxed">
                Send this link to your friends. When they open it, they will join {group.name} automatically.
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Link Copied!' : 'Copy Private Invite Link'}</span>
              </button>
            </div>
          )}

          {/* Option 2: Add by exact email */}
          <form onSubmit={handleAddMember} className="space-y-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Or Add by Registered Email
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                required
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 disabled:opacity-50 transition active:scale-98 flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                <span>{loading ? 'Adding...' : 'Add'}</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
              <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
              <span>User privacy is protected. No public user directory is shown.</span>
            </div>
          </form>

          {/* Current Members Preview */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Current Members ({group.members.length})
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {member.name}
                        {member.id === currentUserId && ' (You)'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{member.email}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
