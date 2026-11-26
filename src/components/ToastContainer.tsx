import React, { useState, useEffect } from 'react';
import { toast, ToastMessage } from '../services/toast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Heart, Award, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toast.subscribe((updated) => setToasts(updated));
  }, []);

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[#F87171] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#FBBF24] shrink-0" />;
      case 'kudos':
        return <Heart className="w-4 h-4 text-[#38C6BA] shrink-0 fill-[#38C6BA]" />;
      case 'level':
        return <Award className="w-4 h-4 text-[#38C6BA] shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-[#93D1F2] shrink-0" />;
    }
  };

  const getStyle = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'border-[#10B981]/40 bg-[#233D4A]';
      case 'error':
        return 'border-[#EF4444]/40 bg-[#233D4A]';
      case 'warning':
        return 'border-[#F59E0B]/40 bg-[#233D4A]';
      case 'kudos':
      case 'level':
        return 'border-[#38C6BA]/50 bg-[#233D4A]';
      default:
        return 'border-[#36515F] bg-[#233D4A]';
    }
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-16 lg:bottom-5 right-4 sm:right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border text-[#F5F7F8] transition-colors ${getStyle(
            t.type
          )}`}
        >
          {getIcon(t.type)}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold leading-snug text-[#F5F7F8]">{t.title}</h4>
            {t.message && (
              <p className="text-xs text-[#B4C3CE] mt-0.5 line-clamp-2">{t.message}</p>
            )}
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-[#98AAB8] hover:text-[#F5F7F8] transition-colors p-0.5"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
