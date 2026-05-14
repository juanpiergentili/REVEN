import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { PLAN_LIMITS, normalizePlan } from '../types';

export type DemoUserType = 'demo' | 'vendedor' | 'comprador';

const DEMO_CREDENTIALS: Record<DemoUserType, { email: string; password: string }> = {
  demo:      { email: 'demo@reven.com.ar',       password: 'DEMO1234'  },
  vendedor:  { email: 'vendedor.test@reven.com.ar', password: 'REVEN2026' },
  comprador: { email: 'comprador.test@reven.com.ar', password: 'REVEN2026' },
};

const DEMO_PROFILES: Record<DemoUserType, {
  displayName: string; company: string; cuil: string; phone: string; province: string; city: string;
}> = {
  demo:      { displayName: 'Usuario Demo',    company: 'Reven Demo Dealer',          cuil: '20-00000000-0', phone: '',                      province: '',            city: ''             },
  vendedor:  { displayName: 'Vendedor REVEN',  company: 'REVEN Motors (Vendedor)',    cuil: '20-99999999-9', phone: '+54 9 11 5555-0001',    province: 'buenosaires', city: 'ba-sanisidro' },
  comprador: { displayName: 'Comprador REVEN', company: 'AutoSelect B2B (Comprador)', cuil: '20-88888888-8', phone: '+54 9 11 5555-0002',    province: 'caba',        city: 'caba-palermo' },
};

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

export async function loginDemoUser(type: DemoUserType): Promise<void> {
  const { email, password } = DEMO_CREDENTIALS[type];
  const profile = DEMO_PROFILES[type];

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await registerUserSession(cred.user.uid);
  } catch (err: any) {
    const isNotFound =
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/invalid-login-credentials';

    if (!isNotFound) throw err;

    // First time: create the demo account
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    await updateProfile(user, { displayName: profile.displayName });

    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const sessions = {
      [sessionId]: {
        createdAt: new Date(),
        lastSeenAt: new Date(),
        userAgent: navigator.userAgent
      }
    };

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      name: profile.displayName.split(' ')[0],
      lastName: profile.displayName.split(' ').slice(1).join(' ') || 'Demo',
      cuil: profile.cuil,
      phone: profile.phone,
      company: profile.company,
      province: profile.province,
      city: profile.city,
      plan: 'platinum',
      role: 'USER',
      status: 'approved',
      sessions: sessions,
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    localStorage.setItem(`reven_session_${user.uid}`, sessionId);
  }
}
