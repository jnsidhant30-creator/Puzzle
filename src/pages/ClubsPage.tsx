import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Users,
  Shield,
  Search,
  Plus,
  Trophy,
  ChevronRight,
  Filter,
  Lock,
  Unlock,
  Zap,
  Calculator,
  Brain,
  BookOpen,
  Compass,
  Clock,
  X,
  WifiOff,
} from 'lucide-react';
import { Club, PuzzleType, ClubPrivacy } from '../types';
import {
  fetchClubs,
  fetchUserClubMembership,
  createClub,
  joinClub,
  fetchActiveClubCompetitions,
  fetchClubCompetitionScores,
} from '../services/firebase';
import { Card, PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ClubsPage: React.FC = () => {
  const { user, isOnline, isGuest, retryConnection, viewClubDetail, userClub, setUserClub } = useStore();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusFilter, setFocusFilter] = useState<string>('all');

  /* Create Club modal */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubTag, setNewClubTag] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubFocus, setNewClubFocus] = useState<PuzzleType | 'all'>('all');
  const [newClubPrivacy, setNewClubPrivacy] = useState<ClubPrivacy>('public');
  const [newClubColor] = useState('amber');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Active Competition */
  const [activeComp, setActiveComp] = useState<any>(null);
  const [topScores, setTopScores] = useState<any[]>([]);

  useEffect(() => {
    loadClubData();
  }, [searchQuery, focusFilter, user]);

  const loadClubData = async () => {
    setLoading(true);
    try {
      const fetchedClubs = await fetchClubs(searchQuery, focusFilter);
      setClubs(fetchedClubs);

      if (user) {
        const myMembership = await fetchUserClubMembership(user.uid);
        if (myMembership) {
          setUserClub(myMembership.club, myMembership.member);
        } else {
          setUserClub(null, null);
        }
      }

      const comps = await fetchActiveClubCompetitions();
      if (comps.length > 0) {
        setActiveComp(comps[0]);
        const scores = await fetchClubCompetitionScores(comps[0].id);
        setTopScores(scores);
      }
    } catch (err) {
      console.error('Error loading club data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newClubName.trim() || !newClubTag.trim()) return;
    setIsSubmitting(true);
    try {
      const { club, member } = await createClub(
        {
          name: newClubName.trim(),
          tag: newClubTag.trim().toUpperCase(),
          description: newClubDesc.trim(),
          primaryFocus: newClubFocus,
          privacy: newClubPrivacy,
          themeColor: newClubColor,
          icon: 'Shield',
        },
        user
      );
      setUserClub(club, member);
      setShowCreateModal(false);
      viewClubDetail(club.id);
    } catch (err) {
      console.error('Failed to create club:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinClub = async (clubId: string) => {
    if (!user) return;
    try {
      const { club, member } = await joinClub(clubId, user);
      setUserClub(club, member);
      viewClubDetail(club.id);
    } catch (err) {
      console.error('Failed to join club:', err);
    }
  };

  const getFocusIcon = (focus: string) => {
    switch (focus) {
      case 'logic':
        return Brain;
      case 'number':
        return Calculator;
      case 'word':
        return BookOpen;
      case 'laser_mirror':
        return Compass;
      default:
        return Zap;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <PageHeader
        title="Clubs & Competitions"
        description="Form puzzle communities, collaborate on weekly objectives, and compete on the global leaderboard."
        action={
          userClub ? (
            <Button
              onClick={() => viewClubDetail(userClub.id)}
              variant="primary"
              size="md"
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>[{userClub.tag}] {userClub.name}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="md"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Club</span>
            </Button>
          )
        }
      />

      {(!isOnline || isGuest) && (
        <Card className="p-4 border-[#F59E0B]/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-[#B4C3CE]">
            <WifiOff className="w-4 h-4 text-[#FBBF24] shrink-0" />
            <span>
              {!isOnline
                ? 'Clubs, team competitions, and discussions require an active internet connection.'
                : 'Sign in with a PuzzleVerse account online to join or create a Club.'}
            </span>
          </div>
          {!isOnline && (
            <button
              onClick={() => retryConnection()}
              className="px-3 py-1.5 rounded-lg bg-[#233D4A] border border-[#36515F] text-xs font-bold text-[#F5F7F8]"
            >
              Retry Connection
            </button>
          )}
        </Card>
      )}

      {/* User Club Quick Bar (If in a club) */}
      {userClub && (
        <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded bg-pv-surface-soft border border-pv-border flex items-center justify-center text-[#38C6BA] font-bold text-base font-tabular">
              {userClub.tag}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-semibold text-[#38C6BA] tracking-wider">
                  Active Club
                </span>
                <span className="text-xs bg-pv-surface-soft text-pv-text-muted px-2 py-0.5 rounded border border-pv-border font-tabular">
                  Lvl {userClub.level}
                </span>
              </div>
              <h3 className="text-base font-semibold text-pv-text-primary">{userClub.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left md:text-right">
              <span className="text-[11px] text-pv-text-muted uppercase font-medium">Weekly XP</span>
              <div className="text-pv-text-primary font-bold text-base font-tabular">
                {userClub.weeklyPoints.toLocaleString()}
              </div>
            </div>
            <div className="text-left md:text-right">
              <span className="text-[11px] text-pv-text-muted uppercase font-medium">Members</span>
              <div className="text-pv-text-primary font-bold text-base font-tabular">
                {userClub.memberCount}/{userClub.maxMembers}
              </div>
            </div>
            <Button
              onClick={() => viewClubDetail(userClub.id)}
              variant="secondary"
              size="sm"
            >
              Enter Hub
            </Button>
          </div>
        </Card>
      )}

      {/* Weekly Club Competition Banner & Top Rankings */}
      {activeComp && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pv-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#38C6BA]/10 border border-[#38C6BA]/20 flex items-center justify-center text-[#38C6BA]">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-semibold text-[#38C6BA] tracking-wider">
                  Active Team Event
                </span>
                <h2 className="text-lg font-bold text-pv-text-primary">{activeComp.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-pv-text-muted bg-pv-surface-soft px-3 py-1.5 rounded border border-pv-border">
              <Clock className="w-3.5 h-3.5" />
              <span>Ends in 5 days</span>
            </div>
          </div>

          <p className="text-xs text-pv-text-secondary leading-relaxed">{activeComp.description}</p>

          {/* Top 3 Rankings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {topScores.slice(0, 3).map((score, idx) => (
              <div
                key={score.id}
                onClick={() => viewClubDetail(score.clubId)}
                className="p-3.5 rounded-lg border border-pv-border bg-pv-surface-soft hover:border-pv-border-hover transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold font-tabular ${
                      idx === 0
                        ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                        : idx === 1
                        ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30'
                        : 'bg-amber-700/20 text-amber-500 border border-amber-700/30'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-[#38C6BA]">[{score.clubTag}]</div>
                    <div className="text-xs font-semibold text-pv-text-primary line-clamp-1">{score.clubName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-pv-text-primary font-tabular">
                    {score.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-pv-text-muted uppercase">Points</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search & Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-pv-text-muted" />
          <input
            type="text"
            placeholder="Search club name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-pv-surface-soft border border-pv-border rounded-lg pl-10 pr-4 py-2 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-pv-text-muted shrink-0" />
          <span className="text-[11px] font-medium text-pv-text-muted shrink-0 uppercase tracking-wider">Focus:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'logic', label: 'Logic' },
            { id: 'number', label: 'Math' },
            { id: 'word', label: 'Words' },
            { id: 'laser_mirror', label: 'Spatial' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFocusFilter(f.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                focusFilter === f.id
                  ? 'bg-[#38C6BA] text-[#142331] font-semibold'
                  : 'bg-pv-surface-soft text-pv-text-secondary hover:text-pv-text-primary border border-pv-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Club Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-[#38C6BA]" />
            <span>Discover Clubs ({clubs.length})</span>
          </h2>
          <span className="text-xs text-pv-text-muted">Sorted by weekly activity</span>
        </div>

        {loading ? (
          <Card className="py-14 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#38C6BA] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#B4C3CE] font-semibold">Loading clubs...</p>
          </Card>
        ) : clubs.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Shield className="w-10 h-10 text-pv-text-muted mx-auto" />
            <h3 className="text-base font-semibold text-pv-text-primary">No clubs found</h3>
            <p className="text-xs text-pv-text-muted max-w-sm mx-auto">
              Adjust your search query or focus filter, or establish a new club.
            </p>
            <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm">
              Create Club
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((c) => {
              const FocusIcon = getFocusIcon(c.primaryFocus);
              const isFull = c.memberCount >= c.maxMembers;
              const isMyClub = userClub?.id === c.id;

              return (
                <Card
                  key={c.id}
                  className={`p-5 flex flex-col justify-between transition-colors ${
                    isMyClub ? 'border-[#38C6BA]/40' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-pv-surface-soft border border-pv-border flex items-center justify-center text-[#38C6BA] font-bold text-xs shrink-0 font-tabular">
                          {c.tag}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-[#38C6BA]">[{c.tag}]</span>
                            {c.privacy === 'private' ? (
                              <Lock className="w-3 h-3 text-pv-text-muted" />
                            ) : (
                              <Unlock className="w-3 h-3 text-pv-text-muted" />
                            )}
                          </div>
                          <h3 className="font-semibold text-pv-text-primary text-sm line-clamp-1">{c.name}</h3>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-pv-surface-soft border border-pv-border text-[10px] font-tabular text-pv-text-muted">
                        Lvl {c.level}
                      </span>
                    </div>

                    <p className="text-xs text-pv-text-secondary line-clamp-2 min-h-[32px] leading-relaxed">
                      {c.description}
                    </p>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-pv-surface-soft p-2 rounded border border-pv-border">
                        <span className="text-[10px] text-pv-text-muted uppercase font-medium block">Weekly XP</span>
                        <span className="font-bold text-pv-text-primary font-tabular">
                          {c.weeklyPoints.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-pv-surface-soft p-2 rounded border border-pv-border">
                        <span className="text-[10px] text-pv-text-muted uppercase font-medium block">Members</span>
                        <span className="font-bold text-pv-text-secondary font-tabular">
                          {c.memberCount}/{c.maxMembers}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-pv-border mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-pv-text-muted">
                      <FocusIcon className="w-3.5 h-3.5" />
                      <span className="capitalize">{c.primaryFocus.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => viewClubDetail(c.id)}
                        variant="ghost"
                        size="sm"
                      >
                        View
                      </Button>
                      {isMyClub ? (
                        <span className="px-2.5 py-1 rounded bg-[#38C6BA]/10 text-[#38C6BA] border border-[#38C6BA]/20 font-medium text-xs">
                          Joined
                        </span>
                      ) : !userClub && !isFull ? (
                        <Button
                          onClick={() => handleJoinClub(c.id)}
                          variant="primary"
                          size="sm"
                        >
                          Join
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Club Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-pv-border pb-3">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#38C6BA]" />
                <h3 className="text-base font-semibold text-pv-text-primary">Create Club</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-pv-text-muted hover:text-pv-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClubSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-pv-text-secondary mb-1">Club Name</label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  placeholder="e.g. Logic Syndicate"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                    Tag (2-5 letters)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="e.g. LOGIC"
                    value={newClubTag}
                    onChange={(e) => setNewClubTag(e.target.value.toUpperCase())}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs font-tabular font-bold text-[#38C6BA] focus:outline-none focus:border-pv-border-hover uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">Primary Focus</label>
                  <select
                    value={newClubFocus}
                    onChange={(e) => setNewClubFocus(e.target.value as any)}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                  >
                    <option value="all">All Puzzles</option>
                    <option value="logic">Logic Puzzles</option>
                    <option value="number">Math & Numbers</option>
                    <option value="word">Word Puzzles</option>
                    <option value="laser_mirror">Spatial & Grid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-pv-text-secondary mb-1">Club Description</label>
                <textarea
                  rows={3}
                  maxLength={150}
                  placeholder="Describe your club objectives..."
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-pv-border">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="primary"
                  size="sm"
                >
                  {isSubmitting ? 'Creating...' : 'Establish Club (+100 XP)'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
