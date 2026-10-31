import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthStore } from './useAuthStore';
import { 
  markAsRead as dbMarkAsRead, 
  markAllAsRead as dbMarkAllAsRead,
  deleteNotification as dbDeleteNotification,
  createNotification as dbCreateNotification
} from '../services/notificationService';
import type { AppNotification, NotificationType } from '../services/notificationService';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  dispatchNotification: (title: string, message: string, type: NotificationType, metadata?: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !profile?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      let unread = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const notif = { id: doc.id, ...data } as AppNotification;
        notifs.push(notif);
        if (!notif.isRead) {
          unread++;
        }
      });
      
      setNotifications(notifs);
      setUnreadCount(unread);
      setLoading(false);
    }, (error) => {
      console.error("Notification listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.uid, isAuthenticated]);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await dbMarkAsRead(id);
  };

  const markAllAsRead = async () => {
    if (!profile?.uid) return;
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await dbMarkAllAsRead(profile.uid, unreadIds);
  };

  const deleteNotification = async (id: string) => {
    // Optimistic UI update
    const isUnread = notifications.find(n => n.id === id)?.isRead === false;
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (isUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    await dbDeleteNotification(id);
  };

  const dispatchNotification = async (title: string, message: string, type: NotificationType, metadata?: any) => {
    if (!profile?.uid) return;
    
    // Check if duplicate exists locally (basic throttle/dedupe)
    const isDuplicate = notifications.some(n => 
      n.title === title && 
      n.type === type && 
      (Date.now() - (n.createdAt?.toMillis ? n.createdAt.toMillis() : n.createdAt)) < 5000
    );

    if (isDuplicate) return;

    // Trigger DB creation. The onSnapshot listener will pick it up automatically.
    const newNotif = await dbCreateNotification(profile.uid, title, message, type, metadata);

    // Optional: trigger custom event for a Toast
    const event = new CustomEvent('appNotification', { detail: newNotif });
    window.dispatchEvent(event);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      markAsRead, 
      markAllAsRead, 
      deleteNotification,
      dispatchNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
