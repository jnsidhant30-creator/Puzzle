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
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'kudos':
        return <Heart className="w-4 h-4 text-pv-dragon-fruit shrink-0 fill-pv-dragon-fruit" />;
      case 'level':
        return <Award className="w-4 h-4 text-pv-dragon-fruit shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-pv-dragon-fruit shrink-0" />;
    }
  };

  const getStyle = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-pv-surface-primary';
      case 'error':
        return 'border-rose-500/40 bg-pv-surface-primary';
      case 'warning':
        return 'border-amber-500/40 bg-pv-surface-primary';
      case 'kudos':
      case 'level':
        return 'border-pv-dragon-fruit/40 bg-pv-surface-primary';
      default:
        return 'border-pv-border bg-pv-surface-primary';
    }
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3 rounded-lg border shadow-lg text-pv-text-primary transition-all ${getStyle(
            t.type
          )}`}
        >
          {getIcon(t.type)}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold leading-snug text-pv-text-primary">{t.title}</h4>
            {t.message && (
              <p className="text-[11px] text-pv-text-secondary mt-0.5 line-clamp-2">{t.message}</p>
            )}
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-pv-text-muted hover:text-pv-text-primary transition-colors p-0.5"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
