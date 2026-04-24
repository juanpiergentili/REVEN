import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Vehicle, WantedSearch } from '../types';

export function publishVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt'>) {
  const ref = collection(db, 'vehicles');
  return addDoc(ref, {
    ...vehicle,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToVehicles(callback: (vehicles: Vehicle[]) => void) {
  const q = query(collection(db, 'vehicles'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString()
      } as Vehicle;
    });
    callback(data);
  }, error => {
    console.error("Vehicles subscription error", error);
    // Remove orderBy requirement if index missing initially
    const fallbackQ = query(collection(db, 'vehicles'));
    onSnapshot(fallbackQ, fallbackSnap => {
      const data = fallbackSnap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString()
        } as Vehicle;
      }).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
      callback(data);
    });
  });
}

export function publishWantedSearch(wanted: Omit<WantedSearch, 'id' | 'createdAt'>) {
  const ref = collection(db, 'wanted_searches');
  return addDoc(ref, {
    ...wanted,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToWantedSearches(callback: (searches: WantedSearch[]) => void) {
  const fallbackQ = query(collection(db, 'wanted_searches'));
  return onSnapshot(fallbackQ, snapshot => {
    const data = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString()
      } as WantedSearch;
    }).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    callback(data);
  });
}
