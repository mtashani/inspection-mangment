'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  X,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealTimeNotifications } from '@/contexts/real-time-notifications';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export function Notifications() {
  const {
    notifications: realTimeNotifications,
    unreadCount: realTimeUnreadCount,
    isConnected,
    isConnecting,
    isBackendConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    connectWebSocket,
    loadPersistedNotifications
  } = useRealTimeNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use real-time notifications
  const notifications = realTimeNotifications;
  const unreadCount = realTimeUnreadCount;

  // Handle refresh notifications
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

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  // Handle mark as read - only for real-time notifications now
  const handleMarkAsRead = (id: string, preventRedirect = false) => {
    markAsRead(id);
    // Close dropdown after marking as read (unless it's mark all)
    if (!preventRedirect) {
      setIsOpen(false);
    }
  };

  // Handle mark all as read - only for real-time notifications now
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Handle remove notification - only for real-time notifications now
  const handleRemoveNotification = (id: string) => {
    removeNotification(id);
  };

  // Removed auto-mark as read when dropdown opens to fix notification persistence issue
  // Users complained that notifications disappear after page refresh
  // Now notifications only get marked as read when explicitly clicked

  // Connection status indicator with refresh capability
  const getConnectionIcon = () => {
    if (isRefreshing) {
      return <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />;
    } else if (isConnecting) {
      return <Wifi className="h-3 w-3 text-yellow-500 animate-pulse" />;
    } else if (isConnected) {
      return <Wifi className="h-3 w-3 text-green-500" />;
    } else {
      return <WifiOff className="h-3 w-3 text-red-500" />;
    }
  };

  // Get connection status text
  const getConnectionStatusText = () => {
    if (isRefreshing) return 'Refreshing...';
    if (isConnecting) return 'Connecting...';
    if (isConnected && isBackendConnected) return 'Live & Synced';
    if (isConnected) return 'Live';
    if (isBackendConnected) return 'Backend Only';
    return 'Offline';
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-8 w-8 transition-all duration-300 hover:bg-accent"
          title="Notifications"
        >
          <Bell className="h-4 w-4 transition-all duration-300 hover:scale-110" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {/* Connection status indicator */}
          <div className="absolute -bottom-1 -right-1">
            {getConnectionIcon()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Notifications</span>
            {getConnectionIcon()}
            <span className="text-xs text-muted-foreground">
              {getConnectionStatusText()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Refresh button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleRefreshNotifications}
              disabled={isRefreshing}
              title="Refresh notifications"
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-6 px-2 text-xs"
              >
                Mark all read
              </Button>
            )}
            
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <div>
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isConnected ? "You're all caught up!" : "Connect to receive real-time notifications"}
              </p>
            </div>
            {!isConnected && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => connectWebSocket(localStorage.getItem('access_token') || '')}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {/* Sort notifications: unread first, then read (faded) */}
              {[...notifications].sort((a, b) => {
                if (!a.read && b.read) return -1;
                if (a.read && !b.read) return 1;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
              }).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 p-3 hover:bg-accent cursor-pointer transition-all duration-300',
                    !notification.read && 'bg-accent/50 border-l-2 border-l-primary',
                    notification.read && 'opacity-60 bg-muted/30'
                  )}
                  onClick={() => {
                    // Only mark as read if not already read
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                    // No automatic redirection - user requested this behavior
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className={cn(
                      "text-xs mt-1 line-clamp-2 transition-colors duration-300",
                      notification.read ? "text-muted-foreground" : "text-foreground/80"
                    )}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      {!notification.read && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          <span className="text-xs text-primary font-medium">Unread</span>
                        </div>
                      )}
                      {notification.read && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-500">Read</span>
                        </div>
                      )}
                      {/* Action URL hint */}
                      {notification.actionUrl && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = notification.actionUrl!;
                          }}
                          className="text-xs text-blue-500 hover:text-blue-700 underline"
                          title="Go to related page"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total: {notifications.length}</span>
            <span>Unread: {unreadCount}</span>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs",
              isConnected && isBackendConnected ? "bg-green-100 text-green-700" :
              isConnected ? "bg-yellow-100 text-yellow-700" :
              isBackendConnected ? "bg-blue-100 text-blue-700" :
              "bg-red-100 text-red-700"
            )}>
              {getConnectionStatusText()}
            </span>
          </div>
        </div>
        <DropdownMenuItem className="justify-center text-center">
          <span className="text-sm">View all notifications</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}