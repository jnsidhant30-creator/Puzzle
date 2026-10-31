import { db, functions } from '../config/firebase';
import { collection, doc, query, getDocs, getDoc, orderBy, where, limit, onSnapshot } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { httpsCallable } from 'firebase/functions';
import type { PuzzleType, Difficulty } from "../games/core/types";

export type TournamentStatus = 'draft' | 'registration' | 'full' | 'locked' | 'active' | 'completed' | 'cancelled';

export interface TournamentParticipant {
  uid: string;
  displayName: string;
  avatarUrl: string | null;
  registeredAt: any;
  eliminated: boolean;
  finalPlacement?: number;
}

export interface TournamentMatchData {
  id: string; 
  round: number; 
  playerA: TournamentParticipant | null;
  playerB: TournamentParticipant | null;
  battleId?: string; 
  status: 'pending' | 'ready' | 'active' | 'completed';
  winnerUid?: string;
  nextMatchId?: string; 
}

export interface TournamentData {
  id?: string;
  name: string;
  description: string;
  gameType: PuzzleType;
  difficulty: Difficulty;
  capacity: number;
  participantsCount: number;
  status: TournamentStatus;
  registrationDeadline: any;
  startTime: any;
  rewards: {
    winnerXp: number;
    runnerUpXp: number;
    participationXp: number;
  };
  createdAt: any;
  createdBy: string;
}

// ------------------------------------------------------------------
// API
// ------------------------------------------------------------------
export const getTournaments = async (statusFilter?: TournamentStatus[]): Promise<TournamentData[]> => {
  let q = collection(db, 'tournaments');
  // Simple fetch, filter client-side for complex statuses
  const snap = await getDocs(query(q, orderBy('startTime', 'asc'), limit(50)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as TournamentData));
  if (statusFilter && statusFilter.length > 0) {
    return results.filter(r => statusFilter.includes(r.status));
  }
  return results;
};

export const getTournament = async (tournamentId: string): Promise<TournamentData | null> => {
  const snap = await getDoc(doc(db, 'tournaments', tournamentId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as TournamentData) : null;
};

export const subscribeToTournament = (tournamentId: string, onUpdate: (data: TournamentData) => void) => {
  return onSnapshot(doc(db, 'tournaments', tournamentId), (snap) => {
    if (snap.exists()) {
      onUpdate({ id: snap.id, ...snap.data() } as TournamentData);
    }
  });
};

export const subscribeToTournamentMatches = (tournamentId: string, onUpdate: (matches: TournamentMatchData[]) => void) => {
  return onSnapshot(collection(db, 'tournaments', tournamentId, 'matches'), (snap) => {
    const matches = snap.docs.map(d => ({ id: d.id, ...d.data() } as TournamentMatchData));
    onUpdate(matches);
  });
};

export const joinTournament = async (tournamentId: string) => {
  const func = httpsCallable<{ tournamentId: string }, { success: boolean, message: string }>(functions, 'joinTournament');
  return await func({ tournamentId });
};

export const startTournament = async (tournamentId: string) => {
  const func = httpsCallable<{ tournamentId: string }, { success: boolean, message: string }>(functions, 'startTournament');
  return await func({ tournamentId });
};
