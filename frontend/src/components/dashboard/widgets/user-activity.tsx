'use client'

import { useMemo } from 'react'
import {
  UserIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DashboardWidget, useWidgetData } from '../dashboard-widget'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export interface UserActivityData {
  userId: string
  userName: string
  userRole: 'inspector' | 'admin' | 'analyst' | 'manager'
  avatar?: string
  lastActive: string
  status: 'online' | 'offline' | 'away'
  sessionsToday: number
  totalTime: number // in minutes
  actions: {
    inspections: number
    reports: number
    maintenance: number
    views: number
  }
  recentActivity: {
    id: string
    type: 'login' | 'logout' | 'inspection' | 'report' | 'maintenance' | 'view'
    description: string
    timestamp: string
    equipmentId?: string
    equipmentName?: string
  }[]
}

export interface UserActivityProps {
  title: string
  config: {
    timeRange?: '1h' | '24h' | '7d' | '30d'
    showActiveUsers?: boolean
    showRecentActivity?: boolean
    showUserStats?: boolean
    limit?: number
    chartType?: 'bar' | 'pie'
  }
  onConfigChange?: (config: Record<string, any>) => void
  onRemove?: () => void
}

// Mock user activity data
const MOCK_USER_ACTIVITY: UserActivityData[] = [
  {
    userId: 'user-001',
    userName: 'John Smith',
    userRole: 'inspector',
    avatar: '/avatars/john.jpg',
    lastActive: '2024-02-10T15:30:00Z',
    status: 'online',
    sessionsToday: 3,
    totalTime: 420, // 7 hours
    actions: {
      inspections: 8,
      reports: 3,
      maintenance: 2,
      views: 45
    },
    recentActivity: [
      {
        id: 'act-001',
        type: 'inspection',
        description: 'Completed safety inspection for Pressure Vessel A1',
        timestamp: '2024-02-10T15:25:00Z',
        equipmentId: 'eq-001',
        equipmentName: 'Pressure Vessel A1'
      },
      {
        id: 'act-002',
        type: 'report',
        description: 'Created monthly inspection report',
        timestamp: '2024-02-10T14:45:00Z'
      }
    ]
  },
  {
    userId: 'user-002',
    userName: 'Jane Doe',
    userRole: 'admin',
    avatar: '/avatars/jane.jpg',
    lastActive: '2024-02-10T15:15:00Z',
    status: 'online',
    sessionsToday: 2,
    totalTime: 380, // 6.3 hours
    actions: {
      inspections: 2,
      reports: 12,
      maintenance: 5,
      views: 78
    },
    recentActivity: [
      {
        id: 'act-003',
        type: 'maintenance',
        description: 'Scheduled maintenance for Heat Exchanger B2',
        timestamp: '2024-02-10T15:10:00Z',
        equipmentId: 'eq-002',
        equipmentName: 'Heat Exchanger B2'
      },
      {
        id: 'act-004',
        type: 'view',
        description: 'Reviewed RBI analysis results',
        timestamp: '2024-02-10T14:30:00Z'
      }
    ]
  },
  {
    userId: 'user-003',
    userName: 'Mike Johnson',
    userRole: 'analyst',
    avatar: '/avatars/mike.jpg',
    lastActive: '2024-02-10T12:45:00Z',
    status: 'away',
    sessionsToday: 1,
    totalTime: 240, // 4 hours
    actions: {
      inspections: 1,
      reports: 8,
      maintenance: 0,
      views: 32
    },
    recentActivity: [
      {
        id: 'act-005',
        type: 'report',
        description: 'Generated RBI analysis report',
        timestamp: '2024-02-10T12:30:00Z'
      },
      {
        id: 'act-006',
        type: 'logout',
        description: 'Logged out',
        timestamp: '2024-02-10T12:45:00Z'
      }
    ]
  },
  {
    userId: 'user-004',
    userName: 'Sarah Wilson',
    userRole: 'manager',
    avatar: '/avatars/sarah.jpg',
    lastActive: '2024-02-10T11:20:00Z',
    status: 'offline',
    sessionsToday: 1,
    totalTime: 180, // 3 hours
    actions: {
      inspections: 0,
      reports: 5,
      maintenance: 1,
      views: 25
    },
    recentActivity: [
      {
        id: 'act-007',
        type: 'view',
        description: 'Reviewed monthly dashboard',
        timestamp: '2024-02-10T11:15:00Z'
      },
      {
        id: 'act-008',
        type: 'logout',
        description: 'Logged out',
        timestamp: '2024-02-10T11:20:00Z'
      }
    ]
  }
]

const STATUS_COLORS = {
  online: '#22c55e',
  offline: '#6b7280',
  away: '#f59e0b'
}

const ROLE_COLORS = {
  inspector: '#3b82f6',
  admin: '#ef4444',
  analyst: '#8b5cf6',
  manager: '#f59e0b'
}

const ACTIVITY_ICONS = {
  login: ArrowRightOnRectangleIcon,
  logout: ArrowRightOnRectangleIcon,
  inspection: EyeIcon,
  report: DocumentTextIcon,
  maintenance: PencilIcon,
  view: EyeIcon
}

