'use client';

import React, { useState } from 'react';
import { DuoIcon } from '@/components/DuoIcon';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SecurityInspectorModalProps {
  userId: string | null;
  onClose: () => void;
}

interface TestResult {
  name: string;
  category: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export const SecurityInspectorModal: React.FC<SecurityInspectorModalProps> = ({
  userId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'model' | 'rules'>('tests');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runAdversarialSecurityTests = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    // Test 1: Cross-User Write Test (IDOR / BOLA Prevention)
    try {
      const adversaryPath = 'adversary_target_uid_9999';
      const adversaryDocRef = doc(db, 'users', adversaryPath, 'journals', 'malicious_entry_001');
      await setDoc(adversaryDocRef, {
        title: 'Exploit Attempt',
        summary: 'Attacking cross-user boundary',
        userId: adversaryPath,
      });
      // If write succeeded, that is a FAILURE of security
      results.push({
        name: 'Cross-User Unauthorized Write',
        category: 'Access Control (BOLA / IDOR)',
        expected: 'FirebaseError: Missing or insufficient permissions',
        actual: 'Write unexpectedly succeeded! (VULNERABILITY)',
        passed: false,
      });
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      const isPermissionDenied = errMessage.toLowerCase().includes('permission') || errMessage.toLowerCase().includes('insufficient');
      results.push({
        name: 'Cross-User Unauthorized Write',
        category: 'Access Control (BOLA / IDOR)',
        expected: 'PERMISSION_DENIED',
        actual: isPermissionDenied ? 'Permission Denied by Firestore Security Rules' : errMessage,
        passed: isPermissionDenied,
      });
    }

    // Test 2: Cross-User Read Enumeration Test
    try {
      const adversaryPath = 'adversary_target_uid_9999';
      const adversaryColRef = collection(db, 'users', adversaryPath, 'journals');
      const snap = await getDocs(adversaryColRef);
      results.push({
        name: 'Cross-User Collection Read',
        category: 'Data Isolation & Privacy',
        expected: 'PERMISSION_DENIED',
        actual: `Read allowed! Read ${snap.size} documents (VULNERABILITY)`,
        passed: false,
      });
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      const isPermissionDenied = errMessage.toLowerCase().includes('permission') || errMessage.toLowerCase().includes('insufficient');
      results.push({
        name: 'Cross-User Collection Read',
        category: 'Data Isolation & Privacy',
        expected: 'PERMISSION_DENIED',
        actual: isPermissionDenied ? 'Permission Denied by Firestore Security Rules' : errMessage,
        passed: isPermissionDenied,
      });
    }

    // Test 3: Ownership Manipulation Test (Spoofing author identity)
    if (userId) {
      try {
        const spoofedDocRef = doc(db, 'users', userId, 'journals', 'spoofed_test_doc');
        await setDoc(spoofedDocRef, {
          title: 'Tampering Attempt',
          summary: 'Trying to assign another user as owner',
          userId: 'some_other_victim_uid',
        });
        results.push({
          name: 'Ownership Field Tampering',
          category: 'Data Integrity',
          expected: 'PERMISSION_DENIED',
          actual: 'Tampered write succeeded! (VULNERABILITY)',
          passed: false,
        });
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        const isPermissionDenied = errMessage.toLowerCase().includes('permission') || errMessage.toLowerCase().includes('insufficient');
        results.push({
          name: 'Ownership Field Tampering',
          category: 'Data Integrity',
          expected: 'PERMISSION_DENIED',
          actual: isPermissionDenied ? 'Permission Denied (Rule rejects mismatching request.resource.data.userId)' : errMessage,
          passed: isPermissionDenied,
        });
      }
    }

    // Test 4: Browser Bundle Secret Leak Test
    const clientGeminiKey = (process.env as Record<string, string | undefined>).GEMINI_API_KEY;
    const isSecretHidden = clientGeminiKey === undefined || clientGeminiKey === '';
    results.push({
      name: 'Client-Side Secret Isolation',
      category: 'Secret Management',
      expected: 'undefined (Zero exposure in browser JS)',
      actual: isSecretHidden ? 'Protected: GEMINI_API_KEY is not exposed to client bundle' : 'Exposed: Key found in client env (VULNERABILITY)',
      passed: isSecretHidden,
    });

    setTestResults(results);
    setIsRunningTests(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/30 dark:bg-black/75 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="security-modal-title"
        className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-[#1C1C1E] rounded-2xl border border-[#E5E5EA] dark:border-[#38383A] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-between bg-[#F2F2F7]/80 dark:bg-[#252528]/80 backdrop-blur-xl">
          <div className="flex items-center space-x-2">
            <DuoIcon name="certificate" className="text-base text-[#34C759] dark:text-[#30D158]" />
            <h2 id="security-modal-title" className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
              Security Constitution & Adversarial Verification
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E5E5EA] dark:border-[#38383A] px-6 bg-[#F2F2F7]/50 dark:bg-[#1C1C1E]">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'tests'
                ? 'border-[#007AFF] text-[#007AFF] dark:border-[#0A84FF] dark:text-white'
                : 'border-transparent text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            Adversarial Test Suite
          </button>
          <button
            onClick={() => setActiveTab('model')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'model'
                ? 'border-[#007AFF] text-[#007AFF] dark:border-[#0A84FF] dark:text-white'
                : 'border-transparent text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            5 Threat Zones
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-[#007AFF] text-[#007AFF] dark:border-[#0A84FF] dark:text-white'
                : 'border-transparent text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            Firestore Rules
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#1D1D1F] dark:text-[#EBEBF5]">
          
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                    Live Negative Security Checks
                  </h3>
                  <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
                    Executes real unauthorized Firestore mutations & client bundle audits to prove defense-in-depth.
                  </p>
                </div>

                <button
                  onClick={runAdversarialSecurityTests}
                  disabled={isRunningTests}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0071E3] dark:bg-[#F5F5F7] dark:hover:bg-white dark:text-black shadow-xs transition-colors"
                >
                  <DuoIcon name="rocket" className="text-xs" />
                  <span>{isRunningTests ? 'Executing...' : 'Run Security Tests'}</span>
                </button>
              </div>

              {testResults.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#E5E5EA] dark:border-[#38383A] rounded-xl">
                  <p className="text-[#6E6E73] dark:text-[#8E8E93]">
                    Click &quot;Run Security Tests&quot; to verify that cross-user reads/writes are blocked by Firestore rules and client secrets are hidden.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#252528] flex items-start space-x-3 shadow-xs"
                    >
                      {t.passed ? (
                        <DuoIcon name="check-circle" className="text-base text-[#34C759] dark:text-[#30D158] shrink-0 mt-0.5" />
                      ) : (
                        <DuoIcon name="alert-triangle" className="text-base text-[#FF3B30] dark:text-[#FF453A] shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#1D1D1F] dark:text-white">
                            {t.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              t.passed
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#34C759] dark:text-[#30D158] border border-emerald-200 dark:border-[#30D158]/40'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-[#FF3B30] dark:text-[#FF453A] border border-rose-200 dark:border-[#FF453A]/40'
                            }`}
                          >
                            {t.passed ? 'PASS (BLOCKED)' : 'FAIL'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] font-mono">Category: {t.category}</p>
                        <p className="text-[11px] text-[#1D1D1F] dark:text-[#D1D1D6]">{t.actual}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'model' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                The 5 Threat Zones Threat Model
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-[#F2F2F7]/60 dark:bg-[#252528]">
                  <strong className="text-[#1D1D1F] dark:text-white block mb-1">
                    1. Input Surfaces (OWASP LLM02)
                  </strong>
                  <p className="text-[#6E6E73] dark:text-[#8E8E93]">
                    User journal reflections are treated as untrusted data. Input lengths are capped to 4,000 characters and defensively destructured.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-[#F2F2F7]/60 dark:bg-[#252528]">
                  <strong className="text-[#1D1D1F] dark:text-white block mb-1">
                    2. Planning & Reasoning (OWASP LLM01)
                  </strong>
                  <p className="text-[#6E6E73] dark:text-[#8E8E93]">
                    Immutable system instructions on server routes with strict XML boundary delimiters (<code className="text-[10px] bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#D1D1D6] px-1 py-0.5 rounded">&lt;user_journal_content&gt;</code>) preventing prompt injection and role hijacking.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-[#F2F2F7]/60 dark:bg-[#252528]">
                  <strong className="text-[#1D1D1F] dark:text-white block mb-1">
                    3. Tool Execution & API Exclusivity
                  </strong>
                  <p className="text-[#6E6E73] dark:text-[#8E8E93]">
                    All Gemini model calls use <code className="text-[10px] bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#D1D1D6] px-1 py-0.5 rounded">@google/genai</code> within server routes (<code className="text-[10px] bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#D1D1D6] px-1 py-0.5 rounded">/api/gemini/*</code>). Zero API keys are included in client bundles.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-[#F2F2F7]/60 dark:bg-[#252528]">
                  <strong className="text-[#1D1D1F] dark:text-white block mb-1">
                    4. Memory & State (OWASP A01 / BOLA)
                  </strong>
                  <p className="text-[#6E6E73] dark:text-[#8E8E93]">
                    Documents exist strictly under <code className="text-[10px] bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#D1D1D6] px-1 py-0.5 rounded">/users/{'{userId}'}/...</code> with matching <code className="text-[10px] bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#D1D1D6] px-1 py-0.5 rounded">request.auth.uid == userId</code> verified by Firestore Security Rules.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-[#F2F2F7]/60 dark:bg-[#252528]">
                  <strong className="text-[#1D1D1F] dark:text-white block mb-1">
                    5. Inter-System Communication & Resilience
                  </strong>
                  <p className="text-[#6E6E73] dark:text-[#8E8E93]">
                    Resilient Model Fallback Ladder (gemini-3.6-flash → gemini-3.1-flash-lite → gemini-flash-latest → gemini-3.7-flash) handling transient outages, 503s, and 429s.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                  Active Deployed Security Rules
                </h3>
                <span className="text-[11px] font-mono text-[#34C759] dark:text-[#30D158]">
                  rules_version = &apos;2&apos;;
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-[#F2F2F7] dark:bg-[#18181A] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#D1D1D6] font-mono text-[11px] overflow-x-auto leading-relaxed">
{`rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global fallback: Deny all by default
    match /{document=**} {
      allow read, write: if false;
    }

    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    // All user-scoped documents and collections
    match /users/{userId} {
      allow read, write: if isOwner(userId) && isValidId(userId);

      // Journal & conversation summaries collection
      match /journals/{journalId} {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId) 
          && (request.resource.data.userId == null || request.resource.data.userId == userId)
          && request.resource.data.title is string
          && request.resource.data.title.size() <= 200
          && request.resource.data.summary is string
          && request.resource.data.summary.size() <= 10000;
      }

      // Active & historical multi-turn conversation sessions
      match /conversations/{conversationId} {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId) 
          && (request.resource.data.userId == null || request.resource.data.userId == userId);
      }

      // Personal Reflection & Mood/Theme Insights
      match /insights/{insightId} {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId) 
          && (request.resource.data.userId == null || request.resource.data.userId == userId);
      }
    }
  }
}`}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E5E5EA] dark:border-[#38383A] bg-[#F2F2F7]/80 dark:bg-[#252528]/80 backdrop-blur-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-[#007AFF] hover:bg-[#0071E3] dark:bg-white dark:text-black dark:hover:bg-[#F2F2F7] transition-colors shadow-xs"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
