export type CellType = 'EMPTY' | 'EMITTER' | 'TARGET' | 'MIRROR';
export type MirrorType = 'FORWARD' | 'BACKWARD'; // FORWARD = /, BACKWARD = \
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface LaserCell {
  r: number;
  c: number;
  type: CellType;
  mirrorType?: MirrorType;
  emitterDirection?: Direction;
  hasLaser?: boolean; // If laser passes through
  laserDirections?: Direction[]; // For rendering lines
}

export interface LaserPuzzle {
  grid: LaserCell[][];
  rows: number;
  cols: number;
  emitter: { r: number; c: number };
  target: { r: number; c: number };
}
