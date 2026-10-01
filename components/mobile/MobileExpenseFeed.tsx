'use client';

import React from 'react';
import { MobileExpense } from './mockData';
import {
  BedDouble,
  Car,
  ChevronRight,
  Fuel,
  Receipt,
  ShoppingBag,
  Sparkles,
  Ticket,
  Utensils,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MobileExpenseFeedProps {
  expenses: MobileExpense[];
  onSelectExpense: (expense: MobileExpense) => void;
  osTheme: 'ios' | 'android';
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'food':
      return { icon: Utensils, bg: 'bg-amber-100 text-amber-700' };
    case 'transport':
      return { icon: Car, bg: 'bg-blue-100 text-blue-700' };
    case 'lodging':
      return { icon: BedDouble, bg: 'bg-purple-100 text-purple-700' };
    case 'groceries':
      return { icon: ShoppingBag, bg: 'bg-emerald-100 text-emerald-700' };
    case 'fuel':
      return { icon: Fuel, bg: 'bg-orange-100 text-orange-700' };
    case 'entertainment':
    default:
      return { icon: Ticket, bg: 'bg-pink-100 text-pink-700' };
  }
}

export default function MobileExpenseFeed({
  expenses,
  onSelectExpense,
  osTheme,
}: MobileExpenseFeedProps) {
  if (expenses.length === 0) {
    return (
      <div className="py-12 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Receipt size={28} />
        </div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">No expenses yet</h4>
        <p className="text-xs text-slate-500 max-w-[220px] mx-auto">
          Tap the + button below to log your first shared meal, ride, or booking.
        </p>
      </div>
    );
  }

  // Group expenses by displayDate
  const grouped: Record<string, MobileExpense[]> = {};
  for (const exp of expenses) {
    if (!grouped[exp.displayDate]) {
      grouped[exp.displayDate] = [];
    }
    grouped[exp.displayDate].push(exp);
  }

  const dateKeys = Object.keys(grouped);

  return (
    <div className="pb-6 select-none">
      {dateKeys.map((dateKey) => (
        <div key={dateKey} className="mb-4">
          {/* Section Date Header */}
          <div className="px-4 py-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {dateKey}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {grouped[dateKey].length} {grouped[dateKey].length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Grouped Card (iOS rounded container or Android clean surface) */}
          <div
            className={`mx-3 overflow-hidden ${
              osTheme === 'ios'
                ? 'rounded-2xl bg-white shadow-xs border border-slate-100 divide-y divide-slate-100'
                : 'rounded-2xl bg-white border border-slate-200/80 divide-y divide-slate-100'
            }`}
          >
            {grouped[dateKey].map((expense) => {
              const categoryInfo = getCategoryIcon(expense.category);
              const CategoryIcon = categoryInfo.icon;
              const isPayer = expense.userIsPayer;
              const hasPositiveShare = expense.yourShare > 0;

              return (
                <button
                  key={expense.id}
                  onClick={() => onSelectExpense(expense)}
                  className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50/80 active:bg-slate-100 transition"
                >
                  {/* Left: Category Icon Squircle & Info */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${categoryInfo.bg}`}
                    >
                      <CategoryIcon size={19} />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {expense.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <span className="font-medium text-slate-600">
                          {isPayer ? 'You paid' : `${expense.paidBy.name.split(' ')[0]} paid`}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400 truncate max-w-[90px]">
                          {expense.groupName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Personal Stake & Total */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      {/* Your Net Impact */}
                      <div
                        className={`text-xs font-bold ${
                          hasPositiveShare
                            ? 'text-emerald-600'
                            : expense.yourShare < 0
                            ? 'text-rose-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {hasPositiveShare
                          ? `+${formatCurrency(expense.yourShare)}`
                          : expense.yourShare < 0
                          ? `-${formatCurrency(Math.abs(expense.yourShare))}`
                          : '$0.00'}
                      </div>

                      {/* Total bill tag */}
                      <div className="text-[10px] text-slate-400 font-medium">
                        total {formatCurrency(expense.amount)}
                      </div>
                    </div>

                    {osTheme === 'ios' && (
                      <ChevronRight size={14} className="text-slate-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
