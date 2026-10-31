import type { Difficulty } from '../core/types';
import { setSeed, seededRandom } from '../../utils/random';
import { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, EXPERT_WORDS, DEFINITIONS } from '../../utils/wordDictionary';

export type WordChallengeType = 'UNSCRAMBLE' | 'MISSING_LETTER' | 'DEFINITION' | 'ANAGRAM';

export interface WordQuestion {
  id: string;
  type: WordChallengeType;
  prompt: string;
  answer: string;
  options?: string[]; // For DEFINITION (multiple choice)
  hint: string;
}

const shuffleString = (str: string): string => {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
};

const createMissingLetter = (word: string, count: number = 1): string => {
  const arr = word.split('');
  let missing = 0;
  while (missing < count) {
    const index = Math.floor(seededRandom() * word.length);
    if (arr[index] !== '_') {
      arr[index] = '_';
      missing++;
    }
  }
  return arr.join(' ');
};

export const generateWordQuestion = (difficulty: Difficulty, seed: number): WordQuestion => {
  setSeed(seed);
  
  let wordPool;
  let missingCount = 1;
  switch (difficulty) {
    case 'EASY': 
      wordPool = EASY_WORDS; 
      missingCount = 1;
      break;
    case 'MEDIUM': 
      wordPool = MEDIUM_WORDS; 
      missingCount = 2;
      break;
    case 'HARD': 
      wordPool = HARD_WORDS; 
      missingCount = 3;
      break;
    case 'EXPERT': 
      wordPool = EXPERT_WORDS; 
      missingCount = 4;
      break;
  }

  // 25% chance for a definition question
  const isDefinition = seededRandom() < 0.25; 

  if (isDefinition) {
    const def = DEFINITIONS[Math.floor(seededRandom() * DEFINITIONS.length)];
    const options = [...def.options].sort(() => seededRandom() - 0.5);
    return {
      id: `word_${seed}`,
      type: 'DEFINITION',
      prompt: def.prompt,
      answer: def.word,
      options,
      hint: 'Look for the closest synonym.'
    };
  }

  const selectedWordObj = wordPool[Math.floor(seededRandom() * wordPool.length)];
  const word = selectedWordObj.word;
  
  const challengeTypes: WordChallengeType[] = ['UNSCRAMBLE', 'MISSING_LETTER', 'ANAGRAM'];
  const type = challengeTypes[Math.floor(seededRandom() * challengeTypes.length)];

  let prompt = '';
  switch (type) {
    case 'UNSCRAMBLE':
      prompt = shuffleString(word);
      // Ensure it doesn't accidentally shuffle to the same word
      while (prompt === word && word.length > 1) {
        prompt = shuffleString(word);
      }
      break;
    case 'MISSING_LETTER':
      prompt = createMissingLetter(word, Math.min(missingCount, word.length - 1));
      break;
    case 'ANAGRAM':
      prompt = shuffleString(word);
      while (prompt === word && word.length > 1) {
        prompt = shuffleString(word);
      }
      break;
  }

  return {
    id: `word_${seed}`,
    type,
    prompt,
    answer: word,
    hint: selectedWordObj.hint
  };
};
