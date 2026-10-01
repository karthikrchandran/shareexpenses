'use client';

import React from 'react';
import { MobileGroup } from './mockData';
import { Plus, Share2, Users, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MobileGroupsViewProps {
  groups: MobileGroup[];
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  onShareGroup: (group: MobileGroup) => void;
  onAddMember?: (group: MobileGroup) => void;
  osTheme: 'ios' | 'android';
}

export default function MobileGroupsView({
  groups,
  onSelectGroup,
  onOpenCreateGroup,
  onShareGroup,
  onAddMember,
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

      {groups.length === 0 ? (
        <div className="py-12 px-6 text-center bg-white rounded-3xl border border-slate-200/80 mt-2">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
            <Users size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No groups yet</h3>
          <p className="text-xs text-slate-500 max-w-[240px] mx-auto mb-4">
            Create your first shared group or trip to start splitting expenses with friends.
          </p>
          <button
            onClick={onOpenCreateGroup}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus size={15} />
            <span>Create a Group</span>
          </button>
        </div>
      ) : (
        /* Cards List */
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
                        {group.category} • {group.members.length} member{group.members.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-0.5">
                    {onAddMember && (
                      <button
                        onClick={() => onAddMember(group)}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition"
                        title="Add member"
                      >
                        <UserPlus size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => onShareGroup(group)}
                      className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                      title="Share invite link"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Members Avatars Row */}
                <div className="flex items-center justify-between py-2 border-y border-slate-100 mb-3">
                  <div className="flex items-center -space-x-2">
                    {group.members.slice(0, 5).map((member, idx) => (
                      <img
                        key={member.id || idx}
                        src={member.avatar}
                        alt={member.name}
                        className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-xs"
                        title={member.name}
                      />
                    ))}
                    {group.members.length > 5 && (
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                        +{group.members.length - 5}
                      </div>
                    )}
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
      )}
    </div>
  );
}
