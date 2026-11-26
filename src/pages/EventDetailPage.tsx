import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { PuzzleEvent, UserEventProgress, PuzzleType, LeaderboardEntry } from '../types';
import { getPuzzleEventById, fetchUserEventProgress, claimEventReward, fetchTopLeaderboard } from '../services/firebase';
import { Clock, Trophy, Award, CheckCircle, Play, ArrowLeft, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { PUZZLE_MODES } from '../data/puzzles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const EventDetailPage: React.FC = () => {
  const { selectedEventId, user, setActiveTab, playEventPuzzle } = useStore();
  const [event, setEvent] = useState<PuzzleEvent | null>(null);
  const [progress, setProgress] = useState<UserEventProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!selectedEventId) return;
      setLoading(true);
      const ev = await getPuzzleEventById(selectedEventId);
      setEvent(ev);
      if (user && ev) {
        const prog = await fetchUserEventProgress(user.uid, ev.id);
        setProgress(prog);
      }
      if (ev) {
        const lb = await fetchTopLeaderboard(`event_${ev.id}`, 10);
        setLeaderboard(lb);
      }
      setLoading(false);
    }
    loadData();
  }, [selectedEventId, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-pv-text-muted space-y-3">
        <Clock className="w-8 h-8 animate-spin text-[#38C6BA]" />
        <p className="text-sm font-medium text-pv-text-secondary">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <Card className="p-12 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-pv-text-primary">Event Not Found</h3>
        <p className="text-sm text-pv-text-muted">The requested event could not be found or has expired.</p>
        <Button onClick={() => setActiveTab('events')} variant="secondary" size="sm">
          Return to Events
        </Button>
      </Card>
    );
  }

  const getTimeRemaining = (endAt: string) => {
    const diff = new Date(endAt).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return days > 0 ? `${days}d ${remHours}h remaining` : `${hours}h remaining`;
  };

  const handleClaim = async () => {
    if (!user || !event || claiming) return;
    setClaiming(true);
    try {
      const { xpAwarded, coinsAwarded } = await claimEventReward(user.uid, event.id, event);
      setClaimMessage(`Successfully claimed +${xpAwarded} XP and +${coinsAwarded} Coins.`);
      const updatedProg = await fetchUserEventProgress(user.uid, event.id);
      setProgress(updatedProg);
    } catch (err: any) {
      setClaimMessage(err.message || 'Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  const targetAttempts = event.participationLimit || 3;
  const attempts = progress?.attemptsCount || 0;
  const isCompleted = progress?.isCompleted || false;
  const claimed = progress?.claimedReward || false;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <button
        onClick={() => setActiveTab('events')}
        className="flex items-center gap-2 text-xs font-semibold text-pv-text-muted hover:text-pv-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events Hub</span>
      </button>

      {/* Main Banner Header */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#38C6BA]/10 text-[#38C6BA] border border-[#38C6BA]/20">
                {event.type.replace('_', ' ')}
              </span>
              <span className="text-xs text-pv-text-muted flex items-center gap-1 font-tabular">
                <Clock className="w-3.5 h-3.5" />
                {getTimeRemaining(event.endAt)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-pv-text-primary tracking-tight">{event.name}</h1>
            <p className="text-sm text-pv-text-secondary max-w-xl">{event.description}</p>
          </div>

          {/* Progress Card Widget */}
          <div className="bg-pv-surface-soft border border-pv-border rounded-lg p-5 min-w-[220px] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-pv-text-muted">Your Completion</p>
            <div className="text-3xl font-bold text-[#38C6BA] font-tabular my-1">
              {attempts} / {targetAttempts}
            </div>
            <p className="text-xs text-pv-text-secondary font-medium">
              {isCompleted ? 'Event completed' : 'Puzzles solved'}
            </p>
            {isCompleted && !claimed && (
              <Button
                onClick={handleClaim}
                disabled={claiming}
                variant="primary"
                size="sm"
                className="mt-3 w-full"
              >
                {claiming ? 'Claiming...' : 'Claim Reward'}
              </Button>
            )}
            {claimed && (
              <div className="mt-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-1.5 rounded text-xs font-medium">
                Reward Claimed
              </div>
            )}
          </div>
        </div>
      </Card>

      {claimMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg text-emerald-300 text-sm font-medium text-center">
          {claimMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Eligible Games & Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rules Card */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-[#38C6BA]" />
              <span>Event Rules & Guidelines</span>
            </h3>
            <ul className="space-y-2.5">
              {event.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-pv-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38C6BA] mt-1.5 shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Eligible Puzzles Launcher */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#38C6BA]" />
              <span>Participating Puzzles ({event.eligibleGames.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.eligibleGames.map((puzzleType) => {
                const info = PUZZLE_MODES.find((p) => p.id === puzzleType) || {
                  id: puzzleType,
                  name: puzzleType.replace('_', ' ').toUpperCase(),
                  category: 'Event',
                  description: 'Special event challenge puzzle.',
                };
                const playedThisType = progress?.completedGames.includes(puzzleType as PuzzleType);
                return (
                  <div
                    key={puzzleType}
                    className="bg-pv-surface-soft border border-pv-border hover:border-pv-border-hover p-4 rounded-lg flex flex-col justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#38C6BA] bg-pv-surface-elevated px-2 py-0.5 rounded border border-pv-border">
                          {info.category}
                        </span>
                        {playedThisType && (
                          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Solved
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-pv-text-primary text-sm">{info.name}</h4>
                      <p className="text-xs text-pv-text-muted mt-1 line-clamp-2">{info.description}</p>
                    </div>
                    <Button
                      onClick={() => playEventPuzzle(event.id, puzzleType as PuzzleType)}
                      disabled={event.status !== 'active'}
                      variant="primary"
                      size="sm"
                      className="mt-4 w-full flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Event Attempt</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Rewards & Leaderboard */}
        <div className="space-y-6">
          {/* Reward Summary */}
          <Card className="p-6 text-center space-y-4">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-[#38C6BA]" />
              <span>Event Rewards</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-pv-surface-soft p-3 rounded-lg border border-pv-border">
                <p className="text-[10px] font-semibold text-pv-text-muted uppercase tracking-wider">XP Reward</p>
                <p className="text-lg font-bold text-pv-text-primary font-tabular my-0.5">+{event.rewardConfig.xp}</p>
                <p className="text-[10px] text-pv-text-muted">Progression XP</p>
              </div>
              <div className="bg-pv-surface-soft p-3 rounded-lg border border-pv-border">
                <p className="text-[10px] font-semibold text-pv-text-muted uppercase tracking-wider">Coins</p>
                <p className="text-lg font-bold text-[#38C6BA] font-tabular my-0.5">+{event.rewardConfig.coins}</p>
                <p className="text-[10px] text-pv-text-muted">Shop currency</p>
              </div>
            </div>
            {event.rewardConfig.badgeTitle && (
              <div className="bg-pv-surface-soft border border-pv-border p-3 rounded-lg flex items-center gap-3">
                <Award className="w-6 h-6 text-[#38C6BA] shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#38C6BA]">Exclusive Title</p>
                  <p className="text-xs font-semibold text-pv-text-primary">{event.rewardConfig.badgeTitle}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Event Leaderboard */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-[#38C6BA]" />
              <span>Event Leaderboard</span>
            </h3>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-pv-text-muted text-center py-6">
                Be the first player to submit a validated score for this event.
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded bg-pv-surface-soft border border-pv-border text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 font-bold font-tabular text-center ${
                          idx === 0
                            ? 'text-amber-400'
                            : idx === 1
                            ? 'text-slate-300'
                            : idx === 2
                            ? 'text-amber-600'
                            : 'text-pv-text-muted'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-pv-text-primary">{entry.displayName || entry.username}</span>
                    </div>
                    <span className="font-semibold text-pv-text-primary font-tabular">{entry.score} pts</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
