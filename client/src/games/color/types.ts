export type ColorId = number;

export type CellState = 'empty' | 'endpoint' | 'path' | 'blocked';

export interface Position {
  r: number;
  c: number;
}

export interface ColorPair {
  colorId: ColorId;
  displayColor: string;
  label: string;
  start: Position;
  target: Position;
}

export interface CellModel {
  r: number;
  c: number;
  state: CellState;
  colorId: ColorId | null;
  connectedTo: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
}

export interface ColorPathPuzzle {
  rows: number;
  cols: number;
  grid: CellModel[][];
  pairs: ColorPair[];
  solution: Position[][]; // Array of paths (each path is array of positions)
  difficulty: string;
}
