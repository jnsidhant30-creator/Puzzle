import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { BattleData } from './types';
import { calculateXp, getLevelFromXp } from './xp';
import { checkAchievements } from './achievements';
import { advanceTournamentMatch } from './tournaments';

const db = admin.firestore();

const getPlayerProfile = async (uid: string) => {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) throw new functions.https.HttpsError('not-found', 'User not found');
  const data = doc.data()!;
  return {
    uid,
    displayName: data.displayName || data.username,
    avatarUrl: data.avatarUrl || null,
    ready: false,
    score: 0,
    progress: 0,
  };
};

export const quickMatchBattle = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated');
  const uid = context.auth.uid;
  const { gameType, difficulty } = data;

  // 1. Find a waiting battle
  let query = db.collection('battles')
    .where('status', '==', 'waiting')
    .where('isFriendBattle', '==', false);
    
  if (gameType) query = query.where('gameType', '==', gameType);
  if (difficulty) query = query.where('difficulty', '==', difficulty);

  const snapshot = await query.orderBy('createdAt', 'asc').limit(5).get();
  
  const waitingDocs = snapshot.docs.filter(d => d.data().playerA.uid !== uid); // don't match self

  if (waitingDocs.length > 0) {
    for (const doc of waitingDocs) {
      try {
        const result = await db.runTransaction(async (t) => {
          const bDoc = await t.get(doc.ref);
          const bData = bDoc.data() as BattleData;
          if (bData.status === 'waiting' && !bData.playerB && bData.playerA.uid !== uid) {
            const playerB = await getPlayerProfile(uid);
            t.update(doc.ref, {
              status: 'matched',
              playerB,
              matchedAt: admin.firestore.FieldValue.serverTimestamp(),
              puzzleSeed: Math.floor(Math.random() * 1000000000),
              version: admin.firestore.FieldValue.increment(1)
            });
            return { id: doc.id };
          }
          throw new Error('Occupied');
        });
        return { success: true, battleId: result.id };
      } catch (e) {
        // Continue to next
      }
    }
  }

  // 2. Create new waiting battle
  const playerA = await getPlayerProfile(uid);
  const selectedType = gameType || 'NUMBER';
  const selectedDiff = difficulty || 'EASY';

  const newBattleRef = db.collection('battles').doc();
  const newBattle: BattleData = {
    status: 'waiting',
    gameType: selectedType,
    difficulty: selectedDiff,
    isFriendBattle: false,
    playerA,
    playerB: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
    version: 1
  };

  await newBattleRef.set(newBattle);
  return { success: true, battleId: newBattleRef.id };
});

export const cancelMatchmaking = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated');
  const uid = context.auth.uid;
  const { battleId } = data;
  
  await db.runTransaction(async (t) => {
    const docRef = db.collection('battles').doc(battleId);
    const doc = await t.get(docRef);
    if (!doc.exists) return;
    const bData = doc.data() as BattleData;
    if (bData.playerA.uid === uid && bData.status === 'waiting') {
      t.update(docRef, { status: 'cancelled' });
    }
  });
  return { success: true };
});

export const challengeFriendBattle = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated');
  const uid = context.auth.uid;
  const { targetUid, gameType, difficulty } = data;

  const playerA = await getPlayerProfile(uid);
  const newBattleRef = db.collection('battles').doc();
  const newBattle: BattleData = {
    status: 'waiting',
    gameType: gameType || 'NUMBER',
    difficulty: difficulty || 'EASY',
    isFriendBattle: true,
    playerA,
    playerB: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 60 * 60 * 1000),
    version: 1
  };

  await newBattleRef.set(newBattle);

  const notifRef = db.collection('notifications').doc();
  await notifRef.set({
    id: notifRef.id,
    userId: targetUid,
    title: 'New Battle Challenge',
    message: `${playerA.displayName} challenged you to a ${newBattle.gameType} battle!`,
    type: 'BATTLE_CHALLENGE',
    isRead: false,
    metadata: { battleId: newBattleRef.id, challengerId: uid },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, battleId: newBattleRef.id };
});

export const acceptFriendBattle = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated');
  const uid = context.auth.uid;
  const { battleId } = data;

  await db.runTransaction(async (t) => {
    const docRef = db.collection('battles').doc(battleId);
    const doc = await t.get(docRef);
    if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Battle not found');
    const bData = doc.data() as BattleData;
    
    if (bData.status !== 'waiting' || !bData.isFriendBattle) {
      throw new functions.https.HttpsError('failed-precondition', 'Battle is no longer available');
    }

    const playerB = await getPlayerProfile(uid);
    t.update(docRef, {
      status: 'matched',
      playerB,
      matchedAt: admin.firestore.FieldValue.serverTimestamp(),
      puzzleSeed: Math.floor(Math.random() * 1000000000),
      version: admin.firestore.FieldValue.increment(1)
    });
  });

  return { success: true };
});

