'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRealTimeNotifications } from '@/contexts/real-time-notifications';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';

interface WebSocketConnectionOptions {
  autoConnect?: boolean;
  showConnectionStatus?: boolean;
}

export function useWebSocketConnection(options: WebSocketConnectionOptions = {}) {
  const { autoConnect = true, showConnectionStatus = false } = options;
  const { isConnected, isConnecting, connectWebSocket, disconnectWebSocket } = useRealTimeNotifications();
  const [hasShownDisconnectToast, setHasShownDisconnectToast] = useState(false);

  // Get auth token from the real authentication service
  const getAuthToken = useCallback(() => {
    // Use the real authentication service to get the current token
    const token = authService.getToken();
    
    if (!token) {
      console.warn('🔑 No authentication token available. User may need to login.');
      return null;
    }
    
    return token;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      console.warn('⚠️ No auth token available for WebSocket connection. User needs to login.');
      
      if (showConnectionStatus) {
        toast.warning('🔑 Please login to enable real-time notifications', {
          duration: 3000,
        });
      }
      return;
    }

    try {
      await connectWebSocket(token);
      setHasShownDisconnectToast(false);
      
      if (showConnectionStatus) {
        toast.success('🔗 Real-time notifications connected', {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Failed to connect to real-time notifications:', error);
      
      if (showConnectionStatus) {
        toast.error('❌ Failed to connect to real-time notifications', {
          duration: 3000,
        });
      }
    }
  }, [connectWebSocket, getAuthToken, showConnectionStatus]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    disconnectWebSocket();
    
    if (showConnectionStatus && !hasShownDisconnectToast) {
      toast.info('🔌 Real-time notifications disconnected', {
        duration: 2000,
      });
      setHasShownDisconnectToast(true);
    }
  }, [disconnectWebSocket, showConnectionStatus, hasShownDisconnectToast]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && !isConnected && !isConnecting) {
      // Add a small delay to ensure the component is mounted
      const timer = setTimeout(() => {
        connect();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoConnect, isConnected, isConnecting, connect]);

  // Handle visibility change to reconnect when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && !isConnecting) {
        console.log('Tab became visible, attempting to reconnect...');
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, isConnecting, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [disconnect, isConnected]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    // Helper methods
    getConnectionStatus: () => ({
      connected: isConnected,
      connecting: isConnecting,
      status: isConnecting ? 'connecting' : isConnected ? 'connected' : 'disconnected'
    })
  };
}