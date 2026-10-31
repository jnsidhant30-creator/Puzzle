import { Clock, Trophy, Target } from 'lucide-react';

interface GameStatsProps {
  timeRemaining: number;
  score: number;
  currentQuestion: number;
  totalQuestions: number;
}

export const GameStats = ({ timeRemaining, score, currentQuestion, totalQuestions }: GameStatsProps) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarningTime = timeRemaining <= 30 && timeRemaining > 10;
  const isCriticalTime = timeRemaining <= 10;
  
  let timerClasses = 'bg-surface border-border';
  let iconColor = 'text-primary';
  let textColor = 'text-textMain';

  if (isCriticalTime) {
    timerClasses = 'bg-error/10 border-error/30 shadow-error/10 animate-pulse';
    iconColor = 'text-error';
    textColor = 'text-error';
  } else if (isWarningTime) {
    timerClasses = 'bg-warning/10 border-warning/30 shadow-warning/10';
    iconColor = 'text-warning';
    textColor = 'text-warning';
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8">
      <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border shadow-sm transition-all duration-300 ${timerClasses}`}>
        <Clock className={`w-5 h-5 ${iconColor}`} />
        <div>
          <p className="text-[10px] uppercase font-bold text-textMuted tracking-wider leading-none mb-1">Timer</p>
          <p className={`text-xl font-bold font-mono leading-none tracking-tight ${textColor}`}>
            {formatTime(timeRemaining)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 bg-surface border border-border px-5 py-2.5 rounded-2xl shadow-sm">
        <Trophy className="w-5 h-5 text-warning" />
        <div>
          <p className="text-[10px] uppercase font-bold text-textMuted tracking-wider leading-none mb-1">Score</p>
          <p className="text-xl font-bold font-mono text-textMain leading-none tracking-tight">{score.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-surface border border-border px-5 py-2.5 rounded-2xl shadow-sm">
        <Target className="w-5 h-5 text-secondary" />
        <div>
          <p className="text-[10px] uppercase font-bold text-textMuted tracking-wider leading-none mb-1">Progress</p>
          <p className="text-xl font-bold font-mono text-textMain leading-none tracking-tight">{currentQuestion} / {totalQuestions}</p>
        </div>
      </div>
    </div>
  );
};
