import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Gift, Flame, CheckCircle, X } from 'lucide-react';
import { sound } from '../services/sound';
import { DAILY_REWARD_TIERS, fetchDailyRewardStatus, claimDailyRewardInFirestore } from '../services/firebase';
import { formatCount } from '../utils/format';

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
        setTimeout(() => onClose(), 1200);
      }
    } catch (err) {
      console.error('Failed to claim daily reward:', err);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-reward-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
    >
      <div className="bg-pv-surface-primary border border-pv-border rounded-xl p-6 max-w-md w-full shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-pv-text-muted hover:text-pv-text-primary hover:bg-pv-surface-secondary transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 mb-1 text-pv-dragon-fruit text-xs font-medium">
          <Flame className="w-3.5 h-3.5" />
          <span>Daily streak: {formatCount(streak, 'day')}</span>
        </div>
        <h2 id="daily-reward-title" className="text-xl font-semibold text-pv-text-primary mb-1">Daily login rewards</h2>
        <p className="text-xs text-pv-text-secondary mb-5">
          Return daily to claim your streak rewards and progress multipliers.
        </p>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {DAILY_REWARD_TIERS.map((r, idx) => {
            const isToday = idx === currentDayIndex;
            const isPast = idx < currentDayIndex;

            let cardStyle = 'bg-pv-surface-secondary border-pv-border text-pv-text-secondary';
            if (isToday) {
              cardStyle = 'bg-pv-surface-soft border-pv-dragon-fruit text-pv-text-primary shadow-sm';
            } else if (isPast) {
              cardStyle = 'bg-pv-surface-primary border-pv-border text-pv-text-muted opacity-50';
            }

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border flex flex-col items-center justify-center transition-colors ${cardStyle}`}
              >
                <p className="text-[10px] font-semibold text-pv-text-muted uppercase tracking-wider mb-1">
                  Day {r.day}
                </p>
                <Gift
                  className={`w-4 h-4 mb-1.5 ${
                    isToday ? 'text-pv-dragon-fruit' : 'text-pv-text-muted'
                  }`}
                />
                <p className="text-xs font-semibold text-pv-text-primary font-tabular">+{formatCount(r.coins, 'coin')}</p>
                <p className="text-[10px] text-emerald-400 font-medium font-tabular">+{r.xp} XP</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleClaim}
          disabled={claimed || claiming || checking}
          className="w-full h-10 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {checking
            ? 'Checking status...'
            : claiming
            ? 'Claiming reward...'
            : claimed
            ? 'Claimed for today'
            : 'Claim today\'s reward'}
        </button>
      </div>
    </div>
  );
};
