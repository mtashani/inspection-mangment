'use client'

import { useMemo } from 'react'
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardWidget, useWidgetData } from '../dashboard-widget'

export interface ReportData {
  id: string
  title: string
  type: 'inspection' | 'maintenance' | 'rbi' | 'safety' | 'compliance'
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdBy: string
  createdDate: string
  lastModified: string
  equipmentId?: string
  equipmentName?: string
  location: string
  fileSize: string
  format: 'pdf' | 'excel' | 'word' | 'json'
}

export interface RecentReportsProps {
  title: string
  config: {
    limit?: number
    showStatus?: boolean
    showPriority?: boolean
    reportTypes?: string[]
    timeRange?: '7d' | '30d' | '90d'
  }
  onConfigChange?: (config: Record<string, any>) => void
  onRemove?: () => void
}

// Mock data
const MOCK_REPORTS: ReportData[] = [
  {
    id: 'rpt-001',
    title: 'Monthly Safety Inspection Report',
    type: 'inspection',
    status: 'approved',
    priority: 'high',
    createdBy: 'John Smith',
    createdDate: '2024-02-10',
    lastModified: '2024-02-12',
    equipmentId: 'eq-001',
    equipmentName: 'Pressure Vessel A1',
    location: 'Unit 1',
    fileSize: '2.4 MB',
    format: 'pdf'
  },
  {
    id: 'rpt-002',
    title: 'RBI Analysis - Heat Exchangers',
    type: 'rbi',
    status: 'submitted',
    priority: 'critical',
    createdBy: 'Jane Doe',
    createdDate: '2024-02-08',
    lastModified: '2024-02-09',
    location: 'Unit 2',
    fileSize: '5.1 MB',
    format: 'excel'
  },
  {
    id: 'rpt-003',
    title: 'Maintenance Completion Report',
    type: 'maintenance',
    status: 'draft',
    priority: 'medium',
    createdBy: 'Mike Johnson',
    createdDate: '2024-02-07',
    lastModified: '2024-02-10',
    equipmentId: 'eq-003',
    equipmentName: 'Pump C3',
    location: 'Unit 1',
    fileSize: '1.8 MB',
    format: 'word'
  },
  {
    id: 'rpt-004',
    title: 'Compliance Audit Report',
    type: 'compliance',
    status: 'approved',
    priority: 'high',
    createdBy: 'Sarah Wilson',
    createdDate: '2024-02-05',
    lastModified: '2024-02-06',
    location: 'All Units',
    fileSize: '3.2 MB',
    format: 'pdf'
  },
  {
    id: 'rpt-005',
    title: 'Emergency Response Report',
    type: 'safety',
    status: 'rejected',
    priority: 'critical',
    createdBy: 'Tom Brown',
    createdDate: '2024-02-03',
    lastModified: '2024-02-04',
    location: 'Unit 3',
    fileSize: '1.5 MB',
    format: 'pdf'
  }
]

const STATUS_COLORS = {
  draft: '#6b7280',
  submitted: '#3b82f6',
  approved: '#22c55e',
  rejected: '#ef4444'
}

const PRIORITY_COLORS = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444'
}

const TYPE_ICONS = {
  inspection: DocumentTextIcon,
  maintenance: DocumentTextIcon,
  rbi: DocumentTextIcon,
  safety: ExclamationTriangleIcon,
  compliance: CheckCircleIcon
}

export function RecentReports({
  title,
  config,
  onConfigChange,
  onRemove
}: RecentReportsProps) {
  const {
    limit = 10,
    showStatus = true,
    showPriority = false,
    reportTypes = [],
    timeRange = '30d'
  } = config

  // Fetch reports data
  const { data, isLoading, error, lastUpdated, refresh } = useWidgetData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return MOCK_REPORTS
    },
    300000 // 5 minutes
  )

  // Filter and process reports
  const filteredReports = useMemo(() => {
    if (!data) return []
    
    let filtered = data
    
    // Filter by report types if specified
    if (reportTypes.length > 0) {
      filtered = filtered.filter(report => reportTypes.includes(report.type))
    }
    
    // Filter by time range
    const now = new Date()
    const timeRangeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    }[timeRange]
    
    filtered = filtered.filter(report => {
      const reportDate = new Date(report.lastModified)
      return now.getTime() - reportDate.getTime() <= timeRangeMs
    })
    
    // Sort by last modified date (newest first)
    filtered.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    
    // Limit results
    return filtered.slice(0, limit)
  }, [data, reportTypes, timeRange, limit])

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!filteredReports) return null

    const total = filteredReports.length
    const draft = filteredReports.filter(r => r.status === 'draft').length
    const submitted = filteredReports.filter(r => r.status === 'submitted').length
    const approved = filteredReports.filter(r => r.status === 'approved').length
    const rejected = filteredReports.filter(r => r.status === 'rejected').length

    const critical = filteredReports.filter(r => r.priority === 'critical').length
    const high = filteredReports.filter(r => r.priority === 'high').length

    return {
      total,
      draft,
      submitted,
      approved,
      rejected,
      critical,
      high
    }
  }, [filteredReports])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
      case 'submitted':
        return <ClockIcon className="h-4 w-4 text-blue-600" />
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-600" />
    }
  }

  // Handle report actions
  const handleView = (reportId: string) => {
    console.log('View report:', reportId)
    // In real app, navigate to report view
  }

  const handleDownload = (reportId: string) => {
    console.log('Download report:', reportId)
    // In real app, trigger download
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
          {filteredReports?.length || 0} Reports
        </Badge>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        {metrics && showStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{metrics.approved}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{metrics.submitted}</p>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-600">{metrics.draft}</p>
                  <p className="text-xs text-muted-foreground">Draft</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{metrics.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-2">
          {filteredReports.map(report => {
            const TypeIcon = TYPE_ICONS[report.type] || DocumentTextIcon
            
            return (
              <Card key={report.id} className="p-3 hover:shadow-sm transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <TypeIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium truncate">{report.title}</h4>
                          {showStatus && (
                            <Badge
                              variant={
                                report.status === 'approved' ? 'default' :
                                report.status === 'submitted' ? 'secondary' :
                                report.status === 'rejected' ? 'destructive' : 'outline'
                              }
                              className="text-xs"
                            >
                              {report.status}
                            </Badge>
                          )}
                          {showPriority && (
                            <Badge
                              variant={
                                report.priority === 'critical' ? 'destructive' :
                                report.priority === 'high' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {report.priority}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center space-x-1">
                            <UserIcon className="h-3 w-3" />
                            <span>{report.createdBy}</span>
                          </span>
                          <span>{report.location}</span>
                          <span>{formatDate(report.lastModified)}</span>
                          <span>{report.fileSize}</span>
                        </div>
                        
                        {report.equipmentName && (
                          <p className="text-xs text-muted-foreground">
                            Equipment: {report.equipmentName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                      {getStatusIcon(report.status)}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(report.id)}
                        className="h-8 w-8 p-0"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(report.id)}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No reports found</p>
            <p className="text-sm">Try adjusting your filters or time range</p>
          </div>
        )}

        {/* View All Button */}
        {filteredReports.length > 0 && (
          <div className="text-center pt-2 border-t">
            <Button variant="ghost" size="sm" className="text-xs">
              View All Reports ({data?.length || 0})
            </Button>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

export type { RecentReportsProps, ReportData }