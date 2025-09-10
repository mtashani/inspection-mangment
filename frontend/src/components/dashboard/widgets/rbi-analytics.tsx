'use client'

import { useMemo } from 'react'
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardWidget, useWidgetData } from '../dashboard-widget'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

export interface RBIData {
  equipmentId: string
  equipmentName: string
  equipmentType: string
  location: string
  probabilityOfFailure: number
  consequenceOfFailure: number
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  lastCalculation: string
  nextInspectionDue: string
  inspectionInterval: number
  confidenceLevel: number
  dataQuality: 'poor' | 'fair' | 'good' | 'excellent'
  trends: {
    date: string
    riskScore: number
    pof: number
    cof: number
  }[]
}

export interface RBIAnalyticsProps {
  title: string
  config: {
    showTrends?: boolean
    showPredictions?: boolean
    showDetails?: boolean
    showSummary?: boolean
    chartType?: 'scatter' | 'bar' | 'area'
    timeRange?: '30d' | '90d' | '1y'
  }
  onConfigChange?: (config: Record<string, any>) => void
  onRemove?: () => void
}

// Mock RBI data
const MOCK_RBI_DATA: RBIData[] = [
  {
    equipmentId: 'eq-001',
    equipmentName: 'Pressure Vessel A1',
    equipmentType: 'Pressure Vessel',
    location: 'Unit 1',
    probabilityOfFailure: 0.15,
    consequenceOfFailure: 0.75,
    riskScore: 0.1125,
    riskLevel: 'medium',
    lastCalculation: '2024-02-01',
    nextInspectionDue: '2024-08-01',
    inspectionInterval: 180,
    confidenceLevel: 85,
    dataQuality: 'good',
    trends: [
      { date: '2024-01-01', riskScore: 0.08, pof: 0.12, cof: 0.67 },
      { date: '2024-01-15', riskScore: 0.095, pof: 0.14, cof: 0.68 },
      { date: '2024-02-01', riskScore: 0.1125, pof: 0.15, cof: 0.75 }
    ]
  },
  {
    equipmentId: 'eq-002',
    equipmentName: 'Heat Exchanger B2',
    equipmentType: 'Heat Exchanger',
    location: 'Unit 2',
    probabilityOfFailure: 0.25,
    consequenceOfFailure: 0.85,
    riskScore: 0.2125,
    riskLevel: 'high',
    lastCalculation: '2024-02-01',
    nextInspectionDue: '2024-05-01',
    inspectionInterval: 90,
    confidenceLevel: 78,
    dataQuality: 'fair',
    trends: [
      { date: '2024-01-01', riskScore: 0.18, pof: 0.22, cof: 0.82 },
      { date: '2024-01-15', riskScore: 0.195, pof: 0.23, cof: 0.85 },
      { date: '2024-02-01', riskScore: 0.2125, pof: 0.25, cof: 0.85 }
    ]
  },
  {
    equipmentId: 'eq-003',
    equipmentName: 'Pump C3',
    equipmentType: 'Pump',
    location: 'Unit 1',
    probabilityOfFailure: 0.35,
    consequenceOfFailure: 0.95,
    riskScore: 0.3325,
    riskLevel: 'critical',
    lastCalculation: '2024-02-01',
    nextInspectionDue: '2024-03-01',
    inspectionInterval: 30,
    confidenceLevel: 92,
    dataQuality: 'excellent',
    trends: [
      { date: '2024-01-01', riskScore: 0.28, pof: 0.30, cof: 0.93 },
      { date: '2024-01-15', riskScore: 0.31, pof: 0.33, cof: 0.94 },
      { date: '2024-02-01', riskScore: 0.3325, pof: 0.35, cof: 0.95 }
    ]
  },
  {
    equipmentId: 'eq-004',
    equipmentName: 'Tank D1',
    equipmentType: 'Storage Tank',
    location: 'Unit 3',
    probabilityOfFailure: 0.08,
    consequenceOfFailure: 0.45,
    riskScore: 0.036,
    riskLevel: 'low',
    lastCalculation: '2024-02-01',
    nextInspectionDue: '2025-02-01',
    inspectionInterval: 365,
    confidenceLevel: 88,
    dataQuality: 'good',
    trends: [
      { date: '2024-01-01', riskScore: 0.032, pof: 0.07, cof: 0.46 },
      { date: '2024-01-15', riskScore: 0.034, pof: 0.075, cof: 0.45 },
      { date: '2024-02-01', riskScore: 0.036, pof: 0.08, cof: 0.45 }
    ]
  }
]

