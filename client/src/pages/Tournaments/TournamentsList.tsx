import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getTournaments } from '../../services/tournamentService';
import type { TournamentData } from '../../services/tournamentService';
import { format } from 'date-fns';

const LoadingSpinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export const TournamentsList: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<TournamentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await getTournaments(['registration', 'active', 'full']);
        setTournaments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tournaments</h1>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => navigate('/admin/tournaments')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Manage Tournaments
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No active tournaments</h3>
            <p className="text-gray-500 dark:text-gray-400">Check back later for new events!</p>
          </div>
        ) : (
          tournaments.map((t) => (
            <div 
              key={t.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 cursor-pointer"
              onClick={() => navigate(`/tournaments/${t.id}`)}
            >
              <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    t.status === 'registration' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    t.status === 'full' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {t.status}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 text-sm">{t.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <div className="flex items-center">
                    <span className="w-5 font-bold mr-2">🎮</span>
                    {t.gameType} ({t.difficulty})
                  </div>
                  <div className="flex items-center">
                    <span className="w-5 font-bold mr-2">👥</span>
                    {t.participantsCount} / {t.capacity} Players
                  </div>
                  <div className="flex items-center">
                    <span className="w-5 font-bold mr-2">⏰</span>
                    {t.startTime ? format(t.startTime.toDate(), 'PP p') : 'TBD'}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Prize: {t.rewards.winnerXp} XP
                  </div>
                  <button className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
