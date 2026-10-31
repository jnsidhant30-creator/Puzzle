import React from 'react';
import { useStore } from '../store/useStore';
import { LayoutDashboard, Gamepad2, Trophy, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'games', label: 'Puzzles', icon: Gamepad2 },
    { id: 'leaderboard', label: 'Compete', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-pv-surface-primary border-t border-pv-border-violet px-2 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex items-center justify-between h-[64px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-pv-dragon-fruit' : 'text-pv-text-secondary hover:text-white'
              }`}
            >
              <Icon className={`w-[22px] h-[22px] ${isActive ? 'fill-pv-dragon-fruit/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
