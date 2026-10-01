'use client';

import React, { useState } from 'react';
import { MobileGroup, MobileUser } from './mockData';
import {
  BedDouble,
  Car,
  Fuel,
  Plus,
  ShoppingBag,
  Ticket,
  Utensils,
  X,
  Users,
  Check,
} from 'lucide-react';

interface MobileAddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: MobileGroup[];
  selectedGroupId: string | null;
  currentUser: MobileUser;
  onSaveExpense: (expense: {
    title: string;
    amount: number;
    category: 'food' | 'transport' | 'lodging' | 'groceries' | 'entertainment' | 'fuel';
    groupId: string;
    splitType: 'equal' | 'you_paid_all' | 'they_owe_all';
    notes?: string;
  }) => void;
  osTheme: 'ios' | 'android';
}

const CATEGORIES = [
  { id: 'food', label: 'Dining', icon: Utensils },
  { id: 'groceries', label: 'Groceries', icon: ShoppingBag },
  { id: 'transport', label: 'Ride / Gas', icon: Car },
  { id: 'lodging', label: 'Stay', icon: BedDouble },
  { id: 'fuel', label: 'Fuel', icon: Fuel },
  { id: 'entertainment', label: 'Fun', icon: Ticket },
] as const;

export default function MobileAddExpenseModal({
  isOpen,
  onClose,
  groups,
  selectedGroupId,
  currentUser,
  onSaveExpense,
  osTheme,
}: MobileAddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'food' | 'transport' | 'lodging' | 'groceries' | 'entertainment' | 'fuel'>('food');
  const [groupId, setGroupId] = useState(selectedGroupId || (groups[0] ? groups[0].id : ''));
  const [splitType, setSplitType] = useState<'equal' | 'you_paid_all' | 'they_owe_all'>('equal');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleQuickChip = (chipTitle: string, cat: typeof category) => {
    setTitle(chipTitle);
    setCategory(cat);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!title.trim()) {
      setError('Please describe what this was for');
      return;
    }
    if (!groupId) {
      setError('Please select a trip or group');
      return;
    }

    onSaveExpense({
      title: title.trim(),
      amount: numAmount,
      category,
      groupId,
      splitType,
    });

    // Reset state & close
    setAmount('');
    setTitle('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center select-none">
      {/* Dark backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* iOS / Android Sheet Container */}
      <div
        className={`relative w-full max-w-[430px] bg-white max-h-[92vh] flex flex-col z-10 shadow-2xl transition-all duration-300 ${
          osTheme === 'ios'
            ? 'rounded-t-[32px] border-t border-slate-200'
            : 'rounded-t-[28px]'
        }`}
      >
        {/* Drag Handle Bar */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add an Expense</h3>
              <p className="text-[11px] text-slate-400">Paid by {currentUser.name.split(' ')[0]}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Huge Currency Input */}
          <div className="text-center py-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Amount
            </span>
            <div className="inline-flex items-center justify-center">
              <span className="text-3xl font-bold text-slate-400 mr-1">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                className="text-4xl font-extrabold text-slate-900 tracking-tight text-center bg-transparent focus:outline-none w-48 placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => handleQuickChip('Coffee & Matcha', 'food')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
            >
              ☕ Coffee
            </button>
            <button
              type="button"
              onClick={() => handleQuickChip('Team Lunch', 'food')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
            >
              🥗 Lunch
            </button>
            <button
              type="button"
              onClick={() => handleQuickChip('Uber Ride', 'transport')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
            >
              🚕 Uber
            </button>
            <button
              type="button"
              onClick={() => handleQuickChip('Trader Joe’s', 'groceries')}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
            >
              🛒 Groceries
            </button>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner, Airbnb, Taxi"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
          </div>

          {/* Group / Trip Picker */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Trip or Group
            </label>
            <div className="grid grid-cols-2 gap-2">
              {groups.map((group) => {
                const isSelected = groupId === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setGroupId(group.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left border text-xs transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">{group.emoji}</span>
                    <span className="truncate">{group.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium transition ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fast Split Modes */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Split Option
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`py-2 px-1 text-center rounded-xl text-[11px] font-semibold border transition ${
                  splitType === 'equal'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Split Equally
              </button>

              <button
                type="button"
                onClick={() => setSplitType('you_paid_all')}
                className={`py-2 px-1 text-center rounded-xl text-[11px] font-semibold border transition ${
                  splitType === 'you_paid_all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                You Paid Full
              </button>

              <button
                type="button"
                onClick={() => setSplitType('they_owe_all')}
                className={`py-2 px-1 text-center rounded-xl text-[11px] font-semibold border transition ${
                  splitType === 'they_owe_all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                They Owe All
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
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
              <span>Save & Log Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
