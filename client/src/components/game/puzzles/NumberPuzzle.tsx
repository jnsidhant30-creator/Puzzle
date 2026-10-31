import { useState } from 'react';
import { Button } from '../../ui/Button';

interface NumberPuzzleProps {
  sequence: number[]; // e.g. [5, 2, 8, 1, 9]
  onSubmit: (isSuccess: boolean) => void;
}

export const NumberPuzzle = ({ sequence, onSubmit }: NumberPuzzleProps) => {
  const [currentOrder, setCurrentOrder] = useState<number[]>([]);
  const [available, setAvailable] = useState<number[]>(sequence);

  const selectNumber = (num: number) => {
    setCurrentOrder([...currentOrder, num]);
    setAvailable(available.filter(n => n !== num));
  };

  const reset = () => {
    setCurrentOrder([]);
    setAvailable(sequence);
  };

  const checkAnswer = () => {
    // Correct answer is ascending order
    const sorted = [...sequence].sort((a, b) => a - b);
    const isCorrect = currentOrder.join(',') === sorted.join(',');
    onSubmit(isCorrect);
  };

  return (
    <div className="space-y-8 w-full max-w-md text-center">
      <p className="text-lg text-gray-300 mb-4">Arrange the numbers in ascending order.</p>
      
      <div className="h-16 flex gap-2 justify-center items-center p-2 glass rounded-lg min-w-[300px]">
        {currentOrder.map((n, i) => (
          <div key={i} className="w-10 h-10 rounded bg-primary text-white flex items-center justify-center font-bold">
            {n}
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        {available.map((n, i) => (
          <button 
            key={i}
            onClick={() => selectNumber(n)}
            className="w-14 h-14 rounded-xl bg-surface hover:bg-white/10 border border-white/10 text-xl font-bold transition-transform hover:scale-110"
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex gap-4 justify-center pt-8">
        <Button variant="ghost" onClick={reset}>Reset</Button>
        <Button onClick={checkAnswer} disabled={available.length > 0}>Submit Answer</Button>
      </div>
    </div>
  );
};
