import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchCommunityPuzzles, createCommunityPuzzle } from '../services/firebase';
import { CommunityPuzzle, PuzzleType } from '../types';
import { Plus, Play, Heart, X, Layers } from 'lucide-react';
import { PageHeader, Card } from '../components/ui/Card';

export const CommunityPuzzlesPage: React.FC = () => {
  const { user, playGame } = useStore();
  const [puzzles, setPuzzles] = useState<CommunityPuzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [puzzleType, setPuzzleType] = useState<PuzzleType>('number');

  useEffect(() => {
    loadPuzzles();
  }, []);

  const loadPuzzles = async () => {
    setLoading(true);
    try {
      const data = await fetchCommunityPuzzles();
      setPuzzles(data);
    } catch (err) {
      console.error('Failed to load community puzzles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    await createCommunityPuzzle({
      creatorId: user.uid,
      creatorName: user.displayName,
      title,
      description,
      puzzleType,
      puzzleData: JSON.stringify({ customSeed: Math.random() }),
      difficulty: 'medium',
      status: 'published',
      plays: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
    });
    setTitle('');
    setDescription('');
    setShowCreator(false);
    loadPuzzles();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Community Levels"
        description="Browse player-crafted puzzle configurations or publish your own custom layout."
        action={
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="h-9 px-4 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
          >
            {showCreator ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showCreator ? 'Cancel' : 'Create Level'}</span>
          </button>
        }
      />

      {/* Creator Form */}
      {showCreator && (
        <Card className="p-6 space-y-4 border-[#38C6BA]/40">
          <div className="flex items-center justify-between border-b border-pv-border pb-3">
            <h3 className="text-sm font-semibold text-pv-text-primary">Publish New Level</h3>
          </div>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                Puzzle Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sequential Matrix Challenge"
                required
                className="w-full bg-pv-surface-secondary border border-pv-border text-pv-text-primary px-3 h-9 rounded-lg text-xs focus:outline-none focus:border-[#38C6BA] placeholder-pv-text-muted"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of puzzle rules or layout..."
                className="w-full bg-pv-surface-secondary border border-pv-border text-pv-text-primary px-3 h-9 rounded-lg text-xs focus:outline-none focus:border-[#38C6BA] placeholder-pv-text-muted"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                Puzzle Mode
              </label>
              <select
                value={puzzleType}
                onChange={(e) => setPuzzleType(e.target.value as PuzzleType)}
                className="w-full bg-pv-surface-secondary border border-pv-border text-pv-text-primary px-3 h-9 rounded-lg text-xs focus:outline-none focus:border-[#38C6BA]"
              >
                <option value="number">Number Puzzle</option>
                <option value="word">Word Puzzle</option>
                <option value="memory">Memory Puzzle</option>
                <option value="sliding">Sliding Puzzle</option>
                <option value="laser_mirror">Laser Mirror</option>
              </select>
            </div>
            <div className="pt-1">
              <button
                type="submit"
                className="h-9 px-5 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs font-medium rounded-lg transition-colors"
              >
                Publish Level
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Level Cards Grid */}
      {loading ? (
        <Card className="py-16 text-center">
          <div className="w-6 h-6 border-2 border-[#38C6BA] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-pv-text-secondary font-medium">Loading community levels...</p>
        </Card>
      ) : puzzles.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-pv-surface-secondary rounded-lg flex items-center justify-center text-pv-text-muted mx-auto border border-pv-border">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-pv-text-primary">No community levels published yet</h3>
          <p className="text-xs text-pv-text-secondary max-w-sm mx-auto">
            Be the first creator to design and publish a custom level for players to test.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setShowCreator(true)}
              className="h-9 px-4 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Level</span>
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {puzzles.map((p) => (
            <Card key={p.id} className="p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-[#38C6BA] font-mono">
                    By {p.creatorName}
                  </span>
                  <div className="flex items-center gap-1 text-pv-text-muted text-xs">
                    <Heart className="w-3.5 h-3.5 text-[#38C6BA]" />
                    <span className="font-tabular text-[11px]">{p.likes || 0}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-pv-text-primary text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-pv-text-secondary line-clamp-2">
                  {p.description || 'Custom player level challenge.'}
                </p>
              </div>

              <button
                onClick={() => playGame(p.puzzleType, 'medium')}
                className="w-full h-8 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3 h-3 fill-current" /> Play Level
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
