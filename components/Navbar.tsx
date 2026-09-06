'use client';

import React from 'react';
import { LogOut, Download, HelpCircle } from 'lucide-react';
import { DuoIcon } from '@/components/DuoIcon';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  activeTab: 'chat' | 'journal' | 'insights';
  setActiveTab: (tab: 'chat' | 'journal' | 'insights') => void;
  onSignOut: () => void;
  onOpenPrivacy: () => void;
  onOpenSecurity: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenTour?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onSignOut,
  onOpenPrivacy,
  onOpenSecurity,
  darkMode,
  setDarkMode,
  onOpenTour,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[rgba(60,60,67,0.18)] dark:border-[rgba(255,255,255,0.10)] bg-[rgba(246,246,246,0.85)] dark:bg-[rgba(38,38,38,0.82)] backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          {/* Apple Safari-style Text Monogram Icon */}
          <div
            aria-hidden="true"
            className="w-8 h-8 rounded-[9px] flex items-center justify-center select-none shrink-0 transition-all duration-150
              bg-gradient-to-b from-[#FFFFFF] to-[#ECECED] text-[#1D1D1F] border border-black/[0.12] shadow-[0_1px_2.5px_rgba(0,0,0,0.08),0_0.5px_1px_rgba(0,0,0,0.04)]
              dark:bg-gradient-to-b dark:from-[#3A3A3C] dark:to-[#222224] dark:text-white dark:border-white/[0.14] dark:shadow-[0_1px_3px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]"
          >
            <span className="font-semibold text-[12.5px] tracking-tight font-sans">MI</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#1D1D1F] dark:text-white select-none">
            MindMirror
          </span>
        </div>

        {/* Center Tabs (Apple-style segmented control with fluid spring motion) */}
        {user && (
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 p-1 bg-[rgba(118,118,128,0.12)] dark:bg-[rgba(0,0,0,0.28)] rounded-xl border border-[rgba(60,60,67,0.10)] dark:border-[rgba(255,255,255,0.08)] relative select-none">
            <button
              onClick={() => setActiveTab('chat')}
              className={`relative inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
                activeTab === 'chat'
                  ? 'text-[#1D1D1F] dark:text-white font-semibold'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white'
              }`}
            >
              {activeTab === 'chat' && (
                <motion.div
                  layoutId="active-desktop-nav-pill"
                  className="absolute inset-0 rounded-lg bg-white dark:bg-[#38383A] border border-black/[0.06] dark:border-white/[0.12] shadow-xs pointer-events-none"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center space-x-2">
                <DuoIcon name="message-2" className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#0A84FF]" />
                <span>Conversation</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('journal')}
              id="tip-reflections"
              className={`relative inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
                activeTab === 'journal'
                  ? 'text-[#1D1D1F] dark:text-white font-semibold'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white'
              }`}
            >
              {activeTab === 'journal' && (
                <motion.div
                  layoutId="active-desktop-nav-pill"
                  className="absolute inset-0 rounded-lg bg-white dark:bg-[#38383A] border border-black/[0.06] dark:border-white/[0.12] shadow-xs pointer-events-none"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center space-x-2">
                <DuoIcon name="book-2" className="w-3.5 h-3.5 text-current" />
                <span>Reflections</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              id="tip-insights"
              className={`relative inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
                activeTab === 'insights'
                  ? 'text-[#1D1D1F] dark:text-white font-semibold'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white'
              }`}
            >
              {activeTab === 'insights' && (
                <motion.div
                  layoutId="active-desktop-nav-pill"
                  className="absolute inset-0 rounded-lg bg-white dark:bg-[#38383A] border border-black/[0.06] dark:border-white/[0.12] shadow-xs pointer-events-none"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center space-x-2">
                <DuoIcon name="compass" className="w-3.5 h-3.5 text-[#34C759] dark:text-[#30D158]" />
                <span>Longitudinal Insights</span>
              </span>
            </button>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Security Constitution Inspector Button (Hidden for clean consumer UI, code preserved) */}
          <button
            onClick={onOpenSecurity}
            title="Inspect Security Model & Rules"
            aria-label="Security Model & Firestore Rules"
            className="hidden items-center space-x-1.5 px-3 py-1.5 text-[11px] font-medium text-[#248A3D] dark:text-[#30D158] bg-white dark:bg-[#2C2C2E] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] rounded-lg border border-[#D1D1D6] dark:border-[#3A3A3C] shadow-2xs transition-colors"
          >
            <DuoIcon name="certificate" className="w-3.5 h-3.5 text-current" />
            <span className="hidden sm:inline">Firestore Isolated</span>
          </button>

          {/* Help & Walkthrough Button (Apple HIG Re-discovery) */}
          {user && onOpenTour && (
            <button
              onClick={onOpenTour}
              title="Help & Interactive Tour"
              aria-label="Help & Interactive Tour"
              className="p-2 text-[#6E6E73] hover:text-[#007AFF] hover:bg-black/5 dark:text-[#8E8E93] dark:hover:text-[#0A84FF] dark:bg-transparent dark:hover:bg-[rgba(255,255,255,0.08)] border border-transparent dark:hover:border-[#3A3A3C] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-inherit" />
            </button>
          )}

          {/* Privacy & Export Button */}
          {user && (
            <button
              onClick={onOpenPrivacy}
              title="Privacy & Data Sovereignty (Export Records)"
              aria-label="Export Journal Data & Privacy Controls"
              className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/5 dark:text-[#8E8E93] dark:hover:text-white dark:bg-transparent dark:hover:bg-[rgba(255,255,255,0.08)] border border-transparent dark:hover:border-[#3A3A3C] rounded-lg transition-colors flex items-center justify-center"
            >
              <Download className="w-4 h-4 text-inherit" />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Appearance' : 'Switch to Dark Appearance'}
            aria-label="Toggle theme appearance"
            className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/5 dark:text-[#8E8E93] dark:hover:text-white dark:bg-transparent dark:hover:bg-[rgba(255,255,255,0.08)] border border-transparent dark:hover:border-[#3A3A3C] rounded-lg transition-colors flex items-center justify-center"
          >
            {darkMode ? (
              <DuoIcon name="sun" className="w-4 h-4 text-[#FF9500] dark:text-[#FF9F0A]" />
            ) : (
              <DuoIcon name="moon-stars" className="w-4 h-4 text-[#AF52DE] dark:text-[#BF5AF2]" />
            )}
          </button>

          {/* User Sign Out / Profile */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-[#D1D1D6] dark:border-[rgba(255,255,255,0.12)]">
              <div className="hidden lg:flex items-center space-x-2 p-1.5 px-2.5 rounded-lg bg-white dark:bg-[#2C2C2E] border border-[#D1D1D6] dark:border-[#3A3A3C] shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] flex items-center justify-center text-[10px] font-bold text-[#1D1D1F] dark:text-white">
                  {(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white max-w-[140px] truncate leading-tight">
                  {user.displayName || user.email?.split('@')[0] || 'Authenticated User'}
                </span>
              </div>
              <button
                onClick={onSignOut}
                title="Sign out of journal"
                aria-label="Sign out"
                className="p-2 text-[#6E6E73] hover:text-[#FF3B30] hover:bg-rose-50 dark:text-[#8E8E93] dark:hover:text-[#FF453A] dark:hover:bg-rose-950/30 border border-transparent rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-xs text-[#6E6E73] dark:text-[#8E8E93]">
              <DuoIcon name="user" className="w-3.5 h-3.5" />
              <span>Unauthenticated</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation bar with fluid spring motion */}
      {user && (
        <div className="md:hidden flex items-center justify-around border-t border-[rgba(60,60,67,0.18)] dark:border-[rgba(255,255,255,0.10)] px-4 py-2 bg-[rgba(246,246,246,0.95)] dark:bg-[rgba(30,30,30,0.95)] backdrop-blur-xl relative select-none">
          <button
            onClick={() => setActiveTab('chat')}
            className={`relative inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'chat'
                ? 'text-[#1D1D1F] dark:text-white font-semibold'
                : 'text-[#6E6E73] dark:text-[#8E8E93]'
            }`}
          >
            {activeTab === 'chat' && (
              <motion.div
                layoutId="active-mobile-nav-pill"
                className="absolute inset-0 rounded-lg bg-white dark:bg-[#38383A] border border-black/[0.06] dark:border-white/[0.12] shadow-xs pointer-events-none"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-1.5">
              <DuoIcon name="message-2" className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#0A84FF]" />
              <span>Chat</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`relative inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'journal'
                ? 'text-[#1D1D1F] dark:text-white font-semibold'
                : 'text-[#6E6E73] dark:text-[#8E8E93]'
            }`}
          >
            {activeTab === 'journal' && (
              <motion.div
                layoutId="active-mobile-nav-pill"
                className="absolute inset-0 rounded-lg bg-white dark:bg-[#38383A] border border-black/[0.06] dark:border-white/[0.12] shadow-xs pointer-events-none"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-1.5">
              <DuoIcon name="book-2" className="w-3.5 h-3.5 text-current" />
              <span>Entries</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`relative inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'insights'
                ? 'text-[#1D1D1F] dark:text-white font-semibold'
                : 'text-[#6E6E73] dark:text-[#8E8E93]'
            }`}
          >
            {activeTab === 'insights' && (
              <motion.div
                layoutId="active-mobile-nav-pill"
                className="absolute inset-0 rounded-lg bg-white dark:bg-[#38383A] border border-black/[0.06] dark:border-white/[0.12] shadow-xs pointer-events-none"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-1.5">
              <DuoIcon name="compass" className="w-3.5 h-3.5 text-[#34C759] dark:text-[#30D158]" />
              <span>Insights</span>
            </span>
          </button>
        </div>
      )}
    </header>
  );
};
