import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../ui/Button';

const ProfileMissingFallback = () => {
  const { logout, recoverProfile, isInitializing } = useAuthStore();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-surface border border-border p-8 rounded-lg text-center space-y-4">
        <h2 className="text-xl font-bold text-textMain">Profile Setup Incomplete</h2>
        <p className="text-textMuted text-sm mb-4">
          Your account was created, but your profile data is missing. You can try recovering it automatically.
        </p>
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => recoverProfile()} 
            disabled={isInitializing}
            className="w-full"
          >
            {isInitializing ? 'Recovering...' : 'Complete Profile Setup'}
          </Button>
          <Button 
            onClick={() => logout()} 
            variant="secondary"
            className="w-full"
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ProtectedRoute = ({ adminOnly = false }: { adminOnly?: boolean }) => {
  const { isAuthenticated, profile, isInitializing, profileMissing } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: location } });
    } else if (adminOnly && profile?.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [isInitializing, isAuthenticated, adminOnly, profile, navigate, location]);

  if (isInitializing) return null;

  if (!isAuthenticated || (adminOnly && profile?.role !== 'ADMIN')) {
    return null;
  }

  if (profileMissing) {
    return <ProfileMissingFallback />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitializing) return;

    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  if (isInitializing) return null;

  if (isAuthenticated) {
    return null;
  }

  return <Outlet />;
};
