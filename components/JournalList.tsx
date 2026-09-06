'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import { DuoIcon } from '@/components/DuoIcon';
import type { JournalEntry } from '@/lib/types';

interface JournalListProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewReflection: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  isLoading: boolean;
}

export const JournalList: React.FC<JournalListProps> = ({
  entries,
  onSelectEntry,
  onNewReflection,
  onDeleteEntry,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const themeScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Extract unique themes from all entries
  const allThemes = useMemo(() => {
    const themeSet = new Set<string>();
    entries.forEach((e) => {
      e.keyThemes?.forEach((t) => themeSet.add(t));
    });
    return Array.from(themeSet).slice(0, 30);
  }, [entries]);

  // Track scroll position to dynamically show/hide left & right gradient fades and arrows
  const updateScrollButtons = useCallback(() => {
    if (!themeScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = themeScrollRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [allThemes, updateScrollButtons]);

  // Industry-standard chevron step scroll
  const scrollByAmount = (amount: number) => {
    if (!themeScrollRef.current) return;
    themeScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Filter entries based on query and selected theme
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.mood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.keyThemes?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTheme = !selectedTheme || entry.keyThemes?.includes(selectedTheme);

      return matchesSearch && matchesTheme;
    });
  }, [entries, searchQuery, selectedTheme]);

  const executeDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await onDeleteEntry(id);
      setConfirmingId(null);
    } finally {
      setDeletingId(null);
    }
  };

  // Helper for valence dot color in Apple HIG theme (only dot is colored, pill stays neutral)
  const getMoodDotColor = (score: number) => {
    if (score > 0.3) {
      return 'bg-[#30D158] shadow-[0_0_6px_rgba(48,209,88,0.5)]';
    } else if (score < -0.2) {
      return 'bg-[#FF9F0A] shadow-[0_0_6px_rgba(255,159,10,0.5)]';
    } else {
      return 'bg-[#8E8E93]';
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pt-6 sm:pt-8 pb-12 sm:pb-16 space-y-6">
      
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
            Journal Reflections
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#8E8E93] mt-0.5">
            {entries.length} {entries.length === 1 ? 'reflection' : 'reflections'} stored securely in your isolated vault
          </p>
        </div>

        <button
          id="tip-reflections-new"
          onClick={onNewReflection}
          aria-label="Start new journaling session"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-[#007AFF] hover:bg-[#0071E3] dark:text-black dark:bg-[#F5F5F7] dark:hover:bg-white border border-[#007AFF] dark:border-transparent shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0"
        >
          <DuoIcon name="message-2" className="w-4 h-4 text-current" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Search & Theme Filter Bar */}
      <div id="tip-reflections-search" className="space-y-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries by title, thoughts, mood, or topics..."
            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/15 dark:hover:border-white/15 focus:border-black/20 dark:focus:border-white/20 text-[#1D1D1F] dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 p-1 rounded-md text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Theme Pills with industry-standard carousel controls and dual fade masks */}
        {allThemes.length > 0 && (
          <div className="relative w-full flex items-center">
            {/* Left Fade Gradient & Scroll Arrow */}
            <div
              className={`absolute left-0 top-0 bottom-0 z-10 flex items-center pr-8 bg-gradient-to-r from-[#F2F2F7] dark:from-[#121214] via-[#F2F2F7]/90 dark:via-[#121214]/90 to-transparent transition-opacity duration-200 pointer-events-none ${
                canScrollLeft ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                type="button"
                onClick={() => scrollByAmount(-220)}
                aria-label="Scroll themes left"
                disabled={!canScrollLeft}
                className="pointer-events-auto p-1.5 rounded-full bg-white dark:bg-[#2C2C2E] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A] text-stone-700 dark:text-stone-200 border border-black/10 dark:border-white/10 shadow-xs transition-all active:scale-90 cursor-pointer ml-0.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Track (no scrollbar, industry-standard smooth button scroll) */}
            <div
              ref={themeScrollRef}
              onScroll={updateScrollButtons}
              className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1 text-xs scroll-smooth select-none w-full"
            >
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 mr-1.5 flex items-center shrink-0 select-none">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-current" />
                Filter:
              </span>
              <button
                onClick={() => setSelectedTheme(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedTheme === null
                    ? 'bg-[#1D1D1F] text-white dark:bg-white dark:text-black border border-transparent shadow-2xs'
                    : 'bg-white dark:bg-[#1C1C1E] text-[#6E6E73] dark:text-[#8E8E93] border border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-stone-50 dark:hover:bg-[#252528]'
                }`}
              >
                All
              </button>
              {allThemes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    selectedTheme === theme
                      ? 'bg-[#1D1D1F] text-white dark:bg-white dark:text-black border border-transparent shadow-2xs'
                    : 'bg-white dark:bg-[#1C1C1E] text-[#6E6E73] dark:text-[#8E8E93] border border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-stone-50 dark:hover:bg-[#252528]'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>

            {/* Right Fade Gradient & Scroll Arrow */}
            <div
              className={`absolute right-0 top-0 bottom-0 z-10 flex items-center pl-8 bg-gradient-to-l from-[#F2F2F7] dark:from-[#121214] via-[#F2F2F7]/90 dark:via-[#121214]/90 to-transparent transition-opacity duration-200 pointer-events-none ${
                canScrollRight ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                type="button"
                onClick={() => scrollByAmount(220)}
                aria-label="Scroll themes right"
                disabled={!canScrollRight}
                className="pointer-events-auto p-1.5 rounded-full bg-white dark:bg-[#2C2C2E] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A] text-stone-700 dark:text-stone-200 border border-black/10 dark:border-white/10 shadow-xs transition-all active:scale-90 cursor-pointer mr-0.5"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#D1D1D6] dark:border-[#38383A] border-t-[#007AFF] dark:border-t-[#0A84FF] rounded-full animate-spin" />
          <span className="text-xs text-[#6E6E73] dark:text-[#8E8E93]">Decrypting vault records...</span>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-16 text-center border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-8 bg-white dark:bg-[#1C1C1E] shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center mx-auto mb-3.5 text-[#86868B] dark:text-[#8E8E93]">
            <DuoIcon name="book-2" className="w-6 h-6 text-current" />
          </div>
          <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white mb-1">
            {searchQuery || selectedTheme ? 'No matching reflections found' : 'Your journal is currently quiet'}
          </h3>
          <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-sm mx-auto mb-4">
            {searchQuery || selectedTheme
              ? 'Try adjusting your search criteria or resetting the theme filter.'
              : 'Start a conversation with your Gemini companion to reflect on your day and synthesize your thoughts.'}
          </p>
          {!searchQuery && !selectedTheme && (
            <button
              onClick={onNewReflection}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0071E3] dark:text-black dark:bg-white dark:hover:bg-stone-100 border border-[#007AFF] dark:border-transparent transition-all shadow-xs cursor-pointer"
            >
              <DuoIcon name="message-2" className="w-3.5 h-3.5 text-current" />
              <span>Begin Your First Reflection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="group p-5 sm:p-5.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.07] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/20 hover:bg-[#FAFAFC] dark:hover:bg-[#222225] cursor-pointer transition-all duration-150 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/5 dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#E5E5EA] border border-black/5 dark:border-white/10">
                      <span className={`w-1.5 h-1.5 rounded-full ${getMoodDotColor(entry.sentimentScore)} shrink-0`} />
                      <span>{entry.mood}</span>
                    </span>

                    <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93] font-medium flex items-center">
                      <DuoIcon name="calendar" className="w-3 h-3 mr-1 inline text-current" />
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93] font-medium">
                      • {entry.messageCount} {entry.messageCount === 1 ? 'turn' : 'turns'}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#ECECEC] tracking-tight group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition-colors truncate">
                    {entry.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {confirmingId === entry.id ? (
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => executeDelete(e, entry.id)}
                        disabled={deletingId === entry.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs cursor-pointer"
                      >
                        {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmingId(null);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingId(entry.id);
                      }}
                      title="Delete entry"
                      aria-label="Delete entry"
                      className="p-1.5 text-[#86868B] hover:text-[#FF3B30] hover:bg-rose-50 dark:text-[#8E8E93] dark:hover:text-[#FF453A] dark:hover:bg-rose-950/30 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#86868B] dark:text-[#636366] group-hover:text-[#1D1D1F] dark:group-hover:text-[#D1D1D6] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Summary Snippet */}
              <p className="text-xs sm:text-sm text-[#48484A] dark:text-[#A1A1A6] line-clamp-2 leading-relaxed mb-3">
                {entry.summary}
              </p>

              {/* Theme Tags */}
              {entry.keyThemes && entry.keyThemes.length > 0 && (
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  {entry.keyThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.08] text-[#6E6E73] dark:text-[#8E8E93]"
                    >
                      <DuoIcon name="bookmark" className="w-2.5 h-2.5 mr-1 text-current opacity-70" />
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Bottom Fade (Apple HIG Edge Dissolution) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 right-0 h-10 sm:h-14 bg-gradient-to-t from-[#F2F2F7] via-[#F2F2F7]/70 to-transparent dark:from-[#121214] dark:via-[#121214]/70 dark:to-transparent z-20 transition-colors"
      />
    </div>
  );
};
