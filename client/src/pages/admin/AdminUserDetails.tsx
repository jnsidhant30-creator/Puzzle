import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminUserDetails } from '../../services/adminService';
import type { UserProfile } from '../../services/authService';
import { ArrowLeft, Trophy, Gamepad2, Flame, Star } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminUserDetails = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const fetchUser = async () => {
      try {
        const data = await getAdminUserDetails(uid);
        setUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [uid]);

  if (loading) return <div className="p-8 text-center text-textMuted">Loading user details...</div>;
  if (!user) return <div className="p-8 text-center text-error">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/admin/players')}
        className="flex items-center gap-2 text-sm text-textMuted hover:text-textMain transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Players
      </button>

      <div className="bg-surface border border-border rounded-xl p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="w-24 h-24 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-4xl shrink-0">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-textMain">{user.username}</h1>
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              user.role === 'ADMIN' ? "bg-accent/10 text-accent" : "bg-surfaceHover text-textMuted"
            )}>
              {user.role}
            </span>
          </div>
          <p className="text-textMuted">UID: {user.uid}</p>
          {user.displayName && <p className="text-textMuted">Display Name: {user.displayName}</p>}
        </div>
        <div className="text-right">
          <div className="text-xs text-textMuted uppercase tracking-wider font-semibold mb-1">Joined</div>
          <div className="text-textMain">
            {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Star className="w-5 h-5" />
            <span className="font-semibold text-sm">Level {user.level || 1}</span>
          </div>
          <div className="text-2xl font-bold text-textMain">{user.xp?.toLocaleString() || 0}</div>
          <div className="text-xs text-textMuted">Total XP</div>
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Gamepad2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Games</span>
          </div>
          <div className="text-2xl font-bold text-textMain">{user.totalGames || 0}</div>
          <div className="text-xs text-textMuted">{user.totalWins || 0} Wins</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-warning mb-2">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold text-sm">Best Score</span>
          </div>
          <div className="text-2xl font-bold text-textMain">{user.bestScore || 0}</div>
          <div className="text-xs text-textMuted">Points</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-error mb-2">
            <Flame className="w-5 h-5" />
            <span className="font-semibold text-sm">Streak</span>
          </div>
          <div className="text-2xl font-bold text-textMain">{user.currentStreak || 0}</div>
          <div className="text-xs text-textMuted">Best: {user.longestStreak || 0}</div>
        </div>
      </div>

      <div className="bg-warning/10 border border-warning/20 rounded-xl p-6">
        <h2 className="text-lg font-bold text-warning mb-2">Administrative Actions</h2>
        <p className="text-sm text-textMuted mb-4">
          Direct modification of user XP, level, score, wins, or streaks through the client UI is disabled for security and integrity. Role modification (PLAYER → ADMIN) must be performed securely via Firebase Cloud Functions or the Firebase Console.
        </p>
        <button disabled className="px-4 py-2 bg-surfaceHover text-textMuted rounded-lg text-sm font-medium cursor-not-allowed opacity-50">
          Cloud Function Required
        </button>
      </div>
    </div>
  );
};
