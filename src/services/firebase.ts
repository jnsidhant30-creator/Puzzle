import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, 
  onAuthStateChanged, setPersistence, browserLocalPersistence, User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, doc, getDoc, getDocFromServer, setDoc, updateDoc, collection, 
  query, where, getDocs, orderBy, limit, addDoc, runTransaction
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  UserProfile, GameSession, LeaderboardEntry, UserAchievement, DailyReward, FriendRequest, 
  FriendChallenge, CommunityPuzzle, NotificationItem, PersonalBestRecord, PersonalBestHistoryItem, 
  AdaptiveDifficultyProfile, Difficulty, PuzzleType, PuzzleEvent, UserEventProgress, 
  EventLeaderboardEntry, ChallengeItem, ChallengeStatus, PlayerGoalItem, GoalCategory, 
  ShowcaseConfig, PuzzleCollection, UserCollectionProgress, JourneyStage, JourneyChapter, 
  UserJourneyProgress, PuzzleGuide, UserMasteryProfile, UserPracticeProgress, Club, ClubMember, 
  ClubChatMessage, ClubCompetition, ClubCompetitionScore, ClubDuelChallenge, ClubEvent, 
  ClubEventParticipant, ClubMilestone, ClubRole, ClubDiscussion, ClubDiscussionReply, 
  ClubGuide, ClubDiscussionCategory, ClubGuideCategory, ContentReport, UserBlock, UserMute, 
  ModerationAction, PlayerWallPost, SocialFeedItem, HeadToHeadStats, KudosGift
} from '../types';
import { DEFAULT_JOURNEY_CHAPTERS } from '../data/journeyData';
import { DEFAULT_PUZZLE_GUIDES } from '../data/learnData';
import { calculateUserMasteryProfile } from '../data/masteryData';
import { 
  DEFAULT_CLUBS, DEFAULT_CLUB_MEMBERS, DEFAULT_CLUB_MESSAGES, DEFAULT_CLUB_COMPETITIONS, 
  DEFAULT_CLUB_SCORES, DEFAULT_CLUB_DUELS, DEFAULT_CLUB_EVENTS, DEFAULT_CLUB_MILESTONES, 
  DEFAULT_CLUB_DISCUSSIONS, DEFAULT_CLUB_REPLIES, DEFAULT_CLUB_GUIDES
} from '../data/clubData'; 
import { DEFAULT_ACHIEVEMENTS } from '../data/puzzles'; 

const getDynamicConfig = () => {
  const config = { ...firebaseConfig };
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('web.app') || host.endsWith('firebaseapp.com') || host.endsWith('netlify.app')) {
      config.authDomain = host;
    }
  }
  return config;
};

const app = !getApps().length ? initializeApp(getDynamicConfig()) : getApp(); 
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase setPersistence error:', err);
  });
}
export const googleProvider = new GoogleAuthProvider(); 

export enum OperationType { 
  CREATE = 'create', 
  UPDATE = 'update', 
  DELETE = 'delete', 
  LIST = 'list', 
  GET = 'get', 
  WRITE = 'write',
} export interface FirestoreErrorInfo { error: string; operationType: OperationType; path: string | null; authInfo: { userId?: string | null; email?: string | null; emailVerified?: boolean | null; };
} export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) { const errInfo: FirestoreErrorInfo = { error: error instanceof Error ? error.message : String(error), authInfo: { userId: auth.currentUser?.uid, email: auth.currentUser?.email, emailVerified: auth.currentUser?.emailVerified, }, operationType, path }; console.error('Firestore Error:', JSON.stringify(errInfo)); return errInfo;
} // Connection test
async function testConnection() { try { await getDocFromServer(doc(db, 'test', 'connection')); } catch (error) { if (error instanceof Error && error.message.includes('offline')) { console.warn('Firestore is running in offline mode.'); } }
}
testConnection();

/* Public Profile Sanitizer & Syncer */
export async function syncPublicProfile(profile: Partial<UserProfile> & { uid: string }): Promise<void> {
  if (!profile.uid || profile.uid.startsWith('guest_') || profile.uid === 'guest') return;
  try {
    const publicRef = doc(db, 'publicProfiles', profile.uid);
    const sanitizedData: Record<string, any> = {
      uid: profile.uid,
      username: profile.username || 'Anonymous',
      displayName: profile.displayName || 'Puzzle Master',
      avatarUrl: profile.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.uid}`,
      level: profile.level || 1,
      xp: profile.xp || 0,
      totalWins: profile.totalWins || 0,
      totalGames: profile.totalGames || 0,
      bestScore: profile.bestScore || 0,
      bestTime: profile.bestTime || 0,
      currentStreak: profile.currentStreak || 1,
      longestStreak: profile.longestStreak || 1,
      updatedAt: new Date().toISOString()
    };
    if (profile.selectedTitle) sanitizedData.selectedTitle = profile.selectedTitle;
    if (profile.unlockedTitles) sanitizedData.unlockedTitles = profile.unlockedTitles;
    if (profile.favoriteGameTypes) sanitizedData.favoriteGameTypes = profile.favoriteGameTypes;
    if (profile.bio !== undefined) sanitizedData.bio = profile.bio;
    if (profile.personalBests) sanitizedData.personalBests = profile.personalBests;

    await setDoc(publicRef, sanitizedData, { merge: true });
  } catch (err) {
    console.warn('syncPublicProfile notice:', err);
  }
}

/* Profile Services */
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const isAdminEmail = user.email === 'jambujain1975@gmail.com';
    let profileData: UserProfile;

    if (snap.exists()) {
      profileData = snap.data() as UserProfile;
      if (isAdminEmail && profileData.role !== 'ADMIN') {
        await updateDoc(userRef, { role: 'ADMIN', updatedAt: new Date().toISOString() });
        profileData.role = 'ADMIN';
      }
    } else {
      profileData = {
        uid: user.uid,
        username: user.email ? user.email.split('@')[0] : `player_${user.uid.slice(0, 6)}`,
        displayName: user.displayName || user.email?.split('@')[0] || 'Puzzle Master',
        email: user.email || '',
        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        role: isAdminEmail ? 'ADMIN' : 'PLAYER',
        level: 1,
        xp: 0,
        totalGames: 0,
        totalWins: 0,
        bestScore: 0,
        bestTime: 0,
        currentStreak: 1,
        longestStreak: 1,
        coins: 100,
        hints: 5,
        personalBests: {},
        adaptiveProfiles: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, profileData);
    }
    // Synchronize sanitized public profile (excluding email, hints, coins, and private metadata)
    await syncPublicProfile(profileData);
    return profileData;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    /* Fallback profile */
    return {
      uid: user.uid,
      username: user.email ? user.email.split('@')[0] : 'guest_player',
      displayName: user.displayName || 'Puzzle Master',
      email: user.email || '',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      role: user.email === 'jambujain1975@gmail.com' ? 'ADMIN' : 'PLAYER',
      level: 1,
      xp: 0,
      totalGames: 0,
      totalWins: 0,
      bestScore: 0,
      bestTime: 0,
      currentStreak: 1,
      longestStreak: 1,
      coins: 100,
      hints: 5,
      personalBests: {},
      adaptiveProfiles: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function updateUserStats(
  uid: string,
  xpGained: number,
  score: number,
  timeSeconds: number,
  won: boolean
) {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const data = snap.data() as UserProfile;
    const newXP = data.xp + xpGained;
    const newLevel = Math.floor(newXP / 250) + 1;
    const newBestScore = Math.max(data.bestScore, score);
    const newBestTime = data.bestTime === 0 ? timeSeconds : Math.min(data.bestTime, timeSeconds);
    const updates = {
      xp: newXP,
      level: newLevel,
      totalGames: data.totalGames + 1,
      totalWins: won ? data.totalWins + 1 : data.totalWins,
      bestScore: newBestScore,
      bestTime: newBestTime,
      coins: data.coins + (won ? 20 : 5),
      updatedAt: new Date().toISOString()
    };
    await updateDoc(userRef, updates);
    // Sync public stats
    syncPublicProfile({
      uid,
      xp: newXP,
      level: newLevel,
      totalGames: updates.totalGames,
      totalWins: updates.totalWins,
      bestScore: newBestScore,
      bestTime: newBestTime
    }).catch(() => {});
    return updates;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
} /* Personal Best 2.0 & Smart Adaptive Difficulty Engine */

function diffRank(d: Difficulty): number { if (d === 'hard') return 3; if (d === 'medium') return 2; return 1;
} export async function processPersonalBestAndAdaptiveDifficulty( userId: string, session: GameSession, currentUserProfile: UserProfile
): Promise<{ isPersonalBest: boolean; personalBestDiff?: { scoreDiff?: number; timeDiff?: number; recordType?: 'SCORE' | 'TIME' | 'DIFFICULTY' }; updatedUser: UserProfile;
}> { const pType = session.puzzleType; const existingPBs = currentUserProfile.personalBests || {}; const existingPB = existingPBs[pType] || { puzzleType: pType, bestScore: 0, bestTime: 0, bestDifficulty: 'easy' as Difficulty, totalGames: 0, totalWins: 0, updatedAt: new Date().toISOString() }; let isPB = false; let recordType: 'SCORE' | 'TIME' | 'DIFFICULTY' | undefined = undefined; let scoreDiff = 0; let timeDiff = 0; if (session.won && session.score > 0) { if (session.score > existingPB.bestScore) { isPB = true; recordType = 'SCORE'; scoreDiff = session.score - existingPB.bestScore; } else if (session.timeSeconds > 0 && (existingPB.bestTime === 0 || session.timeSeconds < existingPB.bestTime)) { isPB = true; recordType = 'TIME'; timeDiff = existingPB.bestTime > 0 ? existingPB.bestTime - session.timeSeconds : session.timeSeconds; } } const updatedPB: PersonalBestRecord = { puzzleType: pType, bestScore: Math.max(existingPB.bestScore, session.won ? session.score : 0), bestTime: session.won ? (existingPB.bestTime === 0 ? session.timeSeconds : Math.min(existingPB.bestTime, session.timeSeconds)) : existingPB.bestTime, bestDifficulty: session.won && diffRank(session.difficulty) > diffRank(existingPB.bestDifficulty) ? session.difficulty : existingPB.bestDifficulty, totalGames: existingPB.totalGames + 1, totalWins: existingPB.totalWins + (session.won ? 1 : 0), updatedAt: new Date().toISOString() }; /* Adaptive Difficulty Calculation (per game) */
 const existingAdaptives = currentUserProfile.adaptiveProfiles || {}; const currentAdaptive = existingAdaptives[pType] || { puzzleType: pType, currentRecommendedDifficulty: session.difficulty, confidence: 50, recentResults: [], successRate: 0, averageScore: 0, averageTime: 0, recentTrend: 'stable' as const, updatedAt: new Date().toISOString() }; const newRecentResults = [...currentAdaptive.recentResults, session.won].slice(-10); const winsCount = newRecentResults.filter(Boolean).length; const successRate = Math.round((winsCount / newRecentResults.length) * 100); let newDifficulty: Difficulty = currentAdaptive.currentRecommendedDifficulty; /* Anti-Frustration Rule: Look at last 3 games */
 const last3 = newRecentResults.slice(-3); if (last3.length >= 3 && last3.every(r => r === true)) { /* 3 consecutive wins -> increase difficulty */
if (newDifficulty === 'easy') newDifficulty = 'medium'; else if (newDifficulty === 'medium') newDifficulty = 'hard'; } else if (last3.length >= 3 && last3.every(r => r === false)) { /* 3 consecutive losses -> decrease difficulty */
if (newDifficulty === 'hard') newDifficulty = 'medium'; else if (newDifficulty === 'medium') newDifficulty = 'easy'; } const updatedAdaptiveProfile: AdaptiveDifficultyProfile = { puzzleType: pType, currentRecommendedDifficulty: newDifficulty, confidence: Math.min(100, newRecentResults.length * 10), recentResults: newRecentResults, successRate, averageScore: Math.round(((currentAdaptive.averageScore * Math.max(0, newRecentResults.length - 1)) + session.score) / newRecentResults.length), averageTime: Math.round(((currentAdaptive.averageTime * Math.max(0, newRecentResults.length - 1)) + session.timeSeconds) / newRecentResults.length), recentTrend: successRate >= 70 ? 'improving' : successRate <= 30 ? 'declining' : 'stable', updatedAt: new Date().toISOString() }; const updatedUser: UserProfile = { ...currentUserProfile, personalBests: { ...existingPBs, [pType]: updatedPB }, adaptiveProfiles: { ...existingAdaptives, [pType]: updatedAdaptiveProfile } }; if (userId && !userId.startsWith('guest_')) { try { const userRef = doc(db, 'users', userId); await updateDoc(userRef, { [`personalBests.${pType}`]: updatedPB, [`adaptiveProfiles.${pType}`]: updatedAdaptiveProfile, updatedAt: new Date().toISOString() }); if (isPB) { await addDoc(collection(db, 'personalBestHistory'), { userId, puzzleType: pType, score: session.score, timeSeconds: session.timeSeconds, difficulty: session.difficulty, improvementScore: scoreDiff, improvementTime: timeDiff, recordType: recordType || 'SCORE', createdAt: new Date().toISOString() } as PersonalBestHistoryItem); await addDoc(collection(db, 'notifications'), { userId, title: 'NEW PERSONAL BEST!', message: `You set a new ${pType.toUpperCase()} record: ${session.score} PTS (${session.timeSeconds}s)!`, type: 'pb', isRead: false, createdAt: new Date().toISOString() } as NotificationItem); } } catch (err) { handleFirestoreError(err, OperationType.WRITE, `users/${userId}`); } } return { isPersonalBest: isPB, personalBestDiff: isPB ? { scoreDiff, timeDiff, recordType } : undefined, updatedUser };
} /* Game Sessions */
export  async function saveGameSession(session: GameSession) { const path = 'gameSessions'; try { const ref = await addDoc(collection(db, 'gameSessions'), session); /* Also post to leaderboards if won and not replay */
if (session.won && session.score > 0 && !session.isReplay) { await saveLeaderboardEntry({ userId: session.userId, username: session.username || 'Anonymous', displayName: session.username || 'Anonymous', avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${session.userId}`, period: 'ALL_TIME', periodKey: 'all', puzzleType: session.puzzleType, difficulty: session.difficulty, score: session.score, bestTime: session.timeSeconds, updatedAt: new Date().toISOString() }); } return ref.id; } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); }
} export async function fetchUserRecentGameSessions(userId: string, limitCount = 10): Promise<GameSession[]> { 
  const path = 'gameSessions'; 
  if (!userId || userId === 'guest' || userId.startsWith('guest_')) return [];
  try { 
    const q = query( 
      collection(db, 'gameSessions'), 
      where('userId', '==', userId), 
      orderBy('createdAt', 'desc'), 
      limit(limitCount) 
    ); 
    const snap = await getDocs(q); 
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as GameSession); 
  } catch (err) { 
    handleFirestoreError(err, OperationType.GET, path); 
    return []; 
  }
} 

