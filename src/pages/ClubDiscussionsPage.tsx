import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  MessageSquare,
  Search,
  Plus,
  Pin,
  Megaphone,
  ThumbsUp,
  MessageCircle,
  ArrowLeft,
  X,
  Trash2,
  Play,
} from 'lucide-react';
import {
  Club,
  ClubDiscussion,
  ClubDiscussionReply,
  ClubDiscussionCategory,
  PuzzleType,
} from '../types';
import {
  fetchClubById,
  fetchClubDiscussions,
  createClubDiscussion,
  toggleUpvoteDiscussion,
  togglePinDiscussion,
  deleteClubDiscussion,
  fetchDiscussionReplies,
  addDiscussionReply,
} from '../services/firebase';
import { Card, PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ClubDiscussionsPage: React.FC = () => {
  const { user, selectedClubId, viewClubDetail, playGame, setActiveTab } = useStore();
  const [club, setClub] = useState<Club | null>(null);
  const [discussions, setDiscussions] = useState<ClubDiscussion[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filters & Search */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClubDiscussionCategory | 'all'>('all');
  const [tabFilter, setTabFilter] = useState<'recent' | 'pinned' | 'my'>('recent');

  /* Modals */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<ClubDiscussion | null>(null);
  const [replies, setReplies] = useState<ClubDiscussionReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  /* New Discussion Form */
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ClubDiscussionCategory>('strategy');
  const [newLinkedPuzzle, setNewLinkedPuzzle] = useState<PuzzleType | ''>('');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newIsAnnouncement, setNewIsAnnouncement] = useState(false);

  /* New Reply Form */
  const [newReplyContent, setNewReplyContent] = useState('');

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
      const list = await fetchClubDiscussions(cId);
      setDiscussions(list);
    } catch (err) {
      console.error('Error loading club discussions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDiscussion = async (disc: ClubDiscussion) => {
    setSelectedDiscussion(disc);
    if (!club) return;
    setLoadingReplies(true);
    try {
      const reps = await fetchDiscussionReplies(club.id, disc.id);
      setReplies(reps);
    } catch (err) {
      console.error('Error fetching replies:', err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !club || !newTitle.trim() || !newContent.trim()) return;

    const isUserOwnerOrAdmin =
      club.ownerUid === user.uid || (club.adminUids && club.adminUids.includes(user.uid));

    const createdId = await createClubDiscussion(club.id, {
      clubId: club.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      authorId: user.uid,
      authorName: user.displayName || user.username || 'Anonymous',
      authorAvatar: user.avatarUrl || '',
      authorRole: isUserOwnerOrAdmin ? (club.ownerUid === user.uid ? 'OWNER' : 'ADMIN') : 'MEMBER',
      category: newCategory,
      tags: [newCategory],
      linkedPuzzleType: newLinkedPuzzle ? (newLinkedPuzzle as PuzzleType) : undefined,
      isPinned: isUserOwnerOrAdmin ? newIsPinned : false,
      isAnnouncement: isUserOwnerOrAdmin ? newIsAnnouncement : false,
    });

    if (createdId) {
      const refreshed = await fetchClubDiscussions(club.id);
      setDiscussions(refreshed);
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory('strategy');
      setNewLinkedPuzzle('');
      setNewIsPinned(false);
      setNewIsAnnouncement(false);
    }
  };

  const handleUpvoteDiscussion = async (discId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user || !club) return;
    await toggleUpvoteDiscussion(club.id, discId, user.uid);

    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === discId) {
          const hasUpvoted = d.upvotedBy.includes(user.uid);
          const newUpvotedBy = hasUpvoted
            ? d.upvotedBy.filter((id) => id !== user.uid)
            : [...d.upvotedBy, user.uid];
          return { ...d, upvotedBy: newUpvotedBy, upvotesCount: newUpvotedBy.length };
        }
        return d;
      })
    );

    if (selectedDiscussion && selectedDiscussion.id === discId) {
      setSelectedDiscussion((prev) => {
        if (!prev) return null;
        const hasUpvoted = prev.upvotedBy.includes(user.uid);
        const newUpvotedBy = hasUpvoted
          ? prev.upvotedBy.filter((id) => id !== user.uid)
          : [...prev.upvotedBy, user.uid];
        return { ...prev, upvotedBy: newUpvotedBy, upvotesCount: newUpvotedBy.length };
      });
    }
  };

  const handleTogglePin = async (disc: ClubDiscussion) => {
    if (!user || !club) return;
    const isOwnerOrAdmin =
      club.ownerUid === user.uid || (club.adminUids && club.adminUids.includes(user.uid));
    if (!isOwnerOrAdmin) return;

    const nextState = !disc.isPinned;
    await togglePinDiscussion(club.id, disc.id, nextState);
    setDiscussions((prev) =>
      prev.map((d) => (d.id === disc.id ? { ...d, isPinned: nextState } : d))
    );
    if (selectedDiscussion && selectedDiscussion.id === disc.id) {
      setSelectedDiscussion((prev) => (prev ? { ...prev, isPinned: nextState } : null));
    }
  };

  const handleDeleteDiscussion = async (disc: ClubDiscussion) => {
    if (!user || !club) return;
    const isOwnerOrAdmin =
      club.ownerUid === user.uid || (club.adminUids && club.adminUids.includes(user.uid));
    const isAuthor = disc.authorId === user.uid;
    if (!isOwnerOrAdmin && !isAuthor) return;

    if (!window.confirm('Delete this discussion thread?')) return;
    await deleteClubDiscussion(club.id, disc.id);
    setDiscussions((prev) => prev.filter((d) => d.id !== disc.id));
    if (selectedDiscussion && selectedDiscussion.id === disc.id) {
      setSelectedDiscussion(null);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !club || !selectedDiscussion || !newReplyContent.trim()) return;

    const isUserOwnerOrAdmin =
      club.ownerUid === user.uid || (club.adminUids && club.adminUids.includes(user.uid));

    const reply = await addDiscussionReply(club.id, selectedDiscussion.id, {
      discussionId: selectedDiscussion.id,
      clubId: club.id,
      authorId: user.uid,
      authorName: user.displayName || user.username || 'Anonymous',
      authorAvatar: user.avatarUrl || '',
      authorRole: isUserOwnerOrAdmin ? (club.ownerUid === user.uid ? 'OWNER' : 'ADMIN') : 'MEMBER',
      content: newReplyContent.trim(),
    });

    if (reply) {
      setReplies((prev) => [...prev, reply]);
      setNewReplyContent('');
      setSelectedDiscussion((prev) =>
        prev ? { ...prev, replyCount: prev.replyCount + 1 } : null
      );
      setDiscussions((prev) =>
        prev.map((d) => (d.id === selectedDiscussion.id ? { ...d, replyCount: d.replyCount + 1 } : d))
      );
    }
  };

  const filteredDiscussions = discussions.filter((d) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchContent = d.content.toLowerCase().includes(q);
      const matchAuthor = d.authorName.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }
    if (selectedCategory !== 'all' && d.category !== selectedCategory) {
      return false;
    }
    if (tabFilter === 'pinned' && !d.isPinned) return false;
    if (tabFilter === 'my' && d.authorId !== user?.uid) return false;
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
          title="Club Discussions"
          description="Share solving workflows, discuss strategies, and prepare for competitions."
          action={
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Discussion</span>
            </Button>
          }
        />
      </div>

      {/* Search & Categories Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-pv-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, strategies, authors..."
              className="w-full bg-pv-surface-soft border border-pv-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-pv-surface-soft p-1 rounded border border-pv-border w-full sm:w-auto justify-center">
            <button
              onClick={() => setTabFilter('recent')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                tabFilter === 'recent'
                  ? 'bg-pv-dragon-fruit text-[#110F15] font-semibold'
                  : 'text-pv-text-muted hover:text-pv-text-primary'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setTabFilter('pinned')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                tabFilter === 'pinned'
                  ? 'bg-pv-dragon-fruit text-[#110F15] font-semibold'
                  : 'text-pv-text-muted hover:text-pv-text-primary'
              }`}
            >
              <Pin className="w-3 h-3" /> Pinned
            </button>
            <button
              onClick={() => setTabFilter('my')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                tabFilter === 'my'
                  ? 'bg-pv-dragon-fruit text-[#110F15] font-semibold'
                  : 'text-pv-text-muted hover:text-pv-text-primary'
              }`}
            >
              My Threads
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'strategy', label: 'Strategy' },
            { id: 'technique', label: 'Techniques' },
            { id: 'competition', label: 'Competition Prep' },
            { id: 'event', label: 'Events' },
            { id: 'mastery', label: 'Mastery' },
            { id: 'announcement', label: 'Announcements' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === cat.id
                  ? 'bg-pv-dragon-fruit/10 border-pv-dragon-fruit/30 text-pv-dragon-fruit'
                  : 'bg-pv-surface-soft border-pv-border text-pv-text-muted hover:text-pv-text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Discussion List */}
      <div className="space-y-3">
        {filteredDiscussions.length === 0 ? (
          <Card className="text-center py-12 p-6 space-y-2">
            <MessageSquare className="w-8 h-8 text-pv-text-muted mx-auto mb-1" />
            <p className="text-sm font-semibold text-pv-text-primary">No discussions match your filter.</p>
            <p className="text-xs text-pv-text-muted">
              Start a strategy thread or share a solving tip with your club members.
            </p>
          </Card>
        ) : (
          filteredDiscussions.map((disc) => {
            const hasUpvoted = user ? disc.upvotedBy.includes(user.uid) : false;
            return (
              <Card
                key={disc.id}
                onClick={() => handleOpenDiscussion(disc)}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-pv-border-hover transition-colors ${
                  disc.isPinned ? 'border-pv-dragon-fruit/30' : ''
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {disc.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-pv-dragon-fruit/10 text-pv-dragon-fruit border border-pv-dragon-fruit/20">
                        <Pin className="w-2.5 h-2.5" /> PINNED
                      </span>
                    )}
                    {disc.isAnnouncement && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        <Megaphone className="w-2.5 h-2.5" /> ANNOUNCEMENT
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pv-surface-soft text-pv-text-muted border border-pv-border capitalize">
                      {disc.category}
                    </span>
                    {disc.linkedPuzzleType && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pv-surface-soft text-emerald-400 border border-emerald-500/20 uppercase">
                        {disc.linkedPuzzleType.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-pv-text-primary hover:text-pv-dragon-fruit transition-colors">
                    {disc.title}
                  </h3>
                  <p className="text-xs text-pv-text-secondary line-clamp-2 leading-relaxed">
                    {disc.content}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-pv-text-muted">
                    <span className="font-medium text-pv-text-secondary">{disc.authorName}</span>
                    {disc.authorRole && disc.authorRole !== 'MEMBER' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-pv-surface-soft text-pv-dragon-fruit border border-pv-border font-semibold">
                        {disc.authorRole}
                      </span>
                    )}
                    <span>•</span>
                    <span className="font-tabular">{new Date(disc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-pv-border">
                  <button
                    onClick={(e) => handleUpvoteDiscussion(disc.id, e)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      hasUpvoted
                        ? 'bg-pv-dragon-fruit/10 border-pv-dragon-fruit/30 text-pv-dragon-fruit'
                        : 'bg-pv-surface-soft border-pv-border text-pv-text-muted hover:text-pv-text-primary'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
                    <span className="font-tabular">{disc.upvotesCount}</span>
                  </button>
                  <div className="inline-flex items-center gap-1.5 text-xs text-pv-text-muted font-tabular">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{disc.replyCount} replies</span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* CREATE DISCUSSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-pv-border pb-3">
              <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-pv-dragon-fruit" />
                <span>Start a Club Discussion</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-pv-text-muted hover:text-pv-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscussion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Best solving technique for Hard Logic"
                  className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ClubDiscussionCategory)}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover capitalize"
                  >
                    <option value="strategy">Strategy</option>
                    <option value="technique">Solving Technique</option>
                    <option value="competition">Competition Prep</option>
                    <option value="event">Event Discussion</option>
                    <option value="mastery">Mastery Practice</option>
                    <option value="recommendation">Recommendations</option>
                    {isOwnerOrAdmin && <option value="announcement">Announcement</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                    Linked Game (Optional)
                  </label>
                  <select
                    value={newLinkedPuzzle}
                    onChange={(e) => setNewLinkedPuzzle(e.target.value as PuzzleType | '')}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover capitalize"
                  >
                    <option value="">None</option>
                    <option value="logic">Logic Puzzle</option>
                    <option value="number">Number Puzzle</option>
                    <option value="pattern">Pattern Matching</option>
                    <option value="pipe">Pipe Connect</option>
                    <option value="laser_mirror">Laser Mirror</option>
                    <option value="arrow_path">Arrow Path</option>
                    <option value="block_escape">Block Escape</option>
                    <option value="sliding">Sliding Puzzle</option>
                    <option value="rotating_tiles">Rotating Tiles</option>
                    <option value="word">Word Puzzle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                  Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share your strategy or pattern insights..."
                  className="w-full bg-pv-surface-soft border border-pv-border rounded-lg p-3 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
                />
              </div>

              {isOwnerOrAdmin && (
                <div className="flex items-center gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-pv-text-secondary">
                    <input
                      type="checkbox"
                      checked={newIsPinned}
                      onChange={(e) => setNewIsPinned(e.target.checked)}
                      className="rounded border-pv-border bg-pv-surface-soft text-pv-dragon-fruit"
                    />
                    Pin thread
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-pv-text-secondary">
                    <input
                      type="checkbox"
                      checked={newIsAnnouncement}
                      onChange={(e) => setNewIsAnnouncement(e.target.checked)}
                      className="rounded border-pv-border bg-pv-surface-soft text-pv-dragon-fruit"
                    />
                    Official Announcement
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
                  Post Discussion
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DISCUSSION DETAIL MODAL & REPLIES */}
      {selectedDiscussion && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full my-8 p-6 space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-pv-border pb-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedDiscussion.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-pv-dragon-fruit/10 text-pv-dragon-fruit border border-pv-dragon-fruit/20">
                      <Pin className="w-2.5 h-2.5" /> PINNED
                    </span>
                  )}
                  {selectedDiscussion.isAnnouncement && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      <Megaphone className="w-2.5 h-2.5" /> ANNOUNCEMENT
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pv-surface-soft text-pv-text-muted border border-pv-border capitalize">
                    {selectedDiscussion.category}
                  </span>
                </div>
                <h2 className="text-base font-bold text-pv-text-primary">{selectedDiscussion.title}</h2>
                <div className="flex items-center gap-2 text-xs text-pv-text-muted pt-0.5">
                  <span className="font-medium text-pv-text-secondary">{selectedDiscussion.authorName}</span>
                  {selectedDiscussion.authorRole && selectedDiscussion.authorRole !== 'MEMBER' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-pv-surface-soft text-pv-dragon-fruit border border-pv-border font-semibold">
                      {selectedDiscussion.authorRole}
                    </span>
                  )}
                  <span>•</span>
                  <span className="font-tabular">{new Date(selectedDiscussion.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDiscussion(null)}
                className="text-pv-text-muted hover:text-pv-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="bg-pv-surface-soft border border-pv-border rounded-lg p-4 text-xs text-pv-text-secondary leading-relaxed whitespace-pre-line">
                {selectedDiscussion.content}
              </div>

              {selectedDiscussion.linkedPuzzleType && (
                <div className="flex items-center justify-between bg-pv-surface-soft border border-pv-border rounded-lg p-3">
                  <div>
                    <p className="text-xs font-semibold text-pv-text-primary">
                      Linked Practice: {selectedDiscussion.linkedPuzzleType.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-[11px] text-pv-text-muted">
                      Practice this puzzle type directly to test strategies discussed here.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      playGame(selectedDiscussion.linkedPuzzleType!);
                    }}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Now</span>
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-b border-pv-border py-2">
                <button
                  onClick={() => handleUpvoteDiscussion(selectedDiscussion.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    user && selectedDiscussion.upvotedBy.includes(user.uid)
                      ? 'bg-pv-dragon-fruit/10 border-pv-dragon-fruit/30 text-pv-dragon-fruit'
                      : 'bg-pv-surface-soft border-pv-border text-pv-text-muted hover:text-pv-text-primary'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span className="font-tabular">Upvote ({selectedDiscussion.upvotesCount})</span>
                </button>

                <div className="flex items-center gap-2">
                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => handleTogglePin(selectedDiscussion)}
                      className="px-2.5 py-1 text-xs font-medium text-pv-text-muted hover:text-pv-text-primary transition-colors flex items-center gap-1"
                    >
                      <Pin className="w-3 h-3" />
                      <span>{selectedDiscussion.isPinned ? 'Unpin' : 'Pin'}</span>
                    </button>
                  )}
                  {(isOwnerOrAdmin || (user && selectedDiscussion.authorId === user.uid)) && (
                    <button
                      onClick={() => handleDeleteDiscussion(selectedDiscussion)}
                      className="px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Replies Thread */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-semibold text-pv-text-muted uppercase tracking-wider">
                  Replies ({replies.length})
                </h4>
                {loadingReplies ? (
                  <div className="space-y-2">
                    <div className="h-12 bg-pv-surface-soft border border-pv-border rounded-lg animate-pulse" />
                  </div>
                ) : replies.length === 0 ? (
                  <p className="text-xs text-pv-text-muted py-2">No replies yet.</p>
                ) : (
                  replies.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-pv-surface-soft border border-pv-border rounded-lg p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-pv-text-primary">{rep.authorName}</span>
                          {rep.authorRole && rep.authorRole !== 'MEMBER' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-pv-surface-elevated text-pv-dragon-fruit border border-pv-border font-semibold">
                              {rep.authorRole}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-pv-text-muted font-tabular">
                          {new Date(rep.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-pv-text-secondary leading-relaxed">{rep.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={handleAddReply} className="pt-2 border-t border-pv-border flex gap-2">
              <input
                type="text"
                required
                value={newReplyContent}
                onChange={(e) => setNewReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
              />
              <Button type="submit" variant="primary" size="sm">
                Post Reply
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
