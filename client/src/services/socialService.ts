import { collection, doc, getDocs, query, where, setDoc, deleteDoc, updateDoc, serverTimestamp, orderBy, limit, or, and } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createNotification } from './notificationService';
import type { UserProfile } from './authService';

export interface PublicProfile {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted';
  createdAt: any;
  updatedAt: any;
}

export const searchUsers = async (searchTerm: string, limitCount = 10): Promise<PublicProfile[]> => {
  if (!searchTerm || searchTerm.length < 3) return [];
  
  // We'll do a simple prefix search on username. Note: Firestore requires uppercase/lowercase exact match or range queries.
  // For robust search without full text search, we do a range query on username.
  const term = searchTerm.toLowerCase();
  
  try {
    const q = query(
      collection(db, 'publicProfiles'),
      where('username', '>=', term),
      where('username', '<=', term + '\uf8ff'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as PublicProfile);
  } catch (err) {
    console.error("Failed to search users:", err);
    return [];
  }
};

export const sendFriendRequest = async (senderProfile: UserProfile, receiverId: string) => {
  if (senderProfile.uid === receiverId) throw new Error("Cannot send friend request to yourself.");
  
  // Check if request already exists
  const existingReqs = await getDocs(query(
    collection(db, 'friendRequests'),
    or(
      and(where('senderId', '==', senderProfile.uid), where('receiverId', '==', receiverId)),
      and(where('senderId', '==', receiverId), where('receiverId', '==', senderProfile.uid))
    )
  ));

  if (!existingReqs.empty) {
    throw new Error("Friend request already exists.");
  }

  const requestId = senderProfile.uid < receiverId ? `${senderProfile.uid}_${receiverId}` : `${receiverId}_${senderProfile.uid}`;
  const reqRef = doc(db, 'friendRequests', requestId);
  
  await setDoc(reqRef, {
    senderId: senderProfile.uid,
    receiverId,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Create notification for receiver
  await createNotification(
    receiverId,
    'New Friend Request',
    `${senderProfile.displayName} sent you a friend request.`,
    'SYSTEM',
    { senderId: senderProfile.uid, type: 'FRIEND_REQUEST' }
  );
};

export const acceptFriendRequest = async (requestId: string, receiverProfile: UserProfile, senderId: string) => {
  const reqRef = doc(db, 'friendRequests', requestId);
  await updateDoc(reqRef, {
    status: 'accepted',
    updatedAt: serverTimestamp()
  });

  // Notify sender
  await createNotification(
    senderId,
    'Friend Request Accepted',
    `${receiverProfile.displayName} accepted your friend request!`,
    'SYSTEM',
    { senderId: receiverProfile.uid, type: 'FRIEND_ACCEPTED' }
  );
};

export const declineFriendRequest = async (requestId: string) => {
  // We simply delete the request to keep the db clean and allow future requests
  const reqRef = doc(db, 'friendRequests', requestId);
  await deleteDoc(reqRef);
};

export const removeFriend = async (requestId: string) => {
  const reqRef = doc(db, 'friendRequests', requestId);
  await deleteDoc(reqRef);
};

export const getFriendRequests = async (uid: string): Promise<FriendRequest[]> => {
  try {
    const q = query(
      collection(db, 'friendRequests'),
      or(where('senderId', '==', uid), where('receiverId', '==', uid))
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
  } catch (err) {
    console.error("Failed to fetch friend requests:", err);
    return [];
  }
};

export const getPublicProfiles = async (uids: string[]): Promise<PublicProfile[]> => {
  if (!uids.length) return [];
  try {
    // Firestore in query limit is 30
    const chunks = [];
    for (let i = 0; i < uids.length; i += 30) {
      chunks.push(uids.slice(i, i + 30));
    }
    
    let profiles: PublicProfile[] = [];
    for (const chunk of chunks) {
      const q = query(collection(db, 'publicProfiles'), where('uid', 'in', chunk));
      const snap = await getDocs(q);
      profiles = [...profiles, ...snap.docs.map(doc => doc.data() as PublicProfile)];
    }
    return profiles;
  } catch (err) {
    console.error("Failed to fetch public profiles:", err);
    return [];
  }
};

export const getFriendActivity = async (friendIds: string[], limitCount = 20): Promise<any[]> => {
  if (!friendIds.length) return [];
  try {
    // Limit to 30 friends for activity query
    const targetIds = friendIds.slice(0, 30);
    const q = query(
      collection(db, 'gameSessions'),
      where('userId', 'in', targetIds),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Failed to fetch friend activity:", err);
    return [];
  }
};

export const getFriendLeaderboard = async (friendIds: string[], weeklyChallengeId: string): Promise<any[]> => {
  if (!friendIds.length) return [];
  try {
    const targetIds = friendIds.slice(0, 30);
    const q = query(
      collection(db, 'leaderboards'),
      where('periodKey', '==', weeklyChallengeId),
      where('userId', 'in', targetIds),
      orderBy('score', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Failed to fetch friend leaderboard:", err);
    return [];
  }
};
