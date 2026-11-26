import React, { useState } from 'react';
import { ShowcaseConfig, UserProfile, UserAchievement } from '../types';
import { getUnlockedTitles } from '../services/recommendation';
import { DEFAULT_ACHIEVEMENTS, PUZZLE_MODES } from '../data/puzzles';
import { X, Trophy, Award, Medal, Check, Save } from 'lucide-react';
import { saveShowcaseConfig } from '../services/firebase';
import { Button } from './ui/Button';

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
  const [featuredBadge] = useState<string>(
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
      <div className="bg-[#233D4A] border border-[#4A6A7B] rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-[#36515F] flex items-center justify-between bg-[#1C2D3B]">
          <div>
            <h2 className="text-lg font-bold text-[#F5F7F8]">Customize Showcase</h2>
            <p className="text-xs text-[#B4C3CE] mt-0.5">
              Choose titles, badges, and records for your public player card.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#B4C3CE] hover:text-[#F5F7F8] hover:bg-[#233D4A] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#F5F7F8] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#38C6BA]" /> Featured Title
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
                        ? 'bg-[#2C4654] border-[#38C6BA] text-[#F5F7F8] font-semibold'
                        : 'bg-[#1C2D3B] border-[#36515F] text-[#B4C3CE] hover:border-[#4A6A7B] hover:text-[#F5F7F8]'
                    }`}
                  >
                    <span>{title}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#38C6BA]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#F5F7F8] flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#38C6BA]" /> Featured Achievements (up to 4)
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
                        ? 'opacity-40 bg-[#1C2D3B] border-[#36515F] text-[#98AAB8] cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#2C4654] border-[#38C6BA] text-[#F5F7F8] font-semibold'
                        : 'bg-[#1C2D3B] border-[#36515F] text-[#B4C3CE] hover:border-[#4A6A7B] hover:text-[#F5F7F8]'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-xs">{ach.title}</p>
                      <p className="text-[11px] text-[#98AAB8] mt-0.5">{ach.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#38C6BA] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#F5F7F8] flex items-center gap-1.5">
              <Medal className="w-3.5 h-3.5 text-[#38C6BA]" /> Featured Personal Bests (up to 4)
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
                        ? 'bg-[#2C4654] border-[#38C6BA] text-[#F5F7F8] font-semibold'
                        : 'bg-[#1C2D3B] border-[#36515F] text-[#B4C3CE] hover:border-[#4A6A7B] hover:text-[#F5F7F8]'
                    }`}
                  >
                    <p className="font-semibold text-xs truncate">{pz.name}</p>
                    <p className="text-[11px] text-[#98AAB8] mt-1 font-tabular">
                      {pb ? `${pb.bestScore} pts` : 'No Record'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#36515F] bg-[#1C2D3B] flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={isSaving}>
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Showcase'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
