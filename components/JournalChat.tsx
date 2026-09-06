'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowUp, ArrowDown, Square, Sparkles, Copy, Check, Plus, AlertTriangle, PanelLeft } from 'lucide-react';
import { DuoIcon } from '@/components/DuoIcon';
import ReactMarkdown from 'react-markdown';
import type { ConversationMessage, JournalEntry, ConversationSession } from '@/lib/types';
import { saveJournalEntry, saveConversationSession, fetchUserConversations, updateConversationTitle } from '@/lib/journal-service';
import { generateId } from '@/lib/utils';
import { motion } from 'motion/react';
import { VoiceDictationButton } from '@/components/VoiceDictationButton';
import { NewChatModal } from '@/components/NewChatModal';

interface JournalChatProps {
  userId: string;
  onEntrySaved: (entry: JournalEntry) => void;
  initialSession?: ConversationSession | null;
  onChatStatusChange?: (status: {
    canSave: boolean;
    isSummarizing: boolean;
    saveAndSummarize: () => void;
  }) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onSessionUpdated?: (session: ConversationSession) => void;
}

const PROMPT_SUGGESTIONS = [
  'Reflect on a decision I wrestled with today',
  'Brainstorm creative solutions to an engineering obstacle',
  'Unpack why I felt mentally drained earlier',
  'Clarify my top intention for tomorrow morning',
];

// ChatGPT-style progressive human engagement cues while generating
const COGNITIVE_CUES = [
  'Reflecting on your entry...',
  'Reading emotional undertones...',
  'Connecting underlying themes...',
  'Formulating thoughtful perspectives...',
  'Synthesizing gentle inquiry...',
];