export const setBattleReady = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated');
  const uid = context.auth.uid;
  const { battleId } = data;

  await db.runTransaction(async (t) => {
    const docRef = db.collection('battles').doc(battleId);
    const doc = await t.get(docRef);
    if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Battle not found');
    const bData = doc.data() as BattleData;

    if (bData.status !== 'matched' && bData.status !== 'countdown') {
       throw new functions.https.HttpsError('failed-precondition', 'Cannot ready up in this state');
    }

    const isPlayerA = bData.playerA.uid === uid;
    const isPlayerB = bData.playerB?.uid === uid;
    if (!isPlayerA && !isPlayerB) throw new functions.https.HttpsError('permission-denied', 'Not a participant');

    const update: any = {};
    if (isPlayerA) update['playerA.ready'] = true;
    if (isPlayerB) update['playerB.ready'] = true;

    const A_ready = isPlayerA ? true : bData.playerA.ready;
    const B_ready = isPlayerB ? true : (bData.playerB?.ready || false);

    if (A_ready && B_ready && bData.status === 'matched') {
      update.status = 'countdown';
      update.startedAt = admin.firestore.Timestamp.fromMillis(Date.now() + 4000);
    }
    
    update.version = admin.firestore.FieldValue.increment(1);
    t.update(docRef, update);
  });
  return { success: true };
});

