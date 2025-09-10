'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Bell, Clock, BellOff, Monitor, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function NotificationSettings() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Settings states
  const [notificationSettings, setNotificationSettings] = useState({
    // Types of notifications
    calibrationDue: true,
    calibrationOverdue: true,
    rbiChange: true,
    psvUpdate: true,
    systemAlert: true,
    taskComplete: true,
    
    // Channel settings
    webNotifications: true,
    emailNotifications: false,
    pushNotifications: false,
    
    // Timing preferences
    calibrationReminder: '30days', // 7days, 14days, 30days, 90days
    dailySummary: true,
    summaryTime: '09:00',
    
    // Sound settings
    soundEnabled: true,
    soundVolume: 'medium', // low, medium, high
  });

  // Handle toggle changes
  const handleToggleChange = (field: string) => {
    setNotificationSettings({
      ...notificationSettings,
      [field]: !notificationSettings[field as keyof typeof notificationSettings],
    });
  };

  // Handle select changes
  const handleSelectChange = (field: string, value: string) => {
    setNotificationSettings({
      ...notificationSettings,
      [field]: value,
    });
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast({
            title: 'Notification Permission Granted',
            description: 'You will now receive browser notifications.',
            duration: 3000,
          });
        } else {
          toast({
            title: 'Notification Permission Denied',
            description: 'Please enable notifications in your browser settings to receive alerts.',
            variant: 'destructive',
            duration: 5000,
          });
        }
      } catch (err) {
        console.error('Error requesting notification permission:', err);
      }
    } else {
      toast({
        title: 'Notifications Not Supported',
        description: 'Your browser does not support notifications.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    setLoading(true);
    
    try {
      // Here we would typically send settings to an API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If notifications are enabled, request permission
      if (notificationSettings.webNotifications) {
        await requestNotificationPermission();
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Your notification preferences have been updated.',
        duration: 3000,
      });
    } catch {
      // Removed unused 'err' variable
      toast({
        title: 'Error Saving Settings',
        description: 'An error occurred while saving your preferences.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        
        <div className="flex items-center space-x-2">
          <Link href="/notifications" passHref>
            <Button variant="outline">Back to Notifications</Button>
          </Link>
          
          <Button 
            onClick={handleSaveSettings} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Notification Types */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Notification Types</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="calibration-due" className="font-medium">Calibration Due</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications for upcoming PSV calibrations
                </p>
              </div>
              <Switch 
                id="calibration-due" 
                checked={notificationSettings.calibrationDue} 
                onCheckedChange={() => handleToggleChange('calibrationDue')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="calibration-overdue" className="font-medium">Calibration Overdue</Label>
                <p className="text-sm text-muted-foreground">
                  Alerts for overdue PSV calibrations
                </p>
              </div>
              <Switch 
                id="calibration-overdue" 
                checked={notificationSettings.calibrationOverdue} 
                onCheckedChange={() => handleToggleChange('calibrationOverdue')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="rbi-change" className="font-medium">RBI Changes</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications when RBI calculations change
                </p>
              </div>
              <Switch 
                id="rbi-change" 
                checked={notificationSettings.rbiChange} 
                onCheckedChange={() => handleToggleChange('rbiChange')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="psv-update" className="font-medium">PSV Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications for PSV data changes
                </p>
              </div>
              <Switch 
                id="psv-update" 
                checked={notificationSettings.psvUpdate} 
                onCheckedChange={() => handleToggleChange('psvUpdate')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-alert" className="font-medium">System Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Critical system notifications
                </p>
              </div>
              <Switch 
                id="system-alert" 
                checked={notificationSettings.systemAlert} 
                onCheckedChange={() => handleToggleChange('systemAlert')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="task-complete" className="font-medium">Task Completions</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications when tasks are completed
                </p>
              </div>
              <Switch 
                id="task-complete" 
                checked={notificationSettings.taskComplete} 
                onCheckedChange={() => handleToggleChange('taskComplete')}
              />
            </div>
          </div>
        </Card>
        
        {/* Notification Channels */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Notification Channels</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="web-notifications" className="font-medium">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show popup notifications in your browser
                </p>
              </div>
              <Switch 
                id="web-notifications" 
                checked={notificationSettings.webNotifications} 
                onCheckedChange={() => handleToggleChange('webNotifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications to your email
                </p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={notificationSettings.emailNotifications} 
                onCheckedChange={() => handleToggleChange('emailNotifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">Mobile Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications on your mobile device
                </p>
              </div>
              <Switch 
                id="push-notifications" 
                checked={notificationSettings.pushNotifications} 
                onCheckedChange={() => handleToggleChange('pushNotifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound-enabled" className="font-medium">Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound when notifications arrive
                </p>
              </div>
              <Switch 
                id="sound-enabled" 
                checked={notificationSettings.soundEnabled} 
                onCheckedChange={() => handleToggleChange('soundEnabled')}
              />
            </div>
            
            {notificationSettings.soundEnabled && (
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-volume" className="font-medium">Sound Volume</Label>
                <Select 
                  value={notificationSettings.soundVolume} 
                  onValueChange={(value) => handleSelectChange('soundVolume', value)}
                >
                  <SelectTrigger id="sound-volume" className="w-[120px]">
                    <SelectValue placeholder="Select volume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={requestNotificationPermission}
              >
                Test Notification
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Timing Preferences */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Timing Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="calibration-reminder" className="font-medium">Calibration Reminders</Label>
              <p className="text-sm text-muted-foreground mb-2">
                When to send calibration due reminders
              </p>
              <Select 
                value={notificationSettings.calibrationReminder} 
                onValueChange={(value) => handleSelectChange('calibrationReminder', value)}
              >
                <SelectTrigger id="calibration-reminder" className="w-full">
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 days before due</SelectItem>
                  <SelectItem value="14days">14 days before due</SelectItem>
                  <SelectItem value="30days">30 days before due</SelectItem>
                  <SelectItem value="90days">90 days before due</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <div>
                <Label htmlFor="daily-summary" className="font-medium">Daily Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a daily summary of notifications
                </p>
              </div>
              <Switch 
                id="daily-summary" 
                checked={notificationSettings.dailySummary} 
                onCheckedChange={() => handleToggleChange('dailySummary')}
              />
            </div>
            
            {notificationSettings.dailySummary && (
              <div className="flex items-center justify-between">
                <Label htmlFor="summary-time" className="font-medium">Summary Time</Label>
                <Select 
                  value={notificationSettings.summaryTime} 
                  onValueChange={(value) => handleSelectChange('summaryTime', value)}
                >
                  <SelectTrigger id="summary-time" className="w-[120px]">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="17:00">5:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Do Not Disturb</h3>
                  <p className="text-sm text-muted-foreground">
                    Mute all notifications
                  </p>
                </div>
                <Tabs defaultValue="off" className="w-[160px]">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="off">Off</TabsTrigger>
                    <TabsTrigger value="on">On</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 text-amber-600 border-amber-200"
              >
                <BellOff className="h-4 w-4" />
                <span>Reset to Default</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}