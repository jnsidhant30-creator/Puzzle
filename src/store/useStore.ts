import { create } from 'zustand';
import {
  UserProfile,
  PuzzleType,
  Difficulty,
  GameSession,
  JourneyStage,
  PracticeChallenge,
  Club,
  ClubMember,
  SupportedLanguage,
} from '../types';
import { sound } from '../services/sound';
import {
  updateUserStats,
  processPersonalBestAndAdaptiveDifficulty,
  resetUserAdaptiveProfilesInDB,
  updateUserProfileInDB,
  recordClubGameContribution,
} from '../services/firebase';
import { getAvatarDataUri } from '../utils/avatar';

export type ActiveTab =
  | 'dashboard'
  | 'games'
  | 'game_play'
  | 'daily'
  | 'leaderboard'
  | 'achievements'
  | 'community'
  | 'friends'
  | 'admin'
  | 'profile'
  | 'settings'
  | 'download'
  | 'desktop_auth'
  | 'events'
  | 'event_detail'
  | 'insights'
  | 'challenges'
  | 'goals'
  | 'showcase'
  | 'collections'
  | 'collection_detail'
  | 'journey'
  | 'learn'
  | 'mastery'
  | 'mastery_practice'
  | 'clubs'
  | 'club_detail'
  | 'club_events'
  | 'club_discussions'
  | 'club_guides';

interface StoreState {
  user: UserProfile | null;
  authLoading: boolean;
  isGuest: boolean;
  isOnline: boolean;
  theme: 'cyberpunk' | 'dark' | 'light' | 'neon';
  soundMuted: boolean;
  reduceMotion: boolean;
  language: SupportedLanguage;
  highContrast: boolean;
  dyslexicFont: boolean;
  fontSizeScale: 'sm' | 'md' | 'lg' | 'xl';
  activeTab: ActiveTab;
  selectedPuzzle: PuzzleType | null;
  selectedDifficulty: Difficulty;
  selectedSeed?: number;
  selectedEventId: string | null;
  activeChallengeId: string | null;
  selectedCollectionId: string | null;
  activeCollectionIndex: number;
  selectedJourneyStageId: string | null;
  selectedLearnPuzzleType: PuzzleType | null;
  selectedMasteryPuzzleType: PuzzleType | null;
  activePracticeChallenge: PracticeChallenge | null;
  selectedClubId: string | null;
  userClub: Club | null;
  userClubMember: ClubMember | null;
  isReplayAttempt: boolean;
  isDailySession: boolean;
  originalReplaySessionId?: string;
  levelUpModal: { show: boolean; newLevel: number; coinsAwarded: number } | null;
  pbToast: {
    show: boolean;
    puzzleName: string;
    score: number;
    timeSeconds: number;
    improvementMsg: string;
  } | null;
  isMobileMenuOpen: boolean;
  isSidebarCollapsed: boolean;

  setOnlineStatus: (online: boolean) => void;
  retryConnection: () => Promise<boolean>;
  enterOfflineGuestMode: () => void;
  toggleSidebarCollapse: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setTheme: (theme: 'cyberpunk' | 'dark' | 'light' | 'neon') => void;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleHighContrast: () => void;
  toggleDyslexicFont: () => void;
  toggleReduceMotion: () => void;
  setFontSizeScale: (scale: 'sm' | 'md' | 'lg' | 'xl') => void;
  toggleSound: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  playGame: (puzzle: PuzzleType, difficulty?: Difficulty, seed?: number, isDaily?: boolean) => void;
  playChallengeMatch: (challengeId: string, puzzle: PuzzleType, difficulty: Difficulty, seed: number) => void;
  viewEventDetail: (eventId: string) => void;
  playEventPuzzle: (eventId: string, puzzle: PuzzleType, difficulty?: Difficulty) => void;
  viewCollectionDetail: (collectionId: string) => void;
  playCollectionPuzzle: (
    collectionId: string,
    itemIndex: number,
    puzzle: PuzzleType,
    difficulty: Difficulty,
    seed?: number
  ) => void;
  playJourneyStage: (stage: JourneyStage) => void;
  viewPuzzleGuide: (puzzleType: PuzzleType) => void;
  viewMasteryDetail: (puzzleType?: PuzzleType) => void;
  startPracticeChallenge: (challenge: PracticeChallenge) => void;
  viewClubDetail: (clubId: string) => void;
  viewClubEvents: (clubId: string) => void;
  viewClubDiscussions: (clubId: string) => void;
  viewClubGuides: (clubId: string) => void;
  viewClubsHub: () => void;
  setUserClub: (club: Club | null, member: ClubMember | null) => void;
  startReplaySession: (session: GameSession) => void;
  closeLevelUpModal: () => void;
  closePbToast: () => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  getRecommendedDifficulty: (puzzle: PuzzleType) => Difficulty;
  resetAdaptiveProfiles: () => Promise<void>;
  addXPAndCoins: (
    xpGained: number,
    score: number,
    timeSeconds: number,
    won: boolean
  ) => Promise<{ isPB: boolean; pbDiffMsg?: string; coinsAwarded: number }>;
  useHint: () => boolean;
  buyHints: (count: number, cost: number) => boolean;
  setAuthLoading: (loading: boolean) => void;
  setUser: (user: UserProfile | null, guest?: boolean) => void;
}

