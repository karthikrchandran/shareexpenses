'use client';

import React from 'react';
import { Wifi } from 'lucide-react';

interface MobileStatusBarProps {
  osTheme: 'ios' | 'android';
  dynamicIslandMessage?: string | null;
}

export default function MobileStatusBar({ osTheme, dynamicIslandMessage }: MobileStatusBarProps) {
  if (osTheme === 'ios') {
    return (
      <div className="relative z-30 flex items-center justify-between px-7 pt-3.5 pb-2 text-slate-900 select-none">
        {/* iOS Time */}
        <div className="w-16 font-semibold text-[15px] tracking-tight text-center">
          9:41
        </div>

        {/* Dynamic Island Capsule */}
        <div
          className={`flex items-center justify-center transition-all duration-300 ease-out bg-black text-white ${
            dynamicIslandMessage
              ? 'px-3.5 py-1.5 rounded-full scale-100 shadow-md shadow-black/30'
              : 'w-28 h-[26px] rounded-full'
          }`}
        >
          {dynamicIslandMessage ? (
            <div className="flex items-center gap-2 text-xs font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="truncate max-w-[170px]">{dynamicIslandMessage}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full px-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-white/10"></div>
              <div className="w-2 h-2 rounded-full bg-[#0a1a36]/60 border border-blue-500/20"></div>
            </div>
          )}
        </div>

        {/* iOS Status Right Icons: Cellular, Wifi, Battery */}
        <div className="w-16 flex items-center justify-end gap-1.5">
          {/* Signal Bars */}
          <div className="flex items-end gap-[1.5px] h-3">
            <span className="w-[3px] h-1.5 bg-slate-900 rounded-[0.5px]"></span>
            <span className="w-[3px] h-2 bg-slate-900 rounded-[0.5px]"></span>
            <span className="w-[3px] h-2.5 bg-slate-900 rounded-[0.5px]"></span>
            <span className="w-[3px] h-3 bg-slate-900 rounded-[0.5px]"></span>
          </div>

          {/* Wifi */}
          <Wifi size={14} className="stroke-[2.5] text-slate-900" />

          {/* Battery */}
          <div className="relative flex items-center">
            <div className="w-[22px] h-[11px] rounded-[3.5px] border border-slate-900/80 p-[1.5px] flex items-center">
              <div className="w-full h-full bg-slate-900 rounded-[1.5px]"></div>
            </div>
            <div className="w-[1px] h-[4px] bg-slate-900/80 rounded-r-sm -ml-[0.5px]"></div>
          </div>
        </div>
      </div>
    );
  }

  // Android Material 3 Status Bar
  return (
    <div className="relative z-30 flex items-center justify-between px-6 pt-2 pb-1.5 text-slate-800 text-xs font-medium select-none">
      {/* Android Time & Notification Dot */}
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-normal text-[13px]">10:00</span>
        <div className="flex items-center gap-1 opacity-70">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
        </div>
      </div>

      {/* Android Punch Hole Camera */}
      <div className="w-3.5 h-3.5 rounded-full bg-black/85 border border-black/20 flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-[#1e293b]/50"></div>
      </div>

      {/* Android Icons: 5G, Wifi, Battery */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-700 tracking-wider">5G</span>
        <Wifi size={13} className="text-slate-800" />
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span>88%</span>
          <div className="w-4 h-2.5 border border-slate-700 rounded-sm p-[1px] flex items-center">
            <div className="w-[88%] h-full bg-slate-800 rounded-xs"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
