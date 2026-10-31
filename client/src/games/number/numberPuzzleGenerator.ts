import type { Difficulty } from '../core/types';
import { setSeed, seededRandom } from '../../utils/random';

export interface NumberQuestion {
  expression: string;
  answer: number;
  hint: string;
}

const getRandomInt = (min: number, max: number) => {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
};

export const generateNumberQuestion = (difficulty: Difficulty, seed: number): NumberQuestion => {
  setSeed(seed);
  switch (difficulty) {
    case 'EASY': return generateEasy();
    case 'MEDIUM': return generateMedium();
    case 'HARD': return generateHard();
    case 'EXPERT': return generateExpert();
    default: return generateEasy();
  }
};

const generateEasy = (): NumberQuestion => {
  const ops = ['+', '-', '*'];
  const op = ops[getRandomInt(0, ops.length - 1)];
  
  if (op === '+') {
    const type = getRandomInt(0, 1);
    if (type === 0) {
      const a = getRandomInt(10, 40);
      const b = getRandomInt(10, 40);
      return { expression: `${a} + ${b}`, answer: a + b, hint: 'Just add the two numbers together.' };
    } else {
      const a = getRandomInt(5, 15);
      const b = getRandomInt(5, 15);
      const c = getRandomInt(5, 15);
      return { expression: `${a} + ${b} + ${c}`, answer: a + b + c, hint: 'Add all three numbers.' };
    }
  } else if (op === '-') {
    const a = getRandomInt(20, 50);
    const b = getRandomInt(5, a); // ensure positive answer
    return { expression: `${a} - ${b}`, answer: a - b, hint: 'Subtract the second number from the first.' };
  } else {
    const a = getRandomInt(3, 12);
    const b = getRandomInt(3, 12);
    return { expression: `${a} × ${b}`, answer: a * b, hint: 'Simple multiplication.' };
  }
};

const generateMedium = (): NumberQuestion => {
  const ops = ['+', '-', '*', '/'];
  const op = ops[getRandomInt(0, ops.length - 1)];

  if (op === '+') {
    const a = getRandomInt(40, 150);
    const b = getRandomInt(40, 150);
    return { expression: `${a} + ${b}`, answer: a + b, hint: 'Add the tens first, then the ones.' };
  } else if (op === '-') {
    const a = getRandomInt(100, 300);
    const b = getRandomInt(25, a);
    return { expression: `${a} - ${b}`, answer: a - b, hint: 'Subtract carefully.' };
  } else if (op === '*') {
    const a = getRandomInt(10, 25);
    const b = getRandomInt(5, 15);
    return { expression: `${a} × ${b}`, answer: a * b, hint: 'Break it down: multiply by 10 then add the rest.' };
  } else {
    // Division: ensure clean integer result
    const b = getRandomInt(4, 15);
    const answer = getRandomInt(5, 20);
    const a = b * answer;
    return { expression: `${a} ÷ ${b}`, answer, hint: 'Think of the multiplication table backwards.' };
  }
};

