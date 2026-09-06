'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  message: string;
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
  targetTab?: 'chat' | 'journal' | 'insights';
}

const DEFAULT_STEPS: TourStep[] = [
  {
    targetId: 'tip-composer',
    title: 'Reflective Composer',
    message: 'Type or dictate your thoughts freely. Gemini actively listens and helps you unpack insights without judgment.',
    preferredPlacement: 'top',
    targetTab: 'chat',
  },
  {
    targetId: 'tip-starters',
    title: 'Reflective Starters',
    message: 'Not sure where to begin? Choose an introspective prompt to explore emotions or clarify dilemmas.',
    preferredPlacement: 'top',
    targetTab: 'chat',
  },
  {
    targetId: 'tip-reflections-search',
    title: 'Vault Search & Topic Filters',
    message: 'Search entries by keywords or filter by recurring emotional topics to trace past breakthroughs.',
    preferredPlacement: 'bottom',
    targetTab: 'journal',
  },
  {
    targetId: 'tip-reflections-new',
    title: 'Capture New Reflection',
    message: 'Start a fresh journaling dialogue anytime to capture your immediate headspace into your vault.',
    preferredPlacement: 'bottom',
    targetTab: 'journal',
  },
  {
    targetId: 'tip-insights-metrics',
    title: 'Longitudinal Metrics',
    message: 'Monitor emotional valence trends and encrypted entry metrics mapped over days and weeks.',
    preferredPlacement: 'bottom',
    targetTab: 'insights',
  },
  {
    targetId: 'tip-insights-synthesize',
    title: 'AI Synthesis Engine',
    message: 'Synthesize recurring behavioral patterns, growth trajectories, and personalized recommendations across your entries.',
    preferredPlacement: 'bottom',
    targetTab: 'insights',
  },
];

interface TipKitTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchTab?: (tab: 'chat' | 'journal' | 'insights') => void;
  activeTab?: 'chat' | 'journal' | 'insights';
  storageKey?: string;
  steps?: TourStep[];
}

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
  borderRadius: string;
  radiusNum: number;
}

