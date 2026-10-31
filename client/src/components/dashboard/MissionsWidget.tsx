import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Target, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  getActiveMissions, 
  getUserMissionProgress 
} from '../../services/missionService';
import type { MissionDefinition, PlayerMissionProgress } from '../../services/missionService';

export const MissionsWidget = () => {
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
      <Card className="glass border-border/50 h-full flex flex-col">
        <CardHeader className="pb-3 border-b border-border/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Missions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-6">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Only show up to 3 daily missions in the widget
  const dailyMissions = activeMissions.filter(m => m.frequency === 'daily').slice(0, 3);
  let completedCount = 0;

  dailyMissions.forEach(m => {
    const p = Array.from(progressMap.values()).find(prog => prog.missionId === m.id);
    if (p?.completed) completedCount++;
  });

  return (
    <Card className="glass border-border/50 h-full flex flex-col group relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      
      <CardHeader className="pb-3 border-b border-border/10 relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Daily Missions
            </CardTitle>
            <CardDescription className="text-xs mt-1 text-textMuted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {completedCount} / {dailyMissions.length} Completed
            </CardDescription>
          </div>
          <Link 
            to="/missions" 
            className="text-xs text-primary hover:text-primary/80 flex items-center font-medium"
          >
            View All <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 relative">
        <div className="divide-y divide-border/10">
          {dailyMissions.map(m => {
            const p = Array.from(progressMap.values()).find(prog => prog.missionId === m.id);
            const currentProg = p?.progress || 0;
            const isCompleted = p?.completed || false;
            const progressPercent = Math.min(100, Math.max(0, (currentProg / m.target) * 100));

            return (
              <div key={m.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                    )}
                    <span className={`text-sm font-medium line-clamp-1 ${isCompleted ? 'text-textMuted' : 'text-textMain'}`}>
                      {m.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-textMuted shrink-0">
                    {currentProg}/{m.target}
                  </span>
                </div>
                
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden ml-6 max-w-[calc(100%-1.5rem)]">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-primary' : 'bg-primary/50'}`} 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
