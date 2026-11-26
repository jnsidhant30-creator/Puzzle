import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PUZZLE_MODES } from '../data/puzzles';
import { calculateUserMasteryProfile, generatePracticeChallengesForUser } from '../data/masteryData';
import { PuzzleType, PuzzleMasteryRecord, UserPracticeProgress } from '../types';
import { fetchUserPracticeProgress } from '../services/firebase';
import { Award, Zap, Target, Trophy, Sparkles, BookOpen, Compass, Play, CheckCircle, ChevronRight, X, BarChart2 } from 'lucide-react';
import { PageHeader, Card } from '../components/ui/Card';
import { PuzzleArt } from '../components/PuzzleArt';

export const MasteryPage: React.FC = () => {
  const { user, playGame, viewPuzzleGuide, startPracticeChallenge, setActiveTab, selectedMasteryPuzzleType } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'practice'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeDetailGame, setActiveDetailGame] = useState<PuzzleType | null>(selectedMasteryPuzzleType);
  const [practiceProgress, setPracticeProgress] = useState<UserPracticeProgress>({
    userId: user?.uid || 'guest',
    completedChallengeIds: [],
    updatedAt: new Date().toISOString(),
  });
  const [challengeTypeFilter, setChallengeTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    if (selectedMasteryPuzzleType) {
      setActiveDetailGame(selectedMasteryPuzzleType);
    }
  }, [selectedMasteryPuzzleType]);

  useEffect(() => {
    if (user?.uid) {
      fetchUserPracticeProgress(user.uid).then((res) => {
        if (res) setPracticeProgress(res);
      });
    }
  }, [user]);

  const masteryProfile = calculateUserMasteryProfile(user);
  const practiceChallenges = generatePracticeChallengesForUser(user);
  const categoryFilteredModes = PUZZLE_MODES.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });
  const filteredChallenges = practiceChallenges.filter((ch) => {
    if (challengeTypeFilter === 'ALL') return true;
    return ch.type === challengeTypeFilter;
  });
  const detailRecord: PuzzleMasteryRecord | null = activeDetailGame
    ? masteryProfile.records[activeDetailGame] || null
    : null;
  const detailMeta = activeDetailGame
    ? PUZZLE_MODES.find((m) => m.id === activeDetailGame) || null
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Skill Progression & Mastery"
        description="Track skill tiers across all 16 puzzle modes and take on targeted practice challenges."
        action={
          <div className="bg-pv-surface-primary border border-pv-border rounded-lg p-3 flex items-center gap-3 shrink-0">
            <div>
              <p className="text-[10px] text-pv-text-muted uppercase font-medium">Overall Mastery</p>
              <p className="text-base font-semibold text-pv-text-primary font-tabular">
                Level {masteryProfile.overallMasteryLevel} • {masteryProfile.overallMasteryPercent}%
              </p>
            </div>
            <div className="w-8 h-8 rounded-md bg-pv-surface-secondary border border-pv-border flex items-center justify-center text-[#38C6BA] shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
        }
      />

      {/* Sub Navigation */}
      <div className="flex items-center gap-1.5 border-b border-pv-border pb-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-3.5 h-8 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'overview'
              ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
              : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" /> 16 Games Skill Tree
        </button>
        <button
          onClick={() => setActiveSubTab('practice')}
          className={`px-3.5 h-8 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'practice'
              ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
              : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
          }`}
        >
          <Target className="w-3.5 h-3.5" /> Targeted Practice ({practiceChallenges.length})
        </button>
      </div>

      {/* OVERVIEW SUB-TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider block">
                  Top Discipline
                </span>
                <h4 className="text-xs font-semibold text-pv-text-primary truncate">
                  {PUZZLE_MODES.find((m) => m.id === masteryProfile.strongestPuzzleTypes[0])?.name || 'Number Puzzle'}
                </h4>
                <p className="text-[11px] text-pv-text-secondary font-tabular">
                  Lvl {masteryProfile.records[masteryProfile.strongestPuzzleTypes[0]]?.level || 1} •{' '}
                  {masteryProfile.records[masteryProfile.strongestPuzzleTypes[0]]?.masteryPoints || 0} pts
                </p>
              </div>
            </Card>

            <Card className="p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pv-surface-secondary border border-pv-border text-[#38C6BA] flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-[#38C6BA] uppercase tracking-wider block">
                  Developing Focus
                </span>
                <h4 className="text-xs font-semibold text-pv-text-primary truncate">
                  {PUZZLE_MODES.find((m) => m.id === masteryProfile.developingPuzzleTypes[0])?.name || 'Logic Puzzle'}
                </h4>
                <p className="text-[11px] text-pv-text-secondary font-tabular">
                  Lvl {masteryProfile.records[masteryProfile.developingPuzzleTypes[0]]?.level || 1} • Practice Recommended
                </p>
              </div>
            </Card>

            <Card className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-pv-surface-secondary border border-pv-border text-[#38C6BA] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-medium text-pv-text-muted uppercase tracking-wider block">
                    Next Target
                  </span>
                  <h4 className="text-xs font-semibold text-pv-text-primary truncate">
                    {PUZZLE_MODES.find((m) => m.id === masteryProfile.recommendedMasteryTarget)?.name || 'Number Puzzle'}
                  </h4>
                  <p className="text-[11px] text-pv-text-secondary">Level Up Opportunity</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (masteryProfile.recommendedMasteryTarget) {
                    setActiveDetailGame(masteryProfile.recommendedMasteryTarget);
                  }
                }}
                className="h-7 px-2.5 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border text-xs font-medium rounded transition-colors shrink-0"
              >
                Inspect
              </button>
            </Card>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['All', 'Math', 'Words', 'Memory', 'Logic', 'Spatial & Grid', 'Challenge'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 h-7 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
                    : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 16 Games Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryFilteredModes.map((mode) => {
              const rec = masteryProfile.records[mode.id];
              const level = rec?.level || 1;
              const tierName = rec?.tierName || 'Beginner';
              const pts = rec?.masteryPoints || 0;
              const progress = rec?.progressPercent || 0;

              return (
                <Card key={mode.id} className="p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-[#233D4A] border border-[#36515F] flex items-center justify-center">
                          <PuzzleArt type={mode.id} size={16} />
                        </div>
                        <span className="text-[10px] uppercase font-medium text-[#98AAB8]">
                          {mode.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#A8E5D5] font-tabular">
                        Lv.{level}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-pv-text-primary mb-0.5">{mode.name}</h3>
                    <div className="text-[11px] text-pv-text-secondary mb-3 flex items-center justify-between">
                      <span>{tierName}</span>
                      <span className="font-tabular">{pts} / 100 pts</span>
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="w-full bg-pv-surface-secondary h-1.5 rounded-full overflow-hidden border border-pv-border">
                        <div
                          className="bg-[#38C6BA] h-full transition-all duration-300 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#1C2D3B] border border-[#36515F] p-2 rounded-lg text-[11px] mb-3">
                      <div>
                        <span className="text-[#98AAB8] block text-[9px] uppercase">Best Score</span>
                        <span className="text-[#F5F7F8] font-semibold font-tabular">{rec?.bestScore || 0}</span>
                      </div>
                      <div>
                        <span className="text-[#98AAB8] block text-[9px] uppercase">Max Tier</span>
                        <span className="text-[#B4C3CE] font-semibold uppercase">{rec?.highestDifficultyCompleted || 'Easy'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-pv-border">
                    <button
                      onClick={() => setActiveDetailGame(mode.id)}
                      className="flex-1 h-8 bg-[#233D4A] hover:bg-[#2C4654] text-[#B4C3CE] hover:text-[#F5F7F8] border border-[#36515F] font-medium rounded-md text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => playGame(mode.id)}
                      className="h-8 px-3 bg-[#233D4A] hover:bg-[#087F8C] text-[#F5F7F8] hover:text-[#FFFFFF] border border-[#36515F] hover:border-[#38C6BA] font-semibold text-xs rounded-md transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* PRACTICE SUB-TAB */}
      {activeSubTab === 'practice' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-pv-text-primary">Targeted Practice Challenges</h3>
              <p className="text-[11px] text-pv-text-secondary mt-0.5">
                Targeted drills designed to strengthen specific gameplay mechanics.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1 shrink-0">
              {['ALL', 'SPEED', 'ACCURACY', 'NO_HINT', 'DIFFICULTY'].map((t) => (
                <button
                  key={t}
                  onClick={() => setChallengeTypeFilter(t)}
                  className={`px-2.5 h-6 rounded text-[10px] font-medium transition-colors ${
                    challengeTypeFilter === t
                      ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
                      : 'bg-pv-surface-secondary text-pv-text-muted hover:text-pv-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChallenges.map((ch) => {
              const isCompleted = practiceProgress.completedChallengeIds.includes(ch.id);

              return (
                <Card
                  key={ch.id}
                  className={`p-4 flex flex-col justify-between space-y-3 ${
                    isCompleted ? 'opacity-70' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[#38C6BA] bg-pv-surface-secondary border border-pv-border px-1.5 py-0.2 rounded">
                        {ch.type}
                      </span>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-medium">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-pv-text-muted capitalize">
                          {ch.difficulty}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-pv-text-primary mb-1">{ch.title}</h4>
                    <p className="text-[11px] text-pv-text-secondary mb-3 leading-relaxed">
                      {ch.description}
                    </p>
                    <div className="bg-pv-surface-secondary border border-pv-border p-2 rounded text-[11px] flex items-center justify-between">
                      <span className="text-pv-text-muted">Target:</span>
                      <span className="font-semibold text-pv-text-primary font-tabular">{ch.targetLabel}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-pv-border gap-2">
                    <span className="text-[11px] text-pv-text-muted font-mono font-tabular">
                      +{ch.rewardXP} XP • +{ch.rewardCoins} coins
                    </span>
                    <button
                      onClick={() => startPracticeChallenge(ch)}
                      className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                        isCompleted
                          ? 'bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-secondary border border-pv-border'
                          : 'bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isCompleted ? 'Replay' : 'Start'}</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {activeDetailGame && detailRecord && detailMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 ">
          <div className="bg-pv-surface-primary border border-pv-border rounded-xl p-6 max-w-lg w-full space-y-5 shadow-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveDetailGame(null)}
              className="absolute top-4 right-4 p-1 rounded-md text-pv-text-muted hover:text-pv-text-primary hover:bg-pv-surface-secondary transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pv-surface-secondary border border-pv-border text-[#38C6BA] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-pv-text-primary">
                  {detailMeta.name} Mastery
                </h2>
                <p className="text-xs text-pv-text-secondary mt-0.5">
                  Level {detailRecord.level} ({detailRecord.tierName})
                </p>
              </div>
            </div>

            <div className="bg-pv-surface-secondary border border-pv-border p-3 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-pv-text-secondary">Level Progress</span>
                <span className="font-semibold text-pv-text-primary font-tabular">
                  {detailRecord.masteryPoints} / 100 pts ({detailRecord.progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-pv-surface-primary h-1.5 rounded-full overflow-hidden border border-pv-border">
                <div
                  className="bg-[#38C6BA] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${detailRecord.progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-pv-text-muted pt-0.5">
                Next: {detailRecord.nextMilestone}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-pv-surface-secondary border border-pv-border p-2.5 rounded-lg">
                <span className="text-[10px] text-pv-text-muted uppercase block">Best Score</span>
                <span className="text-sm font-semibold text-pv-text-primary font-tabular">{detailRecord.bestScore}</span>
              </div>
              <div className="bg-pv-surface-secondary border border-pv-border p-2.5 rounded-lg">
                <span className="text-[10px] text-pv-text-muted uppercase block">Wins</span>
                <span className="text-sm font-semibold text-emerald-400 font-tabular">
                  {detailRecord.completedWins} / {detailRecord.completedGames}
                </span>
              </div>
              <div className="bg-pv-surface-secondary border border-pv-border p-2.5 rounded-lg">
                <span className="text-[10px] text-pv-text-muted uppercase block">Max Tier</span>
                <span className="text-sm font-semibold text-pv-text-secondary uppercase">
                  {detailRecord.highestDifficultyCompleted}
                </span>
              </div>
              <div className="bg-pv-surface-secondary border border-pv-border p-2.5 rounded-lg">
                <span className="text-[10px] text-pv-text-muted uppercase block">Trend</span>
                <span className="text-sm font-semibold text-pv-text-primary capitalize">
                  {detailRecord.recentTrend}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-pv-border">
              <button
                onClick={() => {
                  setActiveDetailGame(null);
                  viewPuzzleGuide(detailMeta.id);
                }}
                className="flex-1 h-9 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" /> Guide
              </button>
              <button
                onClick={() => {
                  setActiveDetailGame(null);
                  playGame(detailMeta.id);
                }}
                className="flex-1 h-9 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
