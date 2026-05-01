import {
  collection, addDoc, updateDoc, doc,
  query, where, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db, convertTimestamp } from './firebase';
import type { Reservation, ReservationStatus } from '../types';

type NewReservation = Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'>;

const TTL_HOURS = 48;

export async function createReservation(data: NewReservation): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TTL_HOURS);

  const docRef = await addDoc(collection(db, 'reservations'), {
    ...data,
    status: 'pending' as ReservationStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    expiresAt,
  });
  return docRef.id;
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  extra: Partial<Pick<Reservation, 'cancellationReason' | 'cancelledBy'>> = {},
): Promise<void> {
  const now = serverTimestamp();
  const updates: Record<string, unknown> = { status, updatedAt: now };

  if (status === 'confirmed')  updates.confirmedAt  = now;
  if (status === 'cancelled') { updates.cancelledAt  = now; Object.assign(updates, extra); }

  await updateDoc(doc(db, 'reservations', id), updates);
}

export function subscribeToReservations(
  userId: string,
  role: 'buyer' | 'seller',
  onUpdate: (reservations: Reservation[]) => void,
): () => void {
  const field = role === 'buyer' ? 'buyerId' : 'sellerId';
  const q = query(collection(db, 'reservations'), where(field, '==', userId));

  return onSnapshot(q, (snap) => {
    const reservations = snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
      createdAt:    convertTimestamp(d.data().createdAt),
      updatedAt:    convertTimestamp(d.data().updatedAt),
      expiresAt:    convertTimestamp(d.data().expiresAt),
      confirmedAt:  d.data().confirmedAt  ? convertTimestamp(d.data().confirmedAt)  : undefined,
      cancelledAt:  d.data().cancelledAt  ? convertTimestamp(d.data().cancelledAt)  : undefined,
    }) as Reservation);
    onUpdate(reservations);
  });
}
