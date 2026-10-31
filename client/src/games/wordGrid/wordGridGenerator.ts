import type { WordGridPuzzle, WordLocation } from './types';
import type { Difficulty } from '../core/types';
import { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, EXPERT_WORDS } from '../../utils/wordDictionary';
import { seededRandom, setSeed } from '../../utils/random';

const getDifficultyConfig = (diff: Difficulty | string) => {
  switch (diff) {
    case 'EASY': return { rows: 8, cols: 8, wordsCount: 4, pool: EASY_WORDS, dirs: [[0,1], [1,0]] };
    case 'MEDIUM': return { rows: 10, cols: 10, wordsCount: 6, pool: [...EASY_WORDS, ...MEDIUM_WORDS], dirs: [[0,1], [1,0], [1,1]] };
    case 'HARD': return { rows: 12, cols: 12, wordsCount: 8, pool: [...MEDIUM_WORDS, ...HARD_WORDS], dirs: [[0,1], [1,0], [1,1], [0,-1], [-1,0]] };
    case 'EXPERT': return { rows: 14, cols: 14, wordsCount: 10, pool: [...HARD_WORDS, ...EXPERT_WORDS], dirs: [[0,1], [1,0], [1,1], [0,-1], [-1,0], [-1,-1], [-1,1], [1,-1]] };
    default: return { rows: 8, cols: 8, wordsCount: 4, pool: EASY_WORDS, dirs: [[0,1], [1,0]] };
  }
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const generateWordGridPuzzle = (difficulty: Difficulty | string, seed: number): WordGridPuzzle => {
  const config = getDifficultyConfig(difficulty);
  if (seed === undefined) seed = Date.now();
  setSeed(seed);
  
  const { rows, cols, wordsCount, pool, dirs } = config;
  
  // Select words
  const selectedWordsList: string[] = [];
  const poolCopy = [...pool];
  for (let i = poolCopy.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
  }
  
  for (let i = 0; i < wordsCount && i < poolCopy.length; i++) {
    selectedWordsList.push(poolCopy[i].word.toUpperCase());
  }

  const grid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
  const wordLocations: WordLocation[] = [];

  for (const word of selectedWordsList) {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 200) {
      attempts++;
      const dir = dirs[Math.floor(seededRandom() * dirs.length)];
      const dr = dir[0];
      const dc = dir[1];
      
      const r = Math.floor(seededRandom() * rows);
      const c = Math.floor(seededRandom() * cols);
      
      // Check bounds
      const endR = r + dr * (word.length - 1);
      const endC = c + dc * (word.length - 1);
      if (endR < 0 || endR >= rows || endC < 0 || endC >= cols) continue;
      
      // Check overlap conflicts
      let conflict = false;
      for (let i = 0; i < word.length; i++) {
        const tr = r + dr * i;
        const tc = c + dc * i;
        if (grid[tr][tc] !== '' && grid[tr][tc] !== word[i]) {
          conflict = true;
          break;
        }
      }
      
      if (!conflict) {
        // Place word
        for (let i = 0; i < word.length; i++) {
          grid[r + dr * i][c + dc * i] = word[i];
        }
        wordLocations.push({ word, r, c, dr, dc, found: false });
        placed = true;
      }
    }
  }

  // Fill remaining spaces with random letters
  // Weighted towards common letters makes it harder
  const distractorChars = "EEAARIOTSNLCMU";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '') {
        if (seededRandom() > 0.5) {
          grid[r][c] = distractorChars[Math.floor(seededRandom() * distractorChars.length)];
        } else {
          grid[r][c] = LETTERS[Math.floor(seededRandom() * LETTERS.length)];
        }
      }
    }
  }

  return {
    id: 'word_grid_' + Math.floor(seededRandom() * 1000000),
    rows,
    cols,
    grid,
    words: wordLocations,
    difficulty: `${rows}x${cols}`
  };
};
