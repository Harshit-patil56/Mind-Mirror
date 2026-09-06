'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, signOutUser } from '@/lib/firebase';
import { Navbar } from '@/components/Navbar';
import { AuthView } from '@/components/AuthView';
import { JournalChat } from '@/components/JournalChat';
import { JournalList } from '@/components/JournalList';
import { InsightsView } from '@/components/InsightsView';
import { EntryDetailModal } from '@/components/EntryDetailModal';
import { PrivacyModal } from '@/components/PrivacyModal';
import { SecurityInspectorModal } from '@/components/SecurityInspectorModal';
import { ChatSidebar } from '@/components/ChatSidebar';
import { TipKitTour } from '@/components/TipKitTour';
import { fetchUserJournals, deleteJournalEntry, fetchUserConversations, deleteConversationSession } from '@/lib/journal-service';
import type { JournalEntry, ConversationSession } from '@/lib/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(() => auth.currentUser || null);
  const [authLoading, setAuthLoading] = useState(() => !auth.currentUser);
  const [activeTab, setActiveTab] = useState<'chat' | 'journal' | 'insights'>('chat');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [activeSession, setActiveSession] = useState<ConversationSession | null>(null);
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      // On mobile screens (< 768px), default to closed so chat is visible immediately
      if (window.innerWidth < 768) return false;
      const stored = localStorage.getItem('vault_sidebar_open');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });

  // Modals state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Appearance state (persisted in local preference, default to Elegant Dark)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pjournal_theme');
      if (stored !== null) return stored === 'dark';
    }
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pjournal_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pjournal_theme', 'light');
    }
  }, [darkMode]);

  // First-time user onboarding: Launch TipKit tour if not previously completed
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const tourCompleted = localStorage.getItem('mindmirror_tipkit_tour_completed');
      if (!tourCompleted) {
        const timer = setTimeout(() => {
          setShowTour(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  // Reactive Firebase Auth listener with fast fallback and timeout guard
  useEffect(() => {
    let isMounted = true;

    // Standard Firebase Auth state ready resolution
    if (typeof auth.authStateReady === 'function') {
      auth.authStateReady()
        .then(() => {
          if (isMounted) {
            setUser(auth.currentUser);
            setAuthLoading(false);
          }
        })
        .catch((err) => {
          console.warn('Auth state ready error:', err);
          if (isMounted) setAuthLoading(false);
        });
    }

    // Auth listener for user login/logout events
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (isMounted) {
          setUser(currentUser);
          setAuthLoading(false);
        }
      },
      (error) => {
        console.warn('Auth state changed error:', error);
        if (isMounted) setAuthLoading(false);
      }
    );

    // Safety timeout: never trap user on loading screen for > 1000ms
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setUser(auth.currentUser);
        setAuthLoading(false);
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  // Fetch journals for current user asynchronously
  useEffect(() => {
    let isMounted = true;
    if (user?.uid) {
      Promise.resolve().then(() => {
        if (isMounted) setEntriesLoading(true);
      });
      fetchUserJournals(user.uid)
        .then((data) => {
          if (isMounted) {
            setEntries(data);
            setEntriesLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load user journals:', err);
          if (isMounted) setEntriesLoading(false);
        });
    } else {
      Promise.resolve().then(() => {
        if (isMounted) {
          setEntries([]);
          setEntriesLoading(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Fetch user conversations on auth
  useEffect(() => {
    let isMounted = true;
    if (user?.uid) {
      fetchUserConversations(user.uid)
        .then((convs) => {
          if (isMounted) setConversations(convs);
        })
        .catch((err) => console.warn('Failed to load user conversations:', err));
    } else {
      setConversations([]);
    }
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Handle entry saved from chat
  const handleEntrySaved = (newEntry: JournalEntry) => {
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntry(newEntry);
    setActiveTab('journal');
  };

  // Handle entry deletion
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    await deleteJournalEntry(user.uid, entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  // Handle "Continue This Thought"
  const handleContinueThought = (entry: JournalEntry) => {
    setActiveSession({
      id: `conv_${Date.now()}_continue`,
      userId: user?.uid || '',
      title: `Follow-up: ${entry.title}`,
      messages: [
        {
          id: `msg_${Date.now()}_context`,
          role: 'user',
          content: `I want to continue exploring the thought from my previous reflection: "${entry.title}". Here was my summary:\n\n${entry.summary}\n\nCan you ask me an introspective question to take this one level deeper?`,
          timestamp: new Date().toISOString(),
        },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setActiveTab('chat');
  };

  // Handle prompt selected from Longitudinal Insights
  const handleStartReflectivePrompt = (prompt: string) => {
    setActiveSession({
      id: `conv_${Date.now()}_insight_prompt`,
      userId: user?.uid || '',
      title: prompt.slice(0, 40),
      messages: [
        {
          id: `msg_${Date.now()}_prompt`,
          role: 'user',
          content: prompt,
          timestamp: new Date().toISOString(),
        },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setActiveTab('chat');
  };

  // Start fresh reflection
  const handleNewReflection = () => {
    if (typeof window !== 'undefined' && user) {
      localStorage.removeItem(`journal_active_session_${user.uid}`);
    }
    setActiveSession({
      id: `conv_${Date.now()}_new`,
      userId: user?.uid || '',
      title: 'New Reflection',
      messages: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setActiveTab('chat');
  };

  // Handle conversation sidebar interactions
  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        localStorage.setItem('vault_sidebar_open', String(next));
      }
      return next;
    });
  };

  const handleSelectConversation = (session: ConversationSession) => {
    setActiveSession(session);
  };

  const handleSessionUpdated = (session: ConversationSession) => {
    setActiveSession(session);
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === session.id);
      if (exists) {
        return prev.map((c) => (c.id === session.id ? session : c));
      }
      return [session, ...prev];
    });
  };

  const handleDeleteConversation = async (sessionId: string) => {
    if (!user) return;
    await deleteConversationSession(user.uid, sessionId);
    setConversations((prev) => prev.filter((c) => c.id !== sessionId));
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    if (typeof window !== 'undefined' && user) {
      localStorage.removeItem(`journal_active_session_${user.uid}`);
    }
    await signOutUser();
    setUser(null);
    setEntries([]);
    setSelectedEntry(null);
    setActiveSession(null);
    setConversations([]);
    setActiveTab('chat');
  };

  // Auth Loading Screen with bypass option
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F2F7] dark:bg-[#121214] text-[#1D1D1F] dark:text-white p-4">
        <div className="w-8 h-8 border-2 border-[#D1D1D6] dark:border-[#3A3A3C] border-t-[#007AFF] dark:border-t-[#0A84FF] rounded-full animate-spin mb-3" />
        <span className="text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] tracking-tight mb-4">
          Verifying security environment...
        </span>
        <button
          onClick={() => setAuthLoading(false)}
          className="text-xs text-[#007AFF] dark:text-[#0A84FF] hover:underline underline-offset-4 cursor-pointer transition-colors"
        >
          Click here to continue to application
        </button>
      </div>
    );
  }

  const handleTriggerTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mindmirror_tipkit_tour_completed');
    }
    setShowTour(false);
    setTimeout(() => {
      setActiveTab('chat');
      setShowTour(true);
    }, 80);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F2F7] dark:bg-[#121214] text-[#1D1D1F] dark:text-white transition-colors duration-200">
      
      {/* Navigation Bar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
        onOpenPrivacy={() => setShowPrivacyModal(true)}
        onOpenSecurity={() => setShowSecurityModal(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenTour={handleTriggerTour}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col">
        {!user ? (
          <AuthView onSuccess={() => setActiveTab('chat')} />
        ) : (
          <>
            <div className={activeTab === 'chat' ? 'relative flex-1 flex w-full bg-white dark:bg-[#121214] overflow-hidden' : 'hidden'}>
              <ChatSidebar
                conversations={conversations}
                activeSessionId={activeSession?.id || ''}
                isOpen={isSidebarOpen}
                onToggleOpen={handleToggleSidebar}
                onSelectConversation={handleSelectConversation}
                onNewConversationClick={handleNewReflection}
                onDeleteConversation={handleDeleteConversation}
              />
              <div className="flex-1 flex flex-col w-full h-full min-w-0">
                <JournalChat
                  userId={user.uid}
                  onEntrySaved={handleEntrySaved}
                  initialSession={activeSession}
                  isSidebarOpen={isSidebarOpen}
                  onToggleSidebar={handleToggleSidebar}
                  onSessionUpdated={handleSessionUpdated}
                  key={activeSession?.id || 'active_chat'}
                />
              </div>
            </div>

            {activeTab === 'journal' && (
              <JournalList
                entries={entries}
                onSelectEntry={(entry) => setSelectedEntry(entry)}
                onNewReflection={handleNewReflection}
                onDeleteEntry={handleDeleteEntry}
                isLoading={entriesLoading}
              />
            )}

            {activeTab === 'insights' && (
              <InsightsView
                userId={user.uid}
                entries={entries}
                onStartReflectivePrompt={handleStartReflectivePrompt}
              />
            )}
          </>
        )}
      </main>

      {/* Entry Detail Reading Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onDelete={handleDeleteEntry}
          onContinueThought={handleContinueThought}
        />
      )}

      {/* Privacy & Sovereignty Modal */}
      {showPrivacyModal && user && (
        <PrivacyModal
          userId={user.uid}
          onClose={() => setShowPrivacyModal(false)}
          onDataPurged={() => {
            setEntries([]);
            setSelectedEntry(null);
          }}
        />
      )}

      {/* Security Inspector & Threat Model Modal */}
      {showSecurityModal && (
        <SecurityInspectorModal
          userId={user?.uid || null}
          onClose={() => setShowSecurityModal(false)}
        />
      )}

      {/* Apple HIG TipKit Walkthrough Tour */}
      <TipKitTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onSwitchTab={setActiveTab}
        activeTab={activeTab}
      />

    </div>
  );
}
