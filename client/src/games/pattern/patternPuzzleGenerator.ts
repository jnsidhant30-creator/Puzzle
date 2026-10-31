import type { Difficulty } from '../core/types';
import { setSeed, seededRandom } from '../../utils/random';

export interface PatternQuestion {
  id: string;
  type: 'SEQUENCE' | 'ROTATION' | 'ALTERNATING' | 'PROGRESSION';
  sequence: string[];
  options: string[];
  correctIndex: number;
  hint: string;
}

export interface PatternConfig {
  questions: PatternQuestion[];
  timeLimit: number; // in seconds
  maxHints: number;
}

const SHAPE_PAIRS = [
  ['○', '●'], ['□', '■'], ['△', '▲'], ['▽', '▼'], ['◇', '◆'], ['☆', '★']
];

const ARROWS = ['▲', '▶', '▼', '◀'];
const TRIANGLES = ['△', '▷', '▽', '◁'];

const getRandomInt = (min: number, max: number) => {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
};

const generateAlternating = (difficulty: Difficulty, seed: number): PatternQuestion => {
  const pair = SHAPE_PAIRS[getRandomInt(0, SHAPE_PAIRS.length - 1)];
  const seq = [];
  const options = [pair[0], pair[1], SHAPE_PAIRS[(getRandomInt(1, SHAPE_PAIRS.length - 1))][0], SHAPE_PAIRS[(getRandomInt(1, SHAPE_PAIRS.length - 1))][1]];
  
  let ans = '';
  if (difficulty === 'EASY') {
    seq.push(pair[0], pair[1], pair[0], pair[1]);
    ans = pair[0];
  } else {
    // A B B A B B
    seq.push(pair[0], pair[1], pair[1], pair[0], pair[1], pair[1]);
    ans = pair[0];
  }

  return {
    id: `pat_${seed}`,
    type: 'ALTERNATING',
    sequence: [...seq, '?'],
    options: options.sort(() => seededRandom() - 0.5),
    correctIndex: 0, // We will fix index after sorting
    hint: 'Look at how the two shapes repeat.'
  };
};

const generateRotation = (difficulty: Difficulty, seed: number): PatternQuestion => {
  const isArrow = seededRandom() > 0.5;
  const set = isArrow ? ARROWS : TRIANGLES;
  const start = getRandomInt(0, 3);
  const dir = seededRandom() > 0.5 ? 1 : -1;
  const seq = [];
  
  let steps = difficulty === 'EASY' || difficulty === 'MEDIUM' ? 1 : 2;
  
  for (let i = 0; i < 4; i++) {
    let idx = (start + i * dir * steps) % 4;
    if (idx < 0) idx += 4;
    seq.push(set[idx]);
  }
  
  let nextIdx = (start + 4 * dir * steps) % 4;
  if (nextIdx < 0) nextIdx += 4;
  const ans = set[nextIdx];
  
  return {
    id: `pat_${seed}`,
    type: 'ROTATION',
    sequence: [...seq, '?'],
    options: [...set].sort(() => seededRandom() - 0.5),
    correctIndex: 0,
    hint: 'The shape rotates in a consistent direction.'
  };
};