const LOCAL_STORAGE_KEY = 'puzzleverse_guest_user';
const OFFLINE_PRACTICE_KEY = 'puzzleverse_offline_practice_v1';

function createOrLoadOfflineGuestUser(): UserProfile {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserProfile;
      if (parsed?.uid?.startsWith('guest_')) return parsed;
    }
  } catch {
    // Ignore parse failures
  }
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: 'guest_offline_player',
    username: 'offline_player',
    displayName: 'Guest Player',
    email: '',
    avatarUrl: getAvatarDataUri('guest_offline_player'),
    role: 'PLAYER',
    level: 1,
    xp: 0,
    totalGames: 0,
    totalWins: 0,
    bestScore: 0,
    bestTime: 0,
    currentStreak: 1,
    longestStreak: 1,
    coins: 100,
    hints: 5,
    personalBests: {},
    adaptiveProfiles: {},
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export const useStore = create<StoreState>((set, get) => {
  const initialTheme = (localStorage.getItem('puzzleverse_theme') as StoreState['theme']) || 'dark';
  const initialLang = (localStorage.getItem('pv_lang') as SupportedLanguage) || 'en';
  const initialHC = localStorage.getItem('pv_hc') === 'true';
  const initialDys = localStorage.getItem('pv_dys') === 'true';
  const initialReduceMotion = localStorage.getItem('pv_reduce_motion') === 'true';
  const initialFS = (localStorage.getItem('pv_fs') as StoreState['fontSizeScale']) || 'md';

  if (typeof document !== 'undefined') {
    if (initialReduceMotion) document.documentElement.classList.add('reduce-motion');
    if (initialHC) document.documentElement.classList.add('high-contrast');
    if (initialDys) document.documentElement.classList.add('dyslexic-font');
  }

  return {
    user: null,
    authLoading: true,
    isGuest: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    theme: initialTheme,
    soundMuted: sound.getMuted(),
    reduceMotion: initialReduceMotion,
    language: initialLang,
    highContrast: initialHC,
    dyslexicFont: initialDys,
    fontSizeScale: initialFS,
    activeTab: 'dashboard',
    selectedPuzzle: null,
    selectedDifficulty: 'easy',
    selectedSeed: undefined,
    selectedEventId: null,
    activeChallengeId: null,
    selectedCollectionId: null,
    activeCollectionIndex: 0,
    selectedJourneyStageId: null,
    selectedLearnPuzzleType: null,
    selectedMasteryPuzzleType: null,
    activePracticeChallenge: null,
    selectedClubId: null,
    userClub: null,
    userClubMember: null,
    isReplayAttempt: false,
    isDailySession: false,
    originalReplaySessionId: undefined,
    levelUpModal: null,
    pbToast: null,
    isMobileMenuOpen: false,
    isSidebarCollapsed: localStorage.getItem('pv_sidebar_collapsed') === 'true',

    setOnlineStatus: (online) => set({ isOnline: online }),

    retryConnection: async () => {
      let online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (window.puzzleverseDesktop?.checkOnline) {
        try {
          online = await window.puzzleverseDesktop.checkOnline();
        } catch {
          // Keep navigator status
        }
      }
      if (online && typeof fetch !== 'undefined') {
        try {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 3500);
          await fetch('https://www.gstatic.com/generate_204', { mode: 'no-cors', signal: controller.signal });
          clearTimeout(t);
          online = true;
        } catch {
          online = typeof navigator !== 'undefined' ? navigator.onLine : false;
        }
      }
      set({ isOnline: online });
      return online;
    },

    enterOfflineGuestMode: () => {
      const guestProfile = createOrLoadOfflineGuestUser();
      set({
        user: guestProfile,
        isGuest: true,
        authLoading: false,
        activeTab: 'dashboard',
      });
    },

    toggleSidebarCollapse: () => {
      const next = !get().isSidebarCollapsed;
      set({ isSidebarCollapsed: next });
      localStorage.setItem('pv_sidebar_collapsed', String(next));
    },

    setAuthLoading: (loading) => set({ authLoading: loading }),

    setUser: (user, guest = false) => {
      set({ user, isGuest: guest });
      if (guest && user) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
      } else if (!guest && !user) {
        // Explicit logout keeps offline practice data optional; clear active guest session flag cleanly
        set({ isGuest: false });
      }
    },

    updateProfile: async (updates) => {
      const { user, isGuest, isOnline } = get();
      if (!user) return;
      const updatedUser: UserProfile = { ...user, ...updates, updatedAt: new Date().toISOString() };
      set({ user: updatedUser });
      if (isGuest || user.uid.startsWith('guest_')) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUser));
      } else if (isOnline) {
        await updateUserProfileInDB(user.uid, updates);
      }
    },

    setTheme: (theme) => {
      set({ theme });
      localStorage.setItem('puzzleverse_theme', theme);
      document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk', 'theme-neon');
      document.documentElement.classList.add(`theme-${theme}`);
    },

    setLanguage: (lang) => {
      set({ language: lang });
      localStorage.setItem('pv_lang', lang);
    },

    toggleHighContrast: () => {
      const hc = !get().highContrast;
      set({ highContrast: hc });
      localStorage.setItem('pv_hc', String(hc));
      document.documentElement.classList.toggle('high-contrast', hc);
    },

    toggleDyslexicFont: () => {
      const dys = !get().dyslexicFont;
      set({ dyslexicFont: dys });
      localStorage.setItem('pv_dys', String(dys));
      document.documentElement.classList.toggle('dyslexic-font', dys);
    },

    toggleReduceMotion: () => {
      const rm = !get().reduceMotion;
      set({ reduceMotion: rm });
      localStorage.setItem('pv_reduce_motion', String(rm));
      document.documentElement.classList.toggle('reduce-motion', rm);
    },

    setFontSizeScale: (scale) => {
      set({ fontSizeScale: scale });
      localStorage.setItem('pv_fs', scale);
      document.documentElement.classList.remove('text-scale-sm', 'text-scale-md', 'text-scale-lg', 'text-scale-xl');
      document.documentElement.classList.add(`text-scale-${scale}`);
    },

    toggleSound: () => {
      const muted = !get().soundMuted;
      sound.setMuted(muted);
      set({ soundMuted: muted });
    },

    setActiveTab: (tab) => {
      sound.playClick();
      set({ activeTab: tab });
    },

    getRecommendedDifficulty: (puzzle: PuzzleType) => {
      const { user } = get();
      if (!user || !user.adaptiveProfiles || !user.adaptiveProfiles[puzzle]) {
        return 'easy';
      }
      return user.adaptiveProfiles[puzzle]!.currentRecommendedDifficulty || 'easy';
    },

    playGame: (puzzle, difficulty, seed, isDaily = false) => {
      sound.playClick();
      const recDiff = difficulty || get().getRecommendedDifficulty(puzzle);
      set({
        selectedPuzzle: puzzle,
        selectedDifficulty: recDiff,
        selectedSeed: seed,
        selectedEventId: null,
        activeChallengeId: null,
        isReplayAttempt: false,
        isDailySession: isDaily,
        originalReplaySessionId: undefined,
        activeTab: 'game_play',
      });
    },

    playChallengeMatch: (challengeId, puzzle, difficulty, seed) => {
      sound.playClick();
      set({
        selectedPuzzle: puzzle,
        selectedDifficulty: difficulty,
        selectedSeed: seed,
        selectedEventId: null,
        activeChallengeId: challengeId,
        isReplayAttempt: false,
        isDailySession: false,
        originalReplaySessionId: undefined,
        activeTab: 'game_play',
      });
    },

    viewEventDetail: (eventId: string) => {
      sound.playClick();
      set({ selectedEventId: eventId, activeTab: 'event_detail' });
    },

    playEventPuzzle: (eventId: string, puzzle: PuzzleType, difficulty?: Difficulty) => {
      sound.playClick();
      const recDiff = difficulty || get().getRecommendedDifficulty(puzzle);
      set({
        selectedEventId: eventId,
        selectedPuzzle: puzzle,
        selectedDifficulty: recDiff,
        selectedSeed: Math.floor(Math.random() * 100000),
        isReplayAttempt: false,
        isDailySession: false,
        originalReplaySessionId: undefined,
        activeTab: 'game_play',
      });
    },

    viewCollectionDetail: (collectionId: string) => {
      sound.playClick();
      set({ selectedCollectionId: collectionId, activeTab: 'collection_detail' });
    },

    playCollectionPuzzle: (
      collectionId: string,
      itemIndex: number,
      puzzle: PuzzleType,
      difficulty: Difficulty,
      seed?: number
    ) => {
      sound.playClick();
      set({
        selectedCollectionId: collectionId,
        activeCollectionIndex: itemIndex,
        selectedPuzzle: puzzle,
        selectedDifficulty: difficulty,
        selectedSeed: seed || Math.floor(Math.random() * 100000),
        selectedEventId: null,
        activeChallengeId: null,
        selectedJourneyStageId: null,
        isReplayAttempt: false,
        isDailySession: false,
        originalReplaySessionId: undefined,
        activeTab: 'game_play',
      });
    },

    playJourneyStage: (stage: JourneyStage) => {
      sound.playClick();
      set({
        selectedJourneyStageId: stage.id,
        selectedPuzzle: stage.puzzleType,
        selectedDifficulty: stage.difficulty,
        selectedSeed: stage.seed,
        selectedEventId: null,
        activeChallengeId: null,
        selectedCollectionId: null,
        isReplayAttempt: false,
        isDailySession: false,
        originalReplaySessionId: undefined,
        activeTab: 'game_play',
      });
    },

    viewPuzzleGuide: (puzzleType: PuzzleType) => {
      sound.playClick();
      set({ selectedLearnPuzzleType: puzzleType, activeTab: 'learn' });
    },

    viewMasteryDetail: (puzzleType?: PuzzleType) => {
      sound.playClick();
      set({ selectedMasteryPuzzleType: puzzleType || null, activeTab: 'mastery' });
    },

    startPracticeChallenge: (challenge: PracticeChallenge) => {
      sound.playClick();
      set({
        activePracticeChallenge: challenge,
        selectedPuzzle: challenge.puzzleType,
        selectedDifficulty: challenge.difficulty,
        selectedSeed: challenge.seed || Math.floor(Math.random() * 100000),
        selectedEventId: null,
        activeChallengeId: null,
        selectedCollectionId: null,
        selectedJourneyStageId: null,
        isReplayAttempt: false,
        isDailySession: false,
        originalReplaySessionId: undefined,
        activeTab: 'game_play',
      });
    },

    viewClubDetail: (clubId: string) => {
      sound.playClick();
      set({ selectedClubId: clubId, activeTab: 'club_detail' });
    },
    viewClubEvents: (clubId: string) => {
      sound.playClick();
      set({ selectedClubId: clubId, activeTab: 'club_events' });
    },
    viewClubDiscussions: (clubId: string) => {
      sound.playClick();
      set({ selectedClubId: clubId, activeTab: 'club_discussions' });
    },
    viewClubGuides: (clubId: string) => {
      sound.playClick();
      set({ selectedClubId: clubId, activeTab: 'club_guides' });
    },
    viewClubsHub: () => {
      sound.playClick();
      set({ activeTab: 'clubs' });
    },
    setUserClub: (club, member) => set({ userClub: club, userClubMember: member }),

    startReplaySession: (session: GameSession) => {
      sound.playClick();
      set({
        selectedPuzzle: session.puzzleType,
        selectedDifficulty: session.difficulty,
        selectedSeed: session.puzzleSeed || Math.floor(Math.random() * 100000),
        isReplayAttempt: true,
        isDailySession: false,
        originalReplaySessionId: session.id,
        activeTab: 'game_play',
      });
    },

    closeLevelUpModal: () => set({ levelUpModal: null }),
    closePbToast: () => set({ pbToast: null }),
    setIsMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

    resetAdaptiveProfiles: async () => {
      const { user, isGuest, isOnline } = get();
      if (!user) return;
      const updatedUser: UserProfile = {
        ...user,
        adaptiveProfiles: {},
        updatedAt: new Date().toISOString(),
      };
      set({ user: updatedUser });
      if (isGuest || user.uid.startsWith('guest_')) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUser));
      } else if (isOnline) {
        await resetUserAdaptiveProfilesInDB(user.uid);
      }
    },

    addXPAndCoins: async (xpGained, score, timeSeconds, won) => {
      const {
        user,
        isGuest,
        isOnline,
        selectedPuzzle,
        selectedDifficulty,
        isReplayAttempt,
        originalReplaySessionId,
        selectedSeed,
      } = get();
      if (!user) return { isPB: false, coinsAwarded: 0 };

      const effectiveXp = isReplayAttempt ? 0 : xpGained;
      const oldLevel = user.level;
      const newXP = user.xp + effectiveXp;
      const newLevel = Math.floor(newXP / 250) + 1;
      const coinsEarned = isReplayAttempt ? 0 : won ? 25 : 5;
      const newCoins = user.coins + coinsEarned;
      const newWins = won ? user.totalWins + 1 : user.totalWins;
      const newGames = user.totalGames + 1;
      const newBestScore = Math.max(user.bestScore, score);
      const newBestTime = user.bestTime === 0 ? timeSeconds : Math.min(user.bestTime, timeSeconds);

      const intermediateUser: UserProfile = {
        ...user,
        xp: newXP,
        level: newLevel,
        coins: newCoins,
        totalGames: newGames,
        totalWins: newWins,
        bestScore: newBestScore,
        bestTime: newBestTime,
        updatedAt: new Date().toISOString(),
      };

      const sessionData: GameSession = {
        userId: user.uid,
        username: user.displayName,
        puzzleType: selectedPuzzle || 'number',
        difficulty: selectedDifficulty,
        score,
        timeSeconds,
        moves: 0,
        won,
        isReplay: isReplayAttempt,
        originalSessionId: originalReplaySessionId,
        puzzleSeed: selectedSeed,
        createdAt: new Date().toISOString(),
      };

      // Keep offline / guest sessions strictly local and separated from verified online profiles
      const effectiveUid = isOnline && !isGuest ? user.uid : `guest_offline_${user.uid}`;
      const { isPersonalBest, personalBestDiff, updatedUser } =
        await processPersonalBestAndAdaptiveDifficulty(effectiveUid, sessionData, intermediateUser);
      set({ user: updatedUser });

      if (isGuest || user.uid.startsWith('guest_') || !isOnline) {
        if (isGuest || user.uid.startsWith('guest_')) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUser));
        }
        try {
          const hist = JSON.parse(localStorage.getItem(OFFLINE_PRACTICE_KEY) || '[]');
          hist.unshift({ ...sessionData, offlinePractice: true });
          localStorage.setItem(OFFLINE_PRACTICE_KEY, JSON.stringify(hist.slice(0, 50)));
        } catch {
          // Ignore storage quota issues
        }
      } else {
        await updateUserStats(user.uid, effectiveXp, score, timeSeconds, won);
        if (won && xpGained > 0) {
          recordClubGameContribution(user.uid, xpGained, score, selectedPuzzle || 'number').catch(() => {});
        }
      }

      let pbDiffMsg = '';
      if (isPersonalBest) {
        sound.playSuccess();
        if (personalBestDiff?.recordType === 'SCORE') {
          pbDiffMsg = `+${personalBestDiff.scoreDiff} pts higher!`;
        } else if (personalBestDiff?.recordType === 'TIME') {
          pbDiffMsg = `${personalBestDiff.timeDiff}s faster!`;
        } else {
          pbDiffMsg = `New difficulty record!`;
        }
        set({
          pbToast: {
            show: true,
            puzzleName: (selectedPuzzle || 'Puzzle').toUpperCase(),
            score,
            timeSeconds,
            improvementMsg: pbDiffMsg,
          },
        });
      }
      if (newLevel > oldLevel) {
        sound.playLevelUp();
        set({ levelUpModal: { show: true, newLevel, coinsAwarded: 100 } });
      } else if (won && !isPersonalBest) {
        sound.playSuccess();
      }
      return { isPB: isPersonalBest, pbDiffMsg, coinsAwarded: coinsEarned };
    },

    useHint: () => {
      const { user, isGuest } = get();
      if (!user || user.hints <= 0) return false;
      const updated = { ...user, hints: user.hints - 1 };
      set({ user: updated });
      if (isGuest) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      return true;
    },

    buyHints: (count, cost) => {
      const { user, isGuest } = get();
      if (!user || user.coins < cost) return false;
      const updated = { ...user, coins: user.coins - cost, hints: user.hints + count };
      set({ user: updated });
      sound.playClick();
      if (isGuest) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      return true;
    },
  };
});
