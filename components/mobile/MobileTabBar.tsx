'use client';

import React from 'react';
import {
  CreditCard,
  PieChart,
  Plus,
  Receipt,
  Users,
} from 'lucide-react';

export type MobileTab = 'feed' | 'groups' | 'settle' | 'analytics';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onOpenAddModal: () => void;
  osTheme: 'ios' | 'android';
  pendingSettlementCount?: number;
}

export default function MobileTabBar({
  activeTab,
  onTabChange,
  onOpenAddModal,
  osTheme,
  pendingSettlementCount = 2,
}: MobileTabBarProps) {
  if (osTheme === 'ios') {
    return (
      <div className="relative z-20 select-none">
        {/* iOS Frosted Glass Tab Bar */}
        <div className="border-t border-slate-200/80 bg-white/85 backdrop-blur-xl px-4 pt-2 pb-1 flex items-center justify-around shadow-lg shadow-slate-900/5">
          {/* Feed */}
          <button
            onClick={() => onTabChange('feed')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'feed'
                ? 'text-indigo-600 font-semibold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Receipt size={21} className={activeTab === 'feed' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[10px] tracking-tight">Activity</span>
          </button>

          {/* Groups */}
          <button
            onClick={() => onTabChange('groups')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'groups'
                ? 'text-indigo-600 font-semibold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users size={21} className={activeTab === 'groups' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[10px] tracking-tight">Trips</span>
          </button>

          {/* iOS Center Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="flex flex-col items-center justify-center -mt-5"
            aria-label="Add Expense"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/35 active:scale-95 transition-transform border-[3px] border-white">
              <Plus size={24} className="stroke-[2.8]" />
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 mt-0.5">Add</span>
          </button>

          {/* Settle */}
          <button
            onClick={() => onTabChange('settle')}
            className={`relative flex flex-col items-center gap-1 transition-all ${
              activeTab === 'settle'
                ? 'text-indigo-600 font-semibold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CreditCard size={21} className={activeTab === 'settle' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[10px] tracking-tight">Settle</span>
            {pendingSettlementCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {pendingSettlementCount}
              </span>
            )}
          </button>

          {/* Analytics */}
          <button
            onClick={() => onTabChange('analytics')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'analytics'
                ? 'text-indigo-600 font-semibold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PieChart size={21} className={activeTab === 'analytics' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[10px] tracking-tight">Insights</span>
          </button>
        </div>

        {/* iOS Home Indicator Bar */}
        <div className="bg-white/85 backdrop-blur-xl pb-2 pt-1 flex justify-center">
          <div className="w-32 h-1 bg-slate-900/35 rounded-full"></div>
        </div>
      </div>
    );
  }

  // Android Material 3 Bottom Navigation
  return (
    <div className="relative z-20 select-none">
      {/* Android M3 Navigation Bar */}
      <div className="border-t border-slate-200 bg-slate-50 px-2 py-2 flex items-center justify-around">
        {/* Feed */}
        <button
          onClick={() => onTabChange('feed')}
          className="flex flex-col items-center gap-1 min-w-[56px]"
        >
          <div
            className={`px-4 py-1 rounded-full transition-colors ${
              activeTab === 'feed'
                ? 'bg-indigo-100 text-indigo-900 font-bold'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <Receipt size={20} />
          </div>
          <span className="text-[11px] font-medium text-slate-800">Expenses</span>
        </button>

        {/* Groups */}
        <button
          onClick={() => onTabChange('groups')}
          className="flex flex-col items-center gap-1 min-w-[56px]"
        >
          <div
            className={`px-4 py-1 rounded-full transition-colors ${
              activeTab === 'groups'
                ? 'bg-indigo-100 text-indigo-900 font-bold'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <Users size={20} />
          </div>
          <span className="text-[11px] font-medium text-slate-800">Groups</span>
        </button>

        {/* Settle */}
        <button
          onClick={() => onTabChange('settle')}
          className="relative flex flex-col items-center gap-1 min-w-[56px]"
        >
          <div
            className={`px-4 py-1 rounded-full transition-colors ${
              activeTab === 'settle'
                ? 'bg-indigo-100 text-indigo-900 font-bold'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <CreditCard size={20} />
          </div>
          <span className="text-[11px] font-medium text-slate-800">Balances</span>
          {pendingSettlementCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>

        {/* Analytics */}
        <button
          onClick={() => onTabChange('analytics')}
          className="flex flex-col items-center gap-1 min-w-[56px]"
        >
          <div
            className={`px-4 py-1 rounded-full transition-colors ${
              activeTab === 'analytics'
                ? 'bg-indigo-100 text-indigo-900 font-bold'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <PieChart size={20} />
          </div>
          <span className="text-[11px] font-medium text-slate-800">Reports</span>
        </button>
      </div>

      {/* Android Gesture Bar */}
      <div className="bg-slate-50 pb-2 pt-1 flex justify-center">
        <div className="w-24 h-1 bg-slate-400 rounded-full"></div>
      </div>
    </div>
  );
}
