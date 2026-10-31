import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Trophy, Lock, Medal, Target, Flame, Crown, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { calculateProgress, type AchievementProgress, type AchievementCategory } from '../../services/achievementService';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const Achievements = () => {
  const { profile } = useAuthStore();
  const [progressData, setProgressData] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AchievementCategory | 'ALL'>('ALL');

  useEffect(() => {
    const loadAchievements = async () => {
      if (profile) {
        try {
          const data = await calculateProgress(profile.uid, profile);
          setProgressData(data);
        } catch (err) {
          console.error("Failed to load achievements", err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadAchievements();
  }, [profile]);

  const categories: { id: AchievementCategory | 'ALL', label: string, icon: any }[] = [
    { id: 'ALL', label: 'All', icon: <Trophy className="w-4 h-4" /> },
    { id: 'GAMEPLAY', label: 'Gameplay', icon: <Target className="w-4 h-4" /> },
    { id: 'STREAKS', label: 'Streaks', icon: <Flame className="w-4 h-4" /> },
    { id: 'MASTERY', label: 'Mastery', icon: <Medal className="w-4 h-4" /> },
    { id: 'PROGRESSION', label: 'Progression', icon: <Crown className="w-4 h-4" /> }
  ];

  const unlockedCount = progressData.filter(p => p.userAchievement?.unlocked).length;
  const totalCount = progressData.length;
  const totalXpEarned = progressData
    .filter(p => p.userAchievement?.unlocked)
    .reduce((acc, p) => acc + p.achievement.xpReward, 0);

  const filteredData = filter === 'ALL' 
    ? progressData 
    : progressData.filter(p => p.achievement.category === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="text-center space-y-4 pt-8">
        <div className="inline-flex items-center justify-center p-4 bg-accent/20 rounded-full mb-2">
          <Trophy className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-4xl font-bold">Achievements</h1>
        <p className="text-textMuted">Complete challenges, explore puzzles, and build your PuzzleVerse progress.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-surface/50">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-textMuted uppercase tracking-wider">Progress</p>
              <h2 className="text-3xl font-black text-textMain mt-1">
                {unlockedCount} <span className="text-xl text-textMuted">/ {totalCount}</span>
              </h2>
            </div>
            <div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center font-bold text-primary">
              {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-surface/50">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-textMuted uppercase tracking-wider">XP Earned</p>
              <h2 className="text-3xl font-black text-secondary mt-1">
                {totalXpEarned.toLocaleString()} <span className="text-xl text-textMuted">XP</span>
              </h2>
            </div>
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <Medal className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex justify-center overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex bg-background p-1 rounded-lg border border-border min-w-max">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-md text-sm font-bold transition-all ${
                filter === c.id 
                  ? 'bg-primary text-textMain shadow-md' 
                  : 'text-textMuted hover:text-textMain hover:bg-textMuted/10'
              }`}
            >
              {c.icon}
              <span className="hidden sm:inline">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Achievement List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        </div>
      ) : filteredData.length === 0 ? (
        <Card className="p-12 text-center bg-surface/50">
          <AlertCircle className="w-16 h-16 text-textMuted/50 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-textMain mb-2">No achievements found.</h3>
          <p className="text-textMuted max-w-md mx-auto mb-8">
            Check back later for new challenges!
          </p>
          <Link to="/dashboard">
            <Button variant="primary" className="font-bold uppercase tracking-wider px-8">
              Play Games
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filteredData.map(({ achievement, userAchievement, currentProgress, percentage }) => {
            const isUnlocked = userAchievement?.unlocked;
            
            return (
              <Card 
                key={achievement.id} 
                className={`overflow-hidden transition-all duration-300 ${
                  isUnlocked 
                    ? 'bg-surface border-border shadow-md hover:border-primary/50' 
                    : 'bg-background/50 border-white/5 opacity-70'
                }`}
              >
                <CardContent className="p-4 sm:p-6 flex items-start gap-4 sm:gap-6">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-inner ${
                    isUnlocked ? 'bg-primary/20 border border-primary/30' : 'bg-black/40 border border-white/5 grayscale opacity-50'
                  }`}>
                    {isUnlocked ? achievement.icon : <Lock className="w-8 h-8 text-textMuted" />}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold text-lg truncate pr-2 ${isUnlocked ? 'text-textMain' : 'text-textMuted'}`}>
                        {achievement.name}
                      </h3>
                      <div className="shrink-0 bg-secondary/10 px-2 py-0.5 rounded text-xs font-black text-secondary">
                        +{achievement.xpReward} XP
                      </div>
                    </div>
                    <p className="text-sm text-textMuted mb-4 line-clamp-2">
                      {achievement.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className={isUnlocked ? 'text-success' : 'text-textMuted'}>
                          {isUnlocked ? 'UNLOCKED' : 'IN PROGRESS'}
                        </span>
                        <span className="text-textMuted">
                          {currentProgress} / {achievement.requirementValue}
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-2 border border-white/5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${isUnlocked ? 'bg-success' : 'bg-primary'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
