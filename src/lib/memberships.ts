import {
  collection, addDoc, updateDoc, doc,
  query, where, getDocs, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db, convertTimestamp } from './firebase';
import type { Membership, MembershipPlan, BillingCycle, MembershipStatus } from '../types';
import { PLAN_LIMITS, PLAN_PRICES } from '../types';

type NewMembership = Pick<Membership, 'userId' | 'plan' | 'billingCycle' | 'discountCode' | 'discountPercent'>;

function getPeriodEnd(cycle: BillingCycle): Date {
  const end = new Date();
  if (cycle === 'annual') end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export async function createMembership(data: NewMembership): Promise<string> {
  const { plan, billingCycle, discountPercent = 0 } = data;
  const basePrice = PLAN_PRICES[plan][billingCycle];
  const pricePaid = Math.round(basePrice * (1 - discountPercent / 100));
  const limits = PLAN_LIMITS[plan];
  const now = new Date();

  const docRef = await addDoc(collection(db, 'memberships'), {
    ...data,
    pricePaid,
    currency: 'USD',
    status: 'active' as MembershipStatus,
    maxVehicles: limits.maxVehicles === Infinity ? 999999 : limits.maxVehicles,
    canFeatureListing: limits.canFeatureListing,
    currentPeriodStart: now,
    currentPeriodEnd: getPeriodEnd(billingCycle),
    cancelAtPeriodEnd: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function cancelMembership(id: string, atPeriodEnd = true): Promise<void> {
  const updates: Record<string, unknown> = { cancelAtPeriodEnd: atPeriodEnd, updatedAt: serverTimestamp() };
  if (!atPeriodEnd) { updates.status = 'cancelled'; updates.cancelledAt = serverTimestamp(); }
  await updateDoc(doc(db, 'memberships', id), updates);
}

export async function getActiveMembership(userId: string): Promise<Membership | null> {
  const q = query(
    collection(db, 'memberships'),
    where('userId', '==', userId),
    where('status', 'in', ['active', 'trialing']),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return {
    ...d.data(),
    id: d.id,
    createdAt:           convertTimestamp(d.data().createdAt),
    updatedAt:           convertTimestamp(d.data().updatedAt),
    currentPeriodStart:  convertTimestamp(d.data().currentPeriodStart),
    currentPeriodEnd:    convertTimestamp(d.data().currentPeriodEnd),
    cancelledAt: d.data().cancelledAt ? convertTimestamp(d.data().cancelledAt) : undefined,
  } as Membership;
}

export function subscribeToMembership(
  userId: string,
  onUpdate: (membership: Membership | null) => void,
): () => void {
  const q = query(
    collection(db, 'memberships'),
    where('userId', '==', userId),
    where('status', 'in', ['active', 'trialing']),
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) { onUpdate(null); return; }
    const d = snap.docs[0];
    onUpdate({
      ...d.data(),
      id: d.id,
      createdAt:          convertTimestamp(d.data().createdAt),
      updatedAt:          convertTimestamp(d.data().updatedAt),
      currentPeriodStart: convertTimestamp(d.data().currentPeriodStart),
      currentPeriodEnd:   convertTimestamp(d.data().currentPeriodEnd),
    } as Membership);
  });
}
