import { Link } from 'react-router-dom';
import { Play, Star, Trophy, Clock } from 'lucide-react';

interface PuzzleModeCardProps {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Mixed';
  icon: React.ReactNode;
  route: string;
  disabled?: boolean;
  category?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  personalBest?: { score?: number; time?: number };
}

export const PuzzleModeCard = ({ 
  title, 
  description, 
  difficulty, 
  icon, 
  route, 
  disabled, 
  category,
  isFavorite,
  onToggleFavorite,
  personalBest
}: PuzzleModeCardProps) => {
  return (
    <div className={`group flex flex-col bg-surface rounded-2xl border border-border p-5 hover:border-textMuted/40 transition-all duration-200 hover:-translate-y-1 relative ${disabled ? 'opacity-50' : ''}`}>
      {/* Invisible overlay link to make the card clickable without nesting buttons inside an anchor tag */}
      {!disabled && (
        <Link 
          to={route} 
          className="absolute inset-0 z-0 rounded-2xl" 
          aria-label={`Play ${title}`}
        />
      )}
      
      {/* Favorite Button (must have higher z-index to intercept clicks) */}
      {onToggleFavorite && !disabled && (
        <button 
          onClick={onToggleFavorite}
          className="absolute top-4 right-4 z-10 p-2 -m-2 text-textMuted hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full"
          aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
        >
          <Star className={`w-5 h-5 transition-transform ${isFavorite ? 'fill-accent text-accent' : 'hover:scale-110'}`} />
        </button>
      )}

      <div className="flex items-start gap-4 mb-3 relative z-10 pointer-events-none">
        <div className="text-primary bg-[#18202A] p-2.5 rounded-xl border border-border shrink-0">
          {icon}
        </div>
        <div className="pr-8">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-lg text-textMain group-hover:text-primary transition-colors leading-tight">{title}</h4>
          </div>
          {category && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1 block">
              {category}
            </span>
          )}
          <p className="text-sm text-textMuted line-clamp-2 mt-1 font-medium">
            {description}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-border/30 relative z-10 pointer-events-none">
        
        {/* PB Display */}
        {personalBest && (personalBest.score || personalBest.time) && (
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-textMuted uppercase tracking-wider text-[9px]">Personal Best</span>
            {personalBest.score ? (
              <span className="flex items-center gap-1 text-secondary">
                <Trophy className="w-3 h-3" /> {personalBest.score.toLocaleString()}
              </span>
            ) : personalBest.time ? (
              <span className="flex items-center gap-1 text-textMain">
                <Clock className="w-3 h-3" /> 
                {Math.floor(personalBest.time / 60).toString().padStart(2, '0')}:{(personalBest.time % 60).toString().padStart(2, '0')}
              </span>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold px-2 py-1 rounded-md bg-[#18202A] border border-border/50 ${
            difficulty === 'Easy' ? 'text-[#38A169]' :
            difficulty === 'Medium' ? 'text-[#D69E2E]' :
            (difficulty === 'Hard' || difficulty === 'Expert') ? 'text-[#E53E3E]' :
            'text-textMuted'
          }`}>
            {difficulty}
          </span>
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white transition-colors shadow-sm">
            <span className="text-xs font-bold">Play</span>
            <Play className="w-3.5 h-3.5" fill="currentColor" />
          </div>
        </div>
      </div>
    </div>
  );
};
