'use client';

import React from 'react';
import { MobileGroup } from './mockData';
import { Plus, Sparkles } from 'lucide-react';

interface MobileGroupStoriesProps {
  groups: MobileGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onOpenCreateGroup?: () => void;
  osTheme: 'ios' | 'android';
}

export default function MobileGroupStories({
  groups,
  selectedGroupId,
  onSelectGroup,
  onOpenCreateGroup,
  osTheme,
}: MobileGroupStoriesProps) {
  return (
    <div className="py-2 select-none">
      <div className="flex items-center justify-between px-4 mb-2">
        <span className="text-xs font-bold text-slate-700 tracking-tight">
          Active Trips & Circles
        </span>
        <button
          onClick={() => onSelectGroup(null)}
          className={`text-[11px] font-semibold transition ${
            selectedGroupId === null
              ? 'text-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          View All
        </button>
      </div>

      {/* Horizontal Snap Scroll */}
      <div className="flex items-center gap-3 overflow-x-auto px-4 pb-1 no-scrollbar scroll-smooth">
        {/* "All" pill */}
        <button
          onClick={() => onSelectGroup(null)}
          className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            selectedGroupId === null
              ? osTheme === 'ios'
                ? 'bg-slate-900 text-white shadow-sm scale-102'
                : 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/50'
          }`}
        >
          <Sparkles size={12} />
          <span>All</span>
        </button>

        {/* Group Pills */}
        {groups.map((group) => {
          const isSelected = selectedGroupId === group.id;
          return (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? osTheme === 'ios'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-102'
                    : 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/70 shadow-xs'
              }`}
            >
              <span className="text-sm">{group.emoji}</span>
              <span className="font-semibold truncate max-w-[110px]">{group.name}</span>
              {group.userBalance !== 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : group.userBalance > 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {group.userBalance > 0
                    ? `+$${Math.abs(group.userBalance).toFixed(0)}`
                    : `-$${Math.abs(group.userBalance).toFixed(0)}`}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Add Trip Circle */}
        {onOpenCreateGroup && (
          <button
            onClick={onOpenCreateGroup}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100/80 hover:bg-slate-200 text-slate-600 border border-dashed border-slate-300 transition"
          >
            <Plus size={13} />
            <span>New</span>
          </button>
        )}
      </div>
    </div>
  );
}
