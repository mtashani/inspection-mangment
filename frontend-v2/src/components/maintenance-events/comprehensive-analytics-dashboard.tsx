'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  Calendar,
  PieChart,
  Activity,
  FileText,
  Wrench,
  ExternalLink
} from 'lucide-react'
import { useEventAnalytics } from '@/hooks/use-event-analytics'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ComprehensiveAnalyticsDashboardProps {
  eventId: string | number
  className?: string
}

export function ComprehensiveAnalyticsDashboard({ eventId, className }: ComprehensiveAnalyticsDashboardProps) {
  const { 
    summary, 
    gapAnalysis, 
    departmentPerformance, 
    timelineAnalysis,
    subEventsBreakdown,
    unplannedAnalysis,
    eventBacklog,
    inspectorsWorkload,
    equipmentCoverage,
    isLoading, 
    hasError 
  } = useEventAnalytics(eventId)

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load analytics data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Planned Inspections</p>
                <p className="text-2xl font-bold">{summary.data?.planned_count || 0}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Progress 
                value={summary.data?.completion_rate_planned || 0} 
                className="flex-1" 
              />
              <span className="text-sm text-muted-foreground">
                {summary.data?.completion_rate_planned?.toFixed(1) || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unplanned Added</p>
                <p className="text-2xl font-bold">{summary.data?.unplanned_count || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {summary.data?.unplanned_done || 0} completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{summary.data?.overall_completion_rate?.toFixed(1) || 0}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <Progress 
                value={summary.data?.overall_completion_rate || 0} 
                className="w-full" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Analytics View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sub-Events Breakdown */}
        {subEventsBreakdown.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Sub-Events Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {subEventsBreakdown.data.sub_events_analysis.map((subEvent) => (
                  <div key={subEvent.sub_event_id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{subEvent.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {subEvent.planned_done}/{subEvent.planned_count} completed
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={subEvent.completion_rate || 0} className="w-20" />
                      <Badge variant={subEvent.is_overdue ? "destructive" : "default"}>
                        {subEvent.completion_rate?.toFixed(0) || 0}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Department Performance */}
        {departmentPerformance.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Department Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {departmentPerformance.data.department_performance.map((dept) => (
                  <div key={dept.department} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{dept.department}</p>
                      <p className="text-sm text-muted-foreground">
                        {dept.completed_count}/{dept.planned_count} completed
                      </p>
                    </div>
                    <Badge variant={dept.completion_rate >= 80 ? "default" : "secondary"}>
                      {dept.completion_rate.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline Analysis */}
        {timelineAnalysis.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline Adherence
              </CardTitle>
              <CardDescription>
                Analysis of planned vs actual timing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-green-600">
                    {timelineAnalysis.data.summary.on_time_rate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">On Time Rate</p>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-orange-600">
                    {timelineAnalysis.data.summary.avg_start_delay_days.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Start Delay (days)</p>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-red-600">
                    {timelineAnalysis.data.summary.avg_end_delay_days.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg End Delay (days)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inspector Workload */}
        {inspectorsWorkload.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Inspector Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {inspectorsWorkload.data.inspector_workload.map((inspector) => (
                  <div key={inspector.inspector_id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{inspector.inspector_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {inspector.inspections_count} inspections • {inspector.total_man_hours}h total
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{inspector.avg_hours_per_inspection.toFixed(1)}h</p>
                      <p className="text-sm text-muted-foreground">avg per inspection</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Backlog */}
        {eventBacklog.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Inspection Backlog
              </CardTitle>
              <CardDescription>
                Planned inspections not yet completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold">{eventBacklog.data.summary.total_backlog}</p>
                  <p className="text-sm text-muted-foreground">Total Backlog</p>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-red-600">{eventBacklog.data.summary.overdue_items}</p>
                  <p className="text-sm text-muted-foreground">Overdue Items</p>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-orange-600">{eventBacklog.data.summary.critical_items}</p>
                  <p className="text-sm text-muted-foreground">Critical Priority</p>
                </div>
              </div>
              
              {eventBacklog.data.backlog_items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium mb-3">Top Overdue Items</h4>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {eventBacklog.data.backlog_items
                      .filter(item => item.is_overdue)
                      .map((item) => (
                        <div key={item.plan_id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
                          <div>
                            <p className="font-medium">{item.equipment_tag}</p>
                            <p className="text-sm text-muted-foreground">{item.plan_description}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="destructive">
                              {item.days_overdue} days overdue
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">{item.priority}</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Equipment Coverage */}
        {equipmentCoverage.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-green-600">
                    {equipmentCoverage.data.summary.coverage_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Coverage Rate</p>
                  </div>
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-blue-600">
                    {equipmentCoverage.data.summary.first_time_equipment}
                  </p>
                  <p className="text-sm text-muted-foreground">First-Time Inspections</p>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold">
                    {equipmentCoverage.data.summary.total_equipment}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Equipment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/maintenance/events/${eventId}/inspections`}>
                <FileText className="h-4 w-4 mr-2" />
                View All Inspections
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/maintenance/events/${eventId}/reports`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}