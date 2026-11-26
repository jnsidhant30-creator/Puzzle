import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  Shield,
  Radio,
  AlertTriangle,
  CheckCircle,
  Database,
  Flame,
  Plus,
  Layers,
  Flag,
} from 'lucide-react';
import {
  PuzzleEvent,
  EventType,
  PuzzleType,
  PuzzleCollection,
  CollectionCategory,
  Difficulty,
  ContentReport,
} from '../types';
import {
  fetchPuzzleEvents,
  savePuzzleEvent,
  fetchPuzzleCollections,
  savePuzzleCollection,
  fetchReports,
  updateReportStatus,
  submitModerationAction,
  publishSocialActivity,
} from '../services/firebase';
import { toast } from '../services/toast';
import { Card, PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const AdminPage: React.FC = () => {
  const { user } = useStore();
  const [broadcast, setBroadcast] = useState('');
  const [sentMsg, setSentMsg] = useState(false);
  const [events, setEvents] = useState<PuzzleEvent[]>([]);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  /* Form State for Event Creation */
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    type: 'GAME_FOCUS' as EventType,
    status: 'active' as const,
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 16),
    eligibleGames: ['number', 'word'] as PuzzleType[],
    scoreMultiplier: 1.2,
    rulesStr: 'Complete event puzzles under target time;Score multiplier applies',
    xpReward: 300,
    coinsReward: 150,
    badgeTitle: 'Special Champion',
    participationLimit: 3,
  });

  const [collectionsList, setCollectionsList] = useState<PuzzleCollection[]>([]);
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [newCollection, setNewCollection] = useState({
    title: '',
    description: '',
    category: 'Logic' as CollectionCategory,
    difficulty: 'medium' as Difficulty,
    rewardXP: 300,
    rewardCoins: 150,
    badgeTitle: 'Mastermind Specialist',
  });

  useEffect(() => {
    async function load() {
      const data = await fetchPuzzleEvents();
      setEvents(data);
      const cols = await fetchPuzzleCollections();
      setCollectionsList(cols);
      setLoadingReports(true);
      const reps = await fetchReports();
      setReports(reps);
      setLoadingReports(false);
    }
    load();
  }, []);

  const handleResolveReport = async (
    reportId: string,
    status: ContentReport['status'],
    actionType?: 'remove_content' | 'warning' | 'mute_user' | 'ban_user'
  ) => {
    try {
      await updateReportStatus(reportId, status, actionType || status);
      if (user && actionType) {
        await submitModerationAction({
          adminId: user.uid,
          adminName: user.displayName,
          actionType,
          targetId: reportId,
          details: `Admin applied action ${actionType} on report ${reportId}`,
          createdAt: new Date().toISOString(),
        });
      }
      setReports(
        reports.map((r) =>
          r.id === reportId ? { ...r, status, actionTaken: actionType || status } : r
        )
      );
      toast.success('Moderation action saved');
    } catch (e) {
      toast.error('Failed to update report');
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollection.title.trim()) return;

    const collectionToSave: Partial<PuzzleCollection> = {
      title: newCollection.title,
      description: newCollection.description,
      category: newCollection.category,
      difficulty: newCollection.difficulty,
      rewardXP: newCollection.rewardXP,
      rewardCoins: newCollection.rewardCoins,
      badgeTitle: newCollection.badgeTitle,
      status: 'active',
      items: [
        { puzzleType: 'number', difficulty: newCollection.difficulty, seed: 1001 },
        { puzzleType: 'word', difficulty: newCollection.difficulty, seed: 1002 },
        { puzzleType: 'logic', difficulty: newCollection.difficulty, seed: 1003 },
      ],
    };

    await savePuzzleCollection(collectionToSave);
    const updatedCols = await fetchPuzzleCollections();
    setCollectionsList(updatedCols);
    setShowNewCollectionForm(false);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <Card className="text-center py-20 p-8 max-w-md mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-pv-text-primary mb-1">Access Restricted</h2>
        <p className="text-xs text-pv-text-muted">
          Administrator privileges are required to access this control panel.
        </p>
      </Card>
    );
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcast.trim() || !user) return;
    try {
      await publishSocialActivity({
        userId: user.uid,
        userName: user.displayName || 'PuzzleVerse Admin',
        userAvatar: user.avatarUrl || '',
        activityType: 'announcement',
        details: broadcast.trim(),
        likesCount: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
      });
      setSentMsg(true);
      setBroadcast('');
      toast.success('Broadcast sent to community feed');
      setTimeout(() => setSentMsg(false), 4000);
    } catch (err) {
      console.error('Failed to publish announcement:', err);
      toast.error('Failed to send broadcast');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name.trim()) return;

    const eventToSave: Partial<PuzzleEvent> = {
      name: newEvent.name,
      description: newEvent.description,
      type: newEvent.type,
      status: newEvent.status,
      startAt: new Date(newEvent.startAt).toISOString(),
      endAt: new Date(newEvent.endAt).toISOString(),
      eligibleGames: newEvent.eligibleGames,
      scoreMultiplier: newEvent.scoreMultiplier,
      rules: newEvent.rulesStr
        .split(';')
        .map((r) => r.trim())
        .filter(Boolean),
      rewardConfig: {
        xp: newEvent.xpReward,
        coins: newEvent.coinsReward,
        badgeTitle: newEvent.badgeTitle,
      },
      participationLimit: newEvent.participationLimit,
      featured: true,
    };

    await savePuzzleEvent(eventToSave);
    const updatedEvents = await fetchPuzzleEvents();
    setEvents(updatedEvents);
    setShowNewEventForm(false);
  };

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Admin Panel"
        description="Manage live events, curated playlists, and content moderation."
        action={
          <span className="text-xs bg-pv-surface-soft border border-pv-border text-[#38C6BA] px-3 py-1.5 rounded font-semibold uppercase">
            Admin: {user.displayName || user.username}
          </span>
        }
      />

      {/* Overview Cards (Real data only, no fake counters) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-pv-surface-soft text-[#38C6BA] rounded border border-pv-border">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-pv-text-muted font-medium uppercase">Active Events</p>
            <p className="text-xl font-bold text-pv-text-primary font-tabular">{events.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-pv-surface-soft text-[#38C6BA] rounded border border-pv-border">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-pv-text-muted font-medium uppercase">Playlists</p>
            <p className="text-xl font-bold text-pv-text-primary font-tabular">
              {collectionsList.length}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-pv-surface-soft text-rose-400 rounded border border-pv-border">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-pv-text-muted font-medium uppercase">Flagged Reports</p>
            <p className="text-xl font-bold text-pv-text-primary font-tabular">
              {pendingReportsCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-pv-surface-soft text-emerald-400 rounded border border-pv-border">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-pv-text-muted font-medium uppercase">Firestore Auth</p>
            <p className="text-sm font-semibold text-emerald-400">Connected</p>
          </div>
        </Card>
      </div>

      {/* Events Management Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#38C6BA]" />
            <span>Puzzle Events Management</span>
          </h3>
          <Button
            onClick={() => setShowNewEventForm(!showNewEventForm)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showNewEventForm ? 'Cancel' : 'Create Event'}</span>
          </Button>
        </div>

        {showNewEventForm && (
          <form
            onSubmit={handleCreateEvent}
            className="bg-pv-surface-soft border border-pv-border p-4 rounded-lg space-y-4 text-xs font-medium text-pv-text-secondary"
          >
            <h4 className="text-xs font-bold text-pv-text-primary uppercase tracking-wider">
              Create New Special Event
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-pv-text-secondary">Event Title</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="e.g. Weekend Sprint"
                  className="w-full bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-pv-text-secondary">Event Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
                  className="w-full bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                >
                  <option value="SPEED">SPEED</option>
                  <option value="GAME_FOCUS">GAME FOCUS</option>
                  <option value="SCORE">SCORE</option>
                  <option value="COMMUNITY">COMMUNITY</option>
                  <option value="SEASONAL">SEASONAL</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1 text-pv-text-secondary">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event details..."
                  className="w-full bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                  rows={2}
                />
              </div>
              <div>
                <label className="block mb-1 text-pv-text-secondary">
                  Rules (semicolon separated)
                </label>
                <input
                  type="text"
                  value={newEvent.rulesStr}
                  onChange={(e) => setNewEvent({ ...newEvent, rulesStr: e.target.value })}
                  className="w-full bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                />
              </div>
              <div>
                <label className="block mb-1 text-pv-text-secondary">XP / Coins Reward</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newEvent.xpReward}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, xpReward: parseInt(e.target.value) || 0 })
                    }
                    className="w-1/2 bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary font-tabular focus:outline-none focus:border-pv-border-hover"
                  />
                  <input
                    type="number"
                    value={newEvent.coinsReward}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, coinsReward: parseInt(e.target.value) || 0 })
                    }
                    className="w-1/2 bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary font-tabular focus:outline-none focus:border-pv-border-hover"
                  />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm">
                Save Event
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-pv-surface-soft p-3 rounded-lg border border-pv-border flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-pv-text-primary">{ev.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pv-surface-elevated border border-pv-border uppercase text-[#38C6BA]">
                    {ev.status}
                  </span>
                </div>
                <p className="text-pv-text-muted mt-0.5 text-[11px]">{ev.description}</p>
              </div>
              <span className="text-[#38C6BA] font-semibold font-tabular">
                +{ev.rewardConfig.xp} XP
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Curated Collections Management Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#38C6BA]" />
            <span>Curated Playlists</span>
          </h3>
          <Button
            onClick={() => setShowNewCollectionForm(!showNewCollectionForm)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showNewCollectionForm ? 'Cancel' : 'Create Playlist'}</span>
          </Button>
        </div>

        {showNewCollectionForm && (
          <form
            onSubmit={handleCreateCollection}
            className="bg-pv-surface-soft border border-pv-border p-4 rounded-lg space-y-4 text-xs font-medium text-pv-text-secondary"
          >
            <h4 className="text-xs font-bold text-pv-text-primary uppercase tracking-wider">
              Create Curated Playlist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-pv-text-secondary">Title</label>
                <input
                  type="text"
                  value={newCollection.title}
                  onChange={(e) =>
                    setNewCollection({ ...newCollection, title: e.target.value })
                  }
                  placeholder="e.g. Mastermind Gauntlet"
                  className="w-full bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-pv-text-secondary">Category</label>
                <select
                  value={newCollection.category}
                  onChange={(e) =>
                    setNewCollection({
                      ...newCollection,
                      category: e.target.value as CollectionCategory,
                    })
                  }
                  className="w-full bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Logic">Logic</option>
                  <option value="Speed">Speed</option>
                  <option value="Memory">Memory</option>
                  <option value="Word">Word</option>
                  <option value="Spatial">Spatial</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Challenge">Challenge</option>
                  <option value="Seasonal">Seasonal</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1 text-pv-text-secondary">Description</label>
                <textarea
                  value={newCollection.description}
                  onChange={(e) =>
                    setNewCollection({ ...newCollection, description: e.target.value })
                  }
                  placeholder="Playlist details..."
                  className="w-full bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                  rows={2}
                />
              </div>
              <div>
                <label className="block mb-1 text-pv-text-secondary">XP / Coins Reward</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newCollection.rewardXP}
                    onChange={(e) =>
                      setNewCollection({
                        ...newCollection,
                        rewardXP: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-1/2 bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary font-tabular focus:outline-none focus:border-pv-border-hover"
                  />
                  <input
                    type="number"
                    value={newCollection.rewardCoins}
                    onChange={(e) =>
                      setNewCollection({
                        ...newCollection,
                        rewardCoins: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-1/2 bg-pv-surface-elevated border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary font-tabular focus:outline-none focus:border-pv-border-hover"
                  />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm">
                Save Collection
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {collectionsList.map((col) => (
            <div
              key={col.id}
              className="bg-pv-surface-soft p-3 rounded-lg border border-pv-border flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-pv-text-primary">{col.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pv-surface-elevated border border-pv-border text-pv-text-muted">
                    {col.category}
                  </span>
                </div>
                <p className="text-pv-text-muted mt-0.5 text-[11px]">{col.description}</p>
              </div>
              <span className="text-[#38C6BA] font-semibold font-tabular">
                +{col.rewardXP} XP
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Moderation Queue Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
            <Flag className="w-4 h-4 text-rose-400" />
            <span>Moderation Queue</span>
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-tabular">
            {pendingReportsCount} Pending
          </span>
        </div>

        {loadingReports ? (
          <p className="text-xs text-pv-text-muted">Loading moderation reports...</p>
        ) : reports.length === 0 ? (
          <div className="p-6 bg-pv-surface-soft rounded-lg border border-pv-border text-center text-xs text-pv-text-muted">
            No pending content reports.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-3 bg-pv-surface-soft rounded-lg border border-pv-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-pv-text-primary font-tabular">
                      Report #{rep.id.slice(-6)}
                    </span>
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded uppercase font-semibold text-[10px] border border-rose-500/20">
                      {rep.reason}
                    </span>
                    <span className="px-2 py-0.5 bg-pv-surface-elevated text-pv-text-muted rounded capitalize font-medium text-[10px] border border-pv-border">
                      {rep.targetType}
                    </span>
                  </div>
                  <p className="text-pv-text-muted">Reporter: {rep.reporterName}</p>
                  <p className="text-pv-text-muted text-[11px]">
                    Status:{' '}
                    <strong className="text-pv-text-secondary uppercase">{rep.status}</strong>{' '}
                    {rep.actionTaken && `(${rep.actionTaken})`}
                  </p>
                </div>

                {rep.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={() => handleResolveReport(rep.id, 'dismissed')}
                      variant="ghost"
                      size="sm"
                    >
                      Dismiss
                    </Button>
                    <Button
                      onClick={() => handleResolveReport(rep.id, 'resolved', 'warning')}
                      variant="secondary"
                      size="sm"
                    >
                      Warn
                    </Button>
                    <Button
                      onClick={() => handleResolveReport(rep.id, 'resolved', 'remove_content')}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Broadcast Announcement */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#38C6BA]" />
          <span>Platform Announcement Broadcast</span>
        </h3>

        {sentMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Broadcast published to social feed.
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-3">
          <textarea
            value={broadcast}
            onChange={(e) => setBroadcast(e.target.value)}
            placeholder="Type platform announcement..."
            rows={3}
            className="w-full bg-pv-surface-soft border border-pv-border text-pv-text-primary p-3 rounded-lg text-xs placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
          />
          <Button type="submit" variant="primary" size="sm">
            Send Broadcast
          </Button>
        </form>
      </Card>
    </div>
  );
};
