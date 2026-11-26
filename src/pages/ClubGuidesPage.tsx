import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  BookOpen,
  Search,
  Plus,
  Award,
  Sparkles,
  Heart,
  Bookmark,
  Eye,
  ArrowLeft,
  X,
  Trash2,
  Play,
} from 'lucide-react';
import { Club, ClubGuide, ClubGuideCategory, PuzzleType, Difficulty } from '../types';
import {
  fetchClubById,
  fetchClubGuides,
  createClubGuide,
  toggleLikeGuide,
  toggleBookmarkGuide,
  incrementGuideViewCount,
  deleteClubGuide,
} from '../services/firebase';
import { Card, PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ClubGuidesPage: React.FC = () => {
  const { user, selectedClubId, viewClubDetail, playGame, setActiveTab } = useStore();
  const [club, setClub] = useState<Club | null>(null);
  const [guides, setGuides] = useState<ClubGuide[]>([]);
  const [loading, setLoading] = useState(true);

  /* Search & Filters */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClubGuideCategory | 'all'>('all');
  const [selectedPuzzleType, setSelectedPuzzleType] = useState<PuzzleType | 'all'>('all');
  const [tabFilter, setTabFilter] = useState<'all' | 'official' | 'featured' | 'my'>('all');

  /* Modals */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<ClubGuide | null>(null);

  /* New Guide Form */
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ClubGuideCategory>('strategy');
  const [newPuzzleType, setNewPuzzleType] = useState<PuzzleType | 'all'>('all');
  const [newDifficulty, setNewDifficulty] = useState<Difficulty | 'all'>('all');
  const [newIsOfficial, setNewIsOfficial] = useState(false);
  const [newIsFeatured, setNewIsFeatured] = useState(false);

  useEffect(() => {
    if (selectedClubId) {
      loadData(selectedClubId);
    }
  }, [selectedClubId]);

  const loadData = async (cId: string) => {
    setLoading(true);
    try {
      const fetchedClub = await fetchClubById(cId);
      setClub(fetchedClub);
      const list = await fetchClubGuides(cId);
      setGuides(list);
    } catch (err) {
      console.error('Error loading club guides:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGuide = async (guide: ClubGuide) => {
    setSelectedGuide(guide);
    if (!club) return;
    await incrementGuideViewCount(club.id, guide.id);
    setGuides((prev) =>
      prev.map((g) => (g.id === guide.id ? { ...g, viewsCount: g.viewsCount + 1 } : g))
    );
  };

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !club || !newTitle.trim() || !newSummary.trim() || !newContent.trim()) return;

    const isUserOwnerOrAdmin =
      club.ownerUid === user.uid || (club.adminUids && club.adminUids.includes(user.uid));

    const createdId = await createClubGuide(club.id, {
      clubId: club.id,
      title: newTitle.trim(),
      summary: newSummary.trim(),
      content: newContent.trim(),
      authorId: user.uid,
      authorName: user.displayName || user.username || 'Anonymous',
      authorAvatar: user.avatarUrl || '',
      authorRole: isUserOwnerOrAdmin ? (club.ownerUid === user.uid ? 'OWNER' : 'ADMIN') : 'MEMBER',
      category: newCategory,
      puzzleType: newPuzzleType,
      difficultyLevel: newDifficulty,
      isOfficial: isUserOwnerOrAdmin ? newIsOfficial : false,
      isFeatured: isUserOwnerOrAdmin ? newIsFeatured : false,
    });

    if (createdId) {
      const refreshed = await fetchClubGuides(club.id);
      setGuides(refreshed);
      setShowCreateModal(false);
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      setNewCategory('strategy');
      setNewPuzzleType('all');
      setNewDifficulty('all');
      setNewIsOfficial(false);
      setNewIsFeatured(false);
    }
  };

  const handleToggleLike = async (guideId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user || !club) return;
    await toggleLikeGuide(club.id, guideId, user.uid);
    setGuides((prev) =>
      prev.map((g) => {
        if (g.id === guideId) {
          const hasLiked = g.likedBy.includes(user.uid);
          const newLikedBy = hasLiked
            ? g.likedBy.filter((id) => id !== user.uid)
            : [...g.likedBy, user.uid];
          return { ...g, likedBy: newLikedBy, likesCount: newLikedBy.length };
        }
        return g;
      })
    );

    if (selectedGuide && selectedGuide.id === guideId) {
      setSelectedGuide((prev) => {
        if (!prev) return null;
        const hasLiked = prev.likedBy.includes(user.uid);
        const newLikedBy = hasLiked
          ? prev.likedBy.filter((id) => id !== user.uid)
          : [...prev.likedBy, user.uid];
        return { ...prev, likedBy: newLikedBy, likesCount: newLikedBy.length };
      });
    }
  };

  const handleToggleBookmark = async (guideId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user || !club) return;
    await toggleBookmarkGuide(club.id, guideId, user.uid);
    setGuides((prev) =>
      prev.map((g) => {
        if (g.id === guideId) {
          const bBy = g.bookmarkedBy || [];
          const hasBookmarked = bBy.includes(user.uid);
          const newBBy = hasBookmarked
            ? bBy.filter((id) => id !== user.uid)
            : [...bBy, user.uid];
          return { ...g, bookmarkedBy: newBBy, bookmarksCount: newBBy.length };
        }
        return g;
      })
    );

    if (selectedGuide && selectedGuide.id === guideId) {
      setSelectedGuide((prev) => {
        if (!prev) return null;
        const bBy = prev.bookmarkedBy || [];
        const hasBookmarked = bBy.includes(user.uid);
        const newBBy = hasBookmarked
          ? bBy.filter((id) => id !== user.uid)
          : [...bBy, user.uid];
        return { ...prev, bookmarkedBy: newBBy, bookmarksCount: newBBy.length };
      });
    }
  };

  const handleDeleteGuide = async (guide: ClubGuide) => {
    if (!user || !club) return;
    const isOwnerOrAdmin =
      club.ownerUid === user.uid || (club.adminUids && club.adminUids.includes(user.uid));
    const isAuthor = guide.authorId === user.uid;
    if (!isOwnerOrAdmin && !isAuthor) return;

    if (!window.confirm('Delete this community guide?')) return;
    await deleteClubGuide(club.id, guide.id);
    setGuides((prev) => prev.filter((g) => g.id !== guide.id));
    if (selectedGuide && selectedGuide.id === guide.id) {
      setSelectedGuide(null);
    }
  };

  const filteredGuides = guides.filter((g) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchSummary = g.summary.toLowerCase().includes(q);
      const matchContent = g.content.toLowerCase().includes(q);
      const matchAuthor = g.authorName.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchContent && !matchAuthor) return false;
    }
    if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;
    if (selectedPuzzleType !== 'all' && g.puzzleType !== selectedPuzzleType) return false;
    if (tabFilter === 'official' && !g.isOfficial) return false;
    if (tabFilter === 'featured' && !g.isFeatured) return false;
    if (tabFilter === 'my' && g.authorId !== user?.uid) return false;
    return true;
  });

  const isOwnerOrAdmin =
    user && club
      ? club.ownerUid === user.uid || (club.adminUids && club.adminUids.includes(user.uid))
      : false;

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-12">
        <div className="h-32 bg-pv-surface-soft border border-pv-border rounded-lg animate-pulse" />
        <div className="h-64 bg-pv-surface-soft border border-pv-border rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!club) {
    return (
      <Card className="text-center py-16 space-y-4 max-w-md mx-auto">
        <p className="text-pv-text-muted text-sm">Club not found.</p>
        <Button onClick={() => setActiveTab('clubs')} variant="secondary" size="sm">
          Back to Clubs Hub
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Back Nav */}
      <div>
        <button
          onClick={() => viewClubDetail(club.id)}
          className="inline-flex items-center gap-1.5 text-xs text-pv-text-muted hover:text-pv-text-primary transition-colors font-medium mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {club.name}
        </button>
        <PageHeader
          title="Club Guides"
          description="Official manuals, solving pattern breakdowns, and community training resources."
          action={
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Guide</span>
            </Button>
          }
        />
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-pv-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, patterns, techniques..."
              className="w-full bg-pv-surface-soft border border-pv-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-pv-surface-soft p-1 rounded border border-pv-border w-full sm:w-auto justify-center">
            <button
              onClick={() => setTabFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                tabFilter === 'all'
                  ? 'bg-pv-dragon-fruit text-[#110F15] font-semibold'
                  : 'text-pv-text-muted hover:text-pv-text-primary'
              }`}
            >
              All Guides
            </button>
            <button
              onClick={() => setTabFilter('official')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                tabFilter === 'official'
                  ? 'bg-pv-dragon-fruit text-[#110F15] font-semibold'
                  : 'text-pv-text-muted hover:text-pv-text-primary'
              }`}
            >
              <Award className="w-3 h-3" /> Official
            </button>
            <button
              onClick={() => setTabFilter('featured')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                tabFilter === 'featured'
                  ? 'bg-pv-dragon-fruit text-[#110F15] font-semibold'
                  : 'text-pv-text-muted hover:text-pv-text-primary'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Featured
            </button>
            <button
              onClick={() => setTabFilter('my')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                tabFilter === 'my'
                  ? 'bg-pv-dragon-fruit text-[#110F15] font-semibold'
                  : 'text-pv-text-muted hover:text-pv-text-primary'
              }`}
            >
              My Guides
            </button>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="bg-pv-surface-soft border border-pv-border text-xs text-pv-text-secondary rounded-lg px-3 py-1.5 focus:outline-none focus:border-pv-border-hover capitalize"
          >
            <option value="all">All Categories</option>
            <option value="strategy">Strategy Guides</option>
            <option value="pattern">Pattern Recognition</option>
            <option value="speed">Speed & Efficiency</option>
            <option value="beginner">Beginner Tips</option>
            <option value="game_specific">Game Specific</option>
            <option value="training">Club Training</option>
          </select>

          <select
            value={selectedPuzzleType}
            onChange={(e) => setSelectedPuzzleType(e.target.value as any)}
            className="bg-pv-surface-soft border border-pv-border text-xs text-pv-text-secondary rounded-lg px-3 py-1.5 focus:outline-none focus:border-pv-border-hover capitalize"
          >
            <option value="all">All Game Types</option>
            <option value="logic">Logic Puzzle</option>
            <option value="number">Number Puzzle</option>
            <option value="pattern">Pattern Matching</option>
            <option value="pipe">Pipe Connect</option>
            <option value="laser_mirror">Laser Mirror</option>
            <option value="arrow_path">Arrow Path</option>
            <option value="block_escape">Block Escape</option>
            <option value="sliding">Sliding Puzzle</option>
            <option value="word">Word Puzzle</option>
          </select>
        </div>
      </Card>

      {/* Guide Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGuides.length === 0 ? (
          <Card className="col-span-full text-center py-12 p-6 space-y-2">
            <BookOpen className="w-8 h-8 text-pv-text-muted mx-auto mb-1" />
            <p className="text-sm font-semibold text-pv-text-primary">No guides match your filter.</p>
            <p className="text-xs text-pv-text-muted">
              Author a guide or pattern tutorial for your club members.
            </p>
          </Card>
        ) : (
          filteredGuides.map((guide) => {
            const hasLiked = user ? guide.likedBy.includes(user.uid) : false;
            const hasBookmarked =
              user && guide.bookmarkedBy ? guide.bookmarkedBy.includes(user.uid) : false;

            return (
              <Card
                key={guide.id}
                onClick={() => handleOpenGuide(guide)}
                className={`p-5 flex flex-col justify-between space-y-4 cursor-pointer hover:border-pv-border-hover transition-colors ${
                  guide.isOfficial ? 'border-amber-400/30' : ''
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {guide.isOfficial && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        <Award className="w-3 h-3" /> OFFICIAL
                      </span>
                    )}
                    {guide.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-pv-dragon-fruit/10 text-pv-dragon-fruit border border-pv-dragon-fruit/20">
                        <Sparkles className="w-2.5 h-2.5" /> FEATURED
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pv-surface-soft text-pv-text-muted border border-pv-border capitalize">
                      {guide.category.replace('_', ' ')}
                    </span>
                    {guide.puzzleType && guide.puzzleType !== 'all' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pv-surface-soft text-emerald-400 border border-emerald-500/20 uppercase">
                        {guide.puzzleType.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-pv-text-primary hover:text-pv-dragon-fruit transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-pv-text-secondary line-clamp-3 leading-relaxed">
                    {guide.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-pv-border flex items-center justify-between text-xs text-pv-text-muted">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-pv-text-secondary">{guide.authorName}</span>
                  </div>
                  <div className="flex items-center gap-3 font-tabular">
                    <button
                      onClick={(e) => handleToggleLike(guide.id, e)}
                      className={`inline-flex items-center gap-1 text-xs transition-colors ${
                        hasLiked ? 'text-rose-400 font-semibold' : 'hover:text-pv-text-primary'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                      <span>{guide.likesCount}</span>
                    </button>
                    <button
                      onClick={(e) => handleToggleBookmark(guide.id, e)}
                      className={`inline-flex items-center gap-1 text-xs transition-colors ${
                        hasBookmarked
                          ? 'text-pv-dragon-fruit font-semibold'
                          : 'hover:text-pv-text-primary'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${hasBookmarked ? 'fill-current' : ''}`} />
                    </button>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{guide.viewsCount}</span>
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* CREATE GUIDE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-xl w-full my-6 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-pv-border pb-3">
              <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-pv-dragon-fruit" />
                <span>Publish a Community Guide</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-pv-text-muted hover:text-pv-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGuide} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                  Guide Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Laser Mirror: Visual Parity Rules"
                  className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                  Summary *
                </label>
                <input
                  type="text"
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="1-2 sentences on what players will learn..."
                  className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ClubGuideCategory)}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover capitalize"
                  >
                    <option value="strategy">Strategy</option>
                    <option value="pattern">Pattern Recognition</option>
                    <option value="speed">Speed & Efficiency</option>
                    <option value="beginner">Beginner Tips</option>
                    <option value="game_specific">Game Specific</option>
                    <option value="training">Club Training</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                    Game Focus
                  </label>
                  <select
                    value={newPuzzleType}
                    onChange={(e) => setNewPuzzleType(e.target.value as PuzzleType | 'all')}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover capitalize"
                  >
                    <option value="all">All Games</option>
                    <option value="logic">Logic Puzzle</option>
                    <option value="number">Number Puzzle</option>
                    <option value="pattern">Pattern Matching</option>
                    <option value="pipe">Pipe Connect</option>
                    <option value="laser_mirror">Laser Mirror</option>
                    <option value="arrow_path">Arrow Path</option>
                    <option value="block_escape">Block Escape</option>
                    <option value="sliding">Sliding Puzzle</option>
                    <option value="word">Word Puzzle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                    Target Level
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as Difficulty | 'all')}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover capitalize"
                  >
                    <option value="all">All Levels</option>
                    <option value="easy">Beginner</option>
                    <option value="medium">Intermediate</option>
                    <option value="hard">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                  Step-by-Step Instructions *
                </label>
                <textarea
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write clear instructions, rules, and pattern recognition tactics..."
                  className="w-full bg-pv-surface-soft border border-pv-border rounded-lg p-3 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover leading-relaxed"
                />
              </div>

              {isOwnerOrAdmin && (
                <div className="flex items-center gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-pv-text-secondary">
                    <input
                      type="checkbox"
                      checked={newIsOfficial}
                      onChange={(e) => setNewIsOfficial(e.target.checked)}
                      className="rounded border-pv-border bg-pv-surface-soft text-pv-dragon-fruit"
                    />
                    Official Club Resource
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-pv-text-secondary">
                    <input
                      type="checkbox"
                      checked={newIsFeatured}
                      onChange={(e) => setNewIsFeatured(e.target.checked)}
                      className="rounded border-pv-border bg-pv-surface-soft text-pv-dragon-fruit"
                    />
                    Feature on Club Hub
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-pv-border">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Publish Guide
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* GUIDE READING MODAL */}
      {selectedGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full my-8 p-6 space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-pv-border pb-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedGuide.isOfficial && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      <Award className="w-3 h-3" /> OFFICIAL
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pv-surface-soft text-pv-text-muted border border-pv-border capitalize">
                    {selectedGuide.category.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-base font-bold text-pv-text-primary">{selectedGuide.title}</h2>
                <div className="flex items-center gap-2 text-xs text-pv-text-muted pt-0.5">
                  <span className="font-medium text-pv-text-secondary">{selectedGuide.authorName}</span>
                  <span>•</span>
                  <span className="font-tabular">{new Date(selectedGuide.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedGuide(null)}
                className="text-pv-text-muted hover:text-pv-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="p-3 bg-pv-surface-soft border-l-2 border-pv-dragon-fruit rounded-r text-xs text-pv-text-secondary italic">
                "{selectedGuide.summary}"
              </div>

              {selectedGuide.puzzleType && selectedGuide.puzzleType !== 'all' && (
                <div className="flex items-center justify-between bg-pv-surface-soft border border-pv-border rounded-lg p-3">
                  <div>
                    <p className="text-xs font-semibold text-pv-text-primary">
                      Practice Target: {selectedGuide.puzzleType.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-[11px] text-pv-text-muted">
                      Launch a puzzle match to put these tactics into immediate practice.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      playGame(selectedGuide.puzzleType as PuzzleType);
                    }}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Practice Game</span>
                  </Button>
                </div>
              )}

              <div className="bg-pv-surface-soft border border-pv-border rounded-lg p-4 text-xs text-pv-text-secondary leading-relaxed whitespace-pre-line space-y-3">
                {selectedGuide.content}
              </div>
            </div>

            <div className="pt-3 border-t border-pv-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleLike(selectedGuide.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    user && selectedGuide.likedBy.includes(user.uid)
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-pv-surface-soft border-pv-border text-pv-text-muted hover:text-pv-text-primary'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      user && selectedGuide.likedBy.includes(user.uid) ? 'fill-current' : ''
                    }`}
                  />
                  <span className="font-tabular">Like ({selectedGuide.likesCount})</span>
                </button>
                <button
                  onClick={() => handleToggleBookmark(selectedGuide.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    user && selectedGuide.bookmarkedBy?.includes(user.uid)
                      ? 'bg-pv-dragon-fruit/10 border-pv-dragon-fruit/20 text-pv-dragon-fruit'
                      : 'bg-pv-surface-soft border-pv-border text-pv-text-muted hover:text-pv-text-primary'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      user && selectedGuide.bookmarkedBy?.includes(user.uid) ? 'fill-current' : ''
                    }`}
                  />
                  <span>Bookmark</span>
                </button>
              </div>

              {(isOwnerOrAdmin || (user && selectedGuide.authorId === user.uid)) && (
                <button
                  onClick={() => handleDeleteGuide(selectedGuide)}
                  className="px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Guide</span>
                </button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
