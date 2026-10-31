import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFriendChallenge, type FriendChallenge } from '../services/challengeService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Trophy, Play, Loader2, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useAuthStore } from '../store/useAuthStore';

export const ChallengeResolver = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const [challenge, setChallenge] = useState<FriendChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!challengeId) return;
      try {
        const data = await getFriendChallenge(challengeId);
        if (data) {
          setChallenge(data);
        } else {
          setError('Challenge not found or has expired.');
        }
      } catch (err) {
        console.error('Error fetching challenge:', err);
        setError('Failed to load challenge.');
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, [challengeId]);

  const handleStart = () => {
    if (!challenge) return;
    
    // Determine the route based on the gameId mapping in GameRegistry
    // Most game routes are lowercase versions of the ID, or specific strings.
    // We can just use the standard /game/:id route but we need to map PuzzleType to the route param.
    // The easiest way is to let GamePage resolve it.
    // Wait, the route is /game/:id where id is like 'word-grid', 'number-puzzle'.
    // Let's look at GameRegistry.tsx to see what keys it expects.
    // Usually it matches the string EXACTLY or lowercase. 
    
    // For safety, let's use the actual game route based on the puzzle type string.
    // Let's pass state and just navigate to the dashboard or directly to the game.
    // Wait, the user goes to /game/:id. We don't have the exact ID here unless we map it.
    // Let's map it.
    const routeMap: Record<string, string> = {
      'WORD_GRID': 'word-grid',
      'NUMBER': 'number',
      'WORD': 'word',
      'MEMORY': 'memory',
      'SLIDING': 'sliding',
      'LOGIC': 'logic',
      'PATTERN': 'pattern',
      'PIPE': 'pipe',
      'COLOR_PATH': 'color',
      'MAZE_ESCAPE': 'maze',
      'LASER_MIRROR': 'laser',
      'ARROW_PATH': 'arrow',
      'BLOCK_ESCAPE': 'block',
      'NUMBER_PATH': 'number-path',
      'ROTATING_TILES': 'rotate',
      'CHALLENGE': 'challenge'
    };

    const routePath = routeMap[challenge.gameId] || challenge.gameId.toLowerCase().replace(/_/g, '-');

    navigate(`/game/${routePath}`, {
      state: {
        difficulty: challenge.difficulty,
        isFriendChallenge: true,
        friendChallengeId: challenge.id,
        puzzleSeed: challenge.puzzleSeed
      }
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-textMuted">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p>Loading Challenge...</p>
          </div>
        ) : error || !challenge ? (
          <Card className="w-full max-w-md border-error/20 bg-error/5">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-error mx-auto" />
              <h2 className="text-xl font-bold text-textMain">Challenge Unavailable</h2>
              <p className="text-textMuted">{error}</p>
              <Button className="w-full mt-4" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-surface">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black text-textMain">Friend Challenge!</CardTitle>
              <p className="text-textMuted">Can you beat their score?</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              
              <div className="bg-background border border-border/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-textMuted font-medium">Game</span>
                  <span className="text-textMain font-bold">{challenge.gameId.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-textMuted font-medium">Difficulty</span>
                  <span className="text-textMain font-bold">{challenge.difficulty}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-textMuted font-medium">Creator's Score</span>
                  <span className="text-primary font-black">{challenge.creatorScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-textMuted font-medium">Creator's Time</span>
                  <span className="text-textMain font-bold">{formatTime(challenge.creatorTime)}</span>
                </div>
              </div>

              {!profile ? (
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <p className="text-warning font-bold text-sm">You must be logged in to play challenges.</p>
                  <Button className="w-full mt-3" onClick={() => navigate('/login')}>
                    Log In
                  </Button>
                </div>
              ) : (
                <Button className="w-full h-14 text-lg font-bold" onClick={handleStart}>
                  <Play className="w-5 h-5 mr-2" /> Start Challenge
                </Button>
              )}

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
