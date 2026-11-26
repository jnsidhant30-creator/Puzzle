import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { BrandLogo } from './BrandLogo';
import {
  Home,
  LayoutGrid,
  Calendar,
  Swords,
  Trophy,
  Compass,
  Gauge,
  Award,
  Target,
  BarChart3,
  Users,
  Shield,
  Sparkles,
  BookOpen,
  Layers,
  User,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  Blocks,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    user,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useStore();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'play-nav': true,
    'progress-nav': true,
    'community-nav': true,
    'discover-nav': true,
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (isMobileMenuOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  const navGroups = [
    {
      id: 'play-nav',
      title: 'Play',
      items: [
        { id: 'dashboard', label: 'Home', icon: Home },
        { id: 'games', label: 'Puzzle Library', icon: LayoutGrid },
        { id: 'daily', label: 'Daily Puzzle', icon: Calendar },
        { id: 'challenges', label: 'Challenges', icon: Swords },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
      ],
    },
    {
      id: 'progress-nav',
      title: 'Progress',
      items: [
        { id: 'journey', label: 'Journey', icon: Compass },
        { id: 'mastery', label: 'Mastery', icon: Gauge },
        { id: 'achievements', label: 'Achievements', icon: Award },
        { id: 'goals', label: 'Daily Goals', icon: Target },
        { id: 'insights', label: 'Insights', icon: BarChart3 },
      ],
    },
    {
      id: 'community-nav',
      title: 'Community',
      items: [
        { id: 'friends', label: 'Friends', icon: Users },
        { id: 'clubs', label: 'Clubs', icon: Shield },
        { id: 'community', label: 'Custom Levels', icon: Blocks },
        { id: 'events', label: 'Events', icon: Sparkles },
      ],
    },
    {
      id: 'discover-nav',
      title: 'Discover',
      items: [
        { id: 'learn', label: 'Learn', icon: BookOpen },
        { id: 'collections', label: 'Collections', icon: Layers },
      ],
    },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId as any);
    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="Primary Navigation"
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 flex flex-col bg-[#16131C] border-r border-[#342D3D] h-[100dvh] transition-all duration-150 shrink-0 ${
          isSidebarCollapsed ? 'w-[240px] lg:w-[68px]' : 'w-[240px]'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand Row */}
        <div
          className={`h-14 px-4 flex items-center border-b border-[#342D3D] shrink-0 ${
            isSidebarCollapsed ? 'lg:justify-center justify-between' : 'justify-between'
          }`}
        >
          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4696] rounded-md"
            title="PuzzleVerse Home"
          >
            <BrandLogo size={28} showWordmark={!isSidebarCollapsed} />
          </button>

          <button
            className="lg:hidden p-2 -mr-1 text-[#B9B3C2] hover:text-[#F5F3F7] rounded-lg hover:bg-[#24202C] transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto scrollbar-none px-2.5 py-2 space-y-2.5">
          {navGroups.map((group) => {
            const isExpanded = isSidebarCollapsed ? true : expandedGroups[group.id];
            return (
              <section key={group.id} aria-labelledby={group.id}>
                {!isSidebarCollapsed && (
                  <button
                    type="button"
                    id={group.id}
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`${group.id}-items`}
                    className="w-full flex items-center justify-between px-2.5 py-0.5 mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#9F97AB] hover:text-[#B9B3C2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4696] rounded"
                  >
                    <span>{group.title}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {isExpanded && (
                  <div id={`${group.id}-items`} className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        activeTab === item.id ||
                        (item.id === 'clubs' && activeTab.startsWith('club_')) ||
                        (item.id === 'collections' && activeTab === 'collection_detail') ||
                        (item.id === 'events' && activeTab === 'event_detail') ||
                        (item.id === 'mastery' && activeTab === 'mastery_practice');

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          title={isSidebarCollapsed ? item.label : undefined}
                          className={`relative w-full flex items-center gap-3 px-2.5 min-h-[40px] lg:min-h-[31px] rounded-lg text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4696] ${
                            isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
                          } ${
                            isActive
                              ? 'bg-[#FF4696]/12 text-[#F5F3F7]'
                              : 'text-[#B9B3C2] hover:text-[#F5F3F7] hover:bg-[#24202C]'
                          }`}
                        >
                          {isActive && (
                            <span
                              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#FF4696]"
                              aria-hidden="true"
                            />
                          )}
                          <Icon
                            className={`w-[17px] h-[17px] shrink-0 ${
                              isActive ? 'text-[#FF4696]' : 'text-[#9F97AB]'
                            }`}
                          />
                          {!isSidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </nav>

        {/* Bottom Account & Collapse Controls */}
        {user && (
          <div className="p-2.5 border-t border-[#342D3D] space-y-0.5 pb-4 lg:pb-2.5 shrink-0">
            {user.role === 'ADMIN' && (
              <button
                onClick={() => handleNavClick('admin')}
                aria-current={activeTab === 'admin' ? 'page' : undefined}
                title={isSidebarCollapsed ? 'Admin Console' : undefined}
                className={`relative w-full flex items-center gap-3 px-2.5 min-h-[40px] lg:min-h-[36px] rounded-lg text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4696] ${
                  isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
                } ${
                  activeTab === 'admin'
                    ? 'bg-[#FF4696]/12 text-[#F5F3F7]'
                    : 'text-[#B9B3C2] hover:text-[#F5F3F7] hover:bg-[#24202C]'
                }`}
              >
                <Shield
                  className={`w-[17px] h-[17px] shrink-0 ${
                    activeTab === 'admin' ? 'text-[#FF4696]' : 'text-[#9F97AB]'
                  }`}
                />
                {!isSidebarCollapsed && <span>Admin</span>}
              </button>
            )}

            <button
              onClick={() => handleNavClick('profile')}
              aria-current={activeTab === 'profile' ? 'page' : undefined}
              title={isSidebarCollapsed ? 'Profile & Settings' : undefined}
              className={`relative w-full flex items-center gap-3 px-2.5 min-h-[40px] lg:min-h-[36px] rounded-lg text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4696] ${
                isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
              } ${
                activeTab === 'profile'
                  ? 'bg-[#FF4696]/12 text-[#F5F3F7]'
                  : 'text-[#B9B3C2] hover:text-[#F5F3F7] hover:bg-[#24202C]'
              }`}
            >
              <User
                className={`w-[17px] h-[17px] shrink-0 ${
                  activeTab === 'profile' ? 'text-[#FF4696]' : 'text-[#9F97AB]'
                }`}
              />
              {!isSidebarCollapsed && <span>Profile &amp; Settings</span>}
            </button>

            <button
              onClick={async () => {
                await signOut(auth);
              }}
              title={isSidebarCollapsed ? 'Log out' : undefined}
              className={`w-full flex items-center gap-3 px-2.5 min-h-[40px] lg:min-h-[36px] rounded-lg text-[13px] font-medium text-[#B9B3C2] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87171] ${
                isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
              }`}
            >
              <LogOut className="w-[17px] h-[17px] shrink-0" />
              {!isSidebarCollapsed && <span>Log out</span>}
            </button>

            {/* Desktop Collapse Button */}
            <button
              onClick={toggleSidebarCollapse}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`hidden lg:flex w-full items-center gap-3 px-2.5 h-8 rounded-lg text-[12px] font-medium text-[#9F97AB] hover:text-[#F5F3F7] hover:bg-[#24202C] transition-colors mt-1 ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 shrink-0" />
                  <span>Collapse sidebar</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
