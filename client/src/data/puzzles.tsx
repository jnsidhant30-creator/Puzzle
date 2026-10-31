import React from 'react';
import { Hash, Type, Brain, Grid3X3, Lightbulb, Shapes, Map, ScanLine, Workflow, Palette, Blocks, RotateCw, Table2, Shuffle } from 'lucide-react';

export const defaultPuzzles = [
  { id: 'num', category: 'Numbers', title: 'Number Puzzle', description: 'Solve numbers before time runs out.', difficulty: 'Medium' as const, icon: <Hash className="w-5 h-5" />, route: '/game/number' },
  { id: 'lgc', category: 'Logic', title: 'Logic Puzzle', description: 'Use deduction to solve challenging problems.', difficulty: 'Hard' as const, icon: <Lightbulb className="w-5 h-5" />, route: '/game/logic' },
  { id: 'npt', category: 'Numbers', title: 'Number Path', description: 'Follow the numbers in the correct sequence.', difficulty: 'Medium' as const, icon: <Workflow className="w-5 h-5" />, route: '/game/number-path' },
  
  { id: 'wrd', category: 'Words', title: 'Word Puzzle', description: 'Unscramble letters and solve words.', difficulty: 'Medium' as const, icon: <Type className="w-5 h-5" />, route: '/game/word' },
  { id: 'wgd', category: 'Words', title: 'Word Grid', description: 'Find hidden words inside the letter grid.', difficulty: 'Medium' as const, icon: <Table2 className="w-5 h-5" />, route: '/game/word-grid' },
  
  { id: 'mem', category: 'Memory', title: 'Memory Puzzle', description: 'Match hidden pairs and test your memory.', difficulty: 'Easy' as const, icon: <Brain className="w-5 h-5" />, route: '/game/memory' },
  
  { id: 'arr', category: 'Spatial & Path', title: 'Arrow Path', description: 'Follow the arrows and reach the target.', difficulty: 'Medium' as const, icon: <Map className="w-5 h-5" />, route: '/game/arrow' },
  { id: 'maz', category: 'Spatial & Path', title: 'Maze Escape', description: 'Navigate the maze and find the exit.', difficulty: 'Medium' as const, icon: <Map className="w-5 h-5" />, route: '/game/maze' },
  { id: 'clr', category: 'Spatial & Path', title: 'Color Path', description: 'Connect matching endpoints without crossing paths.', difficulty: 'Medium' as const, icon: <Palette className="w-5 h-5" />, route: '/game/color' },
  { id: 'pip', category: 'Spatial & Path', title: 'Pipe Connect', description: 'Rotate pipes and connect the entire network.', difficulty: 'Medium' as const, icon: <Workflow className="w-5 h-5" />, route: '/game/pipe' },
  { id: 'lsr', category: 'Spatial & Path', title: 'Laser Mirror', description: 'Rotate mirrors and guide the laser to the target.', difficulty: 'Hard' as const, icon: <ScanLine className="w-5 h-5" />, route: '/game/laser' },
  { id: 'blk', category: 'Spatial & Path', title: 'Block Escape', description: 'Move the blocks and free the target.', difficulty: 'Hard' as const, icon: <Blocks className="w-5 h-5" />, route: '/game/block' },
  
  { id: 'ptr', category: 'Pattern & Visual', title: 'Pattern Puzzle', description: 'Find the missing piece in the pattern.', difficulty: 'Medium' as const, icon: <Shapes className="w-5 h-5" />, route: '/game/pattern' },
  { id: 'rot', category: 'Pattern & Visual', title: 'Rotating Tiles', description: 'Rotate tiles and build the complete connection.', difficulty: 'Medium' as const, icon: <RotateCw className="w-5 h-5" />, route: '/game/rotate' },
  { id: 'sld', category: 'Pattern & Visual', title: 'Sliding Puzzle', description: 'Slide tiles into the correct order.', difficulty: 'Hard' as const, icon: <Grid3X3 className="w-5 h-5" />, route: '/game/sliding' },
  
  { id: 'rnd', category: 'Challenge', title: 'Random Challenge', description: 'Play a random puzzle from the library.', difficulty: 'Expert' as const, icon: <Shuffle className="w-5 h-5" />, route: '/challenge' },
];
