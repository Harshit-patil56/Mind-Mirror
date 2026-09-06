'use client';

import React, { useState } from 'react';
import { Download, Trash2, ArrowRight, Check, X } from 'lucide-react';
import { DuoIcon } from '@/components/DuoIcon';
import ReactMarkdown from 'react-markdown';
import type { JournalEntry } from '@/lib/types';

interface EntryDetailModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onDelete: (entryId: string) => Promise<void>;
  onContinueThought: (entry: JournalEntry) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onDelete,
  onContinueThought,
}) => {
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  if (!entry) return null;

  const toggleAction = (index: number) => {
    setCompletedActions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this journal reflection permanently?')) {
      setIsDeleting(true);
      try {
        await onDelete(entry.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const exportAsMarkdown = () => {
    const mdContent = `# ${entry.title}\n\n**Date:** ${new Date(
      entry.createdAt
    ).toLocaleDateString()}\n**Mood:** ${entry.mood} (Valence: ${entry.sentimentScore})\n**Themes:** ${entry.keyThemes.join(
      ', '
    )}\n\n## Reflection Summary\n\n${entry.summary}\n\n## Action Items\n\n${entry.actionItems
      .map((a) => `- [ ] ${a}`)
      .join('\n')}\n\n---\n*Exported from MindMirror*`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/30 dark:bg-black/75 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-entry-title"
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[#1C1C1E] rounded-2xl border border-[#E5E5EA] dark:border-[#38383A] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-between bg-[#F2F2F7]/80 dark:bg-[#252528]/80 backdrop-blur-xl">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/5 dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#E5E5EA] border border-black/5 dark:border-white/10">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  entry.sentimentScore > 0.3
                    ? 'bg-[#30D158] shadow-[0_0_6px_rgba(48,209,88,0.5)]'
                    : entry.sentimentScore < -0.2
                    ? 'bg-[#FF9F0A] shadow-[0_0_6px_rgba(255,159,10,0.5)]'
                    : 'bg-[#8E8E93]'
                }`}
              />
              <span>{entry.mood}</span>
            </span>
            <span className="text-xs text-[#6E6E73] dark:text-[#8E8E93] flex items-center">
              <DuoIcon name="calendar" className="w-3.5 h-3.5 mr-1 inline text-current" />
              {new Date(entry.createdAt).toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportAsMarkdown}
              title="Download as Markdown"
              aria-label="Export Markdown"
              className="p-1.5 text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white hover:bg-[#E5E5EA]/60 dark:hover:bg-[#2C2C2E] rounded-lg transition-colors text-xs flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete this record"
              aria-label="Delete entry"
              className="p-1.5 text-[#6E6E73] hover:text-[#FF3B30] dark:text-[#8E8E93] dark:hover:text-[#FF453A] hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div>
            <h2 id="modal-entry-title" className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mb-3">
              {entry.title}
            </h2>

            {/* Themes list */}
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

          {/* Detailed Summary Narrative */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] block">
              Synthesized Reflection
            </span>
            <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none text-[#1D1D1F] dark:text-[#EBEBF5] leading-relaxed">
              <ReactMarkdown>{entry.summary}</ReactMarkdown>
            </div>
          </div>

          {/* Action Items */}
          {entry.actionItems && entry.actionItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] block">
                Commitments & Action Items
              </span>
              <div className="space-y-2">
                {entry.actionItems.map((action, idx) => {
                  const isChecked = !!completedActions[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleAction(idx)}
                      className={`group flex items-center space-x-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/5 text-[#86868B] dark:text-[#636366] line-through'
                          : 'bg-white dark:bg-[#222225] border-black/[0.07] dark:border-white/[0.08] text-[#1D1D1F] dark:text-[#ECECEC] hover:border-black/15 dark:hover:border-white/15 hover:bg-[#FAFAFC] dark:hover:bg-[#28282C] shadow-2xs'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isChecked
                            ? 'bg-[#30D158] text-white shadow-[0_0_6px_rgba(48,209,88,0.5)]'
                            : 'border border-stone-300 dark:border-stone-600 group-hover:border-stone-500 dark:group-hover:border-stone-400 bg-transparent'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
                      </div>
                      <span className="text-xs sm:text-sm leading-normal flex-1">{action}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar / Action */}
        <div className="px-6 py-4 border-t border-[#E5E5EA] dark:border-[#38383A] bg-[#F2F2F7]/80 dark:bg-[#252528]/80 backdrop-blur-xl flex items-center justify-between">
          <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
            Isolated in Firestore under <code className="text-[10px] bg-[#E5E5EA] dark:bg-[#141416] border dark:border-[#38383A] px-1 py-0.5 rounded">/users/.../journals</code>
          </span>

          <button
            onClick={() => {
              onClose();
              onContinueThought(entry);
            }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0071E3] dark:bg-white dark:text-black dark:hover:bg-[#F2F2F7] shadow-xs transition-colors"
          >
            <span>Continue This Thought</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
