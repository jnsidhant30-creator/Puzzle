// Mock Puzzles
export const mockPuzzles = [
  {
    id: 'pzl_001',
    title: 'Logic Challenge 1',
    description: 'A fundamental logic puzzle level 1.',
    type: 'LOGIC',
    difficulty: 'EASY',
    timeLimit: 60,
    xpReward: 10,
    category: 'Logic',
  },
  {
    id: 'pzl_002',
    title: 'Number Ascend',
    description: 'Arrange the numbers in ascending order.',
    type: 'NUMBER',
    difficulty: 'MEDIUM',
    timeLimit: 120,
    xpReward: 25,
    category: 'Numbers',
  },
  {
    id: 'pzl_003',
    title: 'Word Scramble',
    description: 'Unscramble the given letters.',
    type: 'WORD',
    difficulty: 'HARD',
    timeLimit: 180,
    xpReward: 50,
    category: 'Words',
  }
];

// Mock Leaderboard
export const mockLeaderboard = [
  { rank: 1, username: 'Alex', score: 15200, xp: 45000, level: 45, gamesPlayed: 320, bestTime: '00:45' },
  { rank: 2, username: 'Sarah', score: 14850, xp: 42100, level: 42, gamesPlayed: 290, bestTime: '00:48' },
  { rank: 3, username: 'Rahul', score: 14100, xp: 39500, level: 39, gamesPlayed: 250, bestTime: '00:52' },
  { rank: 14, username: 'Player', score: 8500, xp: 12500, level: 12, gamesPlayed: 45, bestTime: '01:15' },
];

// Mock Profile
export const mockProfile = {
  username: 'Player',
  fullName: 'John Doe',
  level: 18,
  xp: 1250,
  nextLevelXp: 1500,
  totalGames: 124,
  gamesWon: 98,
  winRate: '79%',
  bestScore: 2450,
  bestTime: '01:12',
  currentStreak: 7,
  longestStreak: 14,
  favoriteType: 'LOGIC',
};

// Mock Achievements
export const mockAchievements = [
  { id: 'ach_1', title: 'First Win', description: 'Win your first puzzle.', unlocked: true, icon: '🏆' },
  { id: 'ach_2', title: '10 Wins', description: 'Win 10 puzzles.', unlocked: true, icon: '🎖️' },
  { id: 'ach_3', title: 'Speed Demon', description: 'Complete a puzzle in under 30 seconds.', unlocked: false, icon: '⚡' },
  { id: 'ach_4', title: '7 Day Streak', description: 'Play for 7 consecutive days.', unlocked: true, icon: '🔥' },
  { id: 'ach_5', title: 'Expert Solver', description: 'Complete 5 Expert puzzles.', unlocked: false, icon: '🧠' },
];
