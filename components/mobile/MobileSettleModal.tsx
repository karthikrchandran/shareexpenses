'use client';

import React, { useState } from 'react';
import { MobileSettlement, MobileUser } from './mockData';
import { Check, CheckCircle2, DollarSign, Send, Smartphone, Sparkles, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MobileSettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: MobileSettlement | null;
  currentUser: MobileUser;
  onConfirmSettlement: (settlementId: string, paymentMethod: string) => void;
  osTheme: 'ios' | 'android';
}

export default function MobileSettleModal({
  isOpen,
  onClose,
  settlement,
  currentUser,
  onConfirmSettlement,
  osTheme,
}: MobileSettleModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'venmo' | 'apple-pay' | 'cash'>('venmo');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !settlement) return null;

  const isOwedToMe = settlement.toUser.id === currentUser.id;
  const counterpart = isOwedToMe ? settlement.fromUser : settlement.toUser;

  const handleSettle = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onConfirmSettlement(settlement.id, selectedMethod);
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center select-none">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div
        className={`relative w-full max-w-[430px] bg-white p-5 flex flex-col z-10 shadow-2xl transition-all duration-300 ${
          osTheme === 'ios'
            ? 'rounded-t-[32px] border-t border-slate-200'
            : 'rounded-t-[28px]'
        }`}
      >
        {/* Drag Handle */}
        <div className="pt-0 pb-3 flex justify-center">
          <div className="w-10 h-1 bg-slate-300 rounded-full"></div>
        </div>

        {/* Success Splash */}
        {isSuccess ? (
          <div className="py-12 text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 size={38} className="animate-bounce" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Payment Recorded!</h3>
            <p className="text-xs text-slate-500">
              {formatCurrency(settlement.amount)} settled with {counterpart.name}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {isOwedToMe ? 'Request Payment' : 'Settle Up'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Recipient & Amount Card */}
            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={counterpart.avatar}
                  alt={counterpart.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{counterpart.name}</div>
                  <div className="text-[11px] text-slate-500">{counterpart.venmo || counterpart.email}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {settlement.groupName}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Amount</span>
                <span className="text-xl font-extrabold text-slate-900">
                  {formatCurrency(settlement.amount)}
                </span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-2 mb-5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Payment Channel
              </label>

              {/* Venmo */}
              <button
                type="button"
                onClick={() => setSelectedMethod('venmo')}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                  selectedMethod === 'venmo'
                    ? 'border-blue-500 bg-blue-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                    V
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Venmo</div>
                    <div className="text-[11px] text-slate-500">
                      Send to {counterpart.venmo || '@username'}
                    </div>
                  </div>
                </div>
                {selectedMethod === 'venmo' && <Check size={16} className="text-blue-600" />}
              </button>

              {/* Apple Pay / Google Pay */}
              <button
                type="button"
                onClick={() => setSelectedMethod('apple-pay')}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                  selectedMethod === 'apple-pay'
                    ? 'border-indigo-600 bg-indigo-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {osTheme === 'ios' ? '' : 'G'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {osTheme === 'ios' ? 'Apple Cash / Pay' : 'Google Pay'}
                    </div>
                    <div className="text-[11px] text-slate-500">1-tap wallet transfer</div>
                  </div>
                </div>
                {selectedMethod === 'apple-pay' && <Check size={16} className="text-indigo-600" />}
              </button>

              {/* Cash / In Person */}
              <button
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                  selectedMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Cash / Direct</div>
                    <div className="text-[11px] text-slate-500">Record manual payment</div>
                  </div>
                </div>
                {selectedMethod === 'cash' && <Check size={16} className="text-emerald-600" />}
              </button>
            </div>

            {/* Action Button */}
            <button
              onClick={handleSettle}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs text-white shadow-lg transition active:scale-98 flex items-center justify-center gap-2 ${
                osTheme === 'ios'
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              <Send size={15} />
              <span>
                {isOwedToMe ? 'Send Remind & Settle' : `Pay ${formatCurrency(settlement.amount)} Now`}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
