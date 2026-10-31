import { Card, CardContent } from '../ui/Card';
import { Flame } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const StreakCard = () => {
  const { profile } = useAuthStore();
  
  const currentStreak = profile?.currentStreak || 0;
  const longestStreak = profile?.longestStreak || 0;

  return (
    <Card className="bg-gradient-to-r from-orange-500/10 via-red-500/5 to-transparent border-orange-500/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 -mr-8 -mt-8 opacity-10">
        <Flame className="w-48 h-48 text-orange-500" />
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${currentStreak > 0 ? 'bg-orange-500/20 text-orange-500' : 'bg-surface border border-white/10 text-textMuted'}`}>
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-textMain flex items-center gap-2">
                {currentStreak} Day Streak
                {currentStreak > 0 && <span className="text-sm bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded font-black">ACTIVE</span>}
              </h3>
              <p className="text-sm text-textMuted mt-0.5">
                {currentStreak > 0 
                  ? "Keep solving daily to maintain your streak!" 
                  : "Solve a puzzle today to start your streak!"}
              </p>
            </div>
          </div>
          
          <div className="bg-background/50 border border-white/5 rounded-lg px-4 py-3 shrink-0">
            <p className="text-xs text-textMuted uppercase font-bold tracking-wider mb-1">Longest Streak</p>
            <p className="text-xl font-black text-textMain">{longestStreak} <span className="text-sm font-normal text-textMuted">days</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
