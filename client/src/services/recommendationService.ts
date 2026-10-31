import type { UserProfile } from './authService';

export interface Recommendation {
  puzzleId: string;
  puzzleType: string;
  difficulty: string;
  reason: string;
  title: string;
  route: string;
}

export const getRecommendation = (
  profile: UserProfile | null,
  recentGames: any[],
  puzzles: any[]
): Recommendation => {
  const playablePuzzles = puzzles.filter(p => p.id !== 'rnd');
  const fallbackPuzzle = playablePuzzles[0]; // e.g., Number Puzzle

  if (!profile) {
    return {
      puzzleId: fallbackPuzzle.id,
      puzzleType: fallbackPuzzle.title.toLowerCase(),
      difficulty: 'Easy',
      reason: 'Start with an easy puzzle.',
      title: fallbackPuzzle.title,
      route: fallbackPuzzle.route
    };
  }

  // 1. New Player
  if (!profile.totalGames || profile.totalGames === 0) {
    const memory = playablePuzzles.find(p => p.id === 'mem') || fallbackPuzzle;
    return {
      puzzleId: memory.id,
      puzzleType: memory.title.toLowerCase(),
      difficulty: 'Easy',
      reason: 'Start with an easy puzzle.',
      title: memory.title,
      route: memory.route
    };
  }

  // Pre-compute basic stats
  const counts: Record<string, number> = {};
  recentGames.forEach(g => {
    const t = g.puzzleType?.toLowerCase() || '';
    counts[t] = (counts[t] || 0) + 1;
  });

  const uniquePlayedTypes = Object.keys(counts);
  const unplayed = playablePuzzles.filter(p => !uniquePlayedTypes.includes(p.title.toLowerCase()));
  
  // 2. Early Explorer (< 5 games)
  if (profile.totalGames < 5 && unplayed.length > 0) {
    const pick = unplayed[0];
    return {
      puzzleId: pick.id,
      puzzleType: pick.title.toLowerCase(),
      difficulty: 'Easy',
      reason: "Explore a puzzle you haven't played yet.",
      title: pick.title,
      route: pick.route
    };
  }

  // 3. Stuck in a Rut
  if (recentGames.length >= 3) {
    const last3 = recentGames.slice(0, 3);
    const allSameType = last3.every(g => g.puzzleType === last3[0].puzzleType);
    if (allSameType && unplayed.length > 0) {
      const pick = unplayed[0];
      return {
        puzzleId: pick.id,
        puzzleType: pick.title.toLowerCase(),
        difficulty: 'Easy',
        reason: 'Try a different puzzle type.',
        title: pick.title,
        route: pick.route
      };
    }
  }

  // 4. Difficulty Progression (Easy -> Medium)
  if (recentGames.length >= 3) {
    const last3 = recentGames.slice(0, 3);
    const allEasyWon = last3.every(g => g.difficulty === 'EASY' && g.status === 'COMPLETED');
    if (allEasyWon) {
      const type = last3[0].puzzleType;
      const def = playablePuzzles.find(p => p.title.toLowerCase() === type?.toLowerCase());
      if (def) {
        return {
          puzzleId: def.id,
          puzzleType: type,
          difficulty: 'Medium',
          reason: 'Ready for a tougher challenge?',
          title: def.title,
          route: def.route
        };
      }
    }
  }

  // 5. Streak Protector
  if ((profile.currentStreak || 0) >= 3 && recentGames.length > 0) {
    let mostPlayed = '';
    let max = 0;
    for (const [type, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        mostPlayed = type;
      }
    }
    const def = playablePuzzles.find(p => p.title.toLowerCase() === mostPlayed);
    if (def) {
      return {
        puzzleId: def.id,
        puzzleType: def.title.toLowerCase(),
        difficulty: 'Medium',
        reason: 'Continue building your puzzle streak.',
        title: def.title,
        route: def.route
      };
    }
  }

  // 6. Fallback (Least Played / Haven't played recently)
  const sortedByLeast = [...playablePuzzles].sort((a, b) => {
    const countA = counts[a.title.toLowerCase()] || 0;
    const countB = counts[b.title.toLowerCase()] || 0;
    return countA - countB;
  });

  const pick = sortedByLeast[0];
  return {
    puzzleId: pick.id,
    puzzleType: pick.title.toLowerCase(),
    difficulty: 'Medium',
    reason: 'One of your least-played puzzles.',
    title: pick.title,
    route: pick.route
  };
};

export const getMultipleRecommendations = (
  profile: UserProfile | null,
  recentGames: any[],
  puzzles: any[],
  count: number = 2
): Recommendation[] => {
  const primary = getRecommendation(profile, recentGames, puzzles);
  
  const counts: Record<string, number> = {};
  recentGames.forEach(g => {
    const t = g.puzzleType?.toLowerCase() || '';
    counts[t] = (counts[t] || 0) + 1;
  });
  
  const playablePuzzles = puzzles.filter(p => p.id !== 'rnd' && p.id !== primary.puzzleId);
  const sortedByLeast = [...playablePuzzles].sort((a, b) => {
    const countA = counts[a.title.toLowerCase()] || 0;
    const countB = counts[b.title.toLowerCase()] || 0;
    return countA - countB;
  });

  const results = [primary];
  if (count > 1 && sortedByLeast.length > 0) {
    const sec = sortedByLeast[0];
    results.push({
      puzzleId: sec.id,
      puzzleType: sec.title.toLowerCase(),
      difficulty: 'Easy',
      reason: 'Try something different.',
      title: sec.title,
      route: sec.route
    });
  }
  return results;
};
