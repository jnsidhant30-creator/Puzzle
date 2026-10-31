import type { Difficulty } from '../core/types';
import { setSeed, seededRandom, shuffleArray } from '../../utils/random';

export interface MemoryCard {
  id: string;
  pairId: string;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const POOLS = {
  emojis: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
    '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
    '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎',
    '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳'
  ],
  shapes: [
    '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥',
    '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '🔺', '🔻',
    '🔶', '🔷', '🔸', '🔹', '♥️', '♦️', '♠️', '♣️', '🌟', '⭐'
  ],
  numbers: [
    '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣',
    '🔟', '💯', '🔢', '#️⃣', '*️⃣', '➗', '➖', '➕', '✖️', '💲'
  ],
  food: [
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒',
    '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
    '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨'
  ]
};

export const getPairsCountForDifficulty = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case 'EASY': return 6;    // 12 cards
    case 'MEDIUM': return 8;  // 16 cards
    case 'HARD': return 12;   // 24 cards
    case 'EXPERT': return 16; // 32 cards
    default: return 8;
  }
};

export const getPreviewTimeForDifficulty = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case 'EASY': return 3500;
    case 'MEDIUM': return 2500;
    case 'HARD': return 1500;
    case 'EXPERT': return 800; // Much harder
    default: return 2000;
  }
};

export const generateMemoryBoard = (difficulty: Difficulty, seed: number): MemoryCard[] => {
  setSeed(seed);
  const pairsCount = getPairsCountForDifficulty(difficulty);
  
  const poolKeys = Object.keys(POOLS) as Array<keyof typeof POOLS>;
  const selectedPoolKey = poolKeys[Math.floor(seededRandom() * poolKeys.length)];
  const pool = POOLS[selectedPoolKey];
  
  const shuffledPool = shuffleArray([...pool]);
  const selectedSymbols = shuffledPool.slice(0, pairsCount);
  
  const board: MemoryCard[] = [];
  
  selectedSymbols.forEach((symbol, index) => {
    const pairId = `pair_${index}`;
    board.push({
      id: `card_${index}_A`,
      pairId,
      value: symbol,
      isFlipped: false,
      isMatched: false
    });
    board.push({
      id: `card_${index}_B`,
      pairId,
      value: symbol,
      isFlipped: false,
      isMatched: false
    });
  });
  
  return shuffleArray(board);
};
