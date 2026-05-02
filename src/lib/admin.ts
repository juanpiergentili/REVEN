import { db } from './firebase';
import {
  collection, getDocs, doc, updateDoc, Timestamp,
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
  const update: Record<string, any> = { status: 'active' };

  if (user?.discountCode === 'REVENFREE60' && user.trialDays) {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + user.trialDays);
    update.trialStartDate = Timestamp.fromDate(start);
    update.trialEndDate = Timestamp.fromDate(end);
  }

  await updateDoc(doc(db, 'users', uid), update);
}

export async function rejectUser(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
}
