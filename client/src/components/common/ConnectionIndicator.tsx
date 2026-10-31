import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { syncPendingResults } from '../../services/gameResultService';

export const ConnectionIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      setShowIndicator(true);

      // Attempt to sync any offline pending game results
      try {
        await syncPendingResults();
      } catch (err) {
        console.error("Failed to sync offline results", err);
      } finally {
        setIsSyncing(false);
        // Hide the online/sync indicator after a short delay
        setTimeout(() => setShowIndicator(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check (if we loaded offline somehow)
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg border transition-all duration-300 flex items-center gap-2 text-sm font-bold",
        !isOnline ? "bg-error text-white border-error/50" : 
        isSyncing ? "bg-warning text-warning-foreground border-warning/50" : 
        "bg-success text-white border-success/50"
      )}
    >
      {!isOnline && (
        <>
          <WifiOff className="w-4 h-4" />
          Offline Mode
        </>
      )}
      {isOnline && isSyncing && (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Syncing Results...
        </>
      )}
      {isOnline && !isSyncing && (
        <>
          <span>Back Online</span>
        </>
      )}
    </div>
  );
};
