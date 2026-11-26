import React from 'react';
import { useStore } from '../store/useStore';
import { Home, LayoutGrid, Calendar, BarChart3, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useStore();

  const isProgressTab = ['mastery', 'mastery_practice', 'journey', 'achievements', 'goals', 'insights'].includes(
    activeTab
  );

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, active: activeTab === 'dashboard' },
    { id: 'games', label: 'Games', icon: LayoutGrid, active: activeTab === 'games' },
    { id: 'daily', label: 'Daily', icon: Calendar, active: activeTab === 'daily' },
    { id: 'mastery', label: 'Progress', icon: BarChart3, active: isProgressTab },
    { id: 'profile', label: 'Profile', icon: User, active: activeTab === 'profile' || activeTab === 'settings' },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1C2D3B] border-t border-[#36515F] px-1 pb-[env(safe-area-inset-bottom)] z-40"
    >
      <div className="flex items-center justify-between h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38C6BA] ${
                isActive ? 'text-[#38C6BA]' : 'text-[#B4C3CE] hover:text-[#F5F7F8]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-3 right-3 h-[2.5px] rounded-b bg-[#38C6BA]"
                />
              )}
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="text-[11px] font-semibold leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
