'use client';

import React, { useState } from 'react';
import { MobileSettlement } from './mockData';
import { CheckCircle2, ChevronRight, CreditCard, Send, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MobileSettleViewProps {
  settlements: MobileSettlement[];
  currentUserId: string;
  onSettleClick: (settlement: MobileSettlement) => void;
  osTheme: 'ios' | 'android';
}

export default function MobileSettleView({
  settlements,
  currentUserId,
  onSettleClick,
  osTheme,
}: MobileSettleViewProps) {
  const [filter, setFilter] = useState<'all' | 'owed_to_you' | 'you_owe'>('all');

  const pendingSettlements = settlements.filter((s) => s.status === 'pending');

  const filteredSettlements = pendingSettlements.filter((s) => {
    if (filter === 'owed_to_you') return s.toUser.id === currentUserId;
    if (filter === 'you_owe') return s.fromUser.id === currentUserId;
    return true;
  });

  return (
    <div className="p-4 pb-8 select-none">
      {/* Top Title & Quick Filter */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Balances & Settle</h2>
        <p className="text-xs text-slate-500">Fast 1-tap friend settlements</p>

        {/* iOS Segmented Control / Android Pill Chips */}
        <div className="mt-3 flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('owed_to_you')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              filter === 'owed_to_you'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Owed to you
          </button>
          <button
            onClick={() => setFilter('you_owe')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              filter === 'you_owe'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            You owe
          </button>
        </div>
      </div>

      {filteredSettlements.length === 0 ? (
        <div className="py-12 px-6 text-center bg-white rounded-3xl border border-slate-200/80 mt-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 size={26} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">All settled up!</h3>
          <p className="text-xs text-slate-500 max-w-[220px] mx-auto">
            No pending balances in this filter. Everyone is even.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSettlements.map((settlement) => {
            const isOwedToMe = settlement.toUser.id === currentUserId;
            const counterpart = isOwedToMe ? settlement.fromUser : settlement.toUser;

            return (
              <div
                key={settlement.id}
                className="rounded-2xl bg-white border border-slate-200/80 p-3.5 shadow-xs flex items-center justify-between gap-3 hover:bg-slate-50/60 transition"
              >
                {/* User Info & Avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={counterpart.avatar}
                    alt={counterpart.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {counterpart.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {isOwedToMe ? 'owes you' : 'you owe'} in{' '}
                      <span className="font-semibold text-slate-600">
                        {settlement.groupName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Settle Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-sm font-extrabold ${
                        isOwedToMe ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(settlement.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {settlement.suggestedMethod === 'venmo'
                        ? 'via Venmo'
                        : settlement.suggestedMethod === 'apple-pay'
                        ? 'Apple Pay'
                        : 'Cash'}
                    </div>
                  </div>

                  <button
                    onClick={() => onSettleClick(settlement)}
                    className={`px-3 py-1.5 rounded-full font-semibold text-xs transition shadow-xs flex items-center gap-1 ${
                      isOwedToMe
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : osTheme === 'ios'
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <span>{isOwedToMe ? 'Request' : 'Pay'}</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instant Payment Tips Banner */}
      <div className="mt-6 rounded-2xl bg-indigo-50/80 border border-indigo-100 p-3.5 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={14} />
        </div>
        <div className="text-xs text-indigo-950">
          <span className="font-bold block mb-0.5">Simplified Debts</span>
          All split calculations are automatically minimized so you only make 1 payment instead of 5 separate transactions.
        </div>
      </div>
    </div>
  );
}
