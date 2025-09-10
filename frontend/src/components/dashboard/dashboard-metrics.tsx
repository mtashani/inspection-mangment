'use client'

import { useMemo } from 'react'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DashboardWidget, useWidgetData } from './dashboard-widget'

export interface MetricData {
  id: string
  label: string
  value: number | string
  previousValue?: number
  target?: number
  unit?: string
  format?: 'number' | 'percentage' | 'currency' | 'duration'
  trend?: 'up' | 'down' | 'stable'
  status?: 'good' | 'warning' | 'critical'
  icon?: React.ComponentType<{ className?: string }>
}

export interface DashboardMetricsProps {
  title: string
  config: {
    showKPIs?: boolean
    showTrends?: boolean
    layout?: 'grid' | 'list'
    metrics?: string[]
  }
  onConfigChange?: (config: Record<string, any>) => void
  onRemove?: () => void
}

// Mock data - in real app, this would come from API
const MOCK_METRICS: MetricData[] = [
  {
    id: 'total-equipment',
    label: 'Total Equipment',
    value: 1247,
    previousValue: 1235,
    trend: 'up',
    status: 'good',
    icon: WrenchScrewdriverIcon
  },
  {
    id: 'active-inspections',
    label: 'Active Inspections',
    value: 89,
    previousValue: 92,
    trend: 'down',
    status: 'good',
    icon: ClockIcon
  },
  {
    id: 'overdue-maintenance',
    label: 'Overdue Maintenance',
    value: 23,
    previousValue: 31,
    trend: 'down',
    status: 'warning',
    icon: ExclamationTriangleIcon
  },
  {
    id: 'completion-rate',
    label: 'Completion Rate',
    value: 94.5,
    previousValue: 91.2,
    target: 95,
    unit: '%',
    format: 'percentage',
    trend: 'up',
    status: 'good',
    icon: CheckCircleIcon
  },
  {
    id: 'avg-response-time',
    label: 'Avg Response Time',
    value: '2.3h',
    previousValue: 2.8,
    target: 2,
    format: 'duration',
    trend: 'down',
    status: 'good',
    icon: ClockIcon
  },
  {
    id: 'critical-alerts',
    label: 'Critical Alerts',
    value: 7,
    previousValue: 12,
    trend: 'down',
    status: 'critical',
    icon: ExclamationTriangleIcon
  }
]

export function DashboardMetrics({
  title,
  config,
  onConfigChange,
  onRemove
}: DashboardMetricsProps) {
  const {
    showKPIs = true,
    showTrends = true,
    layout = 'grid',
    metrics = []
  } = config

  // Fetch metrics data
  const { data, isLoading, error, lastUpdated, refresh } = useWidgetData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return MOCK_METRICS
    },
    300000 // 5 minutes
  )

  // Filter metrics based on config
  const filteredMetrics = useMemo(() => {
    if (!data) return []
    
    if (metrics.length > 0) {
      return data.filter(metric => metrics.includes(metric.id))
    }
    
    return data
  }, [data, metrics])

  // Format metric value
  const formatValue = (metric: MetricData) => {
    const { value, format, unit } = metric
    
    if (typeof value === 'string') return value
    
    switch (format) {
      case 'percentage':
        return `${value}${unit || '%'}`
      case 'currency':
        return `$${value.toLocaleString()}`
      case 'duration':
        return `${value}${unit || 'h'}`
      default:
        return `${value.toLocaleString()}${unit || ''}`
    }
  }

  // Calculate percentage change
  const getPercentageChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  // Get trend icon
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="h-3 w-3" />
      case 'down':
        return <ArrowDownIcon className="h-3 w-3" />
      default:
        return <MinusIcon className="h-3 w-3" />
    }
  }

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  // Render metric card
  const renderMetricCard = (metric: MetricData) => {
    const percentageChange = typeof metric.value === 'number' && metric.previousValue
      ? getPercentageChange(metric.value, metric.previousValue)
      : 0

    const progress = metric.target && typeof metric.value === 'number'
      ? Math.min((metric.value / metric.target) * 100, 100)
      : undefined

    return (
      <Card key={metric.id} className="p-4">
        <CardContent className="p-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {metric.icon && (
                  <metric.icon className={cn('h-4 w-4', getStatusColor(metric.status))} />
                )}
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </p>
              </div>
              
              <div className="flex items-baseline space-x-2">
                <p className={cn('text-2xl font-bold', getStatusColor(metric.status))}>
                  {formatValue(metric)}
                </p>
                
                {showTrends && metric.previousValue && (
                  <div className={cn(
                    'flex items-center space-x-1 text-xs',
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  )}>
                    {getTrendIcon(metric.trend)}
                    <span>{Math.abs(percentageChange).toFixed(1)}%</span>
                  </div>
                )}
              </div>

              {/* Progress bar for metrics with targets */}
              {progress !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress to target</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-1" />
                </div>
              )}
            </div>

            {/* Status badge */}
            <Badge
              variant={
                metric.status === 'good' ? 'default' :
                metric.status === 'warning' ? 'secondary' : 'destructive'
              }
              className="text-xs"
            >
              {metric.status?.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
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
    >
      <div className="space-y-4">
        {/* KPI Summary */}
        {showKPIs && filteredMetrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {filteredMetrics.filter(m => m.status === 'good').length}
              </div>
              <div className="text-xs text-muted-foreground">Good</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">
                {filteredMetrics.filter(m => m.status === 'warning').length}
              </div>
              <div className="text-xs text-muted-foreground">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {filteredMetrics.filter(m => m.status === 'critical').length}
              </div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {filteredMetrics.length}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        )}

        {/* Metrics Grid/List */}
        <div className={cn(
          layout === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        )}>
          {filteredMetrics.map(renderMetricCard)}
        </div>

        {/* Empty State */}
        {filteredMetrics.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No metrics to display</p>
            <p className="text-sm">Configure widget to show specific metrics</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

export type { DashboardMetricsProps, MetricData }