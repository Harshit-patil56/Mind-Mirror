'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, AlertTriangle } from 'lucide-react';
import { DuoIcon } from '@/components/DuoIcon';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartWithTitle: (customTitle: string) => void;
  onStartWithAutoName: () => void;
  hasUnsavedChanges?: boolean;
  onSaveCurrentFirst?: () => Promise<void>;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onStartWithTitle,
  onStartWithAutoName,
  hasUnsavedChanges = false,
  onSaveCurrentFirst,
}) => {
  const [titleInput, setTitleInput] = useState('');
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitleInput('');
      setIsSavingCurrent(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      onStartWithTitle(titleInput.trim());
    } else {
      onStartWithAutoName();
    }
  };

  const handleSaveFirst = async () => {
    if (!onSaveCurrentFirst) return;
    setIsSavingCurrent(true);
    try {
      await onSaveCurrentFirst();
      if (titleInput.trim()) {
        onStartWithTitle(titleInput.trim());
      } else {
        onStartWithAutoName();
      }
    } finally {
      setIsSavingCurrent(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-chat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 text-left animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 border border-[#007AFF]/20 dark:border-[#0A84FF]/30 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF] shrink-0">
              <DuoIcon name="message-2" className="w-5 h-5 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
            <div>
              <h3 id="new-chat-modal-title" className="text-base font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
                New Conversation
              </h3>
              <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93]">
                Name your session, or skip and let Gemini name it.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unsaved warning if active conversation was not saved */}
        {hasUnsavedChanges && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Current conversation unsaved</span>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                Starting a new conversation without saving will discard your unsaved messages.
              </p>
            </div>
          </div>
        )}

        {/* Title Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="chat-title-input" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Conversation Title <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <input
              ref={inputRef}
              id="chat-title-input"
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="e.g. Morning Wind-Down, Project Ideas..."
              maxLength={60}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#F4F4F4] dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white placeholder-[#8E8E93] focus:outline-hidden focus:ring-2 focus:ring-[#007AFF] transition-all"
            />
          </div>

          {/* Action Stack */}
          <div className="flex flex-col space-y-2 pt-1">
            {/* If unsaved, option to save current first - White Primary Button */}
            {hasUnsavedChanges && onSaveCurrentFirst && (
              <button
                type="button"
                onClick={handleSaveFirst}
                disabled={isSavingCurrent}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl text-black bg-white hover:bg-[#F5F5F7] dark:text-black dark:bg-white dark:hover:bg-[#F5F5F7] border border-black/10 dark:border-transparent shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {isSavingCurrent ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Saving & Summarizing Current...</span>
                  </>
                ) : (
                  <>
                    <DuoIcon name="bookmark" className="w-3.5 h-3.5 text-current" />
                    <span>Save Current & Start New</span>
                  </>
                )}
              </button>
            )}

            {/* Start with custom title (if input is entered) */}
            {titleInput.trim().length > 0 ? (
              <button
                type="submit"
                className={`w-full py-2.5 px-4 text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer ${
                  hasUnsavedChanges && onSaveCurrentFirst
                    ? 'text-stone-800 dark:text-stone-200 bg-black/5 hover:bg-black/10 dark:bg-[#2C2C2E] dark:hover:bg-[#38383A] border border-black/10 dark:border-white/10'
                    : 'text-black bg-white hover:bg-[#F5F5F7] dark:text-black dark:bg-white dark:hover:bg-[#F5F5F7] border border-black/10 dark:border-transparent'
                }`}
              >
                Start with this Title
              </button>
            ) : null}

            {/* Skip & Auto-Name with AI - Grey secondary button when save button is present */}
            <button
              type="button"
              onClick={onStartWithAutoName}
              className={`w-full py-2.5 px-4 text-xs font-medium rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-1.5 ${
                hasUnsavedChanges && onSaveCurrentFirst
                  ? 'text-stone-800 dark:text-stone-200 bg-black/5 hover:bg-black/10 dark:bg-[#2C2C2E] dark:hover:bg-[#38383A] border border-black/10 dark:border-white/10 shadow-xs'
                  : titleInput.trim().length === 0
                  ? 'text-black bg-white hover:bg-[#F5F5F7] dark:text-black dark:bg-white dark:hover:bg-[#F5F5F7] border border-black/10 dark:border-transparent shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-current stroke-[2.2]" />
              <span>Skip & Auto-Name with AI</span>
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 text-xs font-medium rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
