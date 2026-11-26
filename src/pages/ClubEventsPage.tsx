import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  ArrowLeft,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import { Club, ClubEvent, ClubEventType, PuzzleType } from '../types';
import {
  fetchClubById,
  fetchClubEvents,
  createClubEvent,
  cancelClubEvent,
  rsvpClubEvent,
  fetchUserEventRsvp,
} from '../services/firebase';
import { Card, PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ClubEventsPage: React.FC = () => {
  const {
    user,
    selectedClubId,
    viewClubDetail,
    viewClubsHub,
    playGame,
    setActiveTab: storeSetActiveTab,
  } = useStore();
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'today' | 'past' | 'my_events'>('upcoming');
  const [userRsvps, setUserRsvps] = useState<Record<string, 'participating' | 'interested'>>({});

  /* Create Event Modal State */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<ClubEventType>('puzzle_night');
  const [puzzleFocus, setPuzzleFocus] = useState<PuzzleType | 'all'>('all');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90000000).toISOString().slice(0, 16)
  );
  const [linkedActivityType, setLinkedActivityType] = useState<
    'game' | 'mastery' | 'journey' | 'goals'
  >('game');
  const [linkedActivityId, setLinkedActivityId] = useState<string>('logic');

  useEffect(() => {
    if (selectedClubId) {
      loadData(selectedClubId);
    }
  }, [selectedClubId, user]);

  const loadData = async (cId: string) => {
    setLoading(true);
    try {
      const c = await fetchClubById(cId);
      setClub(c);
      const evs = await fetchClubEvents(cId);
      setEvents(evs);

      if (user) {
        const rsvpMap: Record<string, 'participating' | 'interested'> = {};
        for (const ev of evs) {
          const r = await fetchUserEventRsvp(cId, ev.id, user.uid);
          if (r) rsvpMap[ev.id] = r;
        }
        setUserRsvps(rsvpMap);
      }
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !club || !title.trim()) return;

    try {
      const newEvId = await createClubEvent(club.id, {
        clubId: club.id,
        title: title.trim(),
        description: description.trim() || 'Club group puzzle session.',
        eventType,
        puzzleFocus,
        startAt: new Date(startDate).toISOString(),
        endAt: new Date(endDate).toISOString(),
        createdBy: user.uid,
        createdByName: user.displayName || user.username || 'Member',
        status: 'scheduled',
        linkedActivityType,
        linkedActivityId: linkedActivityType === 'game' ? linkedActivityId : undefined,
      });

      if (newEvId) {
        const updatedEvs = await fetchClubEvents(club.id);
        setEvents(updatedEvs);
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const handleRsvp = async (eventId: string, status: 'participating' | 'interested') => {
    if (!user || !club) return;
    try {
      await rsvpClubEvent(
        club.id,
        eventId,
        user.uid,
        user.displayName || user.username || 'Member',
        user.avatarUrl || '',
        status
      );
      setUserRsvps((prev) => ({ ...prev, [eventId]: status }));
      const updatedEvs = await fetchClubEvents(club.id);
      setEvents(updatedEvs);
    } catch (err) {
      console.error('Failed to RSVP:', err);
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    if (!club) return;
    try {
      await cancelClubEvent(club.id, eventId);
      const updatedEvs = await fetchClubEvents(club.id);
      setEvents(updatedEvs);
    } catch (err) {
      console.error('Failed to cancel event:', err);
    }
  };

  const handleLaunchActivity = (ev: ClubEvent) => {
    if (ev.linkedActivityType === 'game' && ev.linkedActivityId) {
      playGame(ev.linkedActivityId as PuzzleType);
    } else if (ev.linkedActivityType === 'mastery') {
      storeSetActiveTab('mastery');
    } else if (ev.linkedActivityType === 'journey') {
      storeSetActiveTab('journey');
    } else if (ev.linkedActivityType === 'goals') {
      storeSetActiveTab('goals');
    } else {
      playGame('logic');
    }
  };

  const nowTime = new Date().getTime();
  const filteredEvents = events.filter((ev) => {
    const startTime = new Date(ev.startAt).getTime();
    const endTime = new Date(ev.endAt).getTime();
    const isToday = new Date(ev.startAt).toDateString() === new Date().toDateString();

    if (activeTab === 'upcoming') {
      return startTime > nowTime && ev.status !== 'cancelled';
    }
    if (activeTab === 'today') {
      return isToday && ev.status !== 'cancelled';
    }
    if (activeTab === 'past') {
      return endTime < nowTime || ev.status === 'completed' || ev.status === 'cancelled';
    }
    if (activeTab === 'my_events') {
      return userRsvps[ev.id] || ev.createdBy === user?.uid;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-12">
        <div className="h-32 bg-pv-surface-soft border border-pv-border rounded-lg" />
        <div className="h-64 bg-pv-surface-soft border border-pv-border rounded-lg" />
      </div>
    );
  }

  if (!club) {
    return (
      <Card className="text-center py-16 space-y-4 max-w-md mx-auto">
        <CalendarIcon className="w-10 h-10 text-pv-text-muted mx-auto" />
        <h2 className="text-lg font-bold text-pv-text-primary">Club Not Found</h2>
        <Button onClick={viewClubsHub} variant="secondary" size="sm">
          Return to Clubs
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header breadcrumb */}
      <div>
        <button
          onClick={() => viewClubDetail(club.id)}
          className="inline-flex items-center gap-1.5 text-xs text-pv-text-muted hover:text-pv-text-primary transition-colors font-medium mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {club.name}
        </button>
        <PageHeader
          title={`${club.name} Events`}
          description={`[${club.tag}] Calendar: Community puzzle sessions, team sprints, and practice nights.`}
          action={
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Event</span>
            </Button>
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-pv-border pb-2 overflow-x-auto">
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'today', label: 'Today' },
          { id: 'past', label: 'Past' },
          { id: 'my_events', label: 'My RSVPs' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#38C6BA] text-[#142331] font-semibold'
                  : 'text-pv-text-muted hover:text-pv-text-primary hover:bg-pv-surface-soft'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Event Cards Grid */}
      {filteredEvents.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <CalendarIcon className="w-10 h-10 text-pv-text-muted mx-auto" />
          <h3 className="text-sm font-semibold text-pv-text-primary">No events in this category</h3>
          <p className="text-xs text-pv-text-muted max-w-xs mx-auto">
            Schedule a new club puzzle night or practice sprint for your teammates.
          </p>
          <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm">
            Schedule Event
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => {
            const userRsvp = userRsvps[ev.id];
            const isCreator = ev.createdBy === user?.uid;

            return (
              <Card
                key={ev.id}
                className="p-5 space-y-4 flex flex-col justify-between hover:border-pv-border-hover transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-pv-surface-soft border border-pv-border text-[#38C6BA] font-semibold uppercase text-[10px]">
                      {ev.eventType.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase ${
                        ev.status === 'cancelled'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : ev.status === 'completed'
                          ? 'bg-pv-surface-soft text-pv-text-muted'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-pv-text-primary">{ev.title}</h3>
                    <p className="text-xs text-pv-text-secondary leading-relaxed mt-1">
                      {ev.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-pv-text-muted pt-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#38C6BA] shrink-0" />
                      <span className="font-tabular">
                        {new Date(ev.startAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#38C6BA] shrink-0" />
                      <span className="font-tabular">
                        {ev.participantCount} Attending • {ev.interestedCount} Interested
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-pv-border pt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRsvp(ev.id, 'participating')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        userRsvp === 'participating'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-pv-surface-soft text-pv-text-muted hover:text-pv-text-primary border border-pv-border'
                      }`}
                    >
                      {userRsvp === 'participating' ? 'Attending' : 'Attend'}
                    </button>
                    <button
                      onClick={() => handleRsvp(ev.id, 'interested')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        userRsvp === 'interested'
                          ? 'bg-[#38C6BA]/10 text-[#38C6BA] border border-[#38C6BA]/20'
                          : 'bg-pv-surface-soft text-pv-text-muted hover:text-pv-text-primary border border-pv-border'
                      }`}
                    >
                      Interested
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleLaunchActivity(ev)}
                      variant="primary"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Launch</span>
                    </Button>
                    {isCreator && ev.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelEvent(ev.id)}
                        className="p-1.5 text-pv-text-muted hover:text-rose-400 transition-colors"
                        title="Cancel Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-pv-border pb-3">
              <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#38C6BA]" />
                <span>Schedule Club Event</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-pv-text-muted hover:text-pv-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Logic Practice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief overview..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary placeholder:text-pv-text-muted focus:outline-none focus:border-pv-border-hover"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                  >
                    <option value="puzzle_night">Puzzle Night</option>
                    <option value="practice_session">Practice Session</option>
                    <option value="club_challenge">Club Challenge</option>
                    <option value="mastery_practice">Mastery Practice</option>
                    <option value="competition">Competition Sprint</option>
                    <option value="meetup">Community Meetup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                    Game Focus
                  </label>
                  <select
                    value={puzzleFocus}
                    onChange={(e) => setPuzzleFocus(e.target.value as any)}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover capitalize"
                  >
                    <option value="all">All Games</option>
                    <option value="logic">Logic Puzzle</option>
                    <option value="number">Number Puzzle</option>
                    <option value="arrow_path">Arrow Path</option>
                    <option value="laser_mirror">Laser Mirror</option>
                    <option value="pipe_connect">Pipe Connect</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-pv-text-secondary mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-pv-surface-soft border border-pv-border rounded-lg px-3 py-2 text-xs text-pv-text-primary focus:outline-none focus:border-pv-border-hover"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-pv-border">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Schedule Event
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
