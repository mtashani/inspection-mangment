'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useRealTimeNotifications } from '@/contexts/real-time-notifications';
import { useWebSocketConnection } from '@/hooks/use-websocket-connection';
import { Bell, Wifi, WifiOff, Send, TestTube } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationTestPage() {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    isConnecting,
    addNotification
  } = useRealTimeNotifications();
  
  const { connect, disconnect, getConnectionStatus } = useWebSocketConnection({
    autoConnect: false,
    showConnectionStatus: true
  });

  const [testNotification, setTestNotification] = useState({
    title: 'نوتیفیکیشن تست',
    message: 'این یک نوتیفیکیشن تست است',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical'
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSendTestNotification = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testNotification),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Test notification sent successfully!');
      } else {
        toast.error(`Failed to send notification: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocalNotification = () => {
    const notification = {
      id: Date.now().toString(),
      title: testNotification.title,
      message: testNotification.message,
      type: testNotification.type,
      priority: testNotification.priority,
      timestamp: new Date(),
      read: false,
      actionUrl: '/dashboard'
    };

    addNotification(notification);
    toast.success('Local notification added!');
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Real-Time Notifications Test</h1>
        <p className="text-muted-foreground">
          Test the real-time notification system and WebSocket connection
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            WebSocket Connection
          </CardTitle>
          <CardDescription>
            Status and controls for the real-time notification connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {connectionStatus.status.toUpperCase()}
            </Badge>
            
            <div className="flex gap-2">
              <Button 
                onClick={connect} 
                disabled={isConnected || isConnecting}
                size="sm"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
              
              <Button 
                onClick={disconnect} 
                disabled={!isConnected}
                variant="outline"
                size="sm"
              >
                Disconnect
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Total Notifications</Label>
              <div className="text-lg font-semibold">{notifications.length}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Unread Count</Label>
              <div className="text-lg font-semibold text-red-600">{unreadCount}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Connection Status</Label>
              <div className={`text-lg font-semibold ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {connectionStatus.status}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Notifications
          </CardTitle>
          <CardDescription>
            Send test notifications to verify the system is working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={testNotification.title}
                onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={testNotification.type} 
                onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => 
                  setTestNotification(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Info</SelectItem>
                  <SelectItem value="success">✅ Success</SelectItem>
                  <SelectItem value="warning">⚠️ Warning</SelectItem>
                  <SelectItem value="error">❌ Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={testNotification.priority} 
                onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                  setTestNotification(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🔵 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={testNotification.message}
              onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Notification message"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSendTestNotification} 
              disabled={isLoading || !isConnected}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Real-Time Notification'}
            </Button>

            <Button 
              onClick={handleAddLocalNotification} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Add Local Notification
            </Button>
          </div>

          {!isConnected && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              ⚠️ WebSocket is not connected. Real-time notifications won&apos;t work until connected.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
          <CardDescription>
            Latest notifications received in this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications yet. Send a test notification to see them here.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id} 
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {notification.type === 'success' && <Badge variant="default" className="bg-green-100 text-green-800">✅</Badge>}
                    {notification.type === 'warning' && <Badge variant="default" className="bg-yellow-100 text-yellow-800">⚠️</Badge>}
                    {notification.type === 'error' && <Badge variant="destructive">❌</Badge>}
                    {notification.type === 'info' && <Badge variant="secondary">ℹ️</Badge>}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.priority}
                        </Badge>
                        {!notification.read && (
                          <Badge variant="destructive" className="text-xs">New</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <div className="text-xs text-muted-foreground mt-2">
                      {notification.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}