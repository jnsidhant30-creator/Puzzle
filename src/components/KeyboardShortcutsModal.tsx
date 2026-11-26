import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from './ui/Button';

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
    { key: 'F11', desc: 'Toggle desktop fullscreen mode' },
    { key: 'Ctrl + K', desc: 'Open quick search' },
    { key: 'Esc', desc: 'Pause solo match or close dialogs' },
    { key: 'Arrow Keys / WASD', desc: 'Move in Maze, Sliding, Block Escape & directional boards' },
    { key: '1 - 4', desc: 'Pick options in Number, Logic, Pattern & Challenge Mode' },
    { key: 'A - Z / Enter', desc: 'Type and submit letters in Word Puzzle' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#36515F] bg-[#233D4A] p-6 text-[#F5F7F8]">
        <div className="flex items-center justify-between pb-3 border-b border-[#36515F]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-[#38C6BA]" />
            <h3 className="text-base font-bold text-[#F5F7F8]">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#B4C3CE] hover:text-[#F5F7F8] hover:bg-[#2C4654] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-[#36515F]/60 last:border-0"
            >
              <span className="text-xs text-[#B4C3CE]">{s.desc}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-semibold text-[#F5F7F8] bg-[#1C2D3B] border border-[#36515F] rounded">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-[#36515F]">
          <Button onClick={onClose} variant="secondary" size="sm" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
