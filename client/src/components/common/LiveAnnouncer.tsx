import React, { createContext, useContext, useState, useCallback } from 'react';

interface LiveAnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextType | null>(null);

export const useLiveAnnouncer = () => {
  const context = useContext(LiveAnnouncerContext);
  if (!context) {
    // Return a dummy announcer if used outside provider, to avoid errors
    return { announce: () => {} };
  }
  return context;
};

export const LiveAnnouncerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcement, setAnnouncement] = useState<{ message: string; priority: 'polite' | 'assertive'; id: number } | null>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement({ message, priority, id: Date.now() });
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={{ announce }}>
      {children}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {announcement?.priority === 'polite' ? announcement.message : ''}
      </div>
      <div 
        role="alert" 
        aria-live="assertive" 
        aria-atomic="true" 
        className="sr-only"
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {announcement?.priority === 'assertive' ? announcement.message : ''}
      </div>
    </LiveAnnouncerContext.Provider>
  );
};
