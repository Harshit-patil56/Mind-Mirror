'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Trash2, MessageSquare, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { DuoIcon } from '@/components/DuoIcon';
import type { ConversationSession } from '@/lib/types';

interface ChatSidebarProps {
  conversations: ConversationSession[];
  activeSessionId: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectConversation: (session: ConversationSession) => void;
  onNewConversationClick: () => void;
  onDeleteConversation: (sessionId: string) => Promise<void>;
}

// Clever Apple-style relative date formatter
function formatCleverDate(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOf6DaysAgo = startOfToday - 86400000 * 6;
  const dateTime = date.getTime();

  // Today: show time e.g. "3:45 PM"
  if (dateTime >= startOfToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  // Yesterday: "Yesterday"
  if (dateTime >= startOfYesterday) {
    return 'Yesterday';
  }

  // Within last 6 days: show short weekday e.g. "Thu", "Wed"
  if (dateTime >= startOf6DaysAgo) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  // Earlier this year: show "Sep 5"
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Different year: show "8/12/25"
  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

// Conversation row item with strictly fixed dimensions (no expansion on hover) and marquee animation for long titles
const ConversationItem: React.FC<{
  conv: ConversationSession;
  isActive: boolean;
  cleverDate: string;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ conv, isActive, cleverDate, onSelect, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  const measureOverflow = () => {
    if (containerRef.current && textRef.current) {
      const diff = textRef.current.scrollWidth - containerRef.current.clientWidth;
      setOverflowDistance(diff > 0 ? diff : 0);
    }
  };

  useEffect(() => {
    measureOverflow();
  }, [conv.title]);

  const shouldMarquee = isHovered && overflowDistance > 0;
  const marqueeDuration = Math.min(6, Math.max(1.5, overflowDistance / 35));

  return (
    <div
      onMouseEnter={() => {
        setIsHovered(true);
        measureOverflow();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      className={`relative flex items-center justify-between h-10 px-3 rounded-lg text-xs transition-colors cursor-pointer w-full overflow-hidden select-none ${
        isActive
          ? 'bg-black/8 dark:bg-white/10 text-[#1D1D1F] dark:text-white font-medium shadow-2xs'
          : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-stone-900 dark:hover:text-white'
      }`}
    >
      {/* Title Container - fixed flex-1, never resizes or expands on hover */}
      <div ref={containerRef} className="flex-1 min-w-0 mr-2 overflow-hidden whitespace-nowrap relative flex items-center h-full">
        <span
          ref={textRef}
          className="inline-block whitespace-nowrap"
          style={
            shouldMarquee
              ? {
                  transform: `translateX(-${overflowDistance + 4}px)`,
                  transition: `transform ${marqueeDuration}s ease-in-out`,
                }
              : {
                  transform: 'translateX(0)',
                  transition: 'transform 0.25s ease-out',
                }
          }
        >
          {conv.title || 'Untitled Conversation'}
        </span>
      </div>

      {/* Right Action Container - strictly constant width w-12, zero layout shift */}
      <div className="relative w-12 h-6 shrink-0 flex items-center justify-end">
        {/* Date Display */}
        {cleverDate && (
          <span
            className={`text-[10px] text-stone-400 dark:text-stone-500 font-normal transition-opacity duration-150 absolute right-0 pointer-events-none ${
              isHovered ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {cleverDate}
          </span>
        )}

        {/* Delete Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${conv.title || 'conversation'}`}
          title="Delete chat"
          className={`p-1 rounded-md text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-opacity duration-150 cursor-pointer absolute right-0 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const PAGE_SIZE = 12;

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeSessionId,
  isOpen,
  onToggleOpen,
  onSelectConversation,
  onNewConversationClick,
  onDeleteConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<ConversationSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.messages?.some((m) => m.content?.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredConversations.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  // Auto-page to active conversation if needed
  useEffect(() => {
    if (!activeSessionId) return;
    const index = filteredConversations.findIndex((c) => c.id === activeSessionId);
    if (index !== -1) {
      const pageOfActive = Math.floor(index / PAGE_SIZE) + 1;
      setCurrentPage(pageOfActive);
    }
  }, [activeSessionId, filteredConversations]);

  const paginatedConversations = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredConversations.slice(start, start + PAGE_SIZE);
  }, [filteredConversations, safePage]);

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteConversation(sessionToDelete.id);
      setSessionToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelect = (conv: ConversationSession) => {
    onSelectConversation(conv);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggleOpen();
    }
  };

  const handleNewChat = () => {
    onNewConversationClick();
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggleOpen();
    }
  };

  return (
    <>
      {/* Mobile Dimming Backdrop (Apple iOS slide-over sheet pattern) */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* Sidebar Container: Fixed slide-over drawer on mobile (z-50), absolute docked drawer on desktop (z-20) */}
      <aside
        aria-label="Conversation History"
        className={`flex flex-col shrink-0 border-r border-[rgba(60,60,67,0.12)] dark:border-[rgba(255,255,255,0.08)] bg-[rgba(246,246,246,0.95)] dark:bg-[rgba(22,22,24,0.95)] backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.12)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out select-none fixed inset-y-0 left-0 z-50 md:absolute md:top-0 md:bottom-0 md:z-20 w-[280px] sm:w-64 md:h-[calc(100vh-4rem)] ${
          isOpen
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full flex flex-col h-full pt-3 md:pt-0">
          {/* Top Action: New Chat & Mobile Close Button */}
          <div className="p-3 pb-2 shrink-0 flex items-center space-x-2">
            <button
              type="button"
              onClick={handleNewChat}
              aria-label="New Conversation"
              className="flex-1 w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-xl text-[#1D1D1F] dark:text-white bg-white hover:bg-black/5 dark:bg-[#2C2C2E] dark:hover:bg-[#38383A] border border-black/10 dark:border-white/10 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <DuoIcon name="message-2" className="w-3.5 h-3.5 text-current" />
              <span>New Chat</span>
            </button>

            {/* Mobile Close Button - matching Apple SF Symbols panel icon (hidden on desktop) */}
            <button
              type="button"
              onClick={onToggleOpen}
              aria-label="Close conversation history"
              title="Close sidebar"
              className="md:hidden p-2 rounded-xl text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-[#2C2C2E] hover:bg-black/5 dark:hover:bg-[#38383A] border border-black/10 dark:border-white/10 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                {/* Outer window squircle */}
                <rect width="18" height="18" x="3" y="3" rx="2" />
                {/* Vertical divider line */}
                <path d="M9 3v18" />
                {/* Left pane fill representing active sidebar */}
                <rect
                  x="4"
                  y="4"
                  width="4"
                  height="16"
                  rx="1"
                  className="fill-current"
                  stroke="none"
                />
              </svg>
            </button>
          </div>

          {/* Search bar */}
          <div className="px-3 py-1 shrink-0">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/10 dark:focus:border-white/10 text-[#1D1D1F] dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Recents Header */}
          <div className="px-3 pt-2 pb-1 shrink-0">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-300 tracking-tight">
              Recents
            </span>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-1 space-y-0.5">
            {paginatedConversations.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageSquare className="w-6 h-6 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                <span className="text-xs text-stone-400 dark:text-stone-500 block font-medium">
                  {searchQuery ? 'No matching chats found' : 'No saved conversations'}
                </span>
                <span className="text-[11px] text-stone-400/80 dark:text-stone-600 block mt-1">
                  Start reflecting and your history will be preserved here.
                </span>
              </div>
            ) : (
              paginatedConversations.map((conv) => {
                const isActive = conv.id === activeSessionId;
                const cleverDate = formatCleverDate(conv.updatedAt || conv.createdAt);
                return (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={isActive}
                    cleverDate={cleverDate}
                    onSelect={() => handleSelect(conv)}
                    onDelete={() => setSessionToDelete(conv)}
                  />
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 shrink-0 select-none">
              <span className="text-[11px]">
                Page {safePage} of {totalPages}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  aria-label="Previous page"
                  className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  aria-label="Next page"
                  className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Delete Confirmation Modal (Apple HIG Style) */}
      {sessionToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center mx-auto mb-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>

            <h3 id="delete-modal-title" className="text-base font-semibold text-[#1D1D1F] dark:text-white mb-1.5 tracking-tight">
              Delete Conversation?
            </h3>
            <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] leading-relaxed mb-6">
              This will permanently delete &ldquo;{sessionToDelete.title || 'this conversation'}&rdquo; from your private vault. This action cannot be undone.
            </p>

            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                disabled={isDeleting}
                className="w-full py-2.5 px-4 text-xs font-medium rounded-xl text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
