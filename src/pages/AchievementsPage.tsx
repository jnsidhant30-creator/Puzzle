import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { DEFAULT_ACHIEVEMENTS } from '../data/puzzles';
import { Award, Zap, CheckCircle2, Gift } from 'lucide-react';
import { Achievement } from '../types';
import { toast } from '../services/toast';
import { claimAchievementRewardInFirestore } from '../services/firebase';

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
          level: res.newLevel
        });
        toast.success(`Unlocked "${ach.title}"! Claimed +${ach.xpReward} XP & +${ach.coinsReward} Coins!`);
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-pv-surface-primary p-6 rounded-3xl border border-pv-border-violet flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-wide flex items-center gap-2">
            <Award className="w-8 h-8 text-pv-dragon-fruit-light" />
            Trophies & Badges
          </h1>
          <p className="text-xs text-pv-text-secondary mt-1">
            Complete gameplay feats and unlock achievements to earn bonus XP and coins
          </p>
        </div>
        <div className="bg-pv-surface-secondary border border-pv-border-strong px-4 py-2 rounded-2xl flex items-center gap-2 font-mono text-xs">
          <span className="text-pv-text-secondary uppercase font-bold">Unlocked:</span>
          <span className="text-pv-dragon-fruit-light font-black text-sm">
            {unlockedCount} / {DEFAULT_ACHIEVEMENTS.length}
          </span>
        </div>
      </div>

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
            <div
              key={ach.id}
              className={`bg-pv-surface-primary border p-5 rounded-2xl flex flex-col justify-between transition ${
                isUnlocked
                  ? 'border-pv-dragon-fruit/40 shadow-sm shadow-pv-dragon-fruit/10'
                  : 'border-pv-border-violet opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isUnlocked
                        ? 'bg-gradient-primary-btn/20 text-pv-dragon-fruit-light border border-pv-border-strong'
                        : 'bg-pv-surface-primary text-pv-text-muted border border-pv-border-violet'
                    }`}
                  >
                    <Award className="w-6 h-6" />
                  </div>
                  {isClaimed ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Claimed
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-[10px] font-bold text-pv-dragon-fruit-light bg-pv-dragon-fruit/20 border border-pv-dragon-fruit/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <Gift className="w-3 h-3" /> Unlocked!
                    </span>
                  ) : (
                    <span className="text-[10px] text-pv-text-muted font-mono">
                      {progressPct}%
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white text-base mb-1">{ach.title}</h3>
                <p className="text-xs text-pv-text-secondary mb-4 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-pv-text-secondary">
                    <span>Progress</span>
                    <span className="font-mono text-white">
                      {currentProgress} / {ach.maxProgress}
                    </span>
                  </div>
                  <div className="w-full bg-pv-bg-primary h-2 rounded-full overflow-hidden border border-pv-border-violet">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isUnlocked ? 'bg-gradient-primary-btn' : 'bg-pv-surface-secondary'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-pv-border-violet/60">
                  <div className="flex items-center gap-1 text-pv-dragon-fruit-light font-mono text-[11px]">
                    <Zap className="w-3.5 h-3.5" />
                    <span>+{ach.xpReward} XP / +{ach.coinsReward} Coins</span>
                  </div>

                  {isUnlocked && !isClaimed && (
                    <button
                      onClick={() => handleClaim(ach)}
                      disabled={claimingId === ach.id}
                      className="bg-gradient-primary-btn hover:bg-pv-dragon-fruit-light text-pv-bg-primary font-black px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-wider transition shadow-sm"
                    >
                      {claimingId === ach.id ? 'Claiming...' : 'Claim'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