export const submitBattleResult = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated');
  const uid = context.auth.uid;
  const { battleId, score, timeTaken, progress, correctAnswers } = data;

  await db.runTransaction(async (t) => {
    const docRef = db.collection('battles').doc(battleId);
    const doc = await t.get(docRef);
    if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Battle not found');
    const bData = doc.data() as BattleData;

    if (bData.status !== 'countdown' && bData.status !== 'active') {
       // Already completed or expired
       return;
    }

    const isPlayerA = bData.playerA.uid === uid;
    const isPlayerB = bData.playerB?.uid === uid;
    if (!isPlayerA && !isPlayerB) throw new functions.https.HttpsError('permission-denied', 'Not a participant');

    const completionTime = admin.firestore.FieldValue.serverTimestamp();
    const update: any = {};

    if (isPlayerA) {
      update['playerA.completedAt'] = completionTime;
      update['playerA.score'] = score;
      update['playerA.timeTaken'] = timeTaken;
      update['playerA.progress'] = progress;
      update['playerA.correctAnswers'] = correctAnswers;
    } else if (isPlayerB && bData.playerB) {
      update['playerB.completedAt'] = completionTime;
      update['playerB.score'] = score;
      update['playerB.timeTaken'] = timeTaken;
      update['playerB.progress'] = progress;
      update['playerB.correctAnswers'] = correctAnswers;
    }

    // Determine Winner if both are done
    const pA_score = isPlayerA ? score : (bData.playerA as any).score || 0;
    const pB_score = isPlayerB ? score : (bData.playerB as any).score || 0;
    const pA_time = isPlayerA ? timeTaken : (bData.playerA as any).timeTaken || 0;
    const pB_time = isPlayerB ? timeTaken : (bData.playerB as any).timeTaken || 0;
    const pA_done = isPlayerA ? true : !!(bData.playerA as any).completedAt;
    const pB_done = isPlayerB ? true : !!(bData.playerB as any).completedAt;

    if (pA_done && pB_done) {
      update.status = 'completed';

      let aResult = 'DRAW';
      let bResult = 'DRAW';
      
      if (pA_score > pB_score) {
        aResult = 'VICTORY'; bResult = 'DEFEAT';
      } else if (pB_score > pA_score) {
        aResult = 'DEFEAT'; bResult = 'VICTORY';
      } else {
        if (pA_time < pB_time) {
          aResult = 'VICTORY'; bResult = 'DEFEAT';
        } else if (pB_time < pA_time) {
          aResult = 'DEFEAT'; bResult = 'VICTORY';
        }
      }

      update['playerA.result'] = aResult;
      update['playerB.result'] = bResult;

      const grantBattleRewards = async (pUid: string, res: string, finalScore: number, finalCorrect: number) => {
        const uRef = db.collection('users').doc(pUid);
        const uDoc = await t.get(uRef);
        if (!uDoc.exists) return;
        const uProfile = uDoc.data()!;
        
        const isWin = res === 'VICTORY';
        const baseXp = calculateXp(bData.difficulty, finalCorrect, true, false);
        const winBonus = isWin ? 50 : (res === 'DRAW' ? 10 : 0);
        const totalXpEarned = baseXp + winBonus;

        let newXp = (uProfile.xp || 0) + totalXpEarned;
        
        const battleStats = uProfile.battleStats || { wins: 0, losses: 0, draws: 0, played: 0, winStreak: 0, totalXp: 0 };
        battleStats.played += 1;
        battleStats.totalXp += totalXpEarned;
        if (isWin) {
          battleStats.wins += 1;
          battleStats.winStreak += 1;
        } else if (res === 'DEFEAT') {
          battleStats.losses += 1;
          battleStats.winStreak = 0;
        } else {
          battleStats.draws += 1;
          battleStats.winStreak = 0;
        }

        const playedTypes = new Set([bData.gameType]);
        const wonTypes = isWin ? new Set([bData.gameType]) : new Set<string>();
        
        const newlyUnlocked = await checkAchievements(pUid, { ...uProfile, xp: newXp, level: getLevelFromXp(newXp) } as any, { status: 'COMPLETED', accuracy: 100, hintsUsed: 0 }, playedTypes, wonTypes);
        let achXp = 0;
        for (const ach of newlyUnlocked) {
           const uAchRef = db.collection('userAchievements').doc(`${pUid}_${ach.id}`);
           t.set(uAchRef, {
             id: `${pUid}_${ach.id}`, userId: pUid, achievementId: ach.id, progress: ach.requirementValue, unlocked: true, unlockedAt: admin.firestore.FieldValue.serverTimestamp()
           }, { merge: true });
           achXp += ach.xpReward;
        }
        newXp += achXp;
        const newLevel = getLevelFromXp(newXp);

        t.update(uRef, {
           xp: newXp,
           level: newLevel,
           battleStats,
           updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      };

      await grantBattleRewards(bData.playerA.uid, aResult, pA_score, isPlayerA ? correctAnswers : (bData.playerA as any).correctAnswers || 0);
      await grantBattleRewards(bData.playerB!.uid, bResult, pB_score, isPlayerB ? correctAnswers : (bData.playerB as any).correctAnswers || 0);

      if (bData.tournamentId && bData.tournamentMatchId) {
        let winnerUid = aResult === 'VICTORY' ? bData.playerA.uid : bData.playerB!.uid;
        if (aResult === 'DRAW') {
           // Break ties randomly or based on UID
           winnerUid = Math.random() > 0.5 ? bData.playerA.uid : bData.playerB!.uid;
        }
        await advanceTournamentMatch(bData.tournamentId, bData.tournamentMatchId, winnerUid, t);
      }
    }

    update.version = admin.firestore.FieldValue.increment(1);
    t.update(docRef, update);
  });

  return { success: true };
});

export const forceBattleStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated');
  const uid = context.auth.uid;
  const { battleId, action } = data;

  await db.runTransaction(async (t) => {
    const docRef = db.collection('battles').doc(battleId);
    const doc = await t.get(docRef);
    if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Battle not found');
    const bData = doc.data() as BattleData;

    const isPlayerA = bData.playerA.uid === uid;
    const isPlayerB = bData.playerB?.uid === uid;
    if (!isPlayerA && !isPlayerB) throw new functions.https.HttpsError('permission-denied', 'Not a participant');

    if (action === 'active' && bData.status === 'countdown') {
       t.update(docRef, { status: 'active', version: admin.firestore.FieldValue.increment(1) });
    }
    
    if (action === 'forfeit' && bData.status === 'active') {
       const update: any = { status: 'completed', version: admin.firestore.FieldValue.increment(1) };
       update['playerA.result'] = isPlayerA ? 'DEFEAT' : 'VICTORY';
       update['playerB.result'] = isPlayerB ? 'DEFEAT' : 'VICTORY';
       
       if (isPlayerA) update['playerA.completedAt'] = admin.firestore.FieldValue.serverTimestamp();
       if (isPlayerB && bData.playerB) update['playerB.completedAt'] = admin.firestore.FieldValue.serverTimestamp();
       
       if (bData.tournamentId && bData.tournamentMatchId) {
         const winnerUid = isPlayerA ? bData.playerB!.uid : bData.playerA.uid;
         await advanceTournamentMatch(bData.tournamentId, bData.tournamentMatchId, winnerUid, t);
       }

       t.update(docRef, update);
    }
  });
  return { success: true };
});
