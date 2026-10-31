import { useState, useEffect } from 'react';
import { Lock, CheckCircle, Flame, Gift, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getDailyRewardState, claimDailyReward, getRewardAmountForStreak } from '../../services/dailyRewardService';

const ChestSVG = ({ className = "w-16 h-16", opened = false }: { className?: string, opened?: boolean }) => (
  <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="chestBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8B5A2B" />
        <stop offset="100%" stopColor="#5C3A21" />
      </linearGradient>
      <linearGradient id="chestMetal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E5E7EB" />
        <stop offset="100%" stopColor="#9CA3AF" />
      </linearGradient>
      <linearGradient id="chestGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    
    {/* Body */}
    <path d="M20 60 L100 60 L90 100 L30 100 Z" fill="url(#chestBody)" stroke="#3E2723" strokeWidth="4" strokeLinejoin="round" />
    
    {/* Lid */}
    <path d={opened ? "M15 55 C 15 20, 105 20, 105 55 Z" : "M15 60 C 15 25, 105 25, 105 60 Z"} fill="url(#chestBody)" stroke="#3E2723" strokeWidth="4" strokeLinejoin="round" style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
    
    {/* Metal Bands */}
    <path d="M40 40 L40 100 M80 40 L80 100" stroke="url(#chestMetal)" strokeWidth="6" strokeLinecap="round" />
    
    {/* Lock */}
    <circle cx="60" cy={opened ? 55 : 60} r="12" fill="url(#chestGold)" stroke="#3E2723" strokeWidth="3" style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
    <rect x="57" y={opened ? 55 : 60} width="6" height="8" fill="#3E2723" rx="2" style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
  </svg>
);

const XPCoinSVG = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#coinGrad)" stroke="#78350F" strokeWidth="4" />
    <circle cx="50" cy="50" r="35" fill="none" stroke="#FEF3C7" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
    <text x="50" y="65" fontFamily="system-ui, -apple-system, sans-serif" fontSize="38" fontWeight="900" fill="#78350F" textAnchor="middle">XP</text>
  </svg>
);

export const DailyRewardCard = () => {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [canClaim, setCanClaim] = useState(false);
  const [streak, setStreak] = useState(0);
  const [amount, setAmount] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      if (profile) {
        try {
          const state = await getDailyRewardState(profile.uid);
          const d = new Date();
          const today = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          
          if (state.lastClaimDate !== today) {
            setCanClaim(true);
            const lastDate = state.lastClaimDate ? new Date(state.lastClaimDate) : null;
            const currentDate = new Date(today);
            let diffDays = 2;
            if (lastDate) {
              lastDate.setHours(0, 0, 0, 0);
              currentDate.setHours(0, 0, 0, 0);
              const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
              diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            const nextStreak = diffDays === 1 ? state.streak + 1 : 1;
            setStreak(nextStreak);
            setAmount(getRewardAmountForStreak(nextStreak));
          } else {
            setCanClaim(false);
            setStreak(state.streak);
            setAmount(getRewardAmountForStreak(state.streak));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchState();
  }, [profile]);

  const handleClaim = async () => {
    if (!profile || !canClaim || claiming) return;
    setClaiming(true);
    setErrorMsg(null);
    try {
      const result = await claimDailyReward(profile) as any;
      if (result.success) {
        setCanClaim(false);
        setStreak(result.streak);
      } else {
        if (result.error === 'Already claimed today.') {
          setCanClaim(false);
        } else {
          setErrorMsg(result.error || "Unable to claim your reward right now. Please try again.");
        }
      }
    } catch (err: any) {
      setErrorMsg("Unable to claim your reward right now. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !profile) return null;

  const longestStreak = profile.longestStreak || 0;

  return (
    <div className="bg-[#151B23] rounded-2xl border border-border p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-surface border border-border rounded-xl flex-shrink-0">
          <Gift className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-textMain tracking-tight">Daily Reward</h2>
          <p className="text-textMuted text-sm font-medium mt-1">Log in daily, claim your reward and keep your streak alive!</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-surface border border-border rounded-xl p-3 flex flex-col items-center">
          <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-1">Current Streak</span>
          <div className="flex items-center gap-1.5 text-orange-400 font-black text-lg">
            <Flame className="w-4 h-4" fill="currentColor" />
            {streak} <span className="text-xs">Days</span>
          </div>
        </div>
        <div className="flex-1 bg-surface border border-border rounded-xl p-3 flex flex-col items-center">
          <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-1">Longest Streak</span>
          <div className="flex items-center gap-1.5 text-textMain font-bold text-lg">
            <Flame className="w-4 h-4 text-textMuted" />
            {longestStreak} <span className="text-xs">Days</span>
          </div>
        </div>
      </div>

      {/* Hero Area */}
      <div className="bg-[#18202A] rounded-xl border border-border p-6 flex flex-col items-center text-center mb-6">
        <div className="mb-4">
          <ChestSVG className="w-24 h-24" opened={!canClaim} />
        </div>
        
        {canClaim ? (
          <>
            <h3 className="text-lg font-bold text-textMain mb-2">Today's Reward</h3>
            <div className="flex items-center justify-center gap-2 mb-6 bg-surface px-4 py-1.5 rounded-full border border-border">
              <XPCoinSVG className="w-5 h-5" />
              <span className="text-xl font-bold text-accent">+{amount} XP</span>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-success mb-2">Daily Reward Claimed!</h3>
            <p className="text-sm font-medium text-textMuted mb-6">Day {streak} Reward Streak</p>
          </>
        )}
        
        {errorMsg && (
          <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-lg flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {canClaim ? (
          <button 
            onClick={handleClaim}
            disabled={claiming}
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {claiming ? 'Claiming...' : 'Claim Reward'}
          </button>
        ) : (
          <div className="w-full bg-surface border border-border text-success font-medium py-2.5 rounded-lg flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Claimed Today</span>
          </div>
        )}
      </div>

      {/* 7-Day Track */}
      <div className="mt-auto">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-textMain">7 Day Streak</h3>
        </div>
        
        <div className="w-full overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 min-w-max pr-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const dayReward = getRewardAmountForStreak(day);
              
              let state: 'CLAIMED' | 'CURRENT' | 'LOCKED' = 'LOCKED';
              if (canClaim) {
                if (day < streak) state = 'CLAIMED';
                else if (day === streak) state = 'CURRENT';
              } else {
                if (day <= streak) state = 'CLAIMED';
                else if (day > streak) state = 'LOCKED';
              }

              return (
                <div key={day} className={`flex flex-col items-center justify-center p-2 rounded-lg border w-16 h-20 transition-colors ${
                  state === 'CURRENT' ? 'bg-surface border-primary' : state === 'CLAIMED' ? 'bg-surface border-success opacity-80' : 'bg-surface border-border opacity-50'
                }`}>
                  <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${state === 'CURRENT' ? 'text-primary' : 'text-textMuted'}`}>
                    Day {day}
                  </span>
                  
                  <div className="mb-1">
                    {state === 'CLAIMED' ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : state === 'LOCKED' ? (
                      <Lock className="w-4 h-4 text-textMuted" />
                    ) : (
                      <XPCoinSVG className="w-5 h-5" />
                    )}
                  </div>
                  
                  <span className={`font-bold text-[10px] ${state === 'CURRENT' ? 'text-accent' : state === 'CLAIMED' ? 'text-success' : 'text-textMuted'}`}>
                    +{dayReward}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
    </div>
  );
};
