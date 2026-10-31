import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunityPuzzles, getMyCommunityPuzzles } from '../../services/communityService';
import type { CommunityPuzzleData } from '../../services/communityService';
import { useAuthStore } from '../../store/useAuthStore';
import { Search, Filter, Star, Play, Sparkles, TrendingUp, Plus, Gamepad2, ChevronRight, X } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export const CommunityPuzzlesList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [allPuzzles, setAllPuzzles] = useState<CommunityPuzzleData[]>([]);
  const [myPuzzles, setMyPuzzles] = useState<CommunityPuzzleData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating'>('newest');

  useEffect(() => {
    const fetchPuzzles = async () => {
      try {
        const [pub, mine] = await Promise.all([
          getCommunityPuzzles({ status: 'published', limitCount: 200 }),
          user ? getMyCommunityPuzzles(user.uid) : Promise.resolve([])
        ]);
        setAllPuzzles(pub);
        setMyPuzzles(mine);
      } catch (err) {
        console.error("Failed to fetch community puzzles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPuzzles();
  }, [user]);

  // Derived sections
  const topRated = useMemo(() => {
    return [...allPuzzles]
      .filter(p => (p.ratingCount || 0) > 0)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 5);
  }, [allPuzzles]);

  const mostPlayed = useMemo(() => {
    return [...allPuzzles]
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5);
  }, [allPuzzles]);

  const newAndTrending = useMemo(() => {
    return [...allPuzzles].slice(0, 5);
  }, [allPuzzles]);

  const filteredPuzzles = useMemo(() => {
    return allPuzzles.filter(p => {
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.creatorName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedType !== 'ALL' && p.gameType !== selectedType) return false;
      if (selectedDifficulty !== 'ALL' && p.difficulty !== selectedDifficulty) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return (b.publishedAt?.toMillis?.() || 0) - (a.publishedAt?.toMillis?.() || 0);
      if (sortBy === 'popular') return b.playCount - a.playCount;
      if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
      return 0;
    });
  }, [allPuzzles, searchQuery, selectedType, selectedDifficulty, sortBy]);

  const PuzzleCard = ({ p, isMine = false }: { p: CommunityPuzzleData, isMine?: boolean }) => (
    <div 
      key={p.id} 
      className="bg-surface rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all border border-border cursor-pointer group flex flex-col h-full"
      onClick={() => navigate(`/community/${p.id}`)}
    >
      <div className="h-1.5 bg-gradient-to-r from-accent to-accent/50 w-full group-hover:h-2 transition-all"></div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-textMain truncate group-hover:text-accent transition-colors pr-2" title={p.title}>
            {p.title}
          </h3>
          {p.averageRating ? (
            <div className="flex items-center gap-1 text-sm font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              {p.averageRating.toFixed(1)}
            </div>
          ) : (
            <div className="text-xs text-textMuted bg-white/5 px-2 py-1 rounded-full shrink-0">New</div>
          )}
        </div>
        
        <div className="text-xs text-textMuted mb-3">
          By <span className="font-bold text-textMain/80">{p.creatorName}</span>
        </div>
        
        <p className="text-textMuted mb-4 line-clamp-2 text-sm flex-1">{p.description}</p>
        
        <div className="flex flex-wrap gap-2 text-[10px] font-bold mb-4 uppercase tracking-wider">
          <span className="px-2.5 py-1 bg-white/5 border border-border/50 rounded-md text-textMain">
            {p.gameType}
          </span>
          <span className="px-2.5 py-1 bg-white/5 border border-border/50 rounded-md text-textMain">
            {p.difficulty}
          </span>
          {isMine && (
             <span className={`px-2.5 py-1 border border-border/50 rounded-md ${p.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
               {p.status}
             </span>
          )}
        </div>

        <div className="pt-4 border-t border-border/50 flex justify-between items-center text-xs text-textMuted font-medium mt-auto">
          <span className="flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" />
            {p.playCount} {p.playCount === 1 ? 'play' : 'plays'}
          </span>
          <span className="text-accent group-hover:underline flex items-center gap-1">
             {isMine ? 'Manage' : 'Play Now'} <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );

  const HorizontalScrollSection = ({ title, icon: Icon, puzzles }: { title: string, icon: any, puzzles: CommunityPuzzleData[] }) => {
    if (puzzles.length === 0) return null;
    return (
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-xl font-bold text-textMain mb-4 flex items-center gap-2">
          <Icon className="w-5 h-5 text-accent" /> {title}
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
          {puzzles.map(p => (
            <div key={p.id} className="min-w-[280px] max-w-[280px] sm:min-w-[320px] sm:max-w-[320px] snap-start">
              <PuzzleCard p={p} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-textMain tracking-tight">Community Hub</h1>
          <p className="text-textMuted mt-1 text-sm sm:text-base">Discover, play, and rate puzzles created by players.</p>
        </div>
        <button 
          onClick={() => navigate('/create-puzzle')}
          className="bg-accent text-background px-5 py-2.5 rounded-xl font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" /> Create Puzzle
        </button>
      </div>

      {/* Discovery Sections */}
      {!searchQuery && selectedType === 'ALL' && selectedDifficulty === 'ALL' && (
        <>
          <HorizontalScrollSection title="Top Rated" icon={Star} puzzles={topRated} />
          <HorizontalScrollSection title="Most Played" icon={TrendingUp} puzzles={mostPlayed} />
          <HorizontalScrollSection title="New & Trending" icon={Sparkles} puzzles={newAndTrending} />
        </>
      )}

      {/* Main Browse Section */}
      <div className="mt-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
          <h2 className="text-2xl font-bold text-textMain flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-primary" /> Browse All
          </h2>
          
          <div className="w-full md:w-auto flex flex-wrap gap-3">
             <div className="relative flex-1 md:min-w-[200px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
               <input 
                 type="text"
                 placeholder="Search puzzles..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-textMain placeholder:text-textMuted focus:border-accent outline-none"
               />
               {searchQuery && (
                 <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain">
                   <X className="w-3.5 h-3.5" />
                 </button>
               )}
             </div>
             
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-surface border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-textMain focus:border-accent outline-none appearance-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="NUMBER">Number</option>
                  <option value="WORD">Word</option>
                  <option value="MEMORY">Memory</option>
                  <option value="LOGIC">Logic</option>
                  <option value="PATTERN">Pattern</option>
                  <option value="SLIDING">Sliding</option>
                </select>
             </div>

             <select 
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-surface border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:border-accent outline-none appearance-none"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="EXPERT">Expert</option>
              </select>

              <select 
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-surface border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:border-accent outline-none appearance-none"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Played</option>
                <option value="rating">Highest Rated</option>
              </select>
          </div>
        </div>

        {filteredPuzzles.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-border rounded-2xl">
            <Search className="w-10 h-10 text-textMuted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-textMain mb-1">No puzzles found</h3>
            <p className="text-sm text-textMuted">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPuzzles.map(p => (
              <PuzzleCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
      
      {/* My Creations */}
      {user && myPuzzles.length > 0 && (
        <div className="mt-16 pt-8 border-t border-border/50">
          <h2 className="text-2xl font-bold text-textMain mb-6 flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-primary" /> My Creations
          </h2>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {myPuzzles.map(p => (
              <PuzzleCard key={p.id} p={p} isMine={true} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

// Quick mock for UserIcon since it's not imported at top
const UserIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
