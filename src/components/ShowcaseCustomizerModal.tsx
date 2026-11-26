import React, { useState } from 'react';
import { ShowcaseConfig, UserProfile, UserAchievement } from '../types';
import { TITLE_DEFINITIONS, getUnlockedTitles } from '../services/recommendation';
import { DEFAULT_ACHIEVEMENTS, PUZZLE_MODES } from '../data/puzzles';
import { X, Trophy, Award, Medal, Check, Save } from 'lucide-react';
import { saveShowcaseConfig } from '../services/firebase';

interface ShowcaseCustomizerModalProps {
  user: UserProfile;
  initialConfig: ShowcaseConfig | null;
  userAchievements: UserAchievement[];
  onClose: () => void;
  onSaved: (updatedConfig: ShowcaseConfig) => void;
}

export const ShowcaseCustomizerModal: React.FC<ShowcaseCustomizerModalProps> = ({
  user,
  initialConfig,
  userAchievements,
  onClose,
  onSaved,
}) => {
  const unlockedTitles = getUnlockedTitles(user);
  const unlockedAchIds = new Set(
    userAchievements.filter((a) => a.unlockedAt).map((a) => a.achievementId)
  );
  const [featuredTitle, setFeaturedTitle] = useState<string>(
    initialConfig?.featuredTitle || user.selectedTitle || 'Puzzle Apprentice'
  );
  const [selectedAchIds, setSelectedAchIds] = useState<string[]>(
    (initialConfig?.featuredAchievementIds || []).filter((id) => unlockedAchIds.has(id))
  );
  const [featuredBadge, setFeaturedBadge] = useState<string>(
    initialConfig?.featuredBadge || 'Puzzle Specialist'
  );
  const [selectedPuzzles, setSelectedPuzzles] = useState<string[]>(
    initialConfig?.featuredPuzzleTypes || ['number', 'word', 'logic']
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleAchievement = (achId: string) => {
    if (selectedAchIds.includes(achId)) {
      setSelectedAchIds(selectedAchIds.filter((id) => id !== achId));
    } else {
      if (selectedAchIds.length >= 4) return;
      setSelectedAchIds([...selectedAchIds, achId]);
    }
  };

  const handleTogglePuzzle = (pzId: string) => {
    if (selectedPuzzles.includes(pzId)) {
      setSelectedPuzzles(selectedPuzzles.filter((p) => p !== pzId));
    } else {
      if (selectedPuzzles.length >= 4) return;
      setSelectedPuzzles([...selectedPuzzles, pzId]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const newConfig: ShowcaseConfig = {
      userId: user.uid,
      featuredTitle: unlockedTitles.includes(featuredTitle) ? featuredTitle : unlockedTitles[0] || 'Puzzle Apprentice',
      featuredAchievementIds: selectedAchIds,
      featuredBadge,
      featuredPuzzleTypes: selectedPuzzles as any,
      updatedAt: new Date().toISOString(),
    };
    await saveShowcaseConfig(newConfig);
    setIsSaving(false);
    onSaved(newConfig);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-pv-surface-primary border border-pv-border rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-pv-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-pv-text-primary">Customize Showcase</h2>
            <p className="text-xs text-pv-text-secondary mt-0.5">
              Select verified accomplishments to highlight on your public profile.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-pv-text-muted hover:text-pv-text-primary hover:bg-pv-surface-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Title Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-pv-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-pv-dragon-fruit" /> Featured Title
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {unlockedTitles.map((title) => {
                const isSelected = featuredTitle === title;
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setFeaturedTitle(title)}
                    className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-pv-surface-soft border-pv-dragon-fruit text-pv-text-primary font-medium'
                        : 'bg-pv-surface-secondary border-pv-border text-pv-text-secondary hover:border-pv-border-strong hover:text-pv-text-primary'
                    }`}
                  >
                    <span>{title}</span>
                    {isSelected && <Check className="w-4 h-4 text-pv-dragon-fruit" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Achievement Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-pv-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-pv-dragon-fruit" /> Featured Achievements (up to 4)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_ACHIEVEMENTS.map((ach) => {
                const isUnlocked = unlockedAchIds.has(ach.id);
                const isSelected = selectedAchIds.includes(ach.id);
                return (
                  <button
                    key={ach.id}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => handleToggleAchievement(ach.id)}
                    className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      !isUnlocked
                        ? 'opacity-35 bg-pv-surface-secondary border-pv-border text-pv-text-muted cursor-not-allowed'
                        : isSelected
                        ? 'bg-pv-surface-soft border-pv-dragon-fruit text-pv-text-primary font-medium'
                        : 'bg-pv-surface-secondary border-pv-border text-pv-text-secondary hover:border-pv-border-strong hover:text-pv-text-primary'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-xs">{ach.title}</p>
                      <p className="text-[11px] text-pv-text-muted mt-0.5">{ach.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-pv-dragon-fruit shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Bests Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-pv-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Medal className="w-3.5 h-3.5 text-pv-dragon-fruit" /> Featured Personal Bests (up to 4)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PUZZLE_MODES.slice(0, 8).map((pz) => {
                const isSelected = selectedPuzzles.includes(pz.id);
                const pb = user.personalBests?.[pz.id];
                return (
                  <button
                    key={pz.id}
                    type="button"
                    onClick={() => handleTogglePuzzle(pz.id)}
                    className={`p-2.5 rounded-lg border text-center transition-colors ${
                      isSelected
                        ? 'bg-pv-surface-soft border-pv-dragon-fruit text-pv-text-primary font-medium'
                        : 'bg-pv-surface-secondary border-pv-border text-pv-text-secondary hover:border-pv-border-strong hover:text-pv-text-primary'
                    }`}
                  >
                    <p className="font-medium text-xs truncate">{pz.name}</p>
                    <p className="text-[11px] text-pv-text-muted mt-1 font-tabular">
                      {pb ? `${pb.bestScore} pts` : 'No Record'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pv-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-lg text-pv-text-secondary hover:text-pv-text-primary text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 px-4 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Showcase'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
