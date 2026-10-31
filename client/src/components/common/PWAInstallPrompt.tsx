import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Button } from '../ui/Button';

export const PWAInstallPrompt = () => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if previously dismissed in this session
    if (sessionStorage.getItem('pwa_prompt_dismissed')) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-surface border border-white/10 rounded-lg p-4 shadow-xl z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
      <div className="flex flex-col">
        <h3 className="font-semibold text-text">Install PuzzleVerse</h3>
        <p className="text-sm text-textMuted">Install the app for a faster, better experience.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={promptInstall} className="flex items-center gap-1">
          <Download size={16} />
          Install
        </Button>
        <button onClick={handleDismiss} className="text-textMuted hover:text-text p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
