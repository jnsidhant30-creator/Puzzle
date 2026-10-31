import React from 'react';

export const gameRegistry: Record<string, React.ComponentType> = {
  number: React.lazy(() => import('./number/NumberPuzzle').then(m => ({ default: m.NumberPuzzle }))),
  word: React.lazy(() => import('./word/WordPuzzle').then(m => ({ default: m.WordPuzzle }))),
  memory: React.lazy(() => import('./memory/MemoryPuzzle').then(m => ({ default: m.MemoryPuzzle }))),
  sliding: React.lazy(() => import('./sliding/SlidingPuzzle').then(m => ({ default: m.SlidingPuzzle }))),
  logic: React.lazy(() => import('./logic/LogicPuzzle').then(m => ({ default: m.LogicPuzzle }))),
  pattern: React.lazy(() => import('./pattern/PatternPuzzle').then(m => ({ default: m.PatternPuzzle }))),
  pipe: React.lazy(() => import('./pipe/PipeGame').then(m => ({ default: m.PipeGame }))),
  color: React.lazy(() => import('./color/ColorPathGame').then(m => ({ default: m.ColorPathGame }))),
  block: React.lazy(() => import('./block/BlockEscapeGame').then(m => ({ default: m.BlockEscapeGame }))),
  'number-path': React.lazy(() => import('./numberPath/NumberPathGame').then(m => ({ default: m.NumberPathGame }))),
  rotate: React.lazy(() => import('./rotate/RotatingTilesGame').then(m => ({ default: m.RotatingTilesGame }))),
  'word-grid': React.lazy(() => import('./wordGrid/WordGridGame').then(m => ({ default: m.WordGridGame }))),
  challenge: React.lazy(() => import('./challenge/ChallengeGame').then(m => ({ default: m.ChallengeGame }))),
  arrow: React.lazy(() => import('./arrow/ArrowPathGame').then(m => ({ default: m.ArrowPathGame }))),
  maze: React.lazy(() => import('./maze/MazeEscapeGame').then(m => ({ default: m.MazeEscapeGame }))),
  laser: React.lazy(() => import('./laser/LaserMirrorGame').then(m => ({ default: m.LaserMirrorGame }))),
};
