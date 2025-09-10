'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealTimeNotifications } from '@/contexts/real-time-notifications';
import { useAuth } from '@/contexts/auth-context';
import { Bell, Wifi, WifiOff, RefreshCw, TestTube } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationsDebug() {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    isConnecting,
    isBackendConnected,
    loadPersistedNotifications,
    connectWebSocket,
    disconnectWebSocket
  } = useRealTimeNotifications();
  
  const { isAuthenticated, token, inspector } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshNotifications = async () => {
    setIsRefreshing(true);
    try {
      await loadPersistedNotifications();
      toast.success('Notifications refreshed!');
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      toast.error('Failed to refresh notifications');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnect = async () => {
    if (token) {
      try {
        await connectWebSocket(token);
        toast.success('WebSocket connected!');
      } catch (error) {
        console.error('Failed to connect:', error);
        toast.error('Failed to connect WebSocket');
      }
    } else {
      toast.error('No authentication token available');
    }
  };

  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/v1/notifications/test/broadcast?title=Test%20Debug&message=Testing%20from%20debug%20panel&priority=medium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success('Test notification sent!');
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications Debug Panel
          </CardTitle>
          <CardDescription>
            Debug notification system status and functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Authentication</div>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "Authenticated" : "Not Authenticated"}
              </Badge>
              {inspector && (
                <div className="text-xs text-muted-foreground">
                  User: {inspector.name || inspector.username || 'Unknown'}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">WebSocket</div>
              <Badge variant={isConnected ? "default" : "outline"}>
                {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Backend API</div>
              <Badge variant={isBackendConnected ? "default" : "outline"}>
                {isBackendConnected ? "Available" : "Unavailable"}
              </Badge>
            </div>
          </div>

          {/* Notification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Total Notifications</div>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Unread Count</div>
              <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleRefreshNotifications}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Notifications
                </>
              )}
            </Button>

            <Button
              onClick={isConnected ? disconnectWebSocket : handleConnect}
              variant={isConnected ? "destructive" : "default"}
              size="sm"
              disabled={isConnecting || !isAuthenticated}
            >
              {isConnecting ? (
                <>
                  <Wifi className="h-4 w-4 mr-2 animate-pulse" />
                  Connecting...
                </>
              ) : isConnected ? (
                <>
                  <WifiOff className="h-4 w-4 mr-2" />
                  Disconnect
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Connect WebSocket
                </>
              )}
            </Button>

            <Button
              onClick={handleTestNotification}
              variant="outline"
              size="sm"
              disabled={!isAuthenticated || !isBackendConnected}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
          </div>

          {/* Debug Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Token: {token ? "✓ Available" : "✗ Missing"}</div>
            <div>LocalStorage access_token: {typeof window !== 'undefined' && localStorage.getItem('access_token') ? "✓" : "✗"}</div>
            <div>LocalStorage auth_token: {typeof window !== 'undefined' && localStorage.getItem('auth_token') ? "✓" : "✗"}</div>
          </div>

          {/* Recent Notifications */}
          {notifications.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Recent Notifications</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {notifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification.id}
                    className="text-xs p-2 bg-muted rounded border-l-2 border-l-primary"
                  >
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-muted-foreground">{notification.message}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={notification.read ? "outline" : "default"} className="text-xs">
                        {notification.read ? "Read" : "Unread"}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}