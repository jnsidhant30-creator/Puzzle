import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Shield,
  Users,
  Trophy,
  MessageSquare,
  Swords,
  Award,
  ArrowLeft,
  Crown,
  UserPlus,
  LogOut,
  Send,
  CheckCircle2,
  ChevronRight,
  Target,
  BookOpen,
  Calendar,
  Sparkles,
  Play,
  X,
} from 'lucide-react';
import {
  Club,
  ClubMember,
  ClubChatMessage,
  ClubCompetition,
  ClubCompetitionScore,
  ClubDuelChallenge,
  ClubEvent,
  ClubMilestone,
  ClubRole,
  ClubDiscussion,
  ClubGuide,
  PuzzleType,
} from '../types';
import {
  fetchClubById,
  fetchClubMembers,
  fetchClubChatMessages,
  sendClubChatMessage,
  joinClub,
  leaveClub,
  fetchActiveClubCompetitions,
  fetchClubCompetitionScores,
  fetchClubDuels,
  createClubDuel,
  fetchClubs,
  fetchClubEvents,
  fetchClubMilestones,
  updateClubMemberRole,
  computeClubReputation,
  fetchClubDiscussions,
  fetchClubGuides,
} from '../services/firebase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ClubDetailPage: React.FC = () => {
  const {
    user,
    selectedClubId,
    viewClubsHub,
    viewClubEvents,
    viewClubDiscussions,
    viewClubGuides,
    userClub,
    setUserClub,
    playGame,
  } = useStore();

  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [chatMessages, setChatMessages] = useState<ClubChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<
    'roster' | 'chat' | 'competition' | 'progress' | 'events' | 'duels' | 'discussions' | 'guides'
  >('roster');
  const [loading, setLoading] = useState(true);

  /* Competitions, Duels, Events, Milestones, Discussions & Guides */
  const [activeComp, setActiveComp] = useState<ClubCompetition | null>(null);
  const [compScores, setCompScores] = useState<ClubCompetitionScore[]>([]);
  const [duels, setDuels] = useState<ClubDuelChallenge[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [milestones, setMilestones] = useState<ClubMilestone[]>([]);
  const [discussions, setDiscussions] = useState<ClubDiscussion[]>([]);
  const [guides, setGuides] = useState<ClubGuide[]>([]);

  /* Challenge Club Duel Modal */
  const [showDuelModal, setShowDuelModal] = useState(false);
  const [targetClubs, setTargetClubs] = useState<Club[]>([]);
  const [selectedTargetClubId, setSelectedTargetClubId] = useState<string>('');
  const [selectedDuelPuzzles] = useState<PuzzleType[]>(['logic', 'number', 'arrow_path']);

  useEffect(() => {
    if (selectedClubId) {
      loadClubDetails(selectedClubId);
    }
  }, [selectedClubId, user]);

  const loadClubDetails = async (id: string) => {
    setLoading(true);
    try {
      const c = await fetchClubById(id);
      setClub(c);
      if (c) {
        const mems = await fetchClubMembers(id);
        setMembers(mems);
        const msgs = await fetchClubChatMessages(id);
        setChatMessages(msgs);
        const comps = await fetchActiveClubCompetitions();
        if (comps.length > 0) {
          setActiveComp(comps[0]);
          const scores = await fetchClubCompetitionScores(comps[0].id);
          setCompScores(scores);
        }
        const clubDuelsList = await fetchClubDuels(id);
        setDuels(clubDuelsList);
        const evs = await fetchClubEvents(id);
        setEvents(evs);
        const ms = await fetchClubMilestones(id);
        setMilestones(ms);
        const discList = await fetchClubDiscussions(id);
        setDiscussions(discList);
        const guideList = await fetchClubGuides(id);
        setGuides(guideList);
        const allClubs = await fetchClubs();
        setTargetClubs(allClubs.filter((item: Club) => item.id !== id));
      }
    } catch (err) {
      console.error('Error loading club detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !club || !newMessage.trim()) return;
    try {
      const sent = await sendClubChatMessage(club.id, user, newMessage.trim());
      setChatMessages((prev) => [...prev, sent]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleJoin = async () => {
    if (!user || !club) return;
    try {
      const { club: updatedClub, member } = await joinClub(club.id, user);
      setClub(updatedClub);
      setUserClub(updatedClub, member);
      const mems = await fetchClubMembers(club.id);
      setMembers(mems);
    } catch (err) {
      console.error('Failed to join club:', err);
    }
  };

  const handleLeave = async () => {
    if (!user || !club) return;
    try {
      await leaveClub(club.id, user.uid);
      setUserClub(null, null);
      viewClubsHub();
    } catch (err) {
      console.error('Failed to leave club:', err);
    }
  };

  const handleIssueDuel = async () => {
    if (!user || !club || !selectedTargetClubId) return;
    const targetClub = targetClubs.find((t) => t.id === selectedTargetClubId);
    if (!targetClub) return;
    try {
      const newDuel = await createClubDuel(club, targetClub, selectedDuelPuzzles, user);
      setDuels((prev) => [...prev, newDuel]);
      setShowDuelModal(false);
      setActiveTab('duels');
    } catch (err) {
      console.error('Failed to issue duel:', err);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: ClubRole) => {
    if (!club) return;
    try {
      await updateClubMemberRole(club.id, targetUserId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.userId === targetUserId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-12">
        <div className="h-44 bg-pv-surface-soft border border-pv-border rounded-lg" />
        <div className="h-64 bg-pv-surface-soft border border-pv-border rounded-lg" />
      </div>
    );
  }

  if (!club) {
    return (
      <Card className="text-center py-16 space-y-4 max-w-md mx-auto">
        <Shield className="w-12 h-12 text-pv-text-muted mx-auto" />
        <h2 className="text-lg font-bold text-pv-text-primary">Club Not Found</h2>
        <Button onClick={viewClubsHub} variant="secondary" size="sm">
          Return to Clubs
        </Button>
      </Card>
    );
  }

  const isMember = members.some((m) => m.userId === user?.uid) || userClub?.id === club.id;
  const currentUserMember = members.find((m) => m.userId === user?.uid);
  const isOwner = club.ownerUid === user?.uid;
  const isAdmin = isOwner || currentUserMember?.role === 'ADMIN';
  const repLabel = computeClubReputation(club.totalClubXP, club.memberCount);

  const totalSolved =
    club.totalPuzzlesSolved ||
    members.reduce((sum, m) => sum + (m.puzzlesSolvedCount || 0), 0) ||
    0;
  const activeCount =
    members.filter((m) => new Date(m.lastActiveAt).getTime() > Date.now() - 7 * 86400000).length ||
    members.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={viewClubsHub}
        className="inline-flex items-center gap-2 text-xs font-semibold text-pv-text-muted hover:text-pv-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Clubs Overview</span>
      </button>

      {/* Main Club Banner */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-pv-surface-soft border border-pv-border flex items-center justify-center text-[#38C6BA] font-bold text-xl shrink-0 font-tabular">
              {club.tag}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-bold text-[#38C6BA] tracking-wider">
                  [{club.tag}]
                </span>
                <span className="text-xs bg-pv-surface-soft text-[#38C6BA] px-2.5 py-0.5 rounded border border-pv-border font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {repLabel}
                </span>
                <span className="text-xs bg-pv-surface-soft text-pv-text-muted px-2.5 py-0.5 rounded border border-pv-border font-tabular">
                  Level {club.level}
                </span>
                <span className="text-xs bg-pv-surface-soft text-pv-text-muted px-2.5 py-0.5 rounded border border-pv-border capitalize">
                  Focus: {club.primaryFocus.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-pv-text-primary">{club.name}</h1>
              <p className="text-xs text-pv-text-secondary max-w-2xl leading-relaxed">{club.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 md:border-l border-pv-border pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase font-semibold text-pv-text-muted block">
                Total Solved
              </span>
              <span className="text-pv-text-primary font-bold text-lg font-tabular">
                {totalSolved.toLocaleString()}
              </span>
            </div>
            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase font-semibold text-pv-text-muted block">
                Members
              </span>
              <span className="text-pv-text-primary font-bold text-lg font-tabular">
                {club.memberCount}/{club.maxMembers}
              </span>
            </div>
            <div className="w-full sm:w-auto">
              {isMember ? (
                <Button
                  onClick={handleLeave}
                  variant="destructive"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Club</span>
                </Button>
              ) : (
                <Button
                  onClick={handleJoin}
                  variant="primary"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Join Club</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Feature Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#38C6BA] shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-pv-text-primary">Events & Calendar</h4>
              <p className="text-[11px] text-pv-text-muted font-tabular">
                {events.filter((e) => e.status === 'scheduled').length} active events
              </p>
            </div>
          </div>
          <Button
            onClick={() => viewClubEvents(club.id)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-[11px]"
          >
            <span>Events</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Card>

        <Card className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-[#38C6BA] shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-pv-text-primary">Club Discussions</h4>
              <p className="text-[11px] text-pv-text-muted font-tabular">
                {discussions.length} active threads
              </p>
            </div>
          </div>
          <Button
            onClick={() => viewClubDiscussions(club.id)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-[11px]"
          >
            <span>Discussions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Card>

        <Card className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#38C6BA] shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-pv-text-primary">Knowledge Guides</h4>
              <p className="text-[11px] text-pv-text-muted font-tabular">
                {guides.length} community manuals
              </p>
            </div>
          </div>
          <Button
            onClick={() => viewClubGuides(club.id)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-[11px]"
          >
            <span>Guides</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Card>
      </div>

      {/* Club Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-pv-border pb-2 overflow-x-auto">
        {[
          { id: 'roster', label: `Roster (${members.length})`, icon: Users },
          { id: 'progress', label: 'Milestones & Activity', icon: Target },
          { id: 'events', label: `Events (${events.length})`, icon: Calendar },
          { id: 'discussions', label: `Discussions (${discussions.length})`, icon: MessageSquare },
          { id: 'guides', label: `Guides (${guides.length})`, icon: BookOpen },
          { id: 'chat', label: 'Club Wall', icon: MessageSquare },
          { id: 'competition', label: 'Team Competition', icon: Trophy },
          { id: 'duels', label: `Duels (${duels.length})`, icon: Swords },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#38C6BA] text-[#142331] font-semibold'
                  : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-soft'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'roster' && (
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-pv-border text-pv-text-muted uppercase font-medium">
                <th className="pb-3 pl-2">Player</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Puzzles Solved</th>
                <th className="pb-3">Weekly XP</th>
                <th className="pb-3">Total Contribution</th>
                <th className="pb-3 text-right pr-2">Role Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pv-border text-pv-text-secondary">
              {members.map((m) => {
                const isOwnerRole = m.role === 'OWNER';
                const isAdminRole = m.role === 'ADMIN';
                const isContribRole = m.role === 'CONTRIBUTOR';
                return (
                  <tr key={m.id} className="hover:bg-pv-surface-soft/50 transition-colors">
                    <td className="py-3 pl-2 flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-pv-surface-soft border border-pv-border flex items-center justify-center text-xs font-semibold text-pv-text-primary font-tabular">
                        {m.displayName ? m.displayName.slice(0, 2).toUpperCase() : 'PL'}
                      </div>
                      <div>
                        <span className="font-semibold text-pv-text-primary block">{m.displayName}</span>
                        <span className="text-[10px] text-pv-text-muted">
                          Joined {new Date(m.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      {isOwnerRole ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          <Crown className="w-3 h-3" /> Owner
                        </span>
                      ) : isAdminRole ? (
                        <span className="inline-flex items-center gap-1 text-[#38C6BA] bg-[#38C6BA]/10 border border-[#38C6BA]/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : isContribRole ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          <Award className="w-3 h-3" /> Contributor
                        </span>
                      ) : (
                        <span className="text-pv-text-muted text-[10px]">Member</span>
                      )}
                    </td>
                    <td className="py-3 font-semibold text-pv-text-primary font-tabular">
                      {m.puzzlesSolvedCount || 0}
                    </td>
                    <td className="py-3 font-semibold text-pv-text-primary font-tabular">
                      +{m.weeklyContributionXP.toLocaleString()} XP
                    </td>
                    <td className="py-3 font-semibold text-pv-text-secondary font-tabular">
                      {m.totalContributionXP.toLocaleString()} XP
                    </td>
                    <td className="py-3 text-right pr-2">
                      {isAdmin && !isOwnerRole && m.userId !== user?.uid ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value as ClubRole)}
                          className="bg-pv-surface-soft border border-pv-border rounded px-2 py-1 text-[11px] text-pv-text-secondary focus:outline-none focus:border-pv-border-hover"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="CONTRIBUTOR">Contributor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-medium">Active</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-6">
          <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-pv-surface-soft border border-pv-border text-[#38C6BA] font-semibold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Reputation: {repLabel}</span>
              </div>
              <h3 className="text-lg font-bold text-pv-text-primary">Community Milestones & Activity</h3>
              <p className="text-xs text-pv-text-secondary max-w-xl">
                Collective validated achievements earned through genuine puzzle victories by all club members.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-pv-border pt-4 md:pt-0 md:pl-6 text-center">
              <div>
                <span className="text-[10px] text-pv-text-muted uppercase font-semibold block">Completed</span>
                <span className="text-pv-text-primary font-bold text-base font-tabular">
                  {totalSolved.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-pv-text-muted uppercase font-semibold block">Active</span>
                <span className="text-pv-text-primary font-bold text-base font-tabular">
                  {activeCount}/{members.length}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-pv-text-muted uppercase font-semibold block">Club XP</span>
                <span className="text-emerald-400 font-bold text-base font-tabular">
                  {club.totalClubXP.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
              <Target className="w-4 h-4 text-[#38C6BA]" />
              <span>Collective Puzzle Milestones</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestones.map((ms) => {
                const percent = Math.min(100, Math.floor((ms.achievedPuzzles / ms.targetPuzzles) * 100));
                return (
                  <div key={ms.id} className="bg-pv-surface-soft border border-pv-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-pv-text-primary">{ms.title}</h4>
                        <p className="text-[11px] text-pv-text-muted">{ms.description}</p>
                      </div>
                      {ms.isCompleted ? (
                        <span className="text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#38C6BA] font-tabular">
                          +{ms.rewardXP} XP
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-tabular text-pv-text-muted">
                        <span>Progress</span>
                        <span>
                          {ms.achievedPuzzles.toLocaleString()} / {ms.targetPuzzles.toLocaleString()} Puzzles
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-pv-surface-elevated rounded-full overflow-hidden border border-pv-border">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            ms.isCompleted ? 'bg-emerald-500' : 'bg-[#38C6BA]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#38C6BA]" />
              <span>Upcoming Scheduled Events</span>
            </h3>
            <Button
              onClick={() => viewClubEvents(club.id)}
              variant="secondary"
              size="sm"
            >
              Open Full Event Calendar
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.slice(0, 4).map((ev) => (
              <Card key={ev.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-pv-surface-soft border border-pv-border text-[#38C6BA] font-semibold uppercase text-[10px]">
                    {ev.eventType.replace('_', ' ')}
                  </span>
                  <span className="text-pv-text-muted text-[11px] font-tabular">
                    {new Date(ev.startAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-pv-text-primary">{ev.title}</h4>
                <p className="text-xs text-pv-text-secondary leading-relaxed">{ev.description}</p>
                <div className="pt-2 border-t border-pv-border flex items-center justify-between text-xs">
                  <span className="text-pv-text-muted font-tabular">{ev.participantCount} Attending</span>
                  <Button
                    onClick={() => playGame(ev.puzzleFocus === 'all' ? 'logic' : ev.puzzleFocus)}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Launch</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <Card className="p-4 space-y-4">
          <div className="h-80 overflow-y-auto space-y-3 pr-2">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-pv-text-muted text-xs">
                No chat messages yet. Send a message to your club.
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isSys = msg.isSystemActivity;
                return isSys ? (
                  <div key={msg.id} className="text-center my-2">
                    <span className="inline-block bg-pv-surface-soft border border-pv-border text-pv-text-muted text-[11px] px-2.5 py-0.5 rounded">
                      {msg.message}
                    </span>
                  </div>
                ) : (
                  <div key={msg.id} className="flex items-start gap-3 bg-pv-surface-soft/60 p-3 rounded border border-pv-border">
                    <div className="w-7 h-7 rounded bg-pv-surface-elevated border border-pv-border flex items-center justify-center text-xs font-semibold text-pv-text-primary font-tabular shrink-0">
                      {msg.userName ? msg.userName.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-pv-text-primary">{msg.userName}</span>
                        <span className="text-[10px] text-pv-text-muted font-tabular">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-pv-text-secondary leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {isMember ? (
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-pv-border">
              <input
                type="text"
                placeholder="Share a strategy or game result..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
              />
              <Button type="submit" variant="primary" size="sm" className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </Button>
            </form>
          ) : (
            <div className="text-center py-2 bg-pv-surface-soft rounded border border-pv-border text-xs text-pv-text-muted">
              Join this club to post messages on the club wall.
            </div>
          )}
        </Card>
      )}

      {activeTab === 'competition' && (
        <div className="space-y-6">
          {activeComp && (
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-[#38C6BA] tracking-wider block">
                    Team Milestone Goal
                  </span>
                  <h3 className="text-base font-bold text-pv-text-primary">{activeComp.title}</h3>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-pv-text-muted uppercase font-medium block">Team Reward</span>
                  <span className="text-[#38C6BA] font-bold text-xs font-tabular">
                    +{activeComp.milestoneRewardXP} XP & +{activeComp.milestoneRewardCoins} Coins
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-pv-text-secondary">Club Weekly XP Target</span>
                  <span className="text-pv-text-primary font-tabular">
                    {club.weeklyPoints.toLocaleString()} / {activeComp.milestoneTarget.toLocaleString()} XP
                  </span>
                </div>
                <div className="w-full h-2 bg-pv-surface-soft rounded-full overflow-hidden border border-pv-border">
                  <div
                    className="h-full bg-[#38C6BA] rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (club.weeklyPoints / activeComp.milestoneTarget) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </Card>
          )}

          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#38C6BA]" />
              <span>Weekly Club Standings</span>
            </h3>
            <div className="space-y-2">
              {compScores.map((score, idx) => (
                <div
                  key={score.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    score.clubId === club.id
                      ? 'bg-pv-surface-soft border-[#38C6BA]/40'
                      : 'bg-pv-surface-soft/60 border-pv-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-tabular ${
                        idx === 0
                          ? 'bg-amber-400/20 text-amber-400'
                          : idx === 1
                          ? 'bg-slate-300/20 text-slate-300'
                          : 'bg-pv-surface-soft text-pv-text-muted'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-[#38C6BA]">[{score.clubTag}]</span>
                      <span className="text-xs font-semibold text-pv-text-primary ml-2">{score.clubName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-pv-text-primary block font-tabular">
                      {score.totalPoints.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-pv-text-muted uppercase">Club Points</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'duels' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#38C6BA]" />
                <span>Club vs Club Duels</span>
              </h3>
              <p className="text-xs text-pv-text-muted">3-day team clashes across selected puzzle types</p>
            </div>
            {isMember && (
              <Button
                onClick={() => setShowDuelModal(true)}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Issue Duel</span>
              </Button>
            )}
          </div>

          {duels.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <Swords className="w-10 h-10 text-pv-text-muted mx-auto" />
              <h4 className="text-sm font-semibold text-pv-text-primary">No active club duels</h4>
              <p className="text-xs text-pv-text-muted max-w-sm mx-auto">
                Challenge another club to a direct 3-day puzzle showdown to earn team prestige and bonus XP.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {duels.map((duel) => (
                <Card key={duel.id} className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs font-medium text-pv-text-muted border-b border-pv-border pb-2">
                    <span>3-Day Club Duel</span>
                    <span className="text-[#38C6BA] bg-pv-surface-soft px-2 py-0.5 rounded border border-pv-border text-[10px] font-semibold uppercase">
                      {duel.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center space-y-1">
                      <span className="text-xs font-semibold text-[#38C6BA]">[{duel.challengerClubTag}]</span>
                      <div className="text-xs font-semibold text-pv-text-primary">{duel.challengerClubName}</div>
                      <div className="text-base font-bold text-pv-text-primary font-tabular">
                        {duel.challengerScore}
                      </div>
                    </div>
                    <div className="text-center font-bold text-pv-text-muted text-xs">VS</div>
                    <div className="text-center space-y-1">
                      <span className="text-xs font-semibold text-[#38C6BA]">[{duel.targetClubTag}]</span>
                      <div className="text-xs font-semibold text-pv-text-primary">{duel.targetClubName}</div>
                      <div className="text-base font-bold text-pv-text-primary font-tabular">{duel.targetScore}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-pv-text-muted bg-pv-surface-soft p-2.5 rounded border border-pv-border flex items-center justify-between">
                    <span>Eligible Games:</span>
                    <span className="font-medium text-pv-text-primary capitalize">{duel.puzzleTypes.join(', ')}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'discussions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#38C6BA]" />
                <span>Club Strategy & Discussions</span>
              </h3>
              <p className="text-xs text-pv-text-muted">Discuss puzzle solving methods and team preparation</p>
            </div>
            <Button
              onClick={() => viewClubDiscussions(club.id)}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              <span>Discussions Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {discussions.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-pv-text-muted mx-auto" />
              <h4 className="text-sm font-semibold text-pv-text-primary">No strategy discussions yet</h4>
              <p className="text-xs text-pv-text-muted max-w-sm mx-auto">
                Start the conversation with your team.
              </p>
              <Button onClick={() => viewClubDiscussions(club.id)} variant="primary" size="sm">
                Create Discussion
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {discussions.slice(0, 5).map((disc) => (
                <Card
                  key={disc.id}
                  onClick={() => viewClubDiscussions(club.id)}
                  className="cursor-pointer p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-pv-border-hover transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pv-surface-soft text-pv-text-muted border border-pv-border capitalize">
                        {disc.category}
                      </span>
                      {disc.isPinned && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#38C6BA]/10 text-[#38C6BA] border border-[#38C6BA]/20">
                          PINNED
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-pv-text-primary hover:text-[#38C6BA] transition-colors">
                      {disc.title}
                    </h4>
                    <p className="text-xs text-pv-text-secondary line-clamp-1">{disc.content}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-pv-text-muted shrink-0 font-tabular">
                    <span>{disc.upvotesCount} upvotes</span>
                    <span>•</span>
                    <span>{disc.replyCount} replies</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'guides' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#38C6BA]" />
                <span>Knowledge Base & Guides</span>
              </h3>
              <p className="text-xs text-pv-text-muted">Strategy write-ups and solving walkthroughs</p>
            </div>
            <Button
              onClick={() => viewClubGuides(club.id)}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              <span>Knowledge Base</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {guides.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-pv-text-muted mx-auto" />
              <h4 className="text-sm font-semibold text-pv-text-primary">No community guides yet</h4>
              <p className="text-xs text-pv-text-muted max-w-sm mx-auto">
                Author a guide to build your club knowledge base.
              </p>
              <Button onClick={() => viewClubGuides(club.id)} variant="primary" size="sm">
                Create Guide
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {guides.slice(0, 4).map((guide) => (
                <Card
                  key={guide.id}
                  onClick={() => viewClubGuides(club.id)}
                  className="cursor-pointer p-4 space-y-2 hover:border-pv-border-hover transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {guide.isOfficial && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        OFFICIAL
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pv-surface-soft text-pv-text-muted border border-pv-border capitalize">
                      {guide.category.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-pv-text-primary hover:text-[#38C6BA] transition-colors">
                    {guide.title}
                  </h4>
                  <p className="text-xs text-pv-text-secondary line-clamp-2 leading-relaxed">{guide.summary}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Duel Modal */}
      {showDuelModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-pv-border pb-3">
              <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#38C6BA]" />
                <span>Issue Club Duel</span>
              </h3>
              <button
                onClick={() => setShowDuelModal(false)}
                className="text-pv-text-muted hover:text-pv-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                  Select Opponent Club
                </label>
                <select
                  value={selectedTargetClubId}
                  onChange={(e) => setSelectedTargetClubId(e.target.value)}
                  className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                >
                  <option value="">-- Choose Club --</option>
                  {targetClubs.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      [{tc.tag}] {tc.name} (Lvl {tc.level})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-pv-border">
                <Button
                  onClick={() => setShowDuelModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleIssueDuel}
                  disabled={!selectedTargetClubId}
                  variant="primary"
                  size="sm"
                >
                  Send Challenge
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
