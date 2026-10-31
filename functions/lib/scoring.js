"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAccuracy = exports.calculateAggregateScore = exports.calculateFinalScore = exports.BASE_SCORES = void 0;
exports.BASE_SCORES = {
    EASY: 100,
    MEDIUM: 150,
    HARD: 200,
    EXPERT: 300,
};
const calculateFinalScore = (difficulty, isCorrect, timeTakenMs, initialTimeMs, hintsUsedForQuestion) => {
    if (!isCorrect)
        return 0;
    const baseScore = exports.BASE_SCORES[difficulty];
    const expectedMaxTimeMs = Math.min(initialTimeMs / 2, 30000);
    let timeBonus = 0;
    if (timeTakenMs < expectedMaxTimeMs) {
        const speedRatio = 1 - (timeTakenMs / expectedMaxTimeMs);
        timeBonus = Math.floor((baseScore * 0.2) * Math.max(0, speedRatio));
    }
    const hintPenalty = Math.floor(baseScore * 0.1) * hintsUsedForQuestion;
    const finalScore = Math.max(0, baseScore + timeBonus - hintPenalty);
    return finalScore;
};
exports.calculateFinalScore = calculateFinalScore;
// PuzzleVerse currently seems to calculate an aggregate score in the client and pass it as gameState.score.
// The requirements say: "Do NOT trust client-provided final score. Server calculates: finalScore from validated gameplay data."
// Wait, the client calculates the score per question using `calculateQuestionScore` and sums it up.
// If the server only gets `duration` and `correctAnswers`, it can only approximate the total score based on averages,
// or we assume it's one big question. Let's calculate an aggregate score based on the total time taken and correct answers.
const calculateAggregateScore = (difficulty, correctAnswers, timeTakenMs, initialTimeMs, hintsUsed) => {
    if (correctAnswers === 0)
        return 0;
    const baseScore = exports.BASE_SCORES[difficulty] * correctAnswers;
    const expectedMaxTimeMs = Math.min(initialTimeMs / 2, 30000 * correctAnswers);
    let timeBonus = 0;
    if (timeTakenMs < expectedMaxTimeMs) {
        const speedRatio = 1 - (timeTakenMs / expectedMaxTimeMs);
        timeBonus = Math.floor((baseScore * 0.2) * Math.max(0, speedRatio));
    }
    const hintPenalty = Math.floor(exports.BASE_SCORES[difficulty] * 0.1) * hintsUsed;
    const finalScore = Math.max(0, baseScore + timeBonus - hintPenalty);
    return finalScore;
};
exports.calculateAggregateScore = calculateAggregateScore;
const calculateAccuracy = (correctAnswers, totalQuestions) => {
    if (totalQuestions === 0)
        return 0;
    return Math.round((correctAnswers / totalQuestions) * 100);
};
exports.calculateAccuracy = calculateAccuracy;
//# sourceMappingURL=scoring.js.map