export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type CellType = 'START' | 'TARGET' | 'HURDLE' | 'EMPTY' | 'ARROW';

export interface ArrowCell {
  r: number;
  c: number;
  type: CellType;
  direction?: Direction;
}

export interface ArrowPathPuzzle {
  grid: ArrowCell[][];
  rows: number;
  cols: number;
  start: { r: number; c: number };
  target: { r: number; c: number };
  path: { r: number; c: number }[]; // The intended solution path
}
