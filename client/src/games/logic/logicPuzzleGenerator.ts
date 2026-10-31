import type { Difficulty } from '../core/types';
import { setSeed, seededRandom } from '../../utils/random';

export interface LogicQuestion {
  id: string;
  type: 'SEQUENCE' | 'DEDUCTION' | 'CONDITIONAL' | 'ORDERING' | 'ODD_ONE_OUT';
  text: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

export interface LogicConfig {
  questions: LogicQuestion[];
  timeLimit: number; // in seconds
  maxHints: number;
}

const NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
const COMPARATORS = [
  { p: 'taller', op: 'shorter' },
  { p: 'older', op: 'younger' },
  { p: 'faster', op: 'slower' },
  { p: 'heavier', op: 'lighter' },
  { p: 'richer', op: 'poorer' }
];

const getRandomInt = (min: number, max: number) => {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
};

const getUniqueNames = (count: number) => {
  const shuffled = [...NAMES].sort(() => seededRandom() - 0.5);
  return shuffled.slice(0, count);
};

const generateSequence = (difficulty: Difficulty, seed: number): LogicQuestion => {
  let seq = [];
  let next = 0;
  let text = '';
  
  if (difficulty === 'EASY') {
    const start = getRandomInt(1, 10);
    const step = getRandomInt(2, 5);
    seq = [start, start + step, start + 2 * step, start + 3 * step, start + 4 * step];
    next = start + 5 * step;
    text = `What comes next? ${seq.join(', ')}, ?`;
  } else if (difficulty === 'MEDIUM') {
    const type = getRandomInt(0, 1);
    if (type === 0) { // Geometric
      const start = getRandomInt(1, 3);
      const mult = getRandomInt(2, 4);
      seq = [start, start * mult, start * mult ** 2, start * mult ** 3];
      next = start * mult ** 4;
    } else { // Alternating + and -
      let cur = getRandomInt(10, 20);
      const add = getRandomInt(2, 5);
      const sub = getRandomInt(1, 4);
      seq = [cur, cur + add, cur + add - sub, cur + 2 * add - sub, cur + 2 * add - 2 * sub];
      next = cur + 3 * add - 2 * sub;
    }
    text = `What comes next? ${seq.join(', ')}, ?`;
  } else if (difficulty === 'HARD') {
    const type = getRandomInt(0, 1);
    if (type === 0) { // Fibonacci variant
      let a = getRandomInt(1, 3);
      let b = getRandomInt(1, 3);
      seq = [a, b];
      for (let i = 0; i < 4; i++) {
        let c = a + b;
        seq.push(c);
        a = b;
        b = c;
      }
      next = a + b;
    } else { // n^2 + x
      const x = getRandomInt(1, 3);
      seq = [1+x, 4+x, 9+x, 16+x, 25+x];
      next = 36+x;
    }
    text = `What comes next? ${seq.join(', ')}, ?`;
  } else {
    // Expert sequence
    const type = getRandomInt(0, 1);
    if (type === 0) { // Alternating sequence +a, *b
      let cur = getRandomInt(1, 3);
      const add = getRandomInt(2, 5);
      const mult = getRandomInt(2, 3);
      seq = [cur, cur + add, (cur + add) * mult, (cur + add) * mult + add, ((cur + add) * mult + add) * mult];
      next = ((cur + add) * mult + add) * mult + add;
    } else { // n^3
      seq = [1, 8, 27, 64, 125];
      next = 216;
    }
    text = `What comes next? ${seq.join(', ')}, ?`;
  }

  const options = [
    next.toString(),
    (next + getRandomInt(1, 3)).toString(),
    (next - getRandomInt(1, 3)).toString(),
    (next + getRandomInt(4, 10)).toString()
  ].sort(() => seededRandom() - 0.5);

  return {
    id: `seq_${seed}`,
    type: 'SEQUENCE',
    text,
    options,
    correctIndex: options.indexOf(next.toString()),
    hint: 'Look for the mathematical pattern between consecutive numbers.'
  };
};

const generateDeduction = (difficulty: Difficulty, seed: number): LogicQuestion => {
  const names = getUniqueNames(3);
  const comp = COMPARATORS[getRandomInt(0, COMPARATORS.length - 1)];
  
  if (difficulty === 'EASY' || difficulty === 'MEDIUM') {
    const text = `${names[0]} is ${comp.p} than ${names[1]}. ${names[1]} is ${comp.p} than ${names[2]}. Who is the ${comp.p}?`;
    const options = [names[0], names[1], names[2], 'Cannot be determined'].sort(() => seededRandom() - 0.5);
    return {
      id: `ded_${seed}`,
      type: 'DEDUCTION',
      text,
      options,
      correctIndex: options.indexOf(names[0]),
      hint: `Write down the order from ${comp.p} to ${comp.op}.`
    };
  } else {
    const names4 = getUniqueNames(4);
    const text = `${names4[0]} is ${comp.p} than ${names4[1]}. ${names4[2]} is ${comp.op} than ${names4[1]}. ${names4[3]} is ${comp.p} than ${names4[0]}. Who is the ${comp.op}?`;
    // D > A > B > C (in terms of 'p')
    // Therefore C is the most 'op'
    const options = [names4[0], names4[1], names4[2], names4[3]].sort(() => seededRandom() - 0.5);
    return {
      id: `ded_${seed}`,
      type: 'DEDUCTION',
      text,
      options,
      correctIndex: options.indexOf(names4[2]),
      hint: `Map out the relationships. D > A, A > B, B > C.`
    };
  }
};

const generateSyllogism = (difficulty: Difficulty, seed: number): LogicQuestion => {
  const groups = ['birds', 'reptiles', 'mammals', 'aliens', 'robots', 'wizards'];
  const traits = ['can fly', 'breathe fire', 'read minds', 'have lasers', 'are invisible'];
  
  const g = groups[getRandomInt(0, groups.length - 1)];
  const t = traits[getRandomInt(0, traits.length - 1)];
  const n = getUniqueNames(1)[0];

  const text = `All ${g} ${t}. ${n} is a ${g.substring(0, g.length - 1)}. What can we conclude?`;
  const correct = `${n} ${t}`;
  const options = [
    correct,
    `${n} cannot ${t}`,
    `Some ${g} cannot ${t}`,
    `Cannot be determined`
  ].sort(() => seededRandom() - 0.5);

  return {
    id: `syl_${seed}`,
    type: 'CONDITIONAL',
    text,
    options,
    correctIndex: options.indexOf(correct),
    hint: 'Apply the rule strictly to the individual.'
  };
};

export const generateLogicQuestion = (difficulty: Difficulty, seed: number): LogicQuestion => {
  setSeed(seed);
  const type = getRandomInt(0, 2);
  switch (type) {
    case 0: return generateSequence(difficulty, seed);
    case 1: return generateDeduction(difficulty, seed);
    case 2: return generateSyllogism(difficulty, seed);
    default: return generateSequence(difficulty, seed);
  }
};

export function getLogicConfig(difficulty: Difficulty, seed: number): LogicConfig {
  setSeed(seed);
  const questions: LogicQuestion[] = [];
  
  for (let i = 0; i < 5; i++) {
    questions.push(generateLogicQuestion(difficulty, seed + i * 100));
  }

  switch (difficulty) {
    case 'EASY':
      return { questions, timeLimit: 120, maxHints: 3 };
    case 'MEDIUM':
      return { questions, timeLimit: 150, maxHints: 2 };
    case 'HARD':
      return { questions, timeLimit: 180, maxHints: 2 };
    case 'EXPERT':
      return { questions, timeLimit: 240, maxHints: 1 };
  }
}