const generateHard = (): NumberQuestion => {
  const type = getRandomInt(0, 4);
  
  if (type === 0) {
    // (A * B) + C
    const a = getRandomInt(15, 35);
    const b = getRandomInt(3, 15);
    const c = getRandomInt(20, 100);
    return {
      expression: `(${a} × ${b}) + ${c}`,
      answer: (a * b) + c,
      hint: 'Remember PEMDAS. Multiply first, then add.'
    };
  } else if (type === 1) {
    // (C - A) * B
    const a = getRandomInt(15, 40);
    const validC = a + getRandomInt(10, 30); // ensure positive subtraction
    const b = getRandomInt(4, 15);
    return {
      expression: `(${validC} - ${a}) × ${b}`,
      answer: (validC - a) * b,
      hint: 'Solve the parenthesis first.'
    };
  } else if (type === 2) {
    // A * B - C
    const a = getRandomInt(12, 25);
    const b = getRandomInt(4, 15);
    const mult = a * b;
    const validC = getRandomInt(10, mult);
    return {
      expression: `(${a} × ${b}) - ${validC}`,
      answer: mult - validC,
      hint: 'Multiply first, then subtract.'
    };
  } else if (type === 3) {
    // (D / C) + A * B
    const c = getRandomInt(3, 12);
    const ansPart1 = getRandomInt(6, 25);
    const d = c * ansPart1;
    const a = getRandomInt(5, 12);
    const b = getRandomInt(5, 12);
    return {
      expression: `(${d} ÷ ${c}) + (${a} × ${b})`,
      answer: ansPart1 + (a * b),
      hint: 'Do the division and multiplication separately, then add.'
    };
  } else {
    // X% of Y
    const percentages = [10, 20, 25, 50, 75];
    const perc = percentages[getRandomInt(0, percentages.length - 1)];
    let base = getRandomInt(10, 100) * 4;
    if (perc === 10) base = getRandomInt(10, 200) * 10;
    if (perc === 20) base = getRandomInt(10, 100) * 5;
    
    return {
      expression: `${perc}% of ${base}`,
      answer: (perc / 100) * base,
      hint: `Convert the percentage to a fraction (e.g. 50% is half).`
    };
  }
};

const generateExpert = (): NumberQuestion => {
  const type = getRandomInt(0, 5);
  
  if (type === 0) {
    // (A * B) - (C * C)
    const a = getRandomInt(12, 25);
    const b = getRandomInt(10, 25);
    const c = getRandomInt(5, 15);
    return {
      expression: `(${a} × ${b}) - (${c} × ${c})`,
      answer: (a * b) - (c * c),
      hint: 'Calculate both multiplications first, then subtract the results.'
    };
  } else if (type === 1) {
    // A * (B + C) - D
    const a = getRandomInt(8, 20);
    const b = getRandomInt(10, 30);
    const c = getRandomInt(5, 20);
    const mult = a * (b + c);
    const d = getRandomInt(20, mult);
    return {
      expression: `${a} × (${b} + ${c}) - ${d}`,
      answer: mult - d,
      hint: 'Parentheses first, then multiply, then subtract.'
    };
  } else if (type === 2) {
    // Square root plus math: sqrt(A) * B + C
    const squares = [16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225];
    const a = squares[getRandomInt(0, squares.length - 1)];
    const root = Math.sqrt(a);
    const b = getRandomInt(10, 30);
    const c = getRandomInt(10, 100);
    
    return {
      expression: `(√${a} × ${b}) + ${c}`,
      answer: (root * b) + c,
      hint: 'Find the square root, multiply, then add.'
    };
  } else if (type === 3) {
    // (A + B) * (C - D)
    const a = getRandomInt(15, 45);
    const b = getRandomInt(15, 45);
    const c = getRandomInt(20, 50);
    const d = getRandomInt(5, c - 1);
    
    return {
      expression: `(${a} + ${b}) × (${c} - ${d})`,
      answer: (a + b) * (c - d),
      hint: 'Solve both parentheses first, then multiply.'
    };
  } else if (type === 4) {
    // (A / B) * C - D
    const b = getRandomInt(3, 15);
    const divRes = getRandomInt(5, 25);
    const a = b * divRes;
    const c = getRandomInt(4, 15);
    const d = getRandomInt(10, divRes * c - 1);
    return {
      expression: `(${a} ÷ ${b}) × ${c} - ${d}`,
      answer: (a / b) * c - d,
      hint: 'Divide, then multiply, then subtract.'
    };
  } else {
    // Fraction of a number: (Num/Denom) of Base
    const fractions = [{n: 1, d: 3}, {n: 2, d: 3}, {n: 1, d: 4}, {n: 3, d: 4}, {n: 2, d: 5}, {n: 3, d: 5}, {n: 4, d: 5}];
    const f = fractions[getRandomInt(0, fractions.length - 1)];
    const base = getRandomInt(10, 50) * f.d;
    return {
      expression: `${f.n}/${f.d} of ${base}`,
      answer: (f.n * base) / f.d,
      hint: 'Divide the number by the denominator, then multiply by the numerator.'
    };
  }
};
