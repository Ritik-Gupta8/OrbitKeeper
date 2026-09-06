/**
 * Firestore Journal Service
 *
 * Provides user-isolated storage for Personal Gemini Journal entries.
 * Enforces server-side UID isolation: users/{uid}/journalEntries/{entryId}
 *
 * Security Requirements:
 * - NEVER trusts client-supplied userId. Always uses verified UID from Firebase token.
 * - One user can never read or write another user's entries.
 * - Graceful failure: errors are logged safely and never crash the chat pipeline.
 */

import admin from 'firebase-admin';

let _firestore = null;

const getDb = () => {
  if (!_firestore) {
    if (!admin.apps.length) {
      console.warn('[FirestoreJournal] Firebase Admin not yet initialized');
      return null;
    }
    try {
      _firestore = admin.firestore();
    } catch (err) {
      console.error('[FirestoreJournal] Failed to initialize Firestore client:', err.message);
      return null;
    }
  }
  return _firestore;
};

/**
 * Save a new journal entry to the user's isolated collection
 * @param {string} uid - Authenticated user UID from verified Firebase token
 * @param {object} data - Journal entry details
 */
export const saveJournalEntry = async (uid, data = {}) => {
  if (!uid || typeof uid !== 'string' || uid === 'default') {
    console.warn('[FirestoreJournal] Refusing to save journal entry: invalid or unauthenticated UID');
    return null;
  }

  try {
    const db = getDb();
    if (!db) return null;

    const entry = {
      userId: uid,
      sessionId: data.sessionId || 'default',
      userMessage: data.userMessage || '',
      assistantResponse: data.assistantResponse || '',
      summary: data.summary || null,
      keyDecision: data.keyDecision || null,
      nextAction: data.nextAction || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db
      .collection('users')
      .doc(uid)
      .collection('journalEntries')
      .add(entry);

    return { id: docRef.id, ...entry };
  } catch (error) {
    // Log safely without leaking credentials or sensitive data
    console.error('[FirestoreJournal] Error saving journal entry:', error.message);
    return null;
  }
};

/**
 * Fetch recent journal entries for the authenticated user
 * @param {string} uid - Authenticated user UID
 * @param {number} limit - Number of entries to retrieve (max 50)
 */
export const getJournalHistory = async (uid, limit = 20) => {
  if (!uid || typeof uid !== 'string' || uid === 'default') {
    return [];
  }

  try {
    const db = getDb();
    if (!db) return [];

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('journalEntries')
      .orderBy('createdAt', 'desc')
      .limit(safeLimit)
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        userMessage: d.userMessage,
        assistantResponse: d.assistantResponse,
        summary: d.summary,
        keyDecision: d.keyDecision,
        nextAction: d.nextAction,
        sessionId: d.sessionId,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('[FirestoreJournal] Error fetching journal history:', error.message);
    return [];
  }
};
