"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advanceTournamentMatch = exports.startTournament = exports.joinTournament = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const db = admin.firestore();
exports.joinTournament = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { tournamentId } = data;
    if (!tournamentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing tournamentId.');
    }
    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    const participantsRef = tournamentRef.collection('participants').doc(uid);
    return await db.runTransaction(async (transaction) => {
        const tournamentDoc = await transaction.get(tournamentRef);
        if (!tournamentDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Tournament not found.');
        }
        const tournament = tournamentDoc.data();
        if (tournament.status !== 'registration') {
            throw new functions.https.HttpsError('failed-precondition', 'Tournament is not open for registration.');
        }
        if (tournament.participantsCount >= tournament.capacity) {
            throw new functions.https.HttpsError('resource-exhausted', 'Tournament is full.');
        }
        if (tournament.registrationDeadline && tournament.registrationDeadline.toMillis() < Date.now()) {
            throw new functions.https.HttpsError('failed-precondition', 'Registration deadline has passed.');
        }
        const participantDoc = await transaction.get(participantsRef);
        if (participantDoc.exists) {
            throw new functions.https.HttpsError('already-exists', 'You are already registered for this tournament.');
        }
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User profile not found.');
        }
        const profile = userDoc.data();
        const participantData = {
            uid,
            displayName: profile.displayName || 'Unknown',
            avatarUrl: profile.avatarUrl || null,
            registeredAt: admin.firestore.FieldValue.serverTimestamp(),
            eliminated: false,
        };
        transaction.set(participantsRef, participantData);
        const newCount = tournament.participantsCount + 1;
        const updates = { participantsCount: newCount };
        if (newCount >= tournament.capacity) {
            updates.status = 'full';
        }
        transaction.update(tournamentRef, updates);
        return { success: true, message: 'Successfully joined the tournament.' };
    });
});
exports.startTournament = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const uid = context.auth.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.data()?.role !== 'ADMIN') {
        throw new functions.https.HttpsError('permission-denied', 'Admin only.');
    }
    const { tournamentId } = data;
    if (!tournamentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing tournamentId.');
    }
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    return await db.runTransaction(async (transaction) => {
        const tournamentDoc = await transaction.get(tournamentRef);
        if (!tournamentDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Tournament not found.');
        }
        const tournament = tournamentDoc.data();
        if (tournament.status === 'active' || tournament.status === 'completed' || tournament.status === 'cancelled') {
            throw new functions.https.HttpsError('failed-precondition', 'Tournament cannot be started.');
        }
        // Get all participants
        const participantsSnap = await transaction.get(tournamentRef.collection('participants'));
        const participants = participantsSnap.docs.map(d => d.data());
        if (participants.length < 2) {
            throw new functions.https.HttpsError('failed-precondition', 'Not enough players to start.');
        }
        // Determine the closest power of 2 for bracket generation (2, 4, 8, 16, 32)
        const capacity = tournament.capacity;
        const totalRounds = Math.log2(capacity); // e.g. 16 capacity = 4 rounds
        if (!Number.isInteger(totalRounds)) {
            throw new functions.https.HttpsError('failed-precondition', 'Tournament capacity must be a power of 2.');
        }
        // Shuffle participants randomly
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        // Create matches
        const matchDocsToCreate = [];
        let previousRoundMatchIds = [];
        for (let round = totalRounds; round >= 1; round--) {
            const matchesInRound = Math.pow(2, totalRounds - round);
            const currentRoundMatchIds = [];
            for (let i = 0; i < matchesInRound; i++) {
                const matchId = `R${round}_M${i + 1}`;
                let nextMatchId = undefined;
                if (round < totalRounds) {
                    const parentIndex = Math.floor(i / 2);
                    nextMatchId = previousRoundMatchIds[parentIndex];
                }
                let pA = null;
                let pB = null;
                let status = 'pending';
                if (round === 1) {
                    // Populate Round 1
                    const p1 = shuffled[i * 2] || null;
                    const p2 = shuffled[i * 2 + 1] || null;
                    if (p1 && !p2) {
                        pA = p1;
                        status = 'ready';
                    }
                    else if (p1 && p2) {
                        pA = p1;
                        pB = p2;
                        status = 'ready';
                    }
                }
                const matchData = {
                    id: matchId,
                    round,
                    playerA: pA,
                    playerB: pB,
                    status,
                    nextMatchId
                };
                currentRoundMatchIds.push(matchId);
                const matchRef = tournamentRef.collection('matches').doc(matchId);
                matchDocsToCreate.push({ ref: matchRef, data: matchData });
            }
            previousRoundMatchIds = currentRoundMatchIds;
        }
        // Write all matches
        for (const m of matchDocsToCreate) {
            transaction.set(m.ref, m.data);
        }
        transaction.update(tournamentRef, {
            status: 'active',
            startTime: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, message: 'Tournament started and bracket generated.' };
    });
});
const advanceTournamentMatch = async (tournamentId, matchId, winnerUid, transactionObj) => {
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    const matchRef = tournamentRef.collection('matches').doc(matchId);
    // We can be inside an existing transaction (from submitBattleResult)
    const runLogic = async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists)
            return;
        const matchData = matchDoc.data();
        if (matchData.status === 'completed')
            return; // already advanced
        transaction.update(matchRef, {
            status: 'completed',
            winnerUid
        });
        // Mark loser as eliminated
        const loserUid = matchData.playerA?.uid === winnerUid ? matchData.playerB?.uid : matchData.playerA?.uid;
        if (loserUid) {
            transaction.update(tournamentRef.collection('participants').doc(loserUid), {
                eliminated: true,
                finalPlacement: Math.pow(2, matchData.round) // simplistic placement
            });
        }
        if (!matchData.nextMatchId) {
            // It's the final!
            transaction.update(tournamentRef, {
                status: 'completed'
            });
            // Update winner participant
            transaction.update(tournamentRef.collection('participants').doc(winnerUid), {
                finalPlacement: 1
            });
            return;
        }
        // Advance to next match
        const nextMatchRef = tournamentRef.collection('matches').doc(matchData.nextMatchId);
        const nextMatchDoc = await transaction.get(nextMatchRef);
        if (!nextMatchDoc.exists)
            return;
        const nextMatch = nextMatchDoc.data();
        const winnerParticipant = (matchData.playerA?.uid === winnerUid ? matchData.playerA : matchData.playerB);
        if (!nextMatch.playerA) {
            transaction.update(nextMatchRef, { playerA: winnerParticipant });
        }
        else if (!nextMatch.playerB) {
            transaction.update(nextMatchRef, { playerB: winnerParticipant, status: 'ready' });
        }
    };
    if (transactionObj) {
        await runLogic(transactionObj);
    }
    else {
        await db.runTransaction(runLogic);
    }
};
exports.advanceTournamentMatch = advanceTournamentMatch;
//# sourceMappingURL=tournaments.js.map