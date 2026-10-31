import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const PUZZLE_INFO: Record<string, { title: string, desc: string }> = {
  number: { title: 'Number Puzzle', desc: 'Solve mathematical challenges and logic sequences.' },
  word: { title: 'Word Puzzle', desc: 'Unscramble words and find hidden meanings.' },
  memory: { title: 'Memory Puzzle', desc: 'Test your recall and visual memory.' },
  sliding: { title: 'Sliding Puzzle', desc: 'Slide the tiles to form the correct image.' },
  logic: { title: 'Logic Puzzle', desc: 'Use pure deduction to find the solution.' },
  pattern: { title: 'Pattern Puzzle', desc: 'Identify the sequence and continue the pattern.' }
};

export const GamePlaceholder = () => {
  const { type } = useParams<{ type: string }>();
  
  const info = type && PUZZLE_INFO[type] ? PUZZLE_INFO[type] : { title: 'Unknown Puzzle', desc: 'This puzzle type does not exist.' };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-textMuted hover:text-textMain transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <Card className="glass border-primary/20">
        <CardContent className="p-8 md:p-12 text-center space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-textMain mb-4">{info.title}</h1>
            <p className="text-textMuted max-w-lg mx-auto">{info.desc}</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-textMain">Game Engine Loading...</h3>
              <p className="text-sm text-textMuted">This module is scheduled for a future phase.</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="secondary" disabled>Easy</Button>
            <Button variant="secondary" className="border-primary text-primary bg-primary/5" disabled>Medium</Button>
            <Button variant="secondary" disabled>Hard</Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};
