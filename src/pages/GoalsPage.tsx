import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchUserGoals, claimGoalReward } from '../services/firebase';
import { PlayerGoalItem, GoalCategory } from '../types';
import { Target, CheckCircle2, Zap, Coins, Flame, Trophy, Compass, Sparkles } from 'lucide-react';
import { toast } from '../services/toast';
import { PageHeader, Card } from '../components/ui/Card';

export const GoalsPage: React.FC = () => {
  const { user, addXPAndCoins } = useStore();
  const [goals, setGoals] = useState<PlayerGoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'daily' | 'weekly' | 'personal' | 'CLAIMABLE'>('ALL');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchUserGoals(user.uid);
      setGoals(data);
    } catch (err) {
      console.error('Failed to load player goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (goal: PlayerGoalItem) => {
    if (!user || goal.claimed || goal.status !== 'COMPLETED') return;
    setClaimingId(goal.id);
    try {
      const { xpAwarded, coinsAwarded } = await claimGoalReward(
        user.uid,
        goal.id,
        goal.rewardXP,
        goal.rewardCoins
      );
      await addXPAndCoins(xpAwarded, coinsAwarded, 0, true);
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, claimed: true } : g))
      );
      toast.success(`Claimed +${xpAwarded} XP and +${coinsAwarded} coins.`);
    } catch (err) {
      console.error('Claim reward error:', err);
      toast.error('Failed to claim goal reward.');
    } finally {
      setClaimingId(null);
    }
  };

  const completedCount = goals.filter((g) => g.status === 'COMPLETED').length;
  const claimableCount = goals.filter((g) => g.status === 'COMPLETED' && !g.claimed).length;

  const filteredGoals = goals.filter((g) => {
    if (activeTab === 'CLAIMABLE') return g.status === 'COMPLETED' && !g.claimed;
    if (activeTab === 'daily') return g.type === 'daily';
    if (activeTab === 'weekly') return g.type === 'weekly';
    if (activeTab === 'personal') return g.type === 'personal';
    return true;
  });

  const getCategoryIcon = (category: GoalCategory) => {
    switch (category) {
      case 'games':
        return <Flame className="w-3.5 h-3.5 text-pv-dragon-fruit" />;
      case 'score':
        return <Trophy className="w-3.5 h-3.5 text-pv-dragon-fruit" />;
      case 'speed':
        return <Zap className="w-3.5 h-3.5 text-pv-dragon-fruit" />;
      case 'challenges':
        return <Sparkles className="w-3.5 h-3.5 text-pv-dragon-fruit" />;
      case 'variety':
        return <Compass className="w-3.5 h-3.5 text-pv-dragon-fruit" />;
      default:
        return <Target className="w-3.5 h-3.5 text-pv-dragon-fruit" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Goals & Objectives"
        description="Track gameplay targets across daily, weekly, and personal milestone tracks."
        action={
          claimableCount > 0 ? (
            <span className="px-3 py-1 rounded-md bg-pv-surface-soft border border-pv-border-strong text-pv-dragon-fruit text-xs font-medium shrink-0">
              {claimableCount} reward{claimableCount > 1 ? 's' : ''} ready to claim
            </span>
          ) : undefined
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <p className="text-[11px] text-pv-text-muted font-medium uppercase tracking-wider">Total Goals</p>
          <p className="text-xl font-semibold text-pv-text-primary font-tabular mt-1">{goals.length}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] text-pv-text-muted font-medium uppercase tracking-wider">Completed</p>
          <p className="text-xl font-semibold text-emerald-400 font-tabular mt-1">{completedCount}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] text-pv-text-muted font-medium uppercase tracking-wider">Claimable</p>
          <p className="text-xl font-semibold text-pv-dragon-fruit font-tabular mt-1">{claimableCount}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] text-pv-text-muted font-medium uppercase tracking-wider">Completion</p>
          <p className="text-xl font-semibold text-pv-text-primary font-tabular mt-1">
            {goals.length > 0 ? `${Math.round((completedCount / goals.length) * 100)}%` : '0%'}
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-pv-border">
        {(['ALL', 'daily', 'weekly', 'personal', 'CLAIMABLE'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 h-8 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
                : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
            }`}
          >
            {tab === 'daily'
              ? 'Daily'
              : tab === 'weekly'
              ? 'Weekly'
              : tab === 'personal'
              ? 'Milestones'
              : tab === 'CLAIMABLE'
              ? `Claimable (${claimableCount})`
              : 'All Goals'}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {loading ? (
        <Card className="py-16 text-center">
          <div className="w-6 h-6 border-2 border-pv-dragon-fruit border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-pv-text-secondary font-medium">Loading goals...</p>
        </Card>
      ) : filteredGoals.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-pv-surface-secondary rounded-lg flex items-center justify-center text-pv-text-muted mx-auto border border-pv-border">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-pv-text-primary">No goals in this category</h3>
          <p className="text-xs text-pv-text-secondary max-w-sm mx-auto">
            {activeTab === 'CLAIMABLE'
              ? 'All completed rewards have been claimed. Continue playing to complete more goals.'
              : 'No active goals matching this filter.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((g) => {
            const percent = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
            const isDone = g.status === 'COMPLETED';

            return (
              <Card
                key={g.id}
                className={`p-4 space-y-3 transition-colors ${
                  g.claimed ? 'opacity-60' : isDone ? 'border-pv-dragon-fruit/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-pv-surface-secondary border border-pv-border shrink-0 mt-0.5">
                      {getCategoryIcon(g.category)}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-pv-text-primary">{g.title}</h4>
                      <p className="text-[11px] text-pv-text-secondary mt-0.5">{g.description}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-pv-surface-secondary border border-pv-border text-pv-text-muted shrink-0">
                    {g.type}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-pv-text-muted">Progress</span>
                    <span className="text-pv-text-primary font-tabular">
                      {g.currentValue} / {g.targetValue} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-pv-surface-secondary h-1.5 rounded-full overflow-hidden border border-pv-border">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isDone ? 'bg-emerald-500' : 'bg-pv-dragon-fruit'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-pv-border pt-3 text-xs">
                  <div className="flex items-center gap-3 text-pv-text-secondary font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-pv-dragon-fruit" /> +{g.rewardXP} XP
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-pv-dragon-fruit" /> +{g.rewardCoins} coins
                    </span>
                  </div>

                  {g.claimed ? (
                    <span className="text-[11px] font-medium text-pv-text-muted flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Claimed
                    </span>
                  ) : isDone ? (
                    <button
                      onClick={() => handleClaim(g)}
                      disabled={claimingId === g.id}
                      className="h-8 px-3.5 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                    >
                      {claimingId === g.id ? 'Claiming...' : 'Claim Reward'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-pv-text-muted">In Progress</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
