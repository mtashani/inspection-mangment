'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { PSV } from '@/components/psv/types';

// Notification priority levels
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

// Notification types
export type NotificationType = 
  | 'calibration_due' 
  | 'calibration_overdue' 
  | 'rbi_change' 
  | 'psv_update'
  | 'system_alert'
  | 'task_complete';

// Notification status
export type NotificationStatus = 'unread' | 'read' | 'archived' | 'dismissed';

// Notification model
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  relatedItemId?: string;     // E.g., PSV tag number
  relatedItemType?: string;   // E.g., 'psv', 'rbi_config'
  actionUrl?: string;         // URL to navigate to when notification is clicked
  createdAt: string;
  expiresAt?: string;
}

interface NotificationsContextProps {
  notifications: Notification[];
  unreadCount: number;
  hasActiveAlerts: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  archiveNotification: (id: string) => void;
  clearNotifications: () => void;
  getNotificationsByType: (type: NotificationType) => Notification[];
  getNotificationsByPriority: (priority: NotificationPriority) => Notification[];
  getNotificationsByStatus: (status: NotificationStatus) => Notification[];
  checkCalibrationDue: (psvs: PSV[]) => void;
}

const NotificationsContext = createContext<NotificationsContextProps | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Load notifications from localStorage on component mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Failed to parse saved notifications:', error);
        // Initialize with empty array if there's an error
        setNotifications([]);
      }
    }
  }, []);
  
  // Save notifications to localStorage when they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);
  
  // Auto cleanup expired notifications
  useEffect(() => {
    const now = new Date().toISOString();
    const filteredNotifications = notifications.filter(
      (notif) => !notif.expiresAt || notif.expiresAt > now
    );
    
    if (filteredNotifications.length !== notifications.length) {
      setNotifications(filteredNotifications);
    }
    
    // Schedule cleanup to run daily
    const cleanupInterval = setInterval(() => {
      setNotifications((currentNotifications) => {
        const now = new Date().toISOString();
        return currentNotifications.filter(
          (notif) => !notif.expiresAt || notif.expiresAt > now
        );
      });
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    return () => clearInterval(cleanupInterval);
  }, [notifications]);
  
  // Calculate derived stats
  const unreadCount = notifications.filter(
    (notification) => notification.status === 'unread'
  ).length;
  
  const hasActiveAlerts = notifications.some(
    (notification) => 
      (notification.priority === 'high' || notification.priority === 'critical') && 
      notification.status === 'unread'
  );
  
  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      status: 'unread',
      createdAt: new Date().toISOString(),
    };
    
    setNotifications((prev) => [newNotification, ...prev]);
    
    // Show browser notification for high priority alerts if supported
    if ((notification.priority === 'high' || notification.priority === 'critical') && 
        'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, { 
        body: notification.message,
      });
    }
  }, []);
  
  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => 
      prev.map((notification) => 
        notification.id === id
          ? { ...notification, status: 'read' }
          : notification
      )
    );
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => 
      prev.map((notification) => 
        notification.status === 'unread'
          ? { ...notification, status: 'read' }
          : notification
      )
    );
  }, []);
  
  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => 
      prev.map((notification) => 
        notification.id === id
          ? { ...notification, status: 'dismissed' }
          : notification
      )
    );
  }, []);
  
  // Archive notification
  const archiveNotification = useCallback((id: string) => {
    setNotifications((prev) => 
      prev.map((notification) => 
        notification.id === id
          ? { ...notification, status: 'archived' }
          : notification
      )
    );
  }, []);
  
  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  }, []);
  
  // Get notifications by type
  const getNotificationsByType = useCallback((type: NotificationType) => {
    return notifications.filter((notification) => notification.type === type);
  }, [notifications]);
  
  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority: NotificationPriority) => {
    return notifications.filter((notification) => notification.priority === priority);
  }, [notifications]);
  
  // Get notifications by status
  const getNotificationsByStatus = useCallback((status: NotificationStatus) => {
    return notifications.filter((notification) => notification.status === status);
  }, [notifications]);
  
  // Check PSVs for calibration due and create notifications
  const checkCalibrationDue = useCallback((psvs: PSV[]) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    
    // Process each PSV and create notifications as needed
    psvs.forEach(psv => {
      if (!psv.expire_date) return;
      
      const expireDate = new Date(psv.expire_date);
      
      // If calibration is overdue (expires before today)
      if (expireDate < today) {
        const daysOverdue = Math.ceil((today.getTime() - expireDate.getTime()) / (1000 * 60 * 60 * 24));
        addNotification({
          title: `PSV Calibration Overdue: ${psv.tag_number}`,
          message: `Calibration for ${psv.tag_number} is overdue by ${daysOverdue} days. Please schedule calibration immediately.`,
          type: 'calibration_overdue',
          priority: daysOverdue > 30 ? 'critical' : 'high',
          relatedItemId: psv.tag_number,
          relatedItemType: 'psv',
          actionUrl: `/psv/${psv.tag_number}`,
        });
      }
      // If calibration is due within 30 days
      else if (expireDate <= thirtyDaysFromNow) {
        const daysRemaining = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        addNotification({
          title: `PSV Calibration Due Soon: ${psv.tag_number}`,
          message: `Calibration for ${psv.tag_number} is due in ${daysRemaining} days (${format(expireDate, 'yyyy-MM-dd')}).`,
          type: 'calibration_due',
          priority: daysRemaining <= 7 ? 'high' : 'medium',
          relatedItemId: psv.tag_number,
          relatedItemType: 'psv',
          actionUrl: `/psv/${psv.tag_number}`,
        });
      }
      // If calibration is due within 90 days
      else if (expireDate <= ninetyDaysFromNow) {
        const daysRemaining = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        addNotification({
          title: `PSV Calibration Upcoming: ${psv.tag_number}`,
          message: `Calibration for ${psv.tag_number} is scheduled for ${format(expireDate, 'yyyy-MM-dd')} (${daysRemaining} days from now).`,
          type: 'calibration_due',
          priority: 'low',
          relatedItemId: psv.tag_number,
          relatedItemType: 'psv',
          actionUrl: `/psv/${psv.tag_number}`,
        });
      }
    });
  }, [addNotification]);
  
  const value = {
    notifications,
    unreadCount,
    hasActiveAlerts,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    archiveNotification,
    clearNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
    getNotificationsByStatus,
    checkCalibrationDue,
  };
  
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  
  return context;
}