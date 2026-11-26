import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PUZZLE_MODES } from '../data/puzzles';
import { Difficulty } from '../types';
import { BookOpen, Search, Heart, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, PageHeader } from '../components/ui/Card';
import { PuzzleCoverArt, PUZZLE_CATEGORY_ACCENT } from '../components/PuzzleArt';

export const GamesCatalogPage: React.FC = () => {
  const { playGame, viewPuzzleGuide, user, getRecommendedDifficulty } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [manualDifficulty, setManualDifficulty] = useState<Difficulty | 'auto'>('auto');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const categories = ['All', 'Math', 'Words', 'Memory', 'Logic', 'Spatial & Grid', 'Challenge'];
  const userFavs = user?.favoriteGameTypes || [];

  const filteredPuzzles = PUZZLE_MODES.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (favoritesOnly && !userFavs.includes(p.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Games"
        description="Choose any of the 16 puzzles and jump right in."
        action={
          <div className="flex flex-wrap items-center gap-1 bg-[#1C2D3B] p-1 rounded-lg border border-[#36515F]">
            <button
              onClick={() => setManualDifficulty('auto')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                manualDifficulty === 'auto'
                  ? 'bg-[#38C6BA] text-[#142331]'
                  : 'text-[#B4C3CE] hover:text-[#F5F7F8]'
              }`}
            >
              Auto
            </button>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setManualDifficulty(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                  manualDifficulty === d
                    ? 'bg-[#2C4654] text-[#F5F7F8] border border-[#4A6A7B]'
                    : 'text-[#B4C3CE] hover:text-[#F5F7F8]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        }
      />

      {/* Category Filter Pills & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => {
            const count =
              cat === 'All'
                ? PUZZLE_MODES.length
                : PUZZLE_MODES.filter((m) => m.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-[#38C6BA] text-[#142331]'
                    : 'bg-[#1C2D3B] text-[#B4C3CE] hover:text-[#F5F7F8] hover:bg-[#233D4A] border border-[#36515F]'
                }`}
              >
                <span>{cat === 'Spatial & Grid' ? 'Spatial' : cat}</span>
                <span
                  className={`text-[11px] font-tabular ${
                    selectedCategory === cat ? 'text-[#142331]/80' : 'text-[#98AAB8]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-[#98AAB8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              aria-label="Filter puzzles"
              className="w-full h-9 pl-9 pr-3 bg-[#1C2D3B] border border-[#36515F] rounded-lg text-xs text-[#F5F7F8] placeholder-[#98AAB8] focus:outline-none focus:border-[#38C6BA]"
            />
          </div>
          {userFavs.length > 0 && (
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`h-9 px-3 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors ${
                favoritesOnly
                  ? 'bg-[#38C6BA]/20 border-[#38C6BA] text-[#A8E5D5]'
                  : 'bg-[#1C2D3B] border-[#36515F] text-[#B4C3CE] hover:text-[#F5F7F8]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-[#38C6BA] text-[#38C6BA]' : ''}`} />
              <span>Favorites</span>
            </button>
          )}
        </div>
      </div>

      {/* Playable Game Collection Grid (2 columns mobile -> 3/4 columns desktop) */}
      {filteredPuzzles.length === 0 ? (
        <Card padding="lg" className="text-center space-y-3">
          <p className="text-sm font-semibold text-[#F5F7F8]">No games match your search.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setFavoritesOnly(false);
            }}
          >
            Show all games
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredPuzzles.map((p) => {
            const pb = user?.personalBests?.[p.id];
            const recDiff = getRecommendedDifficulty(p.id);
            const activeDifficulty = manualDifficulty === 'auto' ? recDiff : manualDifficulty;
            const catStyle = PUZZLE_CATEGORY_ACCENT[p.category];
            const isFav = userFavs.includes(p.id);

            return (
              <Card
                key={p.id}
                surface="ivory"
                padding="none"
                className="flex flex-col justify-between overflow-hidden hover:border-[#087F8C] transition-colors"
              >
                <div>
                  <div className="h-24 sm:h-28 border-b border-[#D5DEDB] relative overflow-hidden bg-[#E9EEE8]">
                    <PuzzleCoverArt type={p.id} variant="light" />
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                          catStyle?.badgeLight || 'bg-white text-[#142331] border-[#C3D0CB]'
                        }`}
                      >
                        {p.category === 'Spatial & Grid' ? 'Spatial' : p.category}
                      </span>
                      {isFav && <Heart className="w-3.5 h-3.5 fill-[#087F8C] text-[#087F8C] shrink-0" />}
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 pb-2">
                    <h3 className="text-[14px] sm:text-[16px] font-bold text-[#142331] truncate">
                      {p.name}
                    </h3>
                    <p className="text-xs text-[#526575] leading-snug line-clamp-2 mt-1 hidden sm:block">
                      {p.description}
                    </p>
                    {pb && pb.bestScore > 0 && (
                      <p className="text-[11px] font-semibold text-[#066B75] mt-1.5 font-tabular">
                        Best: {pb.bestScore} pts
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 flex items-center gap-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => playGame(p.id, activeDifficulty)}
                    className="flex-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </Button>
                  <button
                    onClick={() => viewPuzzleGuide(p.id)}
                    aria-label={`${p.name} guide`}
                    title="How to play"
                    className="h-9 w-9 shrink-0 rounded-lg border border-[#C3D0CB] bg-[#E9EEE8] hover:bg-[#DCE4DF] text-[#142331] hidden sm:flex items-center justify-center transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
