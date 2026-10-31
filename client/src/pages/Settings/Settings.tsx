import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../store/SettingsContext';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Shield, Bell, Monitor, Volume2, ShieldAlert, LogOut } from 'lucide-react';
import { logout } from '../../services/authService';
import { resetPassword } from '../../services/authService';

export const Settings = () => {
  const { settings, updateSettings, resetSettings, loading } = useSettings();
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('account');
  const [passwordSent, setPasswordSent] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleToggle = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleChangePassword = async () => {
    if (profile?.email) {
      try {
        await resetPassword(profile.email);
        setPasswordSent(true);
        setTimeout(() => setPasswordSent(false), 5000);
      } catch (err) {
        console.error("Failed to send reset email", err);
      }
    }
  };

  const handleResetSettings = async () => {
    if (confirmReset) {
      await resetSettings();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'gameplay', label: 'Gameplay', icon: Volume2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'about', label: 'About', icon: ShieldAlert },
  ];

  const ToggleSwitch = ({ label, description, isOn, onToggle }: any) => (
    <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
      <div>
        <p className="font-bold text-textMain">{label}</p>
        {description && <p className="text-sm text-textMuted">{description}</p>}
      </div>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors relative ${isOn ? 'bg-primary' : 'bg-surface border border-border'}`}
      >
        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-textMain">Settings</h1>
        <p className="text-textMuted mt-2">Manage your account preferences and application settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <Card className="md:w-64 shrink-0 h-fit">
          <CardContent className="p-2 flex flex-col gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-textMuted hover:bg-white/5 hover:text-textMain'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <p className="text-sm text-textMuted">Display Name</p>
                  <p className="font-bold text-textMain">{profile?.displayName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-textMuted">Username</p>
                  <p className="font-bold text-textMain">@{profile?.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-textMuted">Email Address</p>
                  <p className="font-bold text-textMain">{profile?.email || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-textMuted">Phone Number</p>
                  <p className="font-bold text-textMain">{profile?.phoneNumber || 'Not provided'}</p>
                </div>
                <div className="pt-4 flex gap-4">
                  <Button variant="secondary" onClick={() => alert("Edit Profile modal coming soon!")}>Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <p className="text-sm text-textMuted mt-1">Customize how PuzzleVerse looks.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="font-bold text-textMain mb-4">Theme</p>
                  <div className="flex gap-4">
                    {(['dark', 'light', 'system'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => updateSettings({ theme: t })}
                        className={`flex-1 py-4 rounded-xl border-2 capitalize font-bold transition-all ${
                          settings.theme === t ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-textMuted hover:border-white/20'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'gameplay' && (
            <Card>
              <CardHeader>
                <CardTitle>Gameplay Preferences</CardTitle>
                <p className="text-sm text-textMuted mt-1">Adjust your in-game experience.</p>
              </CardHeader>
              <CardContent>
                <ToggleSwitch 
                  label="Sound Effects" 
                  description="Play sounds when completing puzzles or earning achievements."
                  isOn={settings.soundEnabled} 
                  onToggle={() => handleToggle('soundEnabled')} 
                />
                <ToggleSwitch 
                  label="Animations" 
                  description="Show visual effects for level ups and streaks."
                  isOn={settings.animationsEnabled} 
                  onToggle={() => handleToggle('animationsEnabled')} 
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <p className="text-sm text-textMuted mt-1">Control what alerts you receive in the Notification Center.</p>
              </CardHeader>
              <CardContent>
                <ToggleSwitch 
                  label="Achievement Notifications" 
                  isOn={settings.achievementNotifications} 
                  onToggle={() => handleToggle('achievementNotifications')} 
                />
                <ToggleSwitch 
                  label="Level Up Notifications" 
                  isOn={settings.levelUpNotifications} 
                  onToggle={() => handleToggle('levelUpNotifications')} 
                />
                <ToggleSwitch 
                  label="Daily Puzzle Reminders" 
                  isOn={settings.dailyPuzzleNotifications} 
                  onToggle={() => handleToggle('dailyPuzzleNotifications')} 
                />
                <ToggleSwitch 
                  label="Personal Best Alerts" 
                  isOn={settings.personalBestNotifications} 
                  onToggle={() => handleToggle('personalBestNotifications')} 
                />
                <ToggleSwitch 
                  label="Leaderboard Updates" 
                  isOn={settings.leaderboardNotifications} 
                  onToggle={() => handleToggle('leaderboardNotifications')} 
                />
                <ToggleSwitch 
                  label="Streak Milestones" 
                  isOn={settings.streakNotifications} 
                  onToggle={() => handleToggle('streakNotifications')} 
                />
                <ToggleSwitch 
                  label="System Notifications" 
                  description="Important alerts about maintenance and updates."
                  isOn={settings.systemNotifications} 
                  onToggle={() => handleToggle('systemNotifications')} 
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy</CardTitle>
                  <p className="text-sm text-textMuted mt-1">Manage who can see your stats.</p>
                </CardHeader>
                <CardContent>
                  <ToggleSwitch 
                    label="Public Profile" 
                    description="Allow others to view your profile and achievements."
                    isOn={true} 
                    onToggle={() => alert("Privacy settings infrastructure coming soon!")} 
                  />
                  <ToggleSwitch 
                    label="Show on Leaderboard" 
                    description="Include your scores in global rankings."
                    isOn={true} 
                    onToggle={() => alert("Privacy settings infrastructure coming soon!")} 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Button variant="secondary" onClick={handleChangePassword} disabled={!profile?.email}>
                      {passwordSent ? "Reset Link Sent!" : "Change Password"}
                    </Button>
                    <p className="text-xs text-textMuted mt-2">We will send a password reset link to your email.</p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <Button variant="danger" onClick={() => logout()} className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Sign Out of PuzzleVerse
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'about' && (
            <Card>
              <CardHeader>
                <CardTitle>About PuzzleVerse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textMain">PuzzleVerse</h3>
                    <p className="text-sm text-textMuted">Challenge Your Mind. Beat Your Best.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-textMuted">Version</p>
                    <p className="font-bold text-textMain">1.0.0-beta</p>
                  </div>
                  <div>
                    <p className="text-xs text-textMuted">Technology</p>
                    <p className="font-bold text-textMain">React • TypeScript • Firebase</p>
                  </div>
                </div>

                <div className="pt-8 flex justify-end">
                  <Button 
                    variant={confirmReset ? "danger" : "secondary"} 
                    onClick={handleResetSettings}
                  >
                    {confirmReset ? "Confirm Reset to Default" : "Reset All Settings to Default"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};
