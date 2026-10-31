import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from './useAuthStore';
import { getSettings, updateSettings as updateDbSettings, resetSettings as resetDbSettings, DEFAULT_SETTINGS } from '../services/settingsService';
import type { UserSettings } from '../services/settingsService';
import { useTheme } from '../components/common/ThemeProvider';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, isAuthenticated } = useAuthStore();
  const { toggleTheme, theme } = useTheme();
  
  // Start with default settings to avoid null checks
  const [settings, setSettings] = useState<UserSettings>({ userId: '', ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSettings = async () => {
      if (isAuthenticated && profile?.uid) {
        setLoading(true);
        try {
          const userSettings = await getSettings(profile.uid);
          if (mounted) {
            setSettings(userSettings);
            
            // Sync theme if necessary
            if (userSettings.theme !== 'system' && userSettings.theme !== theme) {
              // Hacky way to sync global theme context, in a real app ThemeProvider should probably read from SettingsContext
              // but we are reusing the existing one.
              if ((userSettings.theme === 'dark' && theme === 'light') || 
                  (userSettings.theme === 'light' && theme === 'dark')) {
                toggleTheme();
              }
            }
          }
        } catch (error) {
          console.error("Failed to load settings:", error);
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        if (mounted) {
          setSettings({ userId: '', ...DEFAULT_SETTINGS });
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      mounted = false;
    };
  }, [profile?.uid, isAuthenticated]); // Only run on auth change

  const handleUpdateSettings = async (partial: Partial<UserSettings>) => {
    if (!profile?.uid) return;
    
    // Optimistic UI update
    setSettings(prev => ({ ...prev, ...partial }));
    
    // Handle theme toggle specifically for external context
    if (partial.theme && partial.theme !== 'system' && partial.theme !== theme) {
      toggleTheme();
    }
    
    try {
      await updateDbSettings(profile.uid, partial);
    } catch (error) {
      console.error("Failed to update settings in DB:", error);
      // Revert optimism if failed? For now we just let the UI stay since it's local pref
    }
  };

  const handleResetSettings = async () => {
    if (!profile?.uid) return;
    setSettings({ userId: profile.uid, ...DEFAULT_SETTINGS });
    
    if (DEFAULT_SETTINGS.theme !== theme && DEFAULT_SETTINGS.theme !== 'system') {
      toggleTheme();
    }
    
    try {
      await resetDbSettings(profile.uid);
    } catch (error) {
      console.error("Failed to reset settings in DB:", error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings: handleUpdateSettings, resetSettings: handleResetSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
