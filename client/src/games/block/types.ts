export type BlockAxis = 'H' | 'V';

export interface BlockModel {
  id: string;
  r: number;
  c: number;
  len: number;
  axis: BlockAxis;
  isTarget: boolean;
  color?: string; // e.g. tailwind class
}

export interface BlockEscapePuzzle {
  id: string;
  rows: number;
  cols: number;
  exitR: number;
  exitC: number;
  blocks: BlockModel[];
  difficulty: string;
  minMoves: number;
}
