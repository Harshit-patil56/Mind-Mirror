'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceDictationButtonProps {
  currentText: string;
  onTranscriptChange: (text: string) => void;
  disabled?: boolean;
}

// Global browser SpeechRecognition interfaces
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  currentText,
  onTranscriptChange,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseTextRef = useRef<string>('');
  const finalizedSpeechRef = useRef<string>('');

  // Check Web Speech API availability on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionConstructor) {
        setIsSupported(false);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = () => {
    if (disabled || isListening) return;
    setErrorMessage(null);

    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsSupported(false);
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      // Snapshot the current text in the input as the base
      baseTextRef.current = currentText.trim();
      finalizedSpeechRef.current = '';

      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interimTranscript = '';
        let newFinalizedChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript || '';
          if (result.isFinal) {
            newFinalizedChunk += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (newFinalizedChunk) {
          finalizedSpeechRef.current += newFinalizedChunk;
        }

        // Combine base input text + finalized speech chunks + live interim words
        const prefix = baseTextRef.current ? baseTextRef.current + ' ' : '';
        const combined = (prefix + finalizedSpeechRef.current + interimTranscript).trim();

        onTranscriptChange(combined);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.warn('Speech recognition warning/error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions.');
          stopListening();
        } else if (event.error === 'network') {
          setErrorMessage('Network issue with speech recognition service.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setErrorMessage('Could not activate voice input.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        recognitionRef.current.abort();
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="Voice dictation not supported in this browser (Use Chrome or Edge)"
        className="w-8 h-8 flex items-center justify-center rounded-full opacity-35 text-stone-400 cursor-not-allowed"
      >
        <MicOff className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        aria-label={isListening ? 'Stop voice dictation' : 'Start voice dictation'}
        title={isListening ? 'Tap to finish voice dictation' : 'Dictate with voice (Google Speech streaming)'}
        className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
          isListening
            ? 'bg-[#FF3B30] text-white shadow-[0_0_12px_rgba(255,59,48,0.5)] scale-105'
            : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {isListening ? (
          // Apple / ChatGPT-style active 4-bar soundwave animation
          <div className="flex items-center justify-center space-x-[2px] h-3.5 w-3.5">
            <span className="w-[2px] bg-white rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2.5" />
            <span className="w-[2px] bg-white rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.15s] h-3.5" />
            <span className="w-[2px] bg-white rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.3s] h-3" />
            <span className="w-[2px] bg-white rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.45s] h-2" />
          </div>
        ) : (
          <Mic className="w-4 h-4 stroke-[2]" />
        )}
      </button>

      {/* Floating error tooltip if microphone blocked */}
      {errorMessage && (
        <div className="absolute bottom-full right-0 mb-2 w-56 p-2 rounded-xl bg-red-600 text-white text-[11px] leading-tight shadow-lg z-30 animate-in fade-in slide-in-from-bottom-1">
          <div className="flex items-start justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="ml-2 font-bold hover:opacity-80"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
