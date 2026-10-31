export type CellType = 'WALL' | 'PATH' | 'START' | 'EXIT';

export interface MazeCell {
  r: number;
  c: number;
  type: CellType;
}

export interface MazePuzzle {
  grid: MazeCell[][];
  rows: number;
  cols: number;
  start: { r: number; c: number };
  exit: { r: number; c: number };
}
