import {
  collection, doc, addDoc, query, where, orderBy, onSnapshot,
  updateDoc, serverTimestamp, getDocs, limit, Timestamp, getDoc, setDoc, increment
} from 'firebase/firestore';
import { db } from './firebase';

// ---- Conversations ----

export interface ConversationData {
  participants: string[];
  vehicleId?: string;
  vehicleInfo?: {
    brand: string;
    model: string;
    year: number;
    photo: string;
    price?: number;
  };
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  buyerCompany: string;
  sellerCompany: string;
  lastMessage?: string;
  lastMessageAt: Timestamp;
  createdAt: Timestamp;
}

export interface MessageData {
  senderId: string;
  text: string;
  createdAt: Timestamp;
  read: boolean;
}

/**
 * Find or create a conversation between two users for a specific vehicle.
 * If vehicleId is provided, it finds an existing conversation for that vehicle between those users.
 * If not found, creates a new one.
 */
export async function findOrCreateConversation(params: {
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  buyerCompany: string;
  sellerCompany: string;
  vehicleId?: string;
  vehicleInfo?: ConversationData['vehicleInfo'];
}): Promise<string> {
  const conversationsRef = collection(db, 'conversations');

  // Try to find existing conversation
  const constraints = [
    where('participants', 'array-contains', params.buyerId),
  ];
  
  const q = query(conversationsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as ConversationData;
    const isMatch = data.participants.includes(params.sellerId);
    const vehicleMatch = params.vehicleId ? data.vehicleId === params.vehicleId : !data.vehicleId;
    if (isMatch && vehicleMatch) {
      return docSnap.id;
    }
  }

  // Create new conversation
  const newConvo: ConversationData = {
    participants: [params.buyerId, params.sellerId],
    buyerId: params.buyerId,
    sellerId: params.sellerId,
    buyerName: params.buyerName,
    sellerName: params.sellerName,
    buyerCompany: params.buyerCompany,
    sellerCompany: params.sellerCompany,
    vehicleId: params.vehicleId,
    vehicleInfo: params.vehicleInfo,
    lastMessage: '',
    lastMessageAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(conversationsRef, newConvo);
  return docRef.id;
}

/**
 * Subscribe to conversations for a given user.
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: (ConversationData & { id: string })[]) => void
) {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as ConversationData,
    }));
    callback(conversations);
  });
}

/**
 * Subscribe to messages in a conversation.
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: (MessageData & { id: string })[]) => void
) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as MessageData,
    }));
    callback(messages);
  });
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: Timestamp.now(),
    read: false,
  });

  // Update conversation's last message
  const convoRef = doc(db, 'conversations', conversationId);
  await updateDoc(convoRef, {
    lastMessage: text,
    lastMessageAt: Timestamp.now(),
  });
}

/**
 * Mark messages as read in a conversation for a given user.
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    where('read', '==', false),
    where('senderId', '!=', userId)
  );
  
  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map(docSnap =>
    updateDoc(doc(db, 'conversations', conversationId, 'messages', docSnap.id), { read: true })
  );
  await Promise.all(updates);
}
