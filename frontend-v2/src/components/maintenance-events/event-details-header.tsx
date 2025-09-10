'use client'

import React from 'react'
import { format } from 'date-fns'
import { MaintenanceEvent, MaintenanceEventStatus } from '@/types/maintenance-events'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, User, FileText, Play, CheckCircle, Plus, Check, Edit, Trash2, X, BarChart3, Target, TrendingUp, Activity, Upload } from 'lucide-react'
import { useStartMaintenanceEvent, useCompleteMaintenanceEvent, useUpdateMaintenanceEvent, useEventStatistics } from '@/hooks/use-maintenance-events'
import { useWorkflowPermissions } from '@/hooks/use-event-analytics'
import { useAuth } from '@/contexts/auth-context'
import { CreateSubEventModal, EditEventModal, DeleteEventDialog, CancelEventDialog, StateBasedActions, CreatePlanInspectionModal } from './'
import { InspectionImportModal } from './inspection-import-modal'
import { toast } from 'sonner'
import { 
  getEventWorkflowState, 
  getStatusBadgeConfig, 
  getStatusDescription,
  validateStateTransition,
  getNextRecommendedAction 
} from '@/lib/utils/maintenance-event-state'

interface EventDetailsHeaderProps {
  event: MaintenanceEvent
}

export function EventDetailsHeader({ event }: EventDetailsHeaderProps) {
  const { user, isAdmin } = useAuth()
  const startEventMutation = useStartMaintenanceEvent()
  const completeEventMutation = useCompleteMaintenanceEvent()
  const updateEventMutation = useUpdateMaintenanceEvent()
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  
  // Fetch event statistics
  const { data: statistics, isLoading: statsLoading } = useEventStatistics(event.id.toString())
  
  // Fetch workflow permissions for event type and permissions display
  const { data: workflowPermissions } = useWorkflowPermissions(event.id)

  // Get comprehensive workflow state using the new state management utility
  const workflowState = getEventWorkflowState(event, isAdmin(), user?.username === event.created_by)
  const statusConfig = getStatusBadgeConfig(event.status, event.approved_by)
  const statusDescription = getStatusDescription(event.status, event.approved_by)
  const nextAction = getNextRecommendedAction(event, isAdmin())

  const handleStartEvent = () => {
    // Validate state transition before starting
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
    // Validate state transition before completing
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
  
  const handleSubEventCreated = () => {
    // Refresh the page data or invalidate queries
    // This will be handled by the sub-event modal's mutation
  }

  const handleInspectionPlanned = () => {
    // Refresh the page data when an inspection is planned
    // This will be handled by the plan inspection modal's mutation
    toast.success('Inspection planned successfully')
  }

  const handleStateChanged = (newStatus: MaintenanceEventStatus) => {
    // Handle state change (reopen, revert, reactivate)
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

  // Use workflow state instead of individual boolean checks
  const {
    canEdit,
    canDelete,
    canCancel,
    canStart,
    canComplete,
    canApprove,
    canAddSubEvents,
    isInPlanMode
  } = workflowState

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Timeline and Event Info */}
      <Card className="border">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            {/* Title Section */}
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-2xl font-bold">
                {event.title}
              </CardTitle>
              <Badge 
                variant={statusConfig.variant}
                className={`${statusConfig.className} text-sm px-3 py-1 font-medium`}
                title={statusDescription}
              >
                {statusConfig.variant === 'default' ? 'Planned' : event.status}
              </Badge>
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg border">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{event.event_number}</span>
              </div>
            </div>
            
            {event.description && (
              <div>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">{event.description}</p>
              </div>
            )}

            {/* Timeline, Event Info, and Action Buttons Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-3 border-t">
              {/* Event Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                  Event Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Event Type</div>
                      <div className="text-sm font-medium flex items-center gap-2">
                        {event.event_type}
                        {workflowPermissions?.permissions && (
                          <Badge variant={workflowPermissions.permissions.is_complex_event ? "default" : "secondary"} className="text-xs">
                            {workflowPermissions.permissions.is_complex_event ? "Complex" : "Simple"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Created by</div>
                      <div className="text-sm font-medium">{event.created_by}</div>
                    </div>
                  </div>
                  {event.approved_by && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-xs text-muted-foreground">Approved by</div>
                        <div className="text-sm font-medium">{event.approved_by}</div>
                      </div>
                    </div>
                  )}
                  {/* Permissions Display */}
                  {workflowPermissions?.permissions && (
                    <>
                      <div className="flex items-center gap-2">
                        {workflowPermissions.permissions.can_create_sub_event ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <div className="text-xs text-muted-foreground">Sub-Events</div>
                          <div className="text-sm font-medium">
                            {workflowPermissions.permissions.can_create_sub_event ? "Can Create" : "Not Allowed"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {workflowPermissions.permissions.can_add_unplanned_inspection ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <div className="text-xs text-muted-foreground">Unplanned Inspections</div>
                          <div className="text-sm font-medium">
                            {workflowPermissions.permissions.can_add_unplanned_inspection ? "Can Add" : "Not Allowed"}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Timeline Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Timeline
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Planned Start</div>
                      <div className="text-sm font-medium">
                        {format(new Date(event.planned_start_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Planned End</div>
                      <div className="text-sm font-medium">
                        {format(new Date(event.planned_end_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  {event.actual_start_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Actual Start</div>
                        <div className="text-sm font-medium">
                          {format(new Date(event.actual_start_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  )}
                  {event.actual_end_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Actual End</div>
                        <div className="text-sm font-medium">
                          {format(new Date(event.actual_end_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  )}
                  {!event.actual_start_date && !event.actual_end_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Timeline will be recorded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  Actions
                </h4>
                <div className="flex flex-col gap-2">
                  <StateBasedActions
                    event={event}
                    onEventUpdated={handleSubEventCreated}
                    onStartEvent={handleStartEvent}
                    onCompleteEvent={handleCompleteEvent}
                    onApproveEvent={handleApproveEvent}
                    onInspectionPlanned={handleInspectionPlanned}
                    onStateChanged={handleStateChanged}
                    className="w-full"
                  />
                  
                  {/* Import Direct Inspections Button - available during planning phase */}
                  {(event.status === MaintenanceEventStatus.Planned) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImportModalOpen(true)}
                      className="gap-1 text-xs px-2 py-1 h-6 w-full"
                    >
                      <Upload className="h-2.5 w-2.5" />
                      Import Planned Inspections
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Dashboard-Style Summary Cards */}
      {!statsLoading && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Planned Inspections */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Planned Inspections
                  </p>
                  <p className="text-2xl font-bold">
                    {statistics.total_planned_inspections}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-blue-100">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Inspections */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Inspections
                  </p>
                  <p className="text-2xl font-bold">
                    {statistics.active_inspections}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-yellow-100">
                  <Activity className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Inspections */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Completed Inspections
                  </p>
                  <p className="text-2xl font-bold">
                    {statistics.completed_inspections}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Percentage */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-bold">
                    {Math.round(statistics.completion_percentage)}%
                  </p>
                </div>
                <div className="p-2 rounded-full bg-purple-100">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* First-Time Inspections */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    First-Time Inspections
                  </p>
                  <p className="text-2xl font-bold">
                    {statistics.first_time_inspections_count}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-orange-100">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sub-Events Count */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sub-Events
                  </p>
                  <p className="text-2xl font-bold">
                    {event.sub_events_count || 0}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-indigo-100">
                  <FileText className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Status Summary */}
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Equipment Status</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {statistics.equipment_status_breakdown.planned}
                    </div>
                    <div className="text-xs text-muted-foreground">Planned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {statistics.equipment_status_breakdown.under_inspection}
                    </div>
                    <div className="text-xs text-muted-foreground">Under Inspection</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {statistics.equipment_status_breakdown.completed}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Optional Notes Section */}
      {event.notes && (
        <Card className="shadow-sm border border-amber-200 bg-amber-50">
          <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-lg py-2 px-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <p className="text-slate-700 text-xs leading-relaxed">{event.notes}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Import Modal for Direct Inspections */}
      <InspectionImportModal
        eventId={event.id.toString()}
        isOpen={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={() => {
          // Refresh data after import
          handleSubEventCreated()
          toast.success('Planned inspections imported successfully')
        }}
      />
    </div>
  )
}
