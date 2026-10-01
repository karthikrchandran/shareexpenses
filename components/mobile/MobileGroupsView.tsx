'use client';

import React from 'react';
import { MobileGroup } from './mockData';
import { Plus, Share2, Users, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MobileGroupsViewProps {
  groups: MobileGroup[];
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  onShareGroup: (group: MobileGroup) => void;
  osTheme: 'ios' | 'android';
}

export default function MobileGroupsView({
  groups,
  onSelectGroup,
  onOpenCreateGroup,
  onShareGroup,
  osTheme,
}: MobileGroupsViewProps) {
  return (
    <div className="p-4 pb-8 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Trips & Groups</h2>
          <p className="text-xs text-slate-500">Shared circles with friends</p>
        </div>

        <button
          onClick={onOpenCreateGroup}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition ${
            osTheme === 'ios'
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <Plus size={14} />
          <span>New Group</span>
        </button>
      </div>

      {/* Cards List */}
      <div className="space-y-3.5">
        {groups.map((group) => {
          const isPositive = group.userBalance >= 0;
          return (
            <div
              key={group.id}
              className="rounded-3xl bg-white border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition overflow-hidden relative"
            >
              {/* Top Accent Strip */}
              <div
                className={`h-1.5 w-full bg-gradient-to-r ${group.coverGradient} absolute top-0 left-0`}
              ></div>

              <div className="flex items-start justify-between mb-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-xl shadow-xs border border-slate-200/50">
                    {group.emoji}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{group.name}</h3>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {group.category} • {group.members.length} members
                    </div>
                  </div>
                </div>

                {/* Share Link Button */}
                <button
                  onClick={() => onShareGroup(group)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                  title="Share invite link"
                >
                  <Share2 size={15} />
                </button>
              </div>

              {/* Members Avatars Row */}
              <div className="flex items-center justify-between py-2 border-y border-slate-100 mb-3">
                <div className="flex items-center -space-x-2">
                  {group.members.map((member, idx) => (
                    <img
                      key={member.id || idx}
                      src={member.avatar}
                      alt={member.name}
                      className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-xs"
                      title={member.name}
                    />
                  ))}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Spend</span>
                  <span className="text-xs font-bold text-slate-800">
                    {formatCurrency(group.totalSpend)}
                  </span>
                </div>
              </div>

              {/* Bottom Row: Your Balance & Action */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Your Balance</span>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-sm font-bold ${
                        group.userBalance === 0
                          ? 'text-slate-600'
                          : isPositive
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {group.userBalance === 0
                        ? 'Settled up'
                        : isPositive
                        ? `+${formatCurrency(group.userBalance)}`
                        : `-${formatCurrency(Math.abs(group.userBalance))}`}
                    </span>
                    {group.userBalance !== 0 && (
                      <span className="text-[10px] text-slate-400">
                        {isPositive ? 'owed to you' : 'you owe'}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onSelectGroup(group.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300 text-slate-700 font-semibold text-xs transition"
                >
                  <span>View</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
