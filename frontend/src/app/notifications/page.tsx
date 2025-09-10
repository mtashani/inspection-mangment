'use client';

import { useState, useEffect } from 'react';
import { useNotifications, NotificationPriority, NotificationStatus, NotificationType } from '@/contexts/notifications-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Archive, 
  Trash2, 
  Search,
  BellRing
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead,
    dismissNotification, 
    archiveNotification,
    getNotificationsByStatus
  } = useNotifications();
  const router = useRouter();
  
  // Filter and sort states
  const [activeTab, setActiveTab] = useState<NotificationStatus>('unread');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [filteredNotifications, setFilteredNotifications] = useState(notifications);
  
  // Apply filters when notifications or filter values change
  useEffect(() => {
    let filtered = getNotificationsByStatus(activeTab);
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n => n.title.toLowerCase().includes(query) || n.message.toLowerCase().includes(query)
      );
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority === priorityFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }
    
    // Sort notifications by date (newest first)
    filtered = filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setFilteredNotifications(filtered);
  }, [notifications, activeTab, searchQuery, priorityFilter, typeFilter, getNotificationsByStatus]);
  
  // Handle notification click
  const handleNotificationClick = (id: string, actionUrl?: string) => {
    markAsRead(id);
    if (actionUrl) {
      router.push(actionUrl);
    }
  };
  
  // Mark all displayed notifications as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  // Get notification icon based on type and priority
  const getNotificationIcon = (type: NotificationType, priority: NotificationPriority) => {
    if (priority === 'critical') return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (priority === 'high') return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    
    switch (type) {
      case 'calibration_due':
      case 'calibration_overdue':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'task_complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'system_alert':
        return <BellRing className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        
        <div className="flex items-center space-x-2">
          <Link href="/" passHref>
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
      
      {/* Notification tabs and filters */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 mb-6">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as NotificationStatus)}
              className="w-full md:w-auto"
            >
              <TabsList>
                <TabsTrigger value="unread" className="flex items-center gap-2">
                  Unread
                  <Badge variant="secondary" className="ml-1">
                    {getNotificationsByStatus('unread').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="read" className="flex items-center gap-2">
                  Read
                  <Badge variant="secondary" className="ml-1">
                    {getNotificationsByStatus('read').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex items-center gap-2">
                  Archived
                  <Badge variant="secondary" className="ml-1">
                    {getNotificationsByStatus('archived').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={getNotificationsByStatus('unread').length === 0}
              >
                Mark All as Read
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative w-full sm:w-auto flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search notifications..."
                className="w-full pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select 
                value={priorityFilter} 
                onValueChange={value => setPriorityFilter(value as NotificationPriority | 'all')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={typeFilter} 
                onValueChange={value => setTypeFilter(value as NotificationType | 'all')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="calibration_due">Calibration Due</SelectItem>
                  <SelectItem value="calibration_overdue">Calibration Overdue</SelectItem>
                  <SelectItem value="rbi_change">RBI Change</SelectItem>
                  <SelectItem value="psv_update">PSV Update</SelectItem>
                  <SelectItem value="system_alert">System Alert</SelectItem>
                  <SelectItem value="task_complete">Task Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Results information */}
          <div className="text-sm text-gray-500 mb-6">
            Showing {filteredNotifications.length} {activeTab} notifications
            {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
            {priorityFilter !== 'all' && <span> with {priorityFilter} priority</span>}
            {typeFilter !== 'all' && <span> of type {typeFilter.replace('_', ' ')}</span>}
          </div>
          
          {/* Notification list */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex h-10 w-10 rounded-full items-center justify-center bg-gray-100 mb-4">
                <BellRing className="h-5 w-5 text-gray-500" />
              </div>
              <h3 className="font-medium mb-1">No notifications</h3>
              <p className="text-sm text-gray-500">
                {activeTab === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : activeTab === 'read'
                  ? "You have no read notifications."
                  : "You have no archived notifications."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    notification.status === 'unread' ? 'bg-gray-50' : 'bg-white'
                  )}
                >
                  <div className="flex items-start">
                    <div 
                      className={cn(
                        "mr-3 p-2 rounded-full",
                        notification.priority === 'critical' && 'bg-red-100',
                        notification.priority === 'high' && 'bg-orange-100',
                        notification.priority === 'medium' && 'bg-amber-100',
                        notification.priority === 'low' && 'bg-blue-100',
                      )}
                    >
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    
                    <div className="flex-grow cursor-pointer" onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}>
                      <div className="flex items-start justify-between">
                        <h3 className={cn(
                          "font-medium",
                          notification.status === 'unread' && "font-semibold"
                        )}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      
                      {notification.relatedItemId && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.relatedItemType}: {notification.relatedItemId}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center ml-4 space-x-1">
                      {activeTab !== 'archived' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => archiveNotification(notification.id)}
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => dismissNotification(notification.id)}
                        title="Dismiss"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}