

interface XPProgressProps {
  level: number;
  xp: number;
}

export const XPProgress = ({ level, xp }: XPProgressProps) => {
  // Simple calculation: each level requires level * 100 XP
  // e.g. Level 1 -> 2: 100 XP
  // Level 2 -> 3: 200 XP
  // Current XP floor is sum of previous levels
  // For UI sake, let's just use a simpler formula for now, 
  // or just mock the nextLevelXp if not provided.
  const baseXP = (level - 1) * 1000;
  const nextLevelXP = level * 1000;
  const currentLevelProgress = Math.max(0, xp - baseXP);
  const requiredForNext = nextLevelXP - baseXP;
  
  const percentage = Math.min(100, Math.max(0, (currentLevelProgress / requiredForNext) * 100));

  return (
    <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm w-full">
      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
        <span className="font-bold text-primary text-lg">{level}</span>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1 text-sm">
          <span className="font-bold text-textMain uppercase tracking-wider text-xs">Level {level}</span>
          <span className="text-textMuted font-medium text-xs">{xp} / {nextLevelXP} XP</span>
        </div>
        <div className="h-2.5 bg-background rounded-full overflow-hidden border border-border/50">
          <div 
            className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-[10px] text-textMuted mt-1.5 font-medium">{nextLevelXP - xp} XP to Level {level + 1}</p>
      </div>
    </div>
  );
};
