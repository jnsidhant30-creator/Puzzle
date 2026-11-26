import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PUZZLE_MODES } from '../data/puzzles';
import { Difficulty } from '../types';
import { BookOpen, Search, Heart, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, PageHeader, Badge } from '../components/ui/Card';
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

  // Spotlight the first filtered puzzle (e.g. category lead) when unfiltered
  const spotlightPuzzle = !searchQuery.trim() && !favoritesOnly ? filteredPuzzles[0] : null;
  const spotlightDiff = spotlightPuzzle
    ? manualDifficulty === 'auto'
      ? getRecommendedDifficulty(spotlightPuzzle.id)
      : manualDifficulty
    : 'medium';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Puzzle Library"
        description="Browse all 16 logic, word, memory, and spatial disciplines."
        action={
          <div className="flex flex-wrap items-center gap-1 bg-[#16131C] p-1 rounded-lg border border-[#342D3D]">
            <button
              onClick={() => setManualDifficulty('auto')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                manualDifficulty === 'auto'
                  ? 'bg-[#FF4696] text-[#110F15] font-semibold'
                  : 'text-[#C5BFD0] hover:text-[#F5F3F7]'
              }`}
            >
              Auto
            </button>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setManualDifficulty(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  manualDifficulty === d
                    ? 'bg-[#24202C] text-[#F5F3F7] border border-[#494052]'
                    : 'text-[#C5BFD0] hover:text-[#F5F3F7]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        }
      />

      {/* Storefront Spotlight Banner */}
      {spotlightPuzzle && (
        <Card
          surface="featured"
          padding="none"
          className="border-[#494052] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="accent">Category Spotlight</Badge>
                <Badge variant="neutral">{spotlightPuzzle.category}</Badge>
                <Badge variant="neutral" className="capitalize">{spotlightDiff}</Badge>
              </div>
              <h2 className="text-xl font-semibold text-[#F5F3F7] tracking-tight">
                {spotlightPuzzle.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#C5BFD0] max-w-xl leading-relaxed">
                {spotlightPuzzle.description}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="primary"
                size="md"
                onClick={() => playGame(spotlightPuzzle.id, spotlightDiff)}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play {spotlightPuzzle.name}</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => viewPuzzleGuide(spotlightPuzzle.id)}
              >
                <BookOpen className="w-4 h-4" />
                <span>Rules &amp; tactics</span>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5 bg-[#14111A] border-t lg:border-t-0 lg:border-l border-[#342D3D] h-40 lg:h-auto">
            <PuzzleCoverArt type={spotlightPuzzle.id} />
          </div>
        </Card>
      )}

      {/* Search & Filter Bar */}
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-[#24202C] text-[#F5F3F7] border border-[#494052]'
                    : 'text-[#9F97AB] hover:text-[#F5F3F7] hover:bg-[#1C1823] border border-transparent'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] font-mono text-[#756C82]">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-[#9F97AB] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter puzzles..."
              aria-label="Filter puzzles"
              className="w-full h-9 pl-9 pr-3 bg-[#1C1823] border border-[#342D3D] rounded-lg text-xs text-[#F5F3F7] placeholder-[#9F97AB] focus:outline-none focus:border-[#FF4696]"
            />
          </div>
          {userFavs.length > 0 && (
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`h-9 px-3 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition-colors ${
                favoritesOnly
                  ? 'bg-[#FF4696]/12 border-[#FF4696]/40 text-[#FF82B8]'
                  : 'bg-[#1C1823] border-[#342D3D] text-[#C5BFD0] hover:text-[#F5F3F7]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-[#FF4696] text-[#FF4696]' : ''}`} />
              <span>Favorites</span>
            </button>
          )}
        </div>
      </div>

      {/* Games Cover Art Grid */}
      {filteredPuzzles.length === 0 ? (
        <Card padding="lg" className="text-center space-y-3">
          <p className="text-sm font-medium text-[#F5F3F7]">No puzzles match your filter.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setFavoritesOnly(false);
            }}
          >
            Clear filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPuzzles.map((p) => {
            const pb = user?.personalBests?.[p.id];
            const recDiff = getRecommendedDifficulty(p.id);
            const activeDifficulty = manualDifficulty === 'auto' ? recDiff : manualDifficulty;
            const catStyle = PUZZLE_CATEGORY_ACCENT[p.category];
            const isFav = userFavs.includes(p.id);

            return (
              <Card
                key={p.id}
                padding="none"
                interactive
                className="flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Game Cover Artwork */}
                  <div className="h-28 border-b border-[#342D3D] relative overflow-hidden bg-[#14111A]">
                    <PuzzleCoverArt type={p.id} />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-medium ${
                          catStyle?.badge || 'bg-[#16131C] text-[#C5BFD0] border-[#342D3D]'
                        }`}
                      >
                        {p.category}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#110F15]/90 border border-[#342D3D] text-[10px] font-mono text-[#C5BFD0] capitalize">
                        {activeDifficulty}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-[15px] font-semibold text-[#F5F3F7] truncate">
                        {p.name}
                      </h3>
                      {isFav && <Heart className="w-3.5 h-3.5 fill-[#FF4696] text-[#FF4696] shrink-0" />}
                    </div>
                    <p className="text-xs text-[#C5BFD0] leading-relaxed line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 space-y-3">
                  <div className="pt-2.5 border-t border-[#342D3D] flex items-center justify-between text-xs">
                    <span className="text-[#9F97AB]">Best record</span>
                    <span className="font-medium text-[#F5F3F7] font-tabular">
                      {pb && pb.bestScore > 0 ? `${pb.bestScore} pts` : 'Not played'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => playGame(p.id, activeDifficulty)}
                      className="flex-1 h-9 group-hover:bg-[#FF4696] group-hover:text-[#110F15] group-hover:border-[#FF4696]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewPuzzleGuide(p.id)}
                      title="Learn rules and strategy"
                      aria-label={`Learn rules for ${p.name}`}
                      className="h-9 px-2.5"
                    >
                      <BookOpen className="w-4 h-4" />
                    </Button>
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
