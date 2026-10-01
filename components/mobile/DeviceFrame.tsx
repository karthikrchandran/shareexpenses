'use client';

import React from 'react';
import { Smartphone, Monitor, RotateCcw, ArrowLeft, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';

interface DeviceFrameProps {
  children: React.ReactNode;
  osTheme: 'ios' | 'android';
  setOsTheme: (theme: 'ios' | 'android') => void;
  frameMode: 'iphone' | 'pixel' | 'fullscreen';
  setFrameMode: (mode: 'iphone' | 'pixel' | 'fullscreen') => void;
  onResetData: () => void;
}

export default function DeviceFrame({
  children,
  osTheme,
  setOsTheme,
  frameMode,
  setFrameMode,
  onResetData,
}: DeviceFrameProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start select-none">
      {/* Top Floating Control Toolbar (Desktop / Tablet view) */}
      <header className="w-full max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md z-40">
        {/* Left: Brand & Back to Dashboard */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Web Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-tight">
              ShareExpenses Mobile
            </span>
          </div>
        </div>

        {/* Center: OS Selector (iOS vs Android) */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setOsTheme('ios')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              osTheme === 'ios'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span> iOS</span>
          </button>
          <button
            onClick={() => setOsTheme('android')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              osTheme === 'android'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🤖 Android</span>
          </button>
        </div>

        {/* Right: Device Frame Toggle & Reset */}
        <div className="flex items-center gap-2">
          {/* Frame Style */}
          <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setFrameMode('iphone')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                frameMode === 'iphone'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="iPhone 16 Pro Frame"
            >
              iPhone
            </button>
            <button
              onClick={() => setFrameMode('pixel')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                frameMode === 'pixel'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pixel 8 Frame"
            >
              Pixel
            </button>
            <button
              onClick={() => setFrameMode('fullscreen')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                frameMode === 'fullscreen'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full Screen Mobile View"
            >
              Full
            </button>
          </div>

          <button
            onClick={onResetData}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
            title="Reset to sample data"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex items-center justify-center p-0 sm:py-8 sm:px-4">
        {frameMode === 'fullscreen' ? (
          /* Full screen mobile presentation (e.g. for testing responsive mobile or actual mobile device) */
          <div className="w-full max-w-[440px] min-h-screen sm:min-h-[850px] sm:max-h-[880px] bg-slate-50 text-slate-900 sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col relative border-0 sm:border sm:border-slate-800">
            {children}
          </div>
        ) : frameMode === 'iphone' ? (
          /* iPhone 16 Pro Device Frame */
          <div className="relative w-full max-w-[412px] h-[100vh] sm:h-[860px] bg-slate-900 sm:rounded-[54px] p-0 sm:p-3 shadow-2xl shadow-indigo-950/60 ring-1 ring-slate-800/80 select-none">
            {/* Outer Titanium Trim and Buttons (visible on sm+) */}
            <div className="hidden sm:block absolute -left-[3px] top-[130px] w-[3px] h-[32px] bg-slate-700 rounded-l-sm"></div>
            <div className="hidden sm:block absolute -left-[3px] top-[180px] w-[3px] h-[55px] bg-slate-700 rounded-l-sm"></div>
            <div className="hidden sm:block absolute -left-[3px] top-[245px] w-[3px] h-[55px] bg-slate-700 rounded-l-sm"></div>
            <div className="hidden sm:block absolute -right-[3px] top-[190px] w-[3px] h-[75px] bg-slate-700 rounded-r-sm"></div>

            {/* Inner Screen Bezel */}
            <div className="w-full h-full bg-slate-50 text-slate-900 sm:rounded-[44px] overflow-hidden flex flex-col relative shadow-inner">
              {children}
            </div>
          </div>
        ) : (
          /* Google Pixel 8 Frame */
          <div className="relative w-full max-w-[410px] h-[100vh] sm:h-[850px] bg-zinc-800 sm:rounded-[42px] p-0 sm:p-3 shadow-2xl shadow-black/80 select-none">
            {/* Pixel side buttons */}
            <div className="hidden sm:block absolute -right-[3px] top-[160px] w-[3px] h-[40px] bg-zinc-600 rounded-r-sm"></div>
            <div className="hidden sm:block absolute -right-[3px] top-[220px] w-[3px] h-[60px] bg-zinc-600 rounded-r-sm"></div>

            {/* Inner Screen */}
            <div className="w-full h-full bg-slate-50 text-slate-900 sm:rounded-[34px] overflow-hidden flex flex-col relative">
              {children}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
