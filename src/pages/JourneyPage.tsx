import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { DEFAULT_JOURNEY_CHAPTERS } from '../data/journeyData';
import { fetchUserJourneyProgress } from '../services/firebase';
import { JourneyChapter, JourneyStage, UserJourneyProgress } from '../types';
import { Compass, CheckCircle2, Lock, Play, Trophy, BookOpen, X } from 'lucide-react';
import { PageHeader, Card } from '../components/ui/Card';
import { PuzzleCoverArt } from '../components/PuzzleArt';
import { formatCount } from '../utils/format';

export const JourneyPage: React.FC = () => {
  const { user, playJourneyStage, viewPuzzleGuide } = useStore();
  const [progress, setProgress] = useState<UserJourneyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchUserJourneyProgress(user.uid).then((prog) => {
        setProgress(prog);
        setLoading(false);
      });
    }
  }, [user]);

  const completedIds = new Set(progress?.completedStageIds || []);
  const allStages = DEFAULT_JOURNEY_CHAPTERS.flatMap((ch) => ch.stages);
  const totalStages = allStages.length;
  const completedCount = completedIds.size;
  const progressPercent = Math.min(100, Math.round((completedCount / totalStages) * 100));

  const nextStageToPlay = allStages.find((s) => !completedIds.has(s.id)) || allStages[allStages.length - 1];

  const getStageStatus = (stage: JourneyStage, chapter: JourneyChapter) => {
    if (completedIds.has(stage.id)) return 'COMPLETED';
    if (chapter.unlockReqChapterId) {
      const reqChapter = DEFAULT_JOURNEY_CHAPTERS.find((c) => c.id === chapter.unlockReqChapterId);
      if (reqChapter) {
        const reqChapterAllCompleted = reqChapter.stages.every((s) => completedIds.has(s.id));
        if (!reqChapterAllCompleted) return 'LOCKED';
      }
    }
    if (stage.unlockReqStageId && !completedIds.has(stage.unlockReqStageId)) {
      return 'LOCKED';
    }
    if (nextStageToPlay && nextStageToPlay.id === stage.id) {
      return 'CURRENT';
    }
    return 'UNLOCKED';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Campaign Journey"
        description="Progress through multi-chapter puzzle stages across all 16 disciplines."
        action={
          <div className="bg-pv-surface-primary border border-pv-border rounded-lg p-3 min-w-[200px] shrink-0">
            <div className="flex items-center justify-between text-xs text-pv-text-secondary mb-1.5">
              <span>Campaign Progress</span>
              <span className="font-semibold text-pv-text-primary font-tabular">{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-pv-surface-secondary rounded-full overflow-hidden border border-pv-border">
              <div
                className="h-full bg-[#38C6BA] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-pv-text-muted mt-1 font-tabular">
              {completedCount} of {formatCount(totalStages, 'stage')} completed
            </p>
          </div>
        }
      />

      {/* Next Active Stage Card */}
      {nextStageToPlay && (
        <Card
          surface="featured"
          padding="none"
          className="border-[#38C6BA]/40 overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch"
        >
          <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#A8E5D5] uppercase tracking-wider">
                Active Campaign Stage
              </span>
              <h3 className="text-lg font-semibold text-[#F5F7F8]">
                Chapter {nextStageToPlay.chapterNumber} · Stage {nextStageToPlay.stageNumber}: {nextStageToPlay.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#B4C3CE] max-w-xl leading-relaxed">
                {nextStageToPlay.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-2 py-0.5 rounded bg-[#1C2D3B] border border-[#36515F] text-[11px] text-[#B4C3CE] capitalize">
                  {nextStageToPlay.puzzleType.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#1C2D3B] border border-[#36515F] text-[11px] text-[#B4C3CE] capitalize">
                  {nextStageToPlay.difficulty}
                </span>
                <span className="text-[#A8E5D5] font-mono font-medium text-[11px]">
                  +{nextStageToPlay.rewardXP} XP · +{nextStageToPlay.rewardCoins} coins
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={() => playJourneyStage(nextStageToPlay)}
                className="h-10 px-5 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs rounded-lg inline-flex items-center justify-center gap-2 transition-colors pv-keycap cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Continue Journey</span>
              </button>
            </div>
          </div>
          <div className="md:col-span-4 bg-[#101E2B] border-t md:border-t-0 md:border-l border-[#36515F] min-h-[140px]">
            <PuzzleCoverArt type={nextStageToPlay.puzzleType} />
          </div>
        </Card>
      )}

      {/* Chapters List */}
      <div className="space-y-6">
        {DEFAULT_JOURNEY_CHAPTERS.map((chapter) => {
          const chapterStages = chapter.stages;
          const chapterCompletedCount = chapterStages.filter((s) => completedIds.has(s.id)).length;
          const isChapterComplete = chapterCompletedCount === chapterStages.length;

          return (
            <Card key={chapter.id} className="p-5 space-y-4">
              {/* Chapter Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-pv-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#38C6BA] uppercase tracking-wider">
                      Chapter {chapter.number}
                    </span>
                    {isChapterComplete && (
                      <span className="text-[10px] text-emerald-400 font-medium px-1.5 py-0.2 rounded bg-emerald-950/40 border border-emerald-500/40">
                        Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-pv-text-primary mt-0.5">{chapter.title}</h3>
                  <p className="text-xs text-pv-text-secondary">{chapter.description}</p>
                </div>
                <span className="text-xs text-pv-text-muted font-tabular">
                  {chapterCompletedCount} / {formatCount(chapterStages.length, 'stage')}
                </span>
              </div>

              {/* Stage Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {chapterStages.map((stage) => {
                  const status = getStageStatus(stage, chapter);

                  let itemStyle = 'bg-pv-surface-secondary border-pv-border hover:border-pv-border-strong cursor-pointer';
                  if (status === 'COMPLETED') {
                    itemStyle = 'bg-pv-surface-secondary border-emerald-500/40 cursor-pointer';
                  } else if (status === 'CURRENT') {
                    itemStyle = 'bg-pv-surface-soft border-[#38C6BA] cursor-pointer';
                  } else if (status === 'LOCKED') {
                    itemStyle = 'bg-pv-surface-primary border-pv-border/40 opacity-40 cursor-not-allowed';
                  }

                  return (
                    <div
                      key={stage.id}
                      onClick={() => {
                        if (status !== 'LOCKED') setSelectedStage(stage);
                      }}
                      className={`p-3.5 rounded-lg border transition-colors flex flex-col justify-between min-h-[140px] ${itemStyle}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-pv-text-muted">
                          {stage.chapterNumber}.{stage.stageNumber}
                        </span>
                        {status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : status === 'CURRENT' ? (
                          <span className="text-[10px] font-semibold text-[#38C6BA] uppercase tracking-wider">
                            Current
                          </span>
                        ) : status === 'LOCKED' ? (
                          <Lock className="w-3.5 h-3.5 text-pv-text-muted" />
                        ) : null}
                      </div>

                      <div className="my-1.5 space-y-0.5">
                        <h4 className="font-medium text-xs text-pv-text-primary line-clamp-1">
                          {stage.title}
                        </h4>
                        <p className="text-[11px] text-pv-text-secondary line-clamp-2">
                          {stage.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-pv-border flex items-center justify-between text-[11px]">
                        <span className="capitalize text-pv-text-muted">
                          {stage.puzzleType.replace('_', ' ')}
                        </span>
                        <span className="text-[#38C6BA] font-mono font-medium">
                          +{stage.rewardXP} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Stage Detail Modal */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-pv-surface-primary border border-pv-border rounded-xl p-6 max-w-md w-full space-y-4 shadow-lg relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-[#38C6BA] uppercase tracking-wider">
                  Chapter {selectedStage.chapterNumber} · Stage {selectedStage.stageNumber}
                </span>
                <h3 className="text-lg font-semibold text-pv-text-primary mt-0.5">{selectedStage.title}</h3>
              </div>
              <button
                onClick={() => setSelectedStage(null)}
                className="p-1 rounded-md text-pv-text-muted hover:text-pv-text-primary hover:bg-pv-surface-secondary transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-pv-text-secondary leading-relaxed">
              {selectedStage.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs bg-pv-surface-secondary p-3 rounded-lg border border-pv-border">
              <div>
                <span className="text-pv-text-muted block text-[10px]">Discipline</span>
                <span className="font-medium text-pv-text-primary capitalize">
                  {selectedStage.puzzleType.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-pv-text-muted block text-[10px]">Difficulty</span>
                <span className="font-medium text-pv-text-primary capitalize">
                  {selectedStage.difficulty}
                </span>
              </div>
              <div>
                <span className="text-pv-text-muted block text-[10px]">XP Reward</span>
                <span className="font-medium text-[#38C6BA] font-tabular">
                  +{selectedStage.rewardXP} XP
                </span>
              </div>
              <div>
                <span className="text-pv-text-muted block text-[10px]">Coins Reward</span>
                <span className="font-medium text-[#38C6BA] font-tabular">
                  +{selectedStage.rewardCoins} coins
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-pv-border">
              <button
                onClick={() => {
                  const type = selectedStage.puzzleType;
                  setSelectedStage(null);
                  viewPuzzleGuide(type);
                }}
                className="flex-1 h-9 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" /> Guide
              </button>
              <button
                onClick={() => {
                  const stage = selectedStage;
                  setSelectedStage(null);
                  playJourneyStage(stage);
                }}
                className="flex-1 h-9 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
