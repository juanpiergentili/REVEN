import { db } from './firebase';
import {
  collection, addDoc, deleteDoc, doc,
  query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import type { WantedSearch } from '../types';

type NewWantedSearch = Omit<WantedSearch, 'id' | 'createdAt'>;

export async function createWantedSearch(data: NewWantedSearch): Promise<string> {
  const docRef = await addDoc(collection(db, 'wanted_searches'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteWantedSearch(id: string): Promise<void> {
  await deleteDoc(doc(db, 'wanted_searches', id));
}

export function subscribeToWantedSearches(
  onUpdate: (searches: WantedSearch[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'wanted_searches'),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  return onSnapshot(q, (snap) => {
    const searches = snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt ?? new Date().toISOString()),
      } as WantedSearch;
    });
    onUpdate(searches);
  }, onError);
}
