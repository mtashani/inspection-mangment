'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  Target,
  Activity
} from 'lucide-react'
import { Inspector } from '@/types/admin'
import { cn } from '@/lib/utils'

interface AttendanceAnalyticsProps {
  inspectors: Inspector[]
  loading?: boolean
  className?: string
}

interface AnalyticsData {
  attendanceTrends: {
    month: string
    attendanceRate: number
    workingDays: number
    overtimeHours: number
  }[]
  inspectorPerformance: {
    inspectorId: number
    name: string
    attendanceRate: number
    workingDays: number
    overtimeHours: number
    trend: 'up' | 'down' | 'stable'
    trendValue: number
  }[]
  statusDistribution: {
    status: string
    count: number
    percentage: number
    color: string
  }[]
  insights: {
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
    value?: string
  }[]
  predictions: {
    nextMonthAttendance: number
    expectedOvertimeHours: number
    riskFactors: string[]
  }
}

export function AttendanceAnalytics({
  inspectors,
  loading = false,
  className
}: AttendanceAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('last-6-months')
  const [selectedInspector, setSelectedInspector] = useState<number | 'all'>('all')

  // Mock analytics data - in real implementation, this would come from API
  const mockAnalytics: AnalyticsData = {
    attendanceTrends: [
      { month: 'Jan', attendanceRate: 89.5, workingDays: 22, overtimeHours: 45 },
      { month: 'Feb', attendanceRate: 91.2, workingDays: 20, overtimeHours: 38 },
      { month: 'Mar', attendanceRate: 93.8, workingDays: 23, overtimeHours: 52 },
      { month: 'Apr', attendanceRate: 88.7, workingDays: 21, overtimeHours: 41 },
      { month: 'May', attendanceRate: 94.1, workingDays: 22, overtimeHours: 48 },
      { month: 'Jun', attendanceRate: 92.3, workingDays: 21, overtimeHours: 44 }
    ],
    inspectorPerformance: inspectors.slice(0, 8).map((inspector, index) => ({
      inspectorId: inspector.id,
      name: inspector.name,
      attendanceRate: 95 - index * 2,
      workingDays: 22 - index,
      overtimeHours: 40 + index * 3,
      trend: index % 3 === 0 ? 'up' : index % 3 === 1 ? 'down' : 'stable',
      trendValue: (Math.random() * 10) - 5
    })),
    statusDistribution: [
      { status: 'Working', count: 1250, percentage: 62.5, color: 'bg-green-500' },
      { status: 'Resting', count: 450, percentage: 22.5, color: 'bg-blue-500' },
      { status: 'Overtime', count: 180, percentage: 9.0, color: 'bg-orange-500' },
      { status: 'Absent', count: 85, percentage: 4.25, color: 'bg-red-500' },
      { status: 'Sick Leave', count: 25, percentage: 1.25, color: 'bg-purple-500' },
      { status: 'Vacation', count: 10, percentage: 0.5, color: 'bg-yellow-500' }
    ],
    insights: [
      {
        type: 'positive',
        title: 'Attendance Rate Improved',
        description: 'Overall attendance rate increased by 2.3% compared to last month',
        value: '+2.3%'
      },
      {
        type: 'negative',
        title: 'Overtime Hours Increased',
        description: 'Overtime hours are 15% higher than the target threshold',
        value: '+15%'
      },
      {
        type: 'neutral',
        title: 'Seasonal Pattern Detected',
        description: 'Attendance typically drops by 5-8% during summer months'
      },
      {
        type: 'positive',
        title: 'Low Absenteeism',
        description: 'Sick leave requests are 20% below industry average',
        value: '-20%'
      }
    ],
    predictions: {
      nextMonthAttendance: 93.2,
      expectedOvertimeHours: 42,
      riskFactors: [
        'Summer vacation season approaching',
        'Two inspectors scheduled for training',
        'Increased project workload expected'
      ]
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', value: number) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const getInsightIcon = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'negative':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <Activity className="w-5 h-5 text-blue-500" />
    }
  }

  const getInsightBorderColor = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50'
      case 'negative':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Analytics</h2>
          <p className="text-muted-foreground">
            Advanced analytics and insights for attendance patterns
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedInspector.toString()} onValueChange={(value) => setSelectedInspector(value === 'all' ? 'all' : parseInt(value))}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Inspectors</SelectItem>
              {inspectors.map((inspector) => (
                <SelectItem key={inspector.id} value={inspector.id.toString()}>
                  {inspector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockAnalytics.insights.map((insight, index) => (
              <Card key={index} className={cn('border-l-4', getInsightBorderColor(insight.type))}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{insight.title}</h4>
                        {insight.value && (
                          <Badge variant="secondary" className="text-xs">
                            {insight.value}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Attendance Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.statusDistribution.map((status) => (
                  <div key={status.status} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className={cn('w-3 h-3 rounded', status.color)} />
                      <span className="text-sm font-medium">{status.status}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{status.count} days</span>
                        <span className="text-sm font-medium">{status.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={cn('h-2 rounded-full', status.color)}
                          style={{ width: `${status.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Attendance Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simple trend visualization */}
                <div className="grid grid-cols-6 gap-4">
                  {mockAnalytics.attendanceTrends.map((trend, index) => (
                    <div key={trend.month} className="text-center space-y-2">
                      <div className="text-xs text-muted-foreground">{trend.month}</div>
                      <div 
                        className="bg-primary rounded-t mx-auto"
                        style={{ 
                          height: `${trend.attendanceRate}px`,
                          width: '20px',
                          maxHeight: '100px'
                        }}
                      />
                      <div className="text-xs font-medium">{trend.attendanceRate}%</div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">+2.3%</div>
                      <div className="text-sm text-muted-foreground">Attendance Rate Change</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">+8.5%</div>
                      <div className="text-sm text-muted-foreground">Overtime Hours Change</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">-1.2%</div>
                      <div className="text-sm text-muted-foreground">Absenteeism Change</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Inspector Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.inspectorPerformance.map((inspector) => (
                  <div key={inspector.inspectorId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{inspector.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {inspector.workingDays} working days • {inspector.overtimeHours}h overtime
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{inspector.attendanceRate}%</p>
                        <p className="text-xs text-muted-foreground">Attendance Rate</p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {getTrendIcon(inspector.trend, inspector.trendValue)}
                        <span className={cn(
                          'text-sm font-medium',
                          inspector.trend === 'up' ? 'text-green-600' :
                          inspector.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        )}>
                          {inspector.trendValue > 0 ? '+' : ''}{inspector.trendValue.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Next Month Predictions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expected Attendance Rate</span>
                    <span className="font-medium">{mockAnalytics.predictions.nextMonthAttendance}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expected Overtime Hours</span>
                    <span className="font-medium">{mockAnalytics.predictions.expectedOvertimeHours}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockAnalytics.predictions.riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                      <span className="text-sm text-muted-foreground">{risk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Optimize Work Schedules</p>
                    <p className="text-sm text-green-700">
                      Consider adjusting work cycles to reduce overtime hours while maintaining coverage.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Plan for Seasonal Variations</p>
                    <p className="text-sm text-blue-700">
                      Prepare for summer vacation period by scheduling additional coverage or adjusting project timelines.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800">Monitor High-Overtime Inspectors</p>
                    <p className="text-sm text-orange-700">
                      Review workload distribution for inspectors with consistently high overtime hours.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}