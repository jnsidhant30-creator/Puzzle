import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { logout } from '../services/authService';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Puzzle, 
  Calendar, 
  Trophy, 
  Settings, 
  LogOut,
  ArrowLeft,
  Bell,
  BarChart3,
  FileText,
  ShieldAlert,
  Server,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';

export const AdminLayout = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Players', path: '/admin/players', icon: Users },
    { name: 'Puzzle Management', path: '/admin/puzzles', icon: Puzzle },
    { name: 'Challenges', path: '/admin/challenges/daily', icon: Calendar },
    { name: 'Competition', path: '/admin/competition', icon: Trophy }, // Re-using Trophy
    { name: 'Achievements', path: '/admin/achievements', icon: Trophy },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
    { name: 'System Health', path: '/admin/system', icon: Server },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => setMobileMenuOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive || location.pathname.startsWith(item.path)
                ? "bg-primary/10 text-primary"
                : "text-textMuted hover:bg-surfaceHover hover:text-textMain"
            )
          }
        >
          <item.icon className="w-5 h-5" />
          {item.name}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-surface border-r border-border hidden lg:flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CONTROL CENTER
          </h1>
          <p className="text-xs text-textMuted mt-1">Logged in as {profile?.username}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-textMuted hover:bg-surfaceHover hover:text-textMain w-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to App
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error/10 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-surface border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-textMuted hover:text-textMain">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-lg font-bold text-textMain">Admin</h1>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-primary">Exit</button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-[65px] left-0 right-0 bottom-0 bg-surface z-50 flex flex-col">
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <NavLinks />
            </nav>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
