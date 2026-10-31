import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Difficulty } from '../../games/core/types';

interface GameHeaderProps {
  title: string;
  difficulty: Difficulty;
  onExit?: () => void;
}

export const GameHeader = ({ title, difficulty, onExit }: GameHeaderProps) => {
  return (
    <div className="flex items-center justify-between pb-6 mb-6">
      <Link 
        to="/dashboard" 
        onClick={onExit}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-textMuted hover:bg-surface-elevated hover:text-textMain hover:border-border-hover font-semibold transition-all duration-300 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Exit</span>
      </Link>
      
      <div className="text-center bg-surface px-8 py-3 rounded-2xl border border-border shadow-sm relative overflow-hidden">
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <h1 className="text-2xl font-extrabold text-textMain tracking-tight mb-1">{title}</h1>
        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            difficulty === 'EASY' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
            difficulty === 'MEDIUM' ? 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
            difficulty === 'HARD' ? 'bg-error shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]'
          }`} />
          <p className="text-xs font-bold text-textMuted uppercase tracking-widest">
            {difficulty}
          </p>
        </div>
      </div>
      
      {/* Invisible spacer to perfectly center the title */}
      <div className="w-[88px] hidden sm:block"></div>
    </div>
  );
};
