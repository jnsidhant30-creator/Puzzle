import { useEffect, useState } from 'react';
import type { Achievement } from '../../services/achievementService';

export const AchievementToast = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleUnlock = (event: CustomEvent<Achievement[]>) => {
      if (event.detail && event.detail.length > 0) {
        setAchievements(event.detail);
        setVisible(true);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setVisible(false);
          // Wait for animation to finish before clearing
          setTimeout(() => setAchievements([]), 500);
        }, 5000);
      }
    };

    window.addEventListener('achievementsUnlocked' as any, handleUnlock);
    return () => {
      window.removeEventListener('achievementsUnlocked' as any, handleUnlock);
    };
  }, []);

  if (achievements.length === 0) return null;

  const isMultiple = achievements.length > 1;
  const primary = achievements[0];

  return (
    <div 
      className={`fixed top-6 right-6 z-50 transition-all duration-500 transform ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-surface border border-accent/50 p-4 rounded-xl shadow-2xl shadow-accent/20 w-80 max-w-[calc(100vw-32px)]">
        <div className="flex items-start gap-4">
          <div className="text-4xl bg-accent/10 p-2 rounded-lg border border-accent/20">
            {isMultiple ? '🏆' : primary.icon}
          </div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase text-accent tracking-wider mb-1">
              {isMultiple ? `${achievements.length} Achievements Unlocked!` : 'Achievement Unlocked!'}
            </p>
            <h3 className="font-bold text-textMain text-lg leading-tight">
              {isMultiple ? 'Multiple Rewards' : primary.name}
            </h3>
            <p className="text-xs text-textMuted mt-1 leading-snug">
              {isMultiple ? 'You unlocked several achievements.' : primary.description}
            </p>
            
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary text-xs font-bold px-2 py-1 rounded">
                +{isMultiple ? achievements.reduce((acc, a) => acc + a.xpReward, 0) : primary.xpReward} XP
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
