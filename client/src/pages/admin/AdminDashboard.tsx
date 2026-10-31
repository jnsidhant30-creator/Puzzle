import { useEffect, useState } from 'react';
import { getPlatformStats } from '../../services/adminService';
import { Users, Gamepad2, Puzzle, Calendar, Trophy, BarChart3, ChevronRight, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getPlatformStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-textMuted flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      Loading dashboard metrics...
    </div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain">Admin Control Center</h1>
      </div>

      {/* Analytics Callout */}
      <div className="bg-gradient-to-r from-primary/20 to-surface border border-primary/30 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-black/20">
        <div>
          <h2 className="text-lg font-bold text-textMain flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Platform Analytics
          </h2>
          <p className="text-sm text-textMuted mt-1">View detailed insights on player activity, game popularity, and difficulty distribution.</p>
        </div>
        <Link 
          to="/admin/analytics" 
          className="shrink-0 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primaryLight transition-colors"
        >
          View Analytics <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Core Metrics */}
      <h2 className="text-lg font-bold text-textMain mt-8">Core Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
            <Users className="w-4 h-4 text-primary" /> Total Players
          </div>
          <div className="text-2xl font-bold text-textMain">{stats?.totalUsers || 0}</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
            <Activity className="w-4 h-4 text-secondary" /> Active Players (7d)
          </div>
          <div className="text-2xl font-bold text-textMain">{stats?.activePlayers || 0}</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
            <Gamepad2 className="w-4 h-4 text-accent" /> Total Games Played
          </div>
          <div className="text-2xl font-bold text-textMain">{stats?.totalGames || 0}</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
            <Puzzle className="w-4 h-4 text-warning" /> Total Puzzles
          </div>
          <div className="text-2xl font-bold text-textMain">{stats?.totalPuzzles || 0}</div>
        </div>
      </div>

      {/* Activity Metrics */}
      <h2 className="text-lg font-bold text-textMain mt-8">Today's Activity</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
            <Gamepad2 className="w-4 h-4 text-accent" /> Total Games Today
          </div>
          <div className="text-2xl font-bold text-textMain">{stats?.gamesToday || 0}</div>
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
            <Calendar className="w-4 h-4 text-primary" /> Daily Challenge Activity
          </div>
          <div className="text-2xl font-bold text-textMain">{stats?.dailyChallengeActivity || 0}</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 text-textMuted text-sm font-medium">
            <Trophy className="w-4 h-4 text-warning" /> Weekly Comp Activity
          </div>
          <div className="text-2xl font-bold text-textMain">{stats?.weeklyCompetitionActivity || 0}</div>
        </div>
      </div>

      {/* Administrative Operations */}
      <h2 className="text-lg font-bold text-textMain mt-8">Operations & Alerts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/admin/reports" className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-error/50 transition-colors group">
          <div className="flex items-center gap-2 text-textMuted text-sm font-medium group-hover:text-error transition-colors">
            <AlertCircle className="w-4 h-4" /> Reported Content
          </div>
          <div className="text-2xl font-bold text-textMain group-hover:text-error transition-colors">{stats?.reportedContent || 0}</div>
        </Link>
        
        <Link to="/admin/reports" className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-warning/50 transition-colors group">
          <div className="flex items-center gap-2 text-textMuted text-sm font-medium group-hover:text-warning transition-colors">
            <Clock className="w-4 h-4" /> Pending Admin Actions
          </div>
          <div className="text-2xl font-bold text-textMain group-hover:text-warning transition-colors">{stats?.pendingActions || 0}</div>
        </Link>

        <Link to="/admin/audit-logs" className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary/50 transition-colors group">
          <div className="flex items-center gap-2 text-textMuted text-sm font-medium group-hover:text-primary transition-colors">
            <ShieldAlert className="w-4 h-4" /> Recent Audit Logs
          </div>
          <div className="text-sm text-textMuted mt-1">Review administrative actions</div>
        </Link>
      </div>

    </div>
  );
};

// Internal component for Activity icon
const Activity = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
