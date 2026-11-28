import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

function makeClient(name) {
  const app = initializeApp(config, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  return { app, auth, db };
}

async function expectDenied(label, fn) {
  try {
    await fn();
    throw new Error(`SECURITY FAILURE — expected DENY but succeeded: ${label}`);
  } catch (err) {
    const code = err?.code || '';
    const msg = err?.message || '';
    if (msg.startsWith('SECURITY FAILURE')) throw err;
    if (!code.includes('permission-denied') && !msg.includes('PERMISSION_DENIED') && !msg.includes('insufficient permissions')) {
      throw new Error(`Unexpected non-permission error for "${label}": ${code} ${msg}`);
    }
    console.log(`[PASS DENY] ${label}`);
  }
}

async function expectAllowed(label, fn) {
  await fn();
  console.log(`[PASS ALLOW] ${label}`);
}

async function runTests() {
  const anon = makeClient('anon');
  const clientA = makeClient('userA');
  const clientB = makeClient('userB');
  const clientSpoof = makeClient('spoofAdmin');

  const credA = await createUserWithEmailAndPassword(clientA.auth, `usera_${Date.now()}@example.com`, 'StrongPass!123');
  const credB = await createUserWithEmailAndPassword(clientB.auth, `userb_${Date.now()}@example.com`, 'StrongPass!123');
  // Unverified password account using admin email MUST NOT gain admin powers
  const credSpoof = await createUserWithEmailAndPassword(clientSpoof.auth, 'jambujain1975@gmail.com', 'StrongPass!123').catch(async () =>
    signInWithEmailAndPassword(clientSpoof.auth, 'jambujain1975@gmail.com', 'StrongPass!123')
  );

  const uidA = credA.user.uid;
  const uidB = credB.user.uid;
  const now = new Date().toISOString();

  // 1. Logged-out reads on private collections
  await expectDenied('Logged-out read socialFeed', () => getDocs(collection(anon.db, 'socialFeed')));
  await expectDenied('Logged-out read personalBestHistory', () => getDocs(collection(anon.db, 'personalBestHistory')));
  await expectDenied('Logged-out read /users/userA', () => getDoc(doc(anon.db, 'users', uidA)));
  await expectDenied('Logged-out read /gameSessions', () => getDocs(collection(anon.db, 'gameSessions')));
  await expectDenied('Logged-out read /userBlocks', () => getDocs(collection(anon.db, 'userBlocks')));

  // 2. Unverified admin email spoofing
  await expectDenied('Unverified admin email cannot create ADMIN role', () =>
    setDoc(doc(clientSpoof.db, 'users', credSpoof.user.uid), {
      uid: credSpoof.user.uid,
      username: 'spoof',
      role: 'ADMIN',
      level: 1,
      xp: 0,
    })
  );
  await expectDenied('Unverified admin email cannot read reports', () => getDocs(collection(clientSpoof.db, 'reports')));

  // 3. Profile creation & privilege/bounds checks
  await expectDenied('UserA cannot create profile with ADMIN role', () =>
    setDoc(doc(clientA.db, 'users', uidA), {
      uid: uidA,
      username: 'alice',
      role: 'ADMIN',
      level: 1,
      xp: 0,
    })
  );
  await expectAllowed('UserA creates valid PLAYER profile', () =>
    setDoc(doc(clientA.db, 'users', uidA), {
      uid: uidA,
      username: 'alice',
      displayName: 'Alice',
      email: credA.user.email,
      avatarUrl: 'https://example.com/a.png',
      role: 'PLAYER',
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
      createdAt: now,
      updatedAt: now,
    })
  );
  await expectAllowed('UserA reads own profile', () => getDoc(doc(clientA.db, 'users', uidA)));
  await expectDenied('UserB cannot read UserA private profile', () => getDoc(doc(clientB.db, 'users', uidA)));
  await expectDenied('UserA cannot escalate own role on update', () =>
    updateDoc(doc(clientA.db, 'users', uidA), { role: 'ADMIN' })
  );
  await expectDenied('UserA cannot grant +9999 XP on update', () =>
    updateDoc(doc(clientA.db, 'users', uidA), { xp: 9999 })
  );
  await expectDenied('UserA cannot set negative coins', () =>
    updateDoc(doc(clientA.db, 'users', uidA), { coins: -50 })
  );
  await expectAllowed('UserA updates valid gameplay progression + stats', () =>
    updateDoc(doc(clientA.db, 'users', uidA), {
      xp: 100,
      level: 1,
      totalGames: 1,
      totalWins: 1,
      bestScore: 800,
      bestTime: 25,
      coins: 120,
      updatedAt: new Date().toISOString(),
    })
  );

  // 4. publicProfiles sanitization
  await expectDenied('publicProfiles rejects email PII', () =>
    setDoc(doc(clientA.db, 'publicProfiles', uidA), {
      uid: uidA,
      username: 'alice',
      email: 'alice@example.com',
    })
  );
  await expectAllowed('publicProfiles allows sanitized public card', () =>
    setDoc(doc(clientA.db, 'publicProfiles', uidA), {
      uid: uidA,
      username: 'alice',
      displayName: 'Alice',
      level: 1,
      xp: 100,
      updatedAt: now,
    })
  );

  // 5. Player wall isolation
  const clientC = makeClient('userC');
  const credC = await createUserWithEmailAndPassword(clientC.auth, `userc_${Date.now()}@example.com`, 'StrongPass!123');
  const uidC = credC.user.uid;
  const wallRefA = doc(clientA.db, 'users', uidB, 'wall', 'post_1');
  await expectAllowed('UserA posts on UserB wall', () =>
    setDoc(wallRefA, {
      id: 'post_1',
      profileUserId: uidB,
      authorId: uidA,
      authorName: 'Alice',
      content: 'Nice solve!',
      likesCount: 0,
      likedBy: [],
      createdAt: now,
    })
  );
  await expectDenied('Third-party UserC cannot spoof authorId on UserB wall', () =>
    setDoc(doc(clientC.db, 'users', uidB, 'wall', 'post_spoof'), {
      id: 'post_spoof',
      profileUserId: uidB,
      authorId: uidA,
      authorName: 'Alice',
      content: 'Spoofed!',
      likesCount: 0,
      likedBy: [],
      createdAt: now,
    })
  );
  await expectDenied('UserB cannot edit UserA post', () =>
    updateDoc(doc(clientB.db, 'users', uidB, 'wall', 'post_1'), { content: 'Tampered' })
  );
  await expectDenied('Third-party UserC cannot delete UserA post on UserB wall', () =>
    deleteDoc(doc(clientC.db, 'users', uidB, 'wall', 'post_1'))
  );
  await expectAllowed('Profile owner UserB can delete post on own wall', () =>
    deleteDoc(doc(clientB.db, 'users', uidB, 'wall', 'post_1'))
  );

  // 5b. Daily reward idempotency & achievements verification
  await expectAllowed('UserA claims Day 1 dailyReward', () =>
    setDoc(doc(clientA.db, 'dailyRewards', uidA), {
      userId: uidA,
      lastClaimDate: '2026-11-28',
      claimedAt: now,
      streak: 1,
      dayIndex: 1,
      updatedAt: now,
    })
  );
  await expectDenied('UserA cannot double-claim dailyReward on same date', () =>
    updateDoc(doc(clientA.db, 'dailyRewards', uidA), {
      lastClaimDate: '2026-11-28',
      streak: 2,
      updatedAt: now,
    })
  );
  await expectDenied('UserA cannot forge dailyReward streak jump', () =>
    updateDoc(doc(clientA.db, 'dailyRewards', uidA), {
      lastClaimDate: '2026-11-29',
      streak: 7,
      updatedAt: now,
    })
  );

  // 5c. Challenges 2.0 anti-hijack
  await expectAllowed('UserA creates pre-assigned challenge for UserB', () =>
    setDoc(doc(clientA.db, 'challenges', 'ch_duel_1'), {
      id: 'ch_duel_1',
      creatorUid: uidA,
      creatorName: 'Alice',
      opponentUid: uidB,
      opponentName: 'Bob',
      puzzleType: 'number',
      difficulty: 'medium',
      targetScore: 500,
      targetTime: 60,
      seed: 12345,
      status: 'PENDING',
      createdAt: now,
      expiresAt: now,
    })
  );
  await expectDenied('UserC cannot hijack pre-assigned challenge', () =>
    updateDoc(doc(clientC.db, 'challenges', 'ch_duel_1'), {
      winnerUid: uidC,
      status: 'COMPLETED',
    })
  );
  await expectAllowed('Assigned opponent UserB updates challenge result', () =>
    updateDoc(doc(clientB.db, 'challenges', 'ch_duel_1'), {
      opponentScore: 600,
      opponentTime: 40,
      status: 'COMPLETED',
      winnerUid: uidB,
    })
  );

  // 5d. Community puzzles author lock
  await expectAllowed('UserA creates community puzzle', () =>
    setDoc(doc(clientA.db, 'communityPuzzles', 'cp_1'), {
      id: 'cp_1',
      creatorId: uidA,
      creatorName: 'Alice',
      title: 'Logic Grid 1',
      description: 'Fun puzzle',
      puzzleType: 'logic',
      puzzleData: '{"seed":1}',
      difficulty: 'medium',
      status: 'published',
      plays: 0,
      likes: 0,
      createdAt: now,
    })
  );
  await expectDenied('UserB cannot overwrite UserA community puzzle content', () =>
    updateDoc(doc(clientB.db, 'communityPuzzles', 'cp_1'), {
      title: 'Defaced',
      puzzleData: '{"seed":999}',
    })
  );
  await expectDenied('UserB cannot delete UserA community puzzle', () =>
    deleteDoc(doc(clientB.db, 'communityPuzzles', 'cp_1'))
  );

  // 6. userBlocks isolation & unblock fix
  await expectAllowed('UserA blocks UserB', () =>
    setDoc(doc(clientA.db, 'userBlocks', `block_${uidA}_${uidB}`), {
      id: `block_${uidA}_${uidB}`,
      userId: uidA,
      blockedUserId: uidB,
      createdAt: now,
    })
  );
  await expectDenied('UserB cannot read UserA block list', () =>
    getDocs(query(collection(clientB.db, 'userBlocks'), where('userId', '==', uidA)))
  );
  await expectDenied('UserB cannot delete UserA block', () =>
    deleteDoc(doc(clientB.db, 'userBlocks', `block_${uidA}_${uidB}`))
  );
  await expectAllowed('UserA unblocks UserB via deleteDoc', () =>
    deleteDoc(doc(clientA.db, 'userBlocks', `block_${uidA}_${uidB}`))
  );

  // 7. gameSessions & personalBestHistory privacy + journey/mastery/practice reads
  await expectAllowed('UserA creates gameSession', () =>
    setDoc(doc(clientA.db, 'gameSessions', 'sess_1'), {
      userId: uidA,
      puzzleType: 'number',
      difficulty: 'medium',
      score: 500,
      timeSeconds: 20,
      moves: 10,
      won: true,
      createdAt: now,
    })
  );
  await expectDenied('UserB cannot read UserA gameSession', () =>
    getDoc(doc(clientB.db, 'gameSessions', 'sess_1'))
  );
  await expectAllowed('UserA reads own journeyProgress (when absent or present)', () =>
    getDoc(doc(clientA.db, 'journeyProgress', uidA))
  );
  await expectAllowed('UserA saves own journeyProgress', () =>
    setDoc(doc(clientA.db, 'journeyProgress', uidA), {
      userId: uidA,
      completedStageIds: ['stage_1_1'],
      currentStageId: 'stage_1_2',
      updatedAt: now,
    })
  );

  // 8. Leaderboards validation & monotonic improvement
  await expectAllowed('UserA posts valid leaderboard entry', () =>
    setDoc(doc(clientA.db, 'leaderboards', `${uidA}_number_ALL_TIME`), {
      userId: uidA,
      username: 'alice',
      displayName: 'Alice',
      avatarUrl: 'https://example.com/a.png',
      period: 'ALL_TIME',
      periodKey: 'all',
      puzzleType: 'number',
      difficulty: 'medium',
      score: 500,
      bestTime: 20,
      updatedAt: now,
    })
  );
  await expectDenied('UserB cannot tamper with UserA leaderboard entry', () =>
    updateDoc(doc(clientB.db, 'leaderboards', `${uidA}_number_ALL_TIME`), { score: 9999 })
  );
  await expectDenied('UserA cannot exceed leaderboard max score 50000', () =>
    updateDoc(doc(clientA.db, 'leaderboards', `${uidA}_number_ALL_TIME`), { score: 999999 })
  );

  // 9. Clubs security
  await expectAllowed('UserA creates club', () =>
    setDoc(doc(clientA.db, 'clubs', 'c_legit'), {
      id: 'c_legit',
      name: 'Logic Masters',
      tag: 'LOGC',
      description: 'Puzzle solvers',
      ownerUid: uidA,
      ownerName: 'Alice',
      adminUids: [],
      memberCount: 1,
      maxMembers: 30,
      weeklyPoints: 100,
      totalClubXP: 100,
      level: 1,
      privacy: 'public',
      primaryFocus: 'logic',
      totalPuzzlesSolved: 0,
      createdAt: now,
      updatedAt: now,
    })
  );
  await expectDenied('UserB cannot hijack UserA club ownerUid', () =>
    updateDoc(doc(clientB.db, 'clubs', 'c_legit'), { ownerUid: uidB, name: 'Pwned' })
  );
  await expectDenied('UserB cannot self-join club with OWNER role', () =>
    setDoc(doc(clientB.db, 'clubs', 'c_legit', 'members', `c_legit_${uidB}`), {
      id: `c_legit_${uidB}`,
      clubId: 'c_legit',
      userId: uidB,
      displayName: 'Bob',
      avatarUrl: 'https://example.com/b.png',
      role: 'OWNER',
      totalContributionXP: 0,
      weeklyContributionXP: 0,
      joinedAt: now,
      lastActiveAt: now,
    })
  );
  await expectAllowed('UserB joins club legitimately as MEMBER', async () => {
    await updateDoc(doc(clientB.db, 'clubs', 'c_legit'), { memberCount: 2, updatedAt: now });
    await setDoc(doc(clientB.db, 'clubs', 'c_legit', 'members', `c_legit_${uidB}`), {
      id: `c_legit_${uidB}`,
      clubId: 'c_legit',
      userId: uidB,
      displayName: 'Bob',
      avatarUrl: 'https://example.com/b.png',
      role: 'MEMBER',
      totalContributionXP: 0,
      weeklyContributionXP: 0,
      joinedAt: now,
      lastActiveAt: now,
    });
    await setDoc(doc(clientB.db, 'clubMembers', `c_legit_${uidB}`), {
      id: `c_legit_${uidB}`,
      clubId: 'c_legit',
      userId: uidB,
      displayName: 'Bob',
      avatarUrl: 'https://example.com/b.png',
      role: 'MEMBER',
      totalContributionXP: 0,
      weeklyContributionXP: 0,
      joinedAt: now,
      lastActiveAt: now,
    });
    await addDoc(collection(clientB.db, 'clubs', 'c_legit', 'messages'), {
      clubId: 'c_legit',
      userId: 'system',
      userName: 'System',
      userAvatar: '',
      message: 'Bob joined!',
      isSystemActivity: true,
      createdAt: now,
    });
  });

  // 10. Kudos spoofing & unknown collection deny
  await expectDenied('UserA cannot forge kudos with senderId=UserB', () =>
    setDoc(doc(clientA.db, 'kudosGifts', 'k_fake'), {
      id: 'k_fake',
      senderId: uidB,
      receiverId: uidA,
      giftType: 'kudos',
      xpValue: 15,
      createdAt: now,
    })
  );
  await expectDenied('Unknown collection denied', () =>
    getDoc(doc(clientA.db, 'secretAdminDump', 'x'))
  );

  console.log('\nALL EMULATOR SECURITY & FUNCTIONAL CHECKS PASSED!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