const RISK_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444'
}

const DATA_QUALITY_COLORS = {
  poor: '#ef4444',
  fair: '#f59e0b',
  good: '#22c55e',
  excellent: '#3b82f6'
}

export function RBIAnalytics({
  title,
  config,
  onConfigChange,
  onRemove
}: RBIAnalyticsProps) {
  const {
    showTrends = true,
    showPredictions = false,
    showDetails = false,
    showSummary = true,
    chartType = 'scatter',
    timeRange = '90d'
  } = config

  // Fetch RBI data
  const { data, isLoading, error, lastUpdated, refresh } = useWidgetData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return MOCK_RBI_DATA
    },
    300000 // 5 minutes
  )

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!data) return null

    const total = data.length
    const critical = data.filter(item => item.riskLevel === 'critical').length
    const high = data.filter(item => item.riskLevel === 'high').length
    const medium = data.filter(item => item.riskLevel === 'medium').length
    const low = data.filter(item => item.riskLevel === 'low').length

    const avgRiskScore = data.reduce((sum, item) => sum + item.riskScore, 0) / data.length
    const avgConfidence = data.reduce((sum, item) => sum + item.confidenceLevel, 0) / data.length

    // Calculate inspections due soon (within 30 days)
    const inspectionsDueSoon = data.filter(item => {
      const dueDate = new Date(item.nextInspectionDue)
      const now = new Date()
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilDue <= 30 && daysUntilDue >= 0
    }).length

    // Calculate trend direction
    const trendDirection = data.reduce((acc, item) => {
      if (item.trends.length >= 2) {
        const latest = item.trends[item.trends.length - 1].riskScore
        const previous = item.trends[item.trends.length - 2].riskScore
        if (latest > previous) acc.increasing++
        else if (latest < previous) acc.decreasing++
        else acc.stable++
      }
      return acc
    }, { increasing: 0, decreasing: 0, stable: 0 })

    return {
      total,
      critical,
      high,
      medium,
      low,
      avgRiskScore,
      avgConfidence,
      inspectionsDueSoon,
      trendDirection
    }
  }, [data])

  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    if (!data) return []
    
    return data.map(item => ({
      x: item.probabilityOfFailure * 100,
      y: item.consequenceOfFailure * 100,
      z: item.riskScore * 1000,
      name: item.equipmentName,
      riskLevel: item.riskLevel,
      color: RISK_COLORS[item.riskLevel]
    }))
  }, [data])

  // Prepare trend data
  const trendData = useMemo(() => {
    if (!data || !showTrends) return []
    
    // Combine all trends and group by date
    const allTrends = data.flatMap(item => 
      item.trends.map(trend => ({
        ...trend,
        equipmentName: item.equipmentName
      }))
    )
    
    // Group by date and calculate averages
    const groupedTrends = allTrends.reduce((acc, trend) => {
      const date = trend.date
      if (!acc[date]) {
        acc[date] = { date, riskScores: [], pofs: [], cofs: [] }
      }
      acc[date].riskScores.push(trend.riskScore)
      acc[date].pofs.push(trend.pof)
      acc[date].cofs.push(trend.cof)
      return acc
    }, {} as Record<string, any>)
    
    return Object.values(groupedTrends).map((group: any) => ({
      date: group.date,
      avgRiskScore: group.riskScores.reduce((sum: number, val: number) => sum + val, 0) / group.riskScores.length,
      avgPOF: group.pofs.reduce((sum: number, val: number) => sum + val, 0) / group.pofs.length,
      avgCOF: group.cofs.reduce((sum: number, val: number) => sum + val, 0) / group.cofs.length
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data, showTrends])

  // Custom tooltip for scatter plot
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">POF: {data.x.toFixed(1)}%</p>
          <p className="text-sm">COF: {data.y.toFixed(1)}%</p>
          <p className="text-sm">Risk Score: {(data.z / 1000).toFixed(4)}</p>
          <Badge variant="outline" className="text-xs mt-1">
            {data.riskLevel} risk
          </Badge>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for trends
  const TrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(3)}
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
          {data?.length || 0} Assets
        </Badge>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        {metrics && showSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-lg font-bold text-orange-600">{metrics.high}</p>
                    <p className="text-xs text-muted-foreground">High Risk</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold">{metrics.avgConfidence.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Avg Confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-lg font-bold text-yellow-600">{metrics.inspectionsDueSoon}</p>
                    <p className="text-xs text-muted-foreground">Due Soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Risk Distribution */}
        {metrics && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Risk Distribution</span>
              <span>Avg: {metrics.avgRiskScore.toFixed(4)}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <div className="text-center">
                <div className="h-2 bg-green-500 rounded" style={{ width: `${(metrics.low / metrics.total) * 100}%` }} />
                <p className="text-xs mt-1">Low ({metrics.low})</p>
              </div>
              <div className="text-center">
                <div className="h-2 bg-yellow-500 rounded" style={{ width: `${(metrics.medium / metrics.total) * 100}%` }} />
                <p className="text-xs mt-1">Medium ({metrics.medium})</p>
              </div>
              <div className="text-center">
                <div className="h-2 bg-orange-500 rounded" style={{ width: `${(metrics.high / metrics.total) * 100}%` }} />
                <p className="text-xs mt-1">High ({metrics.high})</p>
              </div>
              <div className="text-center">
                <div className="h-2 bg-red-500 rounded" style={{ width: `${(metrics.critical / metrics.total) * 100}%` }} />
                <p className="text-xs mt-1">Critical ({metrics.critical})</p>
              </div>
            </div>
          </div>
        )}

        {/* Risk Matrix Scatter Plot */}
        {chartType === 'scatter' && (
          <Card className="p-3">
            <CardContent className="p-0">
              <h4 className="text-sm font-medium mb-2">Risk Matrix</h4>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Probability of Failure (%)"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Probability of Failure (%)', position: 'insideBottom', offset: -5, style: { fontSize: 10 } }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Consequence of Failure (%)"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Consequence of Failure (%)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                  />
                  <Tooltip content={<ScatterTooltip />} />
                  <Scatter data={scatterData} fill="#3b82f6">
                    {scatterData.map((entry, index) => (
                      <Scatter key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Trend Analysis */}
        {showTrends && trendData.length > 0 && (
          <Card className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Risk Trends</h4>
                {metrics && (
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <TrendingUpIcon className="h-3 w-3 text-red-500" />
                      <span>{metrics.trendDirection.increasing}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingDownIcon className="h-3 w-3 text-green-500" />
                      <span>{metrics.trendDirection.decreasing}</span>
                    </div>
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<TrendTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="avgRiskScore" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.3}
                    name="Avg Risk Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* High Risk Equipment */}
        {data && showDetails && (
          <Card className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">High Risk Equipment</h4>
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </div>
              <div className="space-y-2">
                {data
                  .filter(item => item.riskLevel === 'critical' || item.riskLevel === 'high')
                  .slice(0, 3)
                  .map(item => (
                    <div key={item.equipmentId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium">{item.equipmentName}</p>
                          <Badge
                            variant={item.riskLevel === 'critical' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {item.riskLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{item.location}</span>
                          <span>Risk: {item.riskScore.toFixed(4)}</span>
                          <span>Confidence: {item.confidenceLevel}%</span>
                        </div>
                        <div className="mt-1">
                          <Progress value={item.riskScore * 1000} className="h-1" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Quality Indicator */}
        {data && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Data Quality:</span>
            <div className="flex items-center space-x-1">
              {['excellent', 'good', 'fair', 'poor'].map(quality => {
                const count = data.filter(item => item.dataQuality === quality).length
                return count > 0 ? (
                  <Badge 
                    key={quality}
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: DATA_QUALITY_COLORS[quality as keyof typeof DATA_QUALITY_COLORS] }}
                  >
                    {quality}: {count}
                  </Badge>
                ) : null
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

export type { RBIAnalyticsProps, RBIData }