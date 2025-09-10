'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, 
  Line, 
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
import { useTemplateUsageStats } from '@/hooks/admin/use-templates'

interface TemplateUsageAnalyticsProps {
  templateId: string
  templateName: string
}

interface UsageStats {
  totalUsage: number
  recentUsage: number
  lastUsedAt?: string
  usageByMonth: Array<{
    month: string
    count: number
  }>
  usageByUser: Array<{
    userName: string
    count: number
    lastUsed: string
  }>
  usageByReportType: Array<{
    type: string
    count: number
    percentage: number
  }>
  completionRate: number
  averageCompletionTime: number
}

export function TemplateUsageAnalytics({ 
  templateId, 
  templateName 
}: TemplateUsageAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [refreshing, setRefreshing] = useState(false)

  const { 
    data: usageStats, 
    isLoading, 
    refetch 
  } = useTemplateUsageStats(templateId)

  // Mock data for demonstration - in real app this would come from the API
  const mockUsageStats: UsageStats = {
    totalUsage: 156,
    recentUsage: 23,
    lastUsedAt: new Date().toISOString(),
    usageByMonth: [
      { month: 'Jan', count: 12 },
      { month: 'Feb', count: 19 },
      { month: 'Mar', count: 15 },
      { month: 'Apr', count: 27 },
      { month: 'May', count: 22 },
      { month: 'Jun', count: 23 },
    ],
    usageByUser: [
      { userName: 'John Doe', count: 45, lastUsed: '2024-01-15' },
      { userName: 'Jane Smith', count: 32, lastUsed: '2024-01-14' },
      { userName: 'Mike Johnson', count: 28, lastUsed: '2024-01-13' },
      { userName: 'Sarah Wilson', count: 21, lastUsed: '2024-01-12' },
      { userName: 'Others', count: 30, lastUsed: '2024-01-10' },
    ],
    usageByReportType: [
      { type: 'Completed', count: 134, percentage: 86 },
      { type: 'Draft', count: 15, percentage: 10 },
      { type: 'Abandoned', count: 7, percentage: 4 },
    ],
    completionRate: 86,
    averageCompletionTime: 12.5
  }

  const stats = usageStats || mockUsageStats

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  const handleExportData = () => {
    const exportData = {
      templateId,
      templateName,
      timeRange,
      generatedAt: new Date().toISOString(),
      stats
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-analytics-${templateId}-${timeRange}.json`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Usage Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Detailed usage statistics for "{templateName}"
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalUsage}
                </div>
                <div className="text-xs text-muted-foreground">Total Uses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.recentUsage}
                </div>
                <div className="text-xs text-muted-foreground">Recent Uses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.usageByUser.length}
                </div>
                <div className="text-xs text-muted-foreground">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.completionRate}%
                </div>
                <div className="text-xs text-muted-foreground">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="usage-trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usage-trends">Usage Trends</TabsTrigger>
          <TabsTrigger value="user-activity">User Activity</TabsTrigger>
          <TabsTrigger value="completion-stats">Completion Stats</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="usage-trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.usageByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.usageByUser}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="userName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-2">
                  {stats.usageByUser.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          Last used: {new Date(user.lastUsed).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary">{user.count} uses</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completion-stats" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.usageByReportType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percentage }) => `${type} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {stats.usageByReportType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-semibold">{stats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. Completion Time</span>
                    <span className="font-semibold">{stats.averageCompletionTime} min</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  {stats.usageByReportType.map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="text-lg font-bold" style={{ color: pieColors[index] }}>
                        {item.count}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.type}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Average Load Time</span>
                    <Badge variant="outline">2.3s</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Template Size</span>
                    <Badge variant="outline">45KB</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Field Count</span>
                    <Badge variant="outline">{stats.totalUsage > 0 ? '24' : '0'}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Error Rate</span>
                    <Badge variant="outline">0.2%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Most Active Period</div>
                  <div className="text-xs text-blue-600">Weekdays 9-11 AM</div>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Peak Usage Month</div>
                  <div className="text-xs text-green-600">April (27 uses)</div>
                </div>
                
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm font-medium text-purple-800">Top User</div>
                  <div className="text-xs text-purple-600">John Doe (45 uses)</div>
                </div>
                
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm font-medium text-orange-800">Completion Trend</div>
                  <div className="text-xs text-orange-600">+5% this month</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}