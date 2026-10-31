import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNotifications } from '../../store/NotificationContext';
import { Trophy, ArrowUpCircle, Flame, Calendar, Target, Medal, Info, CheckCircle2, Trash2, Bell, Users, UserPlus, Gift, Swords, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type FilterTab = 'ALL' | 'UNREAD' | 'ACHIEVEMENTS' | 'CHALLENGES' | 'SOCIAL' | 'REWARDS' | 'SYSTEM';

export const Notifications = () => {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'ACHIEVEMENT': return <Trophy className="w-5 h-5 text-warning" />;
      case 'LEVEL_UP': return <ArrowUpCircle className="w-5 h-5 text-primary" />;
      case 'STREAK': return <Flame className="w-5 h-5 text-error" />;
      case 'PERSONAL_BEST': return <Target className="w-5 h-5 text-secondary" />;
      case 'DAILY_PUZZLE': return <Calendar className="w-5 h-5 text-success" />;
      case 'LEADERBOARD': return <Medal className="w-5 h-5 text-warning" />;
      case 'FRIEND_REQUEST': return <UserPlus className="w-5 h-5 text-primary" />;
      case 'FRIEND_ACCEPTED': return <Users className="w-5 h-5 text-success" />;
      case 'FRIEND_ACTIVITY': return <Activity className="w-5 h-5 text-secondary" />;
      case 'CHALLENGE_INVITATION': return <Swords className="w-5 h-5 text-error" />;
      case 'CHALLENGE_RESULT': return <Trophy className="w-5 h-5 text-accent" />;
      case 'BATTLE_CHALLENGE': return <Swords className="w-5 h-5 text-error animate-pulse" />;
      case 'BATTLE_RESULT': return <Trophy className="w-5 h-5 text-warning" />;
      case 'DAILY_REWARD': return <Gift className="w-5 h-5 text-accent" />;
      default: return <Info className="w-5 h-5 text-textMuted" />;
    }
  };

  const getLink = (notif: any) => {
    switch (notif.type) {
      case 'ACHIEVEMENT': return '/achievements';
      case 'LEVEL_UP': return '/profile';
      case 'STREAK': return '/profile';
      case 'DAILY_PUZZLE': return '/daily-puzzle';
      case 'PERSONAL_BEST': return '/profile';
      case 'LEADERBOARD': return '/leaderboard';
      case 'FRIEND_REQUEST':
      case 'FRIEND_ACCEPTED':
      case 'FRIEND_ACTIVITY':
      case 'CHALLENGE_INVITATION':
      case 'CHALLENGE_RESULT':
        return '/friends';
      case 'BATTLE_CHALLENGE':
        return `/battle/${notif.metadata?.battleId}`;
      case 'BATTLE_RESULT':
        return '/battle';
      default: return '#';
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return 'Just now';
    const timestamp = createdAt.toMillis ? createdAt.toMillis() : createdAt;
    const diff = Date.now() - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'ACHIEVEMENTS') return ['ACHIEVEMENT', 'LEVEL_UP', 'STREAK', 'PERSONAL_BEST'].includes(n.type);
    if (filter === 'CHALLENGES') return ['DAILY_PUZZLE', 'LEADERBOARD'].includes(n.type);
    if (filter === 'SOCIAL') return ['FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'FRIEND_ACTIVITY', 'CHALLENGE_INVITATION', 'CHALLENGE_RESULT'].includes(n.type);
    if (filter === 'REWARDS') return ['DAILY_REWARD'].includes(n.type);
    if (filter === 'SYSTEM') return ['SYSTEM'].includes(n.type);
    return true;
  });

  const tabs: { id: FilterTab, label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'UNREAD', label: 'Unread' },
    { id: 'ACHIEVEMENTS', label: 'Achievements' },
    { id: 'CHALLENGES', label: 'Challenges' },
    { id: 'SOCIAL', label: 'Social' },
    { id: 'REWARDS', label: 'Rewards' },
    { id: 'SYSTEM', label: 'System' }
  ];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textMain flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Notifications
          </h1>
          <p className="text-textMuted mt-2">Stay updated with your latest milestones.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => markAllAsRead()}>Mark All Read</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50 pb-0">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`font-bold pb-1 whitespace-nowrap border-b-2 transition-colors ${filter === tab.id ? 'border-primary text-textMain' : 'border-transparent text-textMuted hover:text-textMain'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifs.length === 0 ? (
            <div className="text-center p-12 text-textMuted flex flex-col items-center">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold">You're all caught up!</p>
              <p className="text-sm mt-1">No notifications found for this category.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredNotifs.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-4 flex gap-4 transition-colors hover:bg-white/5 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className="mt-1">
                    <div className={`p-2 rounded-full ${!notif.isRead ? 'bg-background shadow-md shadow-primary/20' : 'bg-surface border border-white/5'}`}>
                      {getIcon(notif.type)}
                    </div>
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => {
                    if (!notif.isRead) markAsRead(notif.id);
                    navigate(getLink(notif));
                  }}>
                    <div className="flex justify-between items-start gap-2">
                      <p className={`font-bold ${!notif.isRead ? 'text-textMain' : 'text-textMuted'}`}>
                        {notif.title}
                      </p>
                      <span className="text-xs text-textMuted whitespace-nowrap">{formatTime(notif.createdAt)}</span>
                    </div>
                    <p className="text-sm text-textMuted mt-1">{notif.message}</p>
                    
                    {/* Optional Metadata Render */}
                    {notif.metadata?.reward && (
                      <p className="text-xs font-bold text-primary mt-2">Reward: {notif.metadata.reward}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }} 
                        className="p-1.5 text-textMuted hover:text-success hover:bg-success/10 rounded-md transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} 
                      className="p-1.5 text-textMuted hover:text-error hover:bg-error/10 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
