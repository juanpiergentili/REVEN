import { db } from './firebase';
import {
  collection, getDocs, doc, getDoc, updateDoc, deleteDoc, Timestamp, query, where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

export interface UserRecord {
  uid: string;
  email: string;
  name: string;
  lastName: string;
  company: string;
  plan: string;
  role: string;
  status: string;
  phone?: string;
  cuil?: string;
  discountCode?: string;
  trialDays?: number;
  trialStartDate?: Timestamp;
  trialEndDate?: Timestamp;
  createdAt?: Timestamp;
  arcaRazonSocial?: string;
  arcaEstadoClave?: string;
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const snap = await getDocs(collection(db, 'users'));
  const users = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserRecord));
  users.sort((a, b) => {
    const tA = a.createdAt?.toMillis() ?? 0;
    const tB = b.createdAt?.toMillis() ?? 0;
    return tB - tA;
  });
  return users;
}

export async function approveUser(uid: string, user?: UserRecord): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status: 'approved' });
}

export async function rejectUser(uid: string): Promise<void> {
  const [vehiclesSnap, wantedSnap] = await Promise.all([
    getDocs(query(collection(db, 'vehicles'), where('sellerId', '==', uid), where('status', '==', 'ACTIVE'))),
    getDocs(query(collection(db, 'wanted_searches'), where('userId', '==', uid), where('status', '==', 'active'))),
  ]);
  await Promise.all([
    ...vehiclesSnap.docs.map(d => updateDoc(d.ref, { status: 'PAUSED' })),
    ...wantedSnap.docs.map(d => updateDoc(d.ref, { status: 'paused' })),
  ]);
  await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
}

export async function reactivateUser(uid: string): Promise<void> {
  const [vehiclesSnap, wantedSnap] = await Promise.all([
    getDocs(query(collection(db, 'vehicles'), where('sellerId', '==', uid), where('status', '==', 'PAUSED'))),
    getDocs(query(collection(db, 'wanted_searches'), where('userId', '==', uid), where('status', '==', 'paused'))),
  ]);
  await Promise.all([
    ...vehiclesSnap.docs.map(d => updateDoc(d.ref, { status: 'ACTIVE' })),
    ...wantedSnap.docs.map(d => updateDoc(d.ref, { status: 'active' })),
  ]);
  await updateDoc(doc(db, 'users', uid), { status: 'active' });
}

export async function deleteUser(uid: string): Promise<void> {
  // Delete Firebase Auth account via Cloud Function (Admin SDK required)
  const fns = getFunctions(app, 'us-central1');
  const deleteAuthUser = httpsCallable(fns, 'deleteAuthUser');
  await deleteAuthUser({ uid });

  // Delete Firestore data
  const [vehiclesSnap, wantedSnap] = await Promise.all([
    getDocs(query(collection(db, 'vehicles'), where('sellerId', '==', uid))),
    getDocs(query(collection(db, 'wanted_searches'), where('userId', '==', uid))),
  ]);
  await Promise.all([
    ...vehiclesSnap.docs.map(d => deleteDoc(d.ref)),
    ...wantedSnap.docs.map(d => deleteDoc(d.ref)),
  ]);
  await deleteDoc(doc(db, 'users', uid));
}


export interface PlatformStats {
  totalVehicles: number;
  activeVehicles: number;
  totalConversations: number;
  activeUsers: number;
  activationRate: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const vehiclesSnap = await getDocs(collection(db, 'vehicles'));
  const convosSnap = await getDocs(collection(db, 'conversations'));
  const usersSnap = await getDocs(collection(db, 'users'));
  
  const totalVehicles = vehiclesSnap.size;
  const activeVehicles = vehiclesSnap.docs.filter(d => d.data().status === 'ACTIVE').length;
  const totalConversations = convosSnap.size;
  const activeUsers = usersSnap.docs.filter(d => d.data().status === 'active').length;
  
  // Activation: Active users with at least 1 vehicle
  const usersWithVehicles = new Set(vehiclesSnap.docs.map(d => d.data().sellerId));
  const activeUsersWithVehicles = usersSnap.docs.filter(d => 
    d.data().status === 'active' && usersWithVehicles.has(d.id)
  ).length;
  
  const activationRate = activeUsers > 0 ? (activeUsersWithVehicles / activeUsers) * 100 : 0;

  return {
    totalVehicles,
    activeVehicles,
    totalConversations,
    activeUsers,
    activationRate
  };
}

export interface FinancialStats {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  recentPayments: any[];
}

export async function getFinancialStats(): Promise<FinancialStats> {
  const [membershipsSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, 'memberships')),
    getDocs(collection(db, 'users')),
  ]);

  const userMap: Record<string, { company: string; name: string; lastName: string }> = {};
  usersSnap.docs.forEach(d => {
    const data = d.data();
    userMap[d.id] = {
      company: data.company || data.companyName || '',
      name: data.name || '',
      lastName: data.lastName || '',
    };
  });

  const memberships = await Promise.all(membershipsSnap.docs.map(async d => {
    const data = d.data();

    // 1. Already stored inline
    if (data.companyName) return { id: d.id, ...data };

    // 2. Try prebuilt map (user still exists)
    const u = userMap[data.userId];
    if (u) {
      const name = u.company || `${u.name} ${u.lastName}`.trim();
      if (name) return { id: d.id, ...data, companyName: name };
    }

    // 3. Direct lookup (user exists but wasn't in batch read for some reason)
    if (data.userId) {
      try {
        const userSnap = await getDoc(doc(db, 'users', data.userId));
        if (userSnap.exists()) {
          const ud = userSnap.data();
          const name = ud.company || ud.companyName || `${ud.name || ''} ${ud.lastName || ''}`.trim();
          if (name) return { id: d.id, ...data, companyName: name };
        }
      } catch {}
    }

    return { id: d.id, ...data, companyName: '—' };
  }));

  const activeMemberships = memberships.filter((m: any) => m.status === 'active');

  let mrr = 0;
  activeMemberships.forEach((m: any) => {
    if (m.billingCycle === 'annual') {
      mrr += (m.pricePaid || 0) / 12;
    } else {
      mrr += (m.pricePaid || 0);
    }
  });

  const arr = mrr * 12;
  const totalRevenue = memberships.reduce((acc, m: any) => acc + (m.pricePaid || 0), 0);

  return {
    mrr,
    arr,
    totalRevenue,
    activeSubscriptions: activeMemberships.length,
    recentPayments: memberships.sort((a: any, b: any) =>
      (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
    ).slice(0, 10)
  };
}

export async function promoteToAdmin(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    role: 'ADMIN',
    status: 'active'
  });
}

export async function deleteAllMemberships(): Promise<void> {
  const snap = await getDocs(collection(db, 'memberships'));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

