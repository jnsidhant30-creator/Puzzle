import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowBackOnline(false);
    } else if (isOnline && wasOffline) {
      setShowBackOnline(true);
      setWasOffline(false);
      const timer = setTimeout(() => setShowBackOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showBackOnline) return null;

  if (!isOnline) {
    return (
      <div className="bg-red-500/90 backdrop-blur text-white px-4 py-2 text-sm flex items-center justify-center gap-2 z-50 sticky top-0">
        <WifiOff size={16} />
        <span>You're offline. Some features may be unavailable until you reconnect.</span>
      </div>
    );
  }

  return (
    <div className="bg-green-500/90 backdrop-blur text-white px-4 py-2 text-sm flex items-center justify-center gap-2 z-50 sticky top-0">
      <Wifi size={16} />
      <span>Back online</span>
    </div>
  );
};
