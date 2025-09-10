'use client'

import { useMemo } from 'react'
import {
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Cell,
  LineChart,
  Line
} from 'recharts'

export interface MaintenanceEvent {
  id: string
  title: string
  equipmentId: string
  equipmentName: string
  type: 'preventive' | 'corrective' | 'emergency' | 'predictive'
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  scheduledDate: string
  completedDate?: string
  estimatedCost: number
  actualCost?: number
  assignedTeam: string
  location: string
  progress: number
  description: string
}

export interface MaintenanceStatusProps {
  title: string
  config: {
    showScheduled?: boolean
    showOverdue?: boolean
    showCosts?: boolean
    showTrends?: boolean
    timeRange?: '7d' | '30d' | '90d'
    chartType?: 'bar' | 'pie' | 'line'
  }
  onConfigChange?: (config: Record<string, any>) => void
  onRemove?: () => void
}

// Mock data
const MOCK_MAINTENANCE: MaintenanceEvent[] = [
  {
    id: 'maint-001',
    title: 'Pump Seal Replacement',
    equipmentId: 'eq-001',
    equipmentName: 'Pump A1',
    type: 'preventive',
    status: 'scheduled',
    priority: 'medium',
    scheduledDate: '2024-02-20',
    estimatedCost: 1500,
    assignedTeam: 'Team Alpha',
    location: 'Unit 1',
    progress: 0,
    description: 'Replace worn pump seals'
  },
  {
    id: 'maint-002',
    title: 'Emergency Valve Repair',
    equipmentId: 'eq-002',
    equipmentName: 'Safety Valve B2',
    type: 'emergency',
    status: 'in-progress',
    priority: 'critical',
    scheduledDate: '2024-02-10',
    estimatedCost: 3000,
    actualCost: 2800,
    assignedTeam: 'Team Beta',
    location: 'Unit 2',
    progress: 75,
    description: 'Emergency repair of safety valve'
  },
  {
    id: 'maint-003',
    title: 'Heat Exchanger Cleaning',
    equipmentId: 'eq-003',
    equipmentName: 'Heat Exchanger C1',
    type: 'preventive',
    status: 'completed',
    priority: 'low',
    scheduledDate: '2024-02-05',
    completedDate: '2024-02-06',
    estimatedCost: 800,
    actualCost: 750,
    assignedTeam: 'Team Gamma',
    location: 'Unit 3',
    progress: 100,
    description: 'Routine cleaning and inspection'
  },
  {
    id: 'maint-004',
    title: 'Bearing Replacement',
    equipmentId: 'eq-004',
    equipmentName: 'Motor D1',
    type: 'corrective',
    status: 'overdue',
    priority: 'high',
    scheduledDate: '2024-02-01',
    estimatedCost: 2200,
    assignedTeam: 'Team Alpha',
    location: 'Unit 1',
    progress: 0,
    description: 'Replace faulty bearings'
  }
]

// Mock trend data
const MOCK_COST_TRENDS = [
  { month: 'Jan', preventive: 15000, corrective: 8000, emergency: 12000 },
  { month: 'Feb', preventive: 18000, corrective: 6000, emergency: 9000 },
  { month: 'Mar', preventive: 16000, corrective: 7500, emergency: 11000 },
  { month: 'Apr', preventive: 20000, corrective: 5000, emergency: 8000 },
  { month: 'May', preventive: 17000, corrective: 9000, emergency: 10000 },
  { month: 'Jun', preventive: 19000, corrective: 4500, emergency: 7500 }
]

const STATUS_COLORS = {
  scheduled: '#3b82f6',
  'in-progress': '#f59e0b',
  completed: '#22c55e',
  overdue: '#ef4444',
  cancelled: '#6b7280'
}

const TYPE_COLORS = {
  preventive: '#22c55e',
  corrective: '#f59e0b',
  emergency: '#ef4444',
  predictive: '#8b5cf6'
}

