import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { AchievementToast } from '../components/common/AchievementToast';
import { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../utils/cn';

export const GameFocusLayout = () => {
  // Default open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Handle resize events to adapt layout
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      <Sidebar 
        layoutMode="game-focus" 
        isGameSidebarOpen={isSidebarOpen} 
        onGameSidebarChange={setIsSidebarOpen} 
      />
      
      <main 
        className={cn(
          "flex-1 relative flex flex-col h-screen min-w-0 min-h-0 overflow-hidden transition-all duration-300",
          isSidebarOpen ? "md:pl-64" : "md:pl-0"
        )}
      >
        {/* Floating toggle - inside main area so it moves with it on desktop */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          className="hidden md:flex absolute top-4 left-4 z-40 p-2 rounded-xl bg-surface/80 backdrop-blur shadow-lg border border-border text-textMain hover:bg-primary/20 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
        </button>
        
        <div className="flex-1 w-full h-full overflow-hidden">
          <Outlet />
        </div>
      </main>

      <AchievementToast />
    </div>
  );
};
