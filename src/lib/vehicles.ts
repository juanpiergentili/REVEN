import { db, storage, convertTimestamp } from './firebase';
import {
  collection, addDoc, updateDoc, doc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { Vehicle } from '../types';

type NewVehicle = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'soldAt' | 'viewCount' | 'contactCount'>;

export async function createVehicle(data: NewVehicle): Promise<string> {
  const docRef = await addDoc(collection(db, 'vehicles'), {
    ...data,
    createdAt: serverTimestamp(),
    viewCount: 0,
    contactCount: 0,
  });
  return docRef.id;
}

export async function uploadVehiclePhotos(files: File[], vehicleId: string, userId: string): Promise<string[]> {
  const uploads = files.map(async (file) => {
    const storageRef = ref(storage, `vehicles/${userId}/${vehicleId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  });
  return Promise.all(uploads);
}

export async function updateVehiclePhotos(vehicleId: string, photoUrls: string[]): Promise<void> {
  await updateDoc(doc(db, 'vehicles', vehicleId), { photos: photoUrls });
}

export async function getVehiclesBySeller(sellerId: string): Promise<Vehicle[]> {
  const snap = await getDocs(
    query(collection(db, 'vehicles'), where('sellerId', '==', sellerId))
  );
  const vehicles = snap.docs.map(docSnap => {
    const data = docSnap.data();
    return { ...data, id: docSnap.id, createdAt: convertTimestamp(data.createdAt) } as Vehicle;
  });
  vehicles.sort((a, b) => {
    const tA = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
    return tB - tA;
  });
  return vehicles;
}

export async function updateVehicleStatus(
  vehicleId: string,
  status: Vehicle['status'],
): Promise<void> {
  await updateDoc(doc(db, 'vehicles', vehicleId), { status });
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
          createdAt: convertTimestamp(data.createdAt),
        } as Vehicle;
      })
      .filter(v => v.status === 'ACTIVE');
    onUpdate(vehicles);
  }, onError);
}
