import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Gift, Flame, X } from 'lucide-react';
import { sound } from '../services/sound';
import { DAILY_REWARD_TIERS, fetchDailyRewardStatus, claimDailyRewardInFirestore } from '../services/firebase';
import { formatCount } from '../utils/format';
import { Button } from './ui/Button';

interface Props {
  onClose: () => void;
}

export const DailyRewardModal: React.FC<Props> = ({ onClose }) => {
  const { user, setUser, isGuest } = useStore();
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [checking, setChecking] = useState(true);

  const streak = user?.currentStreak || 1;
  const currentDayIndex = (streak - 1) % 7;

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
          currentStreak: res.streak,
        };
        setUser(updatedUser, isGuest);
        setTimeout(() => onClose(), 1000);
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
      <div className="bg-[#233D4A] border border-[#36515F] rounded-xl p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-[#B4C3CE] hover:text-[#F5F7F8] hover:bg-[#2C4654] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 mb-1 text-[#A8E5D5] text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 text-[#38C6BA]" />
          <span>Daily streak: {formatCount(streak, 'day')}</span>
        </div>
        <h2 id="daily-reward-title" className="text-xl font-bold text-[#F5F7F8] mb-1">
          Daily Rewards
        </h2>
        <p className="text-xs text-[#B4C3CE] mb-5">
          Check in each day to collect bonus coins and XP.
        </p>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {DAILY_REWARD_TIERS.map((r, idx) => {
            const isToday = idx === currentDayIndex;
            const isPast = idx < currentDayIndex;

            let cardStyle = 'bg-[#1C2D3B] border-[#36515F] text-[#B4C3CE]';
            if (isToday) {
              cardStyle = 'bg-[#2C4654] border-[#38C6BA] text-[#F5F7F8]';
            } else if (isPast) {
              cardStyle = 'bg-[#1C2D3B] border-[#36515F] text-[#98AAB8] opacity-55';
            }

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border flex flex-col items-center justify-center ${cardStyle}`}
              >
                <p className="text-[11px] font-semibold text-[#B4C3CE] mb-1">
                  Day {r.day}
                </p>
                <Gift
                  className={`w-4 h-4 mb-1.5 ${
                    isToday ? 'text-[#38C6BA]' : 'text-[#98AAB8]'
                  }`}
                />
                <p className="text-xs font-bold text-[#F5F7F8] font-tabular">+{formatCount(r.coins, 'coin')}</p>
                <p className="text-[11px] text-[#A8E5D5] font-semibold font-tabular">+{r.xp} XP</p>
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleClaim}
          disabled={claimed || claiming || checking}
          variant="primary"
          size="md"
          className="w-full"
        >
          {checking
            ? 'Checking status...'
            : claiming
            ? 'Claiming reward...'
            : claimed
            ? 'Claimed for today'
            : 'Claim Reward'}
        </Button>
      </div>
    </div>
  );
};
