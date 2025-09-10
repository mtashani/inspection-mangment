'use client'

import { useMemo } from 'react'
import {
  CpuChipIcon,
  CircleStackIcon,
  GlobeAltIcon,
  ClockIcon,
  ServerIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardWidget, useWidgetData } from '../dashboard-widget'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

export interface PerformanceData {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  network: number
  responseTime: number
  activeUsers: number
  requests: number
  errors: number
}

export interface PerformanceMetricsProps {
  title: string
  config: {
    showCPU?: boolean
    showMemory?: boolean
    showNetwork?: boolean
    showTrends?: boolean
    showPredictions?: boolean
    timeRange?: '1h' | '6h' | '24h' | '7d'
    chartType?: 'line' | 'area'
  }
  onConfigChange?: (config: Record<string, any>) => void
  onRemove?: () => void
}

// Mock performance data
const MOCK_PERFORMANCE_DATA: PerformanceData[] = [
  {
    timestamp: '2024-02-10T14:00:00Z',
    cpu: 45,
    memory: 68,
    disk: 32,
    network: 25,
    responseTime: 120,
    activeUsers: 45,
    requests: 1250,
    errors: 3
  },
  {
    timestamp: '2024-02-10T14:15:00Z',
    cpu: 52,
    memory: 71,
    disk: 33,
    network: 28,
    responseTime: 135,
    activeUsers: 48,
    requests: 1380,
    errors: 2
  },
  {
    timestamp: '2024-02-10T14:30:00Z',
    cpu: 38,
    memory: 65,
    disk: 31,
    network: 22,
    responseTime: 98,
    activeUsers: 42,
    requests: 1150,
    errors: 1
  },
  {
    timestamp: '2024-02-10T14:45:00Z',
    cpu: 61,
    memory: 74,
    disk: 35,
    network: 31,
    responseTime: 156,
    activeUsers: 52,
    requests: 1420,
    errors: 4
  },
  {
    timestamp: '2024-02-10T15:00:00Z',
    cpu: 43,
    memory: 69,
    disk: 33,
    network: 26,
    responseTime: 112,
    activeUsers: 46,
    requests: 1290,
    errors: 2
  },
  {
    timestamp: '2024-02-10T15:15:00Z',
    cpu: 55,
    memory: 72,
    disk: 34,
    network: 29,
    responseTime: 142,
    activeUsers: 49,
    requests: 1360,
    errors: 3
  }
]

