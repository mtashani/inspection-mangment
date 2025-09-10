'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Minus,
  Circle
} from 'lucide-react';
import { AttendanceStatus, Inspector, AttendanceRecord } from '@/types/admin';
import type { AttendanceStatus as AttendanceStatusType } from '@/types/admin';
import { cn } from '@/lib/utils';
import {
  getCurrentJalaliDate,
  getJalaliMonthName,
  getDaysInJalaliMonth,
  getPreviousJalaliMonth,
  getNextJalaliMonth,
  isJalaliDateToday,
  jalaliToGregorian
} from '@/lib/utils/jalali';

interface AttendanceOverviewProps {
  inspectors?: Inspector[];
  attendanceData?: AttendanceRecord[];
  currentJalaliMonth?: number;  // Changed: Use Jalali month
  currentJalaliYear?: number;   // Changed: Use Jalali year
  loading?: boolean;
  onMonthChange?: (jalaliMonth: number, jalaliYear: number) => void;  // Changed: Jalali parameters
  onInspectorClick?: (inspector: Inspector) => void;
  className?: string;
  todayPresentCount?: number;  // Added: Today's attendance count (independent of month)
}

interface AttendanceGridProps {
  inspectors: Inspector[];
  attendanceData: AttendanceRecord[];
  jalaliMonth: number;  // Changed: Use Jalali month
  jalaliYear: number;   // Changed: Use Jalali year
  onInspectorClick?: (inspector: Inspector) => void;
}

interface AttendanceStatusIndicatorProps {
  status: AttendanceStatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const AttendanceStatusIndicator: React.FC<AttendanceStatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false
}) => {
  const statusConfig = {
    WORKING: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900',
      label: 'Working'
    },
    RESTING: {
      icon: Minus,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900',
      label: 'Resting'
    },
    OVERTIME: {
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900',
      label: 'Overtime'
    },
    ABSENT: {
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900',
      label: 'Absent'
    },
    SICK_LEAVE: {
      icon: AlertCircle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900',
      label: 'Sick Leave'
    },
    VACATION: {
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900',
      label: 'Vacation'
    }
  };

  const config = statusConfig[status];
  
  // Defensive programming: fallback if status not found in config
  if (!config) {
    console.warn(`AttendanceStatusIndicator: Unknown status "${status}", falling back to default`);
    const DefaultIcon = Circle; // Default fallback icon
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };
    return (
      <div className={cn('rounded-full p-1 bg-gray-100 dark:bg-gray-800')} title={`Unknown Status: ${status}`}>
        <DefaultIcon className={cn(sizeClasses[size] || 'h-4 w-4', 'text-gray-500')} />
      </div>
    );
  }
  
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (showLabel) {
    return (
      <div className="flex items-center space-x-2">
        <div className={cn('rounded-full p-1', config.bg)}>
          <Icon className={cn(sizeClasses[size], config.color)} />
        </div>
        <span className="text-sm text-muted-foreground">{config.label}</span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-full p-1', config.bg)} title={config.label}>
      <Icon className={cn(sizeClasses[size], config.color)} />
    </div>
  );
};