export function MaintenanceStatus({
  title,
  config,
  onConfigChange,
  onRemove
}: MaintenanceStatusProps) {
  const {
    showScheduled = true,
    showOverdue = true,
    showCosts = false,
    showTrends = false,
    timeRange = '30d',
    chartType = 'bar'
  } = config

  // Fetch maintenance data
  const { data, isLoading, error, lastUpdated, refresh } = useWidgetData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return MOCK_MAINTENANCE
    },
    300000 // 5 minutes
  )

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!data) return null

    const total = data.length
    const scheduled = data.filter(m => m.status === 'scheduled').length
    const inProgress = data.filter(m => m.status === 'in-progress').length
    const completed = data.filter(m => m.status === 'completed').length
    const overdue = data.filter(m => m.status === 'overdue').length

    const totalEstimatedCost = data.reduce((sum, m) => sum + m.estimatedCost, 0)
    const totalActualCost = data.reduce((sum, m) => sum + (m.actualCost || 0), 0)
    const costVariance = totalActualCost > 0 ? ((totalActualCost - totalEstimatedCost) / totalEstimatedCost) * 100 : 0

    const avgProgress = data.length > 0 ? data.reduce((sum, m) => sum + m.progress, 0) / data.length : 0

    const preventive = data.filter(m => m.type === 'preventive').length
    const corrective = data.filter(m => m.type === 'corrective').length
    const emergency = data.filter(m => m.type === 'emergency').length

    return {
      total,
      scheduled,
      inProgress,
      completed,
      overdue,
      totalEstimatedCost,
      totalActualCost,
      costVariance,
      avgProgress,
      preventive,
      corrective,
      emergency
    }
  }, [data])

  // Process data for charts
  const chartData = useMemo(() => {
    if (!data) return { statusData: [], typeData: [] }

    const statusCounts = data.reduce((acc, maintenance) => {
      acc[maintenance.status] = (acc[maintenance.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const typeCounts = data.reduce((acc, maintenance) => {
      acc[maintenance.type] = (acc[maintenance.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS]
    }))

    const typeData = Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: TYPE_COLORS[type as keyof typeof TYPE_COLORS]
    }))

    return { statusData, typeData }
  }, [data])

  // Get upcoming maintenance
  const upcomingMaintenance = useMemo(() => {
    if (!data) return []
    
    return data
      .filter(m => m.status === 'scheduled' || m.status === 'in-progress')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 5)
  }, [data])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `In ${diffDays} days`
    return `${Math.abs(diffDays)} days overdue`
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
          {data?.length || 0} Events
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
                  <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold">{metrics.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold text-blue-600">{metrics.scheduled}</p>
                    <p className="text-xs text-muted-foreground">Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-lg font-bold text-green-600">{metrics.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-lg font-bold text-red-600">{metrics.overdue}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cost Summary */}
        {metrics && showCosts && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(metrics.totalEstimatedCost)}</p>
                    <p className="text-xs text-muted-foreground">Estimated Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(metrics.totalActualCost)}</p>
                    <p className="text-xs text-muted-foreground">Actual Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'h-4 w-4 rounded-full',
                    metrics.costVariance > 0 ? 'bg-red-600' : 'bg-green-600'
                  )} />
                  <div>
                    <p className={cn(
                      'text-lg font-bold',
                      metrics.costVariance > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {metrics.costVariance > 0 ? '+' : ''}{metrics.costVariance.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Variance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Indicator */}
        {metrics && (
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span>{metrics.avgProgress.toFixed(1)}%</span>
            </div>
            <Progress value={metrics.avgProgress} className="h-2" />
          </div>
        )}

        {/* Charts */}
        {chartType === 'bar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-3">
              <CardContent className="p-0">
                <h4 className="text-sm font-medium mb-2">Status Distribution</h4>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={chartData.statusData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <h4 className="text-sm font-medium mb-2">Type Distribution</h4>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={chartData.typeData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {chartType === 'pie' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-3">
              <CardContent className="p-0">
                <h4 className="text-sm font-medium mb-2">Status Distribution</h4>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={chartData.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <h4 className="text-sm font-medium mb-2">Type Distribution</h4>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={chartData.typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cost Trends */}
        {showTrends && showCosts && (
          <Card className="p-3">
            <CardContent className="p-0">
              <h4 className="text-sm font-medium mb-2">Cost Trends</h4>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={MOCK_COST_TRENDS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="preventive" stroke="#22c55e" strokeWidth={2} name="Preventive" />
                  <Line type="monotone" dataKey="corrective" stroke="#f59e0b" strokeWidth={2} name="Corrective" />
                  <Line type="monotone" dataKey="emergency" stroke="#ef4444" strokeWidth={2} name="Emergency" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Maintenance */}
        {(showScheduled || showOverdue) && upcomingMaintenance.length > 0 && (
          <Card className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Upcoming Maintenance</h4>
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </div>
              <div className="space-y-2">
                {upcomingMaintenance.map(maintenance => (
                  <div key={maintenance.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium">{maintenance.title}</p>
                        <Badge
                          variant={
                            maintenance.priority === 'critical' ? 'destructive' :
                            maintenance.priority === 'high' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {maintenance.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{maintenance.equipmentName}</span>
                        <span>{maintenance.assignedTeam}</span>
                        <span>{formatDate(maintenance.scheduledDate)}</span>
                        {showCosts && (
                          <span>{formatCurrency(maintenance.estimatedCost)}</span>
                        )}
                      </div>
                      {maintenance.status === 'in-progress' && (
                        <div className="mt-1">
                          <Progress value={maintenance.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                    
                    <Badge
                      variant={
                        maintenance.status === 'completed' ? 'default' :
                        maintenance.status === 'in-progress' ? 'secondary' :
                        maintenance.status === 'overdue' ? 'destructive' : 'outline'
                      }
                      className="text-xs ml-2"
                    >
                      {maintenance.status.replace('-', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardWidget>
  )
}

export type { MaintenanceStatusProps, MaintenanceEvent }