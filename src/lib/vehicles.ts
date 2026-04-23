import { db, storage } from './firebase';
import {
  collection, addDoc, updateDoc, doc,
  query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Vehicle } from '../types';

type NewVehicle = Omit<Vehicle, 'id' | 'createdAt'>;

export async function createVehicle(data: NewVehicle): Promise<string> {
  const docRef = await addDoc(collection(db, 'vehicles'), {
    ...data,
    createdAt: serverTimestamp(),
    viewCount: 0,
    contactCount: 0,
  });
  return docRef.id;
}

export async function uploadVehiclePhotos(files: File[], vehicleId: string): Promise<string[]> {
  const uploads = files.map(async (file) => {
    const storageRef = ref(storage, `vehicles/${vehicleId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  });
  return Promise.all(uploads);
}

export async function updateVehiclePhotos(vehicleId: string, photoUrls: string[]): Promise<void> {
  await updateDoc(doc(db, 'vehicles', vehicleId), { photos: photoUrls });
}

export function subscribeToVehicles(
  onUpdate: (vehicles: Vehicle[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'vehicles'),
    orderBy('createdAt', 'desc'),
    limit(200),
  );
  return onSnapshot(q, (snap) => {
    const vehicles = snap.docs
      .map(docSnap => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : (data.createdAt ?? new Date().toISOString()),
        } as Vehicle;
      })
      .filter(v => v.status === 'ACTIVE');
    onUpdate(vehicles);
  }, onError);
}
