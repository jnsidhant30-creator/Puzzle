import { useState } from 'react';
import { Timer } from './Timer';
import { Button } from '../ui/Button';

// Mock types
type PuzzleType = 'NUMBER' | 'WORD' | 'LOGIC';
interface Puzzle {
  id: string;
  title: string;
  type: PuzzleType;
  difficulty: string;
  timeLimit: number;
  content: any;
}

interface GameEngineProps {
  puzzle: Puzzle;
  puzzleComponent: React.ReactNode;
  onComplete: (isSuccess: boolean, duration: number) => void;
}

export const GameEngine = ({ puzzle, puzzleComponent, onComplete }: GameEngineProps) => {
  const [state, setState] = useState<'READY' | 'PLAYING' | 'PAUSED' | 'COMPLETED'>('READY');

  const start = () => {
    setState('PLAYING');
  };

  const handleTimeout = () => {
    setState('COMPLETED');
    onComplete(false, puzzle.timeLimit);
  };



  if (state === 'READY') {
    return (
      <div className="text-center py-20 space-y-6">
        <h2 className="text-3xl font-bold">{puzzle.title}</h2>
        <p className="text-textMuted">Difficulty: <span className="text-textMain font-bold">{puzzle.difficulty}</span></p>
        <p className="text-textMuted">Time Limit: <span className="text-textMain font-bold">{puzzle.timeLimit}s</span></p>
        <Button size="lg" onClick={start}>START PUZZLE</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between p-4 glass rounded-xl">
        <div>
          <h2 className="text-xl font-bold">{puzzle.title}</h2>
          <span className="text-xs text-textMuted uppercase tracking-wider">{puzzle.type} - {puzzle.difficulty}</span>
        </div>
        <Timer 
          initialSeconds={puzzle.timeLimit} 
          isActive={state === 'PLAYING'} 
          onTimeout={handleTimeout} 
        />
      </header>

      <main className="min-h-[400px] glass rounded-xl p-8 flex flex-col items-center justify-center">
        {state === 'PLAYING' && puzzleComponent}
        {state === 'COMPLETED' && <div className="text-2xl font-bold">Processing Result...</div>}
      </main>
    </div>
  );
};
