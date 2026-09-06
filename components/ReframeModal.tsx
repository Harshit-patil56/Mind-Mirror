'use client';

import React, { useState } from 'react';
import { X, Check, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { DuoIcon } from '@/components/DuoIcon';

export interface ReframeOption {
  strategy: string;
  perspective: string;
  reflectiveQuestion: string;
}

export interface ReframeData {
  coreThought: string;
  distortion: string;
  distortionExplanation: string;
  validation: string;
  reframes: ReframeOption[];
}

interface ReframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: ReframeData | null;
  error?: string | null;
  onAdoptReframe: (reframe: ReframeOption) => void;
}

export const ReframeModal: React.FC<ReframeModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  data,
  error,
  onAdoptReframe,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (!isOpen) return null;

  const handleAdopt = () => {
    if (data?.reframes && data.reframes[selectedIndex]) {
      onAdoptReframe(data.reframes[selectedIndex]);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reframe-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-6 text-left my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF] shadow-2xs">
              <DuoIcon name="lamp-2" className="w-4 h-4 text-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="reframe-modal-title" className="text-sm font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
                  Cognitive Reframe
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#6E6E73] dark:text-[#8E8E93]">
                  CBT Framework
                </span>
              </div>
              <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                Restructure cognitive friction into grounded perspectives
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#007AFF]/20 border-t-[#007AFF] dark:border-[#0A84FF]/20 dark:border-t-[#0A84FF] animate-spin" />
              <p className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                Examining cognitive patterns...
              </p>
              <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] max-w-xs">
                Analyzing cognitive distortions and synthesizing grounded alternatives with Gemini.
              </p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="text-xs text-[#1D1D1F] dark:text-white font-medium">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Cognitive Distortion Badge & Explanation */}
              <div className="p-3.5 rounded-xl bg-amber-500/8 dark:bg-amber-500/12 border border-amber-500/20 text-left space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{data.distortion}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                  {data.distortionExplanation}
                </p>
              </div>

              {/* Empathetic Validation */}
              {data.validation && (
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-left">
                  <div className="text-[10px] uppercase font-semibold text-[#86868B] dark:text-[#636366] mb-1 tracking-wider">
                    Emotional Validation
                  </div>
                  <p className="text-xs leading-relaxed text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {data.validation}
                  </p>
                </div>
              )}

              {/* Reframing Strategy Selection */}
              <div className="space-y-2 text-left">
                <div className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] tracking-tight">
                  Choose a Grounded Alternative:
                </div>
                <div className="space-y-2.5">
                  {data.reframes.map((opt, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedIndex(idx)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#007AFF]/6 dark:bg-[#0A84FF]/10 border-[#007AFF] dark:border-[#0A84FF] shadow-xs'
                            : 'bg-white dark:bg-[#2C2C2E]/60 border-[#E5E5EA] dark:border-[#38383A] hover:border-black/20 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#1D1D1F] dark:text-white'}`}>
                            {opt.strategy}
                          </span>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'border-[#007AFF] dark:border-[#0A84FF] bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                              : 'border-black/20 dark:border-white/20'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-xs text-[#3A3A3C] dark:text-[#E5E5EA] leading-relaxed mb-2">
                          {opt.perspective}
                        </p>
                        <div className="pt-2 border-t border-black/5 dark:border-white/5">
                          <span className="text-[10px] font-medium text-[#86868B] dark:text-[#8E8E93] block mb-0.5">
                            Reflective Inquiry:
                          </span>
                          <p className="text-[11px] italic text-[#6E6E73] dark:text-[#A1A1A6]">
                            &ldquo;{opt.reflectiveQuestion}&rdquo;
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center space-x-1 text-[10px] text-[#86868B] dark:text-[#636366]">
            <ShieldCheck className="w-3 h-3 text-[#30D158]" />
            <span>Reflective CBT Exercise &bull; Non-Clinical</span>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdopt}
              disabled={isLoading || !data?.reframes?.length}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0062CC] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <span>Adopt into Journal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