const generateProgression = (difficulty: Difficulty, seed: number): PatternQuestion => {
  const pair = SHAPE_PAIRS[getRandomInt(0, SHAPE_PAIRS.length - 1)];
  const seq = [];
  
  if (difficulty === 'EASY' || difficulty === 'MEDIUM') {
    // 1, 2, 3, 4
    seq.push(pair[1], pair[1].repeat(2), pair[1].repeat(3));
    const ans = pair[1].repeat(4);
    const options = [ans, pair[1].repeat(5), pair[0].repeat(4), pair[1].repeat(2) + pair[0]];
    return {
      id: `pat_${seed}`,
      type: 'PROGRESSION',
      sequence: [...seq, '?'],
      options: options.sort(() => seededRandom() - 0.5),
      correctIndex: 0,
      hint: 'The pattern grows by one each time.'
    };
  } else {
    // A, AB, ABB, ABBB
    seq.push(pair[0], pair[0] + pair[1], pair[0] + pair[1].repeat(2), pair[0] + pair[1].repeat(3));
    const ans = pair[0] + pair[1].repeat(4);
    const options = [ans, pair[0] + pair[1].repeat(5), pair[1].repeat(5), pair[0].repeat(2) + pair[1].repeat(3)];
    return {
      id: `pat_${seed}`,
      type: 'PROGRESSION',
      sequence: [...seq, '?'],
      options: options.sort(() => seededRandom() - 0.5),
      correctIndex: 0,
      hint: 'A specific part of the sequence grows.'
    };
  }
};

const generateSequence = (difficulty: Difficulty, seed: number): PatternQuestion => {
  const pair1 = SHAPE_PAIRS[getRandomInt(0, SHAPE_PAIRS.length - 1)];
  const pair2 = SHAPE_PAIRS[(getRandomInt(1, SHAPE_PAIRS.length - 1))];
  const seq = [];
  
  if (difficulty === 'EXPERT') {
    // Bouncing
    seq.push(pair1[1] + pair1[0].repeat(2), pair1[0] + pair1[1] + pair1[0], pair1[0].repeat(2) + pair1[1], pair1[0] + pair1[1] + pair1[0]);
    const ans = pair1[1] + pair1[0].repeat(2);
    const options = [ans, pair1[0].repeat(3), pair1[1].repeat(3), pair1[0].repeat(2) + pair1[1]];
    return {
      id: `pat_${seed}`,
      type: 'SEQUENCE',
      sequence: [...seq, '?'],
      options: options.sort(() => seededRandom() - 0.5),
      correctIndex: 0,
      hint: 'The filled shape bounces back and forth.'
    };
  } else {
    // A B C A B C
    const a = pair1[0];
    const b = pair1[1];
    const c = pair2[0];
    seq.push(a, b, c, a, b);
    const ans = c;
    const options = [a, b, c, pair2[1]];
    return {
      id: `pat_${seed}`,
      type: 'SEQUENCE',
      sequence: [...seq, '?'],
      options: options.sort(() => seededRandom() - 0.5),
      correctIndex: 0,
      hint: 'The shapes repeat in a cycle of three.'
    };
  }
};



// Fix the above correctly
const createQuestion = (id: string, type: any, sequence: string[], optionsRaw: string[], hint: string): PatternQuestion => {
  const ans = optionsRaw[0]; // first one is always the correct one
  const options = [...new Set(optionsRaw)]; // ensure unique
  while(options.length < 4) {
    options.push(SHAPE_PAIRS[getRandomInt(0,5)][getRandomInt(0,1)]);
  }
  const shuffledOptions = options.slice(0, 4).sort(() => seededRandom() - 0.5);
  return {
    id,
    type,
    sequence,
    options: shuffledOptions,
    correctIndex: shuffledOptions.indexOf(ans),
    hint
  };
};

// Now overriding generators to use createQuestion
const genAlt = (d: Difficulty, s: number) => {
  const pair = SHAPE_PAIRS[getRandomInt(0, SHAPE_PAIRS.length - 1)];
  const seq = d === 'EASY' ? [pair[0], pair[1], pair[0], pair[1]] : [pair[0], pair[1], pair[1], pair[0], pair[1], pair[1]];
  const ans = pair[0];
  return createQuestion(`pat_${s}`, 'ALTERNATING', [...seq, '?'], [ans, pair[1], SHAPE_PAIRS[0][0], SHAPE_PAIRS[1][1]], 'Look at how the shapes repeat.');
};

