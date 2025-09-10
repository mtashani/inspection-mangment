'use client'

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { RiskLevel } from '@/types/equipment'

export interface RBIReportingAnalyticsProps {
  className?: string
}

interface RBIMetrics {
  totalEquipment: number
  calculationsThisMonth: number
  averageRiskScore: number
  overdueInspections: number
  riskDistribution: Record<RiskLevel, number>
  trendsData: {
    month: string
    calculations: number
    averageRisk: number
  }[]
}

interface EquipmentRiskSummary {
  id: string
  tagNumber: string
  name: string
  type: string
  location: string
  riskLevel: RiskLevel
  pofScore: number
  cofScore: number
  lastCalculation: string
  nextInspection: string
  trend: 'up' | 'down' | 'stable'
}

interface RBIReport {
  id: string
  title: string
  type: 'summary' | 'detailed' | 'trend' | 'custom'
  createdDate: string
  equipmentCount: number
  status: 'generated' | 'generating' | 'failed'
  downloadUrl?: string
}

export function RBIReportingAnalytics({ className }: RBIReportingAnalyticsProps) {
  const [metrics, setMetrics] = useState<RBIMetrics | null>(null)
  const [equipmentSummary, setEquipmentSummary] = useState<EquipmentRiskSummary[]>([])
  const [reports, setReports] = useState<RBIReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('6months')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [locationFilter, setLocationFilter] = useState('all')

  // Load data on mount
  useEffect(() => {
    loadAnalyticsData()
    loadEquipmentSummary()
    loadReports()
  }, [timeRange, riskFilter, locationFilter])

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true)
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock metrics data
      const mockMetrics: RBIMetrics = {
        totalEquipment: 1247,
        calculationsThisMonth: 89,
        averageRiskScore: 6.2,
        overdueInspections: 23,
        riskDistribution: {
          'LOW': 312,
          'MEDIUM': 567,
          'HIGH': 298,
          'CRITICAL': 70
        },
        trendsData: [
          { month: 'Jan', calculations: 45, averageRisk: 5.8 },
          { month: 'Feb', calculations: 52, averageRisk: 6.1 },
          { month: 'Mar', calculations: 67, averageRisk: 6.3 },
          { month: 'Apr', calculations: 71, averageRisk: 6.0 },
          { month: 'May', calculations: 83, averageRisk: 6.4 },
          { month: 'Jun', calculations: 89, averageRisk: 6.2 }
        ]
      }
      
      setMetrics(mockMetrics)
    } catch (err) {
      console.error('Failed to load analytics data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadEquipmentSummary = async () => {
    try {
      // Mock equipment summary data
      const mockSummary: EquipmentRiskSummary[] = [
        {
          id: '1',
          tagNumber: 'V-101',
          name: 'Main Reactor Vessel',
          type: 'Pressure Vessel',
          location: 'Unit 1',
          riskLevel: 'CRITICAL',
          pofScore: 8.5,
          cofScore: 9.2,
          lastCalculation: '2024-01-20',
          nextInspection: '2024-06-15',
          trend: 'up'
        },
        {
          id: '2',
          tagNumber: 'P-201',
          name: 'Feed Pump A',
          type: 'Centrifugal Pump',
          location: 'Unit 2',
          riskLevel: 'HIGH',
          pofScore: 7.2,
          cofScore: 6.8,
          lastCalculation: '2024-01-18',
          nextInspection: '2024-08-20',
          trend: 'down'
        },
        {
          id: '3',
          tagNumber: 'E-301',
          name: 'Heat Exchanger',
          type: 'Shell & Tube',
          location: 'Unit 3',
          riskLevel: 'MEDIUM',
          pofScore: 5.1,
          cofScore: 5.9,
          lastCalculation: '2024-01-15',
          nextInspection: '2024-12-01',
          trend: 'stable'
        }
      ]
      
      setEquipmentSummary(mockSummary)
    } catch (err) {
      console.error('Failed to load equipment summary:', err)
    }
  }

  const loadReports = async () => {
    try {
      // Mock reports data
      const mockReports: RBIReport[] = [
        {
          id: '1',
          title: 'Monthly RBI Summary - January 2024',
          type: 'summary',
          createdDate: '2024-01-31',
          equipmentCount: 1247,
          status: 'generated',
          downloadUrl: '/reports/rbi-summary-jan-2024.pdf'
        },
        {
          id: '2',
          title: 'High Risk Equipment Analysis',
          type: 'detailed',
          createdDate: '2024-01-25',
          equipmentCount: 368,
          status: 'generated',
          downloadUrl: '/reports/high-risk-analysis.xlsx'
        },
        {
          id: '3',
          title: 'Risk Trend Analysis Q1 2024',
          type: 'trend',
          createdDate: '2024-01-20',
          equipmentCount: 1247,
          status: 'generating'
        }
      ]
      
      setReports(mockReports)
    } catch (err) {
      console.error('Failed to load reports:', err)
    }
  }

  // Get risk level display
  const getRiskDisplay = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircleIcon className="h-4 w-4" /> }
      case 'MEDIUM':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <InformationCircleIcon className="h-4 w-4" /> }
      case 'HIGH':
        return { color: 'bg-red-100 text-red-800', icon: <ExclamationTriangleIcon className="h-4 w-4" /> }
      case 'CRITICAL':
        return { color: 'bg-red-200 text-red-900', icon: <ExclamationTriangleIcon className="h-4 w-4" /> }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <InformationCircleIcon className="h-4 w-4" /> }
    }
  }

  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-red-600" />
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-green-600" />
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Generate report
  const generateReport = async (type: string) => {
    try {
      // Mock report generation
      const newReport: RBIReport = {
        id: Date.now().toString(),
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        type: type as any,
        createdDate: new Date().toISOString(),
        equipmentCount: metrics?.totalEquipment || 0,
        status: 'generating'
      }
      
      setReports(prev => [newReport, ...prev])
      
      // Simulate generation time
      setTimeout(() => {
        setReports(prev => prev.map(r => 
          r.id === newReport.id 
            ? { ...r, status: 'generated', downloadUrl: `/reports/${type}-${Date.now()}.pdf` }
            : r
        ))
      }, 3000)
      
    } catch (err) {
      console.error('Failed to generate report:', err)
    }
  }

  if (isLoading) {
    return <RBIAnalyticsSkeleton />
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">RBI Analytics & Reporting</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => generateReport('summary')}>
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Equipment</div>
                  <div className="text-2xl font-bold">{metrics.totalEquipment.toLocaleString()}</div>
                </div>
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Calculations This Month</div>
                  <div className="text-2xl font-bold">{metrics.calculationsThisMonth}</div>
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                    <span>+12% from last month</span>
                  </div>
                </div>
                <CalendarIcon className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Average Risk Score</div>
                  <div className="text-2xl font-bold">{metrics.averageRiskScore.toFixed(1)}</div>
                  <div className="flex items-center space-x-1 text-xs text-yellow-600">
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                    <span>+0.2 from last month</span>
                  </div>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Overdue Inspections</div>
                  <div className="text-2xl font-bold text-red-600">{metrics.overdueInspections}</div>
                  <div className="flex items-center space-x-1 text-xs text-red-600">
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                    <span>+3 from last week</span>
                  </div>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Distribution */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(metrics.riskDistribution).map(([risk, count]) => {
                const riskDisplay = getRiskDisplay(risk as RiskLevel)
                const percentage = ((count / metrics.totalEquipment) * 100).toFixed(1)
                
                return (
                  <div key={risk} className="text-center">
                    <div className={cn('p-4 rounded-lg', riskDisplay.color.replace('text-', 'border-').replace('bg-', 'bg-'))}>
                      <div className="flex items-center justify-center mb-2">
                        {riskDisplay.icon}
                      </div>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm font-medium">{risk}</div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Calculations Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Calculations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.trendsData.map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{data.month}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(data.calculations / 100) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{data.calculations}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Score Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Average Risk Score Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.trendsData.map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{data.month}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-600 h-2 rounded-full" 
                              style={{ width: `${(data.averageRisk / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{data.averageRisk.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Equipment Analysis Tab */}
        <TabsContent value="equipment" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Risk Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="LOW">Low Risk</SelectItem>
                    <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                    <SelectItem value="HIGH">High Risk</SelectItem>
                    <SelectItem value="CRITICAL">Critical Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="unit1">Unit 1</SelectItem>
                    <SelectItem value="unit2">Unit 2</SelectItem>
                    <SelectItem value="unit3">Unit 3</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>PoF Score</TableHead>
                    <TableHead>CoF Score</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Next Inspection</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipmentSummary
                    .filter(eq => riskFilter === 'all' || eq.riskLevel === riskFilter)
                    .map((equipment) => {
                      const riskDisplay = getRiskDisplay(equipment.riskLevel)
                      
                      return (
                        <TableRow key={equipment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{equipment.tagNumber}</div>
                              <div className="text-sm text-muted-foreground">{equipment.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{equipment.type}</TableCell>
                          <TableCell>{equipment.location}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-xs', riskDisplay.color)}>
                              <div className="flex items-center space-x-1">
                                {riskDisplay.icon}
                                <span>{equipment.riskLevel}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>{equipment.pofScore.toFixed(1)}</TableCell>
                          <TableCell>{equipment.cofScore.toFixed(1)}</TableCell>
                          <TableCell>{getTrendIcon(equipment.trend)}</TableCell>
                          <TableCell>{formatDate(equipment.nextInspection)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Trends Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  Detailed trend analysis and predictive insights will be available in the next release.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {/* Generate Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button onClick={() => generateReport('summary')} className="h-20 flex-col">
                  <DocumentTextIcon className="h-6 w-6 mb-2" />
                  <span>Summary Report</span>
                </Button>
                <Button onClick={() => generateReport('detailed')} variant="outline" className="h-20 flex-col">
                  <ChartBarIcon className="h-6 w-6 mb-2" />
                  <span>Detailed Analysis</span>
                </Button>
                <Button onClick={() => generateReport('trend')} variant="outline" className="h-20 flex-col">
                  <ArrowTrendingUpIcon className="h-6 w-6 mb-2" />
                  <span>Trend Analysis</span>
                </Button>
                <Button onClick={() => generateReport('custom')} variant="outline" className="h-20 flex-col">
                  <FunnelIcon className="h-6 w-6 mb-2" />
                  <span>Custom Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Equipment Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {report.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(report.createdDate)}</TableCell>
                      <TableCell>{report.equipmentCount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          'text-xs',
                          report.status === 'generated' ? 'bg-green-100 text-green-800' :
                          report.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        )}>
                          {report.status === 'generating' && (
                            <div className="h-3 w-3 border border-yellow-600 border-t-transparent rounded-full animate-spin mr-1" />
                          )}
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {report.status === 'generated' && (
                            <Button variant="ghost" size="sm">
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Loading Skeleton Component
function RBIAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Distribution Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="text-center space-y-2">
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export type { RBIReportingAnalyticsProps }