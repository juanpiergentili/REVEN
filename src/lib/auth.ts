import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { PLAN_LIMITS, normalizePlan } from '../types';


export async function registerUserSession(uid: string): Promise<string> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const userData = snap.data();
  const plan = normalizePlan(userData?.plan);
  const maxSessions = PLAN_LIMITS[plan]?.maxSessions || 1;

  let sessions = userData?.sessions || {};
  const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  // Sort sessions by creation time (oldest first)
  const sessionIds = Object.keys(sessions).sort((a, b) => {
    const tA = sessions[a].createdAt?.seconds || 0;
    const tB = sessions[b].createdAt?.seconds || 0;
    return tA - tB;
  });

  // If over limit, remove oldest sessions to make room for 1 new
  if (sessionIds.length >= maxSessions) {
    const toRemove = sessionIds.slice(0, sessionIds.length - maxSessions + 1);
    toRemove.forEach(id => delete sessions[id]);
  }

  sessions[sessionId] = {
    createdAt: new Date(),
    lastSeenAt: new Date(),
    userAgent: navigator.userAgent
  };

  await updateDoc(userRef, {
    sessions,
    lastLoginAt: serverTimestamp()
  });

  localStorage.setItem(`reven_session_${uid}`, sessionId);
  return sessionId;
}

