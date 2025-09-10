'use client';

import { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useNotifications, Notification } from '@/contexts/notifications-context';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    hasActiveAlerts,
    markAsRead, 
    dismissNotification 
  } = useNotifications();
  const router = useRouter();

  // Get only unread notifications sorted by priority and creation date
  const unreadNotifications = notifications
    .filter(notif => notif.status === 'unread')
    .sort((a, b) => {
      // Sort first by priority (critical -> high -> medium -> low)
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      // If same priority, sort by creation date (newest first)
      if (priorityDiff === 0) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      
      return priorityDiff;
    })
    .slice(0, 5); // Show only the 5 most important notifications

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setOpen(false);
    
    // Navigate to the action URL if provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleDismiss = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    dismissNotification(id);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Notifications"
        >
          {hasActiveAlerts ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] px-[5px] py-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-medium">Notifications</h3>
          <Link href="/notifications" passHref>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setOpen(false)}>
              View All
            </Button>
          </Link>
        </div>
        
        <DropdownMenuSeparator />
        
        {unreadNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No unread notifications
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {unreadNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-0 focus:bg-background cursor-default"
                onSelect={(e) => e.preventDefault()}
              >
                <div 
                  className={cn(
                    "w-full px-4 py-3 hover:bg-muted cursor-pointer border-l-4",
                    notification.priority === 'critical' && 'border-l-red-600',
                    notification.priority === 'high' && 'border-l-orange-500',
                    notification.priority === 'medium' && 'border-l-amber-400',
                    notification.priority === 'low' && 'border-l-blue-400'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full opacity-70 hover:opacity-100"
                      onClick={(e) => handleDismiss(e, notification.id)}
                    >
                      ×
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  
                  <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                    <span className={cn(
                      "uppercase font-medium",
                      notification.priority === 'critical' && 'text-red-600',
                      notification.priority === 'high' && 'text-orange-500',
                      notification.priority === 'medium' && 'text-amber-400',
                      notification.priority === 'low' && 'text-blue-400'
                    )}>
                      {notification.priority}
                    </span>
                  </div>
                </div>
                
                <DropdownMenuSeparator />
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}