import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getTournament, subscribeToTournament, subscribeToTournamentMatches, joinTournament } from '../../services/tournamentService';
import type { TournamentData, TournamentMatchData } from '../../services/tournamentService';
import { format } from 'date-fns';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ChallengeResolver } from '../ChallengeResolver';

const LoadingSpinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [matches, setMatches] = useState<TournamentMatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);
  const [resolvingBattle, setResolvingBattle] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    // Initial fetch to check existence
    getTournament(id).then(t => {
      if (!t) {
        navigate('/tournaments');
        return;
      }
      setLoading(false);
    });

    const unsubscribeT = subscribeToTournament(id, setTournament);
    const unsubscribeM = subscribeToTournamentMatches(id, setMatches);

    let unsubscribeP: () => void = () => {};
    if (user) {
      unsubscribeP = onSnapshot(doc(db, 'tournaments', id, 'participants', user.uid), (snap) => {
        setIsParticipant(snap.exists());
      });
    }

    return () => {
      unsubscribeT();
      unsubscribeM();
      unsubscribeP();
    };
  }, [id, user, navigate]);

  const handleJoin = async () => {
    if (!id) return;
    setJoining(true);
    try {
      await joinTournament(id);
    } catch (err: any) {
      alert(err.message || 'Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const myCurrentMatch = matches.find(m => 
    m.status === 'ready' && 
    (m.playerA?.uid === user?.uid || m.playerB?.uid === user?.uid)
  );

  const handleEnterMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || !match.battleId) return;
    setActiveBattleId(match.battleId);
    setResolvingBattle(true);
  };

  if (loading || !tournament) return <LoadingSpinner />;

  if (resolvingBattle && activeBattleId) {
    return (
      <ChallengeResolver 
        battleId={activeBattleId} 
        onClose={() => {
          setResolvingBattle(false);
          setActiveBattleId(null);
        }} 
      />
    );
  }

  // Bracket rendering logic
  const totalRounds = Math.log2(tournament.capacity);
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/tournaments')}
        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mb-6 flex items-center transition-colors"
      >
        ← Back to Tournaments
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{tournament.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">{tournament.description}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${
              tournament.status === 'registration' ? 'bg-green-100 text-green-800' :
              tournament.status === 'active' ? 'bg-blue-100 text-blue-800' :
              tournament.status === 'completed' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {tournament.status}
            </span>
            {tournament.status === 'registration' && !isParticipant && (
              <button 
                onClick={handleJoin}
                disabled={joining || tournament.participantsCount >= tournament.capacity}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {joining ? 'Joining...' : tournament.participantsCount >= tournament.capacity ? 'Tournament Full' : 'Join Tournament'}
              </button>
            )}
            {isParticipant && tournament.status === 'registration' && (
              <span className="text-green-600 dark:text-green-400 font-medium">✓ Registered</span>
            )}
          </div>
        </div>
      </div>

      {myCurrentMatch && tournament.status === 'active' && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 mb-8 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-1">Your Match is Ready!</h3>
            <p className="text-indigo-700 dark:text-indigo-300">
              Round {myCurrentMatch.round} vs {myCurrentMatch.playerA?.uid === user?.uid ? myCurrentMatch.playerB?.displayName : myCurrentMatch.playerA?.displayName}
            </p>
          </div>
          <button 
            onClick={() => handleEnterMatch(myCurrentMatch.id)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
          >
            Enter Battle
          </button>
        </div>
      )}

      {/* BRACKET VISUALIZATION */}
      {tournament.status !== 'draft' && tournament.status !== 'registration' && matches.length > 0 && (
        <div className="overflow-x-auto pb-8">
          <div className="flex min-w-max gap-8">
            {rounds.map(roundNum => {
              const roundMatches = matches.filter(m => m.round === roundNum).sort((a, b) => a.id.localeCompare(b.id));
              
              return (
                <div key={roundNum} className="flex flex-col justify-around gap-4 w-64">
                  <h3 className="text-center font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider text-sm">
                    {roundNum === totalRounds ? 'Finals' : 
                     roundNum === totalRounds - 1 ? 'Semifinals' : 
                     `Round ${roundNum}`}
                  </h3>
                  
                  {roundMatches.map(match => (
                    <div 
                      key={match.id} 
                      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-3 flex flex-col gap-2 ${
                        match.status === 'active' ? 'border-indigo-500 shadow-indigo-100 dark:shadow-indigo-900/20' : 
                        match.status === 'completed' ? 'border-gray-200 dark:border-gray-700 opacity-75' :
                        'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className={`flex justify-between items-center p-2 rounded ${match.winnerUid === match.playerA?.uid ? 'bg-green-50 dark:bg-green-900/20 font-bold' : ''}`}>
                        <span className="truncate text-sm text-gray-800 dark:text-gray-200">
                          {match.playerA ? match.playerA.displayName : 'TBD'}
                        </span>
                        {match.winnerUid === match.playerA?.uid && <span className="text-green-500 text-xs">✓</span>}
                      </div>
                      
                      <div className="h-px bg-gray-100 dark:bg-gray-700 w-full" />
                      
                      <div className={`flex justify-between items-center p-2 rounded ${match.winnerUid === match.playerB?.uid ? 'bg-green-50 dark:bg-green-900/20 font-bold' : ''}`}>
                        <span className="truncate text-sm text-gray-800 dark:text-gray-200">
                          {match.playerB ? match.playerB.displayName : 'TBD'}
                        </span>
                        {match.winnerUid === match.playerB?.uid && <span className="text-green-500 text-xs">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
