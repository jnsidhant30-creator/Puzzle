import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <footer className="h-16 border-t border-border flex items-center justify-center text-sm text-textMuted mt-auto">
        © 2026 PuzzleVerse. Challenge Your Mind.
      </footer>
    </div>
  );
};
