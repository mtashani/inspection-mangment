'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalEquipment: number
  highRiskEquipment: number
  overdueInspections: number
  completedInspections: number
  scheduledMaintenance: number
  generatedReports: number
}

interface ChartData {
  name: string
  value: number
  color: string
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [riskDistribution, setRiskDistribution] = useState<ChartData[]>([])
  const [inspectionTrends, setInspectionTrends] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock data
      const mockStats: DashboardStats = {
        totalEquipment: 245,
        highRiskEquipment: 23,
        overdueInspections: 12,
        completedInspections: 156,
        scheduledMaintenance: 34,
        generatedReports: 89
      }
      
      const mockRiskDistribution: ChartData[] = [
        { name: 'High Risk', value: 23, color: '#ef4444' },
        { name: 'Medium Risk', value: 87, color: '#f59e0b' },
        { name: 'Low Risk', value: 135, color: '#10b981' }
      ]
      
      const mockInspectionTrends: ChartData[] = [
        { name: 'Jan', value: 12, color: '#3b82f6' },
        { name: 'Feb', value: 19, color: '#3b82f6' },
        { name: 'Mar', value: 15, color: '#3b82f6' },
        { name: 'Apr', value: 22, color: '#3b82f6' },
        { name: 'May', value: 18, color: '#3b82f6' },
        { name: 'Jun', value: 25, color: '#3b82f6' }
      ]
      
      setStats(mockStats)
      setRiskDistribution(mockRiskDistribution)
      setInspectionTrends(mockInspectionTrends)
      
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive insights into equipment performance and inspection activities
        </p>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
              <WrenchScrewdriverIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEquipment}</div>
              <p className="text-xs text-muted-foreground">Active assets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.highRiskEquipment}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <ClockIcon className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.overdueInspections}</div>
              <p className="text-xs text-muted-foreground">Inspections overdue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedInspections}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.scheduledMaintenance}</div>
              <p className="text-xs text-muted-foreground">Scheduled events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.generatedReports}</div>
              <p className="text-xs text-muted-foreground">Generated</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>
                  Equipment categorized by risk level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">{item.value}</span>
                        <Badge variant="outline">
                          {((item.value / stats!.totalEquipment) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inspection Trends</CardTitle>
                <CardDescription>
                  Monthly inspection completion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inspectionTrends.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              backgroundColor: item.color,
                              width: `${(item.value / 30) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold w-8">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest inspections and maintenance activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 border rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Inspection completed on TK-101</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
                
                <div className="flex items-center space-x-4 p-3 border rounded-lg">
                  <WrenchScrewdriverIcon className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Maintenance scheduled for PP-102</p>
                    <p className="text-xs text-muted-foreground">4 hours ago</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                </div>
                
                <div className="flex items-center space-x-4 p-3 border rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">High risk equipment identified: HX-205</p>
                    <p className="text-xs text-muted-foreground">6 hours ago</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">High Risk</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk-Based Inspection Analysis</CardTitle>
              <CardDescription>
                Detailed risk assessment and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  RBI Analysis Dashboard
                </h3>
                <p className="text-sm text-gray-500">
                  Comprehensive risk analysis tools and visualizations will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Analytics</CardTitle>
              <CardDescription>
                Detailed inspection performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Inspection Analytics
                </h3>
                <p className="text-sm text-gray-500">
                  Detailed inspection analytics and performance metrics will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Generation</CardTitle>
              <CardDescription>
                Generate custom reports and export data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Report Builder
                </h3>
                <p className="text-sm text-gray-500">
                  Custom report generation tools and export options will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}