export function UserActivity({
  title,
  config,
  onConfigChange,
  onRemove
}: UserActivityProps) {
  const {
    timeRange = '24h',
    showActiveUsers = true,
    showRecentActivity = true,
    showUserStats = false,
    limit = 10,
    chartType = 'bar'
  } = config

  // Fetch user activity data
  const { data, isLoading, error, lastUpdated, refresh } = useWidgetData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return MOCK_USER_ACTIVITY
    },
    120000 // 2 minutes
  )

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!data) return null

    const total = data.length
    const online = data.filter(u => u.status === 'online').length
    const away = data.filter(u => u.status === 'away').length
    const offline = data.filter(u => u.status === 'offline').length

    const totalSessions = data.reduce((sum, u) => sum + u.sessionsToday, 0)
    const totalTime = data.reduce((sum, u) => sum + u.totalTime, 0)
    const avgSessionTime = totalSessions > 0 ? totalTime / totalSessions : 0

    const totalActions = data.reduce((sum, u) => 
      sum + u.actions.inspections + u.actions.reports + u.actions.maintenance + u.actions.views, 0
    )

    const roleDistribution = data.reduce((acc, user) => {
      acc[user.userRole] = (acc[user.userRole] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      online,
      away,
      offline,
      totalSessions,
      totalTime,
      avgSessionTime,
      totalActions,
      roleDistribution
    }
  }, [data])

  // Get recent activity across all users
  const recentActivity = useMemo(() => {
    if (!data) return []
    
    const allActivity = data.flatMap(user => 
      user.recentActivity.map(activity => ({
        ...activity,
        userName: user.userName,
        userRole: user.userRole,
        userAvatar: user.avatar
      }))
    )
    
    // Sort by timestamp (newest first)
    allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return allActivity.slice(0, limit)
  }, [data, limit])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data) return { activityData: [], roleData: [] }

    const activityData = data.map(user => ({
      name: user.userName,
      inspections: user.actions.inspections,
      reports: user.actions.reports,
      maintenance: user.actions.maintenance,
      views: user.actions.views
    }))

    const roleData = Object.entries(metrics?.roleDistribution || {}).map(([role, count]) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: count,
      color: ROLE_COLORS[role as keyof typeof ROLE_COLORS]
    }))

    return { activityData, roleData }
  }, [data, metrics])

  // Format time
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  // Get user initials
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <DashboardWidget
      title={title}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onConfigChange={onConfigChange}
      onRemove={onRemove}
      headerActions={
        <Badge variant="outline" className="text-xs">
          {data?.length || 0} Users
        </Badge>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <p className="text-lg font-bold text-green-600">{metrics.online}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div>
                    <p className="text-lg font-bold text-yellow-600">{metrics.away}</p>
                    <p className="text-xs text-muted-foreground">Away</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold">{metrics.totalSessions}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-lg font-bold">{formatTime(metrics.avgSessionTime)}</p>
                    <p className="text-xs text-muted-foreground">Avg Session</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Users List */}
        {showActiveUsers && data && (
          <Card className="p-3">
            <CardContent className="p-0">
              <h4 className="text-sm font-medium mb-3">Active Users</h4>
              <div className="space-y-2">
                {data
                  .filter(user => user.status === 'online' || user.status === 'away')
                  .slice(0, 5)
                  .map(user => (
                    <div key={user.userId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.userName} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(user.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div 
                            className={cn(
                              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                              user.status === 'online' && 'bg-green-500',
                              user.status === 'away' && 'bg-yellow-500',
                              user.status === 'offline' && 'bg-gray-500'
                            )}
                          />
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">{user.userName}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: ROLE_COLORS[user.userRole] }}
                            >
                              {user.userRole}
                            </Badge>
                            <span>{formatDate(user.lastActive)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{formatTime(user.totalTime)}</p>
                        <p>{user.sessionsToday} sessions</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Activity Chart */}
        {showUserStats && chartData.activityData.length > 0 && (
          <Card className="p-3">
            <CardContent className="p-0">
              <h4 className="text-sm font-medium mb-2">User Activity</h4>
              <ResponsiveContainer width="100%" height={200}>
                {chartType === 'bar' ? (
                  <BarChart data={chartData.activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="inspections" stackId="a" fill="#3b82f6" name="Inspections" />
                    <Bar dataKey="reports" stackId="a" fill="#22c55e" name="Reports" />
                    <Bar dataKey="maintenance" stackId="a" fill="#f59e0b" name="Maintenance" />
                    <Bar dataKey="views" stackId="a" fill="#8b5cf6" name="Views" />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={chartData.roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {showRecentActivity && recentActivity.length > 0 && (
          <Card className="p-3">
            <CardContent className="p-0">
              <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentActivity.map(activity => {
                  const ActivityIcon = ACTIVITY_ICONS[activity.type] || EyeIcon
                  
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded">
                      <ActivityIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium">{activity.userName}</p>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: ROLE_COLORS[activity.userRole as keyof typeof ROLE_COLORS] }}
                          >
                            {activity.userRole}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-1">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{formatDate(activity.timestamp)}</span>
                          {activity.equipmentName && (
                            <span>• {activity.equipmentName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!data || data.length === 0) && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No user activity found</p>
            <p className="text-sm">Users will appear here when they become active</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

export type { UserActivityProps, UserActivityData }