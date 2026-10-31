import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Award, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { calculateProgress, type AchievementProgress } from '../../services/achievementService';

export const AchievementPreview = () => {
  const { profile } = useAuthStore();
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (profile) {
        try {
          const data = await calculateProgress(profile.uid, profile);
          
          // Sort by unlocked first, then by highest percentage
          const sorted = data.sort((a, b) => {
            if (a.userAchievement?.unlocked && !b.userAchievement?.unlocked) return -1;
            if (!a.userAchievement?.unlocked && b.userAchievement?.unlocked) return 1;
            return b.percentage - a.percentage;
          });
          
          setAchievements(sorted.slice(0, 3));
        } catch (err) {
          console.error('Failed to load achievements preview', err);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchAchievements();
  }, [profile]);

  return (
    <Card className="h-full flex flex-col bg-surface/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="w-5 h-5 text-secondary" /> 
          Achievements
        </CardTitle>
        <Link to="/achievements" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 group">
          View All <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardHeader>
      <CardContent className="pt-4 flex-1">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : achievements.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-textMuted text-sm text-center py-8">
            Complete puzzles to unlock achievements!
          </div>
        ) : (
          <div className="space-y-3">
            {achievements.map(({ achievement, userAchievement, percentage }) => {
              const isUnlocked = userAchievement?.unlocked;
              
              return (
                <div key={achievement.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${isUnlocked ? 'bg-background border-border hover:border-primary/30' : 'bg-surface/50 border-border/50 opacity-70'}`}>
                  <div className={`text-2xl mt-0.5 ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                    {isUnlocked ? achievement.icon : <Lock className="w-5 h-5 text-textMuted mt-1"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`font-bold text-sm truncate ${isUnlocked ? 'text-textMain' : 'text-textMuted'}`}>{achievement.name}</p>
                      {isUnlocked && <span className="text-[10px] uppercase font-bold text-success bg-success/10 px-1.5 py-0.5 rounded ml-2 shrink-0">Unlocked</span>}
                    </div>
                    <p className="text-xs text-textMuted mt-1 leading-relaxed line-clamp-1">{achievement.description}</p>
                    {!isUnlocked && (
                      <div className="w-full bg-black/40 rounded-full h-1 mt-2 overflow-hidden border border-white/5">
                        <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
