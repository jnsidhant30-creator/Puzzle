import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/useAuthStore';
import { useSocialStore } from '../../store/useSocialStore';
import { searchUsers, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from '../../services/socialService';
import type { PublicProfile } from '../../services/socialService';
import { Search, UserPlus, Check, X, Users, Swords, Activity, UserMinus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const Friends = () => {
  const { profile } = useAuthStore();
  const { requests, friendsProfiles, loading } = useSocialStore();
  
  const [activeTab, setActiveTab] = useState<'my-friends' | 'requests' | 'find'>('my-friends');
  
  // Find Friends State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const incomingRequests = pendingRequests.filter(r => r.receiverId === profile?.uid);
  const outgoingRequests = pendingRequests.filter(r => r.senderId === profile?.uid);
  const friends = requests.filter(r => r.status === 'accepted');

  useEffect(() => {
    const doSearch = async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      const res = await searchUsers(searchQuery);
      setSearchResults(res.filter(p => p.uid !== profile?.uid));
      setSearching(false);
    };
    
    const timeoutId = setTimeout(doSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, profile?.uid]);

  const handleSendRequest = async (uid: string) => {
    if (!profile) return;
    setActionLoading(uid);
    try {
      await sendFriendRequest(profile, uid);
    } catch (err: any) {
      alert(err.message || "Failed to send request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (reqId: string, senderId: string) => {
    if (!profile) return;
    setActionLoading(reqId);
    try {
      await acceptFriendRequest(reqId, profile, senderId);
    } catch (err: any) {
      alert("Failed to accept request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (reqId: string) => {
    setActionLoading(reqId);
    try {
      await declineFriendRequest(reqId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (reqId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    setActionLoading(reqId);
    try {
      await removeFriend(reqId);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-textMain flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Friends & Social
        </h1>
        <p className="text-textMuted mt-2">Connect with friends, compare scores, and challenge each other.</p>
      </div>

      <div className="flex gap-2 mb-6 bg-surface/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('my-friends')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'my-friends' ? 'bg-primary text-white shadow-lg' : 'text-textMuted hover:text-textMain'}`}
        >
          My Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'requests' ? 'bg-primary text-white shadow-lg' : 'text-textMuted hover:text-textMain'} relative`}
        >
          Requests
          {incomingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              {incomingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('find')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'find' ? 'bg-primary text-white shadow-lg' : 'text-textMuted hover:text-textMain'}`}
        >
          <Search className="w-4 h-4" /> Find Friends
        </button>
      </div>

      {activeTab === 'my-friends' && (
        <div className="space-y-6">
          {friends.length === 0 ? (
            <Card className="border-dashed bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 text-textMuted mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-textMain mb-2">Your friend list is empty.</h3>
                <p className="text-textMuted mb-6">Search for your friends by username to connect.</p>
                <Button onClick={() => setActiveTab('find')}>Find Friends</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map(f => {
                const friendUid = f.senderId === profile?.uid ? f.receiverId : f.senderId;
                const friendProfile = friendsProfiles[friendUid];
                if (!friendProfile) return null;
                
                return (
                  <Card key={f.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {friendProfile.avatarUrl ? (
                            <img src={friendProfile.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase">
                              {friendProfile.displayName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-textMain line-clamp-1">{friendProfile.displayName}</h3>
                            <p className="text-xs text-textMuted">@{friendProfile.username}</p>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-surface flex flex-col items-center justify-center">
                          <span className="text-xs text-textMuted font-bold uppercase">Lvl</span>
                          <span className="text-sm font-black text-primary leading-none">{friendProfile.level}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          className="flex-1 flex items-center gap-2" 
                          onClick={() => alert("Detailed Friend Profiles coming soon!")}
                        >
                          <Activity className="w-4 h-4" /> View
                        </Button>
                        <Button 
                          variant="danger" 
                          className="px-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                          onClick={() => handleRemoveFriend(f.id)}
                          disabled={actionLoading === f.id}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Requests ({incomingRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {incomingRequests.length === 0 ? (
                <p className="text-textMuted py-4 text-center">No incoming friend requests.</p>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map(req => {
                    const senderProfile = friendsProfiles[req.senderId];
                    if (!senderProfile) return null;
                    return (
                      <div key={req.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {senderProfile.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-textMain">{senderProfile.displayName}</p>
                            <p className="text-xs text-textMuted">@{senderProfile.username} • Level {senderProfile.level}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="secondary" 
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3"
                            onClick={() => handleDecline(req.id)}
                            disabled={actionLoading === req.id}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                          <Button 
                            className="px-3"
                            onClick={() => handleAccept(req.id, senderProfile.uid)}
                            disabled={actionLoading === req.id}
                          >
                            <Check className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outgoing Requests ({outgoingRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {outgoingRequests.length === 0 ? (
                <p className="text-textMuted py-4 text-center">No pending outgoing requests.</p>
              ) : (
                <div className="space-y-4">
                  {outgoingRequests.map(req => {
                    const receiverProfile = friendsProfiles[req.receiverId];
                    if (!receiverProfile) return null;
                    return (
                      <div key={req.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border opacity-70">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {receiverProfile.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-textMain">{receiverProfile.displayName}</p>
                            <p className="text-xs text-textMuted">@{receiverProfile.username}</p>
                          </div>
                        </div>
                        <Button 
                          variant="secondary" 
                          className="text-xs"
                          onClick={() => handleDecline(req.id)}
                          disabled={actionLoading === req.id}
                        >
                          Cancel
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'find' && (
        <Card>
          <CardHeader>
            <CardTitle>Search for Friends</CardTitle>
            <p className="text-sm text-textMuted">Search by exact username prefix</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
              <Input 
                placeholder="Type a username..." 
                className="pl-10 py-6 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-4 min-h-[200px]">
              {searching ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(res => {
                  const isFriend = friends.some(f => f.senderId === res.uid || f.receiverId === res.uid);
                  const isPending = pendingRequests.some(r => r.senderId === res.uid || r.receiverId === res.uid);

                  return (
                    <div key={res.uid} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        {res.avatarUrl ? (
                          <img src={res.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase">
                            {res.displayName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-textMain text-lg">{res.displayName}</p>
                          <p className="text-sm text-textMuted">@{res.username} • Level {res.level}</p>
                        </div>
                      </div>
                      <div>
                        {isFriend ? (
                          <div className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg font-bold text-sm flex items-center gap-1">
                            <Check className="w-4 h-4" /> Friends
                          </div>
                        ) : isPending ? (
                          <div className="px-3 py-1.5 bg-surface text-textMuted border border-border rounded-lg font-bold text-sm">
                            Pending
                          </div>
                        ) : (
                          <Button 
                            className="flex items-center gap-2"
                            onClick={() => handleSendRequest(res.uid)}
                            disabled={actionLoading === res.uid}
                          >
                            <UserPlus className="w-4 h-4" /> Add
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : searchQuery.length >= 3 ? (
                <p className="text-textMuted text-center py-8">No players found matching "{searchQuery}".</p>
              ) : (
                <p className="text-textMuted text-center py-8">Type at least 3 characters to search.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};
