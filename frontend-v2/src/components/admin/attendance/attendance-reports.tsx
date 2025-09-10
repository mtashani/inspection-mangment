'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Download, 
  Calendar as CalendarIcon, 
  Filter,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Inspector, AttendanceStatus } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'

interface AttendanceReportsProps {
  inspectors: Inspector[]
  onGenerateReport: (filters: ReportFilters) => Promise<void>
  onExportData: (filters: ReportFilters, format: 'PDF' | 'EXCEL' | 'CSV') => Promise<void>
  loading?: boolean
  className?: string
}

interface ReportFilters {
  inspectorId?: number
  startDate?: string
  endDate?: string
  status?: AttendanceStatus[]
  includeOverrides?: boolean
  groupBy?: 'inspector' | 'date' | 'status'
}

interface AttendanceStats {
  totalInspectors: number
  totalWorkingDays: number
  totalOvertimeHours: number
  averageAttendanceRate: number
  absenteeismRate: number
  byStatus: Record<string, number>
  byInspector: Array<{
    inspectorId: number
    inspectorName: string
    workingDays: number
    overtimeHours: number
    attendanceRate: number
  }>
  trends: {
    attendanceRateChange: number
    overtimeChange: number
    absenteeismChange: number
  }
}

const QUICK_DATE_RANGES = [
  { label: 'Last 7 days', value: 'last-7-days' },
  { label: 'Last 30 days', value: 'last-30-days' },
  { label: 'This month', value: 'this-month' },
  { label: 'Last month', value: 'last-month' },
  { label: 'Last 3 months', value: 'last-3-months' },
  { label: 'This year', value: 'this-year' },
  { label: 'Custom range', value: 'custom' }
]

const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'WORKING', label: 'Working', color: 'bg-green-500' },
  { value: 'RESTING', label: 'Resting', color: 'bg-blue-500' },
  { value: 'OVERTIME', label: 'Overtime', color: 'bg-orange-500' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-500' },
  { value: 'SICK_LEAVE', label: 'Sick Leave', color: 'bg-purple-500' },
  { value: 'VACATION', label: 'Vacation', color: 'bg-yellow-500' }
]