const AttendanceGrid: React.FC<AttendanceGridProps> = ({
  inspectors,
  attendanceData,
  jalaliMonth,
  jalaliYear,
  onInspectorClick
}) => {
  const daysInMonth = getDaysInJalaliMonth(jalaliYear, jalaliMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Create attendance map for quick lookup
  const attendanceMap = React.useMemo(() => {
    const map: Record<string, AttendanceRecord> = {};
    attendanceData.forEach(record => {
      const key = `${record.inspectorId}-${record.date}`;
      map[key] = record;
    });
    return map;
  }, [attendanceData]);

  const getAttendanceStatus = (inspectorId: number, day: number): AttendanceStatusType | null => {
    // Convert Jalali date to Gregorian for comparison with attendance data
    const gregorianDate = jalaliToGregorian(jalaliYear, jalaliMonth, day);
    const dateString = gregorianDate.toISOString().split('T')[0];
    const key = `${inspectorId}-${dateString}`;
    return attendanceMap[key]?.status || null;
  };

  const getStatusSummary = (inspectorId: number) => {
    const summary = {
      working: 0,
      resting: 0,
      overtime: 0,
      absent: 0,
      sickLeave: 0,
      vacation: 0,
      totalWorkDays: 0  // Added: Track total work days
    };

    days.forEach(day => {
      const status = getAttendanceStatus(inspectorId, day);
      if (status) {
        switch (status) {
          case 'WORKING':
            summary.working++;
            summary.totalWorkDays++;  // Count as work day
            break;
          case 'RESTING':
            summary.resting++;
            break;
          case 'OVERTIME':
            summary.overtime++;
            summary.totalWorkDays++;  // Count as work day
            break;
          case 'ABSENT':
            summary.absent++;
            break;
          case 'SICK_LEAVE':
            summary.sickLeave++;
            break;
          case 'VACATION':
            summary.vacation++;
            break;
        }
      }
    });

    return summary;
  };

  // Calculate daily work totals across all inspectors
  const getDailyWorkTotals = () => {
    const dailyTotals: number[] = [];
    
    days.forEach(day => {
      let dayTotal = 0;
      inspectors.forEach(inspector => {
        const status = getAttendanceStatus(inspector.id, day);
        if (status === 'WORKING' || status === 'OVERTIME') {
          dayTotal++;
        }
      });
      dailyTotals.push(dayTotal);
    });
    
    return dailyTotals;
  };

  const dailyTotals = getDailyWorkTotals();

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <span className="text-sm font-medium text-muted-foreground">Legend:</span>
        {Object.values(AttendanceStatus).map(status => (
          <AttendanceStatusIndicator
            key={status}
            status={status}
            size="sm"
            showLabel
          />
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header with days */}
          <div className="grid grid-cols-[200px_repeat(31,_minmax(24px,_1fr))] gap-1 mb-2">
            <div className="font-medium text-sm text-muted-foreground p-2">
              Inspector
            </div>
            {days.map(day => (
              <div
                key={day}
                className="text-xs text-center text-muted-foreground p-1 font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Inspector rows */}
          <div className="space-y-1">
            {inspectors.map(inspector => {
              const summary = getStatusSummary(inspector.id);

              return (
                <div
                  key={inspector.id}
                  className="grid grid-cols-[200px_repeat(31,_minmax(24px,_1fr))] gap-1 items-center hover:bg-muted/50 rounded-lg p-1 transition-colors"
                >
                  {/* Inspector info */}
                  <div 
                    className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-muted rounded"
                    onClick={() => onInspectorClick?.(inspector)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {inspector.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {inspector.employeeId}
                      </div>
                    </div>
                    {/* Changed: Show work days count instead of percentage */}
                    <Badge 
                      variant={summary.totalWorkDays >= 20 ? 'default' : summary.totalWorkDays >= 15 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {summary.totalWorkDays} روز
                    </Badge>
                  </div>

                  {/* Daily status indicators */}
                  {days.map(day => {
                    const status = getAttendanceStatus(inspector.id, day);
                    const isToday = isJalaliDateToday(jalaliYear, jalaliMonth, day);
                    
                    return (
                      <div key={day} className="flex justify-center p-1">
                        <div className={cn(
                          "relative",
                          isToday && "ring-2 ring-primary ring-offset-1 rounded-full"
                        )}>
                          {status ? (
                            <AttendanceStatusIndicator status={status} size="sm" />
                          ) : (
                            <div className="h-3 w-3 rounded-full bg-muted" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            
            {/* Total row */}
            <div className="grid grid-cols-[200px_repeat(31,_minmax(24px,_1fr))] gap-1 items-center border-t pt-2 mt-2 bg-muted/30 rounded-lg p-1">
              <div className="p-2">
                <div className="text-sm font-semibold text-primary">
                  جمع کل
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Work Days
                </div>
              </div>
              
              {/* Daily totals */}
              {dailyTotals.map((total, index) => (
                <div key={index} className="flex justify-center p-1">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold",
                    total > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {total || '0'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AttendanceOverviewSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-12 w-48" />
                <div className="flex space-x-1">
                  {Array.from({ length: 31 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-6 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({
  inspectors = [],
  attendanceData = [],
  currentJalaliMonth,  // Changed: Use Jalali month
  currentJalaliYear,   // Changed: Use Jalali year
  loading = false,
  onMonthChange,
  onInspectorClick,
  className,
  todayPresentCount  // Added: Today's attendance count
}) => {
  // Use current Jalali date as default
  const currentJalali = getCurrentJalaliDate();
  const jalaliMonth = currentJalaliMonth ?? currentJalali.jm;
  const jalaliYear = currentJalaliYear ?? currentJalali.jy;

  const handlePreviousMonth = () => {
    const { year, month } = getPreviousJalaliMonth(jalaliYear, jalaliMonth);
    onMonthChange?.(month, year);
  };

  const handleNextMonth = () => {
    const { year, month } = getNextJalaliMonth(jalaliYear, jalaliMonth);
    onMonthChange?.(month, year);
  };

  if (loading) {
    return <AttendanceOverviewSkeleton />;
  }

  // Calculate summary statistics
  const totalInspectors = inspectors.length;
  const activeInspectors = inspectors.filter(i => i.active).length;
  
  // Fixed: Use separate today's count or fallback to calculation from current data
  const presentToday = todayPresentCount ?? (() => {
    // Fallback: Calculate from current data only if viewing current month
    const todayJalali = getCurrentJalaliDate();
    if (jalaliMonth === todayJalali.jm && jalaliYear === todayJalali.jy) {
      const todayGregorian = jalaliToGregorian(todayJalali.jy, todayJalali.jm, todayJalali.jd);
      const todayDateString = todayGregorian.toISOString().split('T')[0];
      return attendanceData.filter(
        record => record.date === todayDateString && 
        ['WORKING', 'OVERTIME'].includes(record.status)
      ).length;
    }
    return 0; // If viewing different month, can't calculate from current data
  })();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Attendance Overview</CardTitle>
            <Badge variant="secondary">
              {presentToday}/{activeInspectors} Present Today
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {getJalaliMonthName(jalaliMonth)} {jalaliYear}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {inspectors.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Inspectors Found
            </h3>
            <p className="text-sm text-muted-foreground">
              Add inspectors to start tracking attendance.
            </p>
          </div>
        ) : (
          <AttendanceGrid
            inspectors={inspectors}
            attendanceData={attendanceData}
            jalaliMonth={jalaliMonth}
            jalaliYear={jalaliYear}
            onInspectorClick={onInspectorClick}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceOverview;