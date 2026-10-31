import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Clock, Award, CheckCircle2, Calendar, Trophy, Timer } from 'lucide-react';
import { getTodayDailyPuzzle, getDailyCompletion, getNextDailyPuzzleTime, getTodayDateString, type DailyCompletion } from '../../services/dailyPuzzleService';
import { useAuthStore } from '../../store/useAuthStore';

const formatTime = (seconds?: number) => {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const DailyPuzzleCard = () => {
  const { profile } = useAuthStore();
  const [completion, setCompletion] = useState<DailyCompletion | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  
  const dailyConfig = getTodayDailyPuzzle();

  useEffect(() => {
    if (profile) {
      getDailyCompletion(profile.uid, getTodayDateString()).then((comp) => {
        setCompletion(comp);
        
        // Notify once per day if not completed
        if (!comp) {
          const todayStr = getTodayDateString();
          const lastNotified = localStorage.getItem(`daily_notified_${profile.uid}`);
          if (lastNotified !== todayStr) {
            window.dispatchEvent(new CustomEvent('dailyPuzzleReady'));
            localStorage.setItem(`daily_notified_${profile.uid}`, todayStr);
          }
        }
      });
    }
  }, [profile]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const next = getNextDailyPuzzleTime();
      const diff = next.getTime() - now.getTime();
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${h}h ${m}m left`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#151B23] rounded-2xl border border-border p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-surface border border-border rounded-xl flex-shrink-0">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-textMain tracking-tight">Daily Challenge</h2>
          <p className="text-textMuted text-sm font-medium mt-1">
            Complete the curated puzzle to earn bonus XP.
          </p>
        </div>
      </div>

      {/* Details Box */}
      <div className="bg-[#18202A] rounded-xl border border-border p-6 flex flex-col items-center text-center mb-6 flex-1 justify-center">
        <h3 className="text-2xl font-bold text-textMain mb-2">{dailyConfig.title}</h3>
        <p className="text-textMuted text-sm mb-6 max-w-[240px]">
          {dailyConfig.puzzleType.charAt(0) + dailyConfig.puzzleType.slice(1).toLowerCase()} Puzzle
        </p>

        <div className="flex flex-wrap justify-center gap-3 text-sm font-medium w-full">
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg border border-border">
            <span className={`w-2 h-2 rounded-full ${
              dailyConfig.difficulty === 'EASY' ? 'bg-success' : 
              dailyConfig.difficulty === 'MEDIUM' ? 'bg-warning' : 
              dailyConfig.difficulty === 'HARD' ? 'bg-error' : 'bg-primary'
            }`}></span>
            <span className="text-textMain">{dailyConfig.difficulty}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg border border-border">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-accent">+{dailyConfig.baseReward + dailyConfig.bonusReward} XP</span>
          </div>
        </div>
      </div>

      {/* Footer / Action */}
      <div className="mt-auto">
        {completion ? (
          <div className="w-full bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 text-success font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" /> DAILY CHALLENGE ✓
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-textMuted">
                <Trophy className="w-4 h-4" /> {completion.score.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-textMuted">
                <Timer className="w-4 h-4" /> {formatTime(completion.timeTaken)}
              </div>
            </div>
            <div className="text-center text-xs text-textMuted mt-1">
              Come back in {timeLeft} for a new challenge.
            </div>
          </div>
        ) : (
          <Link to="/daily-puzzle">
            <Button className="w-full shadow-sm">
              Play Daily Puzzle
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
