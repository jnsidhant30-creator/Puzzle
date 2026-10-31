import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Zap, Users, Trophy, History, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useSocialStore } from '../../store/useSocialStore';
import { quickMatchBattle, challengeFriendBattle, getBattleHistory } from '../../services/battleService';
import type { BattleData } from '../../../../functions/src/types';
import { formatDistanceToNow } from 'date-fns';

export const BattleDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { friends } = useSocialStore();
  
  const [loadingQM, setLoadingQM] = useState(false);
  const [loadingFriend, setLoadingFriend] = useState<string | null>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [history, setHistory] = useState<BattleData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      getBattleHistory(user.uid).then(res => {
        setHistory(res);
        setLoadingHistory(false);
      });
    }
  }, [user?.uid]);

  const stats = user?.battleStats || { wins: 0, losses: 0, draws: 0, played: 0, winStreak: 0, totalXp: 0 };

  const handleQuickMatch = async () => {
    try {
      setLoadingQM(true);
      const battleId = await quickMatchBattle();
      navigate(`/battle/${battleId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to start matchmaking.");
      setLoadingQM(false);
    }
  };

  const handleChallengeFriend = async (friendUid: string) => {
    try {
      setLoadingFriend(friendUid);
      const battleId = await challengeFriendBattle(friendUid, 'NUMBER', 'EASY'); // default to Number Easy
      navigate(`/battle/${battleId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to challenge friend.");
      setLoadingFriend(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-textMain tracking-widest uppercase flex items-center gap-3">
            <Swords className="w-8 h-8 text-primary" />
            1v1 Battles
          </h1>
          <p className="text-textMuted mt-2">Compete in real-time against friends or random opponents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Play Options */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-elevated rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-colors flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-textMain mb-2">Quick Match</h3>
                <p className="text-sm text-textMuted mb-6">Find a random opponent of similar skill and battle instantly.</p>
              </div>
              <Button onClick={handleQuickMatch} disabled={loadingQM} variant="primary" className="w-full justify-between group/btn">
                {loadingQM ? 'Searching...' : 'Find Match'}
                {!loadingQM && <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
              </Button>
            </div>

            <div className="bg-surface-elevated rounded-xl p-6 border border-border/50 hover:border-secondary/50 transition-colors flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-textMain mb-2">Challenge Friend</h3>
                <p className="text-sm text-textMuted mb-6">Send a direct battle invitation to a friend online.</p>
              </div>
              <Button onClick={() => setShowFriends(!showFriends)} variant="secondary" className="w-full justify-between group/btn">
                {showFriends ? 'Hide Friends' : 'Select Friend'}
                <ArrowRight className={`w-4 h-4 transition-transform ${showFriends ? 'rotate-90' : 'group-hover/btn:translate-x-1'}`} />
              </Button>
            </div>
          </div>

          {/* Friends List Expandable */}
          {showFriends && (
            <div className="bg-surface-elevated rounded-xl border border-border/50 p-6 animate-in slide-in-from-top-4">
              <h3 className="font-bold text-textMain mb-4">Select an Opponent</h3>
              {friends.length === 0 ? (
                <p className="text-textMuted text-sm">You haven't added any friends yet.</p>
              ) : (
                <div className="space-y-3">
                  {friends.map(friend => (
                    <div key={friend.uid} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface transition-colors">
                      <div className="flex items-center gap-3">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={friend.displayName} className="w-10 h-10 rounded-full border border-border/50" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface-highlight flex items-center justify-center text-textMuted font-bold">
                            {friend.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-textMain">{friend.displayName}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        disabled={loadingFriend === friend.uid}
                        onClick={() => handleChallengeFriend(friend.uid)}
                        className="text-secondary hover:bg-secondary/10 hover:text-secondary"
                      >
                        {loadingFriend === friend.uid ? 'Challenging...' : 'Challenge'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Battle History */}
          <div className="bg-surface-elevated rounded-xl border border-border/50 p-6">
            <h3 className="font-bold text-textMain flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-textMuted" />
              Recent Battles
            </h3>
            
            {loadingHistory ? (
              <p className="text-textMuted animate-pulse">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-textMuted">No battles played yet.</p>
            ) : (
              <div className="space-y-4">
                {history.map(b => {
                  const isPlayerA = b.playerA.uid === user?.uid;
                  const me = isPlayerA ? b.playerA : b.playerB!;
                  const opp = isPlayerA ? b.playerB! : b.playerA;
                  const isWin = me.result === 'VICTORY';
                  const isDraw = me.result === 'DRAW';

                  return (
                    <div key={b.id} className="flex items-center justify-between p-4 rounded-lg bg-surface/50 border border-border/30">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-12 rounded-full ${isWin ? 'bg-success' : isDraw ? 'bg-textMuted' : 'bg-error'}`} />
                        <div>
                          <p className="font-bold text-textMain">vs {opp.displayName}</p>
                          <p className="text-xs text-textMuted uppercase tracking-wider">{b.gameType} • {b.difficulty}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black ${isWin ? 'text-success' : isDraw ? 'text-textMuted' : 'text-error'}`}>
                          {me.result}
                        </p>
                        <p className="text-xs text-textMuted">
                          {b.createdAt ? formatDistanceToNow(b.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <div className="bg-surface-elevated rounded-xl border border-border/50 p-6">
            <h3 className="font-bold text-textMain flex items-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-warning" />
              Battle Record
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-textMuted">Matches Played</span>
                <span className="font-mono font-bold text-textMain">{stats.played}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-textMuted">Victories</span>
                <span className="font-mono font-bold text-success">{stats.wins}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-textMuted">Defeats</span>
                <span className="font-mono font-bold text-error">{stats.losses}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-textMuted">Win Rate</span>
                <span className="font-mono font-bold text-primary">
                  {stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-textMuted">Current Win Streak</span>
                <span className="font-mono font-bold text-warning flex items-center gap-1">
                  {stats.winStreak} <Zap className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
