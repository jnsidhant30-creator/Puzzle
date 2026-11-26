import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { PuzzleEvent, UserEventProgress } from '../types';
import { fetchPuzzleEvents, fetchUserEventProgress } from '../services/firebase';
import { Zap, Award, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { PageHeader, Card } from '../components/ui/Card';

export const EventsPage: React.FC = () => {
  const { user, viewEventDetail } = useStore();
  const [events, setEvents] = useState<PuzzleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProgressMap, setUserProgressMap] = useState<Record<string, UserEventProgress>>({});
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'completed' | 'all'>('active');

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      const data = await fetchPuzzleEvents();
      setEvents(data);
      if (user) {
        const progressMap: Record<string, UserEventProgress> = {};
        for (const ev of data) {
          const prog = await fetchUserEventProgress(user.uid, ev.id);
          if (prog) progressMap[ev.id] = prog;
        }
        setUserProgressMap(progressMap);
      }
      setLoading(false);
    }
    loadEvents();
  }, [user]);

  const displayedEvents = events.filter((e) => {
    if (filter === 'active') return e.status === 'active';
    if (filter === 'upcoming') return e.status === 'upcoming';
    if (filter === 'completed') return e.status === 'completed';
    return true;
  });

  const getTimeRemaining = (endAt: string) => {
    const diff = new Date(endAt).getTime() - Date.now();
    if (diff <= 0) return 'Concluded';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return days > 0 ? `${days}d ${remHours}h left` : `${hours}h left`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Limited-Time Events"
        description="Participate in seasonal tournaments and limited-window puzzle sprints."
        action={
          <div className="flex items-center gap-1 bg-pv-surface-primary p-1 rounded-lg border border-pv-border shrink-0">
            {(['active', 'upcoming', 'completed', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 h-7 rounded text-xs font-medium uppercase transition-colors ${
                  filter === f
                    ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong font-semibold'
                    : 'text-pv-text-secondary hover:text-pv-text-primary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <Card className="py-16 text-center">
          <div className="w-6 h-6 border-2 border-pv-dragon-fruit border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-pv-text-secondary font-medium">Loading events...</p>
        </Card>
      ) : displayedEvents.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-pv-text-muted mx-auto" />
          <h3 className="text-base font-semibold text-pv-text-primary">No events in this category</h3>
          <p className="text-xs text-pv-text-secondary max-w-sm mx-auto">
            There are currently no events matching the selected filter. Check back soon for upcoming tournaments.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedEvents.map((event) => {
            const prog = userProgressMap[event.id];
            const target = event.participationLimit || 3;
            const currentAttempts = prog?.attemptsCount || 0;
            const pct = Math.min(100, Math.round((currentAttempts / target) * 100));

            return (
              <Card
                key={event.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-pv-border-strong transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                        event.status === 'active'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40'
                          : 'bg-pv-surface-secondary text-pv-text-muted border border-pv-border'
                      }`}
                    >
                      {event.status === 'active' ? 'Active' : event.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-pv-text-muted font-tabular">
                      <Clock className="w-3.5 h-3.5 text-pv-dragon-fruit" />
                      <span>{getTimeRemaining(event.endAt)}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-pv-text-primary">{event.name}</h3>
                  <p className="text-xs text-pv-text-secondary mt-1 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-medium text-pv-text-muted uppercase mr-1">
                      Modes:
                    </span>
                    {event.eligibleGames.map((g) => (
                      <span
                        key={g}
                        className="bg-pv-surface-secondary text-pv-text-secondary border border-pv-border px-2 py-0.5 rounded text-[10px] font-medium capitalize"
                      >
                        {g.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  {prog && (
                    <div className="mt-4 bg-pv-surface-secondary p-3 rounded-lg border border-pv-border space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-pv-text-secondary">Progress</span>
                        <span className="text-pv-text-primary font-tabular">
                          {currentAttempts} / {target} completed
                        </span>
                      </div>
                      <div className="w-full bg-pv-surface-primary h-1.5 rounded-full overflow-hidden border border-pv-border">
                        <div
                          className="bg-pv-dragon-fruit h-full transition-all duration-300 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-pv-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1 text-pv-text-secondary">
                      <Zap className="w-3 h-3 text-pv-dragon-fruit" /> +{event.rewardConfig.xp} XP
                    </span>
                    <span className="flex items-center gap-1 text-pv-text-secondary">
                      <Award className="w-3 h-3 text-pv-dragon-fruit" /> +{event.rewardConfig.coins} coins
                    </span>
                  </div>

                  <button
                    onClick={() => viewEventDetail(event.id)}
                    className="h-8 px-3 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>View Event</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
