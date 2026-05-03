import {
  collection, doc, addDoc, query, where, onSnapshot,
  updateDoc, getDocs, limit, Timestamp
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
  const newConvo: Partial<ConversationData> = {
    participants: [params.buyerId, params.sellerId],
    buyerId: params.buyerId,
    sellerId: params.sellerId,
    buyerName: params.buyerName,
    sellerName: params.sellerName,
    buyerCompany: params.buyerCompany,
    sellerCompany: params.sellerCompany,
    lastMessage: '',
    lastMessageAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  };

  if (params.vehicleId) newConvo.vehicleId = params.vehicleId;
  if (params.vehicleInfo) newConvo.vehicleInfo = params.vehicleInfo;

  const docRef = await addDoc(conversationsRef, newConvo);
  return docRef.id;
}

/**
 * Subscribe to conversations for a given user.
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: (ConversationData & { id: string })[]) => void,
  onError?: (error: any) => void
) {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
    // Removed orderBy('lastMessageAt', 'desc') to avoid requiring a composite index in Firestore
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as ConversationData,
    }));
    
    // Sort on client side to avoid composite index requirement
    conversations.sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis() || 0;
      const timeB = b.lastMessageAt?.toMillis() || 0;
      return timeB - timeA; // Descending
    });
    
    callback(conversations);
  }, (error) => {
    console.error("Error subscribing to conversations:", error);
    if (onError) onError(error);
    else callback([]);
  });
}

/**
 * Subscribe to messages in a conversation.
 * Sorting is done client-side to avoid composite index requirements.
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: (MessageData & { id: string })[]) => void,
  onError?: (error: Error) => void,
) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, limit(200));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as MessageData,
    }));
    messages.sort((a, b) => {
      const tA = a.createdAt?.toMillis?.() ?? 0;
      const tB = b.createdAt?.toMillis?.() ?? 0;
      return tA - tB;
    });
    callback(messages);
  }, (error) => {
    console.error('Error subscribing to messages:', error);
    if (onError) onError(error);
    else callback([]);
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

  // Update conversation's last message and unread status
  const convoRef = doc(db, 'conversations', conversationId);
  const convoSnap = await getDoc(convoRef);
  const convoData = convoSnap.data();
  const recipientId = convoData?.participants.find((p: string) => p !== senderId);

  await updateDoc(convoRef, {
    lastMessage: text,
    lastMessageAt: Timestamp.now(),
    unreadBy: [recipientId] // Mark as unread for the recipient
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

  // Clear unreadBy for this user in the conversation doc
  const convoRef = doc(db, 'conversations', conversationId);
  const convoSnap = await getDoc(convoRef);
  if (convoSnap.exists()) {
    const unreadBy = convoSnap.data().unreadBy || [];
    if (unreadBy.includes(userId)) {
      await updateDoc(convoRef, {
        unreadBy: unreadBy.filter((id: string) => id !== userId)
      });
    }
  }
}

/**
 * Subscribe to the total unread message count for a user.
 */
export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
) {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, async (snapshot) => {
    let totals = 0;
    // Note: In a production app, it's better to store unread count in the conversation doc 
    // or use a separate counter to avoid nested subscriptions here.
    // For now, we'll sum up conversations where the user has messages to read.
    // However, the conversation doc doesn't have an unread count per user yet.
    // Let's assume we add an 'unreadBy' array to the conversation doc.
    
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data.unreadBy && data.unreadBy.includes(userId)) {
        totals += 1;
      }
    });
    callback(totals);
  });
}
