'use client'

import { useMemo } from 'react'
import {
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardWidget, useWidgetData } from '../dashboard-widget'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts'

export interface EquipmentData {
  id: string
  name: string
  type: string
  status: 'operational' | 'maintenance' | 'critical' | 'offline'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  lastInspection: string
  nextMaintenance: string
  location: string
}

export interface EquipmentOverviewProps {
  title: string
  config: {
    showRiskLevels?: boolean
    showStatus?: boolean
    showMaintenance?: boolean
    showTrends?: boolean
    chartType?: 'pie' | 'bar' | 'both'
    timeRange?: '7d' | '30d' | '90d'
  }
  onConfigChange?: (config: Record<string, any>) => void
  onRemove?: () => void
}

// Mock data
const MOCK_EQUIPMENT: EquipmentData[] = [
  {
    id: 'eq-001',
    name: 'Pressure Vessel A1',
    type: 'Pressure Vessel',
    status: 'operational',
    riskLevel: 'low',
    lastInspection: '2024-01-15',
    nextMaintenance: '2024-03-15',
    location: 'Unit 1'
  },
  {
    id: 'eq-002',
    name: 'Heat Exchanger B2',
    type: 'Heat Exchanger',
    status: 'maintenance',
    riskLevel: 'medium',
    lastInspection: '2024-01-10',
    nextMaintenance: '2024-02-10',
    location: 'Unit 2'
  },
  {
    id: 'eq-003',
    name: 'Pump C3',
    type: 'Pump',
    status: 'critical',
    riskLevel: 'high',
    lastInspection: '2024-01-05',
    nextMaintenance: '2024-02-05',
    location: 'Unit 1'
  },
  // Add more mock data...
]

const STATUS_COLORS = {
  operational: '#22c55e',
  maintenance: '#f59e0b',
  critical: '#ef4444',
  offline: '#6b7280'
}

const RISK_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444'
}

export function EquipmentOverview({
  title,
  config,
  onConfigChange,
  onRemove
}: EquipmentOverviewProps) {
  const {
    showRiskLevels = true,
    showStatus = true,
    showMaintenance = false,
    showTrends = false,
    chartType = 'pie',
    timeRange = '30d'
  } = config

  // Fetch equipment data
  const { data, isLoading, error, lastUpdated, refresh } = useWidgetData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return MOCK_EQUIPMENT
    },
    300000 // 5 minutes
  )

  // Process data for charts
  const chartData = useMemo(() => {
    if (!data) return { statusData: [], riskData: [] }

    const statusCounts = data.reduce((acc, equipment) => {
      acc[equipment.status] = (acc[equipment.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const riskCounts = data.reduce((acc, equipment) => {
      acc[equipment.riskLevel] = (acc[equipment.riskLevel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS]
    }))

    const riskData = Object.entries(riskCounts).map(([risk, count]) => ({
      name: risk.charAt(0).toUpperCase() + risk.slice(1),
      value: count,
      color: RISK_COLORS[risk as keyof typeof RISK_COLORS]
    }))

    return { statusData, riskData }
  }, [data])

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!data) return null

    const total = data.length
    const operational = data.filter(eq => eq.status === 'operational').length
    const critical = data.filter(eq => eq.status === 'critical').length
    const highRisk = data.filter(eq => eq.riskLevel === 'high' || eq.riskLevel === 'critical').length
    const maintenanceDue = data.filter(eq => {
      const dueDate = new Date(eq.nextMaintenance)
      const now = new Date()
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilDue <= 30
    }).length

    return {
      total,
      operational,
      critical,
      highRisk,
      maintenanceDue,
      operationalPercentage: (operational / total) * 100,
      criticalPercentage: (critical / total) * 100
    }
  }, [data])

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Count: {data.value}
          </p>
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
          {data?.length || 0} Equipment
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
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-lg font-bold text-green-600">{metrics.operational}</p>
                    <p className="text-xs text-muted-foreground">Operational</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-lg font-bold text-red-600">{metrics.critical}</p>
                    <p className="text-xs text-muted-foreground">Critical</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-lg font-bold text-yellow-600">{metrics.maintenanceDue}</p>
                    <p className="text-xs text-muted-foreground">Due Soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Indicators */}
        {metrics && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Operational Status</span>
                <span>{metrics.operationalPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.operationalPercentage} className="h-2" />
            </div>
            
            {showRiskLevels && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>High Risk Equipment</span>
                  <span>{metrics.highRisk} items</span>
                </div>
                <Progress 
                  value={(metrics.highRisk / metrics.total) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        )}

        {/* Charts */}
        {(chartType === 'pie' || chartType === 'both') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showStatus && (
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
            )}

            {showRiskLevels && (
              <Card className="p-3">
                <CardContent className="p-0">
                  <h4 className="text-sm font-medium mb-2">Risk Distribution</h4>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={chartData.riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Bar Chart */}
        {(chartType === 'bar' || chartType === 'both') && (
          <Card className="p-3">
            <CardContent className="p-0">
              <h4 className="text-sm font-medium mb-2">Equipment Overview</h4>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[...chartData.statusData, ...chartData.riskData]}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Equipment Issues */}
        {showMaintenance && data && (
          <Card className="p-3">
            <CardContent className="p-0">
              <h4 className="text-sm font-medium mb-2">Attention Required</h4>
              <div className="space-y-2">
                {data
                  .filter(eq => eq.status === 'critical' || eq.riskLevel === 'high')
                  .slice(0, 3)
                  .map(equipment => (
                    <div key={equipment.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <p className="text-sm font-medium">{equipment.name}</p>
                        <p className="text-xs text-muted-foreground">{equipment.location}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={equipment.status === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {equipment.status}
                        </Badge>
                        <Badge
                          variant={equipment.riskLevel === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {equipment.riskLevel} risk
                        </Badge>
                      </div>
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

export type { EquipmentOverviewProps, EquipmentData }