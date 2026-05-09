import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

export async function addPointsToAgency(userId: string, points: number): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    points: increment(points)
  });
}

export function getAgencyTier(points: number = 0): string {
  if (points < 1000) return 'Bronce';
  if (points < 3000) return 'Plata';
  if (points < 5000) return 'Oro';
  if (points < 10000) return 'Platino';
  return 'Diamante';
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case 'Bronce': return 'bg-amber-600/20 text-amber-500 border-amber-600/30';
    case 'Plata': return 'bg-slate-300/20 text-slate-300 border-slate-300/30';
    case 'Oro': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    case 'Platino': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'Diamante': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default: return 'bg-primary/20 text-primary border-primary/30';
  }
}
