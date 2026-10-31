import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

interface TimerProps {
  initialSeconds: number;
  isActive: boolean;
  onTimeout: () => void;
}

export const Timer = ({ initialSeconds, isActive, onTimeout }: TimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (!isActive || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, secondsLeft, onTimeout]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  
  const isWarning = secondsLeft <= 30 && secondsLeft > 10;
  const isCritical = secondsLeft <= 10;

  return (
    <div className={cn(
      "font-mono text-2xl font-bold px-4 py-2 rounded-lg glass transition-colors",
      {
        'text-white': !isWarning && !isCritical,
        'text-accent': isWarning,
        'text-error animate-pulse': isCritical,
      }
    )}>
      {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
    </div>
  );
};