export function PerformanceMetrics({
  title,
  config,
  onConfigChange,
  onRemove
}: PerformanceMetricsProps) {
  const {
    showCPU = true,
    showMemory = true,
    showNetwork = true,
    showTrends = true,
    showPredictions = false,
    timeRange = '1h',
    chartType = 'line'
  } = config

  // Fetch performance data
  const { data, isLoading, error, lastUpdated, refresh } = useWidgetData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return MOCK_PERFORMANCE_DATA
    },
    30000 // 30 seconds
  )

  // Calculate current metrics
  const currentMetrics = useMemo(() => {
    if (!data || data.length === 0) return null

    const latest = data[data.length - 1]
    const previous = data.length > 1 ? data[data.length - 2] : latest

    const calculateTrend = (current: number, prev: number) => {
      if (prev === 0) return 0
      return ((current - prev) / prev) * 100
    }

    return {
      cpu: {
        current: latest.cpu,
        trend: calculateTrend(latest.cpu, previous.cpu),
        status: latest.cpu > 80 ? 'critical' : latest.cpu > 60 ? 'warning' : 'good'
      },
      memory: {
        current: latest.memory,
        trend: calculateTrend(latest.memory, previous.memory),
        status: latest.memory > 85 ? 'critical' : latest.memory > 70 ? 'warning' : 'good'
      },
      disk: {
        current: latest.disk,
        trend: calculateTrend(latest.disk, previous.disk),
        status: latest.disk > 90 ? 'critical' : latest.disk > 75 ? 'warning' : 'good'
      },
      network: {
        current: latest.network,
        trend: calculateTrend(latest.network, previous.network),
        status: latest.network > 80 ? 'critical' : latest.network > 60 ? 'warning' : 'good'
      },
      responseTime: {
        current: latest.responseTime,
        trend: calculateTrend(latest.responseTime, previous.responseTime),
        status: latest.responseTime > 200 ? 'critical' : latest.responseTime > 150 ? 'warning' : 'good'
      },
      activeUsers: latest.activeUsers,
      requests: latest.requests,
      errors: latest.errors,
      errorRate: latest.requests > 0 ? (latest.errors / latest.requests) * 100 : 0
    }
  }, [data])

  // Calculate averages
  const averages = useMemo(() => {
    if (!data || data.length === 0) return null

    const sum = data.reduce((acc, item) => ({
      cpu: acc.cpu + item.cpu,
      memory: acc.memory + item.memory,
      disk: acc.disk + item.disk,
      network: acc.network + item.network,
      responseTime: acc.responseTime + item.responseTime
    }), { cpu: 0, memory: 0, disk: 0, network: 0, responseTime: 0 })

    const count = data.length

    return {
      cpu: sum.cpu / count,
      memory: sum.memory / count,
      disk: sum.disk / count,
      network: sum.network / count,
      responseTime: sum.responseTime / count
    }
  }, [data])

  // Get status color
  const getStatusColor = (status: string) => {
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

  // Get trend icon
  const getTrendIcon = (trend: number) => {
    if (trend > 5) return '↗️'
    if (trend < -5) return '↘️'
    return '→'
  }

  // Format chart data for display
  const chartData = useMemo(() => {
    if (!data) return []
    
    return data.map(item => ({
      ...item,
      time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }))
  }, [data])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name.includes('CPU') || entry.name.includes('Memory') || entry.name.includes('Network') ? '%' : 
               entry.name.includes('Response') ? 'ms' : ''}
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
          {timeRange.toUpperCase()}
        </Badge>
      }
    >
      <div className="space-y-4">
        {/* Current Metrics Cards */}
        {currentMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {showCPU && (
              <Card className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CpuChipIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">CPU</span>
                    </div>
                    <span className="text-xs">{getTrendIcon(currentMetrics.cpu.trend)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-lg font-bold', getStatusColor(currentMetrics.cpu.status))}>
                        {currentMetrics.cpu.current}%
                      </span>
                      <Badge
                        variant={
                          currentMetrics.cpu.status === 'critical' ? 'destructive' :
                          currentMetrics.cpu.status === 'warning' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {currentMetrics.cpu.status}
                      </Badge>
                    </div>
                    <Progress value={currentMetrics.cpu.current} className="h-1" />
                    {averages && (
                      <p className="text-xs text-muted-foreground">
                        Avg: {averages.cpu.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {showMemory && (
              <Card className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CircleStackIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Memory</span>
                    </div>
                    <span className="text-xs">{getTrendIcon(currentMetrics.memory.trend)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-lg font-bold', getStatusColor(currentMetrics.memory.status))}>
                        {currentMetrics.memory.current}%
                      </span>
                      <Badge
                        variant={
                          currentMetrics.memory.status === 'critical' ? 'destructive' :
                          currentMetrics.memory.status === 'warning' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {currentMetrics.memory.status}
                      </Badge>
                    </div>
                    <Progress value={currentMetrics.memory.current} className="h-1" />
                    {averages && (
                      <p className="text-xs text-muted-foreground">
                        Avg: {averages.memory.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {showNetwork && (
              <Card className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <GlobeAltIcon className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Network</span>
                    </div>
                    <span className="text-xs">{getTrendIcon(currentMetrics.network.trend)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-lg font-bold', getStatusColor(currentMetrics.network.status))}>
                        {currentMetrics.network.current}%
                      </span>
                      <Badge
                        variant={
                          currentMetrics.network.status === 'critical' ? 'destructive' :
                          currentMetrics.network.status === 'warning' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {currentMetrics.network.status}
                      </Badge>
                    </div>
                    <Progress value={currentMetrics.network.current} className="h-1" />
                    {averages && (
                      <p className="text-xs text-muted-foreground">
                        Avg: {averages.network.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Response</span>
                  </div>
                  <span className="text-xs">{getTrendIcon(currentMetrics.responseTime.trend)}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-lg font-bold', getStatusColor(currentMetrics.responseTime.status))}>
                      {currentMetrics.responseTime.current}ms
                    </span>
                    <Badge
                      variant={
                        currentMetrics.responseTime.status === 'critical' ? 'destructive' :
                        currentMetrics.responseTime.status === 'warning' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {currentMetrics.responseTime.status}
                    </Badge>
                  </div>
                  {averages && (
                    <p className="text-xs text-muted-foreground">
                      Avg: {averages.responseTime.toFixed(0)}ms
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2 mb-2">
                  <ServerIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Users</span>
                </div>
                <div className="space-y-1">
                  <span className="text-lg font-bold">{currentMetrics.activeUsers}</span>
                  <p className="text-xs text-muted-foreground">Active users</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2 mb-2">
                  <ChartBarIcon className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium">Errors</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-lg font-bold',
                      currentMetrics.errorRate > 5 ? 'text-red-600' :
                      currentMetrics.errorRate > 2 ? 'text-yellow-600' : 'text-green-600'
                    )}>
                      {currentMetrics.errors}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {currentMetrics.errorRate.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentMetrics.requests} requests
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Trends Chart */}
        {showTrends && chartData.length > 0 && (
          <Card className="p-3">
            <CardContent className="p-0">
              <h4 className="text-sm font-medium mb-2">Performance Trends</h4>
              <ResponsiveContainer width="100%" height={200}>
                {chartType === 'area' ? (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    {showCPU && (
                      <Area 
                        type="monotone" 
                        dataKey="cpu" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                        name="CPU %"
                      />
                    )}
                    {showMemory && (
                      <Area 
                        type="monotone" 
                        dataKey="memory" 
                        stackId="2"
                        stroke="#22c55e" 
                        fill="#22c55e" 
                        fillOpacity={0.3}
                        name="Memory %"
                      />
                    )}
                    {showNetwork && (
                      <Area 
                        type="monotone" 
                        dataKey="network" 
                        stackId="3"
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.3}
                        name="Network %"
                      />
                    )}
                  </AreaChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    {showCPU && (
                      <Line 
                        type="monotone" 
                        dataKey="cpu" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="CPU %"
                      />
                    )}
                    {showMemory && (
                      <Line 
                        type="monotone" 
                        dataKey="memory" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        name="Memory %"
                      />
                    )}
                    {showNetwork && (
                      <Line 
                        type="monotone" 
                        dataKey="network" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Network %"
                      />
                    )}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* System Health Summary */}
        {currentMetrics && (
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>System Health:</span>
              <div className="flex items-center space-x-2">
                {[currentMetrics.cpu, currentMetrics.memory, currentMetrics.network, currentMetrics.responseTime]
                  .filter(metric => metric.status === 'critical').length === 0 ? (
                  <Badge variant="default" className="text-xs">Healthy</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">Issues Detected</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

export type { PerformanceMetricsProps, PerformanceData }