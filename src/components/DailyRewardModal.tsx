import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Gift, Flame, CheckCircle, Sparkles, X } from 'lucide-react';
import { sound } from '../services/sound';
import { DAILY_REWARD_TIERS, fetchDailyRewardStatus, claimDailyRewardInFirestore } from '../services/firebase';

interface Props {
  onClose: () => void;
}

export const DailyRewardModal: React.FC<Props> = ({ onClose }) => {
  const { user, setUser, isGuest } = useStore();
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [checking, setChecking] = useState(true);

  const streak = user?.currentStreak || 1;
  const currentDayIndex = ((streak - 1) % 7);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    fetchDailyRewardStatus(user.uid)
      .then((status) => {
        if (status.hasClaimedToday) {
          setClaimed(true);
        }
      })
      .catch((err) => {
        console.warn('Daily reward status check:', err);
      })
      .finally(() => {
        setChecking(false);
      });
  }, [user]);

  const handleClaim = async () => {
    if (!user || claimed || claiming) return;
    setClaiming(true);

    try {
      const res = await claimDailyRewardInFirestore(user.uid, user);
      if (res.success) {
        sound.playSuccess();
        setClaimed(true);
        const updatedUser = {
          ...user,
          coins: (user.coins || 0) + res.coins,
          xp: res.newXp,
          level: res.newLevel,
          currentStreak: res.streak
        };
        setUser(updatedUser, isGuest);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      console.error('Failed to claim daily reward:', err);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pv-surface-primary/90 animate-fade-in">
      <div className="bg-pv-bg-secondary border-2 border-pv-border-strong rounded-3xl p-6 max-w-md w-full text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-pv-text-secondary hover:text-white hover:bg-pv-surface-primary/80 transition-all duration-200"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 mb-2 text-pv-dragon-fruit-light font-extrabold uppercase text-xs tracking-widest">
          <Flame className="w-4 h-4 fill-pv-dragon-fruit" />
          <span>Daily Login Streak: {streak} Days</span>
        </div>
        <h2 className="text-2xl font-black text-white mb-6">Daily Bonus Rewards</h2>

        {/* 7 Day Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {DAILY_REWARD_TIERS.map((r, idx) => {
            const isToday = idx === currentDayIndex;
            const isPast = idx < currentDayIndex;
            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                  isToday
                    ? 'bg-pv-dragon-fruit/20 border-pv-dragon-fruit text-pv-dragon-fruit-light scale-105 shadow-md shadow-pv-dragon-fruit/20'
                    : isPast
                    ? 'bg-pv-surface-primary/40 border-pv-border-violet text-pv-text-muted'
                    : 'bg-pv-surface-primary border-pv-border-strong text-pv-text-secondary'
                }`}
              >
                <p className="text-[10px] font-bold text-pv-text-secondary mb-1">DAY {r.day}</p>
                <Gift
                  className={`w-5 h-5 mb-1 ${
                    isToday ? 'text-pv-dragon-fruit animate-bounce' : 'text-pv-text-secondary'
                  }`}
                />
                <p className="text-xs font-black">+{r.coins} C</p>
                <p className="text-[9px] text-emerald-400 font-bold">+{r.xp} XP</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleClaim}
          disabled={claimed || claiming || checking}
          className="w-full bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-white font-black py-3.5 rounded-xl shadow-lg shadow-pv-dragon-fruit/25 uppercase tracking-widest text-sm transition active:scale-95 disabled:opacity-50"
        >
          {checking
            ? 'Checking...'
            : claiming
            ? 'Claiming...'
            : claimed
            ? 'Claimed for Today'
            : "Claim Today's Reward"}
        </button>
      </div>
    </div>
  );
};
