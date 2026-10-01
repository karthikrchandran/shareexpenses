'use client';

import React from 'react';
import { MobileExpense } from './mockData';
import { formatCurrency } from '@/lib/utils';
import { BedDouble, Car, Fuel, PieChart, ShoppingBag, Ticket, TrendingUp, Utensils } from 'lucide-react';

interface MobileAnalyticsViewProps {
  expenses: MobileExpense[];
  osTheme: 'ios' | 'android';
}

const CATEGORY_COLORS: Record<string, { label: string; icon: any; color: string; bar: string }> = {
  food: { label: 'Dining & Drinks', icon: Utensils, color: 'text-amber-600', bar: 'bg-amber-500' },
  groceries: { label: 'Groceries', icon: ShoppingBag, color: 'text-emerald-600', bar: 'bg-emerald-500' },
  transport: { label: 'Transport', icon: Car, color: 'text-blue-600', bar: 'bg-blue-500' },
  lodging: { label: 'Lodging / Stays', icon: BedDouble, color: 'text-purple-600', bar: 'bg-purple-500' },
  fuel: { label: 'Gas & Fuel', icon: Fuel, color: 'text-orange-600', bar: 'bg-orange-500' },
  entertainment: { label: 'Entertainment', icon: Ticket, color: 'text-pink-600', bar: 'bg-pink-500' },
};

export default function MobileAnalyticsView({
  expenses,
  osTheme,
}: MobileAnalyticsViewProps) {
  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Category totals
  const categoryTotals: Record<string, number> = {};
  for (const exp of expenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  }

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  const maxExpense = expenses.length > 0
    ? expenses.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), expenses[0])
    : null;

  return (
    <div className="p-4 pb-8 select-none">
      {/* Top Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Spending Breakdown</h2>
        <p className="text-xs text-slate-500">Visual breakdown of shared costs</p>
      </div>

      {/* Hero Stat Box */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">
            Total Logged
          </span>
          <TrendingUp size={16} className="text-indigo-200" />
        </div>
        <div className="text-3xl font-extrabold tracking-tight">
          {formatCurrency(totalAmount)}
        </div>
        <div className="text-xs text-indigo-200 mt-1">
          Across {expenses.length} shared transactions
        </div>
      </div>

      {/* Categories Bar Chart & Breakdown */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-800">By Category</span>
          <span className="text-[11px] font-medium text-slate-400">Share of total</span>
        </div>

        {/* Stacked Colored Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex gap-0.5 mb-4">
          {sortedCategories.map(([cat, amount]) => {
            const pct = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            const info = CATEGORY_COLORS[cat] || CATEGORY_COLORS.food;
            return (
              <div
                key={cat}
                style={{ width: `${Math.max(pct, 2)}%` }}
                className={`h-full ${info.bar} transition-all duration-500`}
                title={`${info.label}: ${pct.toFixed(0)}%`}
              />
            );
          })}
        </div>

        {/* Category Rows */}
        <div className="space-y-3 divide-y divide-slate-100">
          {sortedCategories.map(([cat, amount]) => {
            const pct = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            const info = CATEGORY_COLORS[cat] || CATEGORY_COLORS.food;
            const Icon = info.icon;

            return (
              <div key={cat} className="flex items-center justify-between pt-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg bg-slate-100 ${info.color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{info.label}</div>
                    <div className="text-[10px] text-slate-400">{pct.toFixed(1)}% of spending</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(amount)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Highlights Card */}
      {maxExpense && (
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Highest Single Expense
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">{maxExpense.title}</span>
            <span className="text-xs font-extrabold text-indigo-600">
              {formatCurrency(maxExpense.amount)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Paid by {maxExpense.paidBy.name}
          </span>
        </div>
      )}
    </div>
  );
}
