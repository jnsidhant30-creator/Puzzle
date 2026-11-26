import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PuzzleCollection, CollectionCategory, UserCollectionProgress } from '../types';
import { fetchPuzzleCollections, fetchUserCollectionProgress } from '../services/firebase';
import { getRecommendedCollections } from '../services/recommendation';
import { Layers, Search, Clock, Award, CheckCircle, Play, ChevronRight } from 'lucide-react';
import { PageHeader, Card } from '../components/ui/Card';
import { formatCount } from '../utils/format';

const CATEGORIES: (CollectionCategory | 'All')[] = [
  'All',
  'Beginner',
  'Logic',
  'Speed',
  'Memory',
  'Word',
  'Spatial',
  'Mixed',
  'Challenge',
  'Seasonal',
];

export const CollectionsPage: React.FC = () => {
  const { user, viewCollectionDetail } = useStore();
  const [collections, setCollections] = useState<PuzzleCollection[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, UserCollectionProgress>>({});
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollectionsData() {
      setLoading(true);
      const cols = await fetchPuzzleCollections();
      setCollections(cols);
      if (user?.uid) {
        const map: Record<string, UserCollectionProgress> = {};
        for (const col of cols) {
          const p = await fetchUserCollectionProgress(user.uid, col.id);
          if (p) map[col.id] = p;
        }
        setProgressMap(map);
      }
      setLoading(false);
    }
    loadCollectionsData();
  }, [user?.uid]);

  const recommendedCols = getRecommendedCollections(user, collections, 2);

  const filteredCollections = collections.filter((col) => {
    const matchesCategory = selectedCategory === 'All' || col.category === selectedCategory;
    const matchesSearch =
      col.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Playlists & Collections"
        description="Themed puzzle playlists organized for progressive skill mastery."
        action={
          <span className="text-xs text-pv-text-secondary bg-pv-surface-primary border border-pv-border px-3 py-1.5 rounded-lg font-tabular shrink-0">
            {collections.length} playlists available
          </span>
        }
      />

      {/* Recommended Spotlight */}
      {recommendedCols.length > 0 && !searchQuery && selectedCategory === 'All' && (
        <Card className="p-5 space-y-3 border-pv-dragon-fruit/40">
          <h3 className="text-xs font-semibold text-pv-dragon-fruit uppercase tracking-wider">
            Recommended Playlists
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedCols.map((col) => {
              return (
                <div
                  key={col.id}
                  onClick={() => viewCollectionDetail(col.id)}
                  className="bg-pv-surface-secondary p-4 rounded-lg border border-pv-border hover:border-pv-border-strong transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-pv-surface-primary text-pv-text-muted border border-pv-border">
                      {col.category}
                    </span>
                    <span className="text-[11px] text-pv-dragon-fruit font-mono font-medium flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> +{col.rewardXP} XP
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-pv-text-primary">{col.title}</h4>
                    <p className="text-xs text-pv-text-secondary mt-0.5 line-clamp-2">{col.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-pv-text-muted pt-2 border-t border-pv-border/60">
                    <span className="flex items-center gap-1 font-tabular">
                      <Clock className="w-3 h-3" /> ~{col.estimatedMinutes || 5} min • {formatCount(col.items.length, 'puzzle')}
                    </span>
                    <span className="font-medium text-pv-dragon-fruit flex items-center gap-0.5">
                      Open <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-pv-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search playlists..."
            className="w-full bg-pv-surface-primary border border-pv-border text-pv-text-primary pl-9 pr-3 h-8 rounded-lg text-xs focus:outline-none focus:border-pv-dragon-fruit placeholder-pv-text-muted"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 border-b sm:border-0 border-pv-border">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 h-7 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
                  : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <Card className="py-16 text-center">
          <div className="w-6 h-6 border-2 border-pv-dragon-fruit border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-pv-text-secondary font-medium">Loading collections...</p>
        </Card>
      ) : filteredCollections.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-pv-surface-secondary rounded-lg flex items-center justify-center text-pv-text-muted mx-auto border border-pv-border">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-pv-text-primary">No playlists found</h3>
          <p className="text-xs text-pv-text-secondary max-w-sm mx-auto">
            Try adjusting your search query or category filter.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollections.map((col) => {
            const prog = progressMap[col.id];
            const completedCount = prog?.completedPuzzleIndices?.length || 0;
            const totalCount = col.items.length;
            const pct = Math.round((completedCount / totalCount) * 100);
            const isCompleted = prog?.status === 'COMPLETED';

            return (
              <Card
                key={col.id}
                onClick={() => viewCollectionDetail(col.id)}
                className="p-4 space-y-3 flex flex-col justify-between hover:border-pv-border-strong transition-colors cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-pv-surface-secondary border border-pv-border text-pv-text-muted">
                      {col.category}
                    </span>
                    <span className="text-[10px] font-medium capitalize text-pv-text-secondary">
                      {col.difficulty}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-1.5">
                      {col.title}
                      {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </h3>
                    <p className="text-xs text-pv-text-secondary mt-0.5 line-clamp-2">
                      {col.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2.5 border-t border-pv-border">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-pv-text-muted font-tabular">
                      <span>{completedCount} / {totalCount} completed</span>
                      <span className={isCompleted ? 'text-emerald-400' : 'text-pv-text-primary'}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-pv-surface-secondary h-1.5 rounded-full overflow-hidden border border-pv-border">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isCompleted ? 'bg-emerald-500' : 'bg-pv-dragon-fruit'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-pv-text-muted font-mono font-tabular">
                      +{col.rewardXP} XP • +{col.rewardCoins} coins
                    </span>
                    <button
                      type="button"
                      className="h-7 px-3 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{completedCount === 0 ? 'Start' : isCompleted ? 'Replay' : 'Continue'}</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