const genRot = (d: Difficulty, s: number) => {
  const set = seededRandom() > 0.5 ? ARROWS : TRIANGLES;
  const start = getRandomInt(0, 3);
  const dir = seededRandom() > 0.5 ? 1 : -1;
  const steps = d === 'EASY' || d === 'MEDIUM' ? 1 : 2;
  const seq = [];
  for (let i = 0; i < 4; i++) {
    let idx = (start + i * dir * steps) % 4;
    if (idx < 0) idx += 4;
    seq.push(set[idx]);
  }
  let nIdx = (start + 4 * dir * steps) % 4;
  if (nIdx < 0) nIdx += 4;
  return createQuestion(`pat_${s}`, 'ROTATION', [...seq, '?'], [set[nIdx], set[(nIdx+1)%4], set[(nIdx+2)%4], set[(nIdx+3)%4]], 'The shape rotates.');
};

const genProg = (d: Difficulty, s: number) => {
  const pair = SHAPE_PAIRS[getRandomInt(0, SHAPE_PAIRS.length - 1)];
  if (d === 'EASY' || d === 'MEDIUM') {
    const seq = [pair[1], pair[1].repeat(2), pair[1].repeat(3)];
    return createQuestion(`pat_${s}`, 'PROGRESSION', [...seq, '?'], [pair[1].repeat(4), pair[1].repeat(5), pair[0].repeat(4), pair[1].repeat(2) + pair[0]], 'The pattern grows by one.');
  } else {
    const seq = [pair[0], pair[0] + pair[1], pair[0] + pair[1].repeat(2), pair[0] + pair[1].repeat(3)];
    return createQuestion(`pat_${s}`, 'PROGRESSION', [...seq, '?'], [pair[0] + pair[1].repeat(4), pair[0] + pair[1].repeat(5), pair[1].repeat(5), pair[0].repeat(2) + pair[1].repeat(3)], 'A specific part grows.');
  }
};

const genSeq = (d: Difficulty, s: number) => {
  const p1 = SHAPE_PAIRS[getRandomInt(0, SHAPE_PAIRS.length - 1)];
  const p2 = SHAPE_PAIRS[getRandomInt(0, SHAPE_PAIRS.length - 1)];
  if (d === 'EXPERT') {
    const seq = [p1[1] + p1[0].repeat(2), p1[0] + p1[1] + p1[0], p1[0].repeat(2) + p1[1], p1[0] + p1[1] + p1[0]];
    return createQuestion(`pat_${s}`, 'SEQUENCE', [...seq, '?'], [p1[1] + p1[0].repeat(2), p1[0].repeat(3), p1[1].repeat(3), p1[0].repeat(2) + p1[1]], 'The filled shape bounces.');
  } else {
    const seq = [p1[0], p1[1], p2[0], p1[0], p1[1]];
    return createQuestion(`pat_${s}`, 'SEQUENCE', [...seq, '?'], [p2[0], p1[0], p1[1], p2[1]], 'Shapes repeat in a cycle.');
  }
};

export const generatePatternQuestion = (difficulty: Difficulty, seed: number): PatternQuestion => {
  setSeed(seed);
  const type = getRandomInt(0, 3);
  switch (type) {
    case 0: return genAlt(difficulty, seed);
    case 1: return genRot(difficulty, seed);
    case 2: return genProg(difficulty, seed);
    case 3: return genSeq(difficulty, seed);
    default: return genAlt(difficulty, seed);
  }
};

export function getPatternConfig(difficulty: Difficulty, seed: number): PatternConfig {
  setSeed(seed);
  const questions: PatternQuestion[] = [];
  for (let i = 0; i < 5; i++) {
    questions.push(generatePatternQuestion(difficulty, seed + i * 100));
  }
  switch (difficulty) {
    case 'EASY': return { questions, timeLimit: 120, maxHints: 3 };
    case 'MEDIUM': return { questions, timeLimit: 150, maxHints: 2 };
    case 'HARD': return { questions, timeLimit: 180, maxHints: 2 };
    case 'EXPERT': return { questions, timeLimit: 240, maxHints: 1 };
  }
}
