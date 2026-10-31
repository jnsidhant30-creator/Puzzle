import type { PipeTileData } from '../pipe/types';

export interface RotatingTilesPuzzle {
  id: string;
  rows: number;
  cols: number;
  tiles: PipeTileData[][];
  difficulty: string;
}
