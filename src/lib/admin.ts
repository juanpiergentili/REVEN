import { db } from './firebase';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, Timestamp, query, where,
} from 'firebase/firestore';

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
  const membershipsSnap = await getDocs(collection(db, 'memberships'));
  const memberships = membershipsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
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

