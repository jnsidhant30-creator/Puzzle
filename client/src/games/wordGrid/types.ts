export interface WordLocation {
  word: string;
  r: number;
  c: number;
  dr: number;
  dc: number;
  found: boolean;
}

export interface WordGridPuzzle {
  id: string;
  rows: number;
  cols: number;
  grid: string[][];
  words: WordLocation[];
  difficulty: string;
}
