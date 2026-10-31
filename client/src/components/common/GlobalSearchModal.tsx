import { useState, useEffect, useRef } from 'react';
import { Search, X, Gamepad2, User as UserIcon, Trophy, Sparkles, ChevronRight, Hash, Type, Brain, Grid3X3, Lightbulb, Shapes, Map, ScanLine, Workflow, Palette, Blocks, RotateCw, Table2, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../../store/useSearchStore';
import { usePuzzleStore } from '../../store/usePuzzleStore';
import { searchUsers } from '../../services/socialService';

export const GlobalSearchModal = () => {
  const { isOpen, closeSearch } = useSearchStore();
  const { activePuzzles } = usePuzzleStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [socialResults, setSocialResults] = useState<any[]>([]);
  const [communityResults, setCommunityResults] = useState<any[]>([]);
  const [isSearchingSocial, setIsSearchingSocial] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setSocialResults([]);
      setCommunityResults([]);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Global hotkey Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useSearchStore.getState().toggleSearch();
      }
      if (e.key === 'Escape' && useSearchStore.getState().isOpen) {
        useSearchStore.getState().closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced async search (Social & Community)
  useEffect(() => {
    if (query.trim().length >= 3) {
      setIsSearchingSocial(true);
      const timeoutId = setTimeout(async () => {
        try {
          const searchTerm = query.trim().toLowerCase();
          
          // 1. Social search
          const res = await searchUsers(searchTerm);
          setSocialResults(res.slice(0, 3)); // Max 3 users
          
          // 2. Community Search
          const { getCommunityPuzzles } = await import('../../services/communityService');
          const allPub = await getCommunityPuzzles({ status: 'published', limitCount: 200 }); // fetch top 200 to filter
          const filtered = allPub.filter(p => 
            p.title.toLowerCase().includes(searchTerm) || 
            p.description.toLowerCase().includes(searchTerm) ||
            p.creatorName.toLowerCase().includes(searchTerm)
          ).slice(0, 3);
          setCommunityResults(filtered);
          
        } catch (err) {
          console.error("Async search failed", err);
        } finally {
          setIsSearchingSocial(false);
        }
      }, 400);
      return () => clearTimeout(timeoutId);
    } else {
      setSocialResults([]);
      setCommunityResults([]);
      setIsSearchingSocial(false);
    }
  }, [query]);

  if (!isOpen) return null;

  // Local Puzzle Search
  const normalizedQuery = query.trim().toLowerCase();
  const puzzleResults = normalizedQuery ? activePuzzles.filter(p => 
    p.title.toLowerCase().includes(normalizedQuery) ||
    p.description.toLowerCase().includes(normalizedQuery) ||
    p.category?.toLowerCase().includes(normalizedQuery) ||
    p.difficulty.toLowerCase().includes(normalizedQuery)
  ).slice(0, 5) : []; // Max 5 puzzles in global search

  const handleSelectPuzzle = (route: string) => {
    closeSearch();
    navigate(route);
  };

  const handleSelectUser = (username: string) => {
    closeSearch();
    navigate(`/friends`); // Let the friends page handle viewing specific users if needed, or just route to friends.
  };

  const renderIcon = (id: string) => {
    // Map icons based on puzzle ID to keep it rich
    switch(id) {
      case 'num': return <Hash className="w-4 h-4" />;
      case 'wrd': return <Type className="w-4 h-4" />;
      case 'mem': return <Brain className="w-4 h-4" />;
      case 'sld': return <Grid3X3 className="w-4 h-4" />;
      case 'lgc': return <Lightbulb className="w-4 h-4" />;
      case 'ptr': return <Shapes className="w-4 h-4" />;
      case 'arr': return <Map className="w-4 h-4" />;
      case 'maz': return <Map className="w-4 h-4" />;
      case 'lsr': return <ScanLine className="w-4 h-4" />;
      case 'pip': return <Workflow className="w-4 h-4" />;
      case 'clr': return <Palette className="w-4 h-4" />;
      case 'blk': return <Blocks className="w-4 h-4" />;
      case 'npt': return <Workflow className="w-4 h-4" />;
      case 'rot': return <RotateCw className="w-4 h-4" />;
      case 'wgd': return <Table2 className="w-4 h-4" />;
      case 'rnd': return <Shuffle className="w-4 h-4" />;
      default: return <Gamepad2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 sm:px-0">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={closeSearch} />
      
      <div className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-border/50 bg-[#151B23]">
          <Search className="w-5 h-5 text-textMuted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search puzzles, categories, players..."
            className="flex-1 bg-transparent border-none outline-none px-4 text-textMain placeholder:text-textMuted text-lg font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded-md text-textMuted hover:text-textMain hover:bg-white/5 transition-colors mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-textMuted bg-background px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          
          {!normalizedQuery && (
            <div className="px-4 py-8 text-center flex flex-col items-center">
              <Sparkles className="w-8 h-8 text-primary/40 mb-3" />
              <p className="text-textMain font-bold">What are you looking for?</p>
              <p className="text-sm text-textMuted mt-1 max-w-[250px]">
                Search for puzzle names, types, difficulty, or even other players.
              </p>
            </div>
          )}

          {normalizedQuery && puzzleResults.length === 0 && socialResults.length === 0 && !isSearchingSocial && (
            <div className="px-4 py-8 text-center flex flex-col items-center">
              <Search className="w-8 h-8 text-textMuted/40 mb-3" />
              <p className="text-textMain font-bold">No results found</p>
              <p className="text-sm text-textMuted mt-1">We couldn't find anything matching "{query}".</p>
            </div>
          )}

          {puzzleResults.length > 0 && (
            <div className="mb-4">
              <h3 className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-textMuted flex items-center gap-2">
                <Gamepad2 className="w-3.5 h-3.5" /> Puzzles
              </h3>
              <div className="flex flex-col gap-1">
                {puzzleResults.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleSelectPuzzle(p.route)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      {renderIcon(p.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-textMain group-hover:text-primary transition-colors truncate">
                          {p.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-textMuted px-2 py-0.5 rounded bg-background border border-border">
                          {p.difficulty}
                        </span>
                      </div>
                      <span className="text-xs text-textMuted truncate block">{p.description}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-textMuted opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {communityResults.length > 0 && (
            <div className="mb-4">
              <h3 className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-textMuted flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Community Puzzles
              </h3>
              <div className="flex flex-col gap-1">
                {communityResults.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleSelectPuzzle(`/community/${p.id}`)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 border border-accent/20">
                      {renderIcon(p.gameType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-textMain group-hover:text-accent transition-colors truncate">
                          {p.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-textMuted px-2 py-0.5 rounded bg-background border border-border">
                          {p.difficulty}
                        </span>
                      </div>
                      <span className="text-xs text-textMuted truncate block">
                        By {p.creatorName} • {p.playCount} plays
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-textMuted opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {normalizedQuery.length >= 3 && (socialResults.length > 0 || isSearchingSocial) && (
            <div>
              <h3 className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-textMuted flex items-center gap-2 border-t border-border/30 pt-4">
                <UserIcon className="w-3.5 h-3.5" /> Players
              </h3>
              
              {isSearchingSocial ? (
                <div className="px-4 py-3 flex items-center gap-3 text-sm text-textMuted">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Searching players...
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {socialResults.map(user => (
                    <button 
                      key={user.uid}
                      onClick={() => handleSelectUser(user.username)}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 border border-accent/20">
                        {user.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm text-textMain truncate block">{user.displayName}</span>
                        <span className="text-xs text-textMuted truncate block">@{user.username}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-textMuted opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-[#151B23] border-t border-border/50 text-[11px] text-textMuted font-medium flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-background px-1.5 rounded border border-border">↑</kbd>
              <kbd className="font-mono bg-background px-1.5 rounded border border-border">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-background px-1.5 rounded border border-border">↵</kbd>
              Select
            </span>
          </div>
          <span>Powered by PuzzleVerse</span>
        </div>
      </div>
    </div>
  );
};
