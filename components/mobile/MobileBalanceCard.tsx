'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Send, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MobileBalanceCardProps {
  netBalance: number;
  totalOwedToYou: number;
  totalYouOwe: number;
  selectedGroupName?: string;
  onOpenAddExpense: () => void;
  onOpenSettle: () => void;
  osTheme: 'ios' | 'android';
}

export default function MobileBalanceCard({
  netBalance,
  totalOwedToYou,
  totalYouOwe,
  selectedGroupName,
  onOpenAddExpense,
  onOpenSettle,
  osTheme,
}: MobileBalanceCardProps) {
  const isPositive = netBalance >= 0;

  if (osTheme === 'ios') {
    return (
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-xl shadow-indigo-950/20 border border-white/10 select-none">
        {/* Subtle decorative radial gradients */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/15 rounded-full blur-xl pointer-events-none"></div>

        {/* Header line: Scope & card chip */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-medium text-indigo-200 border border-white/10">
            <Sparkles size={11} className="text-amber-300" />
            <span className="truncate max-w-[170px]">
              {selectedGroupName ? selectedGroupName : 'Total Net Balance'}
            </span>
          </div>

          <span className="text-[10px] font-semibold tracking-widest uppercase text-white/50">
            APPLE CASH
          </span>
        </div>

        {/* Big Balance Amount */}
        <div className="mb-4">
          <div className="text-[12px] text-white/70 font-medium mb-0.5">
            {isPositive ? 'You are owed overall' : 'You owe overall'}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-sans">
              {formatCurrency(Math.abs(netBalance))}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isPositive
                  ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
              }`}
            >
              {isPositive ? '+ In your favor' : '- To pay back'}
            </span>
          </div>
        </div>

        {/* Breakdown Row: In vs Out */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-white/5 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ArrowDownLeft size={15} />
            </div>
            <div>
              <div className="text-[10px] text-white/60">Owed to you</div>
              <div className="text-xs font-bold text-emerald-300">
                {formatCurrency(totalOwedToYou)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <ArrowUpRight size={15} />
            </div>
            <div>
              <div className="text-[10px] text-white/60">You owe</div>
              <div className="text-xs font-bold text-rose-300">
                {formatCurrency(totalYouOwe)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddExpense}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white text-slate-900 font-semibold text-xs shadow hover:bg-slate-100 active:scale-98 transition"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>Add Expense</span>
          </button>

          <button
            onClick={onOpenSettle}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/20 active:scale-98 text-white font-semibold text-xs border border-white/20 transition backdrop-blur-md"
          >
            <Send size={13} />
            <span>Settle Up</span>
          </button>
        </div>
      </div>
    );
  }

  // Android Material 3 Card
  return (
    <div className="relative overflow-hidden rounded-3xl bg-indigo-50 border border-indigo-100 p-5 text-slate-900 shadow-sm select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          {selectedGroupName ? selectedGroupName : 'Net Balance'}
        </span>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
          Google Wallet
        </span>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {formatCurrency(Math.abs(netBalance))}
        </div>
        <div className="text-xs font-medium text-slate-600 mt-0.5">
          {isPositive ? 'People owe you money' : 'You have pending balances to pay'}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-slate-200/60 mb-4">
        <div>
          <span className="text-[11px] text-slate-500 block">You are owed</span>
          <span className="text-sm font-bold text-emerald-600">
            +{formatCurrency(totalOwedToYou)}
          </span>
        </div>
        <div className="w-[1px] h-7 bg-slate-200"></div>
        <div>
          <span className="text-[11px] text-slate-500 block">You owe</span>
          <span className="text-sm font-bold text-rose-600">
            -{formatCurrency(totalYouOwe)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAddExpense}
          className="flex-1 py-2.5 px-3 rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Plus size={15} />
          <span>Add Expense</span>
        </button>

        <button
          onClick={onOpenSettle}
          className="flex-1 py-2.5 px-3 rounded-full bg-white hover:bg-slate-100 active:bg-slate-200 text-indigo-700 border border-indigo-200 font-medium text-xs flex items-center justify-center gap-1.5 transition"
        >
          <Send size={13} />
          <span>Settle Up</span>
        </button>
      </div>
    </div>
  );
}
