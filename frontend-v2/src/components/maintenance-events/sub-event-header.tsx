'use client'

import React from 'react'
import { format } from 'date-fns'
import { MaintenanceEvent, MaintenanceSubEvent, MaintenanceEventStatus } from '@/types/maintenance-events'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, User, FileText, Target, TrendingUp, Upload, Play, CheckCircle, Edit, X, Trash2, ClipboardList, AlertTriangle } from 'lucide-react'
import { InspectionImportModal } from './inspection-import-modal'
import { CreatePlanInspectionModal, CreateUnplannedInspectionModal } from './'
import { useUpdateMaintenanceSubEvent } from '@/hooks/use-maintenance-events'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { 
  getEventWorkflowState, 
  getStatusBadgeConfig, 
  getStatusDescription,
  canPerformInspectionAction 
} from '@/lib/utils/maintenance-event-state'

interface SubEventHeaderProps {
  subEvent: MaintenanceSubEvent
  parentEvent: MaintenanceEvent // Add parent event for inheritance
  className?: string
}

export function SubEventHeader({ subEvent, parentEvent, className }: SubEventHeaderProps) {
  const { user, isAdmin } = useAuth()
  const updateSubEventMutation = useUpdateMaintenanceSubEvent()
  const [importModalOpen, setImportModalOpen] = React.useState(false)

  // Create a hybrid event object for workflow state calculation
  // Sub-events inherit parent's approval and creation info but have their own status
  const hybridEventForWorkflow = {
    ...subEvent,
    approved_by: parentEvent.approved_by, // Inherit approval from parent
    created_by: parentEvent.created_by,   // Inherit creator from parent
    approval_date: parentEvent.approval_date,
    // Add workflow constraint: sub-event cannot be started if parent is not approved/started
    _parent_status: parentEvent.status
  } as any

  // Get workflow state for sub-event with inherited permissions
  const workflowState = getEventWorkflowState(hybridEventForWorkflow, isAdmin(), user?.username === parentEvent.created_by)
  const statusConfig = getStatusBadgeConfig(subEvent.status, parentEvent.approved_by)
  const statusDescription = getStatusDescription(subEvent.status, parentEvent.approved_by)

  const handleSubEventUpdated = () => {
    // Refresh data after sub-event update
  }

  const handleStartSubEvent = () => {
    // Check parent event state before allowing start
    if (parentEvent.status === MaintenanceEventStatus.Planned && !parentEvent.approved_by) {
      toast.error('Cannot start sub-event: Parent event is not approved yet')
      return
    }
    if (parentEvent.status === MaintenanceEventStatus.Planned) {
      toast.error('Cannot start sub-event: Parent event has not started yet')
      return
    }
    
    updateSubEventMutation.mutate({
      id: subEvent.id.toString(),
      data: {
        status: MaintenanceEventStatus.InProgress,
        actual_start_date: new Date().toISOString()
      }
    }, {
      onSuccess: () => {
        toast.success('Sub-event started successfully')
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to start sub-event')
      }
    })
  }

  const handleCompleteSubEvent = () => {
    // TODO: Add validation for incomplete child inspections
    // Before completing sub-event, check if all inspections under this sub-event are completed
    console.warn('⚠️ Sub-event completion validation needed: Check if all child inspections are completed')
    
    updateSubEventMutation.mutate({
      id: subEvent.id.toString(),
      data: {
        status: MaintenanceEventStatus.Completed,
        actual_end_date: new Date().toISOString(),
        completion_percentage: 100
      }
    }, {
      onSuccess: () => {
        toast.success('Sub-event completed successfully')
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to complete sub-event')
      }
    })
  }

  const handleStateChanged = (newStatus: MaintenanceEventStatus) => {
    updateSubEventMutation.mutate({
      id: subEvent.id.toString(),
      data: {
        status: newStatus
      }
    }, {
      onSuccess: () => {
        toast.success('Sub-event status updated successfully')
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to update sub-event status')
      }
    })
  }

  const handleEditSubEvent = () => {
    // Edit functionality will be handled by modal when implemented
    toast.info('Edit sub-event functionality - to be implemented')
  }

  const handleCancelSubEvent = () => {
    updateSubEventMutation.mutate({
      id: subEvent.id.toString(),
      data: {
        status: MaintenanceEventStatus.Cancelled
      }
    }, {
      onSuccess: () => {
        toast.success('Sub-event cancelled successfully')
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to cancel sub-event')
      }
    })
  }

  const handleDeleteSubEvent = () => {
    // Delete functionality will be handled by API when implemented
    toast.info('Delete sub-event functionality - to be implemented')
  }

  return (
    <Card className="border">
      <CardHeader className="pb-4">
        <div className="space-y-4">
          {/* Title Section - matching main event style */}
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-xl font-bold">
              {subEvent.title}
            </CardTitle>
            <Badge 
              variant={statusConfig.variant}
              className={`${statusConfig.className} text-sm px-3 py-1 font-medium`}
              title={statusDescription}
            >
              {subEvent.status}
            </Badge>
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg border">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{subEvent.sub_event_number}</span>
            </div>
            {subEvent.completion_percentage > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg border">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{subEvent.completion_percentage}%</span>
              </div>
            )}
          </div>
          
          {subEvent.description && (
            <div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">{subEvent.description}</p>
            </div>
          )}

          {/* Information and Actions Section - matching main event 4-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-3 border-t">
            {/* Planned Schedule */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Planned Schedule
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Start Date</div>
                    <div className="text-sm font-medium">
                      {format(new Date(subEvent.planned_start_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">End Date</div>
                    <div className="text-sm font-medium">
                      {format(new Date(subEvent.planned_end_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actual Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Actual Timeline
              </h4>
              {(subEvent.actual_start_date || subEvent.actual_end_date) ? (
                <div className="space-y-2">
                  {subEvent.actual_start_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Actual Start</div>
                        <div className="text-sm font-medium">
                          {format(new Date(subEvent.actual_start_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  )}
                  {subEvent.actual_end_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Actual End</div>
                        <div className="text-sm font-medium">
                          {format(new Date(subEvent.actual_end_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Timeline will be recorded</span>
                </div>
              )}
            </div>

            {/* Sub-Event Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                Sub-Event Information
              </h4>
              <div className="space-y-2">
                {subEvent.sub_type && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Type</div>
                      <div className="text-sm font-medium">{subEvent.sub_type}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Inspections</div>
                    <div className="text-sm font-medium">
                      {subEvent.inspections_count || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Sub-event specific actions with inheritance logic */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                Sub-Event Actions
              </h4>
              <div className="flex flex-col gap-2">
                {/* Show inheritance status and constraints */}
                {parentEvent.status === MaintenanceEventStatus.Planned && !parentEvent.approved_by && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    ⚠️ Parent event awaiting approval
                  </div>
                )}
                {parentEvent.status === MaintenanceEventStatus.Planned && parentEvent.approved_by && (
                  <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                    🔄 Parent event approved, waiting to start
                  </div>
                )}
                
                {/* Primary Action Buttons - Start/Complete */}
                <div className="flex flex-wrap gap-1.5">
                  {/* Start Action */}
                  {subEvent.status === MaintenanceEventStatus.Planned && (
                    <>
                      {parentEvent.status === MaintenanceEventStatus.InProgress ? (
                        <Button
                          size="sm"
                          onClick={handleStartSubEvent}
                          disabled={updateSubEventMutation.isPending}
                          className="gap-1 text-xs px-2 py-1 h-6"
                        >
                          <Play className="h-2.5 w-2.5" />
                          Start
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="gap-1 text-xs px-2 py-1 h-6 opacity-50"
                          title="Cannot start: Parent event must be in progress first"
                        >
                          <Clock className="h-2.5 w-2.5" />
                          Waiting
                        </Button>
                      )}
                    </>
                  )}
                  
                  {/* Complete Action */}
                  {subEvent.status === MaintenanceEventStatus.InProgress && (
                    <Button
                      size="sm"
                      onClick={handleCompleteSubEvent}
                      disabled={updateSubEventMutation.isPending}
                      className="gap-1 text-xs px-2 py-1 h-6"
                    >
                      <CheckCircle className="h-2.5 w-2.5" />
                      Complete
                    </Button>
                  )}
                  
                  {/* Edit Action - following main event logic */}
                  {workflowState.canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditSubEvent}
                      className="gap-1 text-xs px-2 py-1 h-6"
                    >
                      <Edit className="h-2.5 w-2.5" />
                      Edit
                    </Button>
                  )}
                </div>
                
                {/* Secondary Actions Row */}
                <div className="flex flex-wrap gap-1.5">
                  {/* Import Planned Inspections Button */}
                  {(subEvent.status === MaintenanceEventStatus.Planned) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImportModalOpen(true)}
                      className="gap-1 text-xs px-2 py-1 h-6"
                    >
                      <Upload className="h-2.5 w-2.5" />
                      Import Inspections
                    </Button>
                  )}
                  
                  {/* Inspection Buttons - Follow state management logic */}
                  {canPerformInspectionAction(parentEvent, 'plan').allowed && (
                    <CreatePlanInspectionModal 
                      parentEvent={parentEvent}
                      subEvent={subEvent}
                      onInspectionPlanned={handleSubEventUpdated}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-1 text-xs px-2 py-1 h-6">
                          <ClipboardList className="h-2.5 w-2.5" />
                          Plan
                        </Button>
                      }
                    />
                  )}
                  
                  {canPerformInspectionAction(parentEvent, 'create').allowed && 
                   subEvent.status === MaintenanceEventStatus.InProgress && (
                    <CreateUnplannedInspectionModal 
                      parentEvent={parentEvent}
                      subEvent={subEvent}
                      onInspectionCreated={handleSubEventUpdated}
                      trigger={
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 text-xs px-2 py-1 h-6 border-orange-200 text-orange-600"
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Unplanned
                        </Button>
                      }
                    />
                  )}
                </div>
                
                {/* Destructive Actions - following main event logic */}
                {(workflowState.canCancel || workflowState.canDelete) && (
                  <div className="pt-2 border-t space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground">Destructive Actions</div>
                    <div className="flex flex-wrap gap-1.5">
                      {/* Cancel Action */}
                      {workflowState.canCancel && subEvent.status !== MaintenanceEventStatus.Cancelled && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleCancelSubEvent}
                          disabled={updateSubEventMutation.isPending}
                          className="gap-1 text-xs px-2 py-1 h-6"
                        >
                          <X className="h-2.5 w-2.5" />
                          Cancel
                        </Button>
                      )}
                      
                      {/* Delete Action */}
                      {workflowState.canDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteSubEvent}
                          className="gap-1 text-xs px-2 py-1 h-6"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Status Messages */}
                {subEvent.status === MaintenanceEventStatus.Completed && (
                  <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-2 py-1 text-center">
                    ✅ Sub-event completed
                  </div>
                )}
                
                {subEvent.status === MaintenanceEventStatus.Cancelled && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 text-center">
                    ❌ Sub-event cancelled
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {/* Import Modal */}
      <InspectionImportModal
        eventId={parentEvent.id.toString()}
        subEventId={subEvent.id}
        isOpen={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={() => {
          // Refresh inspection data after import
          setImportModalOpen(false)
          handleSubEventUpdated()
          toast.success('Planned inspections imported successfully for sub-event')
        }}
      />
    </Card>
  )
}