export const JournalChat: React.FC<JournalChatProps> = ({
  userId,
  onEntrySaved,
  initialSession,
  onChatStatusChange,
  isSidebarOpen = true,
  onToggleSidebar,
  onSessionUpdated,
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>(() => {
    if (initialSession?.messages && initialSession.messages.length > 0) {
      return initialSession.messages;
    }
    if (typeof window !== 'undefined' && userId) {
      try {
        const saved = localStorage.getItem(`journal_active_session_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            return parsed.messages;
          }
        }
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelBadge, setModelBadge] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState<string>(() => {
    return initialSession?.title || 'New Conversation';
  });
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    return initialSession?.status === 'saved';
  });
  const [sessionId, setSessionId] = useState<string>(() => {
    if (initialSession?.id) return initialSession.id;
    if (typeof window !== 'undefined' && userId) {
      try {
        const saved = localStorage.getItem(`journal_active_session_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.id) return parsed.id;
        }
      } catch {
        // ignore
      }
    }
    return generateId('conv');
  });
  const [currentCueIndex, setCurrentCueIndex] = useState(0);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.1-flash-lite');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasCheckedCloudRestore = useRef(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsScrolledUp(distanceFromBottom > 120);
  };

  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
    setIsScrolledUp(false);
  };

  // Sync chat status to parent for Top Navbar Save & Summarize button
  useEffect(() => {
    onChatStatusChange?.({
      canSave: messages.length > 0 && !isSaved,
      isSummarizing,
      saveAndSummarize: handleSaveAndSummarize,
    });
  }, [messages.length, isSummarizing, isSaved, onChatStatusChange]);

  // Sync active messages to local storage draft
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      if (messages.length > 0 && !isSaved) {
        localStorage.setItem(
          `journal_active_session_${userId}`,
          JSON.stringify({ id: sessionId, messages })
        );
      } else {
        localStorage.removeItem(`journal_active_session_${userId}`);
      }
    }
  }, [messages, sessionId, userId, isSaved]);

  // If initialSession prop changes (e.g. user clicked a conversation in sidebar)
  useEffect(() => {
    if (initialSession) {
      setSessionId(initialSession.id);
      setSessionTitle(initialSession.title || 'New Conversation');
      const incoming = initialSession.messages || [];
      setMessages(incoming);
      setIsSaved(initialSession.status === 'saved');

      // If incoming session ends with an unanswered user prompt, automatically trigger Gemini!
      if (incoming.length > 0 && incoming[incoming.length - 1].role === 'user') {
        generateAssistantReply(incoming);
      }
    } else {
      setSessionId(generateId('conv'));
      setSessionTitle('New Conversation');
      setMessages([]);
      setIsSaved(false);
    }
  }, [initialSession?.id]);

  // On first mount ONLY, if local draft is empty and no explicit session was requested, check Firestore for latest active session
  useEffect(() => {
    if (hasCheckedCloudRestore.current) return;
    hasCheckedCloudRestore.current = true;

    // Never overwrite if an initial session was explicitly provided or requested (e.g. New Chat)
    if (initialSession) return;

    if (messages.length === 0 && userId) {
      fetchUserConversations(userId)
        .then((convs) => {
          const activeConv = convs.find((c) => c.status === 'active' && c.messages && c.messages.length > 0);
          if (activeConv) {
            setSessionId(activeConv.id);
            setSessionTitle(activeConv.title || 'Conversation');
            setMessages(activeConv.messages);
          }
        })
        .catch((err) => console.warn('Could not restore active session from cloud:', err));
    }
  }, [userId, initialSession]);

  // Check connectivity and model status on mount
  useEffect(() => {
    fetch('/api/gemini/chat')
      .then((res) => res.json())
      .then((data) => {
        setIsOnline(Boolean(data.online));
        if (data.model && data.model !== 'offline') {
          setActiveModel(data.model);
        }
      })
      .catch(() => {
        setIsOnline(false);
      });
  }, []);

  // Rotate human engagement cues & track timer while generating (like ChatGPT macOS / iOS & Open WebUI)
  useEffect(() => {
    if (!isGenerating) {
      setCurrentCueIndex(0);
      setThinkingSeconds(0);
      return;
    }

    const cueInterval = setInterval(() => {
      setCurrentCueIndex((prev) => (prev + 1) % COGNITIVE_CUES.length);
    }, 1800);

    const timerInterval = setInterval(() => {
      setThinkingSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(cueInterval);
      clearInterval(timerInterval);
    };
  }, [isGenerating]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom();
    }
  }, [messages, isGenerating, isSummarizing]);

  // Auto-resize textarea like ChatGPT's composer
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputPrompt]);


  // Call server-side Gemini route to generate assistant reply
  const generateAssistantReply = async (messagesToSend: ConversationMessage[]) => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to receive conversational reply.');
      }

      const assistantMessage: ConversationMessage = {
        id: generateId('msg_model'),
        role: 'assistant',
        content: data.content,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      const finalMessages = [...messagesToSend, assistantMessage];
      setMessages(finalMessages);

      // Save conversation in Firestore and notify parent
      const sessionData: ConversationSession = {
        id: sessionId,
        userId,
        title: sessionTitle || 'New Conversation',
        messages: finalMessages,
        status: isSaved ? 'saved' : 'active',
        createdAt: finalMessages[0]?.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveConversationSession(userId, sessionData).catch((err) => console.warn('Sync session error:', err));
      onSessionUpdated?.(sessionData);

      // Auto-title trigger if session is still unnamed
      if (!sessionTitle || sessionTitle === 'New Conversation' || sessionTitle === 'Untitled Conversation') {
        triggerAutoTitle(finalMessages);
      }

      if (typeof data.online === 'boolean') {
        setIsOnline(data.online);
      }
      if (data.modelUsed) {
        if (data.modelUsed === 'offline' || data.modelUsed.toLowerCase().includes('offline')) {
          setIsOnline(false);
        } else {
          setIsOnline(true);
          setActiveModel(data.modelUsed.replace(/\s*\(.*?\)/g, '').trim());
        }
      }
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const msg = err instanceof Error ? err.message : 'Error sending message';
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Background AI auto-title generation (Open WebUI Task Model pattern)
  const triggerAutoTitle = async (currentMessages: ConversationMessage[]) => {
    try {
      const res = await fetch('/api/gemini/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages.slice(0, 4) }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title && typeof data.title === 'string' && data.title !== 'New Conversation') {
          const generatedTitle = data.title;
          setSessionTitle(generatedTitle);
          await updateConversationTitle(userId, sessionId, generatedTitle);
          const updatedSession: ConversationSession = {
            id: sessionId,
            userId,
            title: generatedTitle,
            messages: currentMessages,
            status: isSaved ? 'saved' : 'active',
            createdAt: currentMessages[0]?.timestamp || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          onSessionUpdated?.(updatedSession);
        }
      }
    } catch (err) {
      console.warn('Auto-title synthesis ignored:', err);
    }
  };

  // Submit conversation turn to server-side Gemini route
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isGenerating || isSummarizing) return;

    setErrorMessage(null);
    const userMessage: ConversationMessage = {
      id: generateId('msg_user'),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsSaved(false);
    setInputPrompt('');

    await generateAssistantReply(updatedMessages);
  };


  // Trigger automatic summarization and create permanent JournalEntry
  const handleSaveAndSummarize = async () => {
    if (messages.length === 0 || isSummarizing || isGenerating) return;

    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const summaryData = await response.json();

      if (!response.ok) {
        throw new Error(summaryData.error || 'Summarization synthesis failed.');
      }

      // Persist to isolated user Firestore collection: /users/{userId}/journals/{journalId}
      const entryToSave: Omit<JournalEntry, 'id'> = {
        userId,
        title: summaryData.title || 'Untitled Reflection',
        summary: summaryData.summary || '',
        mood: summaryData.mood || 'Reflective',
        sentimentScore: typeof summaryData.sentimentScore === 'number' ? summaryData.sentimentScore : 0.0,
        keyThemes: Array.isArray(summaryData.keyThemes) ? summaryData.keyThemes : [],
        actionItems: Array.isArray(summaryData.actionItems) ? summaryData.actionItems : [],
        conversationSnippet: messages.find((m) => m.role === 'user')?.content.slice(0, 200),
        messageCount: messages.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedEntry = await saveJournalEntry(userId, entryToSave);

      // Mark session as saved
      const savedSession: ConversationSession = {
        id: sessionId,
        userId,
        title: sessionTitle || savedEntry.title,
        messages,
        status: 'saved',
        createdAt: messages[0]?.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveConversationSession(userId, savedSession);
      onSessionUpdated?.(savedSession);

      setIsSaved(true);

      if (typeof window !== 'undefined') {
        localStorage.removeItem(`journal_active_session_${userId}`);
      }

      onEntrySaved(savedEntry);
    } catch (err: unknown) {
      console.error('Summarize error:', err);
      const msg = err instanceof Error ? err.message : 'Error generating summary';
      setErrorMessage(msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartNewConversation = () => {
    setShowNewChatModal(true);
  };

  const executeResetChat = (newTitle: string = 'New Conversation') => {
    setMessages([]);
    const newId = generateId('conv');
    setSessionId(newId);
    setSessionTitle(newTitle);
    setIsSaved(false);
    setInputPrompt('');
    setErrorMessage(null);
    setShowNewChatModal(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`journal_active_session_${userId}`);
    }
    const newSession: ConversationSession = {
      id: newId,
      userId,
      title: newTitle,
      messages: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSessionUpdated?.(newSession);
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full">
      {/* Top action row aligned with the chat width */}
      {(messages.length > 0 || onToggleSidebar) && (
        <div className="w-full px-3 sm:px-6 pt-2 pb-1 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-10">
          {/* Left: Sidebar Toggle + Model Pill style Status Indicator */}
          <div className="flex items-center space-x-2">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                title={isSidebarOpen ? "Close sidebar" : "Open conversation history"}
                className={`flex p-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-90 shrink-0 ${
                  isSidebarOpen
                    ? "text-stone-900 dark:text-white bg-black/10 dark:bg-white/15 shadow-2xs"
                    : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {/* Animated Apple SF Symbol-style Sidebar Toggle Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 transition-transform duration-200 ease-out"
                >
                  {/* Outer window squircle */}
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  {/* Vertical divider line */}
                  <path d="M9 3v18" />
                  {/* Animated sliding left pane fill (Apple SF Symbols style) */}
                  <rect
                    x="4"
                    y="4"
                    width="4"
                    height="16"
                    rx="1"
                    className={`fill-current transition-all duration-300 ease-out ${
                      isSidebarOpen
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-1"
                    }`}
                    stroke="none"
                  />
                </svg>
              </button>
            )}

            {messages.length > 0 && (
              <div className="inline-flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/5 dark:bg-white/10 text-stone-700 dark:text-stone-300 border border-black/5 dark:border-white/5 select-none whitespace-nowrap shrink-0 transition-all duration-200">
                {isSaved ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shadow-[0_0_6px_rgba(48,209,88,0.6)] shrink-0" />
                    <span className="hidden sm:inline">Saved to Reflections</span>
                    <span className="sm:hidden">Saved</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F0A] shadow-[0_0_6px_rgba(255,159,10,0.6)] shrink-0" />
                    <span className="hidden sm:inline">You have unsaved changes</span>
                    <span className="sm:hidden">Unsaved</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Action Buttons Group: Start New Conversation + Save & Summarize */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Start New Conversation Button */}
            <button
              type="button"
              id="tip-new-chat"
              onClick={handleStartNewConversation}
              disabled={isSummarizing || isGenerating}
              aria-label="Start a new conversation"
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg text-stone-700 hover:text-black dark:text-stone-300 dark:hover:text-white bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 shadow-xs transition-all duration-150 disabled:opacity-50 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
            >
              <DuoIcon name="message-2" className="w-3.5 h-3.5 text-current shrink-0" />
              <span className="hidden sm:inline">Start New Conversation</span>
              <span className="sm:hidden">New Chat</span>
            </button>

            {/* Save & Summarize Button (rendered if messages exist) */}
            {messages.length > 0 && (
              <button
                type="button"
                id="tip-save-btn"
                onClick={handleSaveAndSummarize}
                disabled={isSummarizing || isGenerating || isSaved}
                aria-label={isSaved ? 'Conversation saved' : 'Save and summarize journal entry'}
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 ${
                  isSaved
                    ? 'text-stone-500 dark:text-stone-400 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 cursor-default'
                    : 'text-white bg-[#007AFF] hover:bg-[#0071E3] dark:text-black dark:bg-[#F5F5F7] dark:hover:bg-white border border-[#007AFF] dark:border-[#3A3A3C] shadow-xs cursor-pointer disabled:opacity-50'
                }`}
              >
                {isSummarizing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin shrink-0" />
                    <span className="hidden sm:inline">Synthesizing Record...</span>
                    <span className="sm:hidden">Saving...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#30D158] stroke-[2.5] shrink-0" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <DuoIcon name="bookmark" className="w-3.5 h-3.5 text-current shrink-0" />
                    <span className="hidden sm:inline">Save & Summarize</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages Scroll Area - Full height with padding for floating composer */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 pt-2 pb-44 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto px-4">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#D1D1D6] dark:border-[#38383A] flex items-center justify-center mb-4 text-[#007AFF] dark:text-[#0A84FF] shadow-xs">
              <DuoIcon name="lamp-2" className="w-6 h-6 text-current" />
            </div>
            <h2 className="text-lg font-semibold text-[#1D1D1F] dark:text-white tracking-tight mb-2">
              What is on your mind today?
            </h2>
            <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] leading-relaxed mb-6">
              Write freely. This space is private, non-judgmental, and isolated. Explore thoughts, express friction, or brainstorm goals.
            </p>

            {/* Prompt Starter Chips */}
            <div id="tip-starters" className="w-full space-y-2">
              <span className="text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] block mb-1">
                Reflective starting points
              </span>
              {PROMPT_SUGGESTIONS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-3 rounded-xl text-xs text-[#1D1D1F] dark:text-[#F5F5F7] bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#38383A] hover:border-[#007AFF] dark:hover:border-[#0A84FF] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-all flex items-center justify-between group shadow-2xs"
                >
                  <span className="truncate">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#86868B] dark:text-[#636366] group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) =>
            msg.role === 'user' ? (
              /* User Bubble: ChatGPT macOS / iOS Style (borderless graphite pill) */
              <div key={msg.id} className="flex justify-end w-full group animate-in fade-in duration-150">
                <div className="max-w-[85%] sm:max-w-[72%] rounded-[22px] px-5 py-3 text-[15px] leading-relaxed bg-[#E9E9EB] text-[#0D0D0D] dark:bg-[#2F2F2F] dark:text-[#ECECEC]">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              /* Assistant Response: ChatGPT macOS / iOS Style (Unboxed typography on canvas, sparkle icon) */
              <div key={msg.id} className="flex items-start space-x-3.5 sm:space-x-4 w-full group animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#1D1D1F] dark:text-white shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
                </div>

                <div className="flex-1 space-y-2 max-w-2xl">
                  <div className="markdown-body prose prose-neutral dark:prose-invert max-w-none text-[15px] leading-relaxed text-[#0D0D0D] dark:text-[#ECECEC]">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Clean hover action bar */}
                  <div className="flex items-center space-x-2 pt-1 opacity-50 hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all text-xs flex items-center space-x-1"
                      title="Copy response"
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          )
        )}

        {/* ChatGPT macOS / iOS Generation State with Dynamic Human Engagement Cues */}
        {isGenerating && (
          <div className="flex items-start space-x-3.5 sm:space-x-4 w-full animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF] shrink-0 mt-0.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>

            <div className="flex items-center space-x-3 py-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 px-3.5 py-1.5 rounded-full">
              {/* 3 gentle staggered pulsing dots */}
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-500 dark:bg-stone-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-stone-500 dark:bg-stone-400 animate-pulse [animation-delay:200ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-stone-500 dark:bg-stone-400 animate-pulse [animation-delay:400ms]" />
              </div>

              {/* Dynamic Human Cognitive Cue text */}
              <motion.span
                key={currentCueIndex}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.25 }}
                className="text-xs sm:text-[13px] font-medium text-stone-700 dark:text-stone-300 tracking-tight"
              >
                {COGNITIVE_CUES[currentCueIndex]}
              </motion.span>

              {/* Live Seconds Counter */}
              <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md">
                {thinkingSeconds}s
              </span>
            </div>
          </div>
        )}

        {/* ChatGPT macOS-style Inline Error Notification */}
        {errorMessage && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 font-medium text-xs transition-colors shrink-0 ml-2"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Real ChatGPT-style Floating Input Composer Area with Smooth Fade */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none px-3 sm:px-4 pt-14 pb-4 sm:pb-6 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#121214] dark:via-[#121214]/90 dark:to-transparent">
        <div className="relative max-w-3xl mx-auto pointer-events-auto">
          {/* Floating Scroll-to-Bottom Arrow Button (ChatGPT Style) */}
          {isScrolledUp && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              aria-label="Scroll to newest messages"
              className="absolute -top-11 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-[#252528] text-stone-700 dark:text-stone-200 border border-black/10 dark:border-white/15 shadow-md flex items-center justify-center hover:bg-stone-50 dark:hover:bg-[#2C2C2E] hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-150"
              title="Scroll to bottom"
            >
              <ArrowDown className="w-4 h-4 stroke-[2.2]" />
            </button>
          )}

          <form
            id="tip-composer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex flex-col rounded-[26px] bg-[#F4F4F4]/95 dark:bg-[#212121]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.6)] focus-within:border-black/20 dark:focus-within:border-white/20 transition-all"
          >
            {/* Auto-expanding multiline textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reflect on your thoughts, ask questions, or share your day..."
              disabled={isGenerating || isSummarizing}
              maxLength={4000}
              className="w-full resize-none bg-transparent px-4 sm:px-5 pt-3.5 pb-2 text-[15px] sm:text-base leading-relaxed text-[#0D0D0D] dark:text-[#ECECEC] placeholder-[#8E8E93] dark:placeholder-[#8E8E93] focus:outline-hidden min-h-[44px] max-h-[200px]"
            />

            {/* Bottom internal toolbar */}
            <div className="px-3 pb-2.5 pt-1 flex items-center justify-between">
              {/* Left Action Buttons */}
              <div className="flex items-center space-x-2">

                {/* Model Status Pill: Red dot + model name (offline) if offline, Green dot + model name if online */}
                <div
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/5 dark:bg-white/10 text-stone-700 dark:text-stone-300 border border-black/5 dark:border-white/5 select-none whitespace-nowrap"
                  title={isOnline ? `Online • ${activeModel}` : `Offline • ${activeModel}`}
                >
                  {isOnline ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shadow-[0_0_6px_rgba(48,209,88,0.6)] shrink-0" />
                      <span className="font-mono text-[11px]">{activeModel}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A] shadow-[0_0_6px_rgba(255,69,58,0.6)] shrink-0" />
                      <span className="font-mono text-[11px]">{activeModel} (offline)</span>
                    </>
                  )}
                </div>

              </div>

              {/* Right Send/Stop & Voice Dictation Group */}
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {inputPrompt.length > 2500 && (
                  <span className="text-[10px] text-[#8E8E93] font-mono mr-1">
                    {inputPrompt.length}/4000
                  </span>
                )}

                {/* Apple / ChatGPT Voice Dictation (Google Speech Streaming) */}
                <VoiceDictationButton
                  currentText={inputPrompt}
                  onTranscriptChange={(newText) => {
                    setInputPrompt(newText);
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
                    }
                  }}
                  disabled={isGenerating || isSummarizing}
                />

                {isGenerating ? (
                  <button
                    type="button"
                    aria-label="Stop generation"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-85 active:scale-95 shadow-xs transition-all cursor-pointer"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || isSummarizing}
                    aria-label="Send reflection message"
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 ${inputPrompt.trim()
                      ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 shadow-xs cursor-pointer'
                      : 'bg-black/[0.08] dark:bg-white/[0.12] text-black/30 dark:text-white/30 cursor-not-allowed'
                      }`}
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* ChatGPT-style Subtext Disclaimer */}
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] text-center mt-2 tracking-normal select-none">
            Gemini can make mistakes. Journal reflections are securely encrypted and user-isolated.
          </p>
        </div>
      </div>

      {/* Apple HIG New Conversation Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onStartWithTitle={(title) => executeResetChat(title)}
        onStartWithAutoName={() => executeResetChat('New Conversation')}
        hasUnsavedChanges={messages.length > 0 && !isSaved}
        onSaveCurrentFirst={handleSaveAndSummarize}
      />
    </div>
  );
};
