'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { webSocketService, NotificationData } from '@/lib/services/websocket-service';
import { wsDebugHelper } from '@/lib/debug/websocket-debug-helper';
import { toast } from 'sonner';
import { notificationsApi, BackendNotification } from '@/lib/api/notifications';
import { useAuth } from '@/contexts/auth-context';

// Enhanced notification interface for the context
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  relatedItemId?: string;
  relatedItemType?: string;
  metadata?: Record<string, any>;
}

interface RealTimeNotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isConnecting: boolean;
  isBackendConnected: boolean;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  connectWebSocket: (token: string) => Promise<void>;
  disconnectWebSocket: () => void;
  loadPersistedNotifications: () => Promise<void>;
}

const RealTimeNotificationsContext = createContext<RealTimeNotificationsContextType | undefined>(undefined);

export function RealTimeNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Convert backend notification to frontend format
  const convertNotification = useCallback((data: NotificationData): Notification => {
    try {
      // Validate required fields
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid notification data: not an object')
      }
      
      if (!data.id || !data.title || !data.message) {
        throw new Error('Missing required notification fields: id, title, or message')
      }
      
      // Map notification types
      const typeMapping: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
        'event_created': 'success',
        'sub_event_created': 'success',
        'event_updated': 'info',
        'event_status_changed': 'info',
        'sub_event_status_changed': 'info',
        'event_approved': 'success',
        'event_approval_reverted': 'warning',
        'inspection_created': 'success',
        'inspection_completed': 'success',
        'bulk_inspections_planned': 'success',
        'calibration_due': 'warning',
        'calibration_overdue': 'error',
        'system_alert': 'warning',
        'task_complete': 'success',
        'rbi_change': 'info',
        'psv_update': 'info'
      }

      return {
        id: String(data.id),
        title: String(data.title),
        message: String(data.message),
        type: typeMapping[data.notification_type] || 'info',
        priority: data.priority || 'medium',
        timestamp: data.created_at ? new Date(data.created_at) : new Date(),
        read: false,
        actionUrl: data.action_url || undefined,
        relatedItemId: data.related_item_id || undefined,
        relatedItemType: data.related_item_type || undefined,
        metadata: data.extra_data || {}
      }
    } catch (error) {
      console.error('❌ Error converting notification data:', {
        error: error instanceof Error ? error.message : 'Unknown conversion error',
        data: data ? JSON.stringify(data) : 'No data'
      })
      
      // Return a safe fallback notification
      return {
        id: String(Date.now()),
        title: 'Notification Error',
        message: 'Failed to process notification data',
        type: 'error',
        priority: 'medium',
        timestamp: new Date(),
        read: false,
        metadata: { error: true, originalData: data }
      }
    }
  }, [])

  // Add notification
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  // Convert backend notification to frontend format
  const convertBackendNotification = useCallback((backendNotification: BackendNotification): Notification => {
    const typeMapping: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
      'event_created': 'success',
      'sub_event_created': 'success',
      'event_updated': 'info',
      'event_status_changed': 'info',
      'sub_event_status_changed': 'info',
      'event_approved': 'success',
      'event_approval_reverted': 'warning',
      'inspection_created': 'success',
      'inspection_completed': 'success',
      'bulk_inspections_planned': 'success',
      'calibration_due': 'warning',
      'calibration_overdue': 'error',
      'system_alert': 'warning',
      'task_complete': 'success',
      'rbi_change': 'info',
      'psv_update': 'info'
    }

    return {
      id: String(backendNotification.id),
      title: backendNotification.title,
      message: backendNotification.message,
      type: typeMapping[backendNotification.type] || 'info',
      priority: backendNotification.priority as 'low' | 'medium' | 'high' | 'critical',
      timestamp: new Date(backendNotification.created_at),
      read: backendNotification.status === 'read',
      actionUrl: backendNotification.action_url,
      relatedItemId: backendNotification.related_item_id,
      relatedItemType: backendNotification.related_item_type,
      metadata: backendNotification.extra_data || {}
    }
  }, [])

  // Load persisted notifications from backend
  const loadPersistedNotifications = useCallback(async () => {
    try {
      console.log('🔄 Loading persisted notifications from backend...')
      
      // Check if we should use mock data
      const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
      if (useMockData) {
        console.log('📝 Using mock data mode - skipping backend call')
        setIsBackendConnected(false)
        return
      }
      
      // Check if we have authentication
      if (!isAuthenticated || !token) {
        console.warn('⚠️ User not authenticated - cannot load notifications')
        console.log('💡 Please login first to see notifications')
        console.log('🔍 Debug - isAuthenticated:', isAuthenticated, 'token:', token ? 'present' : 'missing')
        setIsBackendConnected(false)
        return
      }
      
      console.log('🔑 Authentication check passed, making API call...')
      console.log('🔍 Token length:', token?.length || 0)
      
      const response = await notificationsApi.getNotifications({ limit: 50 })
      
      console.log('📡 API Response received:', {
        notifications: response.notifications?.length || 0,
        unreadCount: response.unread_count || 0
      })
      
      const convertedNotifications = response.notifications.map(convertBackendNotification)
      
      setNotifications(convertedNotifications)
      setIsBackendConnected(true)
      
      console.log('✅ Loaded', convertedNotifications.length, 'persisted notifications')
    } catch (error) {
      console.error('❌ Failed to load persisted notifications:', error)
      console.log('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error
      })
      console.log('💡 Tip: Set NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local to work offline')
      setIsBackendConnected(false)
    }
  }, [convertBackendNotification, isAuthenticated, token])

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    // Update local state immediately
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    
    // Update backend asynchronously
    try {
      const success = await notificationsApi.markNotificationAsRead(Number(id))
      if (!success) {
        console.warn('⚠️ Failed to mark notification as read in backend:', id)
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Update local state immediately
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    // Update backend asynchronously
    try {
      const success = await notificationsApi.markAllNotificationsAsRead()
      if (!success) {
        console.warn('⚠️ Failed to mark all notifications as read in backend')
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error)
    }
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(async (token: string) => {
    try {
      setIsConnecting(true)
      await webSocketService.connect(token)
    } catch (error) {
      const errorInfo = {
        message: error instanceof Error ? error.message : 'Failed to connect WebSocket',
        type: 'websocket_connection_error',
        timestamp: new Date().toISOString()
      }
      console.error('Failed to connect WebSocket:', errorInfo)
      setIsConnecting(false)
      setIsConnected(false)
    }
  }, [])

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  // Handle real-time notifications from WebSocket
  useEffect(() => {
    const handleNotification = (data: NotificationData) => {
      try {
        const notification = convertNotification(data)
        addNotification(notification)

        // Show toast for high priority notifications
        if (notification.priority === 'high' || notification.priority === 'critical') {
          const toastOptions = {
            duration: notification.priority === 'critical' ? 10000 : 5000,
            action: notification.actionUrl ? {
              label: 'View',
              onClick: () => {
                if (notification.actionUrl) {
                  window.location.href = notification.actionUrl
                }
              }
            } : undefined
          }

          switch (notification.type) {
            case 'success':
              toast.success(notification.title, toastOptions)
              break
            case 'warning':
              toast.warning(notification.title, toastOptions)
              break
            case 'error':
              toast.error(notification.title, toastOptions)
              break
            default:
              toast.info(notification.title, toastOptions)
          }
        }
      } catch (error) {
        console.error('❌ Error handling notification:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          data: data || 'No data'
        })
      }
    }

    const handleConnected = () => {
      console.log('✅ Real-time notifications connected');
      setIsConnected(true);
      setIsConnecting(false);
      
      // Load persisted notifications when WebSocket connects
      // This ensures we get existing notifications from DB
      setTimeout(() => {
        console.log('🔄 Loading existing notifications after WebSocket connection...')
        loadPersistedNotifications()
      }, 500) // Small delay to ensure connection is stable
    };

    const handleDisconnected = () => {
      console.log('🔌 Real-time notifications disconnected');
      setIsConnected(false);
      setIsConnecting(false);
    };

    const handleConnectionError = (error: any) => {
      // Handle the new structured error format from WebSocket service
      let errorMessage = 'Unknown connection error'
      let errorType = 'websocket_connection_error'
      let errorDetails = {}
      
      try {
        if (typeof error === 'string') {
          errorMessage = error
        } else if (error && typeof error === 'object') {
          // Handle structured error from WebSocket service
          if (error.message) {
            errorMessage = error.message
          }
          if (error.type) {
            errorType = error.type
          }
          if (error.details) {
            errorDetails = {
              eventType: error.details.eventType,
              readyState: error.details.targetInfo?.readyStateText || error.details.currentWebSocket?.readyStateText,
              url: error.details.targetInfo?.url || error.details.currentWebSocket?.url,
              connectionStatus: error.details.connectionStatus
            }
          }
          // Fallback for older error format
          if (!error.message && error.event) {
            errorMessage = `WebSocket error: ${error.event.type || 'unknown'}`
          }
        }
      } catch (parseError) {
        errorMessage = 'Error parsing connection error details'
        errorDetails = { parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error' }
      }
      
      const errorInfo = {
        message: errorMessage,
        type: errorType,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        connectionStatus: {
          wasConnected: isConnected,
          wasConnecting: isConnecting
        },
        errorSource: 'RealTimeNotificationsProvider.handleConnectionError'
      }
      
      console.error('❌ Real-time notifications connection error:', errorInfo)
      wsDebugHelper.log('error', 'RealTimeNotifications', 'Connection error processed', errorInfo)
      setIsConnected(false)
      setIsConnecting(false)
    }

    // Subscribe to WebSocket events
    webSocketService.on('notification', handleNotification);
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('connection_error', handleConnectionError);

    // Update connection status on mount
    const status = webSocketService.getConnectionStatus();
    setIsConnected(status.connected);
    setIsConnecting(status.connecting);

    // Cleanup listeners on unmount
    return () => {
      webSocketService.off('notification', handleNotification);
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('connection_error', handleConnectionError);
    };
  }, [convertNotification, addNotification]);

  // Load persisted notifications on startup and when WebSocket connects
  useEffect(() => {
    // Add a small delay to ensure auth context is ready
    const loadNotifications = async () => {
      // Wait a bit for auth to be available
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Load persisted notifications on component mount
      await loadPersistedNotifications()
      
      // Test backend connectivity
      const connected = await notificationsApi.testConnection()
      setIsBackendConnected(connected)
      if (connected) {
        console.log('✅ Backend notifications API is available')
      } else {
        console.warn('⚠️ Backend notifications API is not available')
      }
    }
    
    loadNotifications()
  }, [loadPersistedNotifications]);

  // Reload notifications when WebSocket connection is established
  useEffect(() => {
    if (isConnected && !isConnecting) {
      console.log('🔄 WebSocket connected - reloading persisted notifications...')
      loadPersistedNotifications()
    }
  }, [isConnected, isConnecting, loadPersistedNotifications]);

  // Load notifications when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('🔐 User authenticated - loading persisted notifications...')
      loadPersistedNotifications()
    }
  }, [isAuthenticated, token, loadPersistedNotifications]);

  const value: RealTimeNotificationsContextType = {
    notifications,
    unreadCount,
    isConnected,
    isConnecting,
    isBackendConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    connectWebSocket,
    disconnectWebSocket,
    loadPersistedNotifications
  };

  return (
    <RealTimeNotificationsContext.Provider value={value}>
      {children}
    </RealTimeNotificationsContext.Provider>
  );
}

export function useRealTimeNotifications() {
  const context = useContext(RealTimeNotificationsContext);
  if (context === undefined) {
    throw new Error('useRealTimeNotifications must be used within a RealTimeNotificationsProvider');
  }
  return context;
}