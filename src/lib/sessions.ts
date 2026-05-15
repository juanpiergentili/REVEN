import { db } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

const SESSION_KEY = 'reven_session_id';

export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionId(id: string): void {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Creates a new session for the user. If the plan limit is already reached,
 * the oldest session (by createdAt) is deleted first so the new one fits.
 */
export async function createSession(uid: string, maxSessions: number): Promise<string> {
  const sessionsRef = collection(db, 'users', uid, 'sessions');
  const existingId = getSessionId();

  const snapshot = await getDocs(query(sessionsRef, orderBy('createdAt', 'asc')));
  // Exclude the current browser's own session (tab refresh / same device re-login)
  const others = snapshot.docs.filter(d => d.id !== existingId);

  // Kick oldest sessions until there's room for the new one
  while (others.length >= maxSessions) {
    const oldest = others.shift()!;
    await deleteDoc(doc(db, 'users', uid, 'sessions', oldest.id));
  }

  const sessionId = crypto.randomUUID();
  await setDoc(doc(db, 'users', uid, 'sessions', sessionId), {
    createdAt: serverTimestamp(),
    lastPing: serverTimestamp(),
    userAgent: navigator.userAgent.slice(0, 200),
  });

  setSessionId(sessionId);
  return sessionId;
}

export async function pingSession(uid: string): Promise<void> {
  const sessionId = getSessionId();
  if (!sessionId) return;
  try {
    await updateDoc(doc(db, 'users', uid, 'sessions', sessionId), {
      lastPing: serverTimestamp(),
    });
  } catch {
    // Session was deleted; ProtectedRoute onSnapshot will handle the UI
  }
}

export async function deleteSession(uid: string): Promise<void> {
  const sessionId = getSessionId();
  clearSessionId();
  if (!sessionId) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'sessions', sessionId));
  } catch {
    // Ignore — session may already be gone
  }
}
