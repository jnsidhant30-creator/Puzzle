import { useState, useRef, useEffect } from 'react';
import { Bell, Trophy, ArrowUpCircle, Flame, Calendar, Target, Medal, Info, Users, UserPlus, Gift, Swords, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../store/NotificationContext';
import { Button } from '../ui/Button';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ACHIEVEMENT': return <Trophy className="w-4 h-4 text-warning" />;
      case 'LEVEL_UP': return <ArrowUpCircle className="w-4 h-4 text-primary" />;
      case 'STREAK': return <Flame className="w-4 h-4 text-error" />;
      case 'PERSONAL_BEST': return <Target className="w-4 h-4 text-secondary" />;
      case 'DAILY_PUZZLE': return <Calendar className="w-4 h-4 text-success" />;
      case 'LEADERBOARD': return <Medal className="w-4 h-4 text-warning" />;
      case 'FRIEND_REQUEST': return <UserPlus className="w-4 h-4 text-primary" />;
      case 'FRIEND_ACCEPTED': return <Users className="w-4 h-4 text-success" />;
      case 'FRIEND_ACTIVITY': return <Activity className="w-4 h-4 text-secondary" />;
      case 'CHALLENGE_INVITATION': return <Swords className="w-4 h-4 text-error" />;
      case 'CHALLENGE_RESULT': return <Trophy className="w-4 h-4 text-accent" />;
      case 'DAILY_REWARD': return <Gift className="w-4 h-4 text-accent" />;
      default: return <Info className="w-4 h-4 text-textMuted" />;
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

  const getLink = (type: string) => {
    switch (type) {
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
      default: return '/notifications';
    }
  };

  const handleNotificationClick = (id: string, type: string) => {
    markAsRead(id);
    setIsOpen(false);
    navigate(getLink(type));
  };

  const previewNotifs = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-textMuted hover:text-textMain hover:bg-white/5 rounded-md transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-background animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-border/50 flex justify-between items-center bg-black/20">
            <h3 className="font-bold text-textMain flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="text-xs text-textMuted hover:text-primary font-bold transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {previewNotifs.length === 0 ? (
              <div className="p-8 text-center text-textMuted text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {previewNotifs.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, notif.type)}
                    className={`p-4 flex gap-3 cursor-pointer hover:bg-white/5 transition-colors group ${!notif.isRead ? 'bg-primary/5' : ''}`}
                  >
                    <div className="mt-0.5">
                      <div className={`p-1.5 rounded-full ${!notif.isRead ? 'bg-background shadow-md shadow-primary/20' : 'bg-black/20 border border-white/5'}`}>
                        {getIcon(notif.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`font-bold text-sm truncate ${!notif.isRead ? 'text-textMain' : 'text-textMuted'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 ml-2" />}
                      </div>
                      <p className="text-xs text-textMuted mt-0.5 line-clamp-2">{notif.message}</p>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-textMuted font-medium">{formatTime(notif.createdAt)}</span>
                        {notif.metadata?.reward && (
                          <span className="text-[10px] font-bold text-primary">{notif.metadata.reward}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-border/50 bg-black/20">
            <Link to="/notifications" onClick={() => setIsOpen(false)}>
              <Button variant="secondary" className="w-full text-xs">View All Notifications</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
