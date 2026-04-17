import { doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Increment a profile view counter for a user.
 */
export async function trackProfileView(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      totalProfileViews: increment(1),
    });
  } catch (e) {
    console.error('Error tracking profile view:', e);
  }
}

/**
 * Increment a vehicle listing view counter.
 */
export async function trackListingView(vehicleId: string, sellerUid: string): Promise<void> {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      viewCount: increment(1),
    });
    // Also increment seller's total listing views
    const userRef = doc(db, 'users', sellerUid);
    await updateDoc(userRef, {
      totalListingViews: increment(1),
    });
  } catch (e) {
    console.error('Error tracking listing view:', e);
  }
}

/**
 * Increment contact click counter.
 */
export async function trackContactClick(vehicleId: string, sellerUid: string): Promise<void> {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      contactCount: increment(1),
    });
    const userRef = doc(db, 'users', sellerUid);
    await updateDoc(userRef, {
      totalContactClicks: increment(1),
    });
  } catch (e) {
    console.error('Error tracking contact click:', e);
  }
}

/**
 * Update user's last online timestamp.
 */
export async function updateLastOnline(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastOnline: Timestamp.now(),
    });
  } catch (e) {
    console.error('Error updating last online:', e);
  }
}

/**
 * Format "last online" timestamp into human-readable string.
 */
export function formatLastOnline(lastOnline: string | undefined): string {
  if (!lastOnline) return 'Sin datos';
  const date = new Date(lastOnline);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'En línea ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

/**
 * Calculate average response time from timestamps array.
 */
export function getAverageResponseTime(timestamps: number[] | undefined): string {
  if (!timestamps || timestamps.length === 0) return 'Sin datos';
  const avg = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
  if (avg < 60) return `${Math.round(avg)} min`;
  if (avg < 1440) return `${Math.round(avg / 60)} horas`;
  return `${Math.round(avg / 1440)} días`;
}

/**
 * Get response badge text based on average response time.
 */
export function getResponseBadge(timestamps: number[] | undefined): { label: string; color: string } {
  if (!timestamps || timestamps.length === 0) return { label: 'Nuevo', color: 'bg-muted' };
  const avg = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
  if (avg <= 30) return { label: 'Responde rápido', color: 'bg-green-500' };
  if (avg <= 120) return { label: 'Buena respuesta', color: 'bg-blue-500' };
  if (avg <= 480) return { label: 'Responde frecuentemente', color: 'bg-yellow-500' };
  return { label: 'Puede demorar', color: 'bg-orange-500' };
}
