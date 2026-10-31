import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Flame, Clock, Trophy, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTodayDailyPuzzle, getNextDailyPuzzleTime, getDailyCompletion } from '../../services/dailyPuzzleService';
import type { DailyCompletion } from '../../services/dailyPuzzleService';
import { useAuthStore } from '../../store/useAuthStore';

export const DailyPuzzle = () => {
  const { profile } = useAuthStore();
  
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [completionData, setCompletionData] = useState<DailyCompletion | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  
  const dailyConfig = getTodayDailyPuzzle();

  useEffect(() => {
    if (profile) {
      const dateStr = dailyConfig.id;
      getDailyCompletion(profile.uid, dateStr).then((data) => {
        setCompletionData(data);
        setIsCompleted(data !== null);
      });
    }
  }, [profile, dailyConfig.id]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const next = getNextDailyPuzzleTime();
      const diff = next.getTime() - now.getTime();
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-10 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-accent/20 rounded-full mb-2">
          <Flame className="w-12 h-12 text-accent" />
        </div>
        <h1 className="text-4xl font-bold uppercase tracking-widest text-accent">Daily Puzzle</h1>
        <p className="text-xl text-textMain">Today's Challenge</p>
      </div>

      <Card className="bg-surface border-accent/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
        <CardContent className="p-8 text-center space-y-8">
          <div className="flex items-center justify-center gap-2 text-textMuted">
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg">Time remaining: {timeLeft}</span>
          </div>

          <div className={`rounded-xl p-6 border ${isCompleted ? 'bg-success/5 border-success/30' : 'bg-black/20 border-border'}`}>
            <h3 className="text-2xl font-bold text-textMain mb-2">{dailyConfig.title}</h3>
            <p className="text-textMuted mb-6">{dailyConfig.description}</p>
            
            <div className="flex justify-center gap-6 mb-6">
              <div>
                <p className="text-xs text-textMuted uppercase">Difficulty</p>
                <p className={`text-lg font-bold ${
                  dailyConfig.difficulty === 'EASY' ? 'text-success' : 
                  dailyConfig.difficulty === 'MEDIUM' ? 'text-warning' : 
                  dailyConfig.difficulty === 'HARD' ? 'text-error' : 'text-primary'
                }`}>{dailyConfig.difficulty}</p>
              </div>
              <div>
                <p className="text-xs text-textMuted uppercase">Reward</p>
                <p className="text-lg font-bold text-success">+{dailyConfig.baseReward + dailyConfig.bonusReward} XP</p>
              </div>
            </div>
            
            {isCompleted && completionData && (
              <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-4 animate-in fade-in zoom-in">
                <div>
                  <p className="text-xs text-textMuted uppercase">Score</p>
                  <p className="text-xl font-bold text-secondary">{completionData.score}</p>
                </div>
                <div>
                  <p className="text-xs text-textMuted uppercase">Accuracy</p>
                  <p className="text-xl font-bold text-textMain">{completionData.accuracy}%</p>
                </div>
                <div>
                  <p className="text-xs text-textMuted uppercase">Time</p>
                  <p className="text-xl font-bold text-textMain">{Math.floor(completionData.timeTaken/60)}:{(completionData.timeTaken%60).toString().padStart(2, '0')}</p>
                </div>
              </div>
            )}
          </div>

          {isCompleted === null ? (
            <div className="h-14 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isCompleted ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-success/20 text-success px-6 py-3 rounded-xl font-bold border border-success/30">
                <CheckCircle2 className="w-6 h-6" /> COMPLETED TODAY
              </div>
              <div className="flex gap-4 justify-center mt-4">
                <Link to="/leaderboard" state={{ period: 'DAILY' }}>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> View Leaderboard
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost">Back to Dashboard</Button>
                </Link>
              </div>
            </div>
          ) : (
            <Link 
              to={`/game/${dailyConfig.puzzleType.toLowerCase()}`} 
              state={{ isDailyPuzzle: true, dailyPuzzleDate: dailyConfig.id, difficulty: dailyConfig.difficulty }}
              className="block"
            >
              <Button size="lg" className="w-full text-lg shadow-accent/50 hover:shadow-accent/70 bg-accent text-gray-900 hover:bg-yellow-500">START CHALLENGE</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
