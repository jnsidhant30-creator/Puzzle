/* Anti-Cheat & Attempt Validation Service for PuzzleVerse */
import { PuzzleType, Difficulty } from '../types'; 

/* Minimum feasible solve time threshold in seconds per puzzle type and difficulty */

const MIN_FEASIBLE_TIME: Record<PuzzleType, Record<Difficulty, number>> = { number: { easy: 3, medium: 8, hard: 15 }, word: { easy: 3, medium: 8, hard: 15 }, memory: { easy: 4, medium: 10, hard: 18 }, sliding: { easy: 4, medium: 10, hard: 20 }, logic: { easy: 5, medium: 12, hard: 25 }, pattern: { easy: 3, medium: 8, hard: 15 }, pipe: { easy: 4, medium: 10, hard: 20 }, color_path: { easy: 4, medium: 10, hard: 20 }, block_escape: { easy: 5, medium: 12, hard: 22 }, number_path: { easy: 4, medium: 10, hard: 20 }, rotating_tiles: { easy: 4, medium: 10, hard: 18 }, word_grid: { easy: 5, medium: 12, hard: 25 }, arrow_path: { easy: 4, medium: 10, hard: 18 }, maze_escape: { easy: 4, medium: 10, hard: 20 }, laser_mirror: { easy: 5, medium: 12, hard: 22 }, challenge_mode: { easy: 10, medium: 20, hard: 35 },
}; 

/* Simple hashing mechanism to detect payload tampering */
export  function generateAttemptHash( userId: string, puzzleType: PuzzleType, score: number, timeSeconds: number, seed?: number
): string { const secret = 'pv_salt_2026_v88'; const str = `${userId}:${puzzleType}:${score}:${timeSeconds}:${seed || 0}:${secret}`; let hash = 0; for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = (hash << 5) - hash + char; hash |= 0; } return Math.abs(hash).toString(16);
} export function validatePuzzleAttempt( userId: string, puzzleType: PuzzleType, difficulty: Difficulty, score: number, timeSeconds: number, hash?: string, seed?: number
): { valid: boolean; reason?: string } { /* 1. Check time floor */
 const minTime = MIN_FEASIBLE_TIME[puzzleType]?.[difficulty] || 3; if (timeSeconds < minTime) { return { valid: false, reason: `Completion time (${timeSeconds}s) is below physical human threshold (${minTime}s) for ${puzzleType} [${difficulty}].` }; } /* 2. Hash integrity check */
/* if hash provided */
if (hash) { const expected = generateAttemptHash(userId, puzzleType, score, timeSeconds, seed); if (hash !== expected) { return { valid: false, reason: 'Attempt hash signature mismatch.' }; } } return { valid: true };
} /* Throttle submission tracker */

const lastSubmissionMap = new Map<string, number>(); export function isRateLimited(userId: string, minIntervalMs = 3000): boolean { const now = Date.now(); const last = lastSubmissionMap.get(userId) || 0; if (now - last < minIntervalMs) { return true; } lastSubmissionMap.set(userId, now); return false;
}
