export type CellType = 'START' | 'TARGET' | 'NUMBER' | 'DECOY' | 'BLOCKER' | 'EMPTY';

export interface NumberPathCell {
  r: number;
  c: number;
  type: CellType;
  value?: number; 
}

export interface NumberPathPuzzle {
  id: string;
  rows: number;
  cols: number;
  start: { r: number, c: number };
  target: { r: number, c: number };
  pathLength: number;
  grid: NumberPathCell[][];
  difficulty: string;
}
