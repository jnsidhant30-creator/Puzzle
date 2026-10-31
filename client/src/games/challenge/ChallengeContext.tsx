import { createContext, useContext } from 'react';
import type { GameResultModalData } from '../../components/game/Modals';

export interface ChallengeContextType {
  isChallengeMode: boolean;
  challengeIndex: number;
  totalChallenges: number;
  onChallengeComplete: (result: GameResultModalData) => void;
  onChallengeAbort: () => void;
}

export const ChallengeContext = createContext<ChallengeContextType | null>(null);

export const useChallenge = () => useContext(ChallengeContext);
