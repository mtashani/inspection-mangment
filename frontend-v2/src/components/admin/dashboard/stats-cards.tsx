'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  UserCheck, 
  Shield, 
  Construction, 
  Zap, 
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { AdminDashboardStats } from '@/types/admin';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  stats?: AdminDashboardStats;
  loading?: boolean;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  className
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  // Animated counter effect
  React.useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const variantStyles = {
    default: 'border-border',
    primary: 'border-primary/20 bg-primary/5',
    secondary: 'border-secondary/20 bg-secondary/5',
    success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
    warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
    danger: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400'
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', iconStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold tabular-nums">
            {displayValue.toLocaleString()}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center text-xs',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <TrendingUp className={cn(
                'h-3 w-3 mr-1',
                !trend.isPositive && 'rotate-180'
              )} />
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const StatsGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const StatsCards: React.FC<StatsCardsProps> = ({ 
  stats, 
  loading = false, 
  className 
}) => {
  if (loading || !stats) {
    return <StatsGridSkeleton />;
  }

  // Safe access with fallback values
  const attendanceOverview = stats.attendanceOverview || {
    presentToday: 0,
    totalScheduled: 0,
    attendanceRate: 0
  };

  const recentActivity = stats.recentActivity || {
    newInspectors: 0,
    completedInspections: 0,
    pendingReports: 0
  };

  const specialtyCounts = stats.specialtyCounts || {
    psv: 0,
    crane: 0,
    corrosion: 0
  };

  const attendanceRate = attendanceOverview.totalScheduled > 0 
    ? (attendanceOverview.presentToday / attendanceOverview.totalScheduled) * 100 
    : 0;

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6', className)}>
      {/* Total Inspectors */}
      <StatCard
        title="Total Inspectors"
        value={stats.totalInspectors || 0}
        subtitle={`${stats.activeInspectors || 0} Active`}
        icon={Users}
        variant="primary"
        trend={{
          value: recentActivity.newInspectors,
          isPositive: true
        }}
      />

      {/* PSV Inspectors */}
      <StatCard
        title="PSV Inspectors"
        value={specialtyCounts.psv}
        subtitle="Pressure Safety Valve"
        icon={Shield}
        variant="success"
      />

      {/* Crane Inspectors */}
      <StatCard
        title="Crane Inspectors"
        value={specialtyCounts.crane}
        subtitle="Crane Operations"
        icon={Construction}
        variant="warning"
      />

      {/* Corrosion Inspectors */}
      <StatCard
        title="Corrosion Inspectors"
        value={specialtyCounts.corrosion}
        subtitle="Corrosion Analysis"
        icon={Zap}
        variant="danger"
      />

      {/* Attendance Rate */}
      <StatCard
        title="Attendance Today"
        value={Math.round(attendanceRate)}
        subtitle={`${attendanceOverview.presentToday}/${attendanceOverview.totalScheduled} Present`}
        icon={UserCheck}
        variant={attendanceRate >= 90 ? 'success' : attendanceRate >= 75 ? 'warning' : 'danger'}
      />
    </div>
  );
};

// Additional stats row for more detailed metrics
interface DetailedStatsProps {
  stats?: AdminDashboardStats;
  loading?: boolean;
  className?: string;
}

export const DetailedStats: React.FC<DetailedStatsProps> = ({ 
  stats, 
  loading = false, 
  className 
}) => {
  if (loading || !stats) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-6', className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Safe access with fallback values
  const recentActivity = stats.recentActivity || {
    newInspectors: 0,
    completedInspections: 0,
    pendingReports: 0
  };

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-6', className)}>
      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New Inspectors</span>
              <Badge variant="secondary">{recentActivity.newInspectors}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed Inspections</span>
              <Badge variant="secondary">{recentActivity.completedInspections}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending Reports</span>
              <Badge variant={recentActivity.pendingReports > 10 ? 'destructive' : 'secondary'}>
                {recentActivity.pendingReports}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Birthdays */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">
            {stats.upcomingBirthdays || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Birthdays this month
          </p>
          {(stats.upcomingBirthdays || 0) > 0 && (
            <Badge variant="outline" className="mt-2">
              Celebration time! 🎉
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <Badge variant="secondary">{stats.activeInspectors || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">System Status</span>
              <Badge variant="secondary" className="text-green-600">
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Data Sync</span>
              <Badge variant="secondary" className="text-green-600">
                Up to date
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;