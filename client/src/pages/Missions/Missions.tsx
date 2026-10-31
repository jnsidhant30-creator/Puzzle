import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Target, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  getActiveMissions, 
  getUserMissionProgress 
} from '../../services/missionService';
import type { MissionDefinition, PlayerMissionProgress } from '../../services/missionService';

export const Missions = () => {
  const { user } = useAuthStore();
  const [activeMissions, setActiveMissions] = useState<MissionDefinition[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, PlayerMissionProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      if (!user) return;
      try {
        const missions = getActiveMissions();
        setActiveMissions(missions);

        const progress = await getUserMissionProgress(user.uid);
        const map = new Map<string, PlayerMissionProgress>();
        progress.forEach(p => {
          map.set(`${p.period}_${p.missionId}`, p);
        });
        setProgressMap(map);
      } catch (err) {
        console.error("Failed to load missions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dailyMissions = activeMissions.filter(m => m.frequency === 'daily');
  const weeklyMissions = activeMissions.filter(m => m.frequency === 'weekly');

  const renderMission = (m: MissionDefinition, p?: PlayerMissionProgress) => {
    const currentProg = p?.progress || 0;
    const isCompleted = p?.completed || false;
    const progressPercent = Math.min(100, Math.max(0, (currentProg / m.target) * 100));

    return (
      <div key={m.id} className={`p-4 rounded-lg border flex flex-col gap-3 transition-colors ${isCompleted ? 'bg-primary/5 border-primary/20' : 'bg-surface border-border'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-textMuted shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className={`font-semibold text-sm md:text-base ${isCompleted ? 'text-textMain' : 'text-textMain'}`}>{m.name}</h4>
              <p className="text-textMuted text-xs md:text-sm">{m.description}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-accent font-bold text-sm">+{m.rewardXp} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-primary' : 'bg-primary/50'}`} 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
          <span className="text-xs font-mono text-textMuted shrink-0">
            {currentProg} / {m.target}
          </span>
        </div>
      </div>
    );
  };

  const getProgress = (m: MissionDefinition) => {
    // We don't have the exact period string locally without calling getDailyPeriod/getWeeklyPeriod,
    // but we can just match by missionId since progressMap only contains active periods.
    return Array.from(progressMap.values()).find(p => p.missionId === m.id);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Target className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-textMain">Missions</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Daily Missions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-textMain flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" /> Daily Missions
            </h2>
          </div>
          <Card className="glass border-border/50">
            <CardContent className="p-4 space-y-3">
              {dailyMissions.map(m => renderMission(m, getProgress(m)))}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Missions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-textMain flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Weekly Missions
            </h2>
          </div>
          <Card className="glass border-border/50">
            <CardContent className="p-4 space-y-3">
              {weeklyMissions.map(m => renderMission(m, getProgress(m)))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
