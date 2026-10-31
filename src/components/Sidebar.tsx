import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  LayoutDashboard, Gamepad2, Compass, Award, Swords, Users, Shield, 
  BookOpen, Layers, Bell, User, LogOut, Brain, Menu, X, Trophy, ChevronDown, ChevronRight,
  Calendar, Sparkles, Target, Settings
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase'; 

export const Sidebar: React.FC = () => { 
  const { activeTab, setActiveTab, user, isMobileMenuOpen, setIsMobileMenuOpen } = useStore(); 
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'play-nav': true,
    'social-nav': true,
    'progress-nav': true,
    'discover-nav': false,
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  React.useEffect(() => { 
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
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'games', label: 'Puzzles', icon: Gamepad2 },
        { id: 'daily', label: 'Daily Puzzle', icon: Calendar },
        { id: 'journey', label: 'Journey', icon: Compass },
        { id: 'mastery', label: 'Mastery', icon: Award },
      ]
    },
    {
      id: 'social-nav',
      title: 'Social',
      items: [
        { id: 'friends', label: 'Friends', icon: Users },
        { id: 'clubs', label: 'Clubs', icon: Shield },
        { id: 'challenges', label: 'Challenges', icon: Swords },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
      ]
    },
    {
      id: 'progress-nav',
      title: 'Progress',
      items: [
        { id: 'goals', label: 'Daily Goals', icon: Target },
        { id: 'achievements', label: 'Achievements', icon: Award },
        { id: 'events', label: 'Events & Seasons', icon: Sparkles },
        { id: 'insights', label: 'Insights & Stats', icon: Brain },
      ]
    },
    {
      id: 'discover-nav',
      title: 'Discover',
      items: [
        { id: 'learn', label: 'Learn', icon: BookOpen },
        { id: 'collections', label: 'Collections', icon: Layers },
      ]
    }
  ];
  
  return ( 
    <> 
      {/* Mobile Overlay */} 
      {isMobileMenuOpen && ( 
        <div className="fixed inset-0 bg-pv-surface-primary z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} /> 
      )} 
      
      {/* Sidebar */} 
      <aside className={`
        fixed lg:sticky top-0 left-0 bottom-0 z-50 flex flex-col bg-gradient-sidebar 
        border-r border-pv-border-violet w-[260px] h-[100dvh] overflow-y-auto scrollbar-none 
        transition-transform duration-300 ease-in-out shrink-0 shadow-sm 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
      `}> 
        {/* Logo Area */} 
        <div className="p-6 flex items-center justify-between sticky top-0 z-10 bg-gradient-sidebar"> 
          <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-3 focus:outline-none group"> 
            <div className="w-9 h-9 rounded-xl bg-gradient-primary-btn p-[1.5px] shadow-sm group-hover:scale-105 transition-transform"> 
              <div className="w-full h-full bg-pv-surface-primary rounded-[10px] flex items-center justify-center"> 
                <Brain className="w-5 h-5 text-pv-dragon-fruit group-hover:rotate-12 transition-transform" /> 
              </div> 
            </div> 
            <div> 
              <h1 className="font-black text-lg tracking-wide text-white">PuzzleVerse</h1> 
            </div> 
          </button> 
          <button 
            className="lg:hidden p-2 text-pv-text-secondary hover:text-white transition-colors" 
            onClick={() => setIsMobileMenuOpen(false)} 
            aria-label="Close menu"
          > 
            <X className="w-5 h-5" /> 
          </button> 
        </div> 

        {/* Navigation Groups */} 
        <nav className="flex-1 px-4 py-2 space-y-5"> 
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.id];
            
            return (
              <section key={group.id} aria-labelledby={group.id}>
                <button 
                  type="button"
                  id={group.id}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`${group.id}-items`}
                  className="w-full flex items-center justify-between px-4 mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pv-dragon-fruit rounded"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-pv-text-muted">{group.title}</span>
                  {isExpanded ? <ChevronDown className="w-3 h-3 text-pv-text-muted" /> : <ChevronRight className="w-3 h-3 text-pv-text-muted" />}
                </button>
                
                {isExpanded && (
                  <div id={`${group.id}-items`} className="space-y-1">
                    {group.items.map((item) => { 
                      const Icon = item.icon; 
                      const isActive = activeTab === item.id; 
                      return ( 
                        <button 
                          key={item.id} 
                          onClick={() => { 
                            setActiveTab(item.id as any); 
                            if (window.innerWidth < 1024) setIsMobileMenuOpen(false); 
                          }} 
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-200 border ${ 
                            isActive 
                              ? 'bg-pv-dragon-fruit/10 text-pv-dragon-fruit-light border-pv-dragon-fruit/20 shadow-sm' 
                              : 'text-pv-text-secondary hover:text-white hover:bg-white/5 border-transparent' 
                          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pv-dragon-fruit`} 
                        > 
                          <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-pv-dragon-fruit-light' : 'text-pv-text-muted'}`} /> 
                          <span>{item.label}</span> 
                        </button> 
                      ); 
                    })} 
                  </div>
                )}
              </section>
            );
          })}
        </nav> 
        
        {/* Bottom Profile/Settings/Logout */} 
        {user && ( 
          <div className="p-4 border-t border-pv-border-violet space-y-1 bg-transparent pb-24 lg:pb-4"> 
            {user.role === 'ADMIN' && (
              <button 
                onClick={() => setActiveTab('admin')} 
                aria-current={activeTab === 'admin' ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-200 border ${ 
                  activeTab === 'admin' 
                    ? 'bg-pv-dragon-fruit/10 text-pv-dragon-fruit-light border-pv-dragon-fruit/20' 
                    : 'text-pv-text-secondary hover:text-white hover:bg-white/5 border-transparent' 
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pv-dragon-fruit`} 
              > 
                <Shield className={`w-[18px] h-[18px] ${activeTab === 'admin' ? 'text-pv-dragon-fruit-light' : 'text-pv-text-muted'}`} /> 
                <span>Admin Console</span> 
              </button> 
            )}
            <button 
              onClick={() => setActiveTab('profile')} 
              aria-current={activeTab === 'profile' ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-200 border ${ 
                activeTab === 'profile' 
                  ? 'bg-pv-dragon-fruit/10 text-pv-dragon-fruit-light border-pv-dragon-fruit/20' 
                  : 'text-pv-text-secondary hover:text-white hover:bg-white/5 border-transparent' 
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pv-dragon-fruit`} 
            > 
              <User className={`w-[18px] h-[18px] ${activeTab === 'profile' ? 'text-pv-dragon-fruit-light' : 'text-pv-text-muted'}`} /> 
              <span>Profile</span> 
            </button> 
            <button 
              onClick={async () => { await signOut(auth); }} 
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-[13px] text-pv-text-secondary hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400" 
            > 
              <LogOut className="w-[18px] h-[18px]" /> 
              <span>Logout</span> 
            </button> 
          </div> 
        )} 
      </aside> 
    </> 
  ); 
};
