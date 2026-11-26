import React from 'react';
import { useStore } from '../store/useStore';
import { Home, LayoutGrid, Calendar, Trophy, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'games', label: 'Puzzles', icon: LayoutGrid },
    { id: 'daily', label: 'Daily', icon: Calendar },
    { id: 'leaderboard', label: 'Ranks', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#16131C] border-t border-[#342D3D] px-1 pb-[env(safe-area-inset-bottom)] z-40"
    >
      <div className="flex items-center justify-between h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF4696] ${
                isActive ? 'text-[#FF82B8]' : 'text-[#9F97AB] hover:text-[#F5F3F7]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-3 right-3 h-[2px] rounded-b bg-[#FF4696]"
                />
              )}
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
