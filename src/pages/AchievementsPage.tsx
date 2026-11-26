import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { DEFAULT_ACHIEVEMENTS } from '../data/puzzles';
import { Award, Zap, CheckCircle2, Gift } from 'lucide-react';
import { Achievement } from '../types';
import { toast } from '../services/toast';
import { claimAchievementRewardInFirestore } from '../services/firebase';
import { PageHeader, Card } from '../components/ui/Card';

export const AchievementsPage: React.FC = () => {
  const { user, updateProfile } = useStore();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const totalGames = user?.totalGames || 0;
  const level = user?.level || 1;
  const streak = user?.currentStreak || 1;

  const handleClaim = async (ach: Achievement) => {
    if (!user || user.achievements?.[ach.id]) return;
    setClaimingId(ach.id);
    try {
      const res = await claimAchievementRewardInFirestore(user.uid, ach.id, ach.xpReward, ach.coinsReward);
      if (res.success) {
        const updatedAchievements = { ...(user.achievements || {}), [ach.id]: true };
        await updateProfile({
          achievements: updatedAchievements,
          xp: res.newXp,
          coins: res.newCoins,
          level: res.newLevel,
        });
        toast.success(`Claimed +${ach.xpReward} XP and +${ach.coinsReward} coins for "${ach.title}".`);
      } else {
        toast.info('Achievement reward already claimed.');
      }
    } catch (err) {
      console.error('Failed to claim achievement reward:', err);
      toast.error('Failed to claim reward.');
    } finally {
      setClaimingId(null);
    }
  };

  const unlockedCount = DEFAULT_ACHIEVEMENTS.filter((ach) => {
    let prog = 0;
    if (ach.id === 'first_win') prog = Math.min(1, totalGames);
    if (ach.id === 'puzzle_novice') prog = Math.min(5, totalGames);
    if (ach.id === 'speed_demon') prog = user?.bestTime && user.bestTime <= 30 ? 1 : 0;
    if (ach.id === 'math_genius') prog = Math.min(5, user?.totalWins || 0);
    if (ach.id === 'word_smith') prog = Math.min(5, user?.totalWins || 0);
    if (ach.id === 'laser_wizard') prog = Math.min(3, user?.totalWins || 0);
    if (ach.id === 'streak_3') prog = Math.min(3, streak);
    if (ach.id === 'level_5') prog = Math.min(5, level);
    return prog >= ach.maxProgress;
  }).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Achievements"
        description="Complete gameplay milestones to unlock badges, titles, and bonus coin rewards."
        action={
          <div className="bg-pv-surface-primary border border-pv-border px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono shrink-0">
            <span className="text-pv-text-muted uppercase font-medium">Unlocked:</span>
            <span className="text-pv-dragon-fruit font-semibold text-sm font-tabular">
              {unlockedCount} / {DEFAULT_ACHIEVEMENTS.length}
            </span>
          </div>
        }
      />

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEFAULT_ACHIEVEMENTS.map((ach) => {
          let currentProgress = 0;
          if (ach.id === 'first_win') currentProgress = Math.min(1, totalGames);
          if (ach.id === 'puzzle_novice') currentProgress = Math.min(5, totalGames);
          if (ach.id === 'speed_demon') currentProgress = user?.bestTime && user.bestTime <= 30 ? 1 : 0;
          if (ach.id === 'math_genius') currentProgress = Math.min(5, user?.totalWins || 0);
          if (ach.id === 'word_smith') currentProgress = Math.min(5, user?.totalWins || 0);
          if (ach.id === 'laser_wizard') currentProgress = Math.min(3, user?.totalWins || 0);
          if (ach.id === 'streak_3') currentProgress = Math.min(3, streak);
          if (ach.id === 'level_5') currentProgress = Math.min(5, level);

          const isUnlocked = currentProgress >= ach.maxProgress;
          const isClaimed = Boolean(user?.achievements?.[ach.id]);
          const progressPct = Math.min(100, Math.round((currentProgress / ach.maxProgress) * 100));

          return (
            <Card
              key={ach.id}
              className={`p-4 flex flex-col justify-between transition-colors ${
                isUnlocked && !isClaimed ? 'border-pv-dragon-fruit/40' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg border ${
                      isUnlocked
                        ? 'bg-pv-surface-soft text-pv-dragon-fruit border-pv-border-strong'
                        : 'bg-pv-surface-secondary text-pv-text-muted border-pv-border'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  {isClaimed ? (
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Claimed
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-[10px] font-medium text-pv-dragon-fruit bg-pv-surface-soft border border-pv-border-strong px-2 py-0.5 rounded flex items-center gap-1">
                      <Gift className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] text-pv-text-muted font-mono font-tabular">
                      {progressPct}%
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-pv-text-primary text-sm mb-1">{ach.title}</h3>
                <p className="text-xs text-pv-text-secondary mb-4 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-pv-text-muted">
                    <span>Progress</span>
                    <span className="font-mono text-pv-text-primary font-tabular">
                      {currentProgress} / {ach.maxProgress}
                    </span>
                  </div>
                  <div className="w-full bg-pv-surface-secondary h-1.5 rounded-full overflow-hidden border border-pv-border">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isUnlocked ? 'bg-emerald-500' : 'bg-pv-dragon-fruit'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-pv-border">
                  <div className="flex items-center gap-1 text-pv-text-secondary font-mono text-[11px]">
                    <Zap className="w-3 h-3 text-pv-dragon-fruit" />
                    <span>+{ach.xpReward} XP • +{ach.coinsReward} coins</span>
                  </div>

                  {isUnlocked && !isClaimed && (
                    <button
                      onClick={() => handleClaim(ach)}
                      disabled={claimingId === ach.id}
                      className="h-7 px-3 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold text-xs font-medium rounded-md transition-colors disabled:opacity-40"
                    >
                      {claimingId === ach.id ? 'Claiming...' : 'Claim'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
