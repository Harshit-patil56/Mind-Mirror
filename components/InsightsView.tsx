'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { DuoIcon } from '@/components/DuoIcon';
import ReactMarkdown from 'react-markdown';
import type { JournalEntry, PersonalInsight } from '@/lib/types';
import { fetchLatestPersonalInsight, savePersonalInsight } from '@/lib/journal-service';

interface InsightsViewProps {
  userId: string;
  entries: JournalEntry[];
  onStartReflectivePrompt: (prompt: string) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  userId,
  entries,
  onStartReflectivePrompt,
}) => {
  const [insight, setInsight] = useState<PersonalInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStoredInsight() {
      setIsLoading(true);
      try {
        const stored = await fetchLatestPersonalInsight(userId);
        setInsight(stored);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredInsight();
  }, [userId]);

  const handleGenerateInsights = async () => {
    if (entries.length === 0 || isGenerating) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journalSummaries: entries.slice(0, 15).map((e) => ({
            title: e.title,
            summary: e.summary,
            mood: e.mood,
            keyThemes: e.keyThemes,
            createdAt: e.createdAt,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to synthesize insights.');
      }

      const newInsight = await savePersonalInsight(userId, {
        userId,
        period: data.period || 'Recent Reflections',
        synthesis: data.synthesis || '',
        recurringThemes: Array.isArray(data.recurringThemes) ? data.recurringThemes : [],
        emotionalTrend: data.emotionalTrend || '',
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        entryCountAnalyzed: entries.length,
        generatedAt: new Date().toISOString(),
      });

      setInsight(newInsight);
    } catch (err: unknown) {
      console.error('Insights generation error:', err);
      const msg = err instanceof Error ? err.message : 'Error generating personal insights';
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Average sentiment calculation across entries
  const averageSentiment = entries.length
    ? (entries.reduce((acc, curr) => acc + (curr.sentimentScore || 0), 0) / entries.length).toFixed(2)
    : '0.0';

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pt-6 sm:pt-8 pb-12 sm:pb-16 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] dark:bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.5)]" />
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
              Longitudinal Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#8E8E93] mt-1">
            Synthesizes recurring thoughts, emotional trajectories, and self-growth across your private entries.
          </p>
        </div>

        <button
          onClick={handleGenerateInsights}
          disabled={entries.length === 0 || isGenerating}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-[#007AFF] hover:bg-[#0071E3] dark:bg-white dark:hover:bg-stone-100 dark:text-black shadow-xs transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer shrink-0"
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
              <span>Analyzing Trajectories...</span>
            </>
          ) : (
            <>
              <DuoIcon name="clock" className="w-3.5 h-3.5 text-current" />
              <span>{insight ? 'Update Insights' : 'Synthesize Insights'}</span>
            </>
          )}
        </button>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-200 shadow-2xs">
          <DuoIcon name="alert-triangle" className="w-4 h-4 text-rose-500 dark:text-[#FF453A] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Metrics strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.07] dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#86868B] dark:text-[#8E8E93]">
              Entries Indexed
            </span>
            <DuoIcon name="book-2" className="w-4 h-4 text-[#86868B] dark:text-[#8E8E93]" />
          </div>
          <span className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
            {entries.length}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.07] dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#86868B] dark:text-[#8E8E93]">
              Emotional Valence Mean
            </span>
            <span className="w-2 h-2 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] shadow-[0_0_6px_rgba(0,122,255,0.4)]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
              {averageSentiment}
            </span>
            <span className="text-xs font-normal text-[#86868B] dark:text-[#8E8E93]">(-1.0 to +1.0)</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.07] dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#86868B] dark:text-[#8E8E93]">
              Data Isolation Scope
            </span>
            <span className="w-2 h-2 rounded-full bg-[#30D158] shadow-[0_0_6px_rgba(48,209,88,0.5)]" />
          </div>
          <div className="pt-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs bg-[#30D158]/10 text-[#248A3D] dark:text-[#30D158] border border-[#30D158]/20 tracking-tight">
              /users/{userId.slice(0, 8)}...
            </span>
          </div>
        </div>
      </div>

      {/* Insights Body */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#6E6E73] dark:text-[#8E8E93]">
          <div className="w-6 h-6 border-2 border-[#E5E5EA] dark:border-[#38383A] border-t-[#007AFF] dark:border-t-[#0A84FF] rounded-full animate-spin mx-auto mb-2" />
          <span>Retrieving encrypted personal analytics...</span>
        </div>
      ) : !insight ? (
        <div className="py-16 text-center border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-8 bg-white dark:bg-[#1C1C1E] shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center mx-auto mb-3.5 text-[#86868B] dark:text-[#8E8E93]">
            <DuoIcon name="lamp-2" className="w-6 h-6 text-current" />
          </div>
          <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white mb-1">
            No synthesis generated yet
          </h3>
          <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-sm mx-auto mb-4">
            {entries.length === 0
              ? 'Complete at least one reflection to unlock longitudinal themes and emotional pattern analysis.'
              : 'Click "Synthesize Insights" above to let Gemini reflect deeply on your recent entries.'}
          </p>
          {entries.length > 0 && (
            <button
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0071E3] dark:text-black dark:bg-white dark:hover:bg-stone-100 shadow-xs transition-colors cursor-pointer"
            >
              <DuoIcon name="lamp-2" className="w-3.5 h-3.5 text-current" />
              <span>Generate Personal Synthesis</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Main Synthesis Narrative Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.07] dark:border-white/[0.08] space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] border border-[#007AFF]/20 dark:border-[#0A84FF]/25">
                  <DuoIcon name="compass" className="w-3.5 h-3.5 text-current" />
                  <span>{insight.period}</span>
                </span>
              </div>
              <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93] font-medium flex items-center">
                <DuoIcon name="calendar" className="w-3 h-3 mr-1 inline text-current" />
                {new Date(insight.generatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none text-[#1D1D1F] dark:text-[#ECECEC] leading-relaxed">
              <ReactMarkdown>{insight.synthesis}</ReactMarkdown>
            </div>

            {/* Emotional Trajectory */}
            {insight.emotionalTrend && (
              <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06]">
                <span className="text-xs font-medium text-[#86868B] dark:text-[#8E8E93] block mb-1">
                  Observed Emotional Trajectory
                </span>
                <p className="text-xs sm:text-sm text-[#1D1D1F] dark:text-white font-medium">
                  {insight.emotionalTrend}
                </p>
              </div>
            )}

            {/* Recurring Themes */}
            {insight.recurringThemes && insight.recurringThemes.length > 0 && (
              <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-xs font-medium text-[#86868B] dark:text-[#8E8E93] block mb-2">
                  Persistent Threads & Focus Areas
                </span>
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
                  {insight.recurringThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08] text-[#1D1D1F] dark:text-[#ECECEC]"
                    >
                      <DuoIcon name="bookmark" className="w-2.5 h-2.5 mr-1 text-current opacity-70" />
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Introspective Prompts (Call to Action) */}
          {insight.recommendations && insight.recommendations.length > 0 && (
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.07] dark:border-white/[0.08] space-y-3.5 shadow-xs">
              <div>
                <span className="text-sm font-semibold text-[#1D1D1F] dark:text-white block">
                  Reflective Inquiries Tailored To You
                </span>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Click any prompt to launch a focused multi-turn conversation with your Gemini Companion:
                </p>
              </div>

              <div className="space-y-2">
                {insight.recommendations.map((rec, idx) => (
                  <button
                    key={idx}
                    onClick={() => onStartReflectivePrompt(rec)}
                    className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] hover:border-[#007AFF]/40 dark:hover:border-[#0A84FF]/40 transition-all flex items-center justify-between group cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99]"
                  >
                    <span className="text-xs sm:text-sm text-[#1D1D1F] dark:text-[#ECECEC] font-medium leading-relaxed">{rec}</span>
                    <ArrowUpRight className="w-4 h-4 text-[#86868B] dark:text-[#636366] group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] shrink-0 ml-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

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
