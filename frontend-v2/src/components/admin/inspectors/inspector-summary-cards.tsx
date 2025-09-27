'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Clock, 
  TrendingUp,
  Activity,
  Settings
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getInspectorStats } from '@/lib/api/admin/inspectors'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  trend?: number
  format?: 'number' | 'percentage'
  className?: string
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  format = 'number',
  className = ''
}: StatCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    if (format === 'percentage') return `${val}%`
    return val.toLocaleString()
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600">+{trend}% from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

export function InspectorSummaryCards() {
  const {
    data: stats,
    isLoading,
    error
  } = useQuery({
    queryKey: ['inspector-statistics'],
    queryFn: getInspectorStats,
    refetchInterval: 60000, // Refetch every minute
  })

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <Settings className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Unable to load statistics</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Please try again later'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Inspectors"
        value={stats.total_inspectors}
        icon={Users}
        description="All registered inspectors"
        className="border-blue-200"
      />
      
      <StatCard
        title="Active Inspectors"
        value={stats.active_inspectors}
        icon={UserCheck}
        description="Currently active inspectors"
        className="border-green-200"
      />
      
      <StatCard
        title="Inactive Inspectors"
        value={stats.inactive_inspectors}
        icon={UserX}
        description="Deactivated inspector accounts"
        className="border-orange-200"
      />
      
      <StatCard
        title="Activity Rate"
        value={stats.activity_rate}
        icon={TrendingUp}
        description="Percentage of active inspectors"
        format="percentage"
        className="border-purple-200"
      />
      
      <StatCard
        title="Login Enabled"
        value={stats.login_enabled}
        icon={Shield}
        description="Inspectors with login access"
        className="border-indigo-200"
      />
      
      <StatCard
        title="Attendance Tracking"
        value={stats.attendance_tracking_enabled}
        icon={Clock}
        description="Inspectors with attendance tracking"
        className="border-teal-200"
      />
      
      <StatCard
        title="With Roles"
        value={stats.inspectors_with_roles}
        icon={Activity}
        description="Inspectors assigned to roles"
        className="border-emerald-200"
      />
      
      <StatCard
        title="Without Roles"
        value={stats.inspectors_without_roles}
        icon={Settings}
        description="Unassigned inspectors"
        className="border-amber-200"
      />
    </div>
  )
}