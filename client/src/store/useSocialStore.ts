import { create } from 'zustand';
import { collection, query, or, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FriendRequest, PublicProfile } from '../services/socialService';
import { getPublicProfiles } from '../services/socialService';

interface SocialState {
  requests: FriendRequest[];
  friendsProfiles: Record<string, PublicProfile>;
  loading: boolean;
  initSocialListener: (uid: string) => (() => void);
  clearSocial: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  requests: [],
  friendsProfiles: {},
  loading: true,
  initSocialListener: (uid: string) => {
    const q = query(
      collection(db, 'friendRequests'),
      or(where('senderId', '==', uid), where('receiverId', '==', uid))
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const requests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
      
      // Determine which profiles we need to fetch
      const currentProfiles = get().friendsProfiles;
      const neededUids = new Set<string>();
      
      requests.forEach(req => {
        const otherId = req.senderId === uid ? req.receiverId : req.senderId;
        if (!currentProfiles[otherId]) {
          neededUids.add(otherId);
        }
      });

      let newProfiles = { ...currentProfiles };
      if (neededUids.size > 0) {
        const fetched = await getPublicProfiles(Array.from(neededUids));
        fetched.forEach(p => {
          newProfiles[p.uid] = p;
        });
      }

      set({ requests, friendsProfiles: newProfiles, loading: false });
    }, (error) => {
      console.error("[useSocialStore] Error listening to friend requests:", error);
      set({ loading: false });
    });

    return unsubscribe;
  },
  clearSocial: () => set({ requests: [], friendsProfiles: {}, loading: false })
}));
