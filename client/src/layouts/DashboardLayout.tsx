import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { AchievementToast } from '../components/common/AchievementToast';

export const DashboardLayout = () => {
  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-h-0">
        {/* Mobile spacing for fixed header */}
        <div className="h-16 md:hidden shrink-0"></div>
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden min-h-0">
          <Outlet />
          <footer className="h-16 border-t border-border flex items-center justify-center text-sm text-textMuted mt-8 shrink-0">
            © 2026 PuzzleVerse. Challenge Your Mind.
          </footer>
        </main>
        
        <AchievementToast />
      </div>
    </div>
  );
};
