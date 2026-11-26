import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PuzzleCollection, UserCollectionProgress } from '../types';
import { fetchPuzzleCollectionById, fetchUserCollectionProgress } from '../services/firebase';
import { PUZZLE_MODES } from '../data/puzzles';
import { Layers, ChevronLeft, CheckCircle, Play, Clock, Award } from 'lucide-react';
import { PageHeader, Card } from '../components/ui/Card';
import { formatCount } from '../utils/format';

export const CollectionDetailPage: React.FC = () => {
  const { user, selectedCollectionId, setActiveTab, playCollectionPuzzle } = useStore();
  const [collection, setCollection] = useState<PuzzleCollection | null>(null);
  const [progress, setProgress] = useState<UserCollectionProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      if (!selectedCollectionId) return;
      setLoading(true);
      const col = await fetchPuzzleCollectionById(selectedCollectionId);
      setCollection(col);
      if (user?.uid && col) {
        const prog = await fetchUserCollectionProgress(user.uid, col.id);
        setProgress(prog);
      }
      setLoading(false);
    }
    loadDetail();
  }, [selectedCollectionId, user?.uid]);

  if (loading) {
    return (
      <Card className="py-20 text-center max-w-lg mx-auto">
        <div className="w-6 h-6 border-2 border-pv-dragon-fruit border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-pv-text-secondary font-medium">Loading playlist...</p>
      </Card>
    );
  }

  if (!collection) {
    return (
      <Card className="p-8 text-center space-y-3 max-w-md mx-auto">
        <Layers className="w-8 h-8 text-pv-dragon-fruit mx-auto" />
        <h2 className="text-base font-semibold text-pv-text-primary">Collection Not Found</h2>
        <button
          onClick={() => setActiveTab('collections')}
          className="h-9 px-4 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold text-xs font-medium rounded-lg"
        >
          Return to Collections
        </button>
      </Card>
    );
  }

  const completedIndices = new Set<number>(progress?.completedPuzzleIndices || []);
  const completedCount = completedIndices.size;
  const totalCount = collection.items.length;
  const pct = Math.round((completedCount / totalCount) * 100);
  const isCompleted = progress?.status === 'COMPLETED' || completedCount >= totalCount;

  const nextIndex = collection.items.findIndex((_, idx) => !completedIndices.has(idx));
  const activePlayIndex = nextIndex !== -1 ? nextIndex : 0;

  const handlePrimaryClick = () => {
    const targetItem = collection.items[activePlayIndex];
    if (targetItem) {
      playCollectionPuzzle(
        collection.id,
        activePlayIndex,
        targetItem.puzzleType,
        targetItem.difficulty,
        targetItem.seed
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back Button */}
      <button
        onClick={() => setActiveTab('collections')}
        className="flex items-center gap-1.5 text-xs text-pv-text-secondary hover:text-pv-text-primary transition-colors font-medium"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Playlists
      </button>

      {/* Hero Header */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-pv-surface-secondary border border-pv-border text-pv-text-muted">
                {collection.category}
              </span>
              <span className="text-[10px] font-medium capitalize text-pv-text-secondary">
                {collection.difficulty} Difficulty
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-pv-text-primary">{collection.title}</h1>
            <p className="text-xs text-pv-text-secondary max-w-xl">{collection.description}</p>
          </div>

          <button
            onClick={handlePrimaryClick}
            className="h-10 px-5 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {isCompleted ? 'Replay Playlist' : completedCount > 0 ? 'Continue' : 'Start Playlist'}
            </span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-pv-surface-secondary border border-pv-border p-3.5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-pv-text-secondary flex items-center gap-1.5 font-tabular">
              <Clock className="w-3.5 h-3.5 text-pv-dragon-fruit" /> ~{collection.estimatedMinutes || 5} min • {completedCount} / {totalCount} steps
            </span>
            <span className="text-pv-dragon-fruit font-mono text-[11px] font-medium">
              +{collection.rewardXP} XP • +{collection.rewardCoins} coins
            </span>
          </div>
          <div className="w-full bg-pv-surface-primary h-1.5 rounded-full overflow-hidden border border-pv-border">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isCompleted ? 'bg-emerald-500' : 'bg-pv-dragon-fruit'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Playlist Steps */}
      <Card className="p-5 space-y-3">
        <h3 className="text-xs font-semibold text-pv-text-primary border-b border-pv-border pb-2.5">
          Playlist Sequence ({formatCount(collection.items.length, 'step')})
        </h3>

        <div className="space-y-2">
          {collection.items.map((item, idx) => {
            const pzMeta = PUZZLE_MODES.find((p) => p.id === item.puzzleType);
            const isSolved = completedIndices.has(idx);
            const isNext = idx === activePlayIndex && !isCompleted;

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                  isSolved
                    ? 'bg-pv-surface-secondary border-emerald-500/30'
                    : isNext
                    ? 'bg-pv-surface-soft border-pv-dragon-fruit'
                    : 'bg-pv-surface-secondary border-pv-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-medium ${
                      isSolved
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40'
                        : isNext
                        ? 'bg-pv-dragon-fruit text-[#110F15] font-semibold'
                        : 'bg-pv-surface-primary text-pv-text-muted border border-pv-border'
                    }`}
                  >
                    {isSolved ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-pv-text-primary flex items-center gap-2">
                      {pzMeta?.name || item.puzzleType}
                      {isSolved && (
                        <span className="text-[10px] text-emerald-400 font-medium">Completed</span>
                      )}
                    </h4>
                    <p className="text-[11px] text-pv-text-secondary capitalize">
                      {item.difficulty} tier
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    playCollectionPuzzle(
                      collection.id,
                      idx,
                      item.puzzleType,
                      item.difficulty,
                      item.seed
                    )
                  }
                  className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                    isNext
                      ? 'bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold'
                      : 'bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-secondary hover:text-pv-text-primary border border-pv-border'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isSolved ? 'Replay' : 'Play'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
