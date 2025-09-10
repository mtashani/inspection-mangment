'use client'

import { useMemo } from 'react'
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardWidget, useWidgetData } from '../dashboard-widget'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

export interface InspectionData {
  id: string
  title: string
  equipmentId: string
  equipmentName: string
  type: 'routine' | 'emergency' | 'scheduled' | 'follow-up'
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo: string
  dueDate: string
  completedDate?: string
  location: string
  progress: number
}

export interface InspectionSummaryProps {
  title: string
  config: {
    showPending?: boolean
    showCompleted?: boolean
    showTrends?: boolean
    showEfficiency?: boolean
    timeRange?: '7d' | '30d' | '90d'
    showMyInspections?: boolean
  }
  onConfigChange?: (config: Record<string, any>) => void
  onRemove?: () => void
}

// Mock data
const MOCK_INSPECTIONS: InspectionData[] = [
  {
    id: 'insp-001',
    title: 'Monthly Safety Inspection',
    equipmentId: 'eq-001',
    equipmentName: 'Pressure Vessel A1',
    type: 'routine',
    status: 'pending',
    priority: 'medium',
    assignedTo: 'John Smith',
    dueDate: '2024-02-15',
    location: 'Unit 1',
    progress: 0
  },
  {
    id: 'insp-002',
    title: 'Emergency Check',
    equipmentId: 'eq-002',
    equipmentName: 'Heat Exchanger B2',
    type: 'emergency',
    status: 'in-progress',
    priority: 'critical',
    assignedTo: 'Jane Doe',
    dueDate: '2024-02-10',
    location: 'Unit 2',
    progress: 65
  },
  {
    id: 'insp-003',
    title: 'Quarterly Maintenance Check',
    equipmentId: 'eq-003',
    equipmentName: 'Pump C3',
    type: 'scheduled',
    status: 'completed',
    priority: 'high',
    assignedTo: 'Mike Johnson',
    dueDate: '2024-02-05',
    completedDate: '2024-02-04',
    location: 'Unit 1',
    progress: 100
  },
  // Add more mock data...
]

// Mock trend data
const MOCK_TREND_DATA = [
  { date: '2024-01-01', completed: 12, pending: 8, overdue: 2 },
  { date: '2024-01-08', completed: 15, pending: 6, overdue: 1 },
  { date: '2024-01-15', completed: 18, pending: 9, overdue: 3 },
  { date: '2024-01-22', completed: 14, pending: 7, overdue: 2 },
  { date: '2024-01-29', completed: 20, pending: 5, overdue: 1 },
  { date: '2024-02-05', completed: 16, pending: 8, overdue: 2 }
]

const STATUS_COLORS = {
  pending: '#f59e0b',
  'in-progress': '#3b82f6',
  completed: '#22c55e',
  overdue: '#ef4444'
}

const PRIORITY_COLORS = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444'
}

export function InspectionSummary({
  title,
  config,
  onConfigChange,
  onRemove
}: InspectionSummaryProps) {
  const {
    showPending = true,
    showCompleted = true,
    showTrends = false,
    showEfficiency = false,
    timeRange = '30d',
    showMyInspections = false
  } = config

  // Fetch inspection data
  const { data, isLoading, error, lastUpdated, refresh } = useWidgetData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return MOCK_INSPECTIONS
    },
    300000 // 5 minutes
  )

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!data) return null

    const total = data.length
    const pending = data.filter(insp => insp.status === 'pending').length
    const inProgress = data.filter(insp => insp.status === 'in-progress').length
    const completed = data.filter(insp => insp.status === 'completed').length
    const overdue = data.filter(insp => {
      const dueDate = new Date(insp.dueDate)
      const now = new Date()
      return insp.status !== 'completed' && dueDate < now
    }).length

    const critical = data.filter(insp => insp.priority === 'critical').length
    const high = data.filter(insp => insp.priority === 'high').length

    const completionRate = total > 0 ? (completed / total) * 100 : 0
    const onTimeRate = completed > 0 ? 
      (data.filter(insp => {
        if (insp.status !== 'completed' || !insp.completedDate) return false
        return new Date(insp.completedDate) <= new Date(insp.dueDate)
      }).length / completed) * 100 : 0

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      critical,
      high,
      completionRate,
      onTimeRate
    }
  }, [data])

  // Get upcoming inspections
  const upcomingInspections = useMemo(() => {
    if (!data) return []
    
    return data
      .filter(insp => insp.status === 'pending' || insp.status === 'in-progress')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
  }, [data])

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
    return `${Math.abs(diffDays)} days ago`
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
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
          {data?.length || 0} Inspections
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
                  <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />
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
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-lg font-bold text-yellow-600">{metrics.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
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

        {/* Progress Indicators */}
        {metrics && showEfficiency && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Completion Rate</span>
                <span>{metrics.completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.completionRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>On-Time Rate</span>
                <span>{metrics.onTimeRate.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.onTimeRate} className="h-2" />
            </div>
          </div>
        )}

        {/* Trends Chart */}
        {showTrends && (
          <Card className="p-3">
            <CardContent className="p-0">
              <h4 className="text-sm font-medium mb-2">Inspection Trends</h4>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={MOCK_TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Completed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Pending"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="overdue" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Overdue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Inspections */}
        {(showPending || showCompleted) && upcomingInspections.length > 0 && (
          <Card className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Upcoming Inspections</h4>
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </div>
              <div className="space-y-2">
                {upcomingInspections.map(inspection => (
                  <div key={inspection.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium">{inspection.title}</p>
                        <Badge
                          variant={
                            inspection.priority === 'critical' ? 'destructive' :
                            inspection.priority === 'high' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {inspection.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <UserIcon className="h-3 w-3" />
                          <span>{inspection.assignedTo}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CalendarDaysIcon className="h-3 w-3" />
                          <span>{formatDate(inspection.dueDate)}</span>
                        </span>
                      </div>
                      {inspection.status === 'in-progress' && (
                        <div className="mt-1">
                          <Progress value={inspection.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                    
                    <Badge
                      variant={
                        inspection.status === 'completed' ? 'default' :
                        inspection.status === 'in-progress' ? 'secondary' :
                        inspection.status === 'overdue' ? 'destructive' : 'outline'
                      }
                      className="text-xs ml-2"
                    >
                      {inspection.status.replace('-', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Priority Distribution */}
        {metrics && (
          <Card className="p-3">
            <CardContent className="p-0">
              <h4 className="text-sm font-medium mb-2">Priority Distribution</h4>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={[
                  { name: 'Critical', value: metrics.critical, fill: PRIORITY_COLORS.critical },
                  { name: 'High', value: metrics.high, fill: PRIORITY_COLORS.high },
                  { name: 'Medium', value: data?.filter(i => i.priority === 'medium').length || 0, fill: PRIORITY_COLORS.medium },
                  { name: 'Low', value: data?.filter(i => i.priority === 'low').length || 0, fill: PRIORITY_COLORS.low }
                ]}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardWidget>
  )
}

export type { InspectionSummaryProps, InspectionData }