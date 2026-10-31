import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { GameResultPayload } from './types';
import { calculateAggregateScore, calculateAccuracy } from './scoring';
import { calculateXp, getLevelFromXp } from './xp';
import { checkAchievements } from './achievements';
import { checkUnlocks } from './rewards';
import { getActiveMissions, evaluateMissions, getDailyPeriod, getWeeklyPeriod } from './missions';
import { PlayerMissionProgress } from './types';

admin.initializeApp();
const db = admin.firestore();

export const submitGameResult = functions.https.onCall(async (data: GameResultPayload, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const userId = context.auth.uid;

  // 2. Input Validation
  const {
    sessionId, puzzleId, puzzleType, difficulty, status,
    correctAnswers, incorrectAnswers, totalQuestions,
    hintsUsed, timeRemaining, initialTimeLimit, moves,
    isDailyPuzzle, dailyPuzzleDate,
    isWeeklyChallenge, weeklyChallengeId
  } = data;

  if (!sessionId || !puzzleType || !difficulty || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  }

  const validTypes = ['NUMBER', 'WORD', 'MEMORY', 'SLIDING', 'LOGIC', 'PATTERN'];
  if (!validTypes.includes(puzzleType)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid puzzle type.');
  }

  const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
  if (!validDifficulties.includes(difficulty)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid difficulty.');
  }

  if (
    correctAnswers < 0 || incorrectAnswers < 0 || hintsUsed < 0 ||
    timeRemaining < 0 || initialTimeLimit <= 0 || (moves !== undefined && moves < 0)
  ) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid negative or zero values.');
  }

  if (correctAnswers + incorrectAnswers > totalQuestions) {
    throw new functions.https.HttpsError('invalid-argument', 'Answers exceed total questions.');
  }

  const timeTaken = initialTimeLimit - timeRemaining;
  if (timeTaken < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid time taken.');
  }

  const isCompleted = status === 'COMPLETED';
  const accuracy = calculateAccuracy(correctAnswers, totalQuestions);

  // Calculate Trusted Score & XP
  const finalScore = calculateAggregateScore(difficulty, correctAnswers, timeTaken, initialTimeLimit, hintsUsed);
  const xpEarned = calculateXp(difficulty, correctAnswers, isCompleted, !!isDailyPuzzle);

  return await db.runTransaction(async (transaction) => {
    const sessionRef = db.collection('gameSessions').doc(sessionId);
    const sessionDoc = await transaction.get(sessionRef);

    // 3. Duplicate Prevention
    if (sessionDoc.exists) {
      console.warn(`Duplicate submission for session ${sessionId}`);
      return sessionDoc.data();
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }

    // 3.5. Weekly Challenge Duplicate Completion Prevention
    if (isWeeklyChallenge && weeklyChallengeId && isCompleted) {
      const existingWeeklySnap = await transaction.get(
        db.collection('gameSessions')
          .where('userId', '==', userId)
          .where('isWeeklyChallenge', '==', true)
          .where('weeklyChallengeId', '==', weeklyChallengeId)
          .where('status', '==', 'COMPLETED')
          .limit(1)
      );
      if (!existingWeeklySnap.empty) {
        throw new functions.https.HttpsError('already-exists', 'User has already completed this weekly challenge.');
      }
    }

    const profile = userDoc.data()!;
    const oldXp = profile.xp || 0;
    const oldLevel = profile.level || 1;
    let newXp = oldXp + xpEarned;
    const isWin = isCompleted;
    const newTotalGames = (profile.totalGames || 0) + 1;
    const newTotalWins = (profile.totalWins || 0) + (isWin ? 1 : 0);

    const newBestScore = Math.max(profile.bestScore || 0, finalScore);
    let newBestTime = profile.bestTime;
    if (isWin) {
      if (!newBestTime || newBestTime === 0 || timeTaken < newBestTime) {
        newBestTime = timeTaken;
      }
    }

    // Streak Logic
    let currentStreak = profile.currentStreak || 0;
    let longestStreak = profile.longestStreak || 0;
    const lastActivityDate = profile.updatedAt ? profile.updatedAt.toDate() : null;
    const today = new Date();

    if (!lastActivityDate) {
      currentStreak = 1;
    } else {
      const lastDate = new Date(Date.UTC(lastActivityDate.getUTCFullYear(), lastActivityDate.getUTCMonth(), lastActivityDate.getUTCDate()));
      const currentDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Achievements (We query 100 recent sessions to get played/won types, outside transaction to avoid limits, but we can do it inside)
    // Actually, querying inside a transaction must happen before any writes.
    const sessionsSnap = await transaction.get(db.collection('gameSessions').where('userId', '==', userId).limit(100));
    const playedTypes = new Set<string>();
    const wonTypes = new Set<string>();
    playedTypes.add(puzzleType);
    if (isWin) wonTypes.add(puzzleType);

    sessionsSnap.forEach((doc) => {
      const d = doc.data();
      playedTypes.add(d.puzzleType);
      if (d.status === 'COMPLETED') wonTypes.add(d.puzzleType);
    });

    const tempProfile = { ...profile, xp: newXp, level: getLevelFromXp(newXp), totalGames: newTotalGames, totalWins: newTotalWins, currentStreak, longestStreak };
    
    // We can't await checkAchievements easily inside transaction if it reads, but we can pre-fetch them, or just use the transaction to get them.
    // To simplify and follow Firebase limits, we'll let checkAchievements do its reads using the admin SDK outside the transaction (but wait, we're inside the transaction).
    // Let's pass the db to checkAchievements if we wanted, but we can just do reads normally. Non-transactional reads inside a transaction are okay in the Admin SDK if they don't need to be strictly isolated for the write.
    
    let achievementXp = 0;
    const newlyUnlocked = await checkAchievements(userId, tempProfile, { status, accuracy, hintsUsed }, playedTypes, wonTypes);
    
    // Phase 62: Missions
    const activeMissions = getActiveMissions();
    const currentProgressMap = new Map<string, PlayerMissionProgress>();
    
    // Fetch user's current progress for active missions
    const dailyPeriod = getDailyPeriod();
    const weeklyPeriod = getWeeklyPeriod();
    const missionIds = activeMissions.map(m => m.id);
    
    // Get existing mission progress
    const missionsSnap = await transaction.get(db.collection('userMissions').where('userId', '==', userId).where('period', 'in', [dailyPeriod, weeklyPeriod]));
    missionsSnap.forEach(doc => {
      const data = doc.data() as PlayerMissionProgress;
      if (missionIds.includes(data.missionId)) {
        currentProgressMap.set(`${data.period}_${data.missionId}`, data);
      }
    });

    const missionResults = evaluateMissions(userId, data, xpEarned, playedTypes, activeMissions, currentProgressMap);
    let missionXp = 0;
    const updatedMissions = Array.from(currentProgressMap.values());
    
    for (const res of missionResults) {
      if (res.completed) {
        missionXp += res.xpEarned;
      }
    }
    
    for (const ach of newlyUnlocked) {
      const userAchId = `${userId}_${ach.id}`;
      const userAchRef = db.collection('userAchievements').doc(userAchId);
      transaction.set(userAchRef, {
        id: userAchId,
        userId,
        achievementId: ach.id,
        progress: ach.requirementValue,
        unlocked: true,
        unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      achievementXp += ach.xpReward;
    }

    // Phase 60: Titles & Badges
    const existingTitles = profile.unlockedTitles || [];
    const existingBadges = profile.unlockedBadges || [];
    const { newTitles, newBadges } = checkUnlocks(
      tempProfile,
      { status, difficulty, isWeeklyChallenge, timeTaken },
      playedTypes,
      wonTypes,
      existingTitles,
      existingBadges
    );

    // Phase 61: Seasons
    const seasonsSnap = await db.collection('seasons').where('status', '==', 'active').limit(1).get();
    let activeSeasonId: string | null = null;
    let seasonScoreEarned = 0;
    if (!seasonsSnap.empty) {
      activeSeasonId = seasonsSnap.docs[0].id;
      seasonScoreEarned = xpEarned + achievementXp + missionXp; // Basic multiplier can be added later
    }

    newXp += achievementXp + missionXp;
    const newLevel = getLevelFromXp(newXp);

    // Database Writes
    const resultData = {
      userId,
      puzzleId: puzzleId || null,
      puzzleType,
      difficulty,
      status,
      score: finalScore,
      xpEarned: xpEarned + achievementXp + missionXp,
      correctAnswers,
      incorrectAnswers,
      totalQuestions,
      accuracy,
      hintsUsed,
      moves: moves ?? null,
      timeTaken,
      isDailyPuzzle: isDailyPuzzle || false,
      dailyPuzzleDate: dailyPuzzleDate || null,
      isWeeklyChallenge: isWeeklyChallenge || false,
      weeklyChallengeId: weeklyChallengeId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    transaction.set(sessionRef, resultData);

    const userUpdatePayload: any = {
      xp: newXp,
      level: newLevel,
      totalGames: newTotalGames,
      totalWins: newTotalWins,
      bestScore: newBestScore,
      bestTime: newBestTime,
      currentStreak,
      longestStreak,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (newTitles.length > 0) {
      userUpdatePayload.unlockedTitles = admin.firestore.FieldValue.arrayUnion(...newTitles);
    }
    if (newBadges.length > 0) {
      userUpdatePayload.unlockedBadges = admin.firestore.FieldValue.arrayUnion(...newBadges);
    }
    transaction.update(userRef, userUpdatePayload);

    // Write updated mission progress
    for (const missionProg of updatedMissions) {
      const docRef = db.collection('userMissions').doc(`${userId}_${missionProg.period}_${missionProg.missionId}`);
      transaction.set(docRef, {
        userId,
        ...missionProg,
      }, { merge: true });
    }

    if (activeSeasonId && seasonScoreEarned > 0) {
      const seasonLeaderboardRef = db.collection('seasonLeaderboards').doc(activeSeasonId).collection('players').doc(userId);
      // Because we want to increment score safely inside transaction, we need to read it first or just use increment.
      transaction.set(seasonLeaderboardRef, {
        userId,
        seasonId: activeSeasonId,
        score: admin.firestore.FieldValue.increment(seasonScoreEarned),
        displayName: profile.displayName || '',
        avatarUrl: profile.avatarUrl || null,
        activeTitleId: profile.activeTitleId || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // We can also update leaderboard records directly here, but for simplicity, 
    // leaderboards can aggregate from these trusted values or we can write to a `leaderboards` collection.
    // The requirement says: "Use the processed game result to update leaderboard data."
    // Let's write to the GLOBAL leaderboard for this user.
    const globalLeaderboardRef = db.collection('leaderboards').doc(`${userId}_GLOBAL`);
    transaction.set(globalLeaderboardRef, {
      userId,
      username: profile.username || '',
      displayName: profile.displayName || '',
      avatarUrl: profile.avatarUrl || null,
      score: newBestScore,
      level: newLevel,
      bestTime: newBestTime,
      puzzleType: 'ALL',
      difficulty: 'ALL',
      period: 'GLOBAL',
      periodKey: 'GLOBAL',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Update Weekly Leaderboard if applicable
    if (isWeeklyChallenge && weeklyChallengeId && isCompleted) {
      const weeklyLeaderboardRef = db.collection('leaderboards').doc(`${userId}_WEEKLY_${weeklyChallengeId}`);
      transaction.set(weeklyLeaderboardRef, {
        userId,
        username: profile.username || '',
        displayName: profile.displayName || '',
        avatarUrl: profile.avatarUrl || null,
        score: finalScore,
        level: newLevel,
        bestTime: timeTaken,
        puzzleType,
        difficulty,
        period: 'WEEKLY',
        periodKey: weeklyChallengeId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    return {
      ...resultData,
      sessionId,
      newXp,
      newLevel,
      oldXp,
      oldLevel,
      unlockedAchievements: newlyUnlocked
    };
  });
});

// ---------------------------------------------------------------------------
// NOTIFICATION TRIGGERS
// ---------------------------------------------------------------------------

export const onUserAchievementCreated = functions.firestore
  .document('userAchievements/{userAchievementId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.userId || !data.achievementId) return;

    // Get achievement details
    const achDoc = await db.collection('achievements').doc(data.achievementId).get();
    const achData = achDoc.data();
    if (!achData) return;

    const notificationId = `achieve_${data.userId}_${data.achievementId}`;
    const notificationRef = db.collection('notifications').doc(notificationId);

    await notificationRef.set({
      id: notificationId,
      userId: data.userId,
      title: 'Achievement Unlocked!',
      message: `You unlocked: ${achData.name}`,
      type: 'ACHIEVEMENT',
      isRead: false,
      metadata: { reward: `+${achData.xpReward} XP` },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

export const onUserUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) return;

    const batch = db.batch();
    let hasUpdates = false;

    // 1. Level Up
    if (after.level > before.level) {
      const id = `levelup_${userId}_${after.level}`;
      batch.set(db.collection('notifications').doc(id), {
        id,
        userId,
        title: 'LEVEL UP!',
        message: `You reached Level ${after.level}.`,
        type: 'LEVEL_UP',
        isRead: false,
        metadata: { reward: 'New level unlocked!' },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      hasUpdates = true;
    }

    // 2. Personal Best
    if (after.bestScore > (before.bestScore || 0)) {
      const id = `pb_${userId}_${after.bestScore}`;
      batch.set(db.collection('notifications').doc(id), {
        id,
        userId,
        title: 'NEW PERSONAL BEST!',
        message: `Score: ${after.bestScore} (Previous: ${before.bestScore || 0})`,
        type: 'PERSONAL_BEST',
        isRead: false,
        metadata: {},
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      hasUpdates = true;
    }

    // 3. Streak Milestones
    if (after.currentStreak > before.currentStreak && after.currentStreak > 1) {
      // Notify on every 7 days (or standard milestones)
      const milestone = [3, 7, 14, 30, 50, 100].includes(after.currentStreak) || (after.currentStreak % 7 === 0);
      if (milestone) {
        const id = `streak_${userId}_${after.currentStreak}`;
        batch.set(db.collection('notifications').doc(id), {
          id,
          userId,
          title: 'STREAK MILESTONE!',
          message: `You reached a ${after.currentStreak}-day streak. Keep going!`,
          type: 'STREAK',
          isRead: false,
          metadata: {},
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      await batch.commit();
    }
  });


export const claimDailyReward = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const userId = context.auth.uid;
  const today = new Date();
  const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;

  return await db.runTransaction(async (transaction) => {
    const rewardRef = db.collection('dailyRewards').doc(userId);
    const userRef = db.collection('users').doc(userId);

    const [rewardDoc, userDoc] = await Promise.all([
      transaction.get(rewardRef),
      transaction.get(userRef)
    ]);

    let streak = 0;
    if (rewardDoc.exists) {
      const rewardData = rewardDoc.data()!;
      if (rewardData.lastClaimDate === todayStr) {
        throw new functions.https.HttpsError('already-exists', 'Reward already claimed today.');
      }
      
      const lastDate = rewardData.lastClaimDate ? new Date(rewardData.lastClaimDate) : null;
      let diffDays = 2;
      if (lastDate) {
        lastDate.setHours(0, 0, 0, 0);
        const currentDate = new Date(todayStr);
        currentDate.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      if (diffDays === 1) {
        streak = rewardData.streak || 0;
      }
    }

    streak += 1;
    
    // Reward amounts (Day 1 to 7 cycle)
    const rewardAmounts = [50, 75, 100, 150, 200, 250, 500];
    const index = Math.max(0, (streak - 1) % 7);
    const coinsReward = rewardAmounts[index];
    const xpReward = rewardAmounts[index];

    // Update reward doc
    transaction.set(rewardRef, {
      lastClaimDate: todayStr,
      streak,
      lastClaimedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Grant rewards to user
    let newCoins = coinsReward;
    let newXp = xpReward;
    let newLevel = 1;
    let oldXp = 0;
    let oldLevel = 1;
    let newCurrentStreak = streak;
    let newLongestStreak = streak;

    if (userDoc.exists) {
      const userData = userDoc.data()!;
      oldXp = userData.xp || 0;
      oldLevel = userData.level || 1;
      newCoins += (userData.coins || 0);
      newXp += oldXp;
      newLevel = getLevelFromXp(newXp);
      newCurrentStreak = streak;
      newLongestStreak = Math.max(userData.longestStreak || 0, streak);
      
      transaction.update(userRef, {
        coins: newCoins,
        xp: newXp,
        level: newLevel,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      newLevel = getLevelFromXp(newXp);
    }

    // Trigger notification
    const notificationId = `reward_${userId}_${todayStr}`;
    transaction.set(db.collection('notifications').doc(notificationId), {
      id: notificationId,
      userId,
      title: 'Daily Reward Claimed',
      message: `You claimed your daily reward!`,
      type: 'DAILY_REWARD',
      isRead: false,
      metadata: { reward: `+${coinsReward} Coins, +${xpReward} XP` },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      coins: coinsReward, 
      xp: xpReward, 
      streak, 
      newXp, 
      newLevel, 
      oldXp, 
      oldLevel 
    };
  });
});

// ---------------------------------------------------------------------------
// BATTLES (PHASE 55)
// ---------------------------------------------------------------------------
export * from './battles';

// ---------------------------------------------------------------------------
// TOURNAMENTS (PHASE 56)
// ---------------------------------------------------------------------------
export * from './tournaments';

// ---------------------------------------------------------------------------
// COMMUNITY PUZZLES (PHASE 57)
// ---------------------------------------------------------------------------
export * from './community';

// ---------------------------------------------------------------------------
// SEASONS & TITLES (PHASE 60/61)
// ---------------------------------------------------------------------------
export * from './seasons';
