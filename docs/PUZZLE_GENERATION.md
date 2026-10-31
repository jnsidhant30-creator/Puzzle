# Puzzle Generation Architecture

This document describes the procedural puzzle-generation architecture in PuzzleVerse across all 16 available game modes.

## The 16 Game Engine Generators

1. **Number Puzzle**: Math sequences and basic arithmetic.
2. **Word Puzzle**: Dictionary-based anagrams and missing letters.
3. **Memory Puzzle**: Matrix of randomly assigned symbol/emoji pairs.
4. **Sliding Puzzle**: Guaranteed solvable NxN inversions.
5. **Logic Puzzle**: Deduction matrix generated from static rule-sets.
6. **Pattern Puzzle**: Visual sequences (rotations, mirrors).
7. **Arrow Path**: Graph traversal following directional grids.
8. **Maze Escape**: Randomized Kruskal's or DFS maze generation.
9. **Laser Mirror**: Ray-casting through a grid of reflective blocks.
10. **Pipe Connect**: Connection of start/end nodes without overlap.
11. **Color Path**: Strategic color-matching pathfinding.
12. **Block Escape**: Unblock the red block.
13. **Number Path**: Sequential number graph traversal.
14. **Rotating Tiles**: Image/Path restoration via 90-degree rotations.
15. **Word Grid**: Word-search matrix generation.
16. **Challenge Mode**: Real-time aggregator of multiple game modes.

## Color Path Game (Phase 30)

### ColorPathGenerator
The `ColorPathGenerator` produces a tile-based connection puzzle. 

### Endpoint-Pair Model
- **Grid**: An `R x C` grid of `CellModel` items.
- **Cell states**: `empty`, `endpoint`, `path`, `blocked`.
- **Color Pairs**: Consists of a unique `colorId`, visual `displayColor`, accessible `label`, `start` Position, and `target` Position.

### Solution-First Generation
To ensure solvability, we use a solution-first approach:
1. Initialize an empty board based on the selected difficulty dimensions.
2. Select random positions as "blockers" if applicable.
3. Iteratively generate random walks for each required color pair. The random walk avoids self-intersection and cells occupied by previous paths or blockers.
4. If a valid set of non-overlapping paths is found for all pairs, the generation succeeds.
5. The completed paths are stored in the `solution` state, while the visible grid is reset to only display the `endpoint` cells and `blockers`.

### Path Generation & Non-Crossing Validation
- Paths are generated via a constrained random walk.
- Valid neighbors are limited to `empty` cells (preventing crossing and overlapping inherently since cells cannot hold multiple colors).
- Diagonals are not permitted.
- A path must reach a minimum length dictated by the difficulty level before it can terminate as a target endpoint.

### Difficulty Scaling
- **EASY**: 5x5 grid, 3 color pairs, 0 blockers. Short paths.
- **MEDIUM**: 6x6 grid, 4 color pairs, 2 blockers. 
- **HARD**: 8x8 grid, 6 color pairs, 4 blockers.
- **EXPERT**: 10x10 grid, 8 color pairs, 8 blockers. Long paths required.

### Duplicate Prevention
- Uses the centralized `duplicatePrevention` module.
- Generates a `fingerprint` based on grid dimensions, endpoint locations, and blocker locations.
- Checks against `localStorage` history of the last N puzzles to ensure the player receives a truly fresh hurdle upon "Play Again".
- If generation produces a duplicate, the seed is incremented, and generation is re-attempted.

### Future Puzzle-Generation Extensions
- Additional board shapes (hexagons, triangles).
- Portals (endpoints that warp a path to another section of the board).
- Bridges (cells that allow exactly two paths to cross without connecting).

## 8. Block Escape Game
**Path:** `/client/src/games/block/blockEscapeGenerator.ts`
- **Pattern:** Solution-first + Reverse Scramble.
- **Mechanism:** Places the target block at the exit in a 6x6 (or 7x7) grid. Adds random blocks ensuring no overlap. Performs a randomized valid move walk backwards for $N$ steps to scramble the board. Finally, runs BFS from scrambled state to exit to ensure minimum solution depth `>= minMoves`.
- **Duplicate Prevention:** Hash of `(rows,cols,blocks)`.
- **Difficulty:** Easy (Depth 5), Medium (Depth 10), Hard (Depth 15), Expert (7x7, Depth 20).

## 9. Number Path Game
**Path:** `/client/src/games/numberPath/numberPathGenerator.ts`
- **Pattern:** Validated Random Walk.
- **Mechanism:** Selects a random sequence of arithmetic operations based on difficulty. From a start position (usually top-left), performs a random walk without intersecting itself, applying operations to compute a target value.
- **Duplicate Prevention:** Hash of grid layout, operations, and target value.

## 10. Rotating Tiles Game
**Path:** `/client/src/games/rotate/rotatingTilesGenerator.ts`
- **Pattern:** Solution-first + Scramble.
- **Mechanism:** Builds a fully connected network using a Kruskal-like MST or random recursive walk to ensure exactly one connected component covering all cells. The grid is then randomly scrambled by rotating each tile by 90, 180, or 270 degrees.
- **Duplicate Prevention:** Hash of the scrambled grid configurations.

## 11. Word Grid Game
**Path:** `/client/src/games/wordGrid/wordGridGenerator.ts`
- **Pattern:** Constrained Placement.
- **Mechanism:** Selects N words from the dictionary. Randomly places them in allowed directions (horizontal, vertical, diagonal) ensuring they do not conflict with existing letters. Fills remaining spaces with random (often weighted) letters.
- **Duplicate Prevention:** Hash of grid content and selected words.

## 12. Challenge Mode
**Path:** `/client/src/games/challenge/ChallengeGame.tsx`
- **Pattern:** Procedural Game Aggregator.
- **Mechanism:** Randomly selects 1 (Quick) or 5 (Run) procedural games sequentially, passing a `ChallengeContext`. Game components detect the context, bypass individual Firestore result processing, and yield their intermediate scores and stats to the Challenge Engine.
- **Persistence:** Submits a single, aggregated game session (`type: 'CHALLENGE'`) to Firestore at the end of a multi-game run.
