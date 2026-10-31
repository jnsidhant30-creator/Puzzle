export type PuzzleType = 'NUMBER' | 'WORD' | 'MEMORY' | 'SLIDING' | 'LOGIC' | 'PATTERN' | 'ARROW_PATH' | 'MAZE_ESCAPE' | 'LASER_MIRROR' | 'PIPE' | 'COLOR_PATH' | 'BLOCK_ESCAPE' | 'NUMBER_PATH' | 'ROTATE' | 'WORD_GRID' | 'CHALLENGE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface HintResponse {
  level: number;
  text: string;
}

/**
 * A central deterministic hint engine that provides hints without relying on an external AI API.
 * This is designed to be extensible per game.
 */
export const getHint = (
  gameType: PuzzleType,
  puzzleState: any, // The specific state of the game
  difficulty: Difficulty,
  hintsUsed: number // 0 = first hint, 1 = second hint, etc.
): HintResponse => {
  const level = hintsUsed + 1; // 1, 2, or 3
  
  if (level > 3) {
    return { level: 3, text: "You have used all available hints for this puzzle." };
  }

  switch (gameType) {
    case 'NUMBER':
      return getNumberHint(level, puzzleState);
    case 'WORD':
      return getWordHint(level, puzzleState);
    case 'MEMORY':
      return getMemoryHint(level);
    case 'SLIDING':
      return getSlidingHint(level);
    case 'LOGIC':
      return getLogicHint(level);
    case 'PATTERN':
      return getPatternHint(level);
    case 'PIPE':
      return getPipeHint(level);
    case 'COLOR_PATH':
      return getColorPathHint(level);
    case 'BLOCK_ESCAPE':
      return getBlockEscapeHint(level);
    case 'NUMBER_PATH':
      return getNumberPathHint(level);
    case 'ROTATE':
      return getRotateHint(level);
    case 'WORD_GRID':
      return getWordGridHint(level, puzzleState);
    case 'ARROW_PATH':
      return getArrowPathHint(level);
    case 'MAZE_ESCAPE':
      return getMazeEscapeHint(level);
    case 'LASER_MIRROR':
      return getLaserMirrorHint(level);
    case 'CHALLENGE':
      return { level, text: "Focus and look carefully at the specific challenge rules." };
    default:
      return { level, text: "Take a step back and look for patterns." };
  }
};

// ------------------------------------------------------------------
// GAME SPECIFIC HINT LOGIC
// ------------------------------------------------------------------

const getNumberHint = (level: number, state?: any): HintResponse => {
  if (level === 1) return { level, text: "Look for the mathematical relationship between the values." };
  if (level === 2) return { level, text: "Compare the difference between consecutive numbers." };
  return { level, text: "Check whether the sequence alternates between two operations or forms a common progression." };
};

const getWordHint = (level: number, state?: any): HintResponse => {
  if (level === 1) return { level, text: "Think about the meaning of the given clue." };
  if (level === 2) {
    if (state?.word) {
      return { level, text: `Focus on words that begin with '${state.word[0]}'.` };
    }
    return { level, text: "Focus on the first part of the word." };
  }
  return { level, text: "Try to find the vowels first, they often form the structure." };
};

const getMemoryHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Focus on the position of the recently revealed tile." };
  if (level === 2) return { level, text: "Remember the location of matching symbols." };
  return { level, text: "Start by checking the last two positions you saw." };
};

const getSlidingHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Think about where the empty space needs to move." };
  if (level === 2) return { level, text: "Move the tile that opens the next required position." };
  return { level, text: "Create space beside the tile that belongs in the next position." };
};

const getLogicHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Look for the constraint that applies to every row." };
  if (level === 2) return { level, text: "Check which option violates the known condition." };
  return { level, text: "Eliminate the options that break the strongest constraint." };
};

const getPatternHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Compare how the pattern changes from one step to the next." };
  if (level === 2) return { level, text: "Look at the direction and repetition of the changes." };
  return { level, text: "Focus on the repeating transformation (rotation, color swap, or movement)." };
};

const getPipeHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Start by connecting pipes from the outer edges." };
  if (level === 2) return { level, text: "Look for open pipe ends that have only one possible connection." };
  return { level, text: "Trace the required path backward from the end goal." };
};

const getColorPathHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Focus on connecting the closest matching colors first." };
  if (level === 2) return { level, text: "Ensure your path doesn't cut off other required connections." };
  return { level, text: "Hug the walls for long paths to leave the center open." };
};

const getBlockEscapeHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Focus on clearing the row directly in front of the target block." };
  if (level === 2) return { level, text: "You may need to move pieces backward to free up vertical space." };
  return { level, text: "Identify the 'key piece' blocking the exit and trace what is blocking it." };
};

const getNumberPathHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Check the sequence continuity from your current position." };
  if (level === 2) return { level, text: "Look for the next valid number in adjacent cells." };
  return { level, text: "Avoid boxing yourself into a corner; leave an exit route." };
};

const getRotateHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Check the edge matching for the corners first." };
  if (level === 2) return { level, text: "Align the center tile's orientation with its neighbors." };
  return { level, text: "Rotate pieces so their contiguous lines form closed loops or straight connections." };
};

const getWordGridHint = (level: number, state?: any): HintResponse => {
  if (level === 1) return { level, text: "Scan for common prefixes and suffixes." };
  if (level === 2) return { level, text: "Look at the clue and find its starting letter in the grid." };
  if (level === 3 && state?.word) return { level, text: `The word you need starts with '${state.word[0]}'.` };
  return { level, text: "Trace snake-like paths through adjacent letters." };
};

const getArrowPathHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Follow the valid direction indicated by the arrows." };
  if (level === 2) return { level, text: "Ensure path continuity; don't step on tiles pointing backward." };
  return { level, text: "Look for the only reachable tile that points toward the goal." };
};

const getMazeEscapeHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Look ahead to avoid dead ends." };
  if (level === 2) return { level, text: "Follow the wall on your right to trace a path out." };
  return { level, text: "Find the general direction of the exit and prioritize moves toward it." };
};

const getLaserMirrorHint = (level: number): HintResponse => {
  if (level === 1) return { level, text: "Trace the beam direction from the source." };
  if (level === 2) return { level, text: "Adjust the mirror orientation to turn the beam 90 degrees." };
  return { level, text: "Align the final mirror so the beam hits the target receptor." };
};
