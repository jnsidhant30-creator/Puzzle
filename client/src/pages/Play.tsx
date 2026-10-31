import { useState } from 'react';
import { GameEngine } from '../components/game/GameEngine';
import { NumberPuzzle } from '../components/game/puzzles/NumberPuzzle';
import { Button } from '../components/ui/Button';

// Mock puzzle data
const MOCK_PUZZLE = {
  id: '1',
  title: 'Number Ascend',
  type: 'NUMBER' as const,
  difficulty: 'MEDIUM',
  timeLimit: 60,
  content: { sequence: [45, 12, 89, 4, 23] }
};

export const Play = () => {
  const [result, setResult] = useState<{success: boolean, time: number} | null>(null);

  const handleComplete = (isSuccess: boolean, duration: number) => {
    setResult({ success: isSuccess, time: duration });
    // Here we would normally make an API call to the backend to submit the score
  };

  if (result) {
    return (
      <div className="text-center py-20 space-y-6">
        <h2 className="text-4xl font-bold">{result.success ? '🎉 PUZZLE COMPLETE!' : '❌ PUZZLE FAILED'}</h2>
        <div className="glass inline-block p-8 rounded-2xl text-left space-y-4">
          <p className="text-textMuted">Time taken: <span className="text-textMain font-bold">{result.time}s</span></p>
          {result.success && <p className="text-textMuted">Score Earned: <span className="text-success font-bold">+150 XP</span></p>}
        </div>
        <div className="pt-8">
          <Button onClick={() => window.location.href = '/'}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-10">
      <GameEngine 
        puzzle={MOCK_PUZZLE}
        puzzleComponent={<NumberPuzzle sequence={MOCK_PUZZLE.content.sequence} onSubmit={(s) => handleComplete(s, 0)} />}
        onComplete={handleComplete}
      />
    </div>
  );
};