export const TipKitTour: React.FC<TipKitTourProps> = ({
  isOpen,
  onClose,
  onSwitchTab,
  activeTab = 'chat',
  storageKey = 'mindmirror_tipkit_tour_completed',
  steps = DEFAULT_STEPS,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<{
    top: number;
    left: number;
    arrowPlacement: 'top' | 'bottom' | 'left' | 'right';
    arrowOffset: number;
  }>({
    top: 0,
    left: 0,
    arrowPlacement: 'top',
    arrowOffset: 50,
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const currentStep = steps[currentStepIndex];

  // Reset to first step whenever the tour is freshly opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Measure and position the popover tip relative to the target element
  const updatePosition = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.getElementById(currentStep.targetId);
    if (!el) {
      // Element may not be rendered yet or currently hidden (e.g. prompt starters after typing)
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);
    const borderRadius = computed.borderRadius || '16px';
    const radiusNum = parseFloat(borderRadius) || 16;

    // Ensure target element is smoothly scrolled into view if partially off-screen on mobile
    if (rect.top < 70 || rect.bottom > window.innerHeight - 70) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
      borderRadius,
      radiusNum,
    });

    const popoverEl = popoverRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const popoverWidth = popoverEl?.offsetWidth || Math.min(330, viewportWidth - 24);
    const popoverHeight = popoverEl?.offsetHeight || 160;
    const padding = 12;
    const topMin = 68; // Safe area under sticky header
    const arrowSize = 10;

    let placement = currentStep.preferredPlacement || 'bottom';

    // Auto-flip if out of bounds
    if (placement === 'top' && rect.top - popoverHeight - arrowSize < topMin) {
      placement = 'bottom';
    } else if (placement === 'bottom' && rect.bottom + popoverHeight + arrowSize > viewportHeight - padding) {
      placement = 'top';
    }

    let top = 0;
    let left = 0;
    let arrowOffset = 50; // percentage

    if (placement === 'top') {
      top = rect.top - popoverHeight - arrowSize - 4;
      left = rect.left + rect.width / 2 - popoverWidth / 2;
    } else if (placement === 'bottom') {
      top = rect.bottom + arrowSize + 4;
      left = rect.left + rect.width / 2 - popoverWidth / 2;
    } else if (placement === 'left') {
      top = rect.top + rect.height / 2 - popoverHeight / 2;
      left = rect.left - popoverWidth - arrowSize - 4;
    } else if (placement === 'right') {
      top = rect.top + rect.height / 2 - popoverHeight / 2;
      left = rect.right + arrowSize + 4;
    }

    // Horizontal bounds containment for mobile screens
    if (left < padding) {
      const targetCenter = rect.left + rect.width / 2;
      arrowOffset = Math.max(10, Math.min(90, ((targetCenter - padding) / popoverWidth) * 100));
      left = padding;
    } else if (left + popoverWidth > viewportWidth - padding) {
      left = viewportWidth - popoverWidth - padding;
      const targetCenter = rect.left + rect.width / 2;
      arrowOffset = Math.max(10, Math.min(90, ((targetCenter - left) / popoverWidth) * 100));
    } else {
      arrowOffset = 50;
    }

    // Vertical bounds containment (respecting sticky top bar and bottom padding)
    if (top < topMin) {
      top = topMin;
    } else if (top + popoverHeight > viewportHeight - padding) {
      top = viewportHeight - popoverHeight - padding;
    }

    setPopoverStyle({
      top: Math.round(top),
      left: Math.round(left),
      arrowPlacement: placement,
      arrowOffset,
    });
  }, [isOpen, currentStep]);

  // Ensure active tab corresponds to the step
  useEffect(() => {
    if (!isOpen || !currentStep) return;
    if (currentStep.targetTab && activeTab !== currentStep.targetTab && onSwitchTab) {
      onSwitchTab(currentStep.targetTab);
    }
  }, [isOpen, currentStep, activeTab, onSwitchTab]);

  // Recalculate position on resize, scroll, and step change
  useEffect(() => {
    if (!isOpen) return;

    // Delay to allow tab/DOM transition to mount and layout
    const timer1 = setTimeout(() => {
      updatePosition();
    }, 80);

    const timer2 = setTimeout(() => {
      updatePosition();
    }, 220);

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, currentStepIndex, updatePosition]);

  // Keyboard navigation (Escape to dismiss, Arrow keys for step navigation)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!isOpen || !currentStep) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-auto"
      aria-label="Walkthrough Guidance"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop overlay with clear cutout for target element so target is never blurred */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-40 transition-opacity duration-300"
        aria-hidden="true"
      >
        <defs>
          <mask id="tipkit-spotlight-mask">
            {/* White covers entire screen with the dimming tint */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out a completely clear, unblurred, razor-sharp window over target */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx={targetRect.radiusNum}
                ry={targetRect.radiusNum}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.45)"
          mask="url(#tipkit-spotlight-mask)"
        />
      </svg>

      {/* Click outside to dismiss backdrop layer */}
      <div
        className="fixed inset-0 z-40 cursor-pointer"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Target Element Spotlight Ring (hugs target element border exactly with matching border-radius) */}
      {targetRect && (
        <div
          className="absolute pointer-events-none transition-all duration-300 ease-out ring-2 ring-[#007AFF] dark:ring-[#0A84FF] shadow-[0_0_20px_rgba(0,122,255,0.45)] dark:shadow-[0_0_28px_rgba(10,132,255,0.6)] z-45"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: targetRect.borderRadius,
          }}
        />
      )}

      {/* Apple HIG TipKit Popover View */}
      <div
        ref={popoverRef}
        className="absolute z-50 w-[calc(100vw-24px)] max-w-[330px] rounded-2xl bg-white/95 dark:bg-[#202023]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.14] shadow-[0_16px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-4 text-[#1D1D1F] dark:text-white transition-all duration-200 animate-in fade-in zoom-in-95"
        style={{
          top: `${popoverStyle.top}px`,
          left: `${popoverStyle.left}px`,
        }}
      >
        {/* Directional TipKit Pointer Arrow */}
        {popoverStyle.arrowPlacement === 'bottom' && (
          <div
            className="absolute -top-2 w-4 h-4 rotate-45 bg-white dark:bg-[#202023] border-t border-l border-black/[0.08] dark:border-white/[0.14]"
            style={{ left: `calc(${popoverStyle.arrowOffset}% - 8px)` }}
            aria-hidden="true"
          />
        )}
        {popoverStyle.arrowPlacement === 'top' && (
          <div
            className="absolute -bottom-2 w-4 h-4 rotate-45 bg-white dark:bg-[#202023] border-b border-r border-black/[0.08] dark:border-white/[0.14]"
            style={{ left: `calc(${popoverStyle.arrowOffset}% - 8px)` }}
            aria-hidden="true"
          />
        )}

        {/* Top bar: Step Indicator + Close Button */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="inline-flex items-center space-x-1.5">
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF]">
              Tip {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close walkthrough"
            title="Close walkthrough (Esc)"
            className="p-1 rounded-lg text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tip Content (HIG compliant: concise title + 1-2 sentence message) */}
        <h4 className="text-sm font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
          {currentStep.title}
        </h4>
        <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] leading-relaxed mt-1">
          {currentStep.message}
        </p>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[11px] font-medium text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
          >
            Skip Tour
          </button>

          <div className="flex items-center space-x-1.5">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                aria-label="Previous tip"
                className="p-1.5 rounded-lg text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0071E3] dark:bg-[#0A84FF] dark:hover:bg-[#0077ED] shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              {currentStepIndex === steps.length - 1 ? (
                <>
                  <span>Got it</span>
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
