import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { JournalEntry, ConversationSession, PersonalInsight } from './types';

// Helper to scrub any undefined values before writing to Firestore
function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = sanitizePayload(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}

/**
 * Save a newly summarized Journal Entry strictly in `/users/{userId}/journals/{journalId}`
 */
export async function saveJournalEntry(
  userId: string,
  entryData: Omit<JournalEntry, 'id'>,
  customId?: string
): Promise<JournalEntry> {
  if (!userId) throw new Error('User ID is required for saving journal entries.');

  const journalsCol = collection(db, 'users', userId, 'journals');
  const docRef = customId ? doc(journalsCol, customId) : doc(journalsCol);
  
  const newEntry: JournalEntry = {
    ...entryData,
    id: docRef.id,
    userId,
    updatedAt: new Date().toISOString(),
  };

  const payload = sanitizePayload({
    ...newEntry,
    _serverTimestamp: serverTimestamp(),
  });

  await setDoc(docRef, payload);
  return newEntry;
}

/**
 * Fetch user's personal journal entries, ordered chronologically
 */
export async function fetchUserJournals(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  const journalsCol = collection(db, 'users', userId, 'journals');
  // Order by createdAt descending
  const q = query(journalsCol, orderBy('createdAt', 'desc'), limit(100));
  
  const snapshot = await getDocs(q);
  const results: JournalEntry[] = [];
  snapshot.forEach((d) => {
    const data = d.data() as JournalEntry;
    results.push({
      ...data,
      id: d.id,
      userId,
    });
  });

  return results;
}

/**
 * Delete a specific journal entry owned by the user
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('Invalid parameters for deleting journal.');
  const docRef = doc(db, 'users', userId, 'journals', entryId);
  await deleteDoc(docRef);
}

/**
 * Persist an active or saved conversation session
 */
export async function saveConversationSession(
  userId: string,
  session: ConversationSession
): Promise<void> {
  if (!userId || !session.id) throw new Error('Invalid parameters for saving conversation.');

  const sessionRef = doc(db, 'users', userId, 'conversations', session.id);
  const payload = sanitizePayload({
    ...session,
    userId,
    updatedAt: new Date().toISOString(),
    _serverTimestamp: serverTimestamp(),
  });

  await setDoc(sessionRef, payload);
}

/**
 * Fetch saved conversation sessions
 */
export async function fetchUserConversations(userId: string): Promise<ConversationSession[]> {
  if (!userId) return [];

  const colRef = collection(db, 'users', userId, 'conversations');
  const q = query(colRef, orderBy('updatedAt', 'desc'), limit(50));
  const snapshot = await getDocs(q);

  const results: ConversationSession[] = [];
  snapshot.forEach((d) => {
    results.push({
      ...(d.data() as ConversationSession),
      id: d.id,
      userId,
    });
  });

  return results;
}

/**
 * Delete a specific conversation session owned by the user
 */
export async function deleteConversationSession(userId: string, sessionId: string): Promise<void> {
  if (!userId || !sessionId) throw new Error('Invalid parameters for deleting conversation.');
  const docRef = doc(db, 'users', userId, 'conversations', sessionId);
  await deleteDoc(docRef);
}

/**
 * Update the title of an existing conversation session
 */
export async function updateConversationTitle(
  userId: string,
  sessionId: string,
  title: string
): Promise<void> {
  if (!userId || !sessionId || !title.trim()) return;
  const docRef = doc(db, 'users', userId, 'conversations', sessionId);
  await setDoc(
    docRef,
    sanitizePayload({
      title: title.trim(),
      updatedAt: new Date().toISOString(),
      _serverTimestamp: serverTimestamp(),
    }),
    { merge: true }
  );
}

/**
 * Save synthesized personal insights
 */
export async function savePersonalInsight(
  userId: string,
  insight: Omit<PersonalInsight, 'id'>
): Promise<PersonalInsight> {
  if (!userId) throw new Error('User ID is required for saving insights.');

  const insightsCol = collection(db, 'users', userId, 'insights');
  const docRef = doc(insightsCol);

  const newInsight: PersonalInsight = {
    ...insight,
    id: docRef.id,
    userId,
  };

  const payload = sanitizePayload({
    ...newInsight,
    _serverTimestamp: serverTimestamp(),
  });

  await setDoc(docRef, payload);
  return newInsight;
}

/**
 * Fetch the most recent personal insight report
 */
export async function fetchLatestPersonalInsight(userId: string): Promise<PersonalInsight | null> {
  if (!userId) return null;

  const insightsCol = collection(db, 'users', userId, 'insights');
  const q = query(insightsCol, orderBy('generatedAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  const first = snapshot.docs[0];
  return {
    ...(first.data() as PersonalInsight),
    id: first.id,
    userId,
  };
}

/**
 * Export all user-authored journal entries and insights for user sovereignty
 */
export async function exportUserData(userId: string) {
  const journals = await fetchUserJournals(userId);
  const conversations = await fetchUserConversations(userId);
  const latestInsight = await fetchLatestPersonalInsight(userId);

  return {
    exportedAt: new Date().toISOString(),
    userId,
    journalCount: journals.length,
    journals,
    conversations,
    latestInsight,
  };
}

/**
 * Privacy Purge: Irreversibly delete all personal entries belonging to the user
 */
export async function purgeAllUserData(userId: string): Promise<{ deletedJournals: number; deletedConversations: number }> {
  if (!userId) throw new Error('User ID required for data purge.');

  // Delete all journals
  const journals = await fetchUserJournals(userId);
  for (const j of journals) {
    await deleteDoc(doc(db, 'users', userId, 'journals', j.id));
  }

  // Delete all conversations
  const convs = await fetchUserConversations(userId);
  for (const c of convs) {
    await deleteDoc(doc(db, 'users', userId, 'conversations', c.id));
  }

  return {
    deletedJournals: journals.length,
    deletedConversations: convs.length,
  };
}
