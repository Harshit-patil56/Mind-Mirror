'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled applet error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-[#F5F5F7] p-4 text-center">
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-[#8E8E93] mb-6">An unexpected error occurred in the journal workspace.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl text-xs font-medium text-black bg-[#F5F5F7] hover:bg-white transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
