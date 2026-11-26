import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { UserProfile, ShowcaseConfig, UserAchievement, ChallengeItem } from '../types';
import {
  fetchShowcaseConfig,
  fetchUserProfileById,
  fetchUserChallenges,
} from '../services/firebase';
import { DEFAULT_ACHIEVEMENTS, PUZZLE_MODES } from '../data/puzzles';
import {
  Trophy,
  Award,
  Medal,
  Sparkles,
  Share2,
  Edit3,
  Flame,
  CheckCircle,
  Lock,
  Swords,
  Target,
  ChevronLeft,
} from 'lucide-react';
import { ShowcaseCustomizerModal } from '../components/ShowcaseCustomizerModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface ShowcasePageProps {
  targetUserId?: string;
}

export const ShowcasePage: React.FC<ShowcasePageProps> = ({ targetUserId }) => {
  const { user: currentUser, setActiveTab } = useStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [config, setConfig] = useState<ShowcaseConfig | null>(null);
  const [userAchievements] = useState<UserAchievement[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const effectiveUserId = targetUserId || currentUser?.uid;
  const isOwner = currentUser?.uid === effectiveUserId;

  useEffect(() => {
    async function loadShowcaseData() {
      if (!effectiveUserId) return;
      setLoading(true);
      let loadedProfile: UserProfile | null = null;
      if (isOwner && currentUser) {
        loadedProfile = currentUser;
      } else {
        loadedProfile = await fetchUserProfileById(effectiveUserId);
      }
      setProfile(loadedProfile);

      if (loadedProfile) {
        const loadedConfig = await fetchShowcaseConfig(effectiveUserId);
        setConfig(loadedConfig);
        const loadedChallenges = await fetchUserChallenges(effectiveUserId);
        setChallenges(loadedChallenges);
      }
      setLoading(false);
    }
    loadShowcaseData();
  }, [effectiveUserId, isOwner, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-pv-text-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#38C6BA]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="text-center py-20 p-8 space-y-4 max-w-md mx-auto">
        <Lock className="w-10 h-10 text-[#38C6BA] mx-auto" />
        <h2 className="text-lg font-bold text-pv-text-primary">Showcase Unavailable</h2>
        <p className="text-xs text-pv-text-muted">
          The player profile or showcase record could not be found.
        </p>
        <Button onClick={() => setActiveTab('dashboard')} variant="secondary" size="sm">
          Return to Dashboard
        </Button>
      </Card>
    );
  }

  const privacySetting = profile.privacy?.profileVisibility || 'public';
  if (!isOwner && privacySetting === 'private') {
    return (
      <Card className="text-center py-20 p-8 space-y-4 max-w-md mx-auto">
        <Lock className="w-10 h-10 text-pv-text-muted mx-auto" />
        <h2 className="text-lg font-bold text-pv-text-primary">Private Showcase</h2>
        <p className="text-xs text-pv-text-muted">
          This player has set their profile showcase to private.
        </p>
      </Card>
    );
  }

  const featuredTitle = config?.featuredTitle || profile.selectedTitle || 'Puzzle Apprentice';
  const featuredBadge = config?.featuredBadge || 'Puzzle Specialist';
  const featuredAchIds = config?.featuredAchievementIds || [];
  const featuredPuzzleTypes = config?.featuredPuzzleTypes || ['number', 'word', 'logic'];
  const featuredAchList = DEFAULT_ACHIEVEMENTS.filter((a) => featuredAchIds.includes(a.id));
  const completedChallengesCount = challenges.filter(
    (c) => c.status === 'COMPLETED' && c.winnerUid === profile.uid
  ).length;

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}#showcase=${profile.uid}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-1.5 text-xs text-pv-text-muted hover:text-pv-text-primary transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Profile
        </button>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleShareLink}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5"
            >
              {copiedLink ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>{copiedLink ? 'Link Copied' : 'Share Showcase'}</span>
            </Button>
            <Button
              onClick={() => setShowCustomizer(true)}
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Customize Showcase</span>
            </Button>
          </div>
        )}
      </div>

      {/* Hero Showcase Banner */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-lg bg-pv-surface-soft border border-pv-border flex items-center justify-center text-2xl font-bold text-pv-text-primary font-tabular">
              {profile.displayName ? profile.displayName.slice(0, 2).toUpperCase() : 'PV'}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#38C6BA] text-[#142331] font-semibold font-bold text-[10px] px-2 py-0.5 rounded uppercase font-tabular border border-pv-surface-primary">
              Lv. {profile.level}
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-pv-text-primary">{profile.displayName}</h1>
              <span className="bg-[#38C6BA]/10 text-[#38C6BA] border border-[#38C6BA]/20 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {featuredTitle}
              </span>
            </div>
            <p className="text-xs text-pv-text-muted">
              @{profile.username} • Joined {new Date(profile.createdAt).toLocaleDateString()}
            </p>
            {profile.bio && <p className="text-xs text-pv-text-secondary italic">{profile.bio}</p>}
          </div>

          {/* Quick Stats Block */}
          <div className="grid grid-cols-3 gap-4 border-t sm:border-t-0 sm:border-l border-pv-border pt-4 sm:pt-0 sm:pl-6 text-center">
            <div>
              <p className="text-[10px] text-pv-text-muted font-medium uppercase">Wins</p>
              <p className="text-lg font-bold text-pv-text-primary font-tabular">
                {profile.totalWins}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-pv-text-muted font-medium uppercase">Streak</p>
              <p className="text-lg font-bold text-[#38C6BA] flex items-center justify-center gap-1 font-tabular">
                <Flame className="w-4 h-4 fill-current" /> {profile.currentStreak}d
              </p>
            </div>
            <div>
              <p className="text-[10px] text-pv-text-muted font-medium uppercase">Level</p>
              <p className="text-lg font-bold text-pv-text-primary font-tabular">
                {profile.level}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Featured Achievements Section */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#38C6BA]" />
          <span>Featured Achievements</span>
        </h3>
        {featuredAchList.length === 0 ? (
          <p className="text-xs text-pv-text-muted">No featured achievements selected.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featuredAchList.map((ach) => (
              <div
                key={ach.id}
                className="bg-pv-surface-soft p-3 rounded-lg border border-pv-border flex items-center gap-3"
              >
                <div className="p-2.5 bg-pv-surface-elevated text-[#38C6BA] rounded border border-pv-border">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-pv-text-primary">{ach.title}</h4>
                  <p className="text-xs text-pv-text-muted">{ach.description}</p>
                  <span className="text-[10px] text-[#38C6BA] font-medium font-tabular mt-0.5 inline-block">
                    +100 XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Personal Best Highlights */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-pv-text-primary flex items-center gap-2">
          <Medal className="w-4 h-4 text-[#38C6BA]" />
          <span>Personal Best Records</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {featuredPuzzleTypes.map((pzId) => {
            const pzMeta = PUZZLE_MODES.find((p) => p.id === pzId);
            const pb = profile.personalBests?.[pzId];
            return (
              <div
                key={pzId}
                className="bg-pv-surface-soft p-3.5 rounded-lg border border-pv-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-pv-text-primary">
                    {pzMeta?.name || pzId}
                  </span>
                  <span className="text-[10px] bg-pv-surface-elevated border border-pv-border px-1.5 py-0.5 rounded text-pv-text-muted">
                    {pzMeta?.category || 'Puzzle'}
                  </span>
                </div>
                {pb && pb.bestScore > 0 ? (
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <p className="text-[10px] text-pv-text-muted font-medium uppercase">Best Score</p>
                      <p className="text-base font-bold text-pv-text-primary font-tabular">
                        {pb.bestScore}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-pv-text-muted font-medium uppercase">Best Time</p>
                      <p className="text-base font-bold text-[#38C6BA] font-tabular">
                        {pb.bestTime}s
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-pv-text-muted py-2">No record yet</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Competitive & Event Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-semibold text-pv-text-primary flex items-center gap-2">
            <Swords className="w-4 h-4 text-[#38C6BA]" />
            <span>Competitive Records</span>
          </h3>
          <div className="bg-pv-surface-soft p-3 rounded-lg border border-pv-border flex items-center justify-between">
            <div>
              <p className="text-xs text-pv-text-muted">Competitive Matches Won</p>
              <p className="text-xl font-bold text-pv-text-primary font-tabular">
                {completedChallengesCount}
              </p>
            </div>
            <Swords className="w-6 h-6 text-pv-text-muted" />
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-semibold text-pv-text-primary flex items-center gap-2">
            <Target className="w-4 h-4 text-[#38C6BA]" />
            <span>Featured Title</span>
          </h3>
          <div className="bg-pv-surface-soft p-3 rounded-lg border border-pv-border flex items-center gap-3">
            <div className="p-2.5 bg-pv-surface-elevated text-[#38C6BA] rounded border border-pv-border">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-pv-text-primary">{featuredBadge}</p>
              <p className="text-[11px] text-pv-text-muted">Verified Player Badge</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Customizer Modal */}
      {showCustomizer && (
        <ShowcaseCustomizerModal
          user={profile}
          initialConfig={config}
          userAchievements={userAchievements}
          onClose={() => setShowCustomizer(false)}
          onSaved={(newConfig) => {
            setConfig(newConfig);
            setShowCustomizer(false);
          }}
        />
      )}
    </div>
  );
};
