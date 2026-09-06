'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { DuoIcon } from '@/components/DuoIcon';
import { exportUserData, purgeAllUserData } from '@/lib/journal-service';

interface PrivacyModalProps {
  userId: string;
  onClose: () => void;
  onDataPurged: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  userId,
  onClose,
  onDataPurged,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const data = await exportUserData(userId);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `mindmirror-journal-export-${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatusMessage('Data exported securely to your downloads folder.');
    } catch (err: unknown) {
      console.error('Failed to export:', err);
      setStatusMessage('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurge = async () => {
    setIsPurging(true);
    try {
      await purgeAllUserData(userId);
      onDataPurged();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to purge:', err);
      setStatusMessage('Error purging records. Please check your connection.');
      setIsPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-2xl border border-[#E5E5EA] dark:border-[#38383A] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-between bg-[#F2F2F7]/80 dark:bg-[#252528]/80 backdrop-blur-xl">
          <div className="flex items-center space-x-2">
            <DuoIcon name="approved" className="w-4 h-4 text-[#34C759] dark:text-[#30D158]" />
            <h2 id="privacy-modal-title" className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
              Privacy & Data Sovereignty
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white rounded-lg transition-colors leading-none"
          >
            <span aria-hidden="true" className="text-base leading-none font-bold px-1">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-[#1D1D1F] dark:text-[#EBEBF5] leading-relaxed">
          
          {/* Status announcement */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
              <DuoIcon name="check-circle" className="w-4 h-4 shrink-0 text-[#34C759] dark:text-[#30D158]" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Privacy Guarantees */}
          <div className="space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#86868B] dark:text-[#636366] block">
              Architectural Commitments
            </span>

            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong className="text-[#1D1D1F] dark:text-white">Strict Path Scoping:</strong> All journal entries, conversation transcripts, and insights exist strictly under <code className="text-[11px] bg-[#F2F2F7] dark:bg-[#141416] border border-[#E5E5EA] dark:border-[#38383A] px-1 py-0.5 rounded text-[#1D1D1F] dark:text-white">/users/{userId}</code>.
              </li>
              <li>
                <strong className="text-[#1D1D1F] dark:text-white">Zero Client Secrets:</strong> Your Gemini API key runs exclusively within secure server-side API routes.
              </li>
              <li>
                <strong className="text-[#1D1D1F] dark:text-white">No Cross-User Leakage:</strong> Enforced mathematically via Firestore Security Rules; no user can read or mutate another user&apos;s records.
              </li>
            </ul>
          </div>

          {/* Data Export */}
          <div className="pt-4 border-t border-[#E5E5EA] dark:border-[#38383A] space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#86868B] dark:text-[#636366] block">
              Data Portability
            </span>
            <p className="text-[#6E6E73] dark:text-[#8E8E93]">
              Download a complete JSON archive containing all your reflections, timestamps, action items, and conversational turns.
            </p>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#1D1D1F] dark:text-white bg-[#F2F2F7] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] transition-colors border border-[#E5E5EA] dark:border-[#3A3A3C]"
            >
              <Download className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
              <span>{isExporting ? 'Preparing Archive...' : 'Download JSON Archive'}</span>
            </button>
          </div>

          {/* Irreversible Purge */}
          <div className="pt-4 border-t border-[#E5E5EA] dark:border-[#38383A] space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#FF3B30] dark:text-[#FF453A] block">
              Permanent Data Deletion
            </span>
            <p className="text-[#6E6E73] dark:text-[#8E8E93]">
              Permanently erase all journal reflections, active sessions, and synthesized insights from Cloud Firestore.
            </p>

            {confirmPurge ? (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
                <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 font-medium">
                  <DuoIcon name="alert-triangle" className="w-4 h-4 text-[#FF3B30] dark:text-[#FF453A] shrink-0" />
                  <span>Confirm Irreversible Purge?</span>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  This cannot be undone. All documents under your user path will be permanently deleted.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={handlePurge}
                    disabled={isPurging}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#FF3B30] hover:bg-rose-600 transition-colors"
                  >
                    {isPurging ? 'Purging...' : 'Yes, Delete Everything'}
                  </button>
                  <button
                    onClick={() => setConfirmPurge(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#D1D1D6] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmPurge(true)}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#FF3B30] dark:text-[#FF453A] hover:bg-rose-50 dark:hover:bg-[#FF453A]/10 border border-rose-200 dark:border-[#FF453A]/40 transition-colors"
              >
                <DuoIcon name="alert-triangle" className="w-4 h-4 text-[#FF3B30] dark:text-[#FF453A] shrink-0" />
                <span>Erase My Journal Records</span>
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E5E5EA] dark:border-[#38383A] bg-[#F2F2F7]/80 dark:bg-[#252528]/80 backdrop-blur-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0071E3] dark:bg-white dark:text-black dark:hover:bg-[#F2F2F7] transition-colors shadow-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
