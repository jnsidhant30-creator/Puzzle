import { useEffect, useRef, useState } from 'react';

/**
 * Tracks elapsed active gameplay seconds, freezes cleanly while paused or stopped,
 * and catches up real active time if a running browser tab returns from background.
 */
export function useGameTimer(
  isPaused: boolean,
  isStopped = false,
  resetDeps: readonly unknown[] = []
) {
  const [timer, setTimer] = useState(0);
  const lastActiveTsRef = useRef<number>(Date.now());

  useEffect(() => {
    lastActiveTsRef.current = Date.now();
    setTimer(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  useEffect(() => {
    if (isPaused || isStopped) return;

    lastActiveTsRef.current = Date.now();

    const syncElapsed = () => {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - lastActiveTsRef.current) / 1000);
      if (deltaSeconds >= 1) {
        lastActiveTsRef.current += deltaSeconds * 1000;
        setTimer((t) => t + deltaSeconds);
      }
    };

    const interval = setInterval(syncElapsed, 1000);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncElapsed();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused, isStopped]);

  return [timer, setTimer] as const;
}
