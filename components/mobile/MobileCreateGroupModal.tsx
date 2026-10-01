'use client';

import React, { useState } from 'react';
import { Plus, X, Sparkles, Check, ShieldCheck, Mail } from 'lucide-react';
import { MobileGroup } from './mockData';

interface MobileCreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (group: { name: string; emoji: string; category: string; memberEmails?: string[] }) => void;
  osTheme: 'ios' | 'android';
}

const EMOJIS = ['🏖️', '🏔️', '🏠', '🍕', '🚗', '✈️', '🎉', '☕', '🏕️', '🏄‍♂️'];
const CATEGORIES = ['Trip', 'Home', 'Social', 'Event', 'Project'];

export default function MobileCreateGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
  osTheme,
}: MobileCreateGroupModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏖️');
  const [category, setCategory] = useState('Trip');
  const [inviteEmail, setInviteEmail] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group or trip name');
      return;
    }
    onCreateGroup({
      name: name.trim(),
      emoji,
      category,
      memberEmails,
    });
    setName('');
    setInviteEmail('');
    setMemberEmails([]);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center select-none">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div
        className={`relative w-full max-w-[430px] bg-white p-5 flex flex-col z-10 shadow-2xl transition-all duration-300 max-h-[92vh] overflow-y-auto ${
          osTheme === 'ios'
            ? 'rounded-t-[32px] border-t border-slate-200'
            : 'rounded-t-[28px]'
        }`}
      >
        <div className="pt-0 pb-3 flex justify-center">
          <div className="w-10 h-1 bg-slate-300 rounded-full"></div>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">New Trip or Circle</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Group Icon & Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Group Name
            </label>
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                {emoji}
              </div>
              <input
                type="text"
                placeholder="e.g. Miami Weekend, Cabin Trip"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Choose Emoji */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Select Icon
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition shrink-0 ${
                    emoji === em
                      ? 'bg-indigo-600 text-white scale-110 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Category
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    category === cat
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Invite Members by Email */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Add Members by Email <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition shrink-0"
              >
                Add
              </button>
            </div>

            {memberEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {memberEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-200"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2">
              <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
              <span>Privacy protected. No public user lists. You can also share a private join link after creating.</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs text-white shadow-lg transition active:scale-98 flex items-center justify-center gap-2 ${
                osTheme === 'ios'
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              <Check size={16} />
              <span>Create Circle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
