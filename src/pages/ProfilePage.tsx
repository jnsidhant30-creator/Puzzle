import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PUZZLE_MODES } from '../data/puzzles';
import { getUnlockedTitles, TITLE_DEFINITIONS } from '../services/recommendation';
import { formatCount } from '../utils/format';
import {
  User,
  Shield,
  Trophy,
  Award,
  Coins,
  HelpCircle,
  Save,
  LogOut,
  RotateCcw,
  Flame,
  Zap,
  RefreshCw,
  Lock,
  CheckCircle2,
  Sliders,
  Eye,
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Settings as SettingsIcon,
  History,
} from 'lucide-react';
import { fetchUserRecentGameSessions, fetchPersonalBestHistory } from '../services/firebase';
import { signOutCurrentUser } from '../services/authService';
import { GameSession, PersonalBestHistoryItem, PuzzleType, Difficulty } from '../types';
import { calculateUserMasteryProfile } from '../data/masteryData';
import { PlayerWallSection } from '../components/PlayerWallSection';
import { PageHeader, Card } from '../components/ui/Card';
import { AVATAR_PRESETS, resolveAvatarUrl } from '../utils/avatar';

const AVATARS = AVATAR_PRESETS;

export const ProfilePage: React.FC = () => {
  const {
    user,
    updateProfile,
    setUser,
    isGuest,
    isOnline,
    startReplaySession,
    resetAdaptiveProfiles,
    soundMuted,
    toggleSound,
    setActiveTab: setActiveTabGlobal,
  } = useStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(resolveAvatarUrl(user?.avatarUrl, user?.uid || 'alpha'));
  const [selectedTitle, setSelectedTitle] = useState(user?.selectedTitle || 'Puzzle Apprentice');
  const [bio, setBio] = useState(user?.bio || '');
  const [favoriteGames, setFavoriteGames] = useState<PuzzleType[]>(user?.favoriteGameTypes || []);

  const [preferredDiff, setPreferredDiff] = useState<Difficulty | 'adaptive'>(
    user?.preferences?.preferredDifficulty || 'adaptive'
  );
  const [showTutorials, setShowTutorials] = useState<boolean>(user?.preferences?.showTutorials ?? true);
  const [reduceAnimations, setReduceAnimations] = useState<boolean>(user?.preferences?.reduceAnimations ?? false);
  const [compactUI, setCompactUI] = useState<boolean>(user?.preferences?.compactUI ?? false);

  const [profileVis, setProfileVis] = useState<'public' | 'friends_only' | 'private'>(
    user?.privacy?.profileVisibility || 'public'
  );
  const [friendVis, setFriendVis] = useState<'public' | 'friends_only' | 'private'>(
    user?.privacy?.friendVisibility || 'public'
  );
  const [activityVis, setActivityVis] = useState<'public' | 'friends_only' | 'private'>(
    user?.privacy?.activityVisibility || 'public'
  );

  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [pbHistory, setPbHistory] = useState<PersonalBestHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'customization' | 'preferences' | 'preview' | 'pbs' | 'history' | 'wall'>(
    'customization'
  );

  const unlockedTitles = getUnlockedTitles(user);

  useEffect(() => {
    const handleTabSwitch = (ev: Event) => {
      const target = (ev as CustomEvent<string>).detail;
      if (
        target === 'customization' ||
        target === 'preferences' ||
        target === 'preview' ||
        target === 'pbs' ||
        target === 'history' ||
        target === 'wall'
      ) {
        setActiveTab(target);
      }
    };
    window.addEventListener('pv:profile-tab', handleTabSwitch);
    return () => window.removeEventListener('pv:profile-tab', handleTabSwitch);
  }, []);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || '');
    setSelectedAvatar(resolveAvatarUrl(user.avatarUrl, user.uid || 'alpha'));
    setSelectedTitle(user.selectedTitle || 'Puzzle Apprentice');
    setBio(user.bio || '');
    setFavoriteGames(user.favoriteGameTypes || []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (isGuest || !isOnline || user.uid.startsWith('guest_')) {
      try {
        const offlineRaw = JSON.parse(localStorage.getItem('puzzleverse_offline_practice_v1') || '[]');
        setRecentSessions(Array.isArray(offlineRaw) ? offlineRaw.slice(0, 10) : []);
      } catch {
        setRecentSessions([]);
      }
      setPbHistory([]);
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);
    Promise.all([
      fetchUserRecentGameSessions(user.uid, 10),
      fetchPersonalBestHistory(user.uid, undefined, 10),
    ])
      .then(([sessions, history]) => {
        setRecentSessions(sessions);
        setPbHistory(history);
        setLoadingHistory(false);
      })
      .catch(() => setLoadingHistory(false));
  }, [user?.uid, isGuest, isOnline]);

  const handleSave = async () => {
    if (!user) return;
    const cleanName = displayName.trim().slice(0, 50) || 'Puzzle Player';
    const cleanBio = bio.trim().slice(0, 150);
    const updates = {
      displayName: cleanName,
      avatarUrl: selectedAvatar,
      selectedTitle,
      bio: cleanBio,
      favoriteGameTypes: favoriteGames,
      preferences: {
        preferredDifficulty: preferredDiff,
        showTutorials,
        reduceAnimations,
        soundMuted,
        compactUI,
      },
      privacy: {
        profileVisibility: profileVis,
        friendVisibility: friendVis,
        activityVisibility: activityVis,
      },
    };
    await updateProfile(updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleFavorite = (id: PuzzleType) => {
    if (favoriteGames.includes(id)) {
      setFavoriteGames(favoriteGames.filter((g) => g !== id));
    } else {
      if (favoriteGames.length >= 4) return;
      setFavoriteGames([...favoriteGames, id]);
    }
  };

  const handleResetDifficulty = async () => {
    await resetAdaptiveProfiles();
    setResetConfirm(false);
  };

  const handleLogout = async () => {
    if (isGuest) {
      setUser(null, false);
      return;
    }
    await signOutCurrentUser();
    setUser(null, false);
  };

  const personalBests = user?.personalBests || {};
  const adaptiveProfiles = user?.adaptiveProfiles || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Player Identity Banner */}
      <Card surface="featured" padding="lg" className="border-[#4A6A7B]">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={selectedAvatar}
            alt={displayName}
            className="w-20 h-20 rounded-xl object-cover border-2 border-[#4A6A7B] shrink-0 bg-[#1C2D3B]"
          />
          <div className="space-y-2.5 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-semibold text-[#F5F7F8] tracking-tight">{displayName}</h2>
              <span className="bg-[#1C2D3B] text-[#B4C3CE] text-[10px] font-medium px-2.5 py-0.5 rounded-md border border-[#36515F] uppercase tracking-wider">
                {selectedTitle}
              </span>
              {user?.role === 'ADMIN' && (
                <span className="bg-[#38C6BA]/15 text-[#A8E5D5] border border-[#38C6BA]/40 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-[#98AAB8] font-mono">@{user?.username || 'player'}</p>
            {bio && (
              <p className="text-xs text-[#B4C3CE] max-w-lg leading-relaxed">
                "{bio}"
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
              <span className="bg-[#1C2D3B] border border-[#36515F] px-2.5 py-1 rounded-md text-[#F5F7F8] font-semibold font-tabular">
                Level {user?.level || 1}
              </span>
              <span className="bg-[#1C2D3B] border border-[#36515F] px-2.5 py-1 rounded-md text-[#B4C3CE] font-tabular">
                {user?.xp || 0} XP
              </span>
              <span className="bg-[#1C2D3B] border border-[#36515F] px-2.5 py-1 rounded-md text-[#B4C3CE] flex items-center gap-1.5 font-tabular">
                <Coins className="w-3.5 h-3.5 text-[#38C6BA]" /> {formatCount(user?.coins || 0, 'coin')}
              </span>
              <span className="bg-[#1C2D3B] border border-[#36515F] px-2.5 py-1 rounded-md text-[#B4C3CE] flex items-center gap-1.5 font-tabular">
                <HelpCircle className="w-3.5 h-3.5 text-[#38BDF8]" /> {formatCount(user?.hints || 0, 'hint')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile & Quick Account Menu (Secondary Destinations) */}
      <Card surface="primary" padding="md" className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#98AAB8]">Player Menu</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTabGlobal('achievements')}
            className="p-2.5 rounded-lg bg-[#1C2D3B] hover:bg-[#2C4654] border border-[#36515F] text-[#F5F7F8] font-semibold flex items-center gap-2 transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-[#38C6BA] shrink-0" />
            <span>Achievements</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className="p-2.5 rounded-lg bg-[#1C2D3B] hover:bg-[#2C4654] border border-[#36515F] text-[#F5F7F8] font-semibold flex items-center gap-2 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-[#93D1F2] shrink-0" />
            <span>Game History</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabGlobal('dashboard')}
            className="p-2.5 rounded-lg bg-[#1C2D3B] hover:bg-[#2C4654] border border-[#36515F] text-[#F5F7F8] font-semibold flex items-center gap-2 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-[#A8E5D5] shrink-0" />
            <span>Daily &amp; Home</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabGlobal('settings')}
            className="p-2.5 rounded-lg bg-[#1C2D3B] hover:bg-[#2C4654] border border-[#36515F] text-[#F5F7F8] font-semibold flex items-center gap-2 transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-[#93D1F2] shrink-0" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabGlobal('learn')}
            className="p-2.5 rounded-lg bg-[#1C2D3B] hover:bg-[#2C4654] border border-[#36515F] text-[#F5F7F8] font-semibold flex items-center gap-2 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#38C6BA] shrink-0" />
            <span>Help &amp; Guides</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2.5 rounded-lg bg-[#1C2D3B] hover:bg-[#EF4444]/15 border border-[#36515F] text-[#FCA5A5] font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>{isGuest ? 'Exit Guest' : 'Log Out'}</span>
          </button>
        </div>
      </Card>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-pv-border">
        {[
          { id: 'customization', label: 'Customization' },
          { id: 'preferences', label: 'Preferences' },
          { id: 'preview', label: 'Public Preview' },
          { id: 'pbs', label: 'Personal Bests' },
          { id: 'history', label: 'Activity & Replays' },
          { id: 'wall', label: 'Player Wall' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 h-8 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
                : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Customization */}
      {activeTab === 'customization' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-pv-border pb-3">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
              <User className="w-4 h-4 text-[#38C6BA]" /> Profile Identity
            </h3>
          </div>

          {saved && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-3 rounded-lg text-xs text-center font-medium">
              Profile changes saved successfully.
            </div>
          )}

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-pv-text-secondary">Display Name</label>
            <input
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-pv-surface-secondary border border-pv-border text-pv-text-primary px-3 h-9 rounded-lg text-xs focus:outline-none focus:border-[#38C6BA]"
            />
          </div>

          {/* Title Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-pv-text-secondary">Selected Title</label>
              <span className="text-[11px] text-pv-text-muted">Earned via achievements, levels, and streaks</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-pv-surface-secondary rounded-lg border border-pv-border">
              {TITLE_DEFINITIONS.map((def) => {
                const isUnlocked = unlockedTitles.includes(def.title);
                const isSelected = selectedTitle === def.title;
                return (
                  <button
                    key={def.id}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => isUnlocked && setSelectedTitle(def.title)}
                    className={`p-2.5 rounded-md border text-left transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'border-[#38C6BA] bg-pv-surface-soft text-pv-text-primary font-medium'
                        : isUnlocked
                        ? 'border-pv-border hover:border-pv-border-strong text-pv-text-secondary'
                        : 'border-pv-border/40 bg-pv-surface-primary text-pv-text-muted opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{def.title}</span>
                        {!isUnlocked && <Lock className="w-3 h-3 text-pv-text-muted" />}
                      </div>
                      <p className="text-[10px] text-pv-text-muted line-clamp-1">{def.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#38C6BA] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatar Options */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-pv-text-secondary">Avatar Graphic</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={`p-1 rounded-lg border transition-colors ${
                    selectedAvatar === url
                      ? 'border-[#38C6BA] bg-pv-surface-soft'
                      : 'border-pv-border hover:border-pv-border-strong'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-auto rounded" />
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-pv-text-secondary">Short Biography</label>
              <span className="text-[10px] text-pv-text-muted">{bio.length}/150</span>
            </div>
            <textarea
              maxLength={150}
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your puzzle style or favorite challenge types..."
              className="w-full bg-pv-surface-secondary border border-pv-border text-pv-text-primary px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#38C6BA] resize-none placeholder-pv-text-muted"
            />
          </div>

          {/* Favorite Game Types */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-pv-text-secondary">
                Favorite Puzzle Types (up to 4)
              </label>
              <span className="text-[11px] text-pv-text-muted font-tabular">
                {favoriteGames.length} / 4 selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PUZZLE_MODES.map((p) => {
                const isFav = favoriteGames.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleFavorite(p.id)}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors ${
                      isFav
                        ? 'border-[#38C6BA] bg-pv-surface-soft text-pv-text-primary'
                        : 'border-pv-border hover:border-pv-border-strong text-pv-text-secondary'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <Heart
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isFav ? 'fill-[#38C6BA] text-[#38C6BA]' : 'text-pv-text-muted'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              className="h-9 px-5 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
            {!isGuest && (
              <button
                onClick={handleLogout}
                className="h-9 px-4 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            )}
          </div>
        </Card>
      )}

      {/* TAB 2: Preferences */}
      {activeTab === 'preferences' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-pv-border pb-3">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#38C6BA]" /> Gameplay Settings
            </h3>
            <button
              type="button"
              onClick={() => setActiveTabGlobal('settings')}
              className="text-xs font-semibold text-[#A8E5D5] hover:text-[#38C6BA]"
            >
              Open Full Application Settings →
            </button>
          </div>

          <div className="space-y-4 divide-y divide-pv-border">
            {/* Preferred Difficulty */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold text-pv-text-primary">Default Difficulty</h4>
                <p className="text-[11px] text-pv-text-secondary mt-0.5">
                  Initial difficulty level selected when opening any puzzle
                </p>
              </div>
              <select
                value={preferredDiff}
                onChange={(e) => setPreferredDiff(e.target.value as any)}
                className="bg-pv-surface-secondary border border-pv-border text-pv-text-primary font-medium px-3 h-8 rounded-lg text-xs focus:outline-none"
              >
                <option value="adaptive">Smart Adaptive</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Sound Toggle */}
            <div className="pt-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-pv-text-primary">Audio Effects</h4>
                <p className="text-[11px] text-pv-text-secondary mt-0.5">
                  Play move feedback and victory chimes during puzzles
                </p>
              </div>
              <button
                onClick={toggleSound}
                className="h-8 px-3 rounded-lg border border-pv-border bg-pv-surface-secondary text-pv-text-primary text-xs font-medium flex items-center gap-1.5 hover:bg-pv-surface-soft transition-colors"
              >
                {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#38C6BA]" />}
                <span>{soundMuted ? 'Muted' : 'Enabled'}</span>
              </button>
            </div>

            {/* Privacy Controls */}
            <div className="pt-3 space-y-3">
              <h4 className="text-xs font-semibold text-pv-text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Privacy Controls
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-pv-surface-secondary p-3 rounded-lg border border-pv-border space-y-1">
                  <span className="text-[11px] font-medium text-pv-text-secondary block">
                    Profile Visibility
                  </span>
                  <select
                    value={profileVis}
                    onChange={(e) => setProfileVis(e.target.value as any)}
                    className="w-full bg-pv-surface-primary border border-pv-border text-pv-text-primary px-2.5 h-7 rounded text-xs"
                  >
                    <option value="public">Public</option>
                    <option value="friends_only">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="bg-pv-surface-secondary p-3 rounded-lg border border-pv-border space-y-1">
                  <span className="text-[11px] font-medium text-pv-text-secondary block">
                    Friend Requests
                  </span>
                  <select
                    value={friendVis}
                    onChange={(e) => setFriendVis(e.target.value as any)}
                    className="w-full bg-pv-surface-primary border border-pv-border text-pv-text-primary px-2.5 h-7 rounded text-xs"
                  >
                    <option value="public">Allow Everyone</option>
                    <option value="friends_only">Friends of Friends</option>
                    <option value="private">Block Requests</option>
                  </select>
                </div>
                <div className="bg-pv-surface-secondary p-3 rounded-lg border border-pv-border space-y-1">
                  <span className="text-[11px] font-medium text-pv-text-secondary block">
                    Activity Visibility
                  </span>
                  <select
                    value={activityVis}
                    onChange={(e) => setActivityVis(e.target.value as any)}
                    className="w-full bg-pv-surface-primary border border-pv-border text-pv-text-primary px-2.5 h-7 rounded text-xs"
                  >
                    <option value="public">Public</option>
                    <option value="friends_only">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reset Adaptive Engine */}
            <div className="pt-4">
              <h4 className="text-xs font-semibold text-pv-text-primary mb-1">
                Adaptive Recommendation Calibration
              </h4>
              <p className="text-[11px] text-pv-text-secondary mb-3">
                Recalibrate difficulty calibration weights across all games without modifying coins or level.
              </p>
              {resetConfirm ? (
                <div className="bg-pv-surface-secondary p-3 rounded-lg border border-rose-500/40 flex items-center justify-between">
                  <span className="text-xs text-rose-300">Reset recommendation profiles for all games?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetDifficulty}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium px-3 h-7 rounded"
                    >
                      Confirm Reset
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="bg-pv-surface-primary text-pv-text-secondary text-xs font-medium px-3 h-7 rounded border border-pv-border"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="h-8 px-3 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-secondary hover:text-pv-text-primary border border-pv-border text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Recommendations
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="h-9 px-5 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs font-medium rounded-lg transition-colors"
          >
            Save Preferences
          </button>
        </Card>
      )}

      {/* TAB 3: Public Preview */}
      {activeTab === 'preview' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-pv-border pb-3">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#38C6BA]" /> Public Profile View
            </h3>
            <span className="text-xs text-pv-text-muted capitalize">
              Visibility: {profileVis.replace('_', ' ')}
            </span>
          </div>

          <div className="bg-pv-surface-secondary p-5 rounded-lg border border-pv-border space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={selectedAvatar}
                alt={displayName}
                className="w-14 h-14 rounded-lg border border-pv-border object-cover"
              />
              <div>
                <h4 className="text-base font-semibold text-pv-text-primary">{displayName}</h4>
                <p className="text-xs text-[#38C6BA] font-medium">{selectedTitle}</p>
                <p className="text-[11px] text-pv-text-muted font-mono">@{user?.username || 'player'}</p>
              </div>
            </div>

            {profileVis === 'private' ? (
              <div className="p-4 bg-pv-surface-primary rounded-lg border border-pv-border text-center text-xs text-pv-text-muted">
                This profile is set to Private. Stats and activity are hidden from other players.
              </div>
            ) : (
              <div className="space-y-3">
                {bio && <p className="text-xs text-pv-text-secondary italic">"{bio}"</p>}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-pv-surface-primary p-2.5 rounded-lg border border-pv-border">
                    <span className="text-[10px] text-pv-text-muted block">Level</span>
                    <span className="font-semibold text-pv-text-primary font-tabular">
                      {user?.level || 1}
                    </span>
                  </div>
                  <div className="bg-pv-surface-primary p-2.5 rounded-lg border border-pv-border">
                    <span className="text-[10px] text-pv-text-muted block">Wins</span>
                    <span className="font-semibold text-emerald-400 font-tabular">
                      {user?.totalWins || 0}
                    </span>
                  </div>
                  <div className="bg-pv-surface-primary p-2.5 rounded-lg border border-pv-border">
                    <span className="text-[10px] text-pv-text-muted block">Streak</span>
                    <span className="font-semibold text-[#38C6BA] font-tabular">
                      {user?.currentStreak || 1}d
                    </span>
                  </div>
                </div>

                {favoriteGames.length > 0 && (
                  <div>
                    <span className="text-[10px] text-pv-text-muted font-medium uppercase tracking-wider block mb-1">
                      Favorite Puzzles
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {favoriteGames.map((g) => {
                        const puzzle = PUZZLE_MODES.find((p) => p.id === g);
                        return (
                          <span
                            key={g}
                            className="text-[10px] bg-pv-surface-primary text-pv-text-secondary border border-pv-border px-2 py-0.5 rounded font-medium"
                          >
                            {puzzle?.name || g}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB 4: Personal Bests */}
      {activeTab === 'pbs' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-pv-border pb-3">
              <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
                <Award className="w-4 h-4 text-[#38C6BA]" /> Verified Personal Bests
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PUZZLE_MODES.map((puzzle) => {
                const pb = personalBests[puzzle.id];
                const adapt = adaptiveProfiles[puzzle.id];
                return (
                  <div
                    key={puzzle.id}
                    className="bg-pv-surface-secondary border border-pv-border p-3.5 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-pv-text-primary text-xs">{puzzle.name}</span>
                      <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-pv-surface-primary text-pv-text-muted border border-pv-border">
                        Tier: {adapt?.currentRecommendedDifficulty || 'easy'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-pv-border/60">
                      <div>
                        <span className="text-pv-text-muted block text-[10px]">Best Score</span>
                        <span className="font-semibold text-pv-text-primary font-tabular">
                          {pb?.bestScore ? `${pb.bestScore} pts` : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-pv-text-muted block text-[10px]">Fastest Time</span>
                        <span className="font-semibold text-pv-text-secondary font-tabular">
                          {pb?.bestTime ? `${pb.bestTime}s` : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-pv-text-muted block text-[10px]">Max Diff</span>
                        <span className="font-semibold text-pv-text-secondary uppercase">
                          {pb?.bestDifficulty || 'easy'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: Activity & Replays */}
      {activeTab === 'history' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-pv-border pb-3">
            <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#38C6BA]" /> Recent Game Sessions & Replays
            </h3>
          </div>

          {loadingHistory ? (
            <p className="text-xs text-pv-text-muted py-6 text-center">Loading game history...</p>
          ) : recentSessions.length === 0 ? (
            <p className="text-xs text-pv-text-muted py-6 text-center">
              No recent game sessions recorded. Complete a puzzle to see session records.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentSessions.map((session, idx) => {
                const puzzleInfo = PUZZLE_MODES.find((p) => p.id === session.puzzleType);
                return (
                  <div
                    key={session.id || idx}
                    className="bg-pv-surface-secondary border border-pv-border p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-pv-text-primary text-xs">
                          {puzzleInfo?.name || session.puzzleType}
                        </span>
                        <span
                          className={`text-[10px] font-medium uppercase px-1.5 py-0.2 rounded border ${
                            session.won
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                              : 'bg-rose-950/40 text-rose-400 border-rose-500/40'
                          }`}
                        >
                          {session.won ? 'Solved' : 'Incomplete'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-pv-text-secondary">
                        <span className="font-tabular">Score: {session.score}</span>
                        <span className="font-tabular">Time: {session.timeSeconds}s</span>
                        <span className="capitalize">{session.difficulty}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => startReplaySession(session)}
                      className="h-7 px-3 bg-pv-surface-primary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Replay
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 6: Player Wall */}
      {activeTab === 'wall' && user && (
        <PlayerWallSection profileUserId={user.uid} profileUserName={user.displayName} />
      )}
    </div>
  );
};
