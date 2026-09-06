'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { DuoIcon } from '@/components/DuoIcon';
import { signInWithGoogle } from '@/lib/firebase';

interface AuthViewProps {
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInIframe] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    }
    return false;
  });

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setErrorMessage(null);
    const { user, error } = await signInWithGoogle();
    setLoadingGoogle(false);
    if (error) {
      setErrorMessage(error);
    } else if (user && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F2F2F7] dark:bg-[#121214] transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-2xl border border-[#D1D1D6] dark:border-[#38383A] p-8 sm:p-10 shadow-xl transition-colors">
        
        {/* Header Monogram Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#FFFFFF] to-[#ECECED] text-[#1D1D1F] border border-black/[0.12] shadow-xs dark:bg-gradient-to-b dark:from-[#3A3A3C] dark:to-[#222224] dark:text-white dark:border-white/[0.14] flex items-center justify-center mb-6 select-none">
          <span className="font-semibold text-lg tracking-tight font-sans">MI</span>
        </div>

        {/* Title and Subheading */}
        <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mb-2">
          MindMirror
        </h1>
        <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] leading-relaxed mb-8">
          A secure reflective journaling and brainstorming companion. Powered by server-side Gemini intelligence and isolated Cloud Firestore storage.
        </p>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start space-x-3 text-rose-800 dark:text-rose-200 text-xs">
            <DuoIcon name="alert-triangle" className="w-4 h-4 text-rose-600 dark:text-[#FF453A] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Authentication notice</span>
              <p className="opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Sign-in actions */}
        <div className="space-y-3 mb-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            aria-label="Continue with Google Authentication"
            className="w-full h-12 flex items-center justify-center space-x-3 rounded-xl font-medium text-sm text-[#1D1D1F] dark:text-white bg-white hover:bg-[#F2F2F7] dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] border border-[#D1D1D6] dark:border-[#3A3A3C] transition-all duration-150 disabled:opacity-50 active:scale-[0.99] shadow-xs cursor-pointer"
          >
            {loadingGoogle ? (
              <div className="w-4 h-4 border-2 border-[#6E6E73] dark:border-[#8E8E93] border-t-black dark:border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {isInIframe && (
            <div className="pt-1 text-center">
              <a
                href={typeof window !== 'undefined' ? window.location.href : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white transition-colors py-1"
              >
                <span>If popup is blocked in preview, open in new tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Human Privacy & Trust Assurance */}
        <div className="pt-6 border-t border-black/[0.08] dark:border-white/[0.08] flex flex-col items-center justify-center space-y-1 text-center select-none">
          <div className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
            <DuoIcon name="approved" className="w-4 h-4 text-[#34C759] dark:text-[#30D158] shrink-0" />
            <span>Private & Account-Isolated</span>
          </div>
          <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93]">
            Your reflections belong strictly to you and are never shared.
          </p>
        </div>

      </div>
    </div>
  );
};
