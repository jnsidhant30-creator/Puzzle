// Seeded random number generator
let currentSeed = 1;

export const getGameSeed = (): number => {
  return Math.floor(Math.random() * 1000000);
};

export const setSeed = (seed: number) => {
  currentSeed = seed;
};

export const seededRandom = (): number => {
  const x = Math.sin(currentSeed++) * 10000;
  return x - Math.floor(x);
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
