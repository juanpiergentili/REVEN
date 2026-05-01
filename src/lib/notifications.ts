import {
  collection, addDoc, updateDoc, doc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db, convertTimestamp } from './firebase';
import type { Notification, NotificationType } from '../types';

type NewNotification = Pick<Notification,
  'userId' | 'type' | 'title' | 'body' | 'resourceType' | 'resourceId'
>;

export async function createNotification(data: NewNotification): Promise<string> {
  const docRef = await addDoc(collection(db, 'notifications'), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
  );
  const { getDocs } = await import('firebase/firestore');
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  const now = serverTimestamp();
  snap.docs.forEach(d => batch.update(d.ref, { read: true, readAt: now }));
  await batch.commit();
}

export function subscribeToNotifications(
  userId: string,
  onUpdate: (notifications: Notification[]) => void,
  maxItems = 30,
): () => void {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxItems),
  );
  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
      createdAt: convertTimestamp(d.data().createdAt),
      readAt:    d.data().readAt ? convertTimestamp(d.data().readAt) : undefined,
    }) as Notification);
    onUpdate(notifications);
  });
}
