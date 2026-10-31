"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateMissions = exports.getActiveMissions = exports.getWeeklyPeriod = exports.getDailyPeriod = exports.WEEKLY_MISSIONS_POOL = exports.DAILY_MISSIONS_POOL = void 0;
const admin = require("firebase-admin");
// Hardcoded mission pool. In a real system, these might live in Firestore, 
// but for determinism without extra reads, defining them centrally is great.
exports.DAILY_MISSIONS_POOL = [
    { id: 'd_play_3', name: 'Dedicated', description: 'Complete 3 puzzles', type: 'COMPLETE_N_PUZZLES', category: 'General', frequency: 'daily', target: 3, rewardXp: 50 },
    { id: 'd_play_diff_2', name: 'Explorer', description: 'Play 2 different puzzle types', type: 'PLAY_N_DIFFERENT_GAMES', category: 'General', frequency: 'daily', target: 2, rewardXp: 50 },
    { id: 'd_daily_challenge', name: 'Daily Challenger', description: "Complete today's Daily Challenge", type: 'COMPLETE_DAILY_CHALLENGE', category: 'Challenge', frequency: 'daily', target: 1, rewardXp: 75 },
    { id: 'd_use_hint_1', name: 'Strategic', description: 'Complete a puzzle using at most 1 hint', type: 'USE_HINTS', category: 'Strategy', frequency: 'daily', target: 1, rewardXp: 40 },
    { id: 'd_earn_100_xp', name: 'High Achiever', description: 'Earn 100 XP', type: 'EARN_XP', category: 'General', frequency: 'daily', target: 100, rewardXp: 60 }
];
exports.WEEKLY_MISSIONS_POOL = [
    { id: 'w_play_15', name: 'Puzzle Master', description: 'Complete 15 puzzles', type: 'COMPLETE_N_PUZZLES', category: 'General', frequency: 'weekly', target: 15, rewardXp: 300 },
    { id: 'w_play_diff_5', name: 'Polymath', description: 'Play 5 different puzzle types', type: 'PLAY_N_DIFFERENT_GAMES', category: 'General', frequency: 'weekly', target: 5, rewardXp: 250 },
    { id: 'w_earn_1000_xp', name: 'XP Grinder', description: 'Earn 1000 XP', type: 'EARN_XP', category: 'General', frequency: 'weekly', target: 1000, rewardXp: 400 }
];
// Helper to get current period string (UTC based to be deterministic globally)
const getDailyPeriod = () => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};
exports.getDailyPeriod = getDailyPeriod;
const getWeeklyPeriod = () => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
};
exports.getWeeklyPeriod = getWeeklyPeriod;
// Deterministic selection based on period string hash
const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};
const getActiveMissions = () => {
    const dailyPeriod = (0, exports.getDailyPeriod)();
    const weeklyPeriod = (0, exports.getWeeklyPeriod)();
    const dailyHash = hashString(dailyPeriod);
    const weeklyHash = hashString(weeklyPeriod);
    // Select 3 daily missions deterministically
    const activeDaily = [];
    let dPool = [...exports.DAILY_MISSIONS_POOL];
    for (let i = 0; i < 3; i++) {
        if (dPool.length === 0)
            break;
        const index = (dailyHash + i) % dPool.length;
        activeDaily.push(dPool[index]);
        dPool.splice(index, 1);
    }
    // Select 2 weekly missions deterministically
    const activeWeekly = [];
    let wPool = [...exports.WEEKLY_MISSIONS_POOL];
    for (let i = 0; i < 2; i++) {
        if (wPool.length === 0)
            break;
        const index = (weeklyHash + i) % wPool.length;
        activeWeekly.push(wPool[index]);
        wPool.splice(index, 1);
    }
    return [...activeDaily, ...activeWeekly];
};
exports.getActiveMissions = getActiveMissions;
/**
 * Evaluates progress against active missions.
 */
const evaluateMissions = (userId, resultData, xpEarnedThisGame, playedTypes, // Historic played types for this user
activeMissions, currentProgressMap) => {
    const evaluationResults = [];
    const dailyPeriod = (0, exports.getDailyPeriod)();
    const weeklyPeriod = (0, exports.getWeeklyPeriod)();
    const isCompleted = resultData.status === 'COMPLETED';
    for (const mission of activeMissions) {
        const period = mission.frequency === 'daily' ? dailyPeriod : weeklyPeriod;
        const progressKey = `${period}_${mission.id}`;
        let p = currentProgressMap.get(progressKey);
        if (!p) {
            p = {
                missionId: mission.id,
                progress: 0,
                completed: false,
                claimed: false, // auto-claimed upon completion in this design
                period,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            currentProgressMap.set(progressKey, p);
        }
        if (p.completed)
            continue; // Already done
        let increment = 0;
        let absoluteValue = -1;
        switch (mission.type) {
            case 'COMPLETE_N_PUZZLES':
                if (isCompleted)
                    increment = 1;
                break;
            case 'PLAY_N_DIFFERENT_GAMES':
                if (isCompleted) {
                    absoluteValue = playedTypes.size;
                }
                break;
            case 'COMPLETE_DAILY_CHALLENGE':
                if (isCompleted && resultData.isDailyPuzzle)
                    increment = 1;
                break;
            case 'USE_HINTS':
                if (isCompleted && resultData.hintsUsed <= 1)
                    increment = 1;
                break;
            case 'EARN_XP':
                if (isCompleted)
                    increment = xpEarnedThisGame;
                break;
        }
        let progressChanged = false;
        if (absoluteValue >= 0 && absoluteValue > p.progress) {
            p.progress = Math.min(absoluteValue, mission.target);
            progressChanged = true;
        }
        else if (increment > 0) {
            p.progress = Math.min(p.progress + increment, mission.target);
            progressChanged = true;
        }
        if (progressChanged) {
            if (p.progress >= mission.target && !p.completed) {
                p.completed = true;
                p.claimed = true; // Auto claim
                evaluationResults.push({
                    missionId: mission.id,
                    progress: p.progress,
                    completed: true,
                    xpEarned: mission.rewardXp
                });
            }
            else {
                // Just progress update, no reward yet
                evaluationResults.push({
                    missionId: mission.id,
                    progress: p.progress,
                    completed: false,
                    xpEarned: 0
                });
            }
        }
    }
    return evaluationResults;
};
exports.evaluateMissions = evaluateMissions;
//# sourceMappingURL=missions.js.map