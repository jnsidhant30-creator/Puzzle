// Pipe game type definitions

export const PipeType = {
  STRAIGHT: 'STRAIGHT',
  CORNER: 'CORNER',
  T_JUNCTION: 'T_JUNCTION',
  CROSS: 'CROSS',
  SOURCE: 'SOURCE',
  TARGET: 'TARGET',
  BLOCKER: 'BLOCKER',
} as const;

export type PipeType = typeof PipeType[keyof typeof PipeType];

export interface PipeConnections {
  up: boolean;
  right: boolean;
  down: boolean;
  left: boolean;
}

export interface PipeTileData {
  row: number;
  col: number;
  type: PipeType;
  rotation: number; // 0, 90, 180, 270 degrees
  connections: PipeConnections;
  locked?: boolean; // true for source/target/blocker if not interactive
}

/** Utility to rotate connections clockwise */
export const rotateConnections = (conn: PipeConnections, rotation: number): PipeConnections => {
  const steps = ((rotation % 360) + 360) % 360 / 90;
  let { up, right, down, left } = conn;
  for (let i = 0; i < steps; i++) {
    const tmp = up;
    up = left;
    left = down;
    down = right;
    right = tmp;
  }
  return { up, right, down, left };
};
