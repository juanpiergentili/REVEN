import { db } from './firebase';
import {
  collection, getDocs, doc, updateDoc,
  query, where, orderBy, Timestamp,
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

export async function approveUser(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status: 'active' });
}

export async function rejectUser(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
}
