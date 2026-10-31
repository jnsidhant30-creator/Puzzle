import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Lightbulb, Target, Info, CheckCircle, HelpCircle } from 'lucide-react';

interface TutorialContent {
  goal: string;
  stage1: string[];
  stage2: string;
  tip?: string;
}

export const TUTORIAL_DATA: Record<string, TutorialContent> = {
  'Number Puzzle': {
    goal: 'Solve the math expression.',
    stage1: ['Read the question carefully.', 'Calculate the answer.', 'Enter the correct number.'],
    stage2: 'Introduce slightly more complex calculations. Faster correct answers improve your score!',
    tip: 'Try to memorize common calculations.',
  },
  'Word Puzzle': {
    goal: 'Unscramble the word.',
    stage1: ['Identify the word challenge.', 'Rearrange or select the letters.', 'Submit the correct answer.'],
    stage2: 'Pay attention to the specific puzzle variation.',
  },
  'Memory Puzzle': {
    goal: 'Find all matching pairs.',
    stage1: ['Flip cards to see symbols.', 'Remember the positions of each symbol.', 'Match identical pairs.'],
    stage2: 'Focus on move efficiency by remembering previously revealed cards.',
    tip: 'Take your time to memorize the first few flips.',
  },
  'Sliding Puzzle': {
    goal: 'Restore the image/pattern.',
    stage1: ['Move tiles into the empty space.', 'Form the target arrangement.'],
    stage2: 'Plan your moves ahead to avoid getting stuck.',
    tip: 'Start by solving the top row first.',
  },
  'Logic Puzzle': {
    goal: 'Find the logically correct answer.',
    stage1: ['Read the problem carefully.', 'Select the logically correct answer.'],
    stage2: 'Clues must be combined rather than guessed.',
  },
  'Pattern Puzzle': {
    goal: 'Find the missing element.',
    stage1: ['Observe the pattern.', 'Identify the missing or next element.'],
    stage2: 'Look for rotation, position, shape or sequence changes.',
  },
  'Arrow Path': {
    goal: 'Reach the target by following the arrows.',
    stage1: ['Follow arrows from Start to Goal.', 'Avoid blocked cells.'],
    stage2: 'Watch for dead ends and decoy paths.',
    tip: 'Plan your route before moving.',
  },
  'Maze Escape': {
    goal: 'Find the exit.',
    stage1: ['Move from Start to Exit.', 'Avoid walls.'],
    stage2: 'Plan the route and avoid dead ends.',
  },
  'Laser Mirror': {
    goal: 'Hit the target with the laser.',
    stage1: ['Rotate mirrors.', 'Direct the laser toward the target.'],
    stage2: 'Understand how mirror orientation changes laser direction.',
  },
  'Pipe Connect': {
    goal: 'Connect source to target.',
    stage1: ['Rotate pipe pieces.', 'Connect the source to the target.'],
    stage2: 'Inspect all connections before committing to a route.',
  },
  'Color Path': {
    goal: 'Connect matching colors.',
    stage1: ['Connect matching endpoints.', 'Paths cannot cross each other.'],
    stage2: 'Plan space carefully and avoid blocking other paths.',
    tip: 'Connect the outer paths first.',
  },
  'Block Escape': {
    goal: 'Free the target block.',
    stage1: ['Move blocks out of the way.', 'Clear the path for the target block.'],
    stage2: 'Plan multiple moves ahead.',
  },
  'Number Path': {
    goal: 'Follow the sequence.',
    stage1: ['Move through numbers in the required sequence.'],
    stage2: 'Avoid decoys and blocked cells.',
  },
  'Rotating Tiles': {
    goal: 'Connect the network.',
    stage1: ['Rotate tiles.', 'Connect the network.'],
    stage2: 'Inspect how one tile affects neighboring connections.',
  },
  'Word Grid': {
    goal: 'Find hidden words.',
    stage1: ['Find the listed words in the grid.', 'Drag or select them.'],
    stage2: 'Watch out for diagonal or backward words.',
  },
  'Challenge Run': {
    goal: 'Complete a random sequence of puzzles.',
    stage1: ['Each challenge randomly selects a supported puzzle.', 'Complete them to progress.'],
    stage2: 'Each new challenge may use a different game or mechanic.',
  }
};

interface TutorialModalProps {
  gameTitle: string;
  stage: 1 | 2 | 'manual';
  onClose: () => void;
  onSkip: () => void;
}

export const TutorialModal = ({ gameTitle, stage, onClose, onSkip }: TutorialModalProps) => {
  const content = TUTORIAL_DATA[gameTitle] || TUTORIAL_DATA['Challenge Run']; // Fallback
  
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
      <Card className="w-full max-w-md glass border-primary/30 shadow-[0_0_50px_rgba(var(--primary),0.15)] my-8">
        <CardContent className="p-8 text-center space-y-6">
          
          <div className="flex items-center justify-center gap-3 text-primary mb-2">
            {stage === 2 ? <CheckCircle className="w-8 h-8" /> : <HelpCircle className="w-8 h-8" />}
            <h2 className="text-2xl font-bold tracking-tight text-textMain uppercase">
              {stage === 2 ? 'STAGE 2' : 'HOW TO PLAY'}
            </h2>
          </div>

          <div className="bg-surface/80 border border-border p-5 rounded-xl text-left space-y-4">
            
            {stage === 2 ? (
              <>
                <p className="text-textMain font-bold text-lg">You're getting it!</p>
                <div className="space-y-1">
                  <p className="text-textMuted text-sm font-bold uppercase tracking-wider">Remember:</p>
                  <p className="text-textMain">{content.stage2}</p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-textMuted text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-secondary" /> Goal
                  </p>
                  <p className="text-textMain font-medium">{content.goal}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  <p className="text-textMuted text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" /> Instructions
                  </p>
                  <ul className="space-y-2">
                    {content.stage1.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-textMain text-sm">
                        <span className="text-primary font-bold">{idx + 1}.</span> {step}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {content.tip && (
                  <div className="space-y-1 pt-3 border-t border-border/50">
                    <p className="text-warning text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> Tip
                    </p>
                    <p className="text-textMain text-sm">{content.tip}</p>
                  </div>
                )}
              </>
            )}
            
          </div>

          <div className="space-y-3 pt-2">
            <Button className="w-full flex items-center justify-center gap-2" size="lg" onClick={onClose}>
              {stage === 2 ? 'CONTINUE' : 'GOT IT — START'}
            </Button>
            
            {stage !== 'manual' && (
              <button 
                onClick={onSkip}
                className="text-xs text-textMuted hover:text-textMain underline decoration-textMuted/30 underline-offset-4 transition-colors"
              >
                Don't show automatically
              </button>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};
