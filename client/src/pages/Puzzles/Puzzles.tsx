import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RotateCw, Lightbulb, X, Sparkles, Gamepad2, ArrowDownAZ, Star } from 'lucide-react';
import { PuzzleModeCard } from '../../components/dashboard/PuzzleModeCard';
import { getAllRecentGames } from '../../services/gameResultService';
import { getMultipleRecommendations } from '../../services/recommendationService';
import { addFavorite, removeFavorite } from '../../services/favoriteService';
import { useAuthStore } from '../../store/useAuthStore';
import { usePuzzleStore } from '../../store/usePuzzleStore';
import { useFavorites } from '../../store/useFavorites';
import { useGameHistoryStore } from '../../store/useGameHistoryStore';

const CATEGORIES = ['ALL', 'FAVORITES', 'Numbers', 'Words', 'Memory', 'Logic', 'Spatial & Path', 'Pattern & Visual', 'Challenge'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard', 'Expert'];
const PLAY_STATUS = ['All', 'Played', 'Unplayed'];
const SORTS = ['Recommended', 'Recently Played', 'Most Played', 'Highest Score', 'Difficulty', 'Alphabetical'];

export const Puzzles = () => {
  const { profile } = useAuthStore();
  const { activePuzzles } = usePuzzleStore();
  const { favoriteIds } = useFavorites();
  const { games: allGames, fetchHistory } = useGameHistoryStore();
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  const searchQuery = searchParams.get('search') || '';
  const activeCategory = searchParams.get('category') || 'ALL';
  const activeDifficulty = searchParams.get('difficulty') || 'All';
  const activePlayStatus = searchParams.get('status') || 'All';
  const activeSort = searchParams.get('sort') || 'Recommended';
  
  const updateParam = (key: string, value: string, defaultValue: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value === defaultValue || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
      return newParams;
    });
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };
  
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [tryDifferent, setTryDifferent] = useState<any[]>([]);
  const [gameStats, setGameStats] = useState<Record<string, { played: number, lastPlayed: number, bestScore: number, bestTime?: number }>>({});
  
  const handleToggleFavorite = async (e: React.MouseEvent, puzzleId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?.uid) return;
    
    if (favoriteIds.includes(puzzleId)) {
      await removeFavorite(profile.uid, puzzleId);
    } else {
      await addFavorite(profile.uid, puzzleId);
    }
  };

  useEffect(() => {
    if (profile?.uid) {
      fetchHistory(profile.uid, 200);
    }
  }, [profile?.uid, fetchHistory]);

  useEffect(() => {
    if (!activePuzzles.length) return;

    if (profile?.uid) {
      const gameList = allGames.slice(0, 50);
      
      // Compute game stats (lastPlayed, played count, bestScore)
      const stats: Record<string, { played: number, lastPlayed: number, bestScore: number, bestTime?: number }> = {};
      gameList.forEach(g => {
        const t = (g.puzzleType || '').toLowerCase();
        if (!stats[t]) {
          stats[t] = { played: 0, lastPlayed: 0, bestScore: 0 };
        }
        stats[t].played++;
        const ts = g.createdAt?.toMillis ? g.createdAt.toMillis() : new Date(g.createdAt || Date.now()).getTime();
        if (ts > stats[t].lastPlayed) stats[t].lastPlayed = ts;
        if (g.score > stats[t].bestScore) stats[t].bestScore = g.score;
        if (g.status === 'COMPLETED' && g.timeTaken > 0) {
          if (!stats[t].bestTime || g.timeTaken < stats[t].bestTime!) {
            stats[t].bestTime = g.timeTaken;
          }
        }
      });
      setGameStats(stats);

      // Recent Unique Games
      const unique = gameList.reduce((acc: any[], current: any) => {
        const x = acc.find((item: any) => item.puzzleType === current.puzzleType);
        if (!x) return acc.concat([current]);
        return acc;
      }, []);
      const activeRecent = unique.filter((g: any) => activePuzzles.some(p => p.title.toLowerCase() === g.puzzleType?.toLowerCase()));
      setRecentGames(activeRecent.slice(0, 4));

      // Recommended / Try Something Different
      const recs = getMultipleRecommendations(profile, gameList, activePuzzles, 2);
      
      const mappedPrimary = activePuzzles.find(p => p.id === recs[0]?.puzzleId);
      if (mappedPrimary) setRecommendations([{ puzzle: mappedPrimary, reason: recs[0].reason }]);
      else setRecommendations([]);
      
      if (recs.length > 1) {
        const mappedSec = activePuzzles.find(p => p.id === recs[1]?.puzzleId);
        if (mappedSec) setTryDifferent([{ puzzle: mappedSec, reason: recs[1].reason }]);
        else setTryDifferent([]);
      } else {
        // If no secondary recommendation, find unplayed
        const unplayed = activePuzzles.filter(p => !stats[p.title.toLowerCase()] && p.id !== 'rnd');
        if (unplayed.length > 0) {
          setTryDifferent([{ puzzle: unplayed[0], reason: 'Try something completely new.' }]);
        } else {
          setTryDifferent([]);
        }
      }
    } else {
      // Unauthenticated fallback
      const recs = getMultipleRecommendations(null, [], activePuzzles, 2);
      const mappedPrimary = activePuzzles.find(p => p.id === recs[0]?.puzzleId);
      if (mappedPrimary) setRecommendations([{ puzzle: mappedPrimary, reason: recs[0].reason }]);
      else setRecommendations([]);
      
      const mappedSec = activePuzzles.find(p => p.id === recs[1]?.puzzleId);
      if (mappedSec) setTryDifferent([{ puzzle: mappedSec, reason: recs[1].reason }]);
      else setTryDifferent([]);
      
      setRecentGames([]);
      setGameStats({});
    }
  }, [profile, activePuzzles, allGames]);

  const filteredPuzzles = useMemo(() => {
    let result = activePuzzles.filter((puzzle) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
                            puzzle.title.toLowerCase().includes(q) || 
                            puzzle.description.toLowerCase().includes(q) ||
                            (puzzle.category || '').toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'ALL' || 
                              (activeCategory === 'FAVORITES' ? favoriteIds.includes(puzzle.id) : (puzzle.category?.toLowerCase() === activeCategory.toLowerCase()));
      const matchesDifficulty = activeDifficulty === 'All' || puzzle.difficulty === activeDifficulty;
      
      const pStats = gameStats[puzzle.title.toLowerCase()];
      const isPlayed = !!pStats && pStats.played > 0;
      const matchesStatus = activePlayStatus === 'All' || 
                            (activePlayStatus === 'Played' && isPlayed) ||
                            (activePlayStatus === 'Unplayed' && !isPlayed);
      
      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
    });

    // Sorting
    result.sort((a, b) => {
      const statsA = gameStats[a.title.toLowerCase()] || { played: 0, lastPlayed: 0, bestScore: 0 };
      const statsB = gameStats[b.title.toLowerCase()] || { played: 0, lastPlayed: 0, bestScore: 0 };

      switch (activeSort) {
        case 'Recently Played':
          return statsB.lastPlayed - statsA.lastPlayed;
        case 'Most Played':
          return statsB.played - statsA.played;
        case 'Highest Score':
          return statsB.bestScore - statsA.bestScore;
        case 'Difficulty': {
          const diffMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Expert': 4 };
          const dA = diffMap[a.difficulty as keyof typeof diffMap] || 0;
          const dB = diffMap[b.difficulty as keyof typeof diffMap] || 0;
          return dA - dB;
        }
        case 'Alphabetical':
          return a.title.localeCompare(b.title);
        case 'Recommended':
        default:
          // Deterministic default based on initial array order
          return 0; 
      }
    });

    return result;
  }, [activePuzzles, searchQuery, activeCategory, activeDifficulty, activePlayStatus, activeSort, gameStats, favoriteIds]);

  const getPuzzleDef = (title: string) => {
    return activePuzzles.find(p => p.title.toLowerCase() === title.toLowerCase());
  };

  const isFiltering = searchQuery !== '' || activeCategory !== 'ALL' || activeDifficulty !== 'All' || activePlayStatus !== 'All' || activeSort !== 'Recommended';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      
      {/* Header */}
      <section className="bg-[#151B23] p-8 rounded-3xl border border-border shadow-sm flex flex-col items-start justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
        <h1 className="text-3xl font-black text-textMain tracking-tight mb-2 relative">
          Puzzle Library
        </h1>
        <p className="text-textMuted text-base font-medium relative">
          Discover new challenges and track your favorites.
        </p>
      </section>

      {/* Discovery Sections (Only show when not actively searching/filtering) */}
      {!isFiltering && (
        <div className="space-y-8">
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recommended For You */}
            {recommendations.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-black text-textMain flex items-center gap-2 uppercase tracking-wider text-sm">
                  <Lightbulb className="w-5 h-5 text-accent fill-accent" /> Recommended For You
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {recommendations.map((rec, i) => {
                    const pb = gameStats[rec.puzzle.title.toLowerCase()];
                    return (
                      <div key={`rec-${i}`} className="relative group">
                        <PuzzleModeCard 
                          {...rec.puzzle} 
                          isFavorite={favoriteIds.includes(rec.puzzle.id)}
                          onToggleFavorite={(e) => handleToggleFavorite(e, rec.puzzle.id)}
                          personalBest={pb ? { score: pb.bestScore, time: pb.bestTime } : undefined}
                        />
                        <div className="absolute -top-3 right-4 bg-accent text-[#111821] text-[10px] font-black px-2 py-0.5 rounded-full shadow-md z-10 pointer-events-none">
                          {rec.reason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Try Something Different */}
            {tryDifferent.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-black text-textMain flex items-center gap-2 uppercase tracking-wider text-sm">
                  <Sparkles className="w-5 h-5 text-secondary" /> Try Something Different
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {tryDifferent.map((rec, i) => {
                    const pb = gameStats[rec.puzzle.title.toLowerCase()];
                    return (
                      <div key={`diff-${i}`} className="relative group">
                        <PuzzleModeCard 
                          {...rec.puzzle} 
                          isFavorite={favoriteIds.includes(rec.puzzle.id)}
                          onToggleFavorite={(e) => handleToggleFavorite(e, rec.puzzle.id)}
                          personalBest={pb ? { score: pb.bestScore, time: pb.bestTime } : undefined}
                        />
                        <div className="absolute -top-3 right-4 bg-secondary text-[#111821] text-[10px] font-black px-2 py-0.5 rounded-full shadow-md z-10 pointer-events-none">
                          {rec.reason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* My Favorites */}
          {favoriteIds.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-black text-textMain flex items-center gap-2 uppercase tracking-wider text-sm">
                <Star className="w-5 h-5 text-accent fill-accent" /> My Favorites
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {favoriteIds.map(favId => {
                  const def = activePuzzles.find(p => p.id === favId);
                  if (!def) return null;
                  const pb = gameStats[def.title.toLowerCase()];
                  return (
                    <PuzzleModeCard 
                      key={`fav-${favId}`} 
                      {...def} 
                      isFavorite={true}
                      onToggleFavorite={(e) => handleToggleFavorite(e, def.id)}
                      personalBest={pb ? { score: pb.bestScore, time: pb.bestTime } : undefined}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Recently Played */}
          {recentGames.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-black text-textMain flex items-center gap-2 uppercase tracking-wider text-sm">
                <RotateCw className="w-5 h-5 text-primary" /> Continue Playing
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {recentGames.map((game, i) => {
                  const def = getPuzzleDef(game.puzzleType || '');
                  if (!def) return null;
                  const pb = gameStats[def.title.toLowerCase()];
                  return (
                    <PuzzleModeCard 
                      key={`recent-${i}`} 
                      {...def} 
                      isFavorite={favoriteIds.includes(def.id)}
                      onToggleFavorite={(e) => handleToggleFavorite(e, def.id)}
                      personalBest={pb ? { score: pb.bestScore, time: pb.bestTime } : undefined}
                    />
                  );
                })}
              </div>
            </section>
          )}

          <div className="w-full h-px bg-border my-8"></div>

        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-textMain flex items-center gap-2 uppercase tracking-wider text-sm">
            <Gamepad2 className="w-5 h-5 text-primary" /> All Puzzles
          </h2>
        </div>

        {/* Filters & Search */}
        <div className="bg-[#151B23] rounded-2xl border border-border p-4 flex flex-col gap-4 shadow-sm mb-6">
          
          <div className="flex flex-col lg:flex-row gap-4 items-center w-full">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
              <input
                type="text"
                placeholder="Search puzzles (e.g. 'word', 'logic')..."
                value={searchQuery}
                onChange={(e) => updateParam('search', e.target.value, '')}
                className="w-full bg-background border border-border rounded-xl py-2.5 pl-12 pr-10 text-textMain placeholder:text-textMuted focus:outline-none focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all font-bold text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => updateParam('search', '', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 custom-scrollbar">
              <select 
                value={activePlayStatus}
                onChange={(e) => updateParam('status', e.target.value, 'All')}
                className="bg-background border border-border rounded-lg py-2.5 px-3 text-textMain text-sm font-bold focus:outline-none focus-visible:border-primary/50 cursor-pointer hover:border-primary/30 transition-colors shrink-0"
              >
                {PLAY_STATUS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
              </select>

              <select 
                value={activeDifficulty}
                onChange={(e) => updateParam('difficulty', e.target.value, 'All')}
                className="bg-background border border-border rounded-lg py-2.5 px-3 text-textMain text-sm font-bold focus:outline-none focus-visible:border-primary/50 cursor-pointer hover:border-primary/30 transition-colors shrink-0"
              >
                {DIFFICULTIES.map(diff => (
                  <option key={diff} value={diff}>{diff === 'All' ? 'All Difficulties' : diff}</option>
                ))}
              </select>

              <div className="relative shrink-0 flex items-center">
                <ArrowDownAZ className="w-4 h-4 absolute left-3 text-textMuted pointer-events-none" />
                <select 
                  value={activeSort}
                  onChange={(e) => updateParam('sort', e.target.value, 'Recommended')}
                  className="bg-background border border-border rounded-lg py-2.5 pl-9 pr-3 text-textMain text-sm font-bold focus:outline-none focus-visible:border-primary/50 cursor-pointer hover:border-primary/30 transition-colors"
                >
                  {SORTS.map(s => <option key={s} value={s}>Sort: {s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar w-full" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => updateParam('category', category, 'ALL')}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                  activeCategory.toLowerCase() === category.toLowerCase() 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-background text-textMuted hover:bg-surface border border-border hover:text-textMain'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

        </div>

        {/* Game Grid */}
        <div>
          {filteredPuzzles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredPuzzles.map((puzzle) => {
                const pb = gameStats[puzzle.title.toLowerCase()];
                return (
                  <PuzzleModeCard 
                    key={puzzle.id} 
                    {...puzzle} 
                    isFavorite={favoriteIds.includes(puzzle.id)}
                    onToggleFavorite={(e) => handleToggleFavorite(e, puzzle.id)}
                    personalBest={pb ? { score: pb.bestScore, time: pb.bestTime } : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-[#151B23] border border-border rounded-3xl py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-6 border border-border">
                {activeCategory === 'FAVORITES' ? <Star className="w-8 h-8 text-textMuted" /> : <Search className="w-8 h-8 text-textMuted" />}
              </div>
              <h3 className="text-xl font-black text-textMain mb-2">
                {activeCategory === 'FAVORITES' && !searchQuery ? 'No favorites yet' : 'No puzzles found'}
              </h3>
              <p className="text-textMuted max-w-md text-sm mb-6 font-medium">
                {activeCategory === 'FAVORITES' && !searchQuery 
                  ? 'Save puzzles here to find them quickly.'
                  : 'We couldn\'t find any puzzles matching your current filters. Try selecting a different category or clearing your search.'}
              </p>
              <button 
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg font-bold transition-colors border border-primary/20 hover:border-primary"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
