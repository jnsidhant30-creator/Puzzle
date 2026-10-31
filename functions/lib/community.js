"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementPlayCount = exports.reportReview = exports.voteReviewHelpful = exports.submitReview = exports.reportCommunityPuzzle = exports.publishCommunityPuzzle = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const db = admin.firestore();
exports.publishCommunityPuzzle = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { puzzleData } = data;
    if (!puzzleData || !puzzleData.title || !puzzleData.description || !puzzleData.gameType || !puzzleData.difficulty || !puzzleData.config) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required puzzle configuration fields.');
    }
    // 1. Validation
    const validTypes = ['NUMBER', 'WORD', 'MEMORY', 'SLIDING', 'LOGIC', 'PATTERN'];
    if (!validTypes.includes(puzzleData.gameType)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid puzzle type.');
    }
    const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
    if (!validDifficulties.includes(puzzleData.difficulty)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid difficulty.');
    }
    if (puzzleData.title.length > 50 || puzzleData.description.length > 200) {
        throw new functions.https.HttpsError('invalid-argument', 'Title or description too long.');
    }
    if (typeof puzzleData.config.puzzleSeed !== 'number') {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid configuration: puzzleSeed must be a number.');
    }
    const uid = context.auth.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const profile = userDoc.data();
    // 2. Draft/Publish Logic
    const isPublishing = puzzleData.status === 'published';
    const puzzleId = puzzleData.id || db.collection('communityPuzzles').doc().id;
    const puzzleRef = db.collection('communityPuzzles').doc(puzzleId);
    return await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(puzzleRef);
        if (doc.exists) {
            // Edit existing
            const existingData = doc.data();
            if (existingData.creatorId !== uid) {
                throw new functions.https.HttpsError('permission-denied', 'You can only edit your own puzzles.');
            }
            if (existingData.status === 'removed' || existingData.status === 'underReview') {
                throw new functions.https.HttpsError('failed-precondition', 'Cannot edit a removed or under review puzzle.');
            }
            const updates = {
                title: puzzleData.title,
                description: puzzleData.description,
                instructions: puzzleData.instructions || '',
                gameType: puzzleData.gameType,
                difficulty: puzzleData.difficulty,
                config: puzzleData.config,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (isPublishing && existingData.status === 'draft') {
                updates.status = 'published';
                updates.publishedAt = admin.firestore.FieldValue.serverTimestamp();
            }
            transaction.update(puzzleRef, updates);
        }
        else {
            // Create new
            const newPuzzle = {
                id: puzzleId,
                creatorId: uid,
                creatorName: profile.displayName || 'Unknown Creator',
                title: puzzleData.title,
                description: puzzleData.description,
                instructions: puzzleData.instructions || '',
                gameType: puzzleData.gameType,
                difficulty: puzzleData.difficulty,
                config: puzzleData.config,
                status: isPublishing ? 'published' : 'draft',
                playCount: 0,
                metadataVersion: 1,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (isPublishing) {
                newPuzzle.publishedAt = admin.firestore.FieldValue.serverTimestamp();
            }
            transaction.set(puzzleRef, newPuzzle);
        }
        return { success: true, puzzleId };
    });
});
exports.reportCommunityPuzzle = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { puzzleId, reason } = data;
    if (!puzzleId || !reason) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing puzzleId or reason.');
    }
    await db.collection('reports').add({
        targetType: 'COMMUNITY_PUZZLE',
        targetId: puzzleId,
        reporterId: context.auth.uid,
        reason,
        status: 'OPEN',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
});
exports.submitReview = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { puzzleId, rating, reviewText } = data;
    if (!puzzleId || typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid rating or missing puzzleId.');
    }
    if (reviewText && reviewText.length > 500) {
        throw new functions.https.HttpsError('invalid-argument', 'Review text too long. Maximum 500 characters.');
    }
    const uid = context.auth.uid;
    // Sanitize simple tags
    const sanitizedText = reviewText ? reviewText.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
    const puzzleRef = db.collection('communityPuzzles').doc(puzzleId);
    const reviewRef = puzzleRef.collection('reviews').doc(uid);
    const userDoc = await db.collection('users').doc(uid).get();
    return await db.runTransaction(async (transaction) => {
        const puzzleDoc = await transaction.get(puzzleRef);
        if (!puzzleDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Puzzle not found.');
        }
        const puzzleData = puzzleDoc.data();
        if (puzzleData.status !== 'published') {
            throw new functions.https.HttpsError('failed-precondition', 'Cannot review an unpublished puzzle.');
        }
        const existingReviewDoc = await transaction.get(reviewRef);
        const existingReview = existingReviewDoc.exists ? existingReviewDoc.data() : null;
        const newRating = Math.floor(rating);
        let newAverage = puzzleData.averageRating || 0;
        let newCount = puzzleData.ratingCount || 0;
        let newReviewCount = puzzleData.reviewCount || 0;
        if (existingReview) {
            // Update existing rating
            const oldRating = existingReview.rating;
            if (oldRating !== newRating) {
                newAverage = ((newAverage * newCount) - oldRating + newRating) / newCount;
            }
            if (sanitizedText && !existingReview.reviewText) {
                newReviewCount++;
            }
            else if (!sanitizedText && existingReview.reviewText) {
                newReviewCount = Math.max(0, newReviewCount - 1);
            }
        }
        else {
            // New rating
            newAverage = ((newAverage * newCount) + newRating) / (newCount + 1);
            newCount++;
            if (sanitizedText)
                newReviewCount++;
        }
        // Set the review doc
        transaction.set(reviewRef, {
            puzzleId,
            userId: uid,
            userName: userDoc.exists ? userDoc.data().displayName : 'Anonymous',
            rating: newRating,
            reviewText: sanitizedText,
            helpfulCount: existingReview ? (existingReview.helpfulCount || 0) : 0,
            createdAt: existingReview ? existingReview.createdAt : admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        // Update parent puzzle aggregate
        transaction.update(puzzleRef, {
            averageRating: newAverage,
            ratingCount: newCount,
            reviewCount: newReviewCount
        });
        return { success: true };
    });
});
exports.voteReviewHelpful = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { puzzleId, reviewerId } = data;
    if (!puzzleId || !reviewerId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing parameters.');
    }
    const uid = context.auth.uid;
    if (uid === reviewerId) {
        throw new functions.https.HttpsError('invalid-argument', 'Cannot vote for your own review.');
    }
    const voteRef = db.collection('communityPuzzles').doc(puzzleId)
        .collection('reviews').doc(reviewerId)
        .collection('helpfulVotes').doc(uid);
    const reviewRef = db.collection('communityPuzzles').doc(puzzleId)
        .collection('reviews').doc(reviewerId);
    return await db.runTransaction(async (transaction) => {
        const voteDoc = await transaction.get(voteRef);
        if (voteDoc.exists) {
            throw new functions.https.HttpsError('already-exists', 'You already voted on this review.');
        }
        const reviewDoc = await transaction.get(reviewRef);
        if (!reviewDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Review not found.');
        }
        transaction.set(voteRef, {
            votedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        transaction.update(reviewRef, {
            helpfulCount: admin.firestore.FieldValue.increment(1)
        });
        return { success: true };
    });
});
exports.reportReview = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { puzzleId, reviewerId, reason } = data;
    if (!puzzleId || !reviewerId || !reason) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing parameters.');
    }
    await db.collection('reports').add({
        targetType: 'COMMUNITY_REVIEW',
        targetId: `${puzzleId}_${reviewerId}`,
        puzzleId,
        reviewerId,
        reporterId: context.auth.uid,
        reason,
        status: 'OPEN',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
});
exports.incrementPlayCount = functions.https.onCall(async (data, context) => {
    // Can be anonymous or authenticated, but we require auth to limit spam
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { puzzleId } = data;
    if (!puzzleId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing puzzleId.');
    }
    return await db.runTransaction(async (transaction) => {
        // Simple cooldown or uniqueness check. For simplicity, just increment. 
        // We can allow users to increment it once per day, or just once per session.
        // If we just want raw play counts with minimal spam protection:
        const puzzleRef = db.collection('communityPuzzles').doc(puzzleId);
        transaction.update(puzzleRef, {
            playCount: admin.firestore.FieldValue.increment(1)
        });
        // We could store the session to limit spam, but for now we just allow the increment.
        // In a real app we might store `lastPlayed: serverTimestamp()` and check it.
        return { success: true };
    });
});
//# sourceMappingURL=community.js.map