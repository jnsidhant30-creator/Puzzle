import { useAuthStore } from '../../store/useAuthStore';

export const QuickStatsSidebar = () => {
  const { profile } = useAuthStore();

  return (
    <div className="bg-surface/50 rounded-3xl border border-border p-6 shadow-sm hover:-translate-y-1 hover:border-primary/30 transition-all duration-300">
      <h3 className="text-sm font-bold uppercase tracking-wider text-textMuted mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        QUICK STATS
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        <div>
          <span className="text-xs text-textMuted uppercase font-bold tracking-wider block mb-1">Games Played</span>
          <span className="font-mono font-black text-xl text-textMain">{profile?.totalGames?.toLocaleString() || 0}</span>
        </div>
        <div>
          <span className="text-xs text-textMuted uppercase font-bold tracking-wider block mb-1">XP Earned</span>
          <span className="font-mono font-black text-xl text-primary">{profile?.xp?.toLocaleString() || 0}</span>
        </div>
        
        <div className="col-span-2 h-px bg-border/50 my-1" />
        
        <div>
          <span className="text-xs text-textMuted uppercase font-bold tracking-wider block mb-1">Best Score</span>
          <span className="font-mono font-black text-xl text-warning">{profile?.bestScore?.toLocaleString() || 0}</span>
        </div>
        <div>
          <span className="text-xs text-textMuted uppercase font-bold tracking-wider block mb-1">Current Streak</span>
          <span className="font-mono font-black text-xl text-error">{profile?.currentStreak || 0} <span className="text-xs font-medium">days</span></span>
        </div>
      </div>
    </div>
  );
};
