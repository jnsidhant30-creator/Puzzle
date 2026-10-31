import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Play, RotateCcw, Home, Trophy, AlertCircle, Star, Flame, Share2, Users } from 'lucide-react';
import { getLevelProgress, getXpForNextLevel } from '../../services/xpService';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isDailyPuzzle?: boolean;
}

export const PauseModal = ({ onResume, onRestart, isDailyPuzzle }: PauseModalProps) => {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pause-title" className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm glass border-primary/20 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          <h2 id="pause-title" className="text-3xl font-bold text-textMain tracking-tight">GAME PAUSED</h2>
          <p className="text-textMuted">Take a breath. The timer is stopped.</p>
          
          <div className="space-y-3 pt-4">
            <Button className="w-full flex items-center justify-center gap-2" size="lg" onClick={onResume}>
              <Play className="w-5 h-5" /> Resume Game
            </Button>
            {!isDailyPuzzle && (
              <Button variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={onRestart}>
                <RotateCcw className="w-5 h-5" /> Restart
              </Button>
            )}
            <Link to="/dashboard" className="block">
              <Button variant="ghost" className="w-full flex items-center justify-center gap-2 text-textMuted hover:text-error">
                <Home className="w-5 h-5" /> Exit to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export interface GameResultModalData {
  status: 'COMPLETED' | 'TIMEOUT';
  score: number;
  xpEarned: number;
  accuracy: number;
  correctAnswers: number;
  totalQuestions: number;
  hintsUsed: number;
  timeTaken: number;
  currentLevel: number;
  currentXp: number;
  isDailyPuzzle?: boolean;
  isNewBest?: boolean;
  difficulty?: string;
  stage?: number;
  isFriendChallenge?: boolean;
  friendChallengeId?: string;
  puzzleSeed?: number | number[];
  puzzleType?: any; // PuzzleType
}

interface ResultModalProps {
  data: GameResultModalData | null;
  onPlayAgain: () => void;
}

import { useAuthStore } from '../../store/useAuthStore';
import { useSocialStore } from '../../store/useSocialStore';
import { createFriendChallenge } from '../../services/challengeService';
import { createNotification } from '../../services/notificationService';
import { useState, useContext } from 'react';
import { BattleContext } from '../../pages/Battle/BattleContext';

export const ResultModal = ({ data, onPlayAgain }: ResultModalProps) => {
  const { profile } = useAuthStore();
  const { requests, friendsProfiles } = useSocialStore();
  const [isSharing, setIsSharing] = useState(false);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  
  const { battle } = useContext(BattleContext) || { battle: null };

  const friends = requests.filter(r => r.status === 'accepted');
  
  if (!data || battle) return null;

  const isTimeout = data.status === 'TIMEOUT';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleShareResult = async () => {
    const shareText = `I scored ${data.score.toLocaleString()} in PuzzleVerse ${data.puzzleType || 'Challenge'}! Can you beat my score?`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PuzzleVerse Challenge',
          text: shareText,
          url: window.location.origin
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.origin}`);
      alert('Result copied to clipboard!');
    }
  };

  const handleCreateChallenge = async () => {
    if (!profile || !data.puzzleType || !data.difficulty || data.puzzleSeed === undefined) return;
    
    // If we already created it, just show the picker
    if (challengeId) {
      setShowFriendPicker(true);
      return;
    }

    setIsSharing(true);
    try {
      const newChallengeId = await createFriendChallenge(
        data.puzzleType,
        data.difficulty as any,
        data.puzzleSeed,
        profile.uid,
        data.score,
        data.timeTaken
      );
      setChallengeId(newChallengeId);
      setShowFriendPicker(true);
    } catch (err) {
      console.error('Error creating challenge:', err);
      alert('Failed to create challenge.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSendToFriend = async (friendUid: string) => {
    if (!profile || !challengeId) return;
    try {
      await createNotification(
        friendUid,
        'New Challenge!',
        `${profile.displayName} challenged you to beat their score of ${data.score.toLocaleString()} in ${data.puzzleType}!`,
        'SYSTEM',
        { senderId: profile.uid, challengerId: profile.uid, challengeId, type: 'FRIEND_CHALLENGE' }
      );
      alert('Challenge sent!');
      setShowFriendPicker(false);
    } catch (err) {
      console.error(err);
      alert('Failed to send challenge.');
    }
  };

  if (showFriendPicker) {
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="friend-picker-title" className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
        <Card className="w-full max-w-md bg-surface border-2 border-primary/50 shadow-2xl relative flex flex-col max-h-[80vh]">
          <CardContent className="p-6 flex flex-col h-full overflow-hidden">
            <h2 id="friend-picker-title" className="text-2xl font-bold text-textMain mb-2">Challenge a Friend</h2>
            <p className="text-sm text-textMuted mb-6">Select a friend to send this challenge to.</p>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 mb-6">
              {friends.length === 0 ? (
                <p className="text-center text-textMuted py-8">You haven't added any friends yet.</p>
              ) : (
                friends.map(f => {
                  const friendUid = f.senderId === profile?.uid ? f.receiverId : f.senderId;
                  const fp = friendsProfiles[friendUid];
                  if (!fp) return null;
                  return (
                    <div key={friendUid} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        {fp.avatarUrl ? (
                          <img src={fp.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {fp.displayName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-textMain">{fp.displayName}</p>
                          <p className="text-xs text-textMuted">@{fp.username}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSendToFriend(friendUid)}>
                        Send
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <Button variant="outline" className="w-full" onClick={() => setShowFriendPicker(false)}>
                Back to Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="result-title" className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
      <Card className={`w-full max-w-md bg-surface border-2 shadow-2xl relative overflow-hidden max-h-[95vh] flex flex-col ${isTimeout ? 'border-error/50' : 'border-success/50'}`}>
        
        {/* New Best Banner */}
        {data.isNewBest && (
          <div className="shrink-0 w-full bg-secondary text-white text-xs font-black py-1.5 text-center shadow-lg uppercase tracking-widest animate-bounce z-10">
            ★ New Personal Best! ★
          </div>
        )}

        <CardContent className={`p-6 sm:p-8 text-center space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar flex-1 ${data.isNewBest ? 'pt-6' : ''}`}>
          
          <div>
            {isTimeout ? (
              <AlertCircle className="w-16 h-16 text-error mx-auto mb-4 animate-pulse" />
            ) : (
              <Trophy className="w-16 h-16 text-success mx-auto mb-4" />
            )}
            
            <h2 id="result-title" className="text-3xl font-black text-textMain tracking-widest uppercase">
              {isTimeout ? "TIME'S UP!" : data.isDailyPuzzle ? "DAILY COMPLETE ✓" : "PUZZLE COMPLETE!"}
            </h2>
            {data.isDailyPuzzle && !isTimeout && (
              <div className="mt-3 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-orange-400 font-bold bg-orange-400/10 px-3 py-1 rounded-full text-sm">
                  <Flame className="w-4 h-4" /> {profile?.currentStreak || 1} Day Streak!
                </div>
                <p className="text-textMuted text-sm font-medium mt-1">Come back tomorrow for the next challenge.</p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background border border-border p-3 rounded-xl flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Score</p>
              <p className="text-xl font-black text-secondary mt-1">{data.score.toLocaleString()}</p>
            </div>
            
            <div className="bg-background border border-border p-3 rounded-xl flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Time</p>
              <p className="text-xl font-black text-textMain mt-1">{formatTime(data.timeTaken)}</p>
            </div>

            <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex flex-col items-center justify-center col-span-2">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">XP Earned</p>
              <p className="text-2xl font-black text-primary mt-1">+{data.xpEarned}</p>
            </div>
            
            {data.difficulty && (
              <div className="bg-background border border-border p-3 rounded-xl flex flex-col items-center justify-center">
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Difficulty</p>
                <p className="text-sm font-black text-textMain mt-1">{data.difficulty}</p>
              </div>
            )}
            
            {data.stage !== undefined && (
              <div className="bg-background border border-border p-3 rounded-xl flex flex-col items-center justify-center">
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Stage</p>
                <p className="text-sm font-black text-textMain mt-1">{data.stage}</p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            {!data.isDailyPuzzle && !data.isFriendChallenge && data.puzzleType && data.puzzleSeed !== undefined && (
               <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2 py-6 text-lg font-bold border-primary text-primary hover:bg-primary/10" 
                onClick={handleCreateChallenge}
                disabled={isSharing}
              >
                <Users className="w-5 h-5" /> {isSharing ? 'Creating...' : 'Challenge a Friend'}
              </Button>
            )}

            {!data.isDailyPuzzle && (
              <Button className="w-full flex items-center justify-center gap-2 py-6 text-lg font-bold" onClick={onPlayAgain}>
                <RotateCcw className="w-5 h-5" /> Play Again
              </Button>
            )}
            
            <Button variant="secondary" className="w-full flex items-center justify-center gap-2 py-6 text-lg font-bold" onClick={handleShareResult}>
              <Share2 className="w-5 h-5" /> Share Result
            </Button>
            
            <Link to="/puzzles" className="block">
              <Button variant="secondary" className="w-full flex items-center justify-center gap-2 py-6 text-lg font-bold">
                <Play className="w-5 h-5" /> Back to Puzzles
              </Button>
            </Link>
            
            <Link to="/dashboard" className="block">
              <Button variant="ghost" className="w-full flex items-center justify-center gap-2 py-4 border border-border/50 text-textMuted hover:text-textMain">
                <Home className="w-5 h-5" /> Dashboard
              </Button>
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

interface LevelUpModalProps {
  oldLevel: number;
  newLevel: number;
  xpEarned: number;
  onContinue: () => void;
}

export const LevelUpModal = ({ newLevel, xpEarned, onContinue }: LevelUpModalProps) => {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="levelup-title" className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-sm bg-surface border border-primary/30 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
        <CardContent className="p-8 text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-full h-full bg-primary/20 border-2 border-primary/50 rounded-full flex items-center justify-center">
              <Star className="w-10 h-10 text-primary" fill="currentColor" />
            </div>
          </div>
          
          <div>
            <h2 id="levelup-title" className="text-2xl font-bold text-textMain tracking-tight">Level Up!</h2>
            <p className="text-textMuted mt-1 font-medium">You reached Level {newLevel}</p>
          </div>
          
          <div className="bg-primary/10 rounded-lg p-3 inline-block">
            <p className="text-primary font-bold text-sm">+{xpEarned} XP Earned</p>
          </div>

          <Button className="w-full mt-4 font-bold" onClick={onContinue}>
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
