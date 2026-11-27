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
  Settings,
  Download,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Capacitor } from '@capacitor/core';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    user,
    isGuest,
    setUser,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useStore();

  const [progressExpanded, setProgressExpanded] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState(false);

  const isProgressRoute = ['mastery', 'mastery_practice', 'journey', 'achievements', 'goals', 'insights'].includes(
    activeTab
  );
  const isMoreRoute = [
    'challenges',
    'leaderboard',
    'clubs',
    'club_detail',
    'club_events',
    'club_discussions',
    'club_guides',
    'community',
    'events',
    'event_detail',
    'learn',
    'collections',
    'collection_detail',
  ].includes(activeTab);

  useEffect(() => {
    if (isProgressRoute) setProgressExpanded(true);
    if (isMoreRoute) setMoreExpanded(true);
  }, [isProgressRoute, isMoreRoute]);

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

  const primaryItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'games', label: 'Games', icon: LayoutGrid },
    { id: 'daily', label: 'Daily Puzzle', icon: Calendar },
  ];

  const progressSubItems = [
    { id: 'mastery', label: 'Mastery', icon: Gauge },
    { id: 'journey', label: 'Journey', icon: Compass },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'goals', label: 'Daily Goals', icon: Target },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
  ];

  const socialItems = [
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const moreItems = [
    { id: 'challenges', label: 'Challenges', icon: Swords },
    { id: 'leaderboard', label: 'Leaderboards', icon: Trophy },
    { id: 'clubs', label: 'Clubs', icon: Shield },
    { id: 'events', label: 'Events', icon: Sparkles },
    { id: 'collections', label: 'Collections', icon: Layers },
    { id: 'community', label: 'Custom Levels', icon: Blocks },
    { id: 'learn', label: 'Learn', icon: BookOpen },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId as any);
    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
  };

  const renderNavButton = (
    item: { id: string; label: string; icon: React.ComponentType<{ className?: string }> },
    compact = false
  ) => {
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
        className={`w-full flex items-center gap-3 px-3 ${
          compact ? 'min-h-[38px] lg:min-h-[34px] text-[13px]' : 'min-h-[42px] lg:min-h-[40px] text-[14px]'
        } rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38C6BA] ${
          isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
        } ${
          isActive
            ? 'bg-[#38C6BA] text-[#142331]'
            : 'text-[#B4C3CE] hover:text-[#F5F7F8] hover:bg-[#233D4A]'
        }`}
      >
        <Icon
          className={`w-[18px] h-[18px] shrink-0 ${
            isActive ? 'text-[#142331]' : 'text-[#93D1F2]'
          }`}
        />
        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Primary Navigation"
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 flex flex-col bg-[#1C2D3B] border-r border-[#36515F] h-[100dvh] transition-all duration-150 shrink-0 ${
          isSidebarCollapsed ? 'w-[240px] lg:w-[70px]' : 'w-[240px]'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand Row */}
        <div
          className={`h-16 px-4 flex items-center border-b border-[#36515F] shrink-0 ${
            isSidebarCollapsed ? 'lg:justify-center justify-between' : 'justify-between'
          }`}
        >
          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38C6BA] rounded-lg p-1 -ml-1"
            title="PuzzleVerse Home"
          >
            <BrandLogo size={30} showWordmark={!isSidebarCollapsed} />
          </button>

          <button
            className="lg:hidden p-2 -mr-1 text-[#B4C3CE] hover:text-[#F5F7F8] rounded-lg hover:bg-[#233D4A] transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-none px-3 py-3 space-y-1.5 relative">
          {primaryItems.map((item) => renderNavButton(item))}

          {/* Expandable Progress Hub */}
          <div className="pt-0.5">
            {isSidebarCollapsed ? (
              renderNavButton({ id: 'mastery', label: 'Progress', icon: BarChart3 })
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      handleNavClick('mastery');
                      setProgressExpanded(true);
                    }}
                    aria-current={isProgressRoute ? 'page' : undefined}
                    className={`flex-1 flex items-center gap-3 px-3 min-h-[40px] rounded-lg text-[14px] font-semibold transition-colors ${
                      isProgressRoute
                        ? 'bg-[#38C6BA] text-[#142331]'
                        : 'text-[#B4C3CE] hover:text-[#F5F7F8] hover:bg-[#233D4A]'
                    }`}
                  >
                    <BarChart3
                      className={`w-[18px] h-[18px] shrink-0 ${
                        isProgressRoute ? 'text-[#142331]' : 'text-[#93D1F2]'
                      }`}
                    />
                    <span>Progress</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgressExpanded((p) => !p)}
                    aria-expanded={progressExpanded}
                    aria-label="Toggle Progress pages"
                    className="p-2 rounded-lg text-[#98AAB8] hover:text-[#F5F7F8] hover:bg-[#233D4A]"
                  >
                    {progressExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>

                {progressExpanded && (
                  <div className="mt-1 ml-3 pl-2.5 border-l border-[#36515F] space-y-0.5">
                    {progressSubItems.map((sub) => renderNavButton(sub, true))}
                  </div>
                )}
              </>
            )}
          </div>

          {socialItems.map((item) => renderNavButton(item))}

          {/* Collapsible More Section */}
          <div className="pt-2 border-t border-[#36515F]/70 mt-2">
            {isSidebarCollapsed ? (
              <div className="space-y-1">
                {moreItems.slice(0, 4).map((item) => renderNavButton(item, true))}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setMoreExpanded((m) => !m)}
                  aria-expanded={moreExpanded}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-[#B4C3CE] hover:text-[#F5F7F8] rounded-lg hover:bg-[#233D4A] transition-colors"
                >
                  <span>More features</span>
                  {moreExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {moreExpanded && (
                  <div className="mt-1 space-y-0.5">
                    {moreItems.map((item) => renderNavButton(item, true))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Subtle playful geometric corner step motif (desktop expanded) */}
          {!isSidebarCollapsed && (
            <div className="pt-4 px-1 hidden lg:block pointer-events-none select-none" aria-hidden="true">
              <svg width="96" height="44" viewBox="0 0 96 44" fill="none">
                <rect x="0" y="30" width="28" height="14" rx="2" fill="#233D4A" />
                <rect x="20" y="20" width="28" height="24" rx="2" fill="#2C4654" />
                <rect x="40" y="10" width="28" height="34" rx="2" fill="#087F8C" />
                <line x1="54" y1="0" x2="54" y2="10" stroke="#A8E5D5" strokeWidth="2" />
                <polygon points="54,1 66,5 54,9" fill="#38C6BA" />
              </svg>
            </div>
          )}
        </nav>

        {/* Bottom Settings, Download App (Web), Admin & Collapse Controls */}
        {user && (
          <div className="p-3 border-t border-[#36515F] space-y-1 pb-4 lg:pb-3 shrink-0 bg-[#1C2D3B]">
            {!window.puzzleverseDesktop?.isDesktop && !Capacitor.isNativePlatform() &&
              renderNavButton({ id: 'download', label: 'Apps & Downloads', icon: Download }, true)}

            {user.role === 'ADMIN' &&
              renderNavButton({ id: 'admin', label: 'Admin', icon: Shield }, true)}

            <button
              onClick={() => handleNavClick('settings')}
              aria-current={activeTab === 'settings' ? 'page' : undefined}
              title={isSidebarCollapsed ? 'Settings' : undefined}
              className={`w-full flex items-center gap-3 px-3 min-h-[38px] lg:min-h-[36px] rounded-lg text-[13px] font-semibold transition-colors ${
                isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
              } ${
                activeTab === 'settings'
                  ? 'bg-[#38C6BA] text-[#142331]'
                  : 'text-[#B4C3CE] hover:text-[#F5F7F8] hover:bg-[#233D4A]'
              }`}
            >
              <Settings
                className={`w-[17px] h-[17px] shrink-0 ${
                  activeTab === 'settings' ? 'text-[#142331]' : 'text-[#93D1F2]'
                }`}
              />
              {!isSidebarCollapsed && <span>Settings</span>}
            </button>

            <button
              onClick={async () => {
                if (isGuest) {
                  setUser(null, false);
                } else {
                  await signOut(auth);
                }
              }}
              title={isSidebarCollapsed ? (isGuest ? 'Exit Guest Mode' : 'Log out') : undefined}
              className={`w-full flex items-center gap-3 px-3 min-h-[38px] lg:min-h-[36px] rounded-lg text-[13px] font-semibold text-[#B4C3CE] hover:text-[#FCA5A5] hover:bg-[#EF4444]/15 transition-colors ${
                isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
              }`}
            >
              <LogOut className="w-[17px] h-[17px] shrink-0" />
              {!isSidebarCollapsed && <span>{isGuest ? 'Exit Guest Mode' : 'Log out'}</span>}
            </button>

            <button
              onClick={toggleSidebarCollapse}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`hidden lg:flex w-full items-center gap-3 px-3 h-8 rounded-lg text-xs font-semibold text-[#98AAB8] hover:text-[#F5F7F8] hover:bg-[#233D4A] transition-colors ${
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
