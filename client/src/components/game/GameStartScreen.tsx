import { useState } from 'react';
import { Button } from '../ui/Button';
import type { Difficulty } from '../../games/core/types';
import { Clock, HelpCircle, Target, Info, Lightbulb, Play } from 'lucide-react';
import { TUTORIAL_DATA } from './TutorialModal';

export interface GameDifficultyConfig {
  difficulty: Difficulty;
  timeLimit?: number; // in seconds
  questions?: number;
  hints?: number;
}

interface GameStartScreenProps {
  title: string;
  description: string;
  configs: GameDifficultyConfig[];
  onStart: (difficulty: Difficulty) => void;
}

export const GameStartScreen = ({ title, description, configs, onStart }: GameStartScreenProps) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(configs[0]?.difficulty || 'MEDIUM');
  const formatTime = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const tutorial = TUTORIAL_DATA[title] || TUTORIAL_DATA['Challenge Run'];

  return (
    <div className="max-w-2xl mx-auto mt-8 sm:mt-12 p-6 sm:p-8 bg-surface rounded-3xl border border-border text-center animate-in fade-in zoom-in duration-500 shadow-xl">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-textMain mb-4 tracking-tight uppercase">{title}</h1>
      <p className="text-textMuted text-base sm:text-lg mb-8 max-w-lg mx-auto">{description}</p>
      
      {/* Inline Tutorial Stage 1 */}
      <div className="bg-background/50 border border-border p-6 rounded-2xl text-left mb-8 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-textMain tracking-widest uppercase text-sm">How to Play</h3>
        </div>
        
        <div className="space-y-2">
          <p className="text-textMuted text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-secondary" /> Goal
          </p>
          <p className="text-textMain font-medium">{tutorial.goal}</p>
        </div>

        <div className="space-y-2 pt-3 border-t border-border/50">
          <ul className="space-y-2">
            {tutorial.stage1.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2 text-textMain text-sm">
                <span className="text-primary font-bold">{idx + 1}.</span> {step}
              </li>
            ))}
          </ul>
        </div>
        
        {tutorial.tip && (
          <div className="space-y-1 pt-3 border-t border-border/50">
            <p className="text-warning text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Tip
            </p>
            <p className="text-textMain text-sm">{tutorial.tip}</p>
          </div>
        )}
      </div>
      
      {/* Difficulty Selection */}
      <div className="space-y-4">
        <h3 className="font-bold text-textMuted tracking-widest uppercase text-xs text-left mb-2">Select Difficulty</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {configs.map((config) => {
            const { difficulty } = config;
            const isSelected = selectedDifficulty === difficulty;
            
            return (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`py-3 px-2 rounded-xl border text-sm font-bold tracking-wider transition-all ${
                  isSelected 
                    ? 'bg-primary text-white border-primary shadow-sm scale-[1.02]' 
                    : 'bg-surface border-border text-textMuted hover:border-primary/50 hover:text-textMain'
                }`}
              >
                {difficulty}
              </button>
            );
          })}
        </div>

        {/* Selected Config Info */}
        {configs.find(c => c.difficulty === selectedDifficulty) && (() => {
          const config = configs.find(c => c.difficulty === selectedDifficulty)!;
          return (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium w-full mt-4 bg-background/50 border border-border rounded-xl p-3">
              {config.timeLimit !== undefined && (
                <div className="flex items-center gap-1.5 text-textMain">
                  <Clock className="w-4 h-4 text-textMuted" /> {formatTime(config.timeLimit)}
                </div>
              )}
              {config.questions !== undefined && (
                <div className="flex items-center gap-1.5 text-textMain">
                  <Target className="w-4 h-4 text-textMuted" /> {config.questions} {config.questions === 1 ? 'Round' : 'Q\'s'}
                </div>
              )}
              {config.hints !== undefined && (
                <div className="flex items-center gap-1.5 text-textMain">
                  <HelpCircle className="w-4 h-4 text-textMuted" /> {config.hints} Hints
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <div className="mt-8">
        <Button 
          className="w-full text-lg h-16 font-bold shadow-lg flex items-center justify-center gap-2"
          onClick={() => onStart(selectedDifficulty)}
        >
          <span>Start Game</span>
          <Play className="w-5 h-5" fill="currentColor" />
        </Button>
      </div>
    </div>
  );
};
