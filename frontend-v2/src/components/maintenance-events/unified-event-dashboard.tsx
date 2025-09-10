'use client'

import React from 'react'
import { format } from 'date-fns'
import { MaintenanceEvent, MaintenanceEventStatus } from '@/types/maintenance-events'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  CheckCircle, 
  Target, 
  Activity, 
  TrendingUp, 
  BarChart3, 
  AlertTriangle,
  PieChart,
  Users,
  Wrench,
  ExternalLink,
  Settings,
  Upload,
  X
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useEventStatistics } from '@/hooks/use-maintenance-events'
import { useEventAnalytics, useWorkflowPermissions } from '@/hooks/use-event-analytics'
import { useStartMaintenanceEvent, useCompleteMaintenanceEvent, useUpdateMaintenanceEvent } from '@/hooks/use-maintenance-events'
import { 
  getEventWorkflowState, 
  getStatusBadgeConfig, 
  getStatusDescription,
  validateStateTransition,
  getNextRecommendedAction 
} from '@/lib/utils/maintenance-event-state'
import { StateBasedActions } from './'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface UnifiedEventDashboardProps {
  event: MaintenanceEvent
  className?: string
}

export function UnifiedEventDashboard({ event, className }: UnifiedEventDashboardProps) {
  const { user, isAdmin } = useAuth()
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  
  // Mutations for event actions
  const startEventMutation = useStartMaintenanceEvent()
  const completeEventMutation = useCompleteMaintenanceEvent()
  const updateEventMutation = useUpdateMaintenanceEvent()
  
  // Data fetching
  const { data: statistics, isLoading: statsLoading } = useEventStatistics(event.id.toString())
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
    isLoading: analyticsLoading, 
    hasError: analyticsError 
  } = useEventAnalytics(event.id)
  
  const { data: workflowPermissions } = useWorkflowPermissions(event.id)

  // Workflow state management
  const workflowState = getEventWorkflowState(event, isAdmin(), user?.username === event.created_by)
  const statusConfig = getStatusBadgeConfig(event.status, event.approved_by)
  const statusDescription = getStatusDescription(event.status, event.approved_by)

  // Event action handlers
  const handleStartEvent = () => {
    const validation = validateStateTransition(event, MaintenanceEventStatus.InProgress, {
      isAdmin: isAdmin(),
      isOwner: user?.username === event.created_by
    })
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Cannot start event')
      return
    }
    
    startEventMutation.mutate(event.id.toString())
  }

  const handleCompleteEvent = () => {
    const validation = validateStateTransition(event, MaintenanceEventStatus.Completed, {
      isAdmin: isAdmin(),
      isOwner: user?.username === event.created_by
    })
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Cannot complete event')
      return
    }
    
    completeEventMutation.mutate({ id: event.id.toString() })
  }

  const handleApproveEvent = () => {
    if (!user) {
      toast.error('You must be logged in to approve events')
      return
    }

    updateEventMutation.mutate({
      id: event.id.toString(),
      data: {
        approved_by: user.username,
      }
    }, {
      onSuccess: () => {
        toast.success('Event approved successfully')
      }
    })
  }

  const handleStateChanged = (newStatus: MaintenanceEventStatus) => {
    updateEventMutation.mutate({
      id: event.id.toString(),
      data: {
        status: newStatus,
      }
    }, {
      onSuccess: () => {
        // Refresh will happen automatically via mutation
      },
      onError: (error) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to change event status'
        toast.error(errorMessage)
      }
    })
  }

  // Loading state
  if (statsLoading || analyticsLoading) {
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

  if (analyticsError) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Enhanced Header Section */}
      <Card className="border">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            {/* Title and Status Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-2xl font-bold">
                {event.title}
              </CardTitle>
              <Badge 
                variant={statusConfig.variant}
                className={`${statusConfig.className} text-sm px-3 py-1 font-medium`}
                title={statusDescription}
              >
                {event.status}
              </Badge>
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg border">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{event.event_number}</span>
              </div>
            </div>
            
            {event.description && (
              <p className="text-muted-foreground text-sm leading-relaxed max-w-4xl">{event.description}</p>
            )}

            {/* Organized Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-3 border-t">
              {/* Left: Event Information & Permissions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Event Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.event_type}</span>
                      {workflowPermissions?.permissions && (
                        <Badge variant={workflowPermissions.permissions.is_complex_event ? "default" : "secondary"} className="text-xs">
                          {workflowPermissions.permissions.is_complex_event ? "Complex" : "Simple"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created by:</span>
                    <span className="font-medium">{event.created_by}</span>
                  </div>
                  {event.approved_by && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Approved by:</span>
                      <span className="font-medium text-green-600">{event.approved_by}</span>
                    </div>
                  )}
                  
                  {/* Permissions */}
                  {workflowPermissions?.permissions && (
                    <>
                      <div className="pt-2 border-t">
                        <h5 className="text-xs font-semibold text-muted-foreground mb-2">Permissions</h5>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Sub-Events:</span>
                            <div className="flex items-center gap-1">
                              {workflowPermissions.permissions.can_create_sub_event ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <X className="h-3 w-3 text-red-600" />
                              )}
                              <span className="text-xs font-medium">
                                {workflowPermissions.permissions.can_create_sub_event ? "Allowed" : "Blocked"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Unplanned:</span>
                            <div className="flex items-center gap-1">
                              {workflowPermissions.permissions.can_add_unplanned_inspection ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <X className="h-3 w-3 text-red-600" />
                              )}
                              <span className="text-xs font-medium">
                                {workflowPermissions.permissions.can_add_unplanned_inspection ? "Allowed" : "Blocked"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Center: Timeline */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Planned Start:</span>
                    <span className="font-medium">{format(new Date(event.planned_start_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Planned End:</span>
                    <span className="font-medium">{format(new Date(event.planned_end_date), 'MMM dd, yyyy')}</span>
                  </div>
                  {event.actual_start_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Actual Start:</span>
                      <span className="font-medium text-green-600">{format(new Date(event.actual_start_date), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  {event.actual_end_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Actual End:</span>
                      <span className="font-medium text-green-600">{format(new Date(event.actual_end_date), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  {!event.actual_start_date && !event.actual_end_date && (
                    <div className="text-center py-2">
                      <span className="text-xs text-muted-foreground italic">Timeline will be recorded during execution</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Quick Actions</h4>
                <div className="space-y-2">
                  <StateBasedActions
                    event={event}
                    onEventUpdated={() => {}}
                    onStartEvent={handleStartEvent}
                    onCompleteEvent={handleCompleteEvent}
                    onApproveEvent={handleApproveEvent}
                    onInspectionPlanned={() => {}}
                    onStateChanged={handleStateChanged}
                    className="w-full"
                  />
                  
                  {event.status === MaintenanceEventStatus.Planned && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImportModalOpen(true)}
                      className="gap-1 text-xs w-full"
                    >
                      <Upload className="h-3 w-3" />
                      Import Inspections
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>



      {/* Unified Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Planned Inspections */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Planned Inspections</p>
                <p className="text-2xl font-bold">
                  {statistics?.total_planned_inspections || summary.data?.planned_count || 0}
                </p>
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

        {/* Unplanned Added */}
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

        {/* Total Completed */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Completed</p>
                <p className="text-2xl font-bold">
                  {statistics?.completed_inspections || summary.data?.total_completed || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                of {statistics?.total_planned_inspections || summary.data?.total_inspections || 0} total
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Overall Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">
                  {Math.round(statistics?.completion_percentage || summary.data?.overall_completion_rate || 0)}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <Progress 
                value={statistics?.completion_percentage || summary.data?.overall_completion_rate || 0} 
                className="w-full" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Inspections */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Inspections</p>
                <p className="text-2xl font-bold">{statistics?.active_inspections || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        {/* First-Time Inspections */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">First-Time Inspections</p>
                <p className="text-2xl font-bold">{statistics?.first_time_inspections_count || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Sub-Events Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sub-Events</p>
                <p className="text-2xl font-bold">
                  {subEventsBreakdown.data?.sub_events_analysis?.length || event.sub_events_count || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        {/* Equipment Status Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Equipment Status</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {statistics?.equipment_status_breakdown?.planned || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Planned</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {statistics?.equipment_status_breakdown?.under_inspection || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {statistics?.equipment_status_breakdown?.completed || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Done</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs - Limited Height */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
          <TabsTrigger value="backlog">Backlog</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sub-Events Breakdown - Limited to 5 items */}
            {subEventsBreakdown.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Sub-Events Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
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

            {/* Department Performance - Limited to 5 items */}
            {departmentPerformance.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Department Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
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
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          {timelineAnalysis.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline Adherence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          {inspectorsWorkload.data && inspectorsWorkload.data.inspector_workload?.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Inspector Workload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Inspector Workload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Workload Data Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Workload information will appear here once inspectors are assigned to inspections.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <p>Workload data includes:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Inspector assignment statistics</li>
                      <li>Time allocation per inspection</li>
                      <li>Average hours per inspector</li>
                      <li>Workload distribution analysis</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="backlog" className="space-y-4">
          {eventBacklog.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Inspection Backlog
                </CardTitle>
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
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          {equipmentCoverage.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Equipment Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </TabsContent>
      </Tabs>

      {/* Optional Notes Section */}
      {event.notes && (
        <Card className="shadow-sm border border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Event Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800">{event.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}