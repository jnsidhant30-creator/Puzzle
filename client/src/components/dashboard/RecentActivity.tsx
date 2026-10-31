import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Activity, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getRecentGames } from '../../services/gameResultService';

export const RecentActivity = () => {
  const { profile } = useAuthStore();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      if (profile) {
        try {
          const recent = await getRecentGames(profile.uid, 5);
          setActivities(recent);
        } catch (err) {
          console.error('Failed to load recent activity', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchActivity();
  }, [profile]);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' mins ago';
    return Math.floor(seconds) + ' seconds ago';
  };

  const getGameName = (type: string) => {
    const names: Record<string, string> = {
      'NUM': 'Number Puzzle',
      'WRD': 'Word Puzzle',
      'MEM': 'Memory Puzzle',
      'SLD': 'Sliding Puzzle',
      'LGC': 'Logic Puzzle',
      'PTR': 'Pattern Puzzle',
      'ARR': 'Arrow Path',
      'MAZ': 'Maze Escape',
      'LSR': 'Laser Mirror',
      'PIP': 'Pipe Connect',
      'CLR': 'Color Path',
      'BLK': 'Block Escape',
      'NPT': 'Number Path',
      'ROT': 'Rotating Tiles',
      'WGD': 'Word Grid'
    };
    return names[type] || type;
  };

  return (
    <Card className="bg-surface/50 border border-border hover:border-primary/30 transition-colors group">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg text-textMain">
          <Activity className="w-5 h-5 text-primary" /> 
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-textMuted text-sm font-medium">No recent activity yet.</p>
            <p className="text-textMuted text-xs mt-1">Start playing to build your history!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start justify-between group/item">
                <div className="flex items-center gap-3">
                  {activity.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-error shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-textMain">
                      {activity.status === 'COMPLETED' ? 'Completed' : 'Failed'} <span className="font-bold">{getGameName(activity.puzzleType)}</span>
                    </p>
                    <p className="text-xs text-textMuted">{formatTimeAgo(activity.createdAt)}</p>
                  </div>
                </div>
                {activity.xpEarned > 0 && (
                  <span className="text-sm font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded transition-transform group-hover/item:scale-105">+{activity.xpEarned} XP</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
