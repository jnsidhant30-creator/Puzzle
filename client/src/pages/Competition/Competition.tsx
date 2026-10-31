import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight, Activity, Award, Medal, Clock, CheckCircle2, Crown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  getCurrentWeeklyChallenge, 
  hasCompletedCurrentWeek, 
  getWeeklyCompletion,
} from '../../services/weeklyChallengeService';
import type { WeeklyChallengeConfig, WeeklyCompletion } from '../../services/weeklyChallengeService';
import { getLeaderboard, getPlayerRank } from '../../services/leaderboardService';
import type { LeaderboardEntry } from '../../services/leaderboardService';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const Competition = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<WeeklyChallengeConfig | null>(null);
  const [completion, setCompletion] = useState<WeeklyCompletion | null>(null);
  
  const [currentRank, setCurrentRank] = useState<{rank: number, total: number}>({ rank: 0, total: 0 });
  const [thisWeekLeaderboard, setThisWeekLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [prevWeekLeaderboard, setPrevWeekLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'THIS_WEEK' | 'PREV_WEEK'>('THIS_WEEK');

  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;
      
      try {
        setLoading(true);
        const currentChallenge = getCurrentWeeklyChallenge();
        setChallenge(currentChallenge);
        
        // Load completion status
        const comp = await getWeeklyCompletion(profile.uid, currentChallenge.id);
        setCompletion(comp);
        
        // Load Leaderboards
        const thisWeek = await getLeaderboard('WEEKLY', 'ALL', 'ALL', 100);
        setThisWeekLeaderboard(thisWeek);
        
        const prevDate = new Date();
        prevDate.setUTCDate(prevDate.getUTCDate() - 7);
        const prevWeek = await getLeaderboard('WEEKLY', 'ALL', 'ALL', 100, prevDate);
        setPrevWeekLeaderboard(prevWeek);
        
        const rank = await getPlayerRank(profile.uid, 'WEEKLY', 'ALL', 'ALL');
        setCurrentRank(rank);
        
      } catch (err) {
        console.error("Failed to load competition data", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [profile]);

  const handlePlayChallenge = () => {
    if (!challenge) return;
    navigate('/challenge', {
      state: {
        puzzleType: challenge.puzzleType,
        difficulty: challenge.difficulty,
        isWeeklyChallenge: true,
        weeklyChallengeId: challenge.id
      }
    });
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !challenge) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400">Loading competition...</div>
      </div>
    );
  }

  const activeLeaderboard = activeTab === 'THIS_WEEK' ? thisWeekLeaderboard : prevWeekLeaderboard;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" />
          Weekly Competition
        </h1>
        <p className="text-gray-400 mt-2">
          Compete this week, improve your score, and see how you compare with other PuzzleVerse players.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-surface/50 border-surface-light">
            <CardHeader>
              <CardTitle className="text-lg text-gray-200">THIS WEEK'S CHALLENGE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-100">{challenge.title}</h3>
                  <p className="text-gray-400 text-sm max-w-md">{challenge.description}</p>
                  
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-300 bg-background/50 px-3 py-1.5 rounded-lg">
                      <Award className="w-4 h-4 text-indigo-400" />
                      {challenge.difficulty}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300 bg-background/50 px-3 py-1.5 rounded-lg">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      +{challenge.baseReward + challenge.bonusReward} XP Reward
                    </div>
                  </div>
                </div>

                {completion ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center min-w-[200px]">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-green-400 font-medium mb-1">CHALLENGE COMPLETE ✓</div>
                    <div className="text-sm text-gray-400">Score: {completion.score}</div>
                    <div className="text-sm text-gray-400">Time: {formatTime(completion.timeTaken)}</div>
                  </div>
                ) : (
                  <Button 
                    onClick={handlePlayChallenge}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 h-12 px-8"
                  >
                    Play Challenge <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface/50 border-surface-light">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
              <CardTitle className="text-lg text-gray-200">LEADERBOARD</CardTitle>
              <div className="flex gap-2 bg-background/50 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('THIS_WEEK')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'THIS_WEEK' ? 'bg-surface text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
                >
                  This Week
                </button>
                <button 
                  onClick={() => setActiveTab('PREV_WEEK')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'PREV_WEEK' ? 'bg-surface text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
                >
                  Previous Week
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activeLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {activeTab === 'THIS_WEEK' ? "Complete this week's challenge to enter the competition." : "No previous competition results yet."}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {activeLeaderboard.map((entry, idx) => {
                    const isCurrentUser = entry.userId === profile?.uid;
                    return (
                      <div key={entry.id} className={`flex items-center justify-between p-4 ${isCurrentUser ? 'bg-indigo-500/5' : 'hover:bg-white/5'} transition-colors`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-8 text-center font-bold ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-700' : 'text-gray-500'}`}>
                            #{idx + 1}
                          </div>
                          <div className="flex items-center gap-3">
                            {entry.avatarUrl ? (
                              <img src={entry.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-surface" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center text-gray-400 font-bold">
                                {(entry.displayName || entry.username || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className={`font-medium ${isCurrentUser ? 'text-indigo-400' : 'text-gray-200'}`}>
                                {entry.displayName || entry.username || 'Anonymous'}
                                {isCurrentUser && <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">You</span>}
                              </div>
                              <div className="text-xs text-gray-500">Level {entry.level}</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-100">{entry.score.toLocaleString()}</div>
                          <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(entry.bestTime)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-surface/50 border-surface-light h-fit">
            <CardHeader>
              <CardTitle className="text-lg text-gray-200">YOUR WEEKLY PROGRESS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-background/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Weekly Score</div>
                    <div className="font-bold text-gray-200">{completion ? completion.score.toLocaleString() : '0'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-background/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Medal className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Position</div>
                    <div className="font-bold text-gray-200">{currentRank.rank > 0 ? `#${currentRank.rank}` : '-'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-background/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Status</div>
                    <div className="font-bold text-gray-200">{completion ? 'Completed' : 'Not Started'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