export function AttendanceReports({
  inspectors,
  onGenerateReport,
  onExportData,
  loading = false,
  className
}: AttendanceReportsProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    groupBy: 'inspector'
  })
  const [dateRange, setDateRange] = useState('last-30-days')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedStatuses, setSelectedStatuses] = useState<AttendanceStatus[]>([])

  // Mock statistics data - in real implementation, this would come from API
  const mockStats: AttendanceStats = {
    totalInspectors: inspectors.length,
    totalWorkingDays: 1250,
    totalOvertimeHours: 320,
    averageAttendanceRate: 92.5,
    absenteeismRate: 7.5,
    byStatus: {
      WORKING: 1250,
      RESTING: 450,
      OVERTIME: 180,
      ABSENT: 85,
      SICK_LEAVE: 25,
      VACATION: 60
    },
    byInspector: inspectors.slice(0, 5).map((inspector, index) => ({
      inspectorId: inspector.id,
      inspectorName: inspector.name,
      workingDays: 25 - index * 2,
      overtimeHours: 40 - index * 5,
      attendanceRate: 95 - index * 3
    })),
    trends: {
      attendanceRateChange: 2.3,
      overtimeChange: -5.2,
      absenteeismChange: -1.1
    }
  }

  const handleDateRangeChange = (value: string) => {
    setDateRange(value)
    
    const today = new Date()
    let start: Date
    let end: Date = today

    switch (value) {
      case 'last-7-days':
        start = subDays(today, 7)
        break
      case 'last-30-days':
        start = subDays(today, 30)
        break
      case 'this-month':
        start = startOfMonth(today)
        end = endOfMonth(today)
        break
      case 'last-month':
        const lastMonth = subMonths(today, 1)
        start = startOfMonth(lastMonth)
        end = endOfMonth(lastMonth)
        break
      case 'last-3-months':
        start = subMonths(today, 3)
        break
      case 'this-year':
        start = new Date(today.getFullYear(), 0, 1)
        break
      case 'custom':
        setShowCustomDate(true)
        return
      default:
        start = subDays(today, 30)
    }

    setStartDate(start)
    setEndDate(end)
    setShowCustomDate(false)
    
    setFilters(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }))
  }

  const handleStatusToggle = (status: AttendanceStatus) => {
    setSelectedStatuses(prev => {
      const newStatuses = prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
      
      setFilters(prevFilters => ({
        ...prevFilters,
        status: newStatuses.length > 0 ? newStatuses : undefined
      }))
      
      return newStatuses
    })
  }

  const handleGenerateReport = async () => {
    await onGenerateReport(filters)
  }

  const handleExport = async (format: 'PDF' | 'EXCEL' | 'CSV') => {
    await onExportData(filters, format)
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <div className="w-4 h-4" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Generate comprehensive attendance reports and analyze trends
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('PDF')} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('EXCEL')} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={handleGenerateReport} disabled={loading}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="export">Export & Filters</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Inspectors</p>
                    <p className="text-2xl font-bold">{mockStats.totalInspectors}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Working Days</p>
                    <p className="text-2xl font-bold">{mockStats.totalWorkingDays}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(mockStats.trends.attendanceRateChange)}
                      <span className={cn('text-xs', getTrendColor(mockStats.trends.attendanceRateChange))}>
                        {mockStats.trends.attendanceRateChange > 0 ? '+' : ''}{mockStats.trends.attendanceRateChange}%
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overtime Hours</p>
                    <p className="text-2xl font-bold">{mockStats.totalOvertimeHours}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(mockStats.trends.overtimeChange)}
                      <span className={cn('text-xs', getTrendColor(mockStats.trends.overtimeChange))}>
                        {mockStats.trends.overtimeChange > 0 ? '+' : ''}{mockStats.trends.overtimeChange}%
                      </span>
                    </div>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                    <p className="text-2xl font-bold">{mockStats.averageAttendanceRate}%</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(mockStats.trends.attendanceRateChange)}
                      <span className={cn('text-xs', getTrendColor(mockStats.trends.attendanceRateChange))}>
                        {mockStats.trends.attendanceRateChange > 0 ? '+' : ''}{mockStats.trends.attendanceRateChange}%
                      </span>
                    </div>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {ATTENDANCE_STATUS_OPTIONS.map((status) => (
                  <div key={status.value} className="text-center space-y-2">
                    <div className={cn('w-12 h-12 rounded-full mx-auto flex items-center justify-center', status.color)}>
                      <span className="text-white font-bold">
                        {mockStats.byStatus[status.value] || 0}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{status.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {((mockStats.byStatus[status.value] || 0) / Object.values(mockStats.byStatus).reduce((a, b) => a + b, 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Inspector Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStats.byInspector.map((inspector) => (
                  <div key={inspector.inspectorId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{inspector.inspectorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {inspector.workingDays} working days • {inspector.overtimeHours}h overtime
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{inspector.attendanceRate}%</p>
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Reports Tab */}
        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Attendance Reports</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate comprehensive reports with custom filters and grouping options
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Inspector</Label>
                  <Select
                    value={filters.inspectorId?.toString() || 'all'}
                    onValueChange={(value) => 
                      setFilters(prev => ({ 
                        ...prev, 
                        inspectorId: value === 'all' ? undefined : parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Inspectors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Inspectors</SelectItem>
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.id} value={inspector.id.toString()}>
                          {inspector.name} ({inspector.employeeId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={dateRange} onValueChange={handleDateRangeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUICK_DATE_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Group By</Label>
                  <Select
                    value={filters.groupBy || 'inspector'}
                    onValueChange={(value: 'inspector' | 'date' | 'status') =>
                      setFilters(prev => ({ ...prev, groupBy: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspector">Inspector</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Date Range */}
              {showCustomDate && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date)
                            if (date) {
                              setFilters(prev => ({
                                ...prev,
                                startDate: date.toISOString().split('T')[0]
                              }))
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date)
                            if (date) {
                              setFilters(prev => ({
                                ...prev,
                                endDate: date.toISOString().split('T')[0]
                              }))
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Status Filters */}
              <div className="space-y-2">
                <Label>Filter by Status</Label>
                <div className="flex flex-wrap gap-2">
                  {ATTENDANCE_STATUS_OPTIONS.map((status) => (
                    <Button
                      key={status.value}
                      variant={selectedStatuses.includes(status.value as AttendanceStatus) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusToggle(status.value as AttendanceStatus)}
                      className="flex items-center gap-2"
                    >
                      <div className={cn('w-3 h-3 rounded', status.color)} />
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Report Actions */}
              <div className="flex items-center gap-2">
                <Button onClick={handleGenerateReport} disabled={loading}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" onClick={() => handleExport('EXCEL')} disabled={loading}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport('CSV')} disabled={loading}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              Advanced analytics dashboard with charts and trend analysis will be implemented here.
              This includes attendance patterns, seasonal trends, and predictive analytics.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Export & Filters Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => handleExport('PDF')} disabled={loading}>
                  <Download className="w-4 h-4 mr-2" />
                  Export as PDF
                </Button>
                <Button variant="outline" onClick={() => handleExport('EXCEL')} disabled={loading}>
                  <Download className="w-4 h-4 mr-2" />
                  Export as Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport('CSV')} disabled={loading}>
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Exported reports will include all filtered data with timestamps and digital signatures for compliance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}