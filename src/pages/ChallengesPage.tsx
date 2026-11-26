import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  fetchUserChallenges,
  createChallenge2,
  rematchChallenge,
  getChallenge2ById,
} from '../services/firebase';
import { ChallengeItem, PuzzleType, Difficulty } from '../types';
import { PUZZLE_MODES } from '../data/puzzles';
import { toast } from '../services/toast';
import {
  Swords,
  Plus,
  Copy,
  Check,
  Play,
  RotateCcw,
  Trophy,
  Search,
  X,
  WifiOff,
} from 'lucide-react';
import { PageHeader, Card } from '../components/ui/Card';

export const ChallengesPage: React.FC = () => {
  const { user, isOnline, isGuest, retryConnection, playChallengeMatch } = useStore();
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'INCOMING' | 'SENT' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'>('ALL');

  /* Create Challenge Modal */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState<PuzzleType>('number');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [targetScore, setTargetScore] = useState<number>(500);
  const [targetTime, setTargetTime] = useState<number>(60);
  const [opponentName, setOpponentName] = useState<string>('');
  const [createdChallengeId, setCreatedChallengeId] = useState<string | null>(null);

  /* Direct Code Join */
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadChallenges();
  }, [user]);

  const loadChallenges = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchUserChallenges(user.uid);
      setChallenges(data);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!user) return;
    const seed = Math.floor(Math.random() * 100000);
    const id = await createChallenge2({
      creatorUid: user.uid,
      creatorName: user.displayName,
      creatorAvatar: user.avatarUrl,
      opponentName: opponentName.trim() ? opponentName.trim() : undefined,
      puzzleType: selectedPuzzle,
      difficulty: selectedDifficulty,
      targetScore,
      targetTime,
      seed,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    });
    if (id) {
      setCreatedChallengeId(id);
      loadChallenges();
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCodeInput.trim() || !user) return;
    setJoining(true);
    try {
      const id = joinCodeInput.trim().toLowerCase();
      const challenge = await getChallenge2ById(id);
      if (challenge) {
        if (challenge.creatorUid === user.uid) {
          toast.info('This is your own duel room. Share the link with an opponent.');
        } else {
          toast.success('Joined challenge room. Launching match...');
          playChallengeMatch(challenge.id, challenge.puzzleType, challenge.difficulty, challenge.seed);
        }
      } else {
        toast.error('Challenge room not found. Check the ID and try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Invalid code or connection issue.');
    } finally {
      setJoining(false);
    }
  };

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/challenges?id=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRematch = async (ch: ChallengeItem) => {
    const newId = await rematchChallenge(ch);
    if (newId) {
      loadChallenges();
      playChallengeMatch(newId, ch.puzzleType, ch.difficulty, ch.seed);
    }
  };

  const filteredChallenges = challenges.filter((ch) => {
    if (!user) return true;
    const isCreator = ch.creatorUid === user.uid;
    const isOpponent = ch.opponentUid === user.uid;
    if (filterTab === 'INCOMING') return isOpponent && ch.status === 'PENDING';
    if (filterTab === 'SENT') return isCreator && ch.status === 'PENDING';
    if (filterTab === 'ACTIVE') return ch.status === 'IN_PROGRESS' || ch.status === 'ACCEPTED';
    if (filterTab === 'COMPLETED') return ch.status === 'COMPLETED';
    if (filterTab === 'EXPIRED') return ch.status === 'EXPIRED' || ch.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Direct Challenges"
        description="Compete in deterministic head-to-head puzzle rooms with identical board seeds."
        action={
          <button
            disabled={!isOnline || isGuest}
            onClick={() => {
              setShowCreateModal(true);
              setCreatedChallengeId(null);
            }}
            className="h-9 px-4 bg-[#087F8C] hover:bg-[#066B75] disabled:opacity-50 text-[#FFFFFF] font-semibold text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Challenge Room</span>
          </button>
        }
      />

      {(!isOnline || isGuest) && (
        <Card className="p-4 border-[#F59E0B]/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-[#B4C3CE]">
            <WifiOff className="w-4 h-4 text-[#FBBF24] shrink-0" />
            <span>
              {!isOnline
                ? 'Live 1v1 challenge rooms require an active internet connection. Solo Challenge Run remains playable offline!'
                : 'Sign in with a PuzzleVerse account online to send or accept 1v1 duel rooms.'}
            </span>
          </div>
          {!isOnline && (
            <button
              onClick={() => retryConnection()}
              className="px-3 py-1.5 rounded-lg bg-[#233D4A] border border-[#36515F] text-xs font-bold text-[#F5F7F8]"
            >
              Retry Connection
            </button>
          )}
        </Card>
      )}

      {/* Code Join Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-pv-text-secondary">
          <Search className="w-4 h-4 text-[#38C6BA]" />
          <span>Have a challenge room ID?</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            placeholder="Paste room ID..."
            className="bg-pv-surface-secondary border border-pv-border rounded-lg px-3 h-8 text-xs text-pv-text-primary placeholder-pv-text-muted focus:outline-none focus:border-[#38C6BA] w-full sm:w-64 font-mono"
          />
          <button
            onClick={handleJoinByCode}
            disabled={joining || !joinCodeInput.trim()}
            className="h-8 px-3.5 bg-pv-surface-soft hover:bg-pv-surface-highlight text-pv-text-primary border border-pv-border-strong rounded-lg text-xs font-medium transition-colors disabled:opacity-40 shrink-0"
          >
            {joining ? 'Connecting...' : 'Join Room'}
          </button>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-pv-border">
        {(['ALL', 'INCOMING', 'SENT', 'ACTIVE', 'COMPLETED', 'EXPIRED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-3 h-7 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filterTab === tab
                ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
                : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Challenges Grid */}
      {loading ? (
        <Card className="py-16 text-center">
          <div className="w-6 h-6 border-2 border-[#38C6BA] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-pv-text-secondary font-medium">Loading challenge rooms...</p>
        </Card>
      ) : filteredChallenges.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-pv-surface-secondary rounded-lg flex items-center justify-center text-pv-text-muted mx-auto border border-pv-border">
            <Swords className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-pv-text-primary mb-1">No challenges found</h3>
          <p className="text-xs text-pv-text-secondary max-w-sm mx-auto">
            {filterTab === 'ALL'
              ? 'No active challenges at this time. Create a room to challenge another player.'
              : `No ${filterTab.toLowerCase()} challenges found.`}
          </p>
          <div className="pt-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-9 px-4 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Challenge Room</span>
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChallenges.map((ch) => {
            const puzzleInfo = PUZZLE_MODES.find((p) => p.id === ch.puzzleType);
            const isCreator = user?.uid === ch.creatorUid;

            return (
              <Card key={ch.id} className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-pv-border pb-3">
                  <div>
                    <h4 className="text-xs font-semibold text-pv-text-primary">
                      {puzzleInfo?.name || ch.puzzleType}
                    </h4>
                    <p className="text-[11px] text-pv-text-muted capitalize font-tabular mt-0.5">
                      {ch.difficulty} tier • Seed #{ch.seed}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-pv-border bg-pv-surface-secondary text-pv-text-secondary uppercase">
                    {ch.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-pv-surface-secondary p-3 rounded-lg border border-pv-border text-xs">
                  <div className="border-r border-pv-border pr-2">
                    <p className="text-[10px] text-pv-text-muted font-medium uppercase truncate">
                      {ch.creatorName} {isCreator && '(You)'}
                    </p>
                    <p className="font-semibold text-pv-text-primary font-tabular mt-0.5">
                      {ch.creatorScore !== undefined ? `${ch.creatorScore} pts` : `Target: ${ch.targetScore}`}
                    </p>
                    <p className="text-[10px] text-pv-text-muted font-tabular">
                      {ch.creatorTime ? `${ch.creatorTime}s` : `${ch.targetTime}s target`}
                    </p>
                  </div>

                  <div className="pl-2">
                    <p className="text-[10px] text-pv-text-muted font-medium uppercase truncate">
                      {ch.opponentName ? ch.opponentName : 'Open opponent'}
                    </p>
                    <p className="font-semibold text-[#38C6BA] font-tabular mt-0.5">
                      {ch.opponentScore !== undefined ? `${ch.opponentScore} pts` : 'Pending'}
                    </p>
                    <p className="text-[10px] text-pv-text-muted font-tabular">
                      {ch.opponentTime ? `${ch.opponentTime}s` : 'Waiting for score'}
                    </p>
                  </div>
                </div>

                {ch.status === 'COMPLETED' && ch.winnerName && (
                  <div className="bg-pv-surface-secondary border border-pv-border p-2.5 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-pv-text-primary font-medium flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-[#38C6BA]" /> Winner: {ch.winnerName}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-medium font-tabular">
                      +150 XP • +75 Coins
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {ch.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => playChallengeMatch(ch.id, ch.puzzleType, ch.difficulty, ch.seed)}
                      className="flex-1 h-8 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Play Match
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRematch(ch)}
                      className="flex-1 h-8 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Rematch
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyLink(ch.id)}
                    className="h-8 px-2.5 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-secondary hover:text-pv-text-primary rounded-lg border border-pv-border transition-colors"
                    title="Copy share link"
                  >
                    {copiedId === ch.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 ">
          <div className="bg-pv-surface-primary border border-pv-border rounded-xl p-6 max-w-md w-full space-y-4 shadow-lg relative">
            <div className="flex items-center justify-between border-b border-pv-border pb-3">
              <h3 className="text-base font-semibold text-pv-text-primary flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#38C6BA]" /> Create Challenge Room
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-pv-text-muted hover:text-pv-text-primary hover:bg-pv-surface-secondary transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdChallengeId ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-10 h-10 bg-emerald-950/40 text-emerald-400 rounded-lg flex items-center justify-center mx-auto border border-emerald-500/40">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-pv-text-primary">Challenge Room Created</h4>
                  <p className="text-xs text-pv-text-secondary mt-0.5">
                    Room ID: <span className="font-mono text-[#38C6BA] font-semibold">{createdChallengeId}</span>
                  </p>
                </div>
                <div className="bg-pv-surface-secondary p-3 rounded-lg border border-pv-border flex items-center justify-between gap-2 text-xs font-mono text-pv-text-secondary">
                  <span className="truncate">{`${window.location.origin}/challenges?id=${createdChallengeId}`}</span>
                  <button
                    onClick={() => handleCopyLink(createdChallengeId)}
                    className="h-7 px-2.5 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs font-medium rounded transition-colors shrink-0"
                  >
                    {copiedId === createdChallengeId ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    const ch = challenges.find((c) => c.id === createdChallengeId);
                    setShowCreateModal(false);
                    if (ch) {
                      playChallengeMatch(ch.id, ch.puzzleType, ch.difficulty, ch.seed);
                    }
                  }}
                  className="w-full h-10 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold text-xs font-medium rounded-lg transition-colors"
                >
                  Start Your Match
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-pv-text-secondary font-medium mb-1">Puzzle Mode</label>
                  <select
                    value={selectedPuzzle}
                    onChange={(e) => setSelectedPuzzle(e.target.value as PuzzleType)}
                    className="w-full bg-pv-surface-secondary border border-pv-border rounded-lg p-2.5 text-xs text-pv-text-primary focus:outline-none focus:border-[#38C6BA]"
                  >
                    {PUZZLE_MODES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-pv-text-secondary font-medium mb-1">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`h-8 rounded-lg font-medium uppercase text-[11px] tracking-wider transition-colors border ${
                          selectedDifficulty === diff
                            ? 'bg-pv-surface-soft text-pv-text-primary border-pv-border-strong font-semibold'
                            : 'bg-pv-surface-secondary text-pv-text-secondary border-pv-border hover:border-pv-border-strong hover:text-pv-text-primary'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-pv-text-secondary font-medium mb-1">Target Score</label>
                    <input
                      type="number"
                      value={targetScore}
                      onChange={(e) => setTargetScore(Number(e.target.value))}
                      className="w-full bg-pv-surface-secondary border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary font-mono focus:outline-none focus:border-[#38C6BA]"
                    />
                  </div>
                  <div>
                    <label className="block text-pv-text-secondary font-medium mb-1">Target Time (s)</label>
                    <input
                      type="number"
                      value={targetTime}
                      onChange={(e) => setTargetTime(Number(e.target.value))}
                      className="w-full bg-pv-surface-secondary border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary font-mono focus:outline-none focus:border-[#38C6BA]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-pv-text-secondary font-medium mb-1">Opponent Name (optional)</label>
                  <input
                    type="text"
                    value={opponentName}
                    onChange={(e) => setOpponentName(e.target.value)}
                    placeholder="Leave empty for public share link"
                    className="w-full bg-pv-surface-secondary border border-pv-border rounded-lg p-2 text-xs text-pv-text-primary placeholder-pv-text-muted focus:outline-none focus:border-[#38C6BA]"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 h-9 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-secondary hover:text-pv-text-primary font-medium rounded-lg text-xs border border-pv-border transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateChallenge}
                    className="flex-1 h-9 bg-[#087F8C] hover:bg-[#066B75] text-[#FFFFFF] font-semibold font-medium rounded-lg text-xs transition-colors"
                  >
                    Create Room
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