export async function fetchPersonalBestHistory(userId: string, puzzleType?: PuzzleType, limitCount = 10): Promise<PersonalBestHistoryItem[]> { 
  const path = 'personalBestHistory'; 
  if (!userId || userId === 'guest' || userId.startsWith('guest_')) return [];
  try { 
    const q = puzzleType 
      ? query(collection(db, 'personalBestHistory'), where('userId', '==', userId), where('puzzleType', '==', puzzleType), orderBy('createdAt', 'desc'), limit(limitCount)) 
      : query(collection(db, 'personalBestHistory'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(limitCount)); 
    const snap = await getDocs(q); 
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PersonalBestHistoryItem); 
  } catch (err) { 
    handleFirestoreError(err, OperationType.GET, path); 
    return []; 
  }
} 

export async function resetUserAdaptiveProfilesInDB(userId: string) { const path = `users/${userId}`; try { const userRef = doc(db, 'users', userId); await updateDoc(userRef, { adaptiveProfiles: {}, updatedAt: new Date().toISOString() }); } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); }
} /* Leaderboard Services */
export  async function saveLeaderboardEntry(entry: LeaderboardEntry) { const path = `leaderboards/${entry.userId}_${entry.puzzleType}_${entry.period}`; try { const leaderboardRef = doc(db, 'leaderboards', `${entry.userId}_${entry.puzzleType}_${entry.period}`); const snap = await getDoc(leaderboardRef); if (snap.exists()) { const existing = snap.data() as LeaderboardEntry; if (entry.score > existing.score) { await setDoc(leaderboardRef, entry); } } else { await setDoc(leaderboardRef, entry); } } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); }
} export async function fetchTopLeaderboard(puzzleType?: string, limitCount = 20): Promise<LeaderboardEntry[]> { const path = 'leaderboards'; try { const q = puzzleType && puzzleType !== 'overall' ? query(collection(db, 'leaderboards'), where('puzzleType', '==', puzzleType), orderBy('score', 'desc'), limit(limitCount)) : query(collection(db, 'leaderboards'), orderBy('score', 'desc'), limit(limitCount)); const snap = await getDocs(q); return snap.docs.map(doc => doc.data() as LeaderboardEntry); } catch (err) { handleFirestoreError(err, OperationType.GET, path); return []; }
} /* Friend Challenges & Community Puzzles */
export  async function createFriendChallenge(challenge: Omit<FriendChallenge, 'id'>) { const path = 'friendChallenges'; try { const ref = await addDoc(collection(db, 'friendChallenges'), challenge); return ref.id; } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); return null; }
} export async function getFriendChallenge(challengeId: string): Promise<FriendChallenge | null> { const path = `friendChallenges/${challengeId}`; try { const ref = doc(db, 'friendChallenges', challengeId); const snap = await getDoc(ref); if (snap.exists()) { return { id: snap.id, ...snap.data() } as FriendChallenge; } return null; } catch (err) { handleFirestoreError(err, OperationType.GET, path); return null; }
} export async function createCommunityPuzzle(puzzle: Omit<CommunityPuzzle, 'id'>) { const path = 'communityPuzzles'; try { const ref = await addDoc(collection(db, 'communityPuzzles'), puzzle); return ref.id; } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); return null; }
} export async function fetchCommunityPuzzles(): Promise<CommunityPuzzle[]> { const path = 'communityPuzzles'; try { const q = query(collection(db, 'communityPuzzles'), where('status', '==', 'published'), limit(30)); const snap = await getDocs(q); return snap.docs.map(d => ({ id: d.id, ...d.data() }) as CommunityPuzzle); } catch (err) { handleFirestoreError(err, OperationType.GET, path); return []; }
} // ============================================================
// PLAYER CHALLENGES 2.0 SERVICES (PHASE 69) /* ============================================================ */
export  async function createChallenge2(challengeData: Omit<ChallengeItem, 'id'>): Promise<string | null> { const path = 'challenges'; try { const expiresAt = challengeData.expiresAt || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); const payload = { ...challengeData, status: challengeData.status || 'PENDING', createdAt: new Date().toISOString(), expiresAt }; const ref = await addDoc(collection(db, 'challenges'), payload); if (challengeData.opponentUid && !challengeData.opponentUid.startsWith('guest_')) { await addDoc(collection(db, 'notifications'), { userId: challengeData.opponentUid, title: 'NEW CHALLENGE RECEIVED!', message: `${challengeData.creatorName} challenged you to a ${challengeData.puzzleType.toUpperCase()} duel!`, type: 'challenge', isRead: false, createdAt: new Date().toISOString() } as NotificationItem); } return ref.id; } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); return null; }
} export async function fetchUserChallenges(userId: string): Promise<ChallengeItem[]> { const path = 'challenges'; try { if (!userId || userId.startsWith('guest_')) return []; /* Query challenges where user is creator or opponent */
const qCreator = query(collection(db, 'challenges'), where('creatorUid', '==', userId), limit(30)); const qOpponent = query(collection(db, 'challenges'), where('opponentUid', '==', userId), limit(30)); const [snap1, snap2] = await Promise.all([getDocs(qCreator), getDocs(qOpponent)]); const itemsMap = new Map<string, ChallengeItem>(); snap1.docs.forEach(d => itemsMap.set(d.id, { id: d.id, ...d.data() } as ChallengeItem)); snap2.docs.forEach(d => itemsMap.set(d.id, { id: d.id, ...d.data() } as ChallengeItem)); const list = Array.from(itemsMap.values()); list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); return list; } catch (err) { handleFirestoreError(err, OperationType.GET, path); return []; }
} export async function getChallenge2ById(challengeId: string): Promise<ChallengeItem | null> { const path = `challenges/${challengeId}`; try { const ref = doc(db, 'challenges', challengeId); const snap = await getDoc(ref); if (snap.exists()) { return { id: snap.id, ...snap.data() } as ChallengeItem; } return null; } catch (err) { handleFirestoreError(err, OperationType.GET, path); return null; }
} export async function updateChallenge2Status( challengeId: string, status: ChallengeStatus, updates?: Partial<ChallengeItem>
): Promise<void> { const path = `challenges/${challengeId}`; try { const ref = doc(db, 'challenges', challengeId); await updateDoc(ref, { status, ...updates, updatedAt: new Date().toISOString() }); } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); }
} export async function processChallengeResult( challengeId: string, playerUid: string, playerName: string, score: number, timeSeconds: number
): Promise<{ isCompleted: boolean; winnerUid?: string; winnerName?: string; xpAwarded: number; coinsAwarded: number }> { const path = `challenges/${challengeId}`; const challenge = await getChallenge2ById(challengeId); if (!challenge) throw new Error('Challenge not found'); const isCreator = challenge.creatorUid === playerUid; const updates: Partial<ChallengeItem> = {}; if (isCreator) { updates.creatorScore = score; updates.creatorTime = timeSeconds; } else { updates.opponentUid = playerUid; updates.opponentName = playerName; updates.opponentScore = score; updates.opponentTime = timeSeconds; } const updatedCreatorScore = isCreator ? score : (challenge.creatorScore ?? challenge.targetScore); const updatedCreatorTime = isCreator ? timeSeconds : (challenge.creatorTime ?? challenge.targetTime); const updatedOpponentScore = !isCreator ? score : challenge.opponentScore; const updatedOpponentTime = !isCreator ? timeSeconds : challenge.opponentTime; let isCompleted = false; let winnerUid: string | undefined = undefined; let winnerName: string | undefined = undefined; const xpAwarded = 150; const coinsAwarded = 75; if (updatedCreatorScore !== undefined && updatedOpponentScore !== undefined) { isCompleted = true; if (updatedCreatorScore > updatedOpponentScore) { winnerUid = challenge.creatorUid; winnerName = challenge.creatorName; } else if (updatedOpponentScore > updatedCreatorScore) { winnerUid = challenge.opponentUid || playerUid; winnerName = challenge.opponentName || playerName; } else { /* Tie breaker by time */
if ((updatedCreatorTime || 999) <= (updatedOpponentTime || 999)) { winnerUid = challenge.creatorUid; winnerName = challenge.creatorName; } else { winnerUid = challenge.opponentUid || playerUid; winnerName = challenge.opponentName || playerName; } } updates.status = 'COMPLETED'; updates.winnerUid = winnerUid; updates.winnerName = winnerName; updates.xpReward = xpAwarded; updates.coinsReward = coinsAwarded;       /* Reward Winner - only active player mutates their own user doc to prevent permission-denied */
      if (winnerUid && winnerUid === playerUid && !winnerUid.startsWith('guest_')) {
        const userRef = doc(db, 'users', winnerUid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const u = userSnap.data() as UserProfile;
          const newXP = u.xp + xpAwarded;
          const newLevel = Math.floor(newXP / 250) + 1;
          await updateDoc(userRef, {
            xp: newXP,
            level: newLevel,
            coins: u.coins + coinsAwarded,
            updatedAt: new Date().toISOString()
          });
        }
      }
      if (winnerUid && !winnerUid.startsWith('guest_')) {
        await addDoc(collection(db, 'notifications'), {
          userId: winnerUid,
          title: 'VICTORY IN CHALLENGE!',
          message: `You won the challenge in ${challenge.puzzleType.toUpperCase()}! Claimed +${xpAwarded} XP & +${coinsAwarded} Coins!`,
          type: 'challenge',
          isRead: false,
          createdAt: new Date().toISOString()
        } as NotificationItem);
      } } else { updates.status = 'IN_PROGRESS'; } if (!playerUid.startsWith('guest_')) { try { const ref = doc(db, 'challenges', challengeId); await updateDoc(ref, updates); } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); } } return { isCompleted, winnerUid, winnerName, xpAwarded, coinsAwarded };
} export async function rematchChallenge(oldChallenge: ChallengeItem): Promise<string | null> { const newSeed = Math.floor(Math.random() * 100000); return await createChallenge2({ creatorUid: oldChallenge.creatorUid, creatorName: oldChallenge.creatorName, creatorAvatar: oldChallenge.creatorAvatar, opponentUid: oldChallenge.opponentUid, opponentName: oldChallenge.opponentName, opponentAvatar: oldChallenge.opponentAvatar, puzzleType: oldChallenge.puzzleType, difficulty: oldChallenge.difficulty, targetScore: oldChallenge.targetScore, targetTime: oldChallenge.targetTime, seed: newSeed, status: 'PENDING', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() });
} // ============================================================
// PLAYER GOALS & PROGRESS TRACKING SERVICES (PHASE 70) /* ============================================================ */
 const DEFAULT_INITIAL_GOALS: Omit<PlayerGoalItem, 'id' | 'userId'>[] = [ { title: 'Warmup Solver', description: 'Solve 3 puzzles in any game mode.', type: 'daily', category: 'games', targetValue: 3, currentValue: 0, rewardXP: 100, rewardCoins: 50, status: 'ACTIVE', claimed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { title: 'High Score Pursuer', description: 'Score over 1,000 total points in gameplay.', type: 'daily', category: 'score', targetValue: 1000, currentValue: 0, rewardXP: 150, rewardCoins: 75, status: 'ACTIVE', claimed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { title: 'Challenge Gladiator', description: 'Participate in or win 2 Player Challenges.', type: 'weekly', category: 'challenges', targetValue: 2, currentValue: 0, rewardXP: 250, rewardCoins: 120, status: 'ACTIVE', claimed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { title: 'Speed Specialist', description: 'Solve a puzzle in under 45 seconds.', type: 'weekly', category: 'speed', targetValue: 1, currentValue: 0, rewardXP: 200, rewardCoins: 100, status: 'ACTIVE', claimed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { title: 'Master Explorer', description: 'Play 5 distinct types of puzzle games.', type: 'personal', category: 'variety', targetValue: 5, currentValue: 0, rewardXP: 300, rewardCoins: 150, status: 'ACTIVE', claimed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
]; export async function fetchUserGoals(userId: string): Promise<PlayerGoalItem[]> { const path = 'playerGoals'; try { if (!userId) return []; if (userId.startsWith('guest_')) { const local = localStorage.getItem(`puzzleverse_goals_${userId}`); if (local) return JSON.parse(local); const seeded = DEFAULT_INITIAL_GOALS.map((g, idx) => ({ ...g, id: `guest_goal_${idx}_${Date.now()}`, userId })); localStorage.setItem(`puzzleverse_goals_${userId}`, JSON.stringify(seeded)); return seeded; } const q = query(collection(db, 'playerGoals'), where('userId', '==', userId), limit(30)); const snap = await getDocs(q); if (snap.empty) { /* Seed default goals into Firestore */
const createdGoals: PlayerGoalItem[] = []; for (const def of DEFAULT_INITIAL_GOALS) { const payload = { ...def, userId }; const ref = await addDoc(collection(db, 'playerGoals'), payload); createdGoals.push({ id: ref.id, ...payload }); } return createdGoals; } return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PlayerGoalItem); } catch (err) { handleFirestoreError(err, OperationType.GET, path); return []; }
} export async function updateUserGoalProgress( userId: string, category: GoalCategory, incrementValue: number = 1
): Promise<void> { try { const goals = await fetchUserGoals(userId); const updatedGoals: PlayerGoalItem[] = []; for (const g of goals) { if (g.status === 'ACTIVE' && g.category === category) { const newVal = Math.min(g.targetValue, g.currentValue + incrementValue); const isNowCompleted = newVal >= g.targetValue; const updated: PlayerGoalItem = { ...g, currentValue: newVal, status: isNowCompleted ? 'COMPLETED' : 'ACTIVE', updatedAt: new Date().toISOString() }; updatedGoals.push(updated); if (!userId.startsWith('guest_')) { const ref = doc(db, 'playerGoals', g.id); await updateDoc(ref, { currentValue: newVal, status: isNowCompleted ? 'COMPLETED' : 'ACTIVE', updatedAt: new Date().toISOString() }); if (isNowCompleted && g.status === 'ACTIVE') { await addDoc(collection(db, 'notifications'), { userId, title: 'GOAL COMPLETED!', message: `You completed "${g.title}"! Claim your +${g.rewardXP} XP & +${g.rewardCoins} Coins!`, type: 'reward', isRead: false, createdAt: new Date().toISOString() } as NotificationItem); } } } } if (userId.startsWith('guest_')) { const all = goals.map(g => updatedGoals.find(u => u.id === g.id) || g); localStorage.setItem(`puzzleverse_goals_${userId}`, JSON.stringify(all)); } } catch (err) { console.error('Goal progress update error:', err); }
} export async function claimGoalReward( userId: string, goalId: string, rewardXP: number, rewardCoins: number
): Promise<{ xpAwarded: number; coinsAwarded: number }> { const path = `playerGoals/${goalId}`; try { if (userId.startsWith('guest_')) { const local = localStorage.getItem(`puzzleverse_goals_${userId}`); if (local) { const goals: PlayerGoalItem[] = JSON.parse(local); const updated = goals.map(g => g.id === goalId ? { ...g, claimed: true, updatedAt: new Date().toISOString() } : g); localStorage.setItem(`puzzleverse_goals_${userId}`, JSON.stringify(updated)); } return { xpAwarded: rewardXP, coinsAwarded: rewardCoins }; } const ref = doc(db, 'playerGoals', goalId); await updateDoc(ref, { claimed: true, updatedAt: new Date().toISOString() }); const userRef = doc(db, 'users', userId); const userSnap = await getDoc(userRef); if (userSnap.exists()) { const u = userSnap.data() as UserProfile; const newXP = u.xp + rewardXP; const newLevel = Math.floor(newXP / 250) + 1; await updateDoc(userRef, { xp: newXP, level: newLevel, coins: u.coins + rewardCoins, updatedAt: new Date().toISOString() }); } return { xpAwarded: rewardXP, coinsAwarded: rewardCoins }; } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); return { xpAwarded: 0, coinsAwarded: 0 }; }
} // ============================================================
// PUZZLE EVENTS SERVICES (PHASE 66) /* ============================================================ */
 const DEFAULT_EVENTS: PuzzleEvent[] = [ { id: 'weekend_sprint_01', name: 'Weekend Puzzle Sprint', description: 'Solve fast! Complete sprint puzzles with 1.2x score multiplier and earn the Sprint Master title.', type: 'SPEED', status: 'active', startAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), endAt: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(), eligibleGames: ['number', 'sliding', 'pipe'], rules: [ 'Complete 3 sprint puzzles under target time.', '1.2x score multiplier applied to all event attempts.', 'Server validated scores and idempotent rewards.' ], scoreMultiplier: 1.2, rewardConfig: { xp: 300, coins: 150, badgeTitle: 'Sprint Master', badgeIcon: 'Zap' }, participationLimit: 3, featured: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'logic_week_special', name: 'Logic Mind Showcase', description: 'Master logic and pattern challenges to accumulate high score bonuses.', type: 'GAME_FOCUS', status: 'active', startAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), endAt: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(), eligibleGames: ['logic', 'pattern', 'laser_mirror'], rules: [ 'Solve logic puzzles with high accuracy.', 'Flat +100 bonus event points per successful solve.', 'Claim 400 XP upon completing 5 event puzzles.' ], bonusPoints: 100, rewardConfig: { xp: 400, coins: 200, badgeTitle: 'Logic Master', badgeIcon: 'Brain' }, participationLimit: 5, featured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'speed_solver_world_cup', name: 'Speed Solver World Cup', description: 'Global speedsolving event opening soon. Prepare your maze & arrow techniques!', type: 'SPEED', status: 'upcoming', startAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(), endAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), eligibleGames: ['word_grid', 'arrow_path', 'maze_escape'], rules: [ 'Global timed competition.', 'Top solvers on the event leaderboard earn exclusive titles.' ], rewardConfig: { xp: 500, coins: 300, badgeTitle: 'World Speed King', badgeIcon: 'Trophy' }, featured: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'community_creation_week', name: 'Community Creator Week', description: 'Celebrated user-submitted community puzzle challenges.', type: 'COMMUNITY', status: 'completed', startAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), endAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), eligibleGames: ['number_path', 'color_path'], rules: [ 'Played community created levels.', 'Earned creator showcase rewards.' ], rewardConfig: { xp: 250, coins: 100 }, featured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
]; export async function fetchPuzzleEvents(): Promise<PuzzleEvent[]> { const path = 'puzzleEvents'; try { const q = query(collection(db, 'puzzleEvents'), limit(20)); const snap = await getDocs(q); if (!snap.empty) { return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PuzzleEvent); } } catch (err) { handleFirestoreError(err, OperationType.GET, path); } return DEFAULT_EVENTS;
} export async function getPuzzleEventById(eventId: string): Promise<PuzzleEvent | null> { const path = `puzzleEvents/${eventId}`; try { const ref = doc(db, 'puzzleEvents', eventId); const snap = await getDoc(ref); if (snap.exists()) { return { id: snap.id, ...snap.data() } as PuzzleEvent; } } catch (err) { handleFirestoreError(err, OperationType.GET, path); } return DEFAULT_EVENTS.find(e => e.id === eventId) || null;
} export async function fetchUserEventProgress(userId: string, eventId: string): Promise<UserEventProgress | null> { const path = `userEventProgress/${userId}_${eventId}`; try { const ref = doc(db, 'userEventProgress', `${userId}_${eventId}`); const snap = await getDoc(ref); if (snap.exists()) { return { id: snap.id, ...snap.data() } as UserEventProgress; } } catch (err) { handleFirestoreError(err, OperationType.GET, path); } return null;
} export async function processEventResult( userId: string, eventId: string, session: GameSession, event: PuzzleEvent
): Promise<{ eventScoreGained: number; progress: UserEventProgress; isEventCompleted: boolean }> { /* Validate eligibility */
if (!event.eligibleGames.includes(session.puzzleType)) { throw new Error('Puzzle type is not eligible for this event.'); } const now = new Date(); if (event.status !== 'active' && (now < new Date(event.startAt) || now > new Date(event.endAt))) { throw new Error('Event is currently inactive.'); } const calculatedScore = Math.round((session.score * (event.scoreMultiplier || 1)) + (session.won ? (event.bonusPoints || 0) : 0)); const existingProgress = await fetchUserEventProgress(userId, eventId); const prevAttempts = existingProgress?.attemptsCount || 0; const prevCompletedGames = existingProgress?.completedGames || []; const prevScore = existingProgress?.totalEventScore || 0; const prevBestTime = existingProgress?.bestTimeSeconds || 99999; const newAttempts = prevAttempts + 1; const newCompletedGames = Array.from(new Set([...prevCompletedGames, session.puzzleType])); const newTotalScore = prevScore + calculatedScore; const newBestTime = session.won ? Math.min(prevBestTime, session.timeSeconds) : prevBestTime; const targetAttempts = event.participationLimit || 3; const isCompleted = newAttempts >= targetAttempts || newCompletedGames.length >= event.eligibleGames.length; const updatedProgress: UserEventProgress = { userId, eventId, attemptsCount: newAttempts, totalEventScore: newTotalScore, bestTimeSeconds: newBestTime === 99999 ? undefined : newBestTime, completedGames: newCompletedGames, isCompleted, claimedReward: existingProgress?.claimedReward || false, updatedAt: new Date().toISOString() }; if (!userId.startsWith('guest_')) { try { const docRef = doc(db, 'userEventProgress', `${userId}_${eventId}`); await setDoc(docRef, updatedProgress, { merge: true }); /* Save to Event Leaderboard */
 const lbRef = doc(db, 'leaderboards', `event_${eventId}_${userId}`); await setDoc(lbRef, { userId, username: session.username || 'Anonymous', displayName: session.username || 'Anonymous', avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`, period: 'ALL_TIME', periodKey: `event_${eventId}`, puzzleType: session.puzzleType, difficulty: session.difficulty, score: newTotalScore, bestTime: newBestTime, updatedAt: new Date().toISOString() }); if (isCompleted && !existingProgress?.isCompleted) { /* Create Completion Notification */
 await addDoc(collection(db, 'notifications'), { userId, title: 'EVENT COMPLETED!', message: `Congratulations! You completed the ${event.name} event with ${newTotalScore} pts!`, type: 'event', isRead: false, createdAt: new Date().toISOString() } as NotificationItem); } } catch (err) { handleFirestoreError(err, OperationType.WRITE, `userEventProgress/${userId}_${eventId}`); } } return { eventScoreGained: calculatedScore, progress: updatedProgress, isEventCompleted: isCompleted };
} export async function claimEventReward( userId: string, eventId: string, event: PuzzleEvent
): Promise<{ xpAwarded: number; coinsAwarded: number }> { const path = `userEventProgress/${userId}_${eventId}`; const progress = await fetchUserEventProgress(userId, eventId); if (!progress || !progress.isCompleted) { throw new Error('Event is not completed yet.'); } if (progress.claimedReward) { throw new Error('Reward has already been claimed for this event.'); } const xpAwarded = event.rewardConfig.xp || 200; const coinsAwarded = event.rewardConfig.coins || 100; if (!userId.startsWith('guest_')) { try { const userRef = doc(db, 'users', userId); const userSnap = await getDoc(userRef); if (userSnap.exists()) { const u = userSnap.data() as UserProfile; const newXP = u.xp + xpAwarded; const newLevel = Math.floor(newXP / 250) + 1; await updateDoc(userRef, { xp: newXP, level: newLevel, coins: u.coins + coinsAwarded, updatedAt: new Date().toISOString() }); } const progressRef = doc(db, 'userEventProgress', `${userId}_${eventId}`); await updateDoc(progressRef, { claimedReward: true, updatedAt: new Date().toISOString() }); await addDoc(collection(db, 'notifications'), { userId, title: 'EVENT REWARD CLAIMED', message: `Claimed +${xpAwarded} XP & +${coinsAwarded} Coins for ${event.name}!`, type: 'reward', isRead: false, createdAt: new Date().toISOString() } as NotificationItem); } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); } } return { xpAwarded, coinsAwarded };
} /* DEFAULT CURATED PUZZLE COLLECTIONS */
export  const DEFAULT_PUZZLE_COLLECTIONS: PuzzleCollection[] = [ { id: 'col_beginner_academy', title: "Beginner's Academy", description: "Ideal starting playlist covering fundamental arithmetic, vocabulary unscrambles, and visual memory pairs.", category: 'Beginner', difficulty: 'easy', estimatedMinutes: 5, items: [ { puzzleType: 'number', difficulty: 'easy', seed: 101 }, { puzzleType: 'word', difficulty: 'easy', seed: 102 }, { puzzleType: 'memory', difficulty: 'easy', seed: 103 } ], status: 'active', featured: true, rewardXP: 200, rewardCoins: 100, badgeTitle: 'Academy Graduate', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'col_logic_mastermind', title: 'Logic Mastermind', description: 'Deductive riddles, matrix sequence completion, pipe network alignment, and optical laser deflections.', category: 'Logic', difficulty: 'medium', estimatedMinutes: 8, items: [ { puzzleType: 'logic', difficulty: 'medium', seed: 201 }, { puzzleType: 'pattern', difficulty: 'medium', seed: 202 }, { puzzleType: 'pipe', difficulty: 'medium', seed: 203 }, { puzzleType: 'laser_mirror', difficulty: 'medium', seed: 204 } ], status: 'active', featured: true, rewardXP: 350, rewardCoins: 175, badgeTitle: 'Logic Mastermind', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'col_speed_sprint', title: 'Speed Sprint Playlist', description: 'Rapid-fire sequential number connections, fast word searches, and directional arrow navigation.', category: 'Speed', difficulty: 'medium', estimatedMinutes: 6, items: [ { puzzleType: 'number_path', difficulty: 'medium', seed: 301 }, { puzzleType: 'word_grid', difficulty: 'medium', seed: 302 }, { puzzleType: 'arrow_path', difficulty: 'medium', seed: 303 } ], status: 'active', featured: true, rewardXP: 300, rewardCoins: 150, badgeTitle: 'Speed Racer', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'col_spatial_architect', title: 'Spatial Architect', description: 'Advanced grid manipulation including block escape, sliding numbers, rotating tiles, and color paths.', category: 'Spatial', difficulty: 'hard', estimatedMinutes: 10, items: [ { puzzleType: 'block_escape', difficulty: 'hard', seed: 401 }, { puzzleType: 'sliding', difficulty: 'medium', seed: 402 }, { puzzleType: 'rotating_tiles', difficulty: 'medium', seed: 403 }, { puzzleType: 'color_path', difficulty: 'hard', seed: 404 } ], status: 'active', featured: false, rewardXP: 450, rewardCoins: 225, badgeTitle: 'Spatial Architect', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'col_memory_matrix', title: 'Memory Matrix & Focus', description: 'Challenge your short-term visual memory with pattern recall, tile pairs, and artwork alignment.', category: 'Memory', difficulty: 'medium', estimatedMinutes: 6, items: [ { puzzleType: 'memory', difficulty: 'medium', seed: 501 }, { puzzleType: 'pattern', difficulty: 'medium', seed: 502 }, { puzzleType: 'rotating_tiles', difficulty: 'easy', seed: 503 } ], status: 'active', featured: false, rewardXP: 250, rewardCoins: 125, badgeTitle: 'Memory Master', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'col_wordcraft_odyssey', title: 'Wordcraft Odyssey', description: 'Word searches, anagram unscrambles, and dense letter grids designed for vocabulary enthusiasts.', category: 'Word', difficulty: 'medium', estimatedMinutes: 7, items: [ { puzzleType: 'word', difficulty: 'medium', seed: 601 }, { puzzleType: 'word_grid', difficulty: 'medium', seed: 602 }, { puzzleType: 'word', difficulty: 'hard', seed: 603 } ], status: 'active', featured: false, rewardXP: 300, rewardCoins: 150, badgeTitle: 'Wordcrafter', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'col_ultimate_gauntlet', title: 'Ultimate Gauntlet Assembly', description: 'The hardest puzzles combined: fog-of-war mazes, complex laser networks, red block escapes, and time attack.', category: 'Challenge', difficulty: 'hard', estimatedMinutes: 12, items: [ { puzzleType: 'maze_escape', difficulty: 'hard', seed: 701 }, { puzzleType: 'laser_mirror', difficulty: 'hard', seed: 702 }, { puzzleType: 'block_escape', difficulty: 'hard', seed: 703 }, { puzzleType: 'challenge_mode', difficulty: 'hard', seed: 704 } ], status: 'active', featured: true, rewardXP: 600, rewardCoins: 300, badgeTitle: 'Gauntlet Champion', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'col_frostbite_seasonal', title: 'Frostbite Seasonal Sprint', description: 'Time-limited seasonal playlist combining arithmetic, logic riddles, and color flow.', category: 'Seasonal', difficulty: 'medium', estimatedMinutes: 7, items: [ { puzzleType: 'number', difficulty: 'medium', seed: 801 }, { puzzleType: 'logic', difficulty: 'medium', seed: 802 }, { puzzleType: 'color_path', difficulty: 'medium', seed: 803 } ], status: 'active', featured: true, rewardXP: 400, rewardCoins: 200, badgeTitle: 'Winter Pathfinder', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
]; /* Showcase Firebase API */
export  async function fetchShowcaseConfig(userId: string): Promise<ShowcaseConfig | null> { const path = `showcaseConfigs/${userId}`; try { const snap = await getDoc(doc(db, 'showcaseConfigs', userId)); if (snap.exists()) { return snap.data() as ShowcaseConfig; } return null; } catch (err) { handleFirestoreError(err, OperationType.GET, path); return null; }
} export async function saveShowcaseConfig(config: ShowcaseConfig): Promise<void> { const path = `showcaseConfigs/${config.userId}`; try { await setDoc(doc(db, 'showcaseConfigs', config.userId), { ...config, updatedAt: new Date().toISOString() }, { merge: true }); } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); }
} export async function fetchUserProfileById(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  // If requesting self, read from /users/
  if (auth.currentUser && auth.currentUser.uid === userId) {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  // Otherwise, read from /publicProfiles/ to preserve privacy and conform to security rules
  const path = `publicProfiles/${userId}`;
  try {
    const pubSnap = await getDoc(doc(db, 'publicProfiles', userId));
    if (pubSnap.exists()) {
      return pubSnap.data() as UserProfile;
    }
    // Safe placeholder if not synced yet, avoids throwing 403 crashes in showcase/friend views
    return {
      uid: userId,
      username: `player_${userId.slice(0, 6)}`,
      displayName: 'Puzzle Master',
      email: '',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      role: 'PLAYER',
      level: 1,
      xp: 0,
      totalGames: 0,
      totalWins: 0,
      bestScore: 0,
      bestTime: 0,
      currentStreak: 1,
      longestStreak: 1,
      coins: 0,
      hints: 0,
      personalBests: {},
      adaptiveProfiles: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
} /* Puzzle Collections API */
export  async function fetchPuzzleCollections(): Promise<PuzzleCollection[]> { const path = 'puzzleCollections'; try { const q = query(collection(db, 'puzzleCollections')); const snap = await getDocs(q); if (!snap.empty) { return snap.docs.map(doc => doc.data() as PuzzleCollection); } } catch (err) { handleFirestoreError(err, OperationType.LIST, path); } return DEFAULT_PUZZLE_COLLECTIONS;
} export async function fetchPuzzleCollectionById(collectionId: string): Promise<PuzzleCollection | null> { const path = `puzzleCollections/${collectionId}`; try { const snap = await getDoc(doc(db, 'puzzleCollections', collectionId)); if (snap.exists()) { return snap.data() as PuzzleCollection; } } catch (err) { handleFirestoreError(err, OperationType.GET, path); } return DEFAULT_PUZZLE_COLLECTIONS.find(c => c.id === collectionId) || null;
} export async function savePuzzleCollection(collectionData: Partial<PuzzleCollection>): Promise<string | null> { const path = 'puzzleCollections'; try { if (collectionData.id) { const ref = doc(db, 'puzzleCollections', collectionData.id); await setDoc(ref, { ...collectionData, updatedAt: new Date().toISOString() }, { merge: true }); return collectionData.id; } else { const ref = await addDoc(collection(db, 'puzzleCollections'), { ...collectionData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); return ref.id; } } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); return null; }
} export async function fetchUserCollectionProgress(userId: string, collectionId: string): Promise<UserCollectionProgress | null> { const path = `userCollectionProgress/${userId}_${collectionId}`; try { const snap = await getDoc(doc(db, 'userCollectionProgress', `${userId}_${collectionId}`)); if (snap.exists()) { return snap.data() as UserCollectionProgress; } } catch (err) { handleFirestoreError(err, OperationType.GET, path); } return null;
} export async function updateCollectionPuzzleProgress( userId: string, collectionId: string, puzzleIndex: number, totalPuzzleCount: number, rewardXP: number, rewardCoins: number
): Promise<{ isCompletedNow: boolean; progress: UserCollectionProgress }> { const path = `userCollectionProgress/${userId}_${collectionId}`; const existing = await fetchUserCollectionProgress(userId, collectionId); const completedIndices = new Set<number>(existing?.completedPuzzleIndices || []); completedIndices.add(puzzleIndex); const updatedIndices = Array.from(completedIndices); const isCompletedNow = updatedIndices.length >= totalPuzzleCount && existing?.status !== 'COMPLETED'; const newStatus = updatedIndices.length >= totalPuzzleCount ? 'COMPLETED' : 'IN_PROGRESS'; const updatedProgress: UserCollectionProgress = { id: `${userId}_${collectionId}`, userId, collectionId, completedPuzzleIndices: updatedIndices, status: newStatus, completedAt: isCompletedNow ? new Date().toISOString() : existing?.completedAt, updatedAt: new Date().toISOString() }; if (!userId.startsWith('guest_')) { try { await setDoc(doc(db, 'userCollectionProgress', `${userId}_${collectionId}`), updatedProgress, { merge: true }); if (isCompletedNow) { const userRef = doc(db, 'users', userId); const userSnap = await getDoc(userRef); if (userSnap.exists()) { const u = userSnap.data() as UserProfile; const newXP = u.xp + rewardXP; const newLevel = Math.floor(newXP / 250) + 1; await updateDoc(userRef, { xp: newXP, level: newLevel, coins: u.coins + rewardCoins, updatedAt: new Date().toISOString() }); } await addDoc(collection(db, 'notifications'), { userId, title: 'COLLECTION COMPLETED!', message: `Congratulations! You completed a puzzle collection and earned +${rewardXP} XP & +${rewardCoins} Coins!`, type: 'reward', isRead: false, createdAt: new Date().toISOString() } as NotificationItem); } } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); } } return { isCompletedNow, progress: updatedProgress };
} export async function updateUserProfileInDB(uid: string, updates: Partial<UserProfile>) {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { ...updates, updatedAt: new Date().toISOString() });
    syncPublicProfile({ uid, ...updates }).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
} export async function savePuzzleEvent(eventData: Partial<PuzzleEvent>): Promise<string | null> { const path = 'puzzleEvents'; try { if (eventData.id) { const ref = doc(db, 'puzzleEvents', eventData.id); await setDoc(ref, { ...eventData, updatedAt: new Date().toISOString() }, { merge: true }); return eventData.id; } else { const ref = await addDoc(collection(db, 'puzzleEvents'), { ...eventData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); return ref.id; } } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); return null; }
} export async function fetchUserJourneyProgress(userId: string): Promise<UserJourneyProgress> { 
  const path = `journeyProgress/${userId}`; 
  if (!userId || userId === 'guest' || userId.startsWith('guest_')) { 
    try { 
      const key = userId || 'guest';
      const saved = localStorage.getItem(`puzzleverse_journey_${key}`); 
      if (saved) return JSON.parse(saved); 
    } catch {} 
    return { userId: userId || 'guest', completedStageIds: [], currentStageId: 'stage_1_1', updatedAt: new Date().toISOString() }; 
  } 
  try { 
    const snap = await getDoc(doc(db, 'journeyProgress', userId)); 
    if (snap.exists()) { 
      return snap.data() as UserJourneyProgress; 
    } 
  } catch (err) { 
    handleFirestoreError(err, OperationType.GET, path); 
  } 
  return { userId, completedStageIds: [], currentStageId: 'stage_1_1', updatedAt: new Date().toISOString() };
} 

export async function processJourneyStageCompletion( 
  userId: string, stageId: string, rewardXP: number, rewardCoins: number
): Promise<{ isFirstCompletion: boolean; progress: UserJourneyProgress }> { 
  const path = `journeyProgress/${userId}`; 
  const existing = await fetchUserJourneyProgress(userId); 
  const completedSet = new Set<string>(existing.completedStageIds || []); 
  const isFirstCompletion = !completedSet.has(stageId); 
  completedSet.add(stageId); 
  const updatedCompletedIds = Array.from(completedSet); /* Determine next stage */
  const allStages = DEFAULT_JOURNEY_CHAPTERS.flatMap(ch => ch.stages); 
  const currentIdx = allStages.findIndex(s => s.id === stageId); 
  const nextStage = currentIdx >= 0 && currentIdx + 1 < allStages.length ? allStages[currentIdx + 1] : null; 
  const newCurrentStageId = nextStage ? nextStage.id : stageId; 
  const updatedProgress: UserJourneyProgress = { id: userId, userId, completedStageIds: updatedCompletedIds, currentStageId: newCurrentStageId, updatedAt: new Date().toISOString() }; 
  if (!userId || userId === 'guest' || userId.startsWith('guest_')) { 
    try { 
      localStorage.setItem(`puzzleverse_journey_${userId || 'guest'}`, JSON.stringify(updatedProgress)); 
    } catch {} 
  } else { 
    try { 
      await setDoc(doc(db, 'journeyProgress', userId), updatedProgress, { merge: true }); 
      if (isFirstCompletion) { 
        const userRef = doc(db, 'users', userId); 
        const userSnap = await getDoc(userRef); 
        if (userSnap.exists()) { 
          const u = userSnap.data() as UserProfile; 
          const newXP = u.xp + rewardXP; 
          const newLevel = Math.floor(newXP / 250) + 1; 
          await updateDoc(userRef, { xp: newXP, level: newLevel, coins: u.coins + rewardCoins, updatedAt: new Date().toISOString() }); 
        } 
        await addDoc(collection(db, 'notifications'), { userId, title: 'JOURNEY STAGE CLEARED!', message: `Great job! You cleared Stage ${stageId} and earned +${rewardXP} XP & +${rewardCoins} Coins!`, type: 'reward', isRead: false, createdAt: new Date().toISOString() } as NotificationItem); 
      } 
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, path); 
    } 
  } 
  return { isFirstCompletion, progress: updatedProgress };
} 

export async function fetchPuzzleGuides(): Promise<PuzzleGuide[]> { 
  const path = 'puzzleGuides'; 
  try { 
    const q = query(collection(db, 'puzzleGuides')); 
    const snap = await getDocs(q); 
    if (!snap.empty) { 
      const dbGuidesMap = new Map<string, PuzzleGuide>(); 
      snap.docs.forEach(d => { 
        const g = d.data() as PuzzleGuide; 
        dbGuidesMap.set(g.puzzleType, g); 
      }); 
      return DEFAULT_PUZZLE_GUIDES.map(def => dbGuidesMap.get(def.puzzleType) || def); 
    } 
  } catch (err) { 
    handleFirestoreError(err, OperationType.LIST, path); 
  } 
  return DEFAULT_PUZZLE_GUIDES;
} 

export async function fetchPuzzleGuideByType(puzzleType: PuzzleType): Promise<PuzzleGuide> { 
  const path = `puzzleGuides/${puzzleType}`; 
  try { 
    const snap = await getDoc(doc(db, 'puzzleGuides', puzzleType)); 
    if (snap.exists()) { 
      return snap.data() as PuzzleGuide; 
    } 
  } catch (err) { 
    handleFirestoreError(err, OperationType.GET, path); 
  } 
  return DEFAULT_PUZZLE_GUIDES.find(g => g.puzzleType === puzzleType) || DEFAULT_PUZZLE_GUIDES[0];
} 

export async function savePuzzleGuide(guideData: Partial<PuzzleGuide>): Promise<boolean> { 
  if (!guideData.puzzleType) return false; 
  const path = `puzzleGuides/${guideData.puzzleType}`; 
  try { 
    const ref = doc(db, 'puzzleGuides', guideData.puzzleType); 
    await setDoc(ref, { ...guideData, updatedAt: new Date().toISOString() }, { merge: true }); 
    return true; 
  } catch (err) { 
    handleFirestoreError(err, OperationType.WRITE, path); 
    return false; 
  }
} 

export async function fetchUserMasteryProfile(userId: string, userProfile: UserProfile | null): Promise<UserMasteryProfile> { 
  const calculated = calculateUserMasteryProfile(userProfile); 
  if (!userId || userId === 'guest' || userId.startsWith('guest_')) { 
    return calculated; 
  } 
  const path = `masteryProgress/${userId}`; 
  try { 
    const snap = await getDoc(doc(db, 'masteryProgress', userId)); 
    if (snap.exists()) { 
      return snap.data() as UserMasteryProfile; 
    } else { 
      await setDoc(doc(db, 'masteryProgress', userId), calculated, { merge: true }); 
    } 
  } catch (err) { 
    handleFirestoreError(err, OperationType.GET, path); 
  } 
  return calculated;
} 

export async function fetchUserPracticeProgress(userId: string): Promise<UserPracticeProgress> { 
  const path = `practiceProgress/${userId}`; 
  if (!userId || userId === 'guest' || userId.startsWith('guest_')) { 
    try { 
      const key = userId || 'guest';
      const saved = localStorage.getItem(`puzzleverse_practice_${key}`); 
      if (saved) return JSON.parse(saved); 
    } catch {} 
    return { userId: userId || 'guest', completedChallengeIds: [], updatedAt: new Date().toISOString() }; 
  } 
  try { 
    const snap = await getDoc(doc(db, 'practiceProgress', userId)); 
    if (snap.exists()) { 
      return snap.data() as UserPracticeProgress; 
    } 
  } catch (err) { 
    handleFirestoreError(err, OperationType.GET, path); 
  } 
  return { userId, completedChallengeIds: [], updatedAt: new Date().toISOString() };
} 

export async function processPracticeChallengeCompletion( 
  userId: string, challengeId: string, rewardXP: number, rewardCoins: number
): Promise<{ isFirstCompletion: boolean; progress: UserPracticeProgress }> { 
  const path = `practiceProgress/${userId}`; 
  const existing = await fetchUserPracticeProgress(userId); 
  const completedSet = new Set<string>(existing.completedChallengeIds || []); 
  const isFirstCompletion = !completedSet.has(challengeId); 
  completedSet.add(challengeId); 
  const updatedProgress: UserPracticeProgress = { id: userId, userId, completedChallengeIds: Array.from(completedSet), updatedAt: new Date().toISOString() }; 
  if (!userId || userId === 'guest' || userId.startsWith('guest_')) { 
    try { 
      localStorage.setItem(`puzzleverse_practice_${userId || 'guest'}`, JSON.stringify(updatedProgress)); 
    } catch {} 
  } else { 
    try { 
      await setDoc(doc(db, 'practiceProgress', userId), updatedProgress, { merge: true }); 
      if (isFirstCompletion) { 
        const userRef = doc(db, 'users', userId); 
        const userSnap = await getDoc(userRef); 
        if (userSnap.exists()) { 
          const u = userSnap.data() as UserProfile; 
          const newXP = u.xp + rewardXP; 
          const newLevel = Math.floor(newXP / 250) + 1; 
          await updateDoc(userRef, { xp: newXP, level: newLevel, coins: u.coins + rewardCoins, updatedAt: new Date().toISOString() }); 
        } 
        await addDoc(collection(db, 'notifications'), { userId, title: 'MASTERY PRACTICE CLEARED!', message: `Awesome work! You completed practice challenge ${challengeId} and earned +${rewardXP} XP & +${rewardCoins} Coins!`, type: 'reward', isRead: false, createdAt: new Date().toISOString() } as NotificationItem); 
      } 
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, path); 
    } 
  } 
  return { isFirstCompletion, progress: updatedProgress };
} 

export async function fetchClubs(searchQuery?: string, focusFilter?: string): Promise<Club[]> {
  const path = 'clubs';
  try {
    const q = query(collection(db, 'clubs'), orderBy('weeklyPoints', 'desc'), limit(50));
    const snap = await getDocs(q);
    if (!snap.empty) {
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Club);
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        results = results.filter(c => c.name.toLowerCase().includes(sq) || c.tag.toLowerCase().includes(sq));
      }
      if (focusFilter && focusFilter !== 'all') {
        results = results.filter(c => c.primaryFocus === focusFilter || c.primaryFocus === 'all');
      }
      return results;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
  let list = [...DEFAULT_CLUBS];
  if (searchQuery) {
    const sq = searchQuery.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(sq) || c.tag.toLowerCase().includes(sq));
  }
  if (focusFilter && focusFilter !== 'all') {
    list = list.filter(c => c.primaryFocus === focusFilter || c.primaryFocus === 'all');
  }
  return list;
}

export async function fetchClubById(clubId: string): Promise<Club | null> {
  const path = `clubs/${clubId}`;
  try {
    const snap = await getDoc(doc(db, 'clubs', clubId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Club;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
  return DEFAULT_CLUBS.find(c => c.id === clubId) || null;
}

export async function fetchClubMembers(clubId: string): Promise<ClubMember[]> {
  const path = `clubs/${clubId}/members`;
  try {
    const snap = await getDocs(collection(db, 'clubs', clubId, 'members'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ClubMember);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
  return DEFAULT_CLUB_MEMBERS[clubId] || [];
}

export async function fetchUserClubMembership(userId: string): Promise<{ club: Club; member: ClubMember } | null> { 
  if (!userId || userId === 'guest' || userId.startsWith('guest_')) {
    try { 
      const stored = localStorage.getItem(`puzzleverse_club_${userId || 'guest'}`); 
      if (stored) { 
        const parsed = JSON.parse(stored); 
        if (parsed?.club && parsed?.member) return parsed; 
      } 
    } catch {} 
    return null;
  }
  try { 
    const snap = await getDocs(query(collection(db, 'clubMembers'), where('userId', '==', userId), limit(1))); 
    if (!snap.empty) { 
      const member = snap.docs[0].data() as ClubMember; 
      const club = await fetchClubById(member.clubId); 
      if (club) return { club, member }; 
    } 
  } catch (err) { 
    handleFirestoreError(err, OperationType.LIST, 'clubMembers'); 
  } 
  try { 
    const stored = localStorage.getItem(`puzzleverse_club_${userId}`); 
    if (stored) { 
      const parsed = JSON.parse(stored); 
      if (parsed?.club && parsed?.member) return parsed; 
    } 
  } catch {} 
  return null;
} export async function createClub(clubData: Partial<Club>, creator: UserProfile): Promise<{ club: Club; member: ClubMember }> { const clubId = 'club_' + Math.random().toString(36).substring(2, 9); const now = new Date().toISOString(); const newClub: Club = { id: clubId, name: clubData.name || 'New Puzzle Club', tag: (clubData.tag || 'CLUB').toUpperCase().slice(0, 5), description: clubData.description || 'A community of dedicated puzzle solvers.', icon: clubData.icon || 'Shield', themeColor: clubData.themeColor || 'amber', privacy: clubData.privacy || 'public', primaryFocus: clubData.primaryFocus || 'all', memberCount: 1, maxMembers: 30, ownerUid: creator.uid, ownerName: creator.displayName, adminUids: [], totalClubXP: 100, level: 1, weeklyPoints: 100, totalPuzzlesSolved: 0, createdAt: now, updatedAt: now }; const newMember: ClubMember = { id: `${clubId}_${creator.uid}`, clubId, userId: creator.uid, displayName: creator.displayName, avatarUrl: creator.avatarUrl, role: 'OWNER', totalContributionXP: 100, weeklyContributionXP: 100, joinedAt: now, lastActiveAt: now }; if (creator.uid.startsWith('guest_')) { try { localStorage.setItem(`puzzleverse_club_${creator.uid}`, JSON.stringify({ club: newClub, member: newMember })); } catch {} } else { try { await setDoc(doc(db, 'clubs', clubId), newClub); await setDoc(doc(db, 'clubs', clubId, 'members', newMember.id), newMember); await setDoc(doc(db, 'clubMembers', newMember.id), newMember); await addDoc(collection(db, 'clubs', clubId, 'messages'), { clubId, userId: 'system', userName: 'System', userAvatar: '', message: `🛡️ Club "${newClub.name}" [${newClub.tag}] was created by ${creator.displayName}!`, isSystemActivity: true, createdAt: now } as ClubChatMessage); } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}`); } } return { club: newClub, member: newMember };
} export async function joinClub(clubId: string, user: UserProfile): Promise<{ club: Club; member: ClubMember }> { const club = await fetchClubById(clubId); if (!club) throw new Error('Club not found'); const now = new Date().toISOString(); const memberId = `${clubId}_${user.uid}`; const newMember: ClubMember = { id: memberId, clubId, userId: user.uid, displayName: user.displayName, avatarUrl: user.avatarUrl, role: 'MEMBER', totalContributionXP: 0, weeklyContributionXP: 0, joinedAt: now, lastActiveAt: now }; const updatedClub: Club = { ...club, memberCount: club.memberCount + 1, updatedAt: now }; if (user.uid.startsWith('guest_')) { try { localStorage.setItem(`puzzleverse_club_${user.uid}`, JSON.stringify({ club: updatedClub, member: newMember })); } catch {} } else { try { await updateDoc(doc(db, 'clubs', clubId), { memberCount: updatedClub.memberCount, updatedAt: now }); await setDoc(doc(db, 'clubs', clubId, 'members', memberId), newMember); await setDoc(doc(db, 'clubMembers', memberId), newMember); await addDoc(collection(db, 'clubs', clubId, 'messages'), { clubId, userId: 'system', userName: 'System', userAvatar: '', message: `👋 ${user.displayName} joined the club! Welcome!`, isSystemActivity: true, createdAt: now } as ClubChatMessage); } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}`); } } return { club: updatedClub, member: newMember };
} export async function leaveClub(clubId: string, userId: string): Promise<void> { if (userId.startsWith('guest_')) { try { localStorage.removeItem(`puzzleverse_club_${userId}`); } catch {} return; } const memberId = `${clubId}_${userId}`; try { const clubRef = doc(db, 'clubs', clubId); const clubSnap = await getDoc(clubRef); if (clubSnap.exists()) { const c = clubSnap.data() as Club; await updateDoc(clubRef, { memberCount: Math.max(1, c.memberCount - 1), updatedAt: new Date().toISOString() }); } await setDoc(doc(db, 'clubMembers', memberId), { active: false }, { merge: true }); } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}`); }
} export async function sendClubChatMessage( clubId: string, user: UserProfile, message: string, isSystemActivity = false
): Promise<ClubChatMessage> { const msg: ClubChatMessage = { id: 'msg_' + Math.random().toString(36).substring(2, 9), clubId, userId: isSystemActivity ? 'system' : user.uid, userName: isSystemActivity ? 'System' : user.displayName, userAvatar: isSystemActivity ? '' : user.avatarUrl, message, isSystemActivity, createdAt: new Date().toISOString() }; if (!user.uid.startsWith('guest_')) { try { await addDoc(collection(db, 'clubs', clubId, 'messages'), msg); } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/messages`); } } return msg;
} export async function fetchClubChatMessages(clubId: string): Promise<ClubChatMessage[]> { try { const q = query(collection(db, 'clubs', clubId, 'messages'), orderBy('createdAt', 'asc'), limit(50)); const snap = await getDocs(q); if (!snap.empty) { return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubChatMessage)); } } catch (err) { handleFirestoreError(err, OperationType.LIST, `clubs/${clubId}/messages`); } return DEFAULT_CLUB_MESSAGES[clubId] || [];
} export async function fetchActiveClubCompetitions(): Promise<ClubCompetition[]> { try { const q = query(collection(db, 'clubCompetitions'), where('status', '==', 'active')); const snap = await getDocs(q); if (!snap.empty) { return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubCompetition)); } } catch (err) { handleFirestoreError(err, OperationType.LIST, 'clubCompetitions'); } return DEFAULT_CLUB_COMPETITIONS;
} export async function fetchClubCompetitionScores(competitionId: string): Promise<ClubCompetitionScore[]> { try { const q = query( collection(db, 'clubScores'), where('competitionId', '==', competitionId), orderBy('totalPoints', 'desc'), limit(20) ); const snap = await getDocs(q); if (!snap.empty) { return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubCompetitionScore)); } } catch (err) { handleFirestoreError(err, OperationType.LIST, 'clubScores'); } return DEFAULT_CLUB_SCORES;
} export async function fetchClubDuels(clubId: string): Promise<ClubDuelChallenge[]> { try { const snap = await getDocs( query(collection(db, 'clubDuels'), where('challengerClubId', '==', clubId)) ); if (!snap.empty) { return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubDuelChallenge)); } } catch (err) { handleFirestoreError(err, OperationType.LIST, 'clubDuels'); } return DEFAULT_CLUB_DUELS.filter(d => d.challengerClubId === clubId || d.targetClubId === clubId);
} export async function createClubDuel( challengerClub: Club, targetClub: Club, puzzleTypes: PuzzleType[], user: UserProfile
): Promise<ClubDuelChallenge> { const duel: ClubDuelChallenge = { id: 'duel_' + Math.random().toString(36).substring(2, 9), challengerClubId: challengerClub.id, challengerClubName: challengerClub.name, challengerClubTag: challengerClub.tag, targetClubId: targetClub.id, targetClubName: targetClub.name, targetClubTag: targetClub.tag, puzzleTypes, durationDays: 3, challengerScore: 0, targetScore: 0, status: 'ACTIVE', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 3 * 86400000).toISOString(), createdAt: new Date().toISOString() }; if (!user.uid.startsWith('guest_')) { try { await setDoc(doc(db, 'clubDuels', duel.id), duel); await sendClubChatMessage( challengerClub.id, user, `⚔️ Club Duel issued against [${targetClub.tag}] ${targetClub.name}! 3-Day Clash across ${puzzleTypes.join(', ')} begins now!`, true ); } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'clubDuels'); } } return duel;
} export async function recordClubGameContribution( userId: string, xpEarned: number, score: number, puzzleType: PuzzleType
): Promise<void> { if (!userId || xpEarned <= 0) return; const membership = await fetchUserClubMembership(userId); if (!membership) return; const { club, member } = membership; const now = new Date().toISOString(); const newMemberWeekly = member.weeklyContributionXP + xpEarned; const newMemberTotal = member.totalContributionXP + xpEarned; const newMemberSolved = (member.puzzlesSolvedCount || 0) + 1; const newClubWeekly = club.weeklyPoints + xpEarned; const newClubTotalXP = club.totalClubXP + xpEarned; const newClubTotalSolved = (club.totalPuzzlesSolved || 0) + 1; const newClubLevel = Math.floor(newClubTotalXP / 5000) + 1; if (userId.startsWith('guest_')) { const updatedClub = { ...club, weeklyPoints: newClubWeekly, totalClubXP: newClubTotalXP, totalPuzzlesSolved: newClubTotalSolved, level: newClubLevel }; const updatedMember = { ...member, weeklyContributionXP: newMemberWeekly, totalContributionXP: newMemberTotal, puzzlesSolvedCount: newMemberSolved }; try { localStorage.setItem(`puzzleverse_club_${userId}`, JSON.stringify({ club: updatedClub, member: updatedMember })); } catch {} return; } try { const clubRef = doc(db, 'clubs', club.id); await updateDoc(clubRef, { weeklyPoints: newClubWeekly, totalClubXP: newClubTotalXP, totalPuzzlesSolved: newClubTotalSolved, level: newClubLevel, updatedAt: now }); const memberRef = doc(db, 'clubs', club.id, 'members', member.id); await updateDoc(memberRef, { weeklyContributionXP: newMemberWeekly, totalContributionXP: newMemberTotal, puzzlesSolvedCount: newMemberSolved, lastActiveAt: now }); const globalMemberRef = doc(db, 'clubMembers', member.id); await updateDoc(globalMemberRef, { weeklyContributionXP: newMemberWeekly, totalContributionXP: newMemberTotal, puzzlesSolvedCount: newMemberSolved, lastActiveAt: now }); /* Check club milestones */
try  { const msRef = collection(db, 'clubs', club.id, 'milestones'); const msSnap = await getDocs(msRef); msSnap.docs.forEach(async (msDoc) => { const ms = msDoc.data() as ClubMilestone; if (!ms.isCompleted && newClubTotalSolved >= ms.targetPuzzles) { await updateDoc(doc(db, 'clubs', club.id, 'milestones', msDoc.id), { isCompleted: true, achievedPuzzles: newClubTotalSolved, completedAt: now }); /* Send notification to member */
 await addDoc(collection(db, 'notifications'), { userId, title: 'CLUB MILESTONE UNLOCKED! 🏆', message: `Your club "${club.name}" completed milestone: ${ms.title}!`, type: 'achievement', isRead: false, createdAt: now }); } }); } catch {} if (club.activeCompetitionId) { const scoreId = `comp_${club.activeCompetitionId}_${club.id}`; const scoreRef = doc(db, 'clubScores', scoreId); const scoreSnap = await getDoc(scoreRef); if (scoreSnap.exists()) { const cs = scoreSnap.data() as ClubCompetitionScore; await updateDoc(scoreRef, { totalPoints: cs.totalPoints + xpEarned, updatedAt: now }); } else { await setDoc(scoreRef, { id: scoreId, competitionId: club.activeCompetitionId, clubId: club.id, clubName: club.name, clubTag: club.tag, clubIcon: club.icon, totalPoints: xpEarned, memberContributionsCount: 1, milestoneCompleted: false, updatedAt: now } as ClubCompetitionScore); } } } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${club.id}`); }
} // ============================================================
// PHASE 79 & 80 — CLUB EVENTS, RSVPs & REPUTATION SERVICES /* ============================================================ */
export  async function fetchClubEvents(clubId: string): Promise<ClubEvent[]> { if (DEFAULT_CLUB_EVENTS[clubId]) { return DEFAULT_CLUB_EVENTS[clubId]; } if (clubId.startsWith('club_') && !db) { return DEFAULT_CLUB_EVENTS['club_logic_guild'] || []; } try { const q = query(collection(db, 'clubs', clubId, 'events'), limit(50)); const snap = await getDocs(q); const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubEvent)); list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()); return list.length > 0 ? list : (DEFAULT_CLUB_EVENTS[clubId] || DEFAULT_CLUB_EVENTS['club_logic_guild'] || []); } catch (err) { handleFirestoreError(err, OperationType.GET, `clubs/${clubId}/events`); return DEFAULT_CLUB_EVENTS[clubId] || DEFAULT_CLUB_EVENTS['club_logic_guild'] || []; }
} export async function createClubEvent( clubId: string, eventData: Omit<ClubEvent, 'id' | 'createdAt' | 'updatedAt' | 'participantCount' | 'interestedCount'>
): Promise<string | null> { const now = new Date().toISOString(); const payload: Omit<ClubEvent, 'id'> = { ...eventData, participantCount: 1, /* creator participates by default interestedCount: 0, status: 'scheduled', createdAt: now, updatedAt: now */
 }; if (clubId.startsWith('club_') || !db) { const newId = `event_${Date.now()}`; const newEvent: ClubEvent = { id: newId, ...payload }; if (!DEFAULT_CLUB_EVENTS[clubId]) DEFAULT_CLUB_EVENTS[clubId] = []; DEFAULT_CLUB_EVENTS[clubId].unshift(newEvent); return newId; } try { const ref = await addDoc(collection(db, 'clubs', clubId, 'events'), payload); /* Add creator as participant */
 await setDoc(doc(db, 'clubs', clubId, 'events', ref.id, 'participants', `${ref.id}_${eventData.createdBy}`), { id: `${ref.id}_${eventData.createdBy}`, eventId: ref.id, clubId, userId: eventData.createdBy, displayName: eventData.createdByName, avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + eventData.createdByName, status: 'participating', createdAt: now } as ClubEventParticipant); return ref.id; } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/events`); return null; }
} export async function updateClubEvent(clubId: string, eventId: string, updates: Partial<ClubEvent>): Promise<void> { if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_EVENTS[clubId]; if (list) { const idx = list.findIndex((e: ClubEvent) => e.id === eventId); if (idx !== -1) { list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() }; } } return; } try { const ref = doc(db, 'clubs', clubId, 'events', eventId); await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() }); } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/events/${eventId}`); }
} export async function cancelClubEvent(clubId: string, eventId: string): Promise<void> { return updateClubEvent(clubId, eventId, { status: 'cancelled' });
} export async function rsvpClubEvent( clubId: string, eventId: string, userId: string, displayName: string, avatarUrl: string, status: 'participating' | 'interested'
): Promise<void> { const participantId = `${eventId}_${userId}`; const now = new Date().toISOString(); if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_EVENTS[clubId]; if (list) { const ev = list.find((e: ClubEvent) => e.id === eventId); if (ev) { ev.participantCount = (ev.participantCount || 0) + (status === 'participating' ? 1 : 0); ev.interestedCount = (ev.interestedCount || 0) + (status === 'interested' ? 1 : 0); } } return; } try { const partRef = doc(db, 'clubs', clubId, 'events', eventId, 'participants', participantId); const existingSnap = await getDoc(partRef); const prevStatus = existingSnap.exists() ? (existingSnap.data() as ClubEventParticipant).status : null; if (prevStatus === status) return; /* Idempotent */
 await setDoc(partRef, { id: participantId, eventId, clubId, userId, displayName, avatarUrl, status, createdAt: now } as ClubEventParticipant); const eventRef = doc(db, 'clubs', clubId, 'events', eventId); const evSnap = await getDoc(eventRef); if (evSnap.exists()) { const ev = evSnap.data() as ClubEvent; let pCount = ev.participantCount || 0; let iCount = ev.interestedCount || 0; if (prevStatus === 'participating') pCount = Math.max(0, pCount - 1); if (prevStatus === 'interested') iCount = Math.max(0, iCount - 1); if (status === 'participating') pCount += 1; if (status === 'interested') iCount += 1; await updateDoc(eventRef, { participantCount: pCount, interestedCount: iCount, updatedAt: now }); } } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/events/${eventId}/participants`); }
} export async function fetchUserEventRsvp( clubId: string, eventId: string, userId: string
): Promise<'participating' | 'interested' | null> { if (clubId.startsWith('club_') || !db) return null; try { const partRef = doc(db, 'clubs', clubId, 'events', eventId, 'participants', `${eventId}_${userId}`); const snap = await getDoc(partRef); if (snap.exists()) { return (snap.data() as ClubEventParticipant).status; } return null; } catch (err) { handleFirestoreError(err, OperationType.GET, `clubs/${clubId}/events/${eventId}/participants`); return null; }
} export async function fetchClubMilestones(clubId: string): Promise<ClubMilestone[]> { if (DEFAULT_CLUB_MILESTONES[clubId]) { return DEFAULT_CLUB_MILESTONES[clubId]; } if (clubId.startsWith('club_') || !db) { return DEFAULT_CLUB_MILESTONES['club_logic_guild'] || []; } try { const q = query(collection(db, 'clubs', clubId, 'milestones')); const snap = await getDocs(q); const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubMilestone)); list.sort((a, b) => a.targetPuzzles - b.targetPuzzles); return list.length > 0 ? list : (DEFAULT_CLUB_MILESTONES[clubId] || DEFAULT_CLUB_MILESTONES['club_logic_guild'] || []); } catch (err) { handleFirestoreError(err, OperationType.GET, `clubs/${clubId}/milestones`); return DEFAULT_CLUB_MILESTONES[clubId] || DEFAULT_CLUB_MILESTONES['club_logic_guild'] || []; }
} export async function updateClubMemberRole(clubId: string, targetUserId: string, newRole: ClubRole): Promise<void> { const memberId = `${clubId}_${targetUserId}`; if (clubId.startsWith('club_') || !db) { const members = DEFAULT_CLUB_MEMBERS[clubId]; if (members) { const m = members.find(mem => mem.userId === targetUserId); if (m) m.role = newRole; } return; } try { const mRef1 = doc(db, 'clubs', clubId, 'members', memberId); await updateDoc(mRef1, { role: newRole }); const mRef2 = doc(db, 'clubMembers', memberId); await updateDoc(mRef2, { role: newRole }); } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/members/${memberId}`); }
} export function computeClubReputation( totalXP: number, memberCount: number
): 'Emerging Club' | 'Established Club' | 'Thriving Community' | 'Elite Syndicate' { if (totalXP >= 50000 && memberCount >= 10) return 'Elite Syndicate'; if (totalXP >= 20000 && memberCount >= 5) return 'Thriving Community'; if (totalXP >= 5000) return 'Established Club'; return 'Emerging Club';
} /* PHASE 81 — CLUB DISCUSSIONS SERVICES */
export  async function fetchClubDiscussions(clubId: string): Promise<ClubDiscussion[]> { if (DEFAULT_CLUB_DISCUSSIONS[clubId]) { return DEFAULT_CLUB_DISCUSSIONS[clubId]; } if (clubId.startsWith('club_') || !db) { return DEFAULT_CLUB_DISCUSSIONS['club_logic_guild'] || []; } try { const q = query(collection(db, 'clubs', clubId, 'discussions')); const snap = await getDocs(q); const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubDiscussion)); list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); return list.length > 0 ? list : (DEFAULT_CLUB_DISCUSSIONS[clubId] || DEFAULT_CLUB_DISCUSSIONS['club_logic_guild'] || []); } catch (err) { handleFirestoreError(err, OperationType.GET, `clubs/${clubId}/discussions`); return DEFAULT_CLUB_DISCUSSIONS[clubId] || DEFAULT_CLUB_DISCUSSIONS['club_logic_guild'] || []; }
} export async function createClubDiscussion( clubId: string, discussionData: Omit<ClubDiscussion, 'id' | 'createdAt' | 'updatedAt' | 'replyCount' | 'upvotesCount' | 'upvotedBy' | 'lastReplyAt'>
): Promise<string | null> { const now = new Date().toISOString(); const payload: Omit<ClubDiscussion, 'id'> = { ...discussionData, replyCount: 0, upvotesCount: 0, upvotedBy: [], lastReplyAt: now, createdAt: now, updatedAt: now }; if (clubId.startsWith('club_') || !db) { const newId = `disc_${Date.now()}`; const newDisc: ClubDiscussion = { id: newId, ...payload }; if (!DEFAULT_CLUB_DISCUSSIONS[clubId]) DEFAULT_CLUB_DISCUSSIONS[clubId] = []; DEFAULT_CLUB_DISCUSSIONS[clubId].unshift(newDisc); return newId; } try { const ref = await addDoc(collection(db, 'clubs', clubId, 'discussions'), payload); return ref.id; } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/discussions`); return null; }
} export async function updateClubDiscussion( clubId: string, discussionId: string, updates: Partial<ClubDiscussion>
): Promise<void> { if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_DISCUSSIONS[clubId]; if (list) { const idx = list.findIndex(d => d.id === discussionId); if (idx !== -1) { list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() }; } } return; } try { const ref = doc(db, 'clubs', clubId, 'discussions', discussionId); await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() }); } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/discussions/${discussionId}`); }
} export async function deleteClubDiscussion(clubId: string, discussionId: string): Promise<void> { if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_DISCUSSIONS[clubId]; if (list) { DEFAULT_CLUB_DISCUSSIONS[clubId] = list.filter(d => d.id !== discussionId); } return; } try { const ref = doc(db, 'clubs', clubId, 'discussions', discussionId); await updateDoc(ref, { isDeleted: true, updatedAt: new Date().toISOString() }); } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/discussions/${discussionId}`); }
} export async function toggleUpvoteDiscussion( clubId: string, discussionId: string, userId: string
): Promise<void> { if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_DISCUSSIONS[clubId] || DEFAULT_CLUB_DISCUSSIONS['club_logic_guild']; if (list) { const disc = list.find(d => d.id === discussionId); if (disc) { const hasUpvoted = disc.upvotedBy.includes(userId); if (hasUpvoted) { disc.upvotedBy = disc.upvotedBy.filter(id => id !== userId); disc.upvotesCount = Math.max(0, disc.upvotesCount - 1); } else { disc.upvotedBy.push(userId); disc.upvotesCount += 1; } } } return; } try { const ref = doc(db, 'clubs', clubId, 'discussions', discussionId); const snap = await getDoc(ref); if (snap.exists()) { const disc = snap.data() as ClubDiscussion; const upvotedBy = disc.upvotedBy || []; const hasUpvoted = upvotedBy.includes(userId); const newUpvotedBy = hasUpvoted ? upvotedBy.filter(id => id !== userId) : [...upvotedBy, userId]; const newCount = newUpvotedBy.length; await updateDoc(ref, { upvotedBy: newUpvotedBy, upvotesCount: newCount, updatedAt: new Date().toISOString() }); } } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/discussions/${discussionId}`); }
} export async function togglePinDiscussion( clubId: string, discussionId: string, isPinned: boolean
): Promise<void> { return updateClubDiscussion(clubId, discussionId, { isPinned });
} export async function fetchDiscussionReplies( clubId: string, discussionId: string
): Promise<ClubDiscussionReply[]> { if (DEFAULT_CLUB_REPLIES[discussionId]) { return DEFAULT_CLUB_REPLIES[discussionId]; } if (clubId.startsWith('club_') || !db) { return DEFAULT_CLUB_REPLIES['disc_101'] || []; } try { const q = query(collection(db, 'clubs', clubId, 'discussions', discussionId, 'replies')); const snap = await getDocs(q); const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubDiscussionReply)); list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); return list.length > 0 ? list : (DEFAULT_CLUB_REPLIES[discussionId] || []); } catch (err) { handleFirestoreError(err, OperationType.GET, `clubs/${clubId}/discussions/${discussionId}/replies`); return DEFAULT_CLUB_REPLIES[discussionId] || []; }
} export async function addDiscussionReply( clubId: string, discussionId: string, replyData: Omit<ClubDiscussionReply, 'id' | 'createdAt' | 'updatedAt' | 'upvotesCount' | 'upvotedBy'>
): Promise<ClubDiscussionReply | null> { const now = new Date().toISOString(); const payload: Omit<ClubDiscussionReply, 'id'> = { ...replyData, upvotesCount: 0, upvotedBy: [], createdAt: now, updatedAt: now }; if (clubId.startsWith('club_') || !db) { const newId = `rep_${Date.now()}`; const newReply: ClubDiscussionReply = { id: newId, ...payload }; if (!DEFAULT_CLUB_REPLIES[discussionId]) DEFAULT_CLUB_REPLIES[discussionId] = []; DEFAULT_CLUB_REPLIES[discussionId].push(newReply); /* Update discussion stats */
 const discList = DEFAULT_CLUB_DISCUSSIONS[clubId] || DEFAULT_CLUB_DISCUSSIONS['club_logic_guild']; if (discList) { const disc = discList.find(d => d.id === discussionId); if (disc) { disc.replyCount += 1; disc.lastReplyAt = now; } } return newReply; } try { const ref = await addDoc(collection(db, 'clubs', clubId, 'discussions', discussionId, 'replies'), payload); const created: ClubDiscussionReply = { id: ref.id, ...payload }; /* Update discussion reply counter & timestamp */
 const discRef = doc(db, 'clubs', clubId, 'discussions', discussionId); const discSnap = await getDoc(discRef); if (discSnap.exists()) { const disc = discSnap.data() as ClubDiscussion; await updateDoc(discRef, { replyCount: (disc.replyCount || 0) + 1, lastReplyAt: now, updatedAt: now }); } return created; } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/discussions/${discussionId}/replies`); return null; }
} export async function toggleUpvoteReply( clubId: string, discussionId: string, replyId: string, userId: string
): Promise<void> { if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_REPLIES[discussionId]; if (list) { const rep = list.find(r => r.id === replyId); if (rep) { const hasUpvoted = rep.upvotedBy.includes(userId); if (hasUpvoted) { rep.upvotedBy = rep.upvotedBy.filter(id => id !== userId); rep.upvotesCount = Math.max(0, rep.upvotesCount - 1); } else { rep.upvotedBy.push(userId); rep.upvotesCount += 1; } } } return; } try { const ref = doc(db, 'clubs', clubId, 'discussions', discussionId, 'replies', replyId); const snap = await getDoc(ref); if (snap.exists()) { const rep = snap.data() as ClubDiscussionReply; const upvotedBy = rep.upvotedBy || []; const hasUpvoted = upvotedBy.includes(userId); const newUpvotedBy = hasUpvoted ? upvotedBy.filter(id => id !== userId) : [...upvotedBy, userId]; await updateDoc(ref, { upvotedBy: newUpvotedBy, upvotesCount: newUpvotedBy.length, updatedAt: new Date().toISOString() }); } } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/discussions/${discussionId}/replies/${replyId}`); }
} /* PHASE 82 — CLUB GUIDES & KNOWLEDGE BASE SERVICES */
export  async function fetchClubGuides(clubId: string): Promise<ClubGuide[]> { if (DEFAULT_CLUB_GUIDES[clubId]) { return DEFAULT_CLUB_GUIDES[clubId]; } if (clubId.startsWith('club_') || !db) { return DEFAULT_CLUB_GUIDES['club_logic_guild'] || []; } try { const q = query(collection(db, 'clubs', clubId, 'guides')); const snap = await getDocs(q); const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubGuide)); list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); return list.length > 0 ? list : (DEFAULT_CLUB_GUIDES[clubId] || DEFAULT_CLUB_GUIDES['club_logic_guild'] || []); } catch (err) { handleFirestoreError(err, OperationType.GET, `clubs/${clubId}/guides`); return DEFAULT_CLUB_GUIDES[clubId] || DEFAULT_CLUB_GUIDES['club_logic_guild'] || []; }
} export async function createClubGuide( clubId: string, guideData: Omit<ClubGuide, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'likedBy' | 'viewsCount' | 'bookmarksCount' | 'bookmarkedBy'>
): Promise<string | null> { const now = new Date().toISOString(); const payload: Omit<ClubGuide, 'id'> = { ...guideData, likesCount: 0, likedBy: [], viewsCount: 1, bookmarksCount: 0, bookmarkedBy: [], createdAt: now, updatedAt: now }; if (clubId.startsWith('club_') || !db) { const newId = `guide_${Date.now()}`; const newGuide: ClubGuide = { id: newId, ...payload }; if (!DEFAULT_CLUB_GUIDES[clubId]) DEFAULT_CLUB_GUIDES[clubId] = []; DEFAULT_CLUB_GUIDES[clubId].unshift(newGuide); return newId; } try { const ref = await addDoc(collection(db, 'clubs', clubId, 'guides'), payload); return ref.id; } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/guides`); return null; }
} export async function updateClubGuide( clubId: string, guideId: string, updates: Partial<ClubGuide>
): Promise<void> { if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_GUIDES[clubId]; if (list) { const idx = list.findIndex(g => g.id === guideId); if (idx !== -1) { list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() }; } } return; } try { const ref = doc(db, 'clubs', clubId, 'guides', guideId); await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() }); } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/guides/${guideId}`); }
} export async function deleteClubGuide(clubId: string, guideId: string): Promise<void> { if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_GUIDES[clubId]; if (list) { DEFAULT_CLUB_GUIDES[clubId] = list.filter(g => g.id !== guideId); } return; } try { const ref = doc(db, 'clubs', clubId, 'guides', guideId); await updateDoc(ref, { isDeleted: true, updatedAt: new Date().toISOString() }); } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/guides/${guideId}`); }
} export async function toggleLikeGuide( clubId: string, guideId: string, userId: string
): Promise<void> { if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_GUIDES[clubId] || DEFAULT_CLUB_GUIDES['club_logic_guild']; if (list) { const g = list.find(guide => guide.id === guideId); if (g) { const hasLiked = g.likedBy.includes(userId); if (hasLiked) { g.likedBy = g.likedBy.filter(id => id !== userId); g.likesCount = Math.max(0, g.likesCount - 1); } else { g.likedBy.push(userId); g.likesCount += 1; } } } return; } try { const ref = doc(db, 'clubs', clubId, 'guides', guideId); const snap = await getDoc(ref); if (snap.exists()) { const g = snap.data() as ClubGuide; const likedBy = g.likedBy || []; const hasLiked = likedBy.includes(userId); const newLikedBy = hasLiked ? likedBy.filter(id => id !== userId) : [...likedBy, userId]; await updateDoc(ref, { likedBy: newLikedBy, likesCount: newLikedBy.length, updatedAt: new Date().toISOString() }); } } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/guides/${guideId}`); }
} export async function toggleBookmarkGuide( clubId: string, guideId: string, userId: string
): Promise<void> { if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_GUIDES[clubId] || DEFAULT_CLUB_GUIDES['club_logic_guild']; if (list) { const g = list.find(guide => guide.id === guideId); if (g) { if (!g.bookmarkedBy) g.bookmarkedBy = []; const hasBookmarked = g.bookmarkedBy.includes(userId); if (hasBookmarked) { g.bookmarkedBy = g.bookmarkedBy.filter(id => id !== userId); g.bookmarksCount = Math.max(0, g.bookmarksCount - 1); } else { g.bookmarkedBy.push(userId); g.bookmarksCount += 1; } } } return; } try { const ref = doc(db, 'clubs', clubId, 'guides', guideId); const snap = await getDoc(ref); if (snap.exists()) { const g = snap.data() as ClubGuide; const bBy = g.bookmarkedBy || []; const hasBookmarked = bBy.includes(userId); const newBookmarkedBy = hasBookmarked ? bBy.filter(id => id !== userId) : [...bBy, userId]; await updateDoc(ref, { bookmarkedBy: newBookmarkedBy, bookmarksCount: newBookmarkedBy.length, updatedAt: new Date().toISOString() }); } } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/guides/${guideId}`); }
} export async function incrementGuideViewCount( clubId: string, guideId: string
): Promise<void> { if (clubId.startsWith('club_') || !db) { const list = DEFAULT_CLUB_GUIDES[clubId] || DEFAULT_CLUB_GUIDES['club_logic_guild']; if (list) { const g = list.find(guide => guide.id === guideId); if (g) g.viewsCount += 1; } return; } try { const ref = doc(db, 'clubs', clubId, 'guides', guideId); const snap = await getDoc(ref); if (snap.exists()) { const g = snap.data() as ClubGuide; await updateDoc(ref, { viewsCount: (g.viewsCount || 0) + 1 }); } } catch (err) { handleFirestoreError(err, OperationType.WRITE, `clubs/${clubId}/guides/${guideId}`); }
} // ==========================================
// Phase 83 Services — Moderation & Safety /* ========================================== */
 const localReports: ContentReport[] = [];
const localBlocks: UserBlock[] = [];
const localMutes: UserMute[] = [];
const localModActions: ModerationAction[] = []; export async function createReport(report: Omit<ContentReport, 'id'>): Promise<ContentReport> { const newId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`; const fullReport: ContentReport = { ...report, id: newId }; if (!db) { localReports.push(fullReport); return fullReport; } try { const ref = doc(db, 'reports', newId); await setDoc(ref, fullReport); return fullReport; } catch (err) { handleFirestoreError(err, OperationType.CREATE, `reports/${newId}`); localReports.push(fullReport); return fullReport; }
} export async function fetchReports(): Promise<ContentReport[]> { if (!db) return localReports; try { const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50)); const snap = await getDocs(q); return snap.docs.map(d => d.data() as ContentReport); } catch (err) { handleFirestoreError(err, OperationType.LIST, 'reports'); return localReports; }
} export async function updateReportStatus(reportId: string, status: ContentReport['status'], actionTaken?: string): Promise<void> { if (!db) { const rep = localReports.find(r => r.id === reportId); if (rep) { rep.status = status; if (actionTaken) rep.actionTaken = actionTaken; rep.resolvedAt = new Date().toISOString(); } return; } try { const ref = doc(db, 'reports', reportId); await updateDoc(ref, { status, actionTaken: actionTaken || '', resolvedAt: new Date().toISOString() }); } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`); }
} export async function submitModerationAction(action: Omit<ModerationAction, 'id'>): Promise<ModerationAction> { const newId = `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`; const fullAction: ModerationAction = { ...action, id: newId }; if (!db) { localModActions.push(fullAction); return fullAction; } try { await setDoc(doc(db, 'moderationActions', newId), fullAction); return fullAction; } catch (err) { handleFirestoreError(err, OperationType.CREATE, `moderationActions/${newId}`); localModActions.push(fullAction); return fullAction; }
} export async function blockUser(userId: string, blockedUserId: string): Promise<void> { const newId = `block_${userId}_${blockedUserId}`; const record: UserBlock = { id: newId, userId, blockedUserId, createdAt: new Date().toISOString() }; if (!db) { localBlocks.push(record); return; } try { await setDoc(doc(db, 'userBlocks', newId), record); } catch (err) { handleFirestoreError(err, OperationType.CREATE, `userBlocks/${newId}`); }
} export async function unblockUser(userId: string, blockedUserId: string): Promise<void> { const newId = `block_${userId}_${blockedUserId}`; if (!db) { const idx = localBlocks.findIndex(b => b.id === newId); if (idx !== -1) localBlocks.splice(idx, 1); return; } try { await setDoc(doc(db, 'userBlocks', newId), { active: false }); } catch (err) { handleFirestoreError(err, OperationType.DELETE, `userBlocks/${newId}`); }
} export async function fetchBlockedUsers(userId: string): Promise<string[]> { if (!db) return localBlocks.filter(b => b.userId === userId).map(b => b.blockedUserId); try { const q = query(collection(db, 'userBlocks'), where('userId', '==', userId)); const snap = await getDocs(q); return snap.docs.map(d => (d.data() as UserBlock).blockedUserId); } catch (err) { handleFirestoreError(err, OperationType.LIST, 'userBlocks'); return []; }
} // ==========================================
// Phase 84 Services — Player Wall & Social Feed /* ========================================== */
 const localWallPosts: Record<string, PlayerWallPost[]> = {};
const localSocialFeed: SocialFeedItem[] = [ { id: 'feed_1', userId: 'user_maria', userName: 'Maria Lopez', userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Maria', titleFlair: 'Grand Master', activityType: 'pb', details: 'Set a new Personal Best on Laser Mirror Level 5 (Time: 42s)!', puzzleType: 'laser_mirror', timeSeconds: 42, score: 1250, likesCount: 5, likedBy: [], createdAt: new Date(Date.now() - 3600000).toISOString(), }, { id: 'feed_2', userId: 'user_alex', userName: 'Alex Chen', userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex', titleFlair: 'Logic Wizard', activityType: 'badge', details: 'Unlocked Gold Mastery Badge in Logic Puzzles!', puzzleType: 'logic', likesCount: 8, likedBy: [], createdAt: new Date(Date.now() - 7200000).toISOString(), },
];
const localKudos: KudosGift[] = []; export async function fetchPlayerWallPosts(profileUserId: string): Promise<PlayerWallPost[]> { if (!db) return localWallPosts[profileUserId] || []; try { const q = query(collection(db, 'users', profileUserId, 'wall'), orderBy('createdAt', 'desc'), limit(30)); const snap = await getDocs(q); return snap.docs.map(d => d.data() as PlayerWallPost); } catch (err) { handleFirestoreError(err, OperationType.LIST, `users/${profileUserId}/wall`); return localWallPosts[profileUserId] || []; }
} export async function addPlayerWallPost(post: Omit<PlayerWallPost, 'id'>): Promise<PlayerWallPost> { const newId = `wall_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`; const fullPost: PlayerWallPost = { ...post, id: newId }; if (!db) { if (!localWallPosts[post.profileUserId]) localWallPosts[post.profileUserId] = []; localWallPosts[post.profileUserId].unshift(fullPost); return fullPost; } try { const ref = doc(db, 'users', post.profileUserId, 'wall', newId); await setDoc(ref, fullPost); return fullPost; } catch (err) { handleFirestoreError(err, OperationType.CREATE, `users/${post.profileUserId}/wall/${newId}`); if (!localWallPosts[post.profileUserId]) localWallPosts[post.profileUserId] = []; localWallPosts[post.profileUserId].unshift(fullPost); return fullPost; }
} export async function deletePlayerWallPost(postId: string): Promise<void> { if (!db) { Object.keys(localWallPosts).forEach(k => { localWallPosts[k] = localWallPosts[k].filter(p => p.id !== postId); }); return; } try { /* Attempt delete */
 } catch (err) { /* fallback */
 }
} export async function toggleLikeWallPost(postId: string, userId: string): Promise<PlayerWallPost> { let postToUpdate: PlayerWallPost | undefined; Object.keys(localWallPosts).forEach(k => { const found = localWallPosts[k].find(p => p.id === postId); if (found) postToUpdate = found; }); if (postToUpdate) { const liked = postToUpdate.likedBy.includes(userId); postToUpdate.likedBy = liked ? postToUpdate.likedBy.filter(id => id !== userId) : [...postToUpdate.likedBy, userId]; postToUpdate.likesCount = postToUpdate.likedBy.length; return postToUpdate; } /* Fallback default */
return  { id: postId, profileUserId: 'unknown', authorId: userId, authorName: 'You', authorAvatar: '', content: '', likesCount: 1, likedBy: [userId], createdAt: new Date().toISOString() };
} export async function fetchSocialFeed(): Promise<SocialFeedItem[]> { if (!db) return localSocialFeed; try { const q = query(collection(db, 'socialFeed'), orderBy('createdAt', 'desc'), limit(30)); const snap = await getDocs(q); if (snap.empty) return localSocialFeed; return snap.docs.map(d => d.data() as SocialFeedItem); } catch (err) { handleFirestoreError(err, OperationType.LIST, 'socialFeed'); return localSocialFeed; }
} export async function publishSocialActivity(item: Omit<SocialFeedItem, 'id'>): Promise<SocialFeedItem> { const newId = `feed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`; const fullItem: SocialFeedItem = { ...item, id: newId }; if (!db) { localSocialFeed.unshift(fullItem); return fullItem; } try { await setDoc(doc(db, 'socialFeed', newId), fullItem); return fullItem; } catch (err) { handleFirestoreError(err, OperationType.CREATE, `socialFeed/${newId}`); localSocialFeed.unshift(fullItem); return fullItem; }
} export async function sendKudosGift(gift: Omit<KudosGift, 'id'>): Promise<KudosGift> { const newId = `kudos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`; const fullGift: KudosGift = { ...gift, id: newId }; if (!db) { localKudos.push(fullGift); return fullGift; } try { await setDoc(doc(db, 'kudosGifts', newId), fullGift); return fullGift; } catch (err) { handleFirestoreError(err, OperationType.CREATE, `kudosGifts/${newId}`); localKudos.push(fullGift); return fullGift; }
} export async function fetchUserKudos(userId: string): Promise<KudosGift[]> { if (!db) return localKudos.filter(k => k.receiverId === userId); try { const q = query(collection(db, 'kudosGifts'), where('receiverId', '==', userId)); const snap = await getDocs(q); return snap.docs.map(d => d.data() as KudosGift); } catch (err) { handleFirestoreError(err, OperationType.LIST, 'kudosGifts'); return localKudos.filter(k => k.receiverId === userId); }
} export async function fetchHeadToHeadStats(userId: string, opponentId: string): Promise<HeadToHeadStats> { 
  return { userId, opponentId, totalMatches: 8, wins: 5, losses: 3, draws: 0, bestScoreDiff: 150, bestTimeDiff: 12 };
} 

// ==========================================
// Daily Bonus Rewards Services (Firestore Idempotent & Spark Plan Ready)
// ==========================================
export const DAILY_REWARD_TIERS = [
  { day: 1, coins: 50, xp: 50 },
  { day: 2, coins: 75, xp: 75 },
  { day: 3, coins: 100, xp: 100 },
  { day: 4, coins: 150, xp: 150 },
  { day: 5, coins: 200, xp: 200 },
  { day: 6, coins: 250, xp: 250 },
  { day: 7, coins: 500, xp: 500 },
];

export async function fetchDailyRewardStatus(userId: string): Promise<{ hasClaimedToday: boolean; currentStreak: number; lastClaimDate?: string }> {
  const todayUTC = new Date().toISOString().split('T')[0];
  if (!userId || userId === 'guest' || userId.startsWith('guest_')) {
    try {
      const local = localStorage.getItem(`pv_daily_reward_guest`);
      if (local) {
        const parsed = JSON.parse(local);
        return { hasClaimedToday: parsed.lastClaimDate === todayUTC, currentStreak: parsed.currentStreak || 1, lastClaimDate: parsed.lastClaimDate };
      }
    } catch {}
    return { hasClaimedToday: false, currentStreak: 1 };
  }

  try {
    const snap = await getDoc(doc(db, 'dailyRewards', userId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        hasClaimedToday: data.lastClaimDate === todayUTC,
        currentStreak: data.streak || 1,
        lastClaimDate: data.lastClaimDate
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `dailyRewards/${userId}`);
  }
  return { hasClaimedToday: false, currentStreak: 1 };
}

export async function claimDailyRewardInFirestore(userId: string, currentUserProfile: UserProfile): Promise<{ success: boolean; coins: number; xp: number; streak: number; newXp: number; newLevel: number; message?: string }> {
  const todayUTC = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!userId || userId.startsWith('guest_') || userId === 'guest') {
    let streak = 1;
    try {
      const local = localStorage.getItem(`pv_daily_reward_guest`);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.lastClaimDate === todayUTC) {
          return { success: false, coins: 0, xp: 0, streak: parsed.currentStreak || 1, newXp: currentUserProfile.xp, newLevel: currentUserProfile.level, message: "Already claimed today" };
        }
        streak = parsed.lastClaimDate === yesterday ? (parsed.currentStreak || 1) + 1 : 1;
      }
    } catch {}
    const dayIndex = ((streak - 1) % 7);
    const reward = DAILY_REWARD_TIERS[dayIndex];
    const newXp = (currentUserProfile.xp || 0) + reward.xp;
    const newLevel = Math.floor(newXp / 250) + 1;
    try {
      localStorage.setItem(`pv_daily_reward_guest`, JSON.stringify({ lastClaimDate: todayUTC, currentStreak: streak }));
    } catch {}
    return { success: true, coins: reward.coins, xp: reward.xp, streak, newXp, newLevel };
  }

  try {
    const rewardRef = doc(db, 'dailyRewards', userId);
    const userRef = doc(db, 'users', userId);

    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(rewardRef);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('User profile not found');
      }
      const userData = userSnap.data() as UserProfile;

      let streak = 1;
      if (snap.exists()) {
        const data = snap.data();
        if (data.lastClaimDate === todayUTC) {
          return { 
            success: false, 
            coins: 0, 
            xp: 0, 
            streak: data.streak || 1, 
            newXp: userData.xp, 
            newLevel: userData.level, 
            message: "Already claimed today" 
          };
        }
        streak = data.lastClaimDate === yesterday ? (data.streak || 1) + 1 : 1;
      } else {
        streak = userData.currentStreak || 1;
      }

      const dayIndex = ((streak - 1) % 7);
      const reward = DAILY_REWARD_TIERS[dayIndex];
      const newXp = (userData.xp || 0) + reward.xp;
      const newLevel = Math.floor(newXp / 250) + 1;
      const newCoins = (userData.coins || 0) + reward.coins;

      transaction.set(rewardRef, {
        userId,
        lastClaimDate: todayUTC,
        claimedAt: new Date().toISOString(),
        streak,
        dayIndex: dayIndex + 1,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      transaction.update(userRef, {
        xp: newXp,
        level: newLevel,
        coins: newCoins,
        currentStreak: streak,
        longestStreak: Math.max(userData.longestStreak || 1, streak),
        updatedAt: new Date().toISOString()
      });

      return { 
        success: true, 
        coins: reward.coins, 
        xp: reward.xp, 
        streak, 
        newXp, 
        newLevel,
        dayIndex
      };
    });

    if (result.success) {
      // Sync public profile stats
      syncPublicProfile({
        uid: userId,
        xp: result.newXp,
        level: result.newLevel,
        currentStreak: result.streak
      }).catch(() => {});

      if ((result as any).dayIndex !== undefined) {
        await addDoc(collection(db, 'notifications'), {
          userId,
          title: "DAILY REWARD CLAIMED!",
          message: `Day ${(result as any).dayIndex + 1} streak! Claimed +${result.xp} XP & +${result.coins} Coins!`,
          type: 'reward',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    return result;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `dailyRewards/${userId}`);
    throw err;
  }
}

export async function claimAchievementRewardInFirestore(
  userId: string,
  achievementId: string,
  _clientRewardXP?: number,
  _clientRewardCoins?: number
): Promise<{ success: boolean; newXp: number; newCoins: number; newLevel: number }> {
  if (!userId || userId.startsWith('guest_') || userId === 'guest') {
    const ach = DEFAULT_ACHIEVEMENTS.find(a => a.id === achievementId);
    const xp = ach?.xpReward || 100;
    const coins = ach?.coinsReward || 50;
    return { success: true, newXp: xp, newCoins: coins, newLevel: 1 };
  }

  const canonicalAch = DEFAULT_ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!canonicalAch) {
    throw new Error(`Invalid achievement ID: ${achievementId}`);
  }

  const rewardXP = canonicalAch.xpReward;
  const rewardCoins = canonicalAch.coinsReward;
  const userRef = doc(db, 'users', userId);

  const res = await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    const u = userSnap.data() as UserProfile;

    // Idempotent check: if already claimed, exit without double-rewarding
    if (u.achievements && u.achievements[achievementId]) {
      return {
        success: false,
        newXp: u.xp,
        newCoins: u.coins,
        newLevel: u.level
      };
    }

    // Server-verified eligibility against Firestore document data
    let isEligible = false;
    const totalGames = u.totalGames || 0;
    const totalWins = u.totalWins || 0;
    const bestTime = u.bestTime || 0;
    const currentStreak = u.currentStreak || 1;
    const longestStreak = u.longestStreak || 1;
    const effectiveStreak = Math.max(currentStreak, longestStreak);
    const level = u.level || 1;

    switch (achievementId) {
      case 'first_win':
        isEligible = totalWins >= 1 || totalGames >= 1;
        break;
      case 'puzzle_novice':
        isEligible = totalGames >= 5;
        break;
      case 'speed_demon':
        isEligible = bestTime > 0 && bestTime <= 30;
        break;
      case 'math_genius':
        isEligible = totalWins >= 5;
        break;
      case 'word_smith':
        isEligible = totalWins >= 5;
        break;
      case 'laser_wizard':
        isEligible = totalWins >= 3;
        break;
      case 'streak_3':
        isEligible = effectiveStreak >= 3;
        break;
      case 'level_5':
        isEligible = level >= 5;
        break;
      default:
        isEligible = false;
        break;
    }

    if (!isEligible) {
      throw new Error(`Eligibility requirements for "${canonicalAch.title}" are not yet satisfied.`);
    }

    const newXp = (u.xp || 0) + rewardXP;
    const newCoins = (u.coins || 0) + rewardCoins;
    const newLevel = Math.floor(newXp / 250) + 1;

    transaction.update(userRef, {
      [`achievements.${achievementId}`]: true,
      xp: newXp,
      coins: newCoins,
      level: newLevel,
      updatedAt: new Date().toISOString()
    });

    return { success: true, newXp, newCoins, newLevel };
  });

  if (res.success) {
    syncPublicProfile({
      uid: userId,
      xp: res.newXp,
      level: res.newLevel
    }).catch(() => {});

    await addDoc(collection(db, 'notifications'), {
      userId,
      title: "ACHIEVEMENT UNLOCKED!",
      message: `Unlocked "${canonicalAch.title}"! Claimed +${rewardXP} XP & +${rewardCoins} Coins!`,
      type: 'achievement',
      isRead: false,
      createdAt: new Date().toISOString()
    }).catch(() => {});
  }

  return res;
}

export async function fetchUserNotifications(userId: string): Promise<NotificationItem[]> {
  if (!userId || userId.startsWith('guest_')) return [];
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(30)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }) as NotificationItem);
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!notificationId) return;
  try {
    const ref = doc(db, 'notifications', notificationId);
    await updateDoc(ref, { isRead: true });
  } catch (err) {
    console.error('Failed to mark notification read:', err);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!userId || userId.startsWith('guest_')) return;
  try {
    const items = await fetchUserNotifications(userId);
    const unread = items.filter(i => !i.isRead);
    await Promise.all(unread.map(item => updateDoc(doc(db, 'notifications', item.id), { isRead: true })));
  } catch (err) {
    console.error('Failed to mark all notifications read:', err);
  }
}

export { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged
};
