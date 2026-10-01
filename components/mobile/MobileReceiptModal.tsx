'use client';

import React from 'react';
import { MobileExpense } from './mockData';
import { formatCurrency } from '@/lib/utils';
import { Check, Receipt, Trash2, X, Calendar, User, FileText } from 'lucide-react';

interface MobileReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: MobileExpense | null;
  onDeleteExpense?: (expenseId: string) => void;
  osTheme: 'ios' | 'android';
}

export default function MobileReceiptModal({
  isOpen,
  onClose,
  expense,
  onDeleteExpense,
  osTheme,
}: MobileReceiptModalProps) {
  if (!isOpen || !expense) return null;

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
        {/* Drag Handle */}
        <div className="pt-0 pb-3 flex justify-center">
          <div className="w-10 h-1 bg-slate-300 rounded-full"></div>
        </div>

        {/* Top Close */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Receipt size={16} />
            </div>
            <span className="text-xs font-bold text-slate-800">Expense Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Big Amount & Title Header */}
        <div className="text-center py-5 border-b border-dashed border-slate-200">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(expense.amount)}
          </div>
          <h3 className="text-base font-bold text-slate-800 mt-1">{expense.title}</h3>
          <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold capitalize">
            {expense.category} • {expense.groupName}
          </span>
        </div>

        {/* Info Rows */}
        <div className="py-4 space-y-2.5 border-b border-slate-100 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <User size={14} /> Paid by
            </span>
            <div className="flex items-center gap-2">
              <img
                src={expense.paidBy.avatar}
                alt={expense.paidBy.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="font-bold text-slate-900">{expense.paidBy.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar size={14} /> Date
            </span>
            <span className="font-semibold text-slate-800">{expense.date}</span>
          </div>

          {expense.notes && (
            <div className="flex items-start justify-between text-slate-600 pt-1">
              <span className="flex items-center gap-1.5 text-slate-500">
                <FileText size={14} /> Note
              </span>
              <span className="font-medium text-slate-700 text-right max-w-[200px]">
                {expense.notes}
              </span>
            </div>
          )}
        </div>

        {/* Split Breakdown */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Split Breakdown ({expense.splits.length} people)
            </span>
          </div>

          <div className="space-y-2">
            {expense.splits.map((split, i) => (
              <div
                key={split.user.id || i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={split.user.avatar}
                    alt={split.user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    {split.user.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {formatCurrency(split.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delete Action if handler provided */}
        {onDeleteExpense && (
          <div className="pt-2 pb-1">
            <button
              onClick={() => {
                onDeleteExpense(expense.id);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Remove this expense</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
