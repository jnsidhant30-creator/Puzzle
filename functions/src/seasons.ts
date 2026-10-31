import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { SeasonStatus, Season } from './types';

const db = admin.firestore();

// ---------------------------------------------------------------------------
// ADMIN: SEASONS
// ---------------------------------------------------------------------------

export const adminCreateSeason = functions.https.onCall(async (data: { name: string, description: string, startAt: string, endAt: string, rewards?: any, theme?: string }, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  
  const userRef = db.collection('users').doc(context.auth.uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create seasons.');
  }

  const newSeason: Season = {
    name: data.name,
    description: data.description,
    theme: data.theme || 'default',
    startAt: new Date(data.startAt),
    endAt: new Date(data.endAt),
    status: 'upcoming',
    rewards: data.rewards || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('seasons').add(newSeason);
  return { id: docRef.id, ...newSeason };
});

export const adminUpdateSeasonStatus = functions.https.onCall(async (data: { seasonId: string, status: SeasonStatus }, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  
  const userRef = db.collection('users').doc(context.auth.uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can manage seasons.');
  }

  const { seasonId, status } = data;
  const seasonRef = db.collection('seasons').doc(seasonId);

  await db.runTransaction(async (transaction) => {
    const seasonDoc = await transaction.get(seasonRef);
    if (!seasonDoc.exists) throw new functions.https.HttpsError('not-found', 'Season not found.');

    const seasonData = seasonDoc.data() as Season;

    // If active, ensure no other season is active
    if (status === 'active' && seasonData.status !== 'active') {
      const activeSnaps = await transaction.get(db.collection('seasons').where('status', '==', 'active'));
      activeSnaps.forEach(doc => {
        if (doc.id !== seasonId) {
          transaction.update(doc.ref, { status: 'completed', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
      });
    }

    transaction.update(seasonRef, {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  return { success: true };
});

// ---------------------------------------------------------------------------
// TITLES: EQUIP TITLE
// ---------------------------------------------------------------------------

export const setActiveTitle = functions.https.onCall(async (data: { titleId: string | null }, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  
  const { titleId } = data;
  const userId = context.auth.uid;
  
  const userRef = db.collection('users').doc(userId);
  
  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new functions.https.HttpsError('not-found', 'User not found.');
    
    const profile = userDoc.data()!;
    const unlockedTitles = profile.unlockedTitles || [];
    
    if (titleId !== null && !unlockedTitles.includes(titleId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Title not unlocked.');
    }
    
    transaction.update(userRef, {
      activeTitleId: titleId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  return { success: true };
});
