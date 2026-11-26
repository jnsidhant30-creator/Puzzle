import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K', desc: 'Open quick search (Cmd + K on macOS)' },
    { key: 'Esc', desc: 'Close open dialog, menu, or search' },
    { key: 'W A S D / Arrows', desc: 'Move player in Maze Escape' },
    { key: 'A–Z / Backspace / Enter', desc: 'Type and submit letters in Word Puzzle' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-pv-border bg-pv-surface-primary p-6 shadow-lg text-pv-text-primary">
        <div className="flex items-center justify-between pb-3 border-b border-pv-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-pv-dragon-fruit" />
            <h3 className="text-base font-semibold text-pv-text-primary">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-pv-text-muted hover:text-pv-text-primary hover:bg-pv-surface-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 border-b border-pv-border/40 last:border-0"
            >
              <span className="text-xs text-pv-text-secondary">{s.desc}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-medium text-pv-text-primary bg-pv-surface-secondary border border-pv-border rounded">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-pv-border text-center">
          <button
            onClick={onClose}
            className="w-full h-9 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
