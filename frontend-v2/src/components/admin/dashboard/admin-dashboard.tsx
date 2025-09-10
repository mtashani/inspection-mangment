'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { StatsCards, DetailedStats } from './stats-cards';
import { QuickActions, WorkflowActions } from './quick-actions';
import { AttendanceOverview } from './attendance-overview';
import { useAdminDashboard, useRealTimeUpdates } from '@/hooks/admin/use-admin-dashboard';
import { Inspector } from '@/types/admin';
import { useRouter } from 'next/navigation';
import { getCurrentJalaliDate, jalaliToGregorian } from '@/lib/utils/jalali';


export function AdminDashboard() {
  const router = useRouter();
  
  // Use Jalali calendar for attendance overview
  const currentJalali = getCurrentJalaliDate();
  const [currentJalaliMonth, setCurrentJalaliMonth] = React.useState(currentJalali.jm);
  const [currentJalaliYear, setCurrentJalaliYear] = React.useState(currentJalali.jy);
  
  const { 
    stats, 
    inspectors, 
    attendanceData, 
    todayAttendanceData,  // Added: Today's attendance data
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useAdminDashboard({
    jalaliMonth: currentJalaliMonth,  // Changed: Use Jalali month
    jalaliYear: currentJalaliYear,   // Changed: Use Jalali year
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const { invalidateAll } = useRealTimeUpdates();

  const handleMonthChange = (jalaliMonth: number, jalaliYear: number) => {
    setCurrentJalaliMonth(jalaliMonth);
    setCurrentJalaliYear(jalaliYear);
  };

  const handleInspectorClick = (inspector: Inspector) => {
    router.push(`/admin/inspectors/${inspector.id}`);
  };

  // Calculate today's present count from today's attendance data
  const todayPresentCount = React.useMemo(() => {
    if (!todayAttendanceData) return 0;
    
    const todayJalali = getCurrentJalaliDate();
    const todayGregorian = jalaliToGregorian(todayJalali.jy, todayJalali.jm, todayJalali.jd);
    const todayDateString = todayGregorian.toISOString().split('T')[0];
    
    return todayAttendanceData.filter(
      record => record.date === todayDateString && 
      ['WORKING', 'OVERTIME'].includes(record.status)
    ).length;
  }, [todayAttendanceData]);

  const handleRefresh = async () => {
    try {
      await refetch();
      invalidateAll();
      console.log('Dashboard data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome to the administrative control panel for the inspection management system.
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-foreground">
                Failed to load dashboard data
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to the administrative control panel for the inspection management system.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <StatsCards stats={stats} loading={isLoading} />

      {/* Detailed Statistics */}
      <DetailedStats stats={stats} loading={isLoading} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Workflow Shortcuts */}
      <WorkflowActions />

      {/* Attendance Overview */}
      <AttendanceOverview
        inspectors={inspectors}
        attendanceData={attendanceData}
        currentJalaliMonth={currentJalaliMonth}
        currentJalaliYear={currentJalaliYear}
        loading={isLoading}
        onMonthChange={handleMonthChange}
        onInspectorClick={handleInspectorClick}
        todayPresentCount={todayPresentCount}  // Added: Today's present count
      />
    </div>
  );
}