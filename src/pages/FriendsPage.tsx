import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  createFriendChallenge,
  fetchSocialFeed,
  sendKudosGift,
  fetchHeadToHeadStats,
} from '../services/firebase';
import { SocialFeedItem, HeadToHeadStats } from '../types';
import { toast } from '../services/toast';
import { Users, Copy, Swords, Play, Heart, Activity } from 'lucide-react';
import { PageHeader, Card } from '../components/ui/Card';

export const FriendsPage: React.FC = () => {
  const { user, playGame } = useStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'rivalry'>('feed');
  const [copied, setCopied] = useState(false);
  const [challengeCode, setChallengeCode] = useState<string | null>(null);
  const [socialFeed, setSocialFeed] = useState<SocialFeedItem[]>([]);
  const [h2hStats, setH2hStats] = useState<HeadToHeadStats | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => {
    fetchSocialFeed().then((feed) => setSocialFeed(feed));
  }, []);

  useEffect(() => {
    if (user && selectedOpponent) {
      fetchHeadToHeadStats(user.uid, selectedOpponent.id).then((stats) => setH2hStats(stats));
    }
  }, [user, selectedOpponent]);

  const handleSendKudos = async (friendName: string, friendId: string) => {
    if (!user) return;
    try {
      await sendKudosGift({
        senderId: user.uid,
        senderName: user.displayName,
        receiverId: friendId,
        giftType: 'kudos',
        xpValue: 15,
        createdAt: new Date().toISOString(),
      });
      toast.kudos(`Kudos sent to ${friendName}`, 'You granted +15 XP energy.');
    } catch {
      toast.error('Failed to send kudos');
    }
  };

  const handleGenerateChallenge = async () => {
    if (!user) return;
    const challengeId = await createFriendChallenge({
      creatorUid: user.uid,
      creatorName: user.displayName,
      puzzleType: 'number',
      difficulty: 'medium',
      targetScore: 500,
      targetTime: 60,
      seed: Math.floor(Math.random() * 100000),
      createdAt: new Date().toISOString(),
    });
    if (challengeId) {
      setChallengeCode(challengeId);
    }
  };

  const handleCopy = () => {
    if (!challengeCode) return;
    navigator.clipboard.writeText(`${window.location.origin}/challenges?id=${challengeCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Community & Friends"
        description="Player activity updates, direct duel rooms, and head-to-head match records."
        action={
          <button
            onClick={handleGenerateChallenge}
            className="h-9 px-4 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Create Challenge Room</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-pv-border pb-2">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-3.5 h-8 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'feed'
              ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
              : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Activity Feed
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-3.5 h-8 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'friends'
              ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
              : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Friends
        </button>
        <button
          onClick={() => setActiveTab('rivalry')}
          className={`px-3.5 h-8 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'rivalry'
              ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
              : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
          }`}
        >
          <Swords className="w-3.5 h-3.5" /> Head-to-Head
        </button>
      </div>

      {/* Challenge Room Banner */}
      {challengeCode && (
        <Card className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-pv-dragon-fruit/40">
          <div>
            <p className="text-[11px] font-semibold text-pv-dragon-fruit uppercase tracking-wider">
              Challenge Room Ready
            </p>
            <p className="text-sm text-pv-text-primary mt-0.5">
              Room ID: <span className="font-mono font-semibold">{challengeCode.substring(0, 8)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="h-9 px-3 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              onClick={() => playGame('challenge_mode', 'medium')}
              className="h-9 px-4 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Match</span>
            </button>
          </div>
        </Card>
      )}

      {/* Tab 1: Activity Feed */}
      {activeTab === 'feed' && (
        <div className="space-y-3">
          {socialFeed.length === 0 ? (
            <Card className="p-10 text-center space-y-2">
              <Activity className="w-8 h-8 text-pv-text-muted mx-auto" />
              <h3 className="text-sm font-semibold text-pv-text-primary">No Recent Activities</h3>
              <p className="text-xs text-pv-text-secondary max-w-sm mx-auto">
                Game completions and milestone achievements from community members will appear here.
              </p>
            </Card>
          ) : (
            socialFeed.map((item) => (
              <Card key={item.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <img
                    src={item.userAvatar}
                    alt={item.userName}
                    className="w-9 h-9 rounded-md border border-pv-border bg-pv-surface-secondary shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-pv-text-primary text-xs">{item.userName}</span>
                      {item.titleFlair && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-pv-surface-secondary border border-pv-border rounded text-pv-text-muted font-mono">
                          {item.titleFlair}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-pv-text-secondary mt-0.5">{item.details}</p>
                    <span className="text-[10px] text-pv-text-muted block mt-1 font-tabular">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleSendKudos(item.userName, item.userId)}
                  className="h-8 px-2.5 rounded-lg border border-pv-border hover:border-pv-dragon-fruit/50 text-pv-text-secondary hover:text-pv-dragon-fruit text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Heart className="w-3.5 h-3.5" /> Kudos
                </button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Friends List */}
      {activeTab === 'friends' && (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-pv-surface-secondary rounded-lg flex items-center justify-center text-pv-text-muted mx-auto border border-pv-border">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-pv-text-primary mb-1">No friends added yet</h3>
            <p className="text-xs text-pv-text-secondary max-w-sm mx-auto leading-relaxed">
              Create a challenge room above and share the room link with a player to connect and establish rivalries.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleGenerateChallenge}
              className="h-9 px-4 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Create Challenge Room</span>
            </button>
          </div>
        </Card>
      )}

      {/* Tab 3: Head-to-Head */}
      {activeTab === 'rivalry' && (
        <div className="space-y-4">
          {!selectedOpponent ? (
            <Card className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-pv-surface-secondary rounded-lg flex items-center justify-center text-pv-text-muted mx-auto border border-pv-border">
                <Swords className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-pv-text-primary mb-1">
                No active head-to-head match selected
              </h3>
              <p className="text-xs text-pv-text-secondary max-w-sm mx-auto leading-relaxed">
                Invite an opponent through a challenge room to track lifetime statistics and head-to-head victory margins.
              </p>
            </Card>
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-pv-border pb-4">
                <h3 className="text-base font-semibold text-pv-text-primary flex items-center gap-2">
                  <Swords className="w-4 h-4 text-pv-dragon-fruit" />
                  Match history: vs {selectedOpponent.name}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="bg-pv-surface-secondary p-4 rounded-lg border border-pv-border">
                  <span className="text-[11px] text-pv-text-muted uppercase font-medium block mb-1">
                    Total Matches
                  </span>
                  <span className="text-2xl font-semibold text-pv-text-primary font-tabular">
                    {h2hStats?.totalMatches || 0}
                  </span>
                </div>
                <div className="bg-pv-surface-secondary p-4 rounded-lg border border-pv-border">
                  <span className="text-[11px] text-pv-text-muted uppercase font-medium block mb-1">
                    Your Wins
                  </span>
                  <span className="text-2xl font-semibold text-emerald-400 font-tabular">
                    {h2hStats?.wins || 0}
                  </span>
                </div>
                <div className="bg-pv-surface-secondary p-4 rounded-lg border border-pv-border">
                  <span className="text-[11px] text-pv-text-muted uppercase font-medium block mb-1">
                    Opponent Wins
                  </span>
                  <span className="text-2xl font-semibold text-rose-400 font-tabular">
                    {h2hStats?.losses || 0}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => playGame('challenge_mode', 'medium')}
                  className="h-10 px-5 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold text-xs font-medium rounded-lg transition-colors"
                >
                  Direct Rematch
                </button